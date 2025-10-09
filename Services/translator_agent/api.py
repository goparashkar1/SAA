from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, HttpUrl
from pathlib import Path
from typing import Optional, Dict, List, Union
import io, time, uuid, os

from ingestion.url_loader import fetch_url
from ingestion.file_loader import read_file, sniff_type
from extract.html_article import extract_main_article_html
from extract.pdf_parser import pdf_to_html_like
from extract.docx_parser import docx_to_html
from ir.builder import html_to_ir
from nl.lang_detect import detect_lang_doc
from translate.translate_ir import translate_ir_to_fa
from render.html_renderer import ir_to_html
from render.docx_writer import html_to_docx

# IR v2 imports - with error handling to prevent API startup failure
IRV2_AVAILABLE = False
try:
    from extract.docx_parser_v2 import parse_docx
    from extract.pdf_parser_v2 import parse_pdf
    from models.ir_v2 import Document, ParseResult, GlossaryEntry
    IRV2_AVAILABLE = True
    print("✓ IR v2 modules loaded successfully")
except ImportError as e:
    print(f"⚠️ IR v2 modules not available: {e}")
    IRV2_AVAILABLE = False
except Exception as e:
    print(f"⚠️ IR v2 modules failed to load: {e}")
    IRV2_AVAILABLE = False
from config import settings

app = FastAPI(title="Translator Agent API", version="1.0.0")

# Allow your Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- helpers ----

def _job_dir(base: Optional[Path] = None) -> Path:
    base = base or Path.cwd()
    p = base / f"job_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    p.mkdir(parents=True, exist_ok=True)
    return p

def _extract_html_from_blob(path: str, blob: bytes) -> str:
    kind = sniff_type(path)
    if kind == "html":
        return blob.decode("utf-8", errors="ignore")
    if kind == "pdf":
        return pdf_to_html_like(blob)
    if kind == "docx":
        return docx_to_html(blob)
    raise HTTPException(status_code=400, detail=f"Unsupported file type: {kind}")

def _extract_html_from_url(url: str) -> str:
    html = fetch_url(url)
    return extract_main_article_html(html, base_url=url)

def _check_credible_api() -> bool:
    """Check if we have a credible API key and it's reachable."""
    # Simple check for now - just check if API key exists
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return False
    
    # In a full implementation, we'd make a test call to verify the API works
    # For now, just check if the key exists
    return len(api_key.strip()) > 0

def _create_no_api_placeholder(source_ir: Document) -> Document:
    """Create a target IR with a single 'no credible API' message."""
    from models.ir_v2 import DocumentMeta, Section, Paragraph, Span, Heading
    
    # Create a simple placeholder document with just one message
    placeholder_blocks = [
        Heading(level=1, spans=[Span(text="Translation Not Available")]),
        Paragraph(spans=[Span(text="Translation service is not available. Please configure API credentials to enable translation.")]),
        Paragraph(spans=[Span(text="Original document structure has been preserved above.")])
    ]
    
    # Create placeholder sections - just one section with the message
    placeholder_sections = [Section(
        index=0,
        blocks=placeholder_blocks
    )]
    
    # Create target document
    target_meta = DocumentMeta(
        title=f"Translation of {source_ir.meta.title or 'Document'}",
        author=source_ir.meta.author,
        created=source_ir.meta.created,
        modified=source_ir.meta.modified,
        pages=source_ir.meta.pages,
        word_count=source_ir.meta.word_count
    )
    
    return Document(meta=target_meta, sections=placeholder_sections)

# ---- schemas ----

class ExtractUrlRequest(BaseModel):
    url: HttpUrl

class ExtractResponse(BaseModel):
    content_html: str
    lang: str

class ExtractIRv2Response(BaseModel):
    ir: Document
    lang: str
    stats: Dict

class TranslateRequest(BaseModel):
    content_html: str
    model: Optional[str] = None
    glossary: Optional[Dict[str, str]] = None

class TranslateResponse(BaseModel):
    translated_html: str
    src_lang: str

class ReportRequest(BaseModel):
    original_html: str
    translated_html: Optional[str] = ""
    filename: Optional[str] = "translation_report.docx"

class ReportIRv2Request(BaseModel):
    source_ir: Document
    target_ir: Optional[Document] = None
    layout: str = "sequential"  # "sequential" or "side_by_side"
    format: str = "docx"
    glossary: Optional[List[GlossaryEntry]] = None
    model: Optional[str] = None
    filename: Optional[str] = "translation_report.docx"

# ---- endpoints ----

@app.get("/health")
def health():
    return {
        "ok": True, 
        "model": settings.model,
        "irv2_available": IRV2_AVAILABLE
    }

@app.post("/extract/url", response_model=ExtractResponse)
def extract_from_url(req: ExtractUrlRequest):
    article_html = _extract_html_from_url(str(req.url))
    ir = html_to_ir(article_html)
    lang = detect_lang_doc(ir)
    # Return normalized HTML (not the raw page) so UI edits a clean structure
    content_html = ir_to_html(ir)
    return ExtractResponse(content_html=content_html, lang=lang)

@app.post("/extract/file", response_model=Union[ExtractResponse, ExtractIRv2Response])
async def extract_from_file(file: UploadFile = File(...), mode: str = Query("legacy", description="Mode: 'legacy' or 'irv2'")):
    blob = await file.read()
    
    if mode == "irv2" and IRV2_AVAILABLE:
        # Use IR v2 parsers
        file_type = sniff_type(file.filename)
        if file_type == "docx":
            document, lang, stats = parse_docx(blob)
            return ExtractIRv2Response(ir=document, lang=lang, stats=stats)
        elif file_type == "pdf":
            document, lang, stats = parse_pdf(blob)
            return ExtractIRv2Response(ir=document, lang=lang, stats=stats)
        else:
            raise HTTPException(status_code=400, detail=f"IR v2 mode not supported for file type: {file_type}")
    elif mode == "irv2" and not IRV2_AVAILABLE:
        raise HTTPException(status_code=503, detail="IR v2 mode not available - missing dependencies")
    else:
        # Legacy mode
        article_html = _extract_html_from_blob(file.filename, blob)
        ir = html_to_ir(article_html)
        lang = detect_lang_doc(ir)
        content_html = ir_to_html(ir)
        return ExtractResponse(content_html=content_html, lang=lang)

@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    model = req.model or settings.model
    ir = html_to_ir(req.content_html)
    src_lang = detect_lang_doc(ir)
    if src_lang == "fa":
        # Already Persian; return as-is
        translated_ir = ir
    else:
        translated_ir = translate_ir_to_fa(ir, model=model, glossary=req.glossary)
    translated_html = ir_to_html(translated_ir)
    return TranslateResponse(translated_html=translated_html, src_lang=src_lang)

@app.post("/report")
def generate_report(req: ReportRequest):
    # Compose a simple document. Include translation section only when available.
    sections = ["<h1>Original</h1>", req.original_html or ""]
    translated_html = (req.translated_html or "").strip()
    if translated_html:
        sections.extend(["<hr/>", "<h1>Translation (FA)</h1>", translated_html])
    composed_html = "".join(sections)

    job = _job_dir()
    out_path = job / (req.filename if req.filename.endswith(".docx") else req.filename + ".docx")
    html_to_docx(composed_html, out_path)

    # Stream back as attachment so the browser shows a Save dialog
    bio = io.BytesIO(out_path.read_bytes())
    headers = {
        "Content-Disposition": f'attachment; filename="{out_path.name}"'
    }
    return StreamingResponse(bio, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers=headers)

@app.post("/report/irv2")
def generate_report_irv2(req: ReportIRv2Request):
    """Generate report using IR v2 with optional translation."""
    if not IRV2_AVAILABLE:
        raise HTTPException(status_code=503, detail="IR v2 mode not available - missing dependencies")
    
    from render.docx_writer_v2 import write_docx
    
    # Check if we have a credible API
    has_credible_api = _check_credible_api()
    
    if not has_credible_api or req.model == "none" or not req.target_ir:
        # Create target IR with "no credible API" placeholder
        target_ir = _create_no_api_placeholder(req.source_ir)
    else:
        target_ir = req.target_ir
    
    # Generate DOCX
    docx_bytes = write_docx(req.source_ir, target_ir, req.layout)
    
    # Stream back as attachment
    bio = io.BytesIO(docx_bytes)
    headers = {
        "Content-Disposition": f'attachment; filename="{req.filename}"'
    }
    return StreamingResponse(bio, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers=headers)
