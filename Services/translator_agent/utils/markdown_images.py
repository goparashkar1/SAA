from __future__ import annotations

import base64
import mimetypes
import re
import uuid
from pathlib import Path


DATA_IMG_RE = re.compile(
    r"!\[(?P<alt>.*?)\]\("
    r"(?P<uri>data:(?P<mime>image\/[a-zA-Z0-9+\-.]+);base64,(?P<b64>[A-Za-z0-9+/=\n\r]+))"
    r"\)(?P<attrs>\{\s*[^}]*\})?",
    flags=re.IGNORECASE | re.MULTILINE,
)


def _guess_extension(mime: str) -> str:
    ext = mimetypes.guess_extension(mime)
    if ext:
        return ext
    subtype = mime.split("/", 1)[-1]
    return f".{subtype}"


def deinline_data_uri_images(md_text: str, assets_dir: Path) -> str:
    """
    Replace data URI images in Markdown with on-disk assets.

    Parameters
    ----------
    md_text:
        Markdown text that may contain inlined base64 images.
    assets_dir:
        Directory where decoded images should be stored.

    Returns
    -------
    str
        Markdown with image references rewritten to point at ``assets/<file>``.
    """
    assets_dir.mkdir(parents=True, exist_ok=True)

    def _replace(match: re.Match) -> str:
        mime = match.group("mime")
        b64_data = match.group("b64").replace("\n", "").replace("\r", "")
        ext = _guess_extension(mime)
        filename = f"img_{uuid.uuid4().hex}{ext}"
        binary = base64.b64decode(b64_data)
        (assets_dir / filename).write_bytes(binary)
        attrs = match.group("attrs") or ""
        return f"![{match.group('alt')}]({assets_dir.name}/{filename}){attrs}"

    return DATA_IMG_RE.sub(_replace, md_text)

