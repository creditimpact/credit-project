# Bot Service

This Python service receives credit report URLs, generates dispute letters, uploads them to storage, and notifies the backend when done.

## Running locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

Environment variables are read from a `.env` file or the environment:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_REGION`
- `BACKEND_URL` (e.g. `http://localhost:5000`)
 - `BOT_TOKEN` — shared secret used to call the backend `/api/bot/*` endpoints
- `PORT` (default 6000)
- `APP_MODE` (optional) — default mode when no header/body value is provided

