from ir.schema import Block, InlineSpan
from markdown_it import MarkdownIt
import re

# Detect any RTL script char (Hebrew/Arabic/Persian ranges)
_RTL_RE = re.compile(r"[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")
_IMG_SRC_RE = re.compile(r'(<img[^>]+src=")(assets/[^"]+)(")', re.IGNORECASE)
_BASE_STYLE = (
    "body{font-family:sans-serif;line-height:1.6;margin:1.5rem;}"
    "img{max-width:100%;height:auto;}"
    "table{border-collapse:collapse;width:100%;}"
    "th,td{border:1px solid #ccc;padding:0.4rem;}"
)


def _is_rtl(text: str) -> bool:
    return bool(_RTL_RE.search(text or ""))


def _wrap_html_document(body: str, *, rtl: bool, lang: str) -> str:
    direction = "rtl" if rtl else "ltr"
    return (
        "<!doctype html>"
        f'<html lang="{lang or "en"}" dir="{direction}">'
        "<head><meta charset=\"utf-8\">"
        f"<style>{_BASE_STYLE}</style>"
        "</head><body>"
        f"{body}"
        "</body></html>"
    )


def _prefix_image_sources(body: str, prefix: str) -> str:
    prefix = prefix.rstrip("/") + "/"

    def _repl(match: re.Match) -> str:
        rel_path = match.group(2)
        if not rel_path.startswith("assets/"):
            return match.group(0)
        trimmed = rel_path.split("/", 1)[-1] if "/" in rel_path else rel_path
        return f'{match.group(1)}{prefix}{trimmed}{match.group(3)}'

    return _IMG_SRC_RE.sub(_repl, body)


def _spans_to_html(spans: list[InlineSpan]) -> str:
    out = []
    for s in spans:
        text = s.get("text","").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
        if s.get("code"):
            out.append(f"<code>{text}</code>")
        elif s.get("bold") and s.get("italic"):
            out.append(f"<strong><em>{text}</em></strong>")
        elif s.get("bold"):
            out.append(f"<strong>{text}</strong>")
        elif s.get("italic"):
            out.append(f"<em>{text}</em>")
        elif href := s.get("href"):
            out.append(f"<a href=\"{href}\">{text}</a>")
        else:
            out.append(text)
    return "".join(out)


def ir_to_html(ir: dict) -> str:
    # Use dir=auto globally, and set per-block dir based on content
    parts = ['<!doctype html><html lang="fa" dir="auto"><head><meta charset="utf-8"><style>body{font-family:sans-serif;line-height:1.8} h1,h2,h3,h4,h5,h6{margin:0.6em 0} p{margin:0.6em 0} ul,ol{margin:0.6em 1.2em} blockquote{border-inline-start:3px solid #ccc;padding-inline-start:0.8em;color:#444}</style></head><body>']
    for b in ir.get("blocks", []):
        t = b["type"]
        if t == "heading":
            lvl = b.get("level",2)
            text = _spans_to_html(b.get('spans', []))
            dir_attr = ' dir="rtl"' if _is_rtl(text) else ' dir="ltr"'
            parts.append(f"<h{lvl}{dir_attr}>{text}</h{lvl}>")
        elif t == "paragraph":
            text = _spans_to_html(b.get('spans', []))
            dir_attr = ' dir="rtl"' if _is_rtl(text) else ' dir="ltr"'
            parts.append(f"<p{dir_attr}>{text}</p>")
        elif t == "blockquote":
            text = _spans_to_html(b.get('spans', []))
            dir_attr = ' dir="rtl"' if _is_rtl(text) else ' dir="ltr"'
            parts.append(f"<blockquote{dir_attr}>{text}</blockquote>")
        elif t == "list":
            tag = "ol" if b.get("attrs",{}).get("ordered") else "ul"
            parts.append(f"<{tag}>")
            for li in b.get("children", []):
                text = _spans_to_html(li.get('spans', []))
                dir_attr = ' dir="rtl"' if _is_rtl(text) else ' dir="ltr"'
                parts.append(f"<li{dir_attr}>{text}</li>")
            parts.append(f"</{tag}>")
        elif t == "codeblock":
            # Code blocks are generally LTR
            parts.append(f"<pre dir=\"ltr\"><code>{_spans_to_html(b.get('spans', []))}</code></pre>")
    parts.append("</body></html>")
    return "".join(parts)


_MD = MarkdownIt("commonmark", {"html": False, "linkify": True}).enable("table").enable("strikethrough")


def md_to_html(
    md_text: str,
    *,
    rtl: bool | None = None,
    lang: str = "en",
    wrap: bool = True,
    image_prefix: str | None = None,
) -> str:
    """Render Markdown to HTML, optionally returning only the rendered body."""
    rtl = _is_rtl(md_text) if rtl is None else rtl
    body = _MD.render(md_text or "")
    if image_prefix:
        body = _prefix_image_sources(body, image_prefix)
    if not wrap:
        return body
    return _wrap_html_document(body, rtl=rtl, lang=lang)


def wrap_html_document(body: str, *, rtl: bool = False, lang: str = "en") -> str:
    """Wrap a raw HTML body fragment into a standalone HTML document."""
    return _wrap_html_document(body, rtl=rtl, lang=lang)
