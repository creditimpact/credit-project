import os
import shutil
import logging
from pathlib import Path
from config.settings import BACKEND_URL

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except ImportError:  # Allow running without boto3 when not using S3
    boto3 = None
    BotoCoreError = ClientError = Exception

BUCKET = os.getenv("AWS_S3_BUCKET")
REGION = os.getenv("AWS_REGION", "us-east-1")

# Store files under the backend uploads directory so the Node backend can
# serve them from the same location as credit reports.
LOCAL_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "backend" / "uploads"

_s3_client = None
if BUCKET and boto3:
    _s3_client = boto3.client(
        "s3",
        region_name=REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )

logger = logging.getLogger(__name__)


def upload_file(local_path: str, key: str) -> str:
    """Upload a file to S3 if configured or save locally.

    Returns the URL to the uploaded file or the local file path when saved
    to disk.
    """
    if BUCKET and not _s3_client:
        logger.warning("S3 upload skipped: boto3 not available or AWS credentials not set")
    if BUCKET and _s3_client:
        try:
            _s3_client.upload_file(local_path, BUCKET, key)
            url = f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{key}"
            logger.info("Uploaded %s to S3 bucket %s", key, BUCKET)
            return url
        except (BotoCoreError, ClientError) as e:
            raise RuntimeError(f"Failed to upload {key}: {e}")

    # Fallback to local storage
    dest_path = LOCAL_UPLOAD_DIR / key
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(local_path, dest_path)
    logger.info("Saved %s locally at %s", key, dest_path)
    return f"{BACKEND_URL}/uploads/{key}"
