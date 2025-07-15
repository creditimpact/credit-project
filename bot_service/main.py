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

    try:
        # Download credit report
        resp = requests.get(report_url, timeout=10)
        resp.raise_for_status()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
            f.write(resp.content)
            report_path = f.name

        # Parse a snippet of the report text so we can feed it to GPT if needed
        report_text = ""
        try:
            with pdfplumber.open(report_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    report_text += page_text
                    if len(report_text) >= 1000:
                        break
        except Exception as e:
            print(f"[⚠️] pdfplumber failed to open report: {e}")
            report_text = extract_pdf_text_safe(Path(report_path), max_chars=1000)
            print(f"[ℹ️] Fallback extracted {len(report_text)} characters")

        # Create dispute letter text
        text = None
        if client:
            try:
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
            except Exception as e:
                print(f"[❌] OpenAI request failed: {e}")

        # Fallback text if no valid response
        if not text or not isinstance(text, str):
            text = f"Dispute letter for {client_id}"

        # Create PDF with letter text
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
            create_sample_letter(text, f.name)
            letter_path = f.name

        # Upload letter
        key = f"clients/{client_id}/dispute_letter.pdf"
        url = upload_file(letter_path, key)
        letters = [{'name': 'dispute_letter.pdf', 'url': url}]

        send_results(client_id, letters)
        return jsonify({'status': 'processing'}), 200
    except Exception as e:
        print(f"[❌] General error: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=BOT_PORT)
