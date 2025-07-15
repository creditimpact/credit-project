import sys
import types
from pathlib import Path

# Ensure project root is on sys.path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Provide dummy modules if missing
if 'fpdf' not in sys.modules:
    dummy_fpdf = types.ModuleType('fpdf')
    dummy_fpdf.FPDF = object
    sys.modules['fpdf'] = dummy_fpdf
if 'fitz' not in sys.modules:
    dummy_fitz = types.ModuleType('fitz')
    sys.modules['fitz'] = dummy_fitz

from bot_service.logic.utils import extract_pdf_text_safe


def test_extract_pdf_text_safe_none():
    assert extract_pdf_text_safe(None) == ""
