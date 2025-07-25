import os
from dotenv import load_dotenv
from config.aws_secrets import load_aws_secrets

# Load environment variables from the service's .env file explicitly before any
# other imports use them. This ensures modules like `storage_service` see the
# correct values even when the working directory differs.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
load_aws_secrets()

import tempfile
import requests
from pathlib import Path
from flask import Flask, request, jsonify
from reportlab.pdfgen import canvas
from services.storage_service import upload_file
from services.backend_comm import send_results
from logic import (
    analyze_report,
    process_accounts,
    letter_generator,
    generate_goodwill_letters,
    generate_custom_letters,
    instructions_generator,
)
from config.settings import BOT_PORT
import logging

# הגדרת הלוגים
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

import builtins

def _print(*args, **kwargs):
    logger.info(" ".join(str(a) for a in args))

builtins.print = _print

app = Flask(__name__)


@app.route('/health')
def health():
    return 'OK', 200

def create_sample_letter(text: str, output_path: str):
    c = canvas.Canvas(output_path)
    c.drawString(100, 750, text or "Default dispute letter content")
    c.save()


@app.route('/api/bot/process', methods=['POST'])
def process():
    data = request.get_json()
    client_id = data.get('clientId')
    report_url = data.get('creditReportUrl')
    if not client_id or not report_url:
        return jsonify({'error': 'Invalid payload'}), 400

    mode_raw = request.headers.get('X-App-Mode') or data.get('mode') or os.getenv('APP_MODE', 'real')
    mode = 'testing' if str(mode_raw).lower().startswith('test') else 'real'

    logger.info("Processing report for client %s in %s mode", client_id, mode)

    try:

        # Download credit report
        logger.info("Downloading report from %s", report_url)
        resp = requests.get(report_url, timeout=10)
        resp.raise_for_status()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
            f.write(resp.content)
            report_path = f.name
        logger.info("Saved report to %s (%d bytes)", report_path, len(resp.content))

        letters = []
        if mode == 'real':
            try:
                tmp_dir = Path(tempfile.mkdtemp())
                analysis_path = tmp_dir / "analysis.json"
                client_info = data.get("clientInfo", {}) or {}

                logger.info("Analyzing full credit report")
                analyze_report.analyze_credit_report(report_path, analysis_path, client_info)

                bureau_data = process_accounts.process_analyzed_report(analysis_path)

                letter_dir = tmp_dir / "letters"
                is_id_theft = bool(client_info.get("is_identity_theft"))
                letter_generator.generate_dispute_letters_for_all_bureaus(
                    client_info,
                    bureau_data,
                    letter_dir,
                    is_id_theft,
                )
                generate_goodwill_letters.generate_goodwill_letters(
                    client_info, bureau_data, letter_dir
                )
                generate_custom_letters.generate_custom_letters(
                    client_info, bureau_data, letter_dir
                )
                instructions_generator.generate_instruction_file(
                    client_info, bureau_data, is_id_theft, letter_dir
                )

                for pdf in letter_dir.glob("*.pdf"):
                    key = f"letters/{client_id}/{pdf.name}"
                    upload_file(str(pdf), key)
                    logger.info("Uploaded letter %s", key)
                    letters.append({"name": pdf.name, "key": key})

                logger.info("Generated %d letters", len(letters))
            except Exception as e:
                logger.error("Full pipeline failed: %s", e)

        if not letters:
            text = f"Dispute letter for {client_id}"
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
                create_sample_letter(text, f.name)
                letter_path = f.name
            logger.info("Generated fallback letter PDF at %s", letter_path)
            key = f"letters/{client_id}/dispute_letter.pdf"
            upload_file(letter_path, key)
            logger.info("Uploaded letter %s", key)
            letters = [{"name": "dispute_letter.pdf", "key": key}]

        send_results(client_id, letters)
        logger.info("Results sent to backend")
        return jsonify({'status': 'processing'}), 200
    except Exception as e:
        logger.exception("General error processing report")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=BOT_PORT)
