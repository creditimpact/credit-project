import os
import tempfile
import requests
import pdfplumber
import openai
from flask import Flask, request, jsonify
from reportlab.pdfgen import canvas
from services.storage_service import upload_file
from services.backend_comm import send_results
from config.settings import BOT_PORT
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

app = Flask(__name__)


def create_sample_letter(text: str, output_path: str):
    c = canvas.Canvas(output_path)
    c.drawString(100, 750, text)
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

        # Parse first page for debugging purposes
        with pdfplumber.open(report_path) as pdf:
            _ = pdf.pages[0].extract_text()

        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
            if OPENAI_API_KEY:
                response = openai.Completion.create(
                    model="text-davinci-003",
                    prompt=f"Write a credit dispute letter for client {client_id}",
                    max_tokens=200,
                )
                text = response.choices[0].text.strip()
            else:
                text = "Dispute letter for " + client_id
            create_sample_letter(text, f.name)
            letter_path = f.name

        # Upload letter
        key = f"clients/{client_id}/dispute_letter.pdf"
        url = upload_file(letter_path, key)
        letters = [{'name': 'dispute_letter.pdf', 'url': url}]

        send_results(client_id, letters)
        return jsonify({'status': 'processing'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=BOT_PORT)

