const express = require('express');
const router = express.Router();
const multer = require('multer');
const Customer = require('../models/Customer');

// הגדרה של אחסון מקומי
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

router.post('/:id', upload.single('file'), async (req, res) => {
  try {
    const customerId = req.params.id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // בונים כתובת מקומית
    const url = `/uploads/${file.originalname}`;

    const customer = await Customer.findByIdAndUpdate(customerId, { creditReport: url });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    res.json({ message: 'File uploaded', url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
