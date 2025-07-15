const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
const Customer = require('../models/Customer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const BUCKET = process.env.AWS_S3_BUCKET;

router.post('/:id', upload.single('file'), async (req, res) => {
  try {
    const customerId = req.params.id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const key = `clients/${customerId}/credit_report.pdf`;
    await s3
      .putObject({ Bucket: BUCKET, Key: key, Body: file.buffer })
      .promise();

    const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    const customer = await Customer.findByIdAndUpdate(customerId, { creditReport: url });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'File uploaded', url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;

