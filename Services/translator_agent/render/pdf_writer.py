from __future__ import annotations

from pathlib import Path


def html_to_pdf(html: str, out_path):
    from weasyprint import HTML

    HTML(string=html).write_pdf(str(out_path))


def write_pdf_from_html(html: str, out_path: Path, *, assets_dir: Path | None = None) -> None:
    """
    Render HTML into a PDF file while keeping relative asset references working.
    """
    from weasyprint import HTML

    base_url = str(assets_dir) if assets_dir else None
    HTML(string=html, base_url=base_url).write_pdf(str(out_path))
