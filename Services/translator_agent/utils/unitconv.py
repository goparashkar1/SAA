"""Utility helpers for converting document units to python-docx EMU values."""

from __future__ import annotations

from docx.shared import Cm, Emu, Inches, Pt

EMU_PER_INCH = 914400


def pct_of(value_emu: int, pct: float) -> int:
    """Return the EMU value corresponding to a percentage of `value_emu`."""
    if pct is None:
        return value_emu
    if pct > 1:
        pct = pct / 100.0
    pct = max(0.0, min(pct, 1.0))
    return int(round(value_emu * pct))


def px_to_emu(px: float, dpi: float = 96.0) -> int:
    """Convert pixel values to EMU (English Metric Units)."""
    if dpi <= 0:
        dpi = 96.0
    inches = px / dpi
    return int(round(inches * EMU_PER_INCH))


def mm_to_emu(mm: float) -> int:
    """Convert millimetres to EMU."""
    inches = mm / 25.4
    return int(round(inches * EMU_PER_INCH))


__all__ = ["pct_of", "px_to_emu", "mm_to_emu", "Emu", "Inches", "Pt", "Cm"]
