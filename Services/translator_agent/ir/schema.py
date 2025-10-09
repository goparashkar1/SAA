from typing import Literal, Optional, TypedDict, List, Dict, Any

class InlineSpan(TypedDict, total=False):
    text: str
    bold: bool
    italic: bool
    code: bool
    href: str

class Block(TypedDict, total=False):
    id: str
    type: Literal["heading","paragraph","list","list_item","table","table_row","table_cell","figure","blockquote","codeblock","hr"]
    level: int
    spans: List[InlineSpan]
    children: List["Block"]
    attrs: Dict[str, Any]
