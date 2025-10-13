from __future__ import annotations

import sys
from pathlib import Path

import uvicorn


def _ensure_package_root() -> None:
    """Guarantee the project root is on sys.path when executed as a script."""
    project_root = Path(__file__).resolve().parents[1]
    root_str = str(project_root)
    if root_str not in sys.path:
        sys.path.insert(0, root_str)


if __name__ == "__main__":
    _ensure_package_root()
    uvicorn.run("translator_agent.api:app", host="127.0.0.1", port=8000, reload=True)
