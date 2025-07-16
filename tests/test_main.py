import sys
from pathlib import Path
import types
import os

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
BOT_DIR = ROOT / 'bot_service'
if str(BOT_DIR) not in sys.path:
    sys.path.insert(0, str(BOT_DIR))
os.chdir(BOT_DIR)

from flask import Flask
import builtins

import pytest

# Dummy modules for optional deps
if 'fpdf' not in sys.modules:
    dummy_fpdf = types.ModuleType('fpdf')
    dummy_fpdf.FPDF = object
    sys.modules['fpdf'] = dummy_fpdf
if 'fitz' not in sys.modules:
    dummy_fitz = types.ModuleType('fitz')
    sys.modules['fitz'] = dummy_fitz
if 'pdfkit' not in sys.modules:
    dummy_pdfkit = types.ModuleType('pdfkit')
    dummy_pdfkit.configuration = lambda **kw: types.SimpleNamespace()
    dummy_pdfkit.from_string = lambda *a, **k: None
    sys.modules['pdfkit'] = dummy_pdfkit

from bot_service import main as bot_main


class DummyResp:
    def __init__(self, content=b'pdf'):
        self.content = content
    def raise_for_status(self):
        pass


def create_pdf(path: Path):
    from reportlab.pdfgen import canvas
    c = canvas.Canvas(str(path))
    c.drawString(100, 750, "hello")
    c.save()


def test_process_testing_mode(monkeypatch, tmp_path):
    pdf_file = tmp_path / 'sample.pdf'
    create_pdf(pdf_file)
    monkeypatch.setattr(bot_main.requests, 'get', lambda url, timeout=10: DummyResp(pdf_file.read_bytes()))

    uploaded = {}
    def fake_upload(local, key):
        uploaded[key] = True
        return f'url/{key}'
    monkeypatch.setattr(bot_main, 'upload_file', fake_upload)

    results = {}
    def fake_send_results(cid, letters, error=None):
        results['cid'] = cid
        results['letters'] = letters
        results['error'] = error
    monkeypatch.setattr(bot_main, 'send_results', fake_send_results)

    client = bot_main.app.test_client()
    resp = client.post('/api/bot/process', json={'clientId': 'c1', 'creditReportUrl': 'http://x/test.pdf'}, headers={'X-App-Mode': 'testing'})
    assert resp.status_code == 200
    assert results['cid'] == 'c1'
    assert results['letters']
    assert results['letters'][0]['name'].endswith('.pdf')


def test_process_real_mode_fallback(monkeypatch, tmp_path):
    pdf_file = tmp_path / 'sample.pdf'
    create_pdf(pdf_file)
    monkeypatch.setattr(bot_main.requests, 'get', lambda url, timeout=10: DummyResp(pdf_file.read_bytes()))

    monkeypatch.setattr(bot_main.analyze_report, 'analyze_credit_report', lambda *a, **k: (_ for _ in ()).throw(Exception('fail')))

    uploaded = {}
    def fake_upload(local, key):
        uploaded[key] = True
        return f'url/{key}'
    monkeypatch.setattr(bot_main, 'upload_file', fake_upload)

    results = {}
    def fake_send_results(cid, letters, error=None):
        results['cid'] = cid
        results['letters'] = letters
        results['error'] = error
    monkeypatch.setattr(bot_main, 'send_results', fake_send_results)

    client = bot_main.app.test_client()
    resp = client.post('/api/bot/process', json={'clientId': 'c2', 'creditReportUrl': 'http://x/test.pdf'}, headers={'X-App-Mode': 'real'})
    assert resp.status_code == 200
    # Fallback should still produce a letter
    assert results['letters']
    assert any(l['name'].endswith('.pdf') for l in results['letters'])
