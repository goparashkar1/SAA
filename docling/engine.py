from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Iterable, Tuple


logger = logging.getLogger(__name__)


def parse_to_markdown(src_path: Path, work_dir: Path) -> Tuple[Path, Path]:
    """
    Convert the incoming document into Markdown using Docling and persist both
    the Markdown and the structured layout JSON representation.

    Parameters
    ----------
    src_path:
        Absolute path to the uploaded source file.
    work_dir:
        Job-specific working directory. The resulting Markdown will be written
        to ``work_dir / "content.md"`` and layout metadata to
        ``work_dir / "layout.json"``.

    Returns
    -------
    Tuple[Path, Path]
        Locations of the generated Markdown and layout JSON files.
    """
    try:
        from docling.document_converter import DocumentConverter
    except ImportError as exc:  # pragma: no cover - import guard
        raise RuntimeError(
            "Docling is not installed. Ensure `docling` is present in the runtime environment."
        ) from exc

    work_dir.mkdir(parents=True, exist_ok=True)
    md_path = work_dir / "content.md"
    layout_path = work_dir / "layout.json"

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

    layout_payload = _extract_layout_payload(document, result)
    layout_text = json.dumps(layout_payload, ensure_ascii=False, indent=2)
    layout_path.write_text(layout_text, encoding="utf-8")

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

    return md_path, layout_path


def _extract_layout_payload(document: Any, conversion_result: Any) -> dict[str, Any]:
    """
    Attempt to capture Docling's structured layout export, with graceful
    fallback to a light-weight serialization when no direct JSON export is
    provided by the SDK version in use.
    """
    # Prefer explicit layout export APIs if available.
    export_methods = (
        "export_layout_json",
        "export_layout_dict",
        "export_layout",
        "to_layout_json",
        "to_dict",
        "as_dict",
        "export_json",
        "to_json",
    )
    for method_name in export_methods:
        exporter = getattr(document, method_name, None)
        if not callable(exporter):
            continue
        try:
            candidate = exporter()
        except TypeError:
            # Retry with common keyword for dict conversion.
            try:
                candidate = exporter(as_dict=True)
            except Exception:  # pragma: no cover - defensive
                continue
        except Exception:  # pragma: no cover - defensive
            continue
        normalized = _normalize_layout_object(candidate)
        if normalized:
            return normalized

    # Converter or result objects occasionally expose layout metadata as attributes.
    for attr_name in ("layout", "layout_json", "layout_dict", "structured_output"):
        candidate = getattr(conversion_result, attr_name, None)
        normalized = _normalize_layout_object(candidate)
        if normalized:
            return normalized

    # Fallback: craft a minimal JSON structure from document pages/blocks.
    logger.warning("Docling document did not expose a layout export API; falling back to synthesized layout JSON.")
    return _synthesise_layout(document)


def _normalize_layout_object(obj: Any) -> dict[str, Any] | None:
    if obj is None:
        return None
    if isinstance(obj, (str, bytes, bytearray)):
        try:
            return json.loads(obj)
        except json.JSONDecodeError:  # pragma: no cover - defensive
            return None
    if isinstance(obj, dict):
        return obj
    if hasattr(obj, "model_dump"):
        try:
            return obj.model_dump()
        except Exception:  # pragma: no cover - defensive
            pass
    if hasattr(obj, "dict"):
        try:
            return obj.dict()
        except Exception:  # pragma: no cover - defensive
            pass
    if hasattr(obj, "to_dict"):
        try:
            return obj.to_dict()
        except Exception:  # pragma: no cover - defensive
            pass
    if hasattr(obj, "as_dict"):
        try:
            return obj.as_dict()
        except Exception:  # pragma: no cover - defensive
            pass
    return None


def _synthesise_layout(document: Any) -> dict[str, Any]:
    pages_payload: list[dict[str, Any]] = []
    pages: Iterable[Any] | None = getattr(document, "pages", None)
    if not pages:
        return {"pages": []}

    for index, page in enumerate(pages, start=1):
        meta = getattr(page, "meta", None) or getattr(page, "metadata", None)
        margins = getattr(meta, "margins", None) or getattr(page, "margins", None) or {}
        page_dict: dict[str, Any] = {
            "number": getattr(page, "number", index),
            "columns": getattr(page, "columns", getattr(meta, "columns", 1)),
            "width_pt": getattr(page, "width_pt", getattr(meta, "width_pt", None)),
            "height_pt": getattr(page, "height_pt", getattr(meta, "height_pt", None)),
            "margins_pt": {
                "left": getattr(margins, "left", getattr(margins, "l", 72)),
                "right": getattr(margins, "right", getattr(margins, "r", 72)),
                "top": getattr(margins, "top", getattr(margins, "t", 72)),
                "bottom": getattr(margins, "bottom", getattr(margins, "b", 72)),
            },
            "blocks": [],
        }

        blocks = (
            getattr(page, "blocks", None)
            or getattr(page, "elements", None)
            or getattr(page, "content", None)
            or []
        )
        for block in blocks:
            page_dict["blocks"].append(_serialize_block(block))
        pages_payload.append(page_dict)

    return {"pages": pages_payload}


def _serialize_block(block: Any) -> dict[str, Any]:
    block_type = getattr(block, "type", None) or getattr(block, "kind", None)
    if block_type is None:
        block_type = block.__class__.__name__.lower()

    text = getattr(block, "text", None)
    if text is None and hasattr(block, "spans"):
        spans = getattr(block, "spans")
        try:
            text = " ".join(span.text for span in spans if getattr(span, "text", None))
        except Exception:  # pragma: no cover - defensive
            text = None
    if text is None and hasattr(block, "items"):
        try:
            text = " ".join(str(item) for item in block.items if item)
        except Exception:  # pragma: no cover - defensive
            text = None

    bbox = getattr(block, "bbox", None) or getattr(block, "bounding_box", None)
    if bbox:
        bbox_dict = {
            "x": getattr(bbox, "x", getattr(bbox, "left", None)),
            "y": getattr(bbox, "y", getattr(bbox, "top", None)),
            "w": getattr(bbox, "w", getattr(bbox, "width", None)),
            "h": getattr(bbox, "h", getattr(bbox, "height", None)),
        }
    else:
        bbox_dict = None

    payload: dict[str, Any] = {
        "type": block_type,
    }
    if text:
        payload["text"] = text
    if bbox_dict:
        payload["bbox"] = bbox_dict
    if hasattr(block, "src"):
        payload["src"] = getattr(block, "src")
    if hasattr(block, "caption"):
        payload["caption"] = getattr(block, "caption")
    if hasattr(block, "rows"):
        try:
            payload["rows"] = [list(row) for row in block.rows]
        except Exception:  # pragma: no cover - defensive
            pass
    if hasattr(block, "items"):
        try:
            payload["items"] = [getattr(item, "text", str(item)) for item in block.items]
        except Exception:  # pragma: no cover - defensive
            pass
    if hasattr(block, "level"):
        payload["level"] = getattr(block, "level")
    if hasattr(block, "ordered"):
        payload["ordered"] = getattr(block, "ordered")
    if hasattr(block, "role"):
        payload["role"] = getattr(block, "role")

    return payload
