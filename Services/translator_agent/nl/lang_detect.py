from langdetect import detect

def detect_lang_doc(ir: dict) -> str:
    sample = []
    for b in ir.get("blocks", [])[:30]:
        for s in b.get("spans", []):
            sample.append(s.get("text",""))
    text = "\n".join(sample)[:2000]
    try:
        return detect(text)
    except Exception:
        return "unknown"
