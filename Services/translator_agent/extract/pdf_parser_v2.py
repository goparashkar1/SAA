"""
Layout-aware PDF parser v2.

This module provides a comprehensive PDF parser that preserves document structure,
formatting, and layout information in the IR v2 format.
"""

import io
from typing import List, Dict, Optional, Tuple, Set
import fitz  # PyMuPDF
from collections import defaultdict, Counter

from models.ir_v2 import (
    Document as IRDocument,
    DocumentMeta,
    Section,
    Header,
    Footer,
    Heading,
    Paragraph,
    ListItem,
    Table,
    Row,
    Cell,
    Figure,
    Textbox,
    Span,
    Anchor,
    TranslationStats,
    ParseResult,
    Block
)


def parse_pdf(file_bytes: bytes) -> Tuple[IRDocument, str, Dict]:
    """
    Parse a PDF file and return IR v2 document, language, and stats.
    
    Args:
        file_bytes: Raw PDF file bytes
        
    Returns:
        Tuple of (Document, language, stats_dict)
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    
    # Initialize stats
    stats = TranslationStats()
    
    # Parse document metadata
    meta = _extract_metadata(doc)
    
    # Parse pages and extract content
    sections = _parse_pages(doc, stats)
    
    # Create document
    ir_doc = IRDocument(meta=meta, sections=sections)
    
    # Detect language
    lang = _detect_language(ir_doc)
    
    # Convert stats to dict
    stats_dict = stats.dict()
    
    doc.close()
    return ir_doc, lang, stats_dict


def _extract_metadata(doc: fitz.Document) -> DocumentMeta:
    """Extract PDF metadata."""
    metadata = doc.metadata
    
    # Count pages
    page_count = doc.page_count
    
    # Count words (rough estimate)
    word_count = 0
    for page in doc:
        text = page.get_text()
        word_count += len(text.split())
    
    return DocumentMeta(
        title=metadata.get('title') or None,
        author=metadata.get('author') or None,
        created=metadata.get('creationDate') or None,
        modified=metadata.get('modDate') or None,
        pages=page_count,
        word_count=word_count
    )


def _parse_pages(doc: fitz.Document, stats: TranslationStats) -> List[Section]:
    """Parse PDF pages into sections with improved structure detection."""
    all_blocks = []
    header_footer_candidates = defaultdict(list)
    
    # First pass: extract all text blocks with better structure detection
    for page_num in range(doc.page_count):
        page = doc[page_num]
        
        # Extract text blocks with improved parsing
        page_blocks = _extract_page_blocks_improved(page, page_num + 1)
        all_blocks.extend(page_blocks)
        
        # Identify potential headers/footers
        _identify_header_footer_candidates(page, page_num + 1, header_footer_candidates)
    
    # Second pass: identify actual headers/footers
    headers, footers = _identify_headers_footers(header_footer_candidates)
    
    # Third pass: organize content into sections with better structure
    sections = _organize_into_sections_improved(all_blocks, headers, footers, stats)
    
    return sections


def _extract_page_blocks_improved(page: fitz.Page, page_num: int) -> List[Block]:
    """Extract blocks from a single page with simple, reliable text extraction."""
    blocks = []
    
    # Get all text in reading order - simple and reliable
    text_blocks = page.get_text("blocks")
    
    for block in text_blocks:
        if len(block) >= 5:  # Valid text block
            x0, y0, x1, y1, text, block_no, block_type = block[:7]
            
            if not text.strip():
                continue
            
            # Simple formatting based on text characteristics
            formatted_blocks = _format_text_simple(text, page_num)
            blocks.extend(formatted_blocks)
    
    # Extract images and place them appropriately
    image_list = page.get_images()
    for img_index, img in enumerate(image_list):
        image_id = f"img_{page_num}_{img_index}"
        figure = Figure(
            image_id=image_id,
            anchor=Anchor(page=page_num, x=0.5, y=0.5)
        )
        blocks.append(figure)
    
    return blocks


def _format_text_simple(text: str, page_num: int) -> List[Block]:
    """Format text using simple, reliable heuristics."""
    blocks = []
    text = text.strip()
    
    if not text:
        return blocks
    
    # Split into lines for analysis
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    for line in lines:
        if not line:
            continue
            
        # Simple heading detection
        if _is_simple_heading(line):
            level = _get_simple_heading_level(line)
            blocks.append(Heading(level=level, spans=[Span(text=line)]))
        # Simple list detection
        elif _is_simple_list_item(line):
            level = _get_simple_list_level(line)
            ordered = _is_simple_ordered_list(line)
            blocks.append(ListItem(level=level, ordered=ordered, spans=[Span(text=line)]))
        # Regular paragraph
        else:
            blocks.append(Paragraph(spans=[Span(text=line)]))
    
    return blocks


def _is_simple_heading(text: str) -> bool:
    """Simple heading detection based on common patterns."""
    # Check for obvious heading patterns
    heading_patterns = [
        text.startswith(('Chapter', 'Section', 'Part', 'Appendix', 'CHAPTER', 'SECTION')),
        text.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')),
        text.startswith(('I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.')),
        text.startswith(('A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'I.', 'J.')),
        text.startswith(('a)', 'b)', 'c)', 'd)', 'e)', 'f)', 'g)', 'h)', 'i)', 'j)')),
        text.startswith(('(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)')),
        # Short lines that could be headings
        len(text) < 80 and not text.endswith('.') and not text.endswith(','),
        # All caps short lines
        text.isupper() and len(text) < 100,
    ]
    
    return any(heading_patterns)


def _get_simple_heading_level(text: str) -> int:
    """Simple heading level detection."""
    if text.startswith(('Chapter', 'CHAPTER', 'Section', 'SECTION')):
        return 1
    elif text.startswith(('1.', '2.', '3.', '4.', '5.')):
        return 1
    elif text.startswith(('I.', 'II.', 'III.', 'IV.', 'V.')):
        return 2
    elif text.startswith(('A.', 'B.', 'C.', 'D.', 'E.')):
        return 3
    elif text.startswith(('a)', 'b)', 'c)', 'd)', 'e)')):
        return 4
    elif text.startswith(('(1)', '(2)', '(3)', '(4)', '(5)')):
        return 4
    else:
        # Default based on length
        if len(text) < 30:
            return 1
        elif len(text) < 50:
            return 2
        else:
            return 3


def _is_simple_list_item(text: str) -> bool:
    """Simple list item detection."""
    list_patterns = [
        text.startswith(('•', '-', '*', '◦', '▪', '▫')),
        text.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')),
        text.startswith(('a)', 'b)', 'c)', 'd)', 'e)', 'f)', 'g)', 'h)', 'i)', 'j)')),
        text.startswith(('(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)', '(h)', '(i)', '(j)')),
        text.startswith(('(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)')),
    ]
    
    return any(list_patterns)


def _get_simple_list_level(text: str) -> int:
    """Simple list level detection."""
    if text.startswith(('    ', '\t')):
        return 1
    elif text.startswith(('        ', '\t\t')):
        return 2
    else:
        return 0


def _is_simple_ordered_list(text: str) -> bool:
    """Simple ordered list detection."""
    return (text[0].isdigit() and '.' in text[:5]) or \
           text.startswith(('a)', 'b)', 'c)', 'i)', 'ii)', 'iii)'))


def _extract_page_blocks(page: fitz.Page, page_num: int) -> List[Block]:
    """Legacy function - kept for compatibility."""
    return _extract_page_blocks_improved(page, page_num)


def _classify_block_improved(text: str, block: dict, page: fitz.Page, x0: float, y0: float, x1: float, y1: float) -> dict:
    """Improved block classification with better structure detection."""
    text_clean = text.strip()
    
    # Get font information from the block
    font_size = 12  # Default
    font_name = ""
    
    if "lines" in block and block["lines"]:
        first_line = block["lines"][0]
        if "spans" in first_line and first_line["spans"]:
            first_span = first_line["spans"][0]
            font_size = first_span.get("size", 12)
            font_name = first_span.get("font", "")
    
    # Calculate block characteristics
    block_width = x1 - x0
    block_height = y1 - y0
    text_length = len(text_clean)
    
    # Heading detection with improved heuristics
    if _is_heading_improved(text_clean, font_size, block_width, text_length):
        level = _get_heading_level_improved(text_clean, font_size, block_width)
        return {"type": "heading", "level": level}
    
    # List item detection
    if _is_list_item_improved(text_clean):
        level = _get_list_level_improved(text_clean)
        ordered = _is_ordered_list_improved(text_clean)
        return {"type": "list_item", "level": level, "ordered": ordered}
    
    # Table detection
    if _is_table_improved(block, text_clean):
        return {"type": "table"}
    
    # Default to paragraph
    return {"type": "paragraph"}


def _is_heading_improved(text: str, font_size: float, block_width: float, text_length: int) -> bool:
    """Improved heading detection."""
    # Check for common heading patterns
    heading_patterns = [
        text.startswith(('Chapter', 'Section', 'Part', 'Appendix', 'Chapter', 'CHAPTER')),
        text.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')),
        text.startswith(('I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.')),
        text.startswith(('A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'I.', 'J.')),
        text.startswith(('a)', 'b)', 'c)', 'd)', 'e)', 'f)', 'g)', 'h)', 'i)', 'j)')),
        text.startswith(('(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)')),
    ]
    
    # Check patterns
    if any(heading_patterns):
        return True
    
    # Check font size (larger than normal text)
    if font_size > 14:
        return True
    
    # Check text characteristics
    if (text.isupper() and text_length < 100) or \
       (text_length < 50 and not text.endswith('.') and not text.endswith(',')):
        return True
    
    # Check if it's a short line that could be a heading
    if text_length < 80 and not text.endswith('.') and not text.endswith(','):
        return True
    
    return False


def _get_heading_level_improved(text: str, font_size: float, block_width: float) -> int:
    """Determine heading level with improved logic."""
    # Level 1: Very large font or chapter/section indicators
    if (font_size > 18) or \
       text.startswith(('Chapter', 'CHAPTER', 'Section', 'SECTION')) or \
       text.startswith(('1.', '2.', '3.', '4.', '5.')):
        return 1
    
    # Level 2: Large font or roman numerals
    if (font_size > 16) or \
       text.startswith(('I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.')):
        return 2
    
    # Level 3: Medium font or letter indicators
    if (font_size > 14) or \
       text.startswith(('A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'I.', 'J.')):
        return 3
    
    # Level 4: Small headings
    if font_size > 12:
        return 4
    
    # Default to level 3
    return 3


def _is_list_item_improved(text: str) -> bool:
    """Improved list item detection."""
    # Check for various list patterns
    list_patterns = [
        text.startswith(('•', '-', '*', '◦', '▪', '▫')),
        text.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')),
        text.startswith(('a)', 'b)', 'c)', 'd)', 'e)', 'f)', 'g)', 'h)', 'i)', 'j)')),
        text.startswith(('(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)', '(h)', '(i)', '(j)')),
        text.startswith(('(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)')),
    ]
    
    return any(list_patterns)


def _get_list_level_improved(text: str) -> int:
    """Determine list nesting level."""
    # Count indentation or nesting indicators
    if text.startswith(('    ', '\t')):
        return 1
    elif text.startswith(('        ', '\t\t')):
        return 2
    else:
        return 0


def _is_ordered_list_improved(text: str) -> bool:
    """Check if list item is ordered."""
    return (text[0].isdigit() and '.' in text[:5]) or \
           text.startswith(('a)', 'b)', 'c)', 'i)', 'ii)', 'iii)'))


def _is_table_improved(block: dict, text: str) -> bool:
    """Improved table detection."""
    # Look for tabular patterns in the text
    if '\t' in text or '  ' in text:
        return True
    
    # Check if block has multiple lines that could be table rows
    if "lines" in block and len(block["lines"]) > 1:
        return True
    
    return False


def _extract_table_from_block(block: dict, page_num: int) -> List[Block]:
    """Extract table from a block."""
    # This is a simplified implementation
    # In a full implementation, you'd parse the table structure properly
    return []


def _is_heading(text: str, page: fitz.Page, x0: float, y0: float, x1: float, y1: float) -> bool:
    """Legacy function - kept for compatibility."""
    return _is_heading_improved(text, 12, x1 - x0, len(text))


def _get_heading_level(text: str, page: fitz.Page, x0: float, y0: float, x1: float, y1: float) -> int:
    """Determine heading level."""
    text_clean = text.strip()
    
    # Simple heuristics
    if text_clean.isupper() and len(text_clean) < 50:
        return 1
    elif text_clean.startswith(('Chapter', 'Section')):
        return 1
    elif text_clean.startswith(('Part', 'Appendix')):
        return 2
    elif len(text_clean) < 30:
        return 2
    else:
        return 3


def _is_list_item(text: str) -> bool:
    """Check if text is a list item."""
    text_clean = text.strip()
    
    # Check for common list patterns
    return (text_clean.startswith(('•', '-', '*', '◦', '▪')) or
            text_clean[0].isdigit() and '.' in text_clean[:5] or
            text_clean.startswith(('a)', 'b)', 'c)', 'i)', 'ii)', 'iii)')))


def _get_list_level(text: str) -> int:
    """Determine list nesting level."""
    text_clean = text.strip()
    
    # Simple indentation-based level detection
    if text_clean.startswith(('  ', '\t')):
        return 1
    elif text_clean.startswith(('    ', '\t\t')):
        return 2
    else:
        return 0


def _is_ordered_list(text: str) -> bool:
    """Check if list item is ordered."""
    text_clean = text.strip()
    return (text_clean[0].isdigit() and '.' in text_clean[:5]) or \
           text_clean.startswith(('a)', 'b)', 'c)', 'i)', 'ii)', 'iii)'))


def _identify_header_footer_candidates(page: fitz.Page, page_num: int, candidates: Dict[str, List]):
    """Identify potential header/footer text."""
    # Get text blocks
    blocks = page.get_text("blocks")
    page_height = page.rect.height
    
    for block in blocks:
        if len(block) >= 5:
            x0, y0, x1, y1, text = block[:5]
            
            if not text.strip():
                continue
            
            # Check if in header region (top 10% of page)
            if y0 < page_height * 0.1:
                candidates['header'].append((text.strip(), page_num))
            
            # Check if in footer region (bottom 10% of page)
            elif y1 > page_height * 0.9:
                candidates['footer'].append((text.strip(), page_num))


def _identify_headers_footers(candidates: Dict[str, List]) -> Tuple[Dict[int, str], Dict[int, str]]:
    """Identify actual headers and footers by finding repeated content."""
    headers = {}
    footers = {}
    
    # Find repeated header content
    header_texts = [text for text, _ in candidates['header']]
    header_counter = Counter(header_texts)
    
    for text, count in header_counter.items():
        if count > 1:  # Appears on multiple pages
            # Find which pages have this header
            for text_candidate, page_num in candidates['header']:
                if text_candidate == text:
                    headers[page_num] = text
    
    # Find repeated footer content
    footer_texts = [text for text, _ in candidates['footer']]
    footer_counter = Counter(footer_texts)
    
    for text, count in footer_counter.items():
        if count > 1:  # Appears on multiple pages
            # Find which pages have this footer
            for text_candidate, page_num in candidates['footer']:
                if text_candidate == text:
                    footers[page_num] = text
    
    return headers, footers


def _organize_into_sections_improved(blocks: List[Block], headers: Dict[int, str], 
                                   footers: Dict[int, str], stats: TranslationStats) -> List[Section]:
    """Organize blocks into sections with improved structure."""
    # Group blocks by logical sections based on headings
    sections = []
    current_section_blocks = []
    section_index = 0
    
    for block in blocks:
        # If we encounter a heading, start a new section
        if isinstance(block, Heading) and block.level <= 2:
            # Save previous section if it has content
            if current_section_blocks:
                sections.append(Section(
                    index=section_index,
                    blocks=current_section_blocks
                ))
                section_index += 1
                current_section_blocks = []
        
        current_section_blocks.append(block)
    
    # Add the last section
    if current_section_blocks:
        sections.append(Section(
            index=section_index,
            blocks=current_section_blocks
        ))
    
    # If no sections were created, create one with all blocks
    if not sections:
        sections = [Section(index=0, blocks=blocks)]
    
    # Update stats
    stats.paragraphs = len([b for b in blocks if isinstance(b, Paragraph)])
    stats.tables = len([b for b in blocks if isinstance(b, Table)])
    stats.figures = len([b for b in blocks if isinstance(b, Figure)])
    stats.sections = len(sections)
    
    return sections


def _organize_into_sections(blocks: List[Block], headers: Dict[int, str], 
                           footers: Dict[int, str], stats: TranslationStats) -> List[Section]:
    """Legacy function - kept for compatibility."""
    return _organize_into_sections_improved(blocks, headers, footers, stats)


def _extract_tables(page: fitz.Page, page_num: int) -> List[Table]:
    """Extract tables from page (basic implementation)."""
    tables = []
    
    # Get text blocks
    blocks = page.get_text("blocks")
    
    # Simple table detection: look for aligned columns
    # This is a basic implementation - a full implementation would use
    # more sophisticated table detection algorithms
    
    # Group blocks by y-coordinate to find rows
    rows_by_y = defaultdict(list)
    for block in blocks:
        if len(block) >= 5:
            x0, y0, x1, y1, text = block[:5]
            if text.strip():
                rows_by_y[y0].append((x0, x1, text.strip()))
    
    # If we have multiple columns, it might be a table
    if len(rows_by_y) > 1:
        table_rows = []
        for y, row_blocks in sorted(rows_by_y.items()):
            if len(row_blocks) > 1:  # Multiple columns
                cells = []
                for x0, x1, text in sorted(row_blocks):
                    cell_blocks = [Paragraph(spans=[Span(text=text)])]
                    cells.append(Cell(blocks=cell_blocks))
                
                if cells:
                    table_rows.append(Row(cells=cells))
        
        if table_rows:
            tables.append(Table(rows=table_rows))
    
    return tables


def _detect_language(doc: IRDocument) -> str:
    """Detect document language (simple heuristic)."""
    # Extract all text
    all_text = []
    for section in doc.sections:
        for block in section.blocks:
            if isinstance(block, (Paragraph, Heading, ListItem)):
                for span in getattr(block, 'spans', []):
                    all_text.append(span.text)
    
    text_sample = ' '.join(all_text)[:1000]  # First 1000 chars
    
    # Simple heuristics
    if any(char in text_sample for char in 'ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'):
        return 'fa'  # Persian
    elif any(char in text_sample for char in 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'):
        return 'ru'  # Russian
    elif any(char in text_sample for char in 'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ'):
        return 'fr'  # French
    elif any(char in text_sample for char in 'äöüß'):
        return 'de'  # German
    else:
        return 'en'  # Default to English
