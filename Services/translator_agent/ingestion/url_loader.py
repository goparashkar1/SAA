import httpx

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36"
}

def fetch_url(url: str, timeout: float = 20.0) -> str:
    with httpx.Client(follow_redirects=True, headers=DEFAULT_HEADERS, timeout=timeout) as c:
        r = c.get(url)
        r.raise_for_status()
        return r.text
