from bs4 import BeautifulSoup
import uuid
from .schema import Block, InlineSpan

def _new_id() -> str:
    return uuid.uuid4().hex[:12]

def html_to_ir(html: str):
    soup = BeautifulSoup(html, "lxml")
    body = soup.body or soup
    blocks: list[Block] = []
    for el in body.find_all(recursive=False):
        blocks.extend(_node_to_blocks(el))
    return {"blocks": blocks, "attrs": {"lang": "auto", "dir": "auto"}}

def _node_to_blocks(el):
    name = el.name if hasattr(el, "name") else None
    if name is None:
        return []
    if name in [f"h{i}" for i in range(1,7)]:
        level = int(name[1])
        spans = _collect_spans(el)
        return [Block(id=_new_id(), type="heading", level=level, spans=spans, children=[], attrs={})]
    if name in ["p"]:
        spans = _collect_spans(el)
        return [Block(id=_new_id(), type="paragraph", level=0, spans=spans, children=[], attrs={})]
    if name in ["ul", "ol"]:
        items = []
        for li in el.find_all("li", recursive=False):
            items.append(Block(id=_new_id(), type="list_item", level=0, spans=_collect_spans(li), children=[], attrs={}))
        return [Block(id=_new_id(), type="list", level=0, spans=[], children=items, attrs={"ordered": name=="ol"})]
    if name == "blockquote":
        spans = _collect_spans(el)
        return [Block(id=_new_id(), type="blockquote", level=0, spans=spans, children=[], attrs={})]
    if name == "pre":
        code = el.get_text()
        return [Block(id=_new_id(), type="codeblock", level=0, spans=[{"text": code, "code": True}], children=[], attrs={})]
    # tables and figures could be handled later
    # default: dive into children
    out = []
    for child in el.find_all(recursive=False):
        out.extend(_node_to_blocks(child))
    return out

def _collect_spans(el):
    spans: list[InlineSpan] = []
    def walk(node, bold=False, italic=False, code=False, href=None):
        if getattr(node, "name", None) is None:
            text = str(node)
            if text.strip():
                spans.append({"text": text, "bold": bold, "italic": italic, "code": code, **({"href": href} if href else {})})
            return
        name = node.name.lower()
        if name in ["strong","b"]:
            bold = True
        if name in ["em","i"]:
            italic = True
        if name == "code":
            code = True
        if name == "a":
            href = node.get("href")
        for c in node.children:
            walk(c, bold, italic, code, href)
    walk(el)
    return spans

def text_blocks_to_ir(paragraphs: list[str]):
    blocks = []
    for p in paragraphs:
        blocks.append(Block(id=_new_id(), type="paragraph", level=0, spans=[{"text": p}], children=[], attrs={}))
    return {"blocks": blocks, "attrs": {"lang": "auto", "dir": "auto"}}
