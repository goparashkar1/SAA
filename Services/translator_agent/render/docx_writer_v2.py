"""
DOCX Writer v2 - Export IR v2 documents to DOCX format with layout preservation.

This module renders IR v2 documents back into Word while keeping structural
elements such as headers, footers, headings, lists, and tables intact.
"""

from typing import Optional, List
import io
import math
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.section import WD_SECTION_START
from docx.opc.constants import RELATIONSHIP_TYPE as RT
import docx.oxml.shared

try:
    from docx.enum.section import WD_SECTION  # type: ignore
except ImportError:  # Older python-docx releases
    WD_SECTION = None

if WD_SECTION is None:
    CONTINUOUS = 0
    NEW_PAGE = 2
else:
    CONTINUOUS = WD_SECTION_START.CONTINUOUS
    NEW_PAGE = WD_SECTION_START.NEW_PAGE

from models.ir_v2 import (
    Document as IRDocument,
    Header,
    Footer,
    Heading,
    Paragraph,
    ListItem,
    Table,
    Cell,
    Figure,
    Textbox,
    Span,
    Block,
    Section,  # Added missing import
)


def write_docx(
    source_ir: IRDocument,
    target_ir: Optional[IRDocument] = None,
    layout: str = "sequential",
) -> bytes:
    """
    Write IR v2 documents to DOCX format.

    Args:
        source_ir: Source document IR.
        target_ir: Target document IR (optional).
        layout: Layout mode ("sequential" or "side_by_side").
    """
    doc = Document()

    if source_ir.meta.title:
        doc.core_properties.title = source_ir.meta.title
    if source_ir.meta.author:
        doc.core_properties.author = source_ir.meta.author

    if layout == "sequential":
        _write_sequential_layout(doc, source_ir, target_ir)
    elif layout == "side_by_side":
        _write_side_by_side_layout(doc, source_ir, target_ir)
    else:
        raise ValueError(f"Unsupported layout: {layout}")

    bio = io.BytesIO()
    doc.save(bio)
    bio.seek(0)
    return bio.read()


def _write_sequential_layout(
    doc: Document,
    source_ir: IRDocument,
    target_ir: Optional[IRDocument],
) -> None:
    section_index = 0

    heading = doc.add_heading("Original Document", level=1)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    section_index = _write_document_content(doc, source_ir, section_index)

    doc.add_page_break()
    _get_or_add_section(doc, section_index, None, source_ir.meta.page_width, source_ir.meta.page_height)

    heading = doc.add_heading("Translated Document", level=1)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

    if target_ir:
        _write_document_content(doc, target_ir, section_index)
    else:
        _write_no_api_placeholder(doc)


def _write_side_by_side_layout(
    doc: Document,
    source_ir: IRDocument,
    target_ir: Optional[IRDocument],
) -> None:
    # Placeholder: reuse sequential export until a two-column layout is implemented.
    _write_sequential_layout(doc, source_ir, target_ir)


def _write_document_content(
    doc: Document,
    ir_doc: IRDocument,
    start_section_index: int = 0,
) -> int:
    section_index = start_section_index
    prev_width = ir_doc.meta.page_width
    prev_height = ir_doc.meta.page_height

    for section in ir_doc.sections:
        curr_width = section.page_width or prev_width
        curr_height = section.page_height or prev_height

        doc_section = _get_or_add_section(doc, section_index, section, prev_width, prev_height)
        doc_section.page_width = Inches(curr_width)
        doc_section.page_height = Inches(curr_height)

        if section.header:
            _populate_header(doc_section, section.header)

        if section.footer:
            _populate_footer(doc_section, section.footer)

        for block in section.blocks:
            _write_block(doc, block)

        prev_width = curr_width
        prev_height = curr_height
        section_index += 1

    return section_index


def _get_or_add_section(doc: Document, index: int, ir_section: Optional[Section], prev_width: float, prev_height: float):
    if index < len(doc.sections):
        return doc.sections[index]

    if ir_section is None:
        start_type = NEW_PAGE
    else:
        curr_width = ir_section.page_width or prev_width
        curr_height = ir_section.page_height or prev_height
        if math.isclose(curr_width, prev_width) and math.isclose(curr_height, prev_height):
            start_type = CONTINUOUS
        else:
            start_type = NEW_PAGE

    add_section = getattr(doc, "add_section", None)
    if callable(add_section):
        add_section(start_type)
    sections = doc.sections
    return sections[-1]


def _populate_header(doc_section, ir_header: Header) -> None:
    if ir_header.page_range == "first":
        doc_section.different_first_page_header_footer = True
        header_part = doc_section.first_page_header
    elif ir_header.page_range == "even":
        doc_section.even_and_odd_headers = True
        header_part = doc_section.even_page_header
    elif ir_header.page_range == "odd":
        doc_section.even_and_odd_headers = True
        header_part = doc_section.header
    else:  # "all" or None
        header_part = doc_section.header

    _reset_container(header_part)

    for block in ir_header.blocks:
        paragraph = header_part.add_paragraph()

        if isinstance(block, Heading):
            _apply_spans_to_paragraph(paragraph, block.spans)
            _set_style(paragraph, f"Heading {block.level}")
        elif isinstance(block, Paragraph):
            _apply_spans_to_paragraph(paragraph, block.spans)
        elif isinstance(block, ListItem):
            _apply_spans_to_paragraph(paragraph, block.spans)
            _set_style(paragraph, "List Number" if block.ordered else "List Bullet")
            if block.level > 0:
                paragraph.paragraph_format.left_indent = Inches(0.25 * block.level)

        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.space_after = Pt(3)


def _populate_footer(doc_section, ir_footer: Footer) -> None:
    if ir_footer.page_range == "first":
        doc_section.different_first_page_header_footer = True
        footer_part = doc_section.first_page_footer
    elif ir_footer.page_range == "even":
        doc_section.even_and_odd_headers = True
        footer_part = doc_section.even_page_footer
    elif ir_footer.page_range == "odd":
        doc_section.even_and_odd_headers = True
        footer_part = doc_section.footer
    else:  # "all" or None
        footer_part = doc_section.footer

    _reset_container(footer_part)

    for block in ir_footer.blocks:
        paragraph = footer_part.add_paragraph()

        if isinstance(block, Heading):
            _apply_spans_to_paragraph(paragraph, block.spans)
            _set_style(paragraph, f"Heading {block.level}")
        elif isinstance(block, Paragraph):
            _apply_spans_to_paragraph(paragraph, block.spans)
        elif isinstance(block, ListItem):
            _apply_spans_to_paragraph(paragraph, block.spans)
            _set_style(paragraph, "List Number" if block.ordered else "List Bullet")
            if block.level > 0:
                paragraph.paragraph_format.left_indent = Inches(0.25 * block.level)

        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.space_after = Pt(3)


def _reset_container(container) -> None:
    if container is None:
        return
    for paragraph in list(container.paragraphs):
        _delete_paragraph(paragraph)


def _delete_paragraph(paragraph) -> None:
    parent = paragraph._element.getparent()
    if parent is not None:
        parent.remove(paragraph._element)


def _clear_paragraph(paragraph) -> None:
    for run in list(paragraph.runs):
        paragraph._element.remove(run._element)
    paragraph.text = ""


def _write_block(doc: Document, block: Block) -> None:
    if isinstance(block, Heading):
        _write_heading(doc, block)
    elif isinstance(block, Paragraph):
        _write_paragraph(doc, block)
    elif isinstance(block, ListItem):
        _write_list_item(doc, block)
    elif isinstance(block, Table):
        _write_table(doc, block)
    elif isinstance(block, Figure):
        _write_figure(doc, block)
    elif isinstance(block, Textbox):
        _write_textbox(doc, block)


def _write_heading(doc: Document, heading: Heading) -> None:
    paragraph = doc.add_heading(level=heading.level)
    _apply_spans_to_paragraph(paragraph, heading.spans)
    _set_style(paragraph, f"Heading {heading.level}")
    paragraph.paragraph_format.space_after = Pt(12)


def _write_paragraph(doc: Document, paragraph_model: Paragraph) -> None:
    paragraph = doc.add_paragraph()
    _apply_spans_to_paragraph(paragraph, paragraph_model.spans)
    _set_style(paragraph, "Normal")
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(10)
    if paragraph_model.line_spacing:
        paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
        paragraph.paragraph_format.line_spacing = paragraph_model.line_spacing
    if paragraph_model.alignment:
        align_map = {
            "left": WD_ALIGN_PARAGRAPH.LEFT,
            "right": WD_ALIGN_PARAGRAPH.RIGHT,
            "center": WD_ALIGN_PARAGRAPH.CENTER,
            "justify": WD_ALIGN_PARAGRAPH.JUSTIFY
        }
        paragraph.alignment = align_map.get(paragraph_model.alignment)


def _write_list_item(doc: Document, list_item: ListItem) -> None:
    paragraph = doc.add_paragraph()
    _apply_spans_to_paragraph(paragraph, list_item.spans)
    _set_style(paragraph, "List Number" if list_item.ordered else "List Bullet")
    if list_item.level > 0:
        paragraph.paragraph_format.left_indent = Inches(0.25 * list_item.level)
    paragraph.paragraph_format.space_after = Pt(4)


def _write_table(doc: Document, table_model: Table) -> None:
    if not table_model.rows:
        return

    column_counts = [sum(cell.colspan or 1 for cell in row.cells) for row in table_model.rows if row.cells]
    if not column_counts:
        return
    column_count = max(column_counts)
    docx_table = doc.add_table(rows=len(table_model.rows), cols=column_count)
    docx_table.style = "Table Grid"
    docx_table.alignment = WD_TABLE_ALIGNMENT.CENTER

    for row_index, row in enumerate(table_model.rows):
        col_index = 0
        for cell in row.cells:
            target_cell = docx_table.cell(row_index, col_index)
            _write_cell_content(target_cell, cell)

            if cell.colspan and cell.colspan > 1:
                _merge_cells_horizontally(
                    docx_table, row_index, col_index, col_index + cell.colspan - 1
                )
            if cell.rowspan and cell.rowspan > 1:
                _merge_cells_vertically(
                    docx_table, row_index, col_index, row_index + cell.rowspan - 1
                )
            col_index += cell.colspan or 1

    docx_table.allow_autofit = True


def _write_cell_content(target_cell, cell_model: Cell) -> None:
    paragraphs = list(target_cell.paragraphs)
    if paragraphs:
        _clear_paragraph(paragraphs[0])
        base_paragraph = paragraphs[0]
    else:
        base_paragraph = target_cell.add_paragraph()

    for idx, block in enumerate(cell_model.blocks):
        paragraph = base_paragraph if idx == 0 else target_cell.add_paragraph()

        if isinstance(block, Paragraph):
            _apply_spans_to_paragraph(paragraph, block.spans)
        elif isinstance(block, Heading):
            _apply_spans_to_paragraph(paragraph, block.spans)
            _set_style(paragraph, f"Heading {block.level}")
        elif isinstance(block, ListItem):
            _apply_spans_to_paragraph(paragraph, block.spans)
            _set_style(paragraph, "List Number" if block.ordered else "List Bullet")
            if block.level > 0:
                paragraph.paragraph_format.left_indent = Inches(0.25 * block.level)


def _write_figure(doc: Document, figure: Figure) -> None:
    if figure.image_data:
        stream = io.BytesIO(figure.image_data)
        width = Inches(figure.width or 4)
        height = Inches(figure.height or 3)
        doc.add_picture(stream, width=width, height=height)
    else:
        paragraph = doc.add_paragraph()
        run = paragraph.add_run(f"[Image: {figure.image_id}]")
        run.italic = True
        paragraph.paragraph_format.space_after = Pt(6)

    if figure.caption:
        caption = doc.add_paragraph()
        _apply_spans_to_paragraph(caption, figure.caption.spans)
        caption.style = "Caption"
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER


def _write_textbox(doc: Document, textbox: Textbox) -> None:
    intro = doc.add_paragraph()
    _set_style(intro, "Intense Quote")
    intro.add_run("Textbox").bold = True

    for block in textbox.blocks:
        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.left_indent = Inches(0.25)

        if isinstance(block, Paragraph):
            _apply_spans_to_paragraph(paragraph, block.spans)
        elif isinstance(block, Heading):
            _apply_spans_to_paragraph(paragraph, block.spans)
            _set_style(paragraph, f"Heading {block.level}")
        elif isinstance(block, ListItem):
            _apply_spans_to_paragraph(paragraph, block.spans)
            _set_style(paragraph, "List Number" if block.ordered else "List Bullet")
            if block.level > 0:
                paragraph.paragraph_format.left_indent = Inches(0.25 * (block.level + 1))


def _apply_spans_to_paragraph(paragraph, spans: List[Span]) -> None:
    for span in spans:
        text = span.text or ""
        if not text:
            continue

        if span.link:
            run = _add_hyperlink(paragraph, span.link, text)
        else:
            run = paragraph.add_run(text)

        if span.bold:
            run.bold = True
        if span.italic:
            run.italic = True
        if span.underline:
            run.underline = True
        if span.font_size:
            run.font.size = Pt(span.font_size)
        if span.font_family:
            run.font.name = span.font_family
        if span.color and len(span.color) == 6:
            try:
                r = int(span.color[0:2], 16)
                g = int(span.color[2:4], 16)
                b = int(span.color[4:6], 16)
                run.font.color.rgb = RGBColor(r, g, b)
            except ValueError:
                pass


def _add_hyperlink(paragraph, url: str, text: str):
    part = paragraph.part
    r_id = part.relate_to(url, RT.HYPERLINK, is_external=True)

    hyperlink = docx.oxml.shared.OxmlElement('w:hyperlink')
    hyperlink.set(docx.oxml.shared.qn('r:id'), r_id)

    new_run = docx.oxml.shared.OxmlElement('w:r')
    rPr = docx.oxml.shared.OxmlElement('w:rPr')

    # Add blue color and underline by default for hyperlinks
    c = docx.oxml.shared.OxmlElement('w:color')
    c.set(docx.oxml.shared.qn('w:val'), "0000FF")
    rPr.append(c)

    u = docx.oxml.shared.OxmlElement('w:u')
    u.set(docx.oxml.shared.qn('w:val'), 'single')
    rPr.append(u)

    new_run.append(rPr)

    t = docx.oxml.shared.OxmlElement('w:t')
    t.text = text
    new_run.append(t)

    hyperlink.append(new_run)

    paragraph._p.append(hyperlink)

    # To apply additional styles, return the run
    return paragraph.runs[-1]


def _set_style(paragraph, style_name: str) -> None:
    if not style_name:
        return
    try:
        paragraph.style = style_name
    except (KeyError, ValueError, AttributeError):
        pass


def _write_no_api_placeholder(doc: Document) -> None:
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run("Translation unavailable - export contains original content only.")
    run.italic = True


def _merge_cells_horizontally(table, row: int, start_col: int, end_col: int) -> None:
    start_cell = table.cell(row, start_col)
    for col in range(start_col + 1, end_col + 1):
        start_cell = start_cell.merge(table.cell(row, col))


def _merge_cells_vertically(table, start_row: int, col: int, end_row: int) -> None:
    start_cell = table.cell(start_row, col)
    for row in range(start_row + 1, end_row + 1):
        start_cell = start_cell.merge(table.cell(row, col))


def write_docx_from_html(
    html: str,
    out_path: Path,
    *,
    assets_dir: Optional[Path] = None,
    rtl: bool = True,
) -> None:
    """
    Convenience wrapper for rendering Markdown-derived HTML into DOCX using the
    lightweight HTML pipeline.
    """
    from .docx_writer import html_to_docx

    html_to_docx(
        html,
        out_path=out_path,
        rtl_override=rtl,
        assets_dir=assets_dir,
    )
