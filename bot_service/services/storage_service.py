import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError

BUCKET = os.getenv("AWS_S3_BUCKET")
REGION = os.getenv("AWS_REGION", "us-east-1")

_s3_client = boto3.client(
    "s3",
    region_name=REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


def upload_file(local_path: str, key: str) -> str:
    """Upload a file to S3 and return the public URL."""
    try:
        _s3_client.upload_file(local_path, BUCKET, key)
        url = f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{key}"
        return url
    except (BotoCoreError, ClientError) as e:
        raise RuntimeError(f"Failed to upload {key}: {e}")
