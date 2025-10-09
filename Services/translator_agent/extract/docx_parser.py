# translator_agent/extract/docx_parser.py
import io
import mammoth

def docx_to_html(blob: bytes) -> str:
    """
    Convert a DOCX (bytes) to simple HTML.
    Primary path: Mammoth (great at mapping Word styles to semantic HTML).
    Fallback: python-docx -> naive HTML if Mammoth fails.
    """
    # 1) Mammoth needs a file-like object (seek/read)
    try:
        with io.BytesIO(blob) as fp:
            result = mammoth.convert_to_html(fp)
        html = result.value
        if html and html.strip():
            return html
    except Exception:
        pass

    # 2) Fallback: python-docx (very basic HTML, keeps paragraphs and headings)
    try:
        from docx import Document
        from html import escape

        with io.BytesIO(blob) as fp:
            doc = Document(fp)

        parts = []
        # Simple heuristic: treat built-in heading styles as <hN>, others as <p>
        for p in doc.paragraphs:
            text = escape(p.text or "")
            style = (p.style.name or "").lower()
            if "heading 1" in style:
                parts.append(f"<h1>{text}</h1>")
            elif "heading 2" in style:
                parts.append(f"<h2>{text}</h2>")
            elif "heading 3" in style:
                parts.append(f"<h3>{text}</h3>")
            elif "heading 4" in style:
                parts.append(f"<h4>{text}</h4>")
            elif "heading 5" in style:
                parts.append(f"<h5>{text}</h5>")
            elif "heading 6" in style:
                parts.append(f"<h6>{text}</h6>")
            else:
                parts.append(f"<p>{text}</p>")
        return "\n".join(parts)
    except Exception:
        # Last resort: return an empty HTML shell
        return "<p>(Unable to parse DOCX content)</p>"
