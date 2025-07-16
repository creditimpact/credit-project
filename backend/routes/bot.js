const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Customer = require('../models/Customer');

function getMode(req) {
  const value = req.headers['x-app-mode'] || req.body.mode || 'real';
  return String(value).toLowerCase().startsWith('test') ? 'testing' : 'real';
}

const BOT_PROCESS_URL = process.env.BOT_PROCESS_URL || 'http://localhost:6000/api/bot/process';

function createMockLetter(customerId) {
  const dir = path.join('uploads', 'letters', String(customerId));
  fs.mkdirSync(dir, { recursive: true });
  const fileName = 'placeholder_letter.pdf';
  const filePath = path.join(dir, fileName);
  const content = `Mock Dispute Letter\n\n[Your Name]\n[Your Address]\n[Date]\n\nThis is a placeholder letter generated in testing mode.`;
  fs.writeFileSync(filePath, content);
  return { name: fileName, url: `/uploads/letters/${customerId}/${fileName}` };
}

// Update status and optionally trigger bot
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const mode = getMode(req);
  console.log(`Mode for bot request: ${mode}`);

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

      customer.botStatus = 'processing';
      customer.botError = undefined;
      await customer.save();
      console.log(`Set customer ${customer._id} botStatus to processing`);

      if (mode === 'testing') {
        try {
          const letter = createMockLetter(customer._id);
          customer.status = 'Letters Created';
          customer.botStatus = 'done';
          customer.letters = [letter];
          await customer.save();
          console.log(`(TESTING) Generated placeholder letter for ${customer._id}`);
        } catch (err) {
          console.error('Failed to create placeholder letter:', err);
          customer.botStatus = 'failed';
          customer.botError = err.message;
          await customer.save();
        }
      } else {
        try {
          await axios.post(BOT_PROCESS_URL, payload);
          console.log(`(REAL) Sent to bot for customer ${customer.customerName}`);
        } catch (err) {
          console.error('Bot request failed:', err.message);
          customer.botStatus = 'failed';
          customer.botError = err.message;
          await customer.save();
          console.log(`Set customer ${customer._id} botStatus to failed`);
        }
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

