import os
import tempfile
import requests
from flask import Flask, request, jsonify
from reportlab.pdfgen import canvas
from services.storage_service import upload_file
from services.backend_comm import send_results
from config.settings import BOT_PORT

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
        # Generate a placeholder letter
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as f:
            create_sample_letter('Dispute letter for ' + client_id, f.name)
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

