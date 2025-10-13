"""
Bootstrap module for the `services` package.

Exposes the vendored Docling implementation under the top-level module name
`docling` so imports such as `from docling.document_converter import …` resolve
without requiring the external dependency to be installed.
"""

from __future__ import annotations

import importlib
import sys

if "docling" not in sys.modules:
    module = importlib.import_module("services.docling")
    sys.modules["docling"] = module
