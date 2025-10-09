# translator_agent/pipeline.py

from pathlib import Path
from typing import Optional, Dict, Any
import json, time, uuid

from ingestion.url_loader import fetch_url
from ingestion.file_loader import read_file, sniff_type
from extract.html_article import extract_main_article_html
from extract.pdf_parser import pdf_to_html_like
from extract.docx_parser import docx_to_html
from ir.builder import html_to_ir, text_blocks_to_ir
from nl.lang_detect import detect_lang_doc
from translate.translate_ir import translate_ir_to_fa
from render.html_renderer import ir_to_html
from render.docx_writer import html_to_docx
from render.pdf_writer import html_to_pdf
from config import settings


def _save_intermediate(base_dir: Path, name: str, data: Any) -> Path:
    p = base_dir / f"{name}.json"
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return p


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


def _prepend_notice(ir: dict, message: str) -> dict:
    """Prepend a small 'Translation section' notice and then keep original extracted content."""
    notice_blocks = [
        {
            "id": _new_id(),
            "type": "heading",
            "level": 2,
            "spans": [{"text": "Translation section"}],
            "children": [],
            "attrs": {},
        },
        {
            "id": _new_id(),
            "type": "paragraph",
            "level": 0,
            "spans": [{"text": message}],
            "children": [],
            "attrs": {},
        },
    ]
    return {
        "blocks": notice_blocks + ir.get("blocks", []),
        "attrs": ir.get("attrs", {"lang": "auto", "dir": "auto"}),
    }


def pipeline_url(url: str, *, out_format: str, model: str, glossary: Optional[Dict[str, str]], dest_dir: Path):
    """Pipeline for URL input.

    - When out_format == "terminal": return plain text content (no files created).
    - When out_format in {"docx", "pdf", "html"}: write file and return a manifest dict.
    """

    html = fetch_url(url)
    article_html = extract_main_article_html(html, base_url=url)
    ir = html_to_ir(article_html)

    # ---- SAFE TRANSLATION BRANCH WITH FALLBACK ----
    lang = detect_lang_doc(ir)
    if lang == "fa":
        translated_ir = ir  # already Persian; no translation
    else:
        if not settings.openai_api_key:
            translated_ir = _prepend_notice(ir, "API key not valid")
        else:
            try:
                translated_ir = translate_ir_to_fa(ir, model=model, glossary=glossary)
            except Exception:
                translated_ir = _prepend_notice(ir, "API key not valid")
    # -----------------------------------------------

    html_out = ir_to_html(translated_ir)
    out_fmt = out_format.lower()

    # Terminal: return plain text, do not create files/folders
    if out_fmt == "terminal":
        plain_text = html_to_docx(html_out, out_path=None)  # returns plain text, does not save
        return plain_text

    # File outputs: create a job dir and write the requested format
    job_dir = dest_dir / ("job_" + str(int(time.time())))
    job_dir.mkdir(parents=True, exist_ok=True)

    out_name = "output.fa"
    if out_fmt == "docx":
        out_path = job_dir / f"{out_name}.docx"
        html_to_docx(html_out, out_path)
    elif out_fmt == "pdf":
        out_path = job_dir / f"{out_name}.pdf"
        html_to_pdf(html_out, out_path)
    elif out_fmt == "html":
        out_path = job_dir / f"{out_name}.html"
        out_path.write_text(html_out, encoding="utf-8")
    else:
        # Default to HTML if an unknown non-terminal format is provided
        out_path = job_dir / f"{out_name}.html"
        out_path.write_text(html_out, encoding="utf-8")

    _save_intermediate(job_dir, "ir", translated_ir)
    manifest = {
        "source": {"type": "url", "url": url},
        "out_format": out_format,
        "model": model,
        "dest": str(out_path),
    }
    _save_intermediate(job_dir, "manifest", manifest)
    return manifest


def pipeline_file(path: str, *, out_format: str, model: str, glossary: Optional[Dict[str, str]], dest_dir: Path):
    """Pipeline for local file input.

    - When out_format == "terminal": return plain text content (no files created).
    - When out_format in {"docx", "pdf", "html"}: write file and return a manifest dict.
    """

    blob = read_file(path)
    kind = sniff_type(path)
    if kind == "html":
        html = blob.decode("utf-8", errors="ignore")
        article_html = html
        ir = html_to_ir(article_html)
    elif kind == "pdf":
        article_html = pdf_to_html_like(blob)
        # pdf_to_html_like returns HTML; convert to IR
        ir = html_to_ir(article_html)
    elif kind == "docx":
        article_html = docx_to_html(blob)
        ir = html_to_ir(article_html)
    else:
        raise ValueError(f"Unsupported file type: {kind}")

    # ---- SAFE TRANSLATION BRANCH WITH FALLBACK ----
    lang = detect_lang_doc(ir)
    if lang == "fa":
        translated_ir = ir
    else:
        if not settings.openai_api_key:
            translated_ir = _prepend_notice(ir, "API key not valid")
        else:
            try:
                translated_ir = translate_ir_to_fa(ir, model=model, glossary=glossary)
            except Exception:
                translated_ir = _prepend_notice(ir, "API key not valid")
    # -----------------------------------------------

    html_out = ir_to_html(translated_ir)
    out_fmt = out_format.lower()

    # Terminal: return plain text, do not create files/folders
    if out_fmt == "terminal":
        plain_text = html_to_docx(html_out, out_path=None)  # returns plain text, does not save
        return plain_text

    # File outputs: create a job dir and write the requested format
    job_dir = dest_dir / ("job_" + str(int(time.time())))
    job_dir.mkdir(parents=True, exist_ok=True)

    out_name = Path(path).stem + ".fa"
    if out_fmt == "docx":
        out_path = job_dir / f"{out_name}.docx"
        html_to_docx(html_out, out_path)
    elif out_fmt == "pdf":
        out_path = job_dir / f"{out_name}.pdf"
        html_to_pdf(html_out, out_path)
    elif out_fmt == "html":
        out_path = job_dir / f"{out_name}.html"
        out_path.write_text(html_out, encoding="utf-8")
    else:
        # Default to HTML if an unknown non-terminal format is provided
        out_path = job_dir / f"{out_name}.html"
        out_path.write_text(html_out, encoding="utf-8")

    _save_intermediate(job_dir, "ir", translated_ir)
    manifest = {
        "source": {"type": "file", "path": str(Path(path).resolve())},
        "out_format": out_format,
        "model": model,
        "dest": str(out_path),
    }
    _save_intermediate(job_dir, "manifest", manifest)
    return manifest
