"""
Compatibility shim that exposes the vendored Docling implementation as a top-level
`docling` package so imports like `import docling.document_converter` work without the
external dependency.
"""

from __future__ import annotations

import importlib
import sys

_module = importlib.import_module("services.docling")

globals().update(vars(_module))
__all__ = getattr(_module, "__all__", [])
__path__ = getattr(_module, "__path__", [])

sys.modules.setdefault("services.docling", _module)
sys.modules[__name__] = _module
