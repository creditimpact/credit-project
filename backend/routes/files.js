const express = require('express');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const auth = require('../middleware/auth');

const s3 = process.env.AWS_S3_BUCKET
  ? new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    })
  : null;

router.use(auth);

router.get('/get-signed-url', (req, res) => {
  const key = req.query.key;
  if (!key || key === 'undefined')
    return res.status(400).json({ error: 'Invalid key' });

  if (/^https?:\/\//i.test(key)) {
    // Already a full URL, return as-is without signing
    return res.json({ url: key });
  }

  if (s3) {
    const url = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: 300, // 5 minutes
    });
    return res.json({ url });
  }

  const url = `${req.protocol}://${req.get('host')}/uploads/${key}`;
  res.json({ url });
});

router.delete('/delete', async (req, res) => {
  const key = req.query.key;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  try {
    if (s3) {
      await s3
        .deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key })
        .promise();
    } else {
      const filePath = path.join('uploads', key);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
