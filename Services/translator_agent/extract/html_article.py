# translator_agent/extract/html_article.py
from readability import Document
import trafilatura

def extract_main_article_html(html: str, base_url: str | None = None) -> str:
    """
    Return main-article HTML. Prefer readability (HTML), fallback to trafilatura (plain text -> simple HTML),
    finally fall back to the original HTML if both fail.
    """
    # 1) Primary: readability -> HTML
    try:
        doc = Document(html)
        summary_html = doc.summary(html_partial=True)  # already HTML
        # crude length check to avoid boilerplate
        if summary_html and len(_text_only(summary_html)) > 400:
            return summary_html
    except Exception:
        pass

    # 2) Fallback: trafilatura -> plain text -> wrap as <p>
    try:
        txt = trafilatura.extract(
            html,
            url=base_url,
            include_links=True,
            include_images=True,
            # don't pass 'output' here; some versions don't support it
        )
        if txt and len(txt) > 200:
            paras = [f"<p>{line.strip()}</p>" for line in txt.split("\n") if line.strip()]
            return "\n".join(paras)
    except Exception:
        pass

    # 3) Last resort: return original HTML (the IR builder will still try to parse it)
    return html


def _text_only(fragment_html: str) -> str:
    """Remove tags to approximate text length without extra deps."""
    import re
    s = re.sub(r"(?is)<script.*?>.*?</script>", "", fragment_html)
    s = re.sub(r"(?is)<style.*?>.*?</style>", "", s)
    s = re.sub(r"(?is)<[^>]+>", "", s)
    return s
