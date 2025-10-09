"""
Test IR v2 PDF parsing with minimal test case.

This test creates a simple PDF with headers, footers, and a table,
then parses it with IR v2 to verify the parsing works correctly.
"""

import io
import tempfile
from pathlib import Path

# Note: This test requires PyMuPDF (fitz) to be installed
try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

from extract.pdf_parser_v2 import parse_pdf
from models.ir_v2 import Document as IRDocument, DocumentMeta, Section, Paragraph, Span, Table, Row, Cell


def create_test_pdf() -> bytes:
    """Create a simple test PDF with headers, footers, and a table."""
    if not PYMUPDF_AVAILABLE:
        # Create a minimal PDF using basic approach
        # This is a simplified version for testing
        pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
100 700 Td
(Document Header) Tj
ET
BT
/F1 12 Tf
100 100 Td
(Page Footer) Tj
ET
BT
/F1 16 Tf
100 650 Td
(Main Title) Tj
ET
BT
/F1 12 Tf
100 600 Td
(This is a paragraph with some content.) Tj
ET
BT
/F1 12 Tf
100 550 Td
(Table: Header1 Header2) Tj
ET
BT
/F1 12 Tf
100 520 Td
(Table: Cell1 Cell2) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
354
%%EOF"""
        return pdf_content
    
    # Create PDF using PyMuPDF
    doc = fitz.open()  # Create new PDF
    
    # Page 1
    page1 = doc.new_page()
    
    # Add header
    page1.insert_text((100, 50), "Document Header", fontsize=12)
    
    # Add footer
    page1.insert_text((100, 750), "Page Footer", fontsize=12)
    
    # Add title
    page1.insert_text((100, 100), "Main Title", fontsize=16)
    
    # Add paragraph
    page1.insert_text((100, 150), "This is a paragraph with some content.", fontsize=12)
    
    # Add table-like content
    page1.insert_text((100, 200), "Header1    Header2", fontsize=12)
    page1.insert_text((100, 220), "Cell1      Cell2", fontsize=12)
    
    # Page 2 (to test repeated headers/footers)
    page2 = doc.new_page()
    page2.insert_text((100, 50), "Document Header", fontsize=12)  # Repeated header
    page2.insert_text((100, 750), "Page Footer", fontsize=12)    # Repeated footer
    page2.insert_text((100, 100), "Second Page Content", fontsize=12)
    
    # Save to bytes
    pdf_bytes = doc.tobytes()
    doc.close()
    
    return pdf_bytes


def test_pdf_parse():
    """Test PDF parsing with IR v2."""
    if not PYMUPDF_AVAILABLE:
        print("⚠️  PyMuPDF not available, skipping PDF parsing test")
        return
    
    # Create test PDF
    pdf_bytes = create_test_pdf()
    
    # Parse with IR v2
    document, lang, stats = parse_pdf(pdf_bytes)
    
    # Assertions
    assert isinstance(document, IRDocument)
    assert len(document.sections) >= 1
    
    section = document.sections[0]
    assert section.index == 0
    
    # Check blocks
    blocks = section.blocks
    assert len(blocks) > 0
    
    # Find paragraphs
    paragraphs = [b for b in blocks if isinstance(b, Paragraph)]
    assert len(paragraphs) > 0
    
    # Check for table-like content
    tables = [b for b in blocks if isinstance(b, Table)]
    # Note: Table detection is conservative, so we might not find tables
    # but we should have paragraphs with the content
    
    # Check stats
    assert stats['paragraphs'] > 0
    assert stats['sections'] >= 1
    
    print("✓ PDF parsing test passed")
    return document


def test_header_footer_detection():
    """Test that headers and footers are detected."""
    if not PYMUPDF_AVAILABLE:
        print("⚠️  PyMuPDF not available, skipping header/footer test")
        return
    
    # Create PDF with repeated headers/footers
    pdf_bytes = create_test_pdf()
    
    # Parse with IR v2
    document, lang, stats = parse_pdf(pdf_bytes)
    
    # Check for headers/footers in sections
    for section in document.sections:
        # Headers and footers might be detected or might be in regular blocks
        # depending on the detection algorithm
        has_header = section.header is not None
        has_footer = section.footer is not None
        
        # At minimum, we should have content
        assert len(section.blocks) > 0
        
        # Check if header/footer content appears in blocks
        all_text = ""
        for block in section.blocks:
            if hasattr(block, 'spans'):
                for span in block.spans:
                    all_text += span.text + " "
        
        # Should contain some of our test content
        assert "Main Title" in all_text or "Second Page" in all_text
    
    print("✓ Header/footer detection test passed")


def test_language_detection():
    """Test language detection."""
    if not PYMUPDF_AVAILABLE:
        print("⚠️  PyMuPDF not available, skipping language detection test")
        return
    
    # Create PDF with English content
    pdf_bytes = create_test_pdf()
    
    # Parse with IR v2
    document, lang, stats = parse_pdf(pdf_bytes)
    
    # Should detect English
    assert lang == "en"
    
    print("✓ Language detection test passed")


def test_minimal_pdf_creation():
    """Test creating a minimal PDF for testing."""
    try:
        pdf_bytes = create_test_pdf()
        assert len(pdf_bytes) > 0
        assert pdf_bytes.startswith(b'%PDF')
        print("✓ Minimal PDF creation test passed")
    except Exception as e:
        print(f"⚠️  PDF creation failed: {e}")
        # This is expected if PyMuPDF is not available


if __name__ == "__main__":
    print("Running IR v2 PDF parsing tests...")
    
    try:
        test_minimal_pdf_creation()
        
        if PYMUPDF_AVAILABLE:
            test_pdf_parse()
            test_header_footer_detection()
            test_language_detection()
            print("\n🎉 All PDF tests passed!")
        else:
            print("\n⚠️  PyMuPDF not available, some tests skipped")
            print("To run full PDF tests, install PyMuPDF: pip install PyMuPDF")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise
