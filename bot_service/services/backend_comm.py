import os
import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")


def send_results(client_id: str, letters: list[dict]):
    """Send generated letter data back to the backend."""
    payload = {"clientId": client_id, "status": "done", "letters": letters}
    url = f"{BACKEND_URL}/api/bot/result"
    resp = requests.post(url, json=payload, timeout=10)
    resp.raise_for_status()
    return resp.json()
