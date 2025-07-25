const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

const objectIdPattern = /^[a-f0-9]{24}$/i;

router.param('id', (req, res, next, id) => {
  if (!objectIdPattern.test(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  next();
});

// הגדרה של אחסון מקומי
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const ALLOWED_TYPES = ['application/pdf'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join('uploads', 'reports', req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
  },
});

router.post('/:id', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      let msg = 'Upload error';
      if (err.code === 'LIMIT_FILE_SIZE') msg = 'File too large';
      if (err.code === 'LIMIT_UNEXPECTED_FILE') msg = 'Invalid file type';
      return res.status(400).json({ error: msg });
    } else if (err) {
      logger.error('Upload middleware error', { error: err.message });
      return res.status(500).json({ error: 'Upload failed' });
    }

    try {
      const customerId = req.params.id;
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

    let key = `reports/${customerId}/${file.filename}`;
    let url = `${req.protocol}://${req.get('host')}/uploads/${key}`;

    if (process.env.AWS_S3_BUCKET) {
      const s3 = new AWS.S3({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
      await s3
        .upload({ Bucket: process.env.AWS_S3_BUCKET, Key: key, Body: fs.createReadStream(file.path), ContentType: file.mimetype })
        .promise();
      fs.unlinkSync(file.path);
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    customer.creditReport = key;

    if (customer.status === 'Needs Updated Report') {
      customer.status = 'Ready';
    }

    await customer.save();

    res.json({ message: 'File uploaded', key });
  } catch (err) {
    logger.error('Upload failed', { error: err.message });
    res.status(500).json({ error: 'Upload failed' });
  }
  });
});

// Delete a credit report
router.delete('/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const key = customer.creditReport;
    if (!key) return res.status(400).json({ error: 'No credit report to delete' });

    if (process.env.AWS_S3_BUCKET) {
      const s3 = new AWS.S3({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
      await s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key }).promise();
    } else {
      const localPath = path.join('uploads', key);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }

    // Clear the creditReport field after deleting the file
    customer.creditReport = null;
    await customer.save();

    res.json({ message: 'Credit report deleted' });
  } catch (err) {
    logger.error('Delete failed', { error: err.message });
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
