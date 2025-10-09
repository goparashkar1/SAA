from openai import OpenAI
from config import settings

def get_client(api_key: str | None = None) -> OpenAI:
    # Uses env var OPENAI_API_KEY by default
    return OpenAI(api_key=api_key or settings.openai_api_key)

def translate_text(client: OpenAI, model: str, instructions: str, payload: str) -> str:
    resp = client.responses.create(
        model=model,
        instructions=instructions,
        input=payload,
        temperature=0.1,
    )
    return resp.output_text.strip()
