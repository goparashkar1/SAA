# translator_agent/render/docx_writer.py
from docx import Document
from docx.shared import Pt
from docx.oxml.shared import OxmlElement, qn
from bs4 import BeautifulSoup
import re

# Detect any RTL script char (Hebrew/Arabic/Persian ranges)
_RTL_RE = re.compile(r"[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")

def _is_rtl(text: str) -> bool:
    return bool(_RTL_RE.search(text or ""))

def _apply_rtl(paragraph):
    pPr = paragraph._element.get_or_add_pPr()
    bidi = OxmlElement('w:bidi')
    bidi.set(qn('w:val'), "1")
    pPr.append(bidi)

def _add_para(doc: Document, text: str, style: str | None = None, force_rtl: bool | None = None):
    p = doc.add_paragraph()
    if style:
        try:
            p.style = style
        except Exception:
            pass  # style may not exist; ignore

    p.add_run(text)

    # Decide direction: explicit override > heuristic
    rtl = force_rtl if force_rtl is not None else _is_rtl(text)
    if rtl:
        _apply_rtl(p)
    # else: leave as default LTR

def html_to_docx(html: str, out_path=None, text_only: bool = False):
    """
    Convert our simple HTML to a DOCX, applying RTL only to Farsi/Arabic/Hebrew paragraphs,
    and keeping English paragraphs LTR.
    """
    soup = BeautifulSoup(html, "lxml")
    doc = Document()

    # Set a readable default font; Word will still render English fine with this.
    normal = doc.styles['Normal']
    normal.font.name = "Vazirmatn"
    normal.font.size = Pt(11)

    body = soup.body or soup
    all_texts = []
    for el in body.find_all(recursive=False):
        name = el.name
        if not name:
            continue

        if name in [f"h{i}" for i in range(1, 7)]:
            text = el.get_text()
            # Headings: direction by content
            _add_para(doc, text, style=None)  # Word headings in python-docx are tricky; use bold run if you prefer
            # Make it bold manually:
            doc.paragraphs[-1].runs[0].bold = True
            # Apply RTL if needed
            if _is_rtl(text):
                _apply_rtl(doc.paragraphs[-1])
            all_texts.append(text)

        elif name == "p":
            text = el.get_text()
            _add_para(doc, text)
            all_texts.append(text)

        elif name in ["ul", "ol"]:
            ordered = (name == "ol")
            for li in el.find_all("li", recursive=False):
                text = li.get_text()
                style = "List Number" if ordered else "List Bullet"
                _add_para(doc, text, style=style)
                all_texts.append(text)

        elif name == "blockquote":
            text = el.get_text()
            _add_para(doc, text)
            all_texts.append(text)

        elif name == "pre":
            text = el.get_text()
            # Code blocks usually LTR; keep heuristic anyway
            _add_para(doc, text)
            all_texts.append(text)

        else:
            # Fallback: treat unknown blocks as paragraphs
            text = el.get_text()
            if text.strip():
                _add_para(doc, text)
                all_texts.append(text)

    # Always build a plain-text version from the HTML content
    plain_text = "\n".join(all_texts)

    # Save to DOCX if requested (when an out_path is provided and not in text-only mode)
    if out_path is not None and not text_only:
        doc.save(str(out_path))

    return plain_text
