from __future__ import annotations

from pathlib import Path

from translator_agent.utils.markdown_images import deinline_data_uri_images


PNG_DATA_URI = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9m4G6P8AAAAASUVORK5CYII="
)

JPEG_DATA_URI = (
    "data:image/jpeg;base64,"
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhISEhIVEhUVFRUVFRUVFRUVFRUXFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0mICYtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAMIBAwMBIgACEQEDEQH/"
    "xABRAAEAAQUBAAAAAAAAAAAAAAAAAgEDBAUGBwEBAAAAAAAAAAAAAAAAAAAAABAAAgEDAwUBAAAAAAAAAAAAAQMCBBEFEjFBBhMhIjMRAAEBBQYNAAAAAAAAAAAAAAABAgMEERITISKSwRMxQXGBITFBIgAAAAAAAAAAAAAAAAAAAA/xAAaEQEBAQEBAQEAAAAAAAAAAAAAARARITFh/9oADAMBAAIRAxEAPwD0oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/9k="
)


def test_deinline_single_image(tmp_path: Path) -> None:
    markdown = f"Intro paragraph.\n\n![Sample]({PNG_DATA_URI})\n"
    assets_dir = tmp_path / "assets"

    rewritten = deinline_data_uri_images(markdown, assets_dir)

    files = list(assets_dir.iterdir())
    assert len(files) == 1
    image = files[0]
    assert image.suffix == ".png"
    assert image.read_bytes().startswith(b"\x89PNG")
    assert "assets/" in rewritten
    assert rewritten.count("![Sample]") == 1


def test_deinline_multiple_images_with_attrs(tmp_path: Path) -> None:
    markdown = (
        f"![First]({PNG_DATA_URI}){{width=200}}\n\n"
        f"Some text between.\n\n"
        f"![Second]({JPEG_DATA_URI})\n"
    )
    assets_dir = tmp_path / "assets"

    rewritten = deinline_data_uri_images(markdown, assets_dir)

    files = list(sorted(assets_dir.iterdir()))
    assert len(files) == 2
    suffixes = sorted(p.suffix for p in files)
    assert suffixes == [".jpeg", ".png"]
    assert rewritten.count("assets/") == 2
    assert "{width=200}" in rewritten


def test_markdown_without_data_uri_unchanged(tmp_path: Path) -> None:
    markdown = "Regular text with ![Image](assets/sample.png) link."
    assets_dir = tmp_path / "assets"

    rewritten = deinline_data_uri_images(markdown, assets_dir)

    assert rewritten == markdown
    assert not assets_dir.exists()

