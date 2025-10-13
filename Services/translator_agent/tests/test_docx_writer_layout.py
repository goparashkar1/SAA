import base64
import json
import zipfile
from pathlib import Path

import pytest

from translator_agent.render.docx_writer_v2 import write_docx_from_layout_json

PIXEL = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9m4G6P8AAAAASUVORK5CYII="
)


@pytest.mark.parametrize("rtl", [False, True])
def test_write_docx_from_layout_json(tmp_path: Path, rtl: bool) -> None:
    layout = {
        "pages": [
            {
                "number": 1,
                "columns": 2,
                "width_pt": 595,
                "height_pt": 842,
                "margins_pt": {"left": 72, "right": 72, "top": 72, "bottom": 72},
                "blocks": [
                    {"type": "h1", "text": "Layout Heading"},
                    {"type": "paragraph", "text": "Body paragraph for layout test."},
                    {
                        "type": "list",
                        "items": [
                            {"text": "First item", "level": 0},
                            {"text": "Nested item", "level": 1},
                        ],
                    },
                    {
                        "type": "image",
                        "src": "figure.png",
                        "bbox": {"w": 200},
                        "caption": "Figure caption",
                    },
                    {
                        "type": "table",
                        "rows": [
                            ["Column A", "Column B"],
                            ["Value A1", "Value B1"],
                        ],
                    },
                ],
            }
        ]
    }

    layout_path = tmp_path / "layout.json"
    layout_path.write_text(json.dumps(layout), encoding="utf-8")

    assets_dir = tmp_path / "assets"
    assets_dir.mkdir()
    assets_dir.joinpath("figure.png").write_bytes(base64.b64decode(PIXEL))

    out_path = tmp_path / "layout.docx"
    write_docx_from_layout_json(layout_path, assets_dir, out_path, rtl=rtl)

    assert out_path.exists()

    with zipfile.ZipFile(out_path) as archive:
        document_xml = archive.read("word/document.xml").decode("utf-8")
        assert 'w:val="Heading 1"' in document_xml
        assert 'w:val="Table Grid"' in document_xml
        assert "Figure caption" in document_xml
        assert 'w:num="2"' in document_xml  # Two-column section
        if rtl:
            assert "w:rtl" in document_xml
        else:
            assert "w:rtl" not in document_xml
        assert "word/media/figure.png" in archive.namelist()
