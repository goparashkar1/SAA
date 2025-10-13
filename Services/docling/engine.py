from __future__ import annotations

import logging
from pathlib import Path


logger = logging.getLogger(__name__)


def parse_to_markdown(src_path: Path, work_dir: Path) -> Path:
    """
    Convert the incoming document into Markdown using Docling.

    Parameters
    ----------
    src_path:
        Absolute path to the uploaded source file.
    work_dir:
        Job-specific working directory. The resulting Markdown will be written
        to ``work_dir / "content.md"``.

    Returns
    -------
    Path
        Location of the generated Markdown file.
    """
    try:
        from docling.document_converter import DocumentConverter
    except ImportError as exc:  # pragma: no cover - import guard
        raise RuntimeError(
            "Docling is not installed. Ensure `docling` is present in the runtime environment."
        ) from exc

    work_dir.mkdir(parents=True, exist_ok=True)
    md_path = work_dir / "content.md"

    logger.info("Docling converting %s -> %s", src_path.name, md_path.name)
    converter = DocumentConverter()
    try:
        result = converter.convert(str(src_path))
    except Exception as exc:  # pragma: no cover - docling runtime failure guard
        logger.exception("Docling converter raised an exception for %s", src_path.name)
        raise RuntimeError(f"Docling conversion failed: {exc}") from exc

    document = getattr(result, "document", None)
    if document is None:
        raise RuntimeError("Docling conversion returned no document payload.")

    if hasattr(document, "export_markdown"):
        markdown = document.export_markdown()
    elif hasattr(document, "export_to_markdown"):
        markdown = document.export_to_markdown()
    else:  # pragma: no cover - future proofing
        raise RuntimeError(
            "Docling document does not expose a Markdown export method."
        )
    md_path.write_text(markdown, encoding="utf-8")

    # Persist any extracted assets if Docling provides them.
    assets_dir = work_dir / "assets"
    extracted_assets = getattr(result, "artifacts", None) or getattr(result, "assets", None)
    if extracted_assets:
        assets_dir.mkdir(parents=True, exist_ok=True)
        for asset in extracted_assets:
            try:
                target_path = assets_dir / Path(asset.path).name
                target_path.write_bytes(asset.content)
            except Exception:  # pragma: no cover - best effort
                logger.debug("Skipped persisting Docling asset: %s", asset, exc_info=True)

    return md_path
