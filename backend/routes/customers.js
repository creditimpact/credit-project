const express = require('express');
const router = express.Router();
const fs = require('fs');
const AWS = require('aws-sdk');
const Customer = require('../models/Customer');

// Create new customer
router.post('/', async (req, res) => {
  try {
    const required = ['customerName', 'phone', 'email', 'address', 'startDate'];
    for (const field of required) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const payload = { ...req.body };
    if (payload.startDate) payload.startDate = new Date(payload.startDate);
    const newCustomer = new Customer(payload);
    await newCustomer.save();
    const data = newCustomer.toObject();
    data.id = data._id;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find();
    const mapped = customers.map((c) => {
      const obj = c.toObject();
      obj.id = c._id;
      if (obj.startDate) obj.startDate = obj.startDate.toISOString();
      return obj;
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customers scheduled for today
router.get('/today', async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const customers = await Customer.find({
      startDate: { $gte: start, $lt: end }
    });
    const mapped = customers.map((c) => {
      const obj = c.toObject();
      obj.id = c._id;
      if (obj.startDate) obj.startDate = obj.startDate.toISOString();
      return obj;
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const data = customer.toObject();
    data.id = data._id;
    if (data.startDate) data.startDate = data.startDate.toISOString();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer by ID
router.put('/:id', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.startDate) payload.startDate = new Date(payload.startDate);
    const updated = await Customer.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    const data = updated.toObject();
    data.id = data._id;
    if (data.startDate) data.startDate = data.startDate.toISOString();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete customer by ID
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    if (customer.creditReport) {
      const url = customer.creditReport;
      if (process.env.AWS_S3_BUCKET && url.includes('amazonaws.com')) {
        const s3 = new AWS.S3({
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });
        const key = new URL(url).pathname.slice(1);
        await s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key }).promise();
      } else {
        const filename = url.split('/').pop();
        const path = `./uploads/${filename}`;
        if (fs.existsSync(path)) fs.unlinkSync(path);
      }
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
