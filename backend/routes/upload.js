const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const Customer = require('../models/Customer');

// הגדרה של אחסון מקומי
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  }
});

const upload = multer({ storage });

router.post('/:id', upload.single('file'), async (req, res) => {
  try {
    const customerId = req.params.id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    let url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

    if (process.env.AWS_S3_BUCKET) {
      const s3 = new AWS.S3({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
      const key = `clients/${customerId}/${file.filename}`;
      await s3
        .upload({ Bucket: process.env.AWS_S3_BUCKET, Key: key, Body: fs.createReadStream(file.path), ContentType: file.mimetype })
        .promise();
      url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      fs.unlinkSync(file.path);
    }

    const customer = await Customer.findByIdAndUpdate(customerId, { creditReport: url });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    res.json({ message: 'File uploaded', url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
