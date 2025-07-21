const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const s3 = process.env.AWS_S3_BUCKET
  ? new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    })
  : null;

function getSignedUrl(key, req) {
  if (/^https?:\/\//i.test(key)) return key;

  if (s3) {
    return s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: 300,
    });
  }
  const base = req
    ? `${req.protocol}://${req.get('host')}`
    : process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/${key}`;
}

async function deleteFile(key) {
  if (s3) {
    await s3
      .deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key })
      .promise();
  } else {
    const filePath = path.join('uploads', key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

module.exports = { getSignedUrl, deleteFile };
