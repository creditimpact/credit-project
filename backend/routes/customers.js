const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Create new customer
router.post('/', async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single customer by clientId
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ clientId: req.params.id });
    if (!customer) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer by clientId
router.put('/:id', async (req, res) => {
  try {
    const updated = await Customer.findOneAndUpdate({ clientId: req.params.id }, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete customer by clientId
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Customer.findOneAndDelete({ clientId: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
