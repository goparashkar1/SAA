import asyncio
import io
import logging
import os
import shutil
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Union, Literal

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, HttpUrl

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

try:  # pragma: no cover - environment-specific bootstrap
    from docling.engine import parse_to_markdown
except ModuleNotFoundError:  # pragma: no cover - fallback when not installed
    import importlib
    import sys

    project_root = Path(__file__).resolve().parents[2]
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    parse_to_markdown = importlib.import_module("docling.engine").parse_to_markdown
from translator_agent.utils.markdown_images import deinline_data_uri_images
from translator_agent.utils.markdown_translate import safe_translate_markdown
from translator_agent.render import html_renderer, docx_writer_v2, pdf_writer

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

logger = logging.getLogger("translator_agent.api")

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

# ---- docling endpoints ----

DOC_JOB_ROOT = Path(__file__).resolve().parent
NO_CREDIBLE_API = "NO credible API"


class DoclingTranslateRequest(BaseModel):
    job_id: str
    md: str
    lang_target: str = "fa"


class DoclingRenderRequest(BaseModel):
    job_id: str
    target: Literal["docx", "pdf"] = "docx"
    original_md: str
    translated_md: Optional[str] = None
    rtl: bool = True


def _create_docling_job_dirs() -> tuple[str, Path, Path, Path, Path]:
    job_id = f"job_{uuid.uuid4().hex}"
    job_dir = DOC_JOB_ROOT / job_id
    source_dir = job_dir / "source"
    assets_dir = job_dir / "assets"
    out_dir = job_dir / "out"
    for directory in (job_dir, source_dir, assets_dir, out_dir):
        directory.mkdir(parents=True, exist_ok=True)
    return job_id, job_dir, source_dir, assets_dir, out_dir


def _resolve_docling_job(job_id: str) -> Path:
    if not job_id or not job_id.startswith("job_"):
        raise HTTPException(status_code=404, detail="Job not found")
    job_dir = (DOC_JOB_ROOT / job_id).resolve()
    if not job_dir.exists() or DOC_JOB_ROOT not in job_dir.parents:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_dir


def _has_assets(assets_dir: Path) -> bool:
    if not assets_dir.exists():
        return False
    try:
        next(assets_dir.iterdir())
        return True
    except StopIteration:
        return False


@app.post("/docling/extract")
async def docling_extract(file: UploadFile = File(...)):
    job_id, job_dir, source_dir, assets_dir, _ = _create_docling_job_dirs()

    source_filename = file.filename or "uploaded_file"
    source_path = source_dir / source_filename

    with source_path.open("wb") as destination:
        shutil.copyfileobj(file.file, destination)
    await file.close()

    try:
        markdown_path = parse_to_markdown(source_path, job_dir)
    except Exception as exc:
        logger.exception("Docling parse failed for %s", job_id)
        raise HTTPException(status_code=500, detail="Docling parsing failed") from exc

    raw_markdown = markdown_path.read_text(encoding="utf-8")
    (job_dir / "content.original.md").write_text(raw_markdown, encoding="utf-8")

    cleaned_markdown = deinline_data_uri_images(raw_markdown, assets_dir)
    (job_dir / "content.cleaned.md").write_text(cleaned_markdown, encoding="utf-8")

    logger.info("Docling extract completed for %s", job_id)
    return {
        "job_id": job_id,
        "original_md": cleaned_markdown,
        "assets_base": f"/docling/assets/{job_id}/",
    }


@app.get("/docling/assets/{job_id}/{asset_path:path}")
def docling_asset(job_id: str, asset_path: str):
    job_dir = _resolve_docling_job(job_id)
    assets_dir = job_dir / "assets"
    if not asset_path:
        raise HTTPException(status_code=404, detail="Asset not found")
    candidate = (assets_dir / asset_path).resolve()
    if (
        not candidate.exists()
        or not candidate.is_file()
        or assets_dir.resolve() not in candidate.parents
    ):
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(candidate)


@app.post("/docling/translate")
async def docling_translate(payload: DoclingTranslateRequest):
    job_dir = _resolve_docling_job(payload.job_id)
    edited_path = job_dir / "content.edited.md"
    edited_path.write_text(payload.md, encoding="utf-8")

    if not _check_credible_api():
        logger.info("Docling translate skipped due to missing API credentials for %s", payload.job_id)
        return {"translated_md": None, "error": NO_CREDIBLE_API}

    translated_md, error = await safe_translate_markdown(
        payload.md,
        payload.lang_target,
        timeout_s=20,
    )

    if error or not translated_md:
        return {"translated_md": None, "error": error or NO_CREDIBLE_API}

    (job_dir / "content.translated.md").write_text(translated_md, encoding="utf-8")
    logger.info("Docling translate completed for %s", payload.job_id)
    return {"translated_md": translated_md, "error": None}


@app.post("/docling/render")
async def docling_render(payload: DoclingRenderRequest):
    job_dir = _resolve_docling_job(payload.job_id)
    assets_dir = job_dir / "assets"
    out_dir = job_dir / "out"
    out_dir.mkdir(parents=True, exist_ok=True)
    (job_dir / "content.latest.md").write_text(payload.original_md, encoding="utf-8")

    target = payload.target.lower()
    if target not in {"docx", "pdf"}:
        raise HTTPException(status_code=400, detail="target must be 'docx' or 'pdf'")

    lang_code = "fa" if payload.rtl else "en"
    original_body = html_renderer.md_to_html(
        payload.original_md,
        rtl=payload.rtl,
        lang=lang_code,
        wrap=False,
    )
    if payload.translated_md:
        translated_body = html_renderer.md_to_html(
            payload.translated_md,
            rtl=payload.rtl,
            lang=lang_code,
            wrap=False,
        )
    else:
        translated_body = "<p><strong>NO credible API</strong></p>"

    combined_body = (
        "<section>"
        "<h1>Original</h1>"
        f"{original_body}"
        "</section>"
        "<hr/>"
        "<section>"
        "<h1>Translated</h1>"
        f"{translated_body}"
        "</section>"
    )
    combined_html = html_renderer.wrap_html_document(
        combined_body,
        rtl=payload.rtl,
        lang=lang_code,
    )

    assets_for_writer = assets_dir if _has_assets(assets_dir) else None
    if target == "docx":
        output_path = out_dir / "output.docx"
        docx_writer_v2.write_docx_from_html(
            combined_html,
            out_path=output_path,
            assets_dir=assets_for_writer,
            rtl=payload.rtl,
        )
    else:
        output_path = out_dir / "output.pdf"
        pdf_writer.write_pdf_from_html(
            combined_html,
            out_path=output_path,
            assets_dir=assets_for_writer,
        )

    logger.info("Docling render completed for %s (%s)", payload.job_id, target)
    return {
        "download": f"/docling/download/{payload.job_id}/{output_path.name}",
    }


@app.get("/docling/download/{job_id}/{filename}")
def download_docling_output(job_id: str, filename: str):
    job_dir = _resolve_docling_job(job_id)
    candidate = Path(filename)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise HTTPException(status_code=400, detail="invalid filename")
    output_path = (job_dir / "out" / candidate).resolve()
    out_dir = (job_dir / "out").resolve()
    if not output_path.exists() or not output_path.is_file() or out_dir not in output_path.parents:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(output_path)

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
