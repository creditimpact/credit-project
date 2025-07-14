const express = require('express');
const router = express.Router();
const axios = require('axios');
const Customer = require('../models/Customer');

const BOT_URL = process.env.BOT_URL || 'http://localhost:6000/api/bot/process';

// Update status and optionally trigger bot
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const customer = await Customer.findByIdAndUpdate(id, { status }, { new: true });

    if (status === 'In Progress') {
      const payload = {
        clientId: customer._id,
        creditReportUrl: customer.creditReport,
        instructions: { strategy: 'aggressive' },
      };
      await axios.post(BOT_URL, payload);
      console.log(`Sent to bot for customer ${customer.customerName}`);
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
    const { clientId, letters } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      clientId,
      { status: 'Letters Created', letters },
      { new: true }
    );
    res.json({ message: 'Customer updated', customer });
  } catch (err) {
    console.error('Error saving bot results:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

