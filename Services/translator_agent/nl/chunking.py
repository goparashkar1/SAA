from typing import List
from .tokenizer import count_tokens
from blingfire import text_to_sentences

def split_paragraph(p: str, model: str, budget: int, overhead: int = 200) -> List[str]:
    sentences = [s for s in text_to_sentences(p).split("\n") if s.strip()]
    chunks, cur = [], ""
    for s in sentences:
        candidate = (cur + " " + s).strip() if cur else s
        if count_tokens(candidate, model) + overhead <= budget:
            cur = candidate
        else:
            if cur: chunks.append(cur)
            cur = s
    if cur: chunks.append(cur)
    return chunks
