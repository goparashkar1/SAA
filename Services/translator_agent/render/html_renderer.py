from ir.schema import Block, InlineSpan
import re

# Detect any RTL script char (Hebrew/Arabic/Persian ranges)
_RTL_RE = re.compile(r"[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")

def _is_rtl(text: str) -> bool:
    return bool(_RTL_RE.search(text or ""))

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
