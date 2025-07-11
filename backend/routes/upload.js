const express = require('express');
const router = express.Router();
const multer = require('multer');
const Customer = require('../models/Customer');
const path = require('path');
const fs = require('fs');

// הגדרה לאחסון הקובץ זמנית בלוקאל
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// ראוט להעלאה
router.post('/:id', upload.single('file'), async (req, res) => {
  try {
    const customerId = req.params.id;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // נניח ששומרים את ה-path בלינק של creditReport
    const fileUrl = `/uploads/${file.filename}`;

    await Customer.findByIdAndUpdate(customerId, { creditReport: fileUrl });

    res.json({ message: 'File uploaded and customer updated', url: fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
