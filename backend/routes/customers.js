const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Create new customer
router.post('/', async (req, res) => {
  try {
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
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
