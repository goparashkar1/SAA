import io
import zipfile
from fastapi.testclient import TestClient

import docling.engine
from translator_agent import api as api_module

PNG_DATA_URI = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9m4G6P8AAAAASUVORK5CYII="
)


def _stub_parse_to_markdown(_src_path, work_dir):
    md_path = work_dir / "content.md"
    md_path.write_text(f"# Sample\n\n![Inline]({PNG_DATA_URI})\n", encoding="utf-8")
    layout_path = work_dir / "layout.json"
    layout_path.write_text(
        '{"pages": [{"number": 1, "columns": 1, "blocks": [{"type": "paragraph", "text": "Sample"}]}]}',
        encoding="utf-8",
    )
    return md_path, layout_path


def test_docling_pipeline_without_api(monkeypatch):
    monkeypatch.setattr(docling.engine, "parse_to_markdown", _stub_parse_to_markdown)
    monkeypatch.setattr(api_module, "_check_credible_api", lambda: False)

    client = TestClient(api_module.app)

    extract_resp = client.post(
        "/docling/extract",
        files={"file": ("example.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert extract_resp.status_code == 200
    extract_data = extract_resp.json()
    job_id = extract_data["job_id"]
    original_md = extract_data["original_md"]

    assert job_id.startswith("job_")
    assert "data:image" not in original_md
    assert "assets/" in original_md

    translate_resp = client.post(
        "/docling/translate",
        json={"job_id": job_id, "md": original_md, "lang_target": "fa"},
    )
    assert translate_resp.status_code == 200
    assert translate_resp.json() == {"translated_md": None, "error": "NO credible API"}

    render_resp = client.post(
        "/docling/render",
        json={
            "job_id": job_id,
            "target": "docx",
            "original_md": original_md,
            "translated_md": None,
            "rtl": True,
        },
    )
    assert render_resp.status_code == 200
    download_path = render_resp.json()["download"]

    download_resp = client.get(download_path)
    assert download_resp.status_code == 200

    with zipfile.ZipFile(io.BytesIO(download_resp.content)) as archive:
        document_xml = archive.read("word/document.xml").decode("utf-8")
    assert "NO credible API" in document_xml
