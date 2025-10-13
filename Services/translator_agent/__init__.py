"""
Package bootstrap for translator_agent.

Ensures the repository root is on sys.path so modules such as `docling` (vendored
under `services/docling`) resolve correctly when the package is imported from a
subdirectory entry point.
"""
from __future__ import annotations

import sys
from pathlib import Path


_PACKAGE_ROOT = Path(__file__).resolve().parent
_PROJECT_ROOT = _PACKAGE_ROOT.parent
_ROOT_STR = str(_PROJECT_ROOT)

if _ROOT_STR not in sys.path:
    sys.path.insert(0, _ROOT_STR)
