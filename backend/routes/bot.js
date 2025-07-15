const express = require('express');
const router = express.Router();
const axios = require('axios');
const Customer = require('../models/Customer');

const BOT_PROCESS_URL = process.env.BOT_PROCESS_URL || 'http://localhost:6000/api/bot/process';

// Update status and optionally trigger bot
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    if (status === 'In Progress' && !customer.creditReport) {
      console.log(`Skipping bot for ${customer.customerName}: missing credit report`);
      return res.status(400).json({ error: 'Credit report must be uploaded before processing' });
    }

    customer.status = status;
    await customer.save();

    if (status === 'In Progress') {

      const payload = {
        clientId: customer._id,
        creditReportUrl: customer.creditReport,
        customerName: customer.customerName,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        instructions: { strategy: 'aggressive' },
      };
      try {
        customer.botStatus = 'processing';
        customer.botError = undefined;
        await customer.save();
        console.log(`Set customer ${customer._id} botStatus to processing`);

        await axios.post(BOT_PROCESS_URL, payload);
        console.log(`Sent to bot for customer ${customer.customerName}`);
      } catch (err) {
        console.error('Bot request failed:', err.message);
        customer.botStatus = 'failed';
        customer.botError = err.message;
        await customer.save();
        console.log(`Set customer ${customer._id} botStatus to failed`);
      }
    }

    res.json({ message: 'Status updated', customer });
  } catch (error) {
    console.error('Error updating status or sending to bot:', error);
    res.status(500).json({ error: error.message });
  }
};

router.put('/:id/status', updateStatus);
router.patch('/:id/status', updateStatus);

// Endpoint for bot to send results
router.post('/result', async (req, res) => {
  try {
    const { clientId, letters, error } = req.body;
    let update;
    if (error) {
      update = { botStatus: 'failed', botError: error };
    } else {
      update = { status: 'Letters Created', botStatus: 'done' };
      if (letters) update.letters = letters;
    }

    const customer = await Customer.findByIdAndUpdate(clientId, update, { new: true });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    console.log(`Set customer ${customer._id} botStatus to ${update.botStatus}`);
    res.json({ message: 'Customer updated', customer });
  } catch (err) {
    console.error('Error saving bot results:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

