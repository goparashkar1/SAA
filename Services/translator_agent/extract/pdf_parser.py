from typing import List, Union
import fitz  # PyMuPDF

def pdf_to_html_like(blob: bytes) -> str:
    # Very simple HTML-like wrapper that keeps paragraphs per page
    doc = fitz.open(stream=blob, filetype="pdf")
    parts = []
    for page in doc:
        text = page.get_text("text")
        # naive paragraph split
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        parts.append("<h2>Page {}</h2>".format(page.number + 1))
        for p in paras:
            parts.append("<p>{}</p>".format(p.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")))
    return "\n".join(parts)
