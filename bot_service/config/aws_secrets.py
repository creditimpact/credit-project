import os
import json
import logging
import base64

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except ImportError:  # allow running without boto3
    boto3 = None
    BotoCoreError = ClientError = Exception

logger = logging.getLogger(__name__)


def load_aws_secrets():
    name = os.getenv("AWS_SECRET_NAME") or os.getenv("AWS_SECRETS_NAME")
    if not name or not boto3:
        return
    region = os.getenv("AWS_REGION", "us-east-1")
    client = boto3.client("secretsmanager", region_name=region)
    try:
        resp = client.get_secret_value(SecretId=name)
        secret = resp.get("SecretString")
        if not secret:
            secret = base64.b64decode(resp.get("SecretBinary", "").encode()).decode()
        data = json.loads(secret)
        for k, v in data.items():
            os.environ.setdefault(k, v)
        logger.info("Loaded secrets from AWS Secrets Manager", extra={"secret": name})
    except (BotoCoreError, ClientError, Exception) as e:
        logger.warning("Failed to load AWS secrets", extra={"error": str(e)})
