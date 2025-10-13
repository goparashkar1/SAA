from __future__ import annotations

import asyncio
import logging
from typing import Callable, Optional, Tuple

from config import settings
from translator_agent.translate.openai_client import get_client, translate_text


logger = logging.getLogger(__name__)

INSTRUCTIONS_TEMPLATE = (
    "You are a professional translator. Translate the provided Markdown content into {lang} "
    "while preserving the exact Markdown structure and syntax. Keep headings, lists, tables, "
    "blockquotes, and horizontal rules unchanged apart from translated text. Preserve bold, italic, "
    "code spans, links, and image references exactly as provided (do not alter characters such as "
    "[], (), !, or backticks). Never translate text inside backticks or URLs. Return only the "
    "translated Markdown."
)


def _default_translate_factory(target_lang: str) -> Callable[[str, str], str]:
    client = get_client()
    model = settings.model
    instructions = INSTRUCTIONS_TEMPLATE.format(lang=target_lang)

    def _translate(text: str, _: str) -> str:
        payload = text.rstrip("\n")
        if not payload.strip():
            return text
        response = translate_text(client, model, instructions, payload)
        return response

    return _translate


def translate_markdown_blocks(
    md_text: str,
    target_lang: str,
    translate_fn: Optional[Callable[[str, str], str]] = None,
) -> str:
    """
    Translate Markdown content block-by-block while preserving Markdown syntax.

    Parameters
    ----------
    md_text:
        Source Markdown document.
    target_lang:
        Language code to translate into.
    translate_fn:
        Optional callable used for translation. It should accept ``(text, target_lang)``
        and return the translated string. When omitted, the OpenAI-backed translator is used.
    """
    if not md_text:
        return md_text

    translator = translate_fn or _default_translate_factory(target_lang)

    output_lines: list[str] = []
    buffer: list[str] = []
    in_code_fence = False

    def _flush_buffer() -> None:
        if not buffer:
            return
        block = "\n".join(buffer)
        try:
            translated = translator(block, target_lang) or block
        except Exception:  # pragma: no cover - defensive
            logger.exception("Markdown block translation failed; falling back to source text.")
            translated = block
        output_lines.extend(translated.splitlines())
        buffer.clear()

    for line in md_text.splitlines():
        stripped = line.strip()

        if stripped.startswith("```"):
            _flush_buffer()
            in_code_fence = not in_code_fence
            output_lines.append(line)
            continue

        if in_code_fence:
            output_lines.append(line)
            continue

        if stripped.startswith("!"):
            _flush_buffer()
            output_lines.append(line)
            continue

        if stripped == "":
            _flush_buffer()
            output_lines.append("")
            continue

        if stripped.startswith("|") and set(stripped) <= {"|", ":", "-", " "}:
            # Table alignment rows should remain untouched.
            _flush_buffer()
            output_lines.append(line)
            continue

        buffer.append(line)

    _flush_buffer()
    return "\n".join(output_lines)


async def safe_translate_markdown(
    md_text: str,
    target_lang: str,
    *,
    translate_fn: Optional[Callable[[str, str], str]] = None,
    timeout_s: int = 20,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Run Markdown translation with a timeout and error handling.

    Returns a tuple of ``(translated_markdown, error_message)`` where ``error_message`` is
    ``"NO credible API"`` on failure and ``None`` on success.
    """
    loop = asyncio.get_running_loop()

    def _runner() -> str:
        return translate_markdown_blocks(md_text, target_lang, translate_fn)

    try:
        translated = await asyncio.wait_for(loop.run_in_executor(None, _runner), timeout=timeout_s)
        return translated, None
    except asyncio.TimeoutError:
        logger.warning("Docling translation timed out after %ss", timeout_s)
    except Exception:
        logger.exception("Docling translation failed.")
    return None, "NO credible API"
