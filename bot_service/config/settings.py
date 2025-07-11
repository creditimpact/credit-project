import os

BOT_PORT = int(os.getenv("PORT", 6000))
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
