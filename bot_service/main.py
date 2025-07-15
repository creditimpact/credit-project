import os
import tempfile
import requests
import pdfplumber
from pathlib import Path
from openai import OpenAI
from flask import Flask, request, jsonify
from reportlab.pdfgen import canvas
from services.storage_service import upload_file
from services.backend_comm import send_results
from logic.utils import extract_pdf_text_safe
from config.settings import BOT_PORT
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

app = Flask(__name__)


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

    logger.info("Processing report for client %s", client_id)

    try:
        # Download credit report
        logger.info("Downloading report from %s", report_url)
        resp = requests.get(report_url, timeout=10)
        resp.raise_for_status()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
            f.write(resp.content)
            report_path = f.name
        logger.info("Saved report to %s (%d bytes)", report_path, len(resp.content))

        # Parse a snippet of the report text so we can feed it to GPT if needed
        report_text = ""
        try:
            logger.info("Parsing PDF with pdfplumber")
            with pdfplumber.open(report_path) as pdf:
                logger.info("PDF opened, %d pages", len(pdf.pages))
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    report_text += page_text
                    if len(report_text) >= 1000:
                        break
        except Exception as e:
            logger.warning("pdfplumber failed: %s", e)
            report_text = extract_pdf_text_safe(Path(report_path), max_chars=1000)
            logger.info("Fallback extracted %d characters", len(report_text))

        # Create dispute letter text
        text = None
        if client:
            try:
                logger.info("Calling OpenAI with %d character prompt", len(report_text))
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "Write a credit dispute letter"},
                        {
                            "role": "user",
                            "content": f"For client {client_id}. Here is the credit report snippet:\n{report_text[:1000]}",
                        },
                    ],
                    max_tokens=200,
                )
                if (
                    response.choices
                    and response.choices[0].message
                    and response.choices[0].message.content
                ):
                    text = response.choices[0].message.content.strip()
                    logger.info("Received OpenAI response (%d chars)", len(text))
            except Exception as e:
                logger.error("OpenAI request failed: %s", e)

        # Fallback text if no valid response
        if not text or not isinstance(text, str):
            text = f"Dispute letter for {client_id}"
            logger.info("Using fallback letter text")

        # Create PDF with letter text
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
            create_sample_letter(text, f.name)
            letter_path = f.name
        logger.info("Generated letter PDF at %s", letter_path)

        # Upload letter
        key = f"clients/{client_id}/dispute_letter.pdf"
        url = upload_file(letter_path, key)
        logger.info("Uploaded letter to %s", url)
        letters = [{'name': 'dispute_letter.pdf', 'url': url}]

        send_results(client_id, letters)
        logger.info("Results sent to backend")
        return jsonify({'status': 'processing'}), 200
    except Exception as e:
        logger.exception("General error processing report")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=BOT_PORT)
