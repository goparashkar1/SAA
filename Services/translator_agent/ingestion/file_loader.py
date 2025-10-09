from pathlib import Path

def read_file(path: str) -> bytes:
    p = Path(path)
    return p.read_bytes()

def sniff_type(path: str) -> str:
    # Simple heuristic based on extension; replace with magic bytes if needed
    suf = Path(path).suffix.lower()
    if suf in [".html", ".htm"]:
        return "html"
    if suf == ".pdf":
        return "pdf"
    if suf == ".docx":
        return "docx"
    if suf == ".doc":
        return "doc"  # convert upstream if needed
    if suf == ".txt":
        return "txt"
    return "bin"
