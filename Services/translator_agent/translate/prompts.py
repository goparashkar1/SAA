BASE_INSTRUCTIONS = (
    "You are a professional Persian (Farsi) translator. "
    "Translate the provided content into Persian while preserving document structure and inline formatting. "
    "Keep headings, paragraphs, lists, blockquotes, and code blocks. "
    "Preserve bold, italic, and links; keep code tokens and URLs unchanged. "
    "Do not summarize, omit, or add. Render RTL naturally."
)

def build_instructions(glossary: dict[str,str] | None) -> str:
    if not glossary:
        return BASE_INSTRUCTIONS
    pairs = "; ".join([f"{k}→{v}" for k, v in list(glossary.items())[:40]])
    return BASE_INSTRUCTIONS + " Use these term mappings consistently: " + pairs
