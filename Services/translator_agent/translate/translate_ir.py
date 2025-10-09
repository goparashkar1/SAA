from typing import Dict, List
import uuid
from .prompts import build_instructions
from .openai_client import get_client, translate_text
from ir.schema import Block, InlineSpan
from nl.chunking import split_paragraph
from config import settings


def _new_id() -> str:
    return uuid.uuid4().hex[:12]

def _prepend_notice(ir: dict, message: str) -> dict:
    notice_blocks = [
        {
            "id": _new_id(),
            "type": "heading",
            "level": 2,
            "spans": [{"text": "Translation section"}],
            "children": [],
            "attrs": {},
        },
        {
            "id": _new_id(),
            "type": "paragraph",
            "level": 0,
            "spans": [{"text": "API key not valid"}],  # exact message you requested
            "children": [],
            "attrs": {},
        },
    ]
    # Keep the extracted original content below the notice
    new_ir = {
        "blocks": notice_blocks + ir.get("blocks", []),
        "attrs": ir.get("attrs", {"lang": "auto", "dir": "auto"}),
    }
    return new_ir

def _spans_to_tagged_text(spans: List[InlineSpan]) -> str:
    out = []
    for s in spans:
        txt = s.get("text","")
        if not txt.strip():
            continue
        if s.get("code"):
            out.append(f"[CODE]{txt}[/CODE]")
            continue
        if s.get("bold") and s.get("italic"):
            out.append(f"[B][I]{txt}[/I][/B]")
        elif s.get("bold"):
            out.append(f"[B]{txt}[/B]")
        elif s.get("italic"):
            out.append(f"[I]{txt}[/I]")
        elif href := s.get("href"):
            out.append(f"[A href=\"{href}\"]{txt}[/A]")
        else:
            out.append(txt)
    return "".join(out)

def _tagged_text_to_spans(tagged: str) -> List[InlineSpan]:
    # Minimal tag repairer: we keep it simple for MVP
    # In practice, validate/repair tags more comprehensively
    import re
    s = tagged
    # Links
    out: List[InlineSpan] = []
    i = 0
    token_pat = re.compile(r"\[(/?)(B|I|CODE|A)(?: href=\"([^\"]+)\")?\]")
    stack = []
    buf = ""
    def flush_buf():
        nonlocal buf
        if buf:
            # derive styles from stack
            styles = { "bold": False, "italic": False, "code": False, "href": None}
            for t in stack:
                if t == "B": styles["bold"] = True
                if t == "I": styles["italic"] = True
                if t == "CODE": styles["code"] = True
                if isinstance(t, tuple) and t[0] == "A": styles["href"] = t[1]
            span: InlineSpan = {"text": buf}
            if styles["bold"]: span["bold"] = True
            if styles["italic"]: span["italic"] = True
            if styles["code"]: span["code"] = True
            if styles["href"]: span["href"] = styles["href"]
            out.append(span)
            buf = ""
    while i < len(s):
        m = token_pat.search(s, i)
        if not m:
            buf += s[i:]
            break
        start, end = m.span()
        buf += s[i:start]
        flush_buf()
        closing = m.group(1) == "/"
        tag = m.group(2)
        href = m.group(3)
        if not closing:
            if tag == "A" and href:
                stack.append(("A", href))
            else:
                stack.append(tag)
        else:
            # pop until matching
            tmp = []
            while stack:
                t = stack.pop()
                if (t == tag) or (isinstance(t, tuple) and t[0]==tag):
                    break
                tmp.append(t)
            # push back any extra
            while tmp:
                stack.append(tmp.pop())
        i = end
    flush_buf()
    return out

def translate_ir_to_fa(ir: dict, *, model: str, glossary: Dict[str,str] | None) -> dict:
    client = get_client()
    instr = build_instructions(glossary)
    max_budget = settings.max_chunk_tokens

    out_blocks: list[Block] = []
    for b in ir.get("blocks", []):
        nb: Block = {"id": b["id"], "type": b["type"], "level": b.get("level",0), "children": [], "attrs": b.get("attrs",{})}
        if b["type"] in ["heading","paragraph","blockquote"]:
            tagged = _spans_to_tagged_text(b.get("spans", []))
            chunks = split_paragraph(tagged, model=model, budget=max_budget)
            translated_chunks = []
            for ch in chunks:
                translated_chunks.append(translate_text(client, model, instr, ch))
            merged = " ".join(translated_chunks)
            nb["spans"] = _tagged_text_to_spans(merged)
        elif b["type"] == "list":
            items = []
            for li in b.get("children", []):
                tagged = _spans_to_tagged_text(li.get("spans", []))
                chunks = split_paragraph(tagged, model=model, budget=max_budget)
                translated_chunks = [translate_text(client, model, instr, ch) for ch in chunks]
                merged = " ".join(translated_chunks)
                items.append({"id": li["id"], "type": "list_item", "level": 0, "spans": _tagged_text_to_spans(merged), "children": [], "attrs": {}})
            nb["children"] = items
            nb["spans"] = []
        elif b["type"] == "codeblock":
            nb["spans"] = b.get("spans", [])
        else:
            nb["spans"] = b.get("spans", [])
        out_blocks.append(nb)

    return {"blocks": out_blocks, "attrs": {"lang": "fa", "dir": "rtl"}}
