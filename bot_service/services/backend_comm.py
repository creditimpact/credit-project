import os
import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
BOT_TOKEN = os.getenv("BOT_TOKEN")


def send_results(client_id: str, letters: list[dict], error: str | None = None):
    """Send generated letter data or an error back to the backend."""
    payload = {"clientId": client_id, "letters": letters}
    if error:
        payload["error"] = error
    url = f"{BACKEND_URL}/api/bot/result"
    headers = {}
    if BOT_TOKEN:
        headers["Authorization"] = f"Bearer {BOT_TOKEN}"
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        raise RuntimeError(f"Failed to send results: {e}")
