const express = require('express');
const router = express.Router();
const axios = require('axios');
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/auth');
const botAuth = require('../middleware/authBot');
const { getSignedUrl } = require('../utils/files');
const logger = require('../utils/logger');

function getMode(req) {
  const value =
    req.headers['x-app-mode'] ||
    req.body.mode ||
    process.env.APP_MODE ||
    'real';
  return String(value).toLowerCase().startsWith('test') ? 'testing' : 'real';
}

const BOT_PROCESS_URL = process.env.BOT_PROCESS_URL || 'http://localhost:6000/api/bot/process';

// Update status and optionally trigger bot
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const mode = getMode(req);
  logger.info('Bot request mode', { mode });

  try {
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    if (status === 'In Progress' && !customer.creditReport) {
      logger.info('Skipping bot for customer: missing credit report', { id: customer._id });
      return res.status(400).json({ error: 'Credit report must be uploaded before processing' });
    }

    customer.status = status;
    await customer.save();

    if (status === 'In Progress') {
      const payload = {
        clientId: customer._id,
        creditReportUrl: getSignedUrl(customer.creditReport, req),
        customerName: customer.customerName,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        instructions: { strategy: 'aggressive' },
        clientInfo: {
          name: customer.customerName,
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
        },
      };

      customer.botStatus = 'processing';
      customer.botError = undefined;
      await customer.save();
      logger.info('Set botStatus to processing', { id: customer._id });

      payload.mode = mode;
      try {
        await axios.post(BOT_PROCESS_URL, payload, {
          headers: { 'X-App-Mode': mode },
        });
        logger.info('Sent to bot for customer', { mode, name: customer.customerName });
      } catch (err) {
        logger.error('Bot request failed', { error: err.message });
        customer.botStatus = 'failed';
        customer.botError = err.message;
        await customer.save();
        logger.info('Set customer botStatus to failed', { id: customer._id });
      }
    }

    res.json({ message: 'Status updated', customer });
  } catch (error) {
    logger.error('Error updating status or sending to bot', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

router.put('/:id/status', authMiddleware, updateStatus);
router.patch('/:id/status', authMiddleware, updateStatus);

// Endpoint for bot to send results
router.post('/result', botAuth, async (req, res) => {
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
    logger.info('Updated customer botStatus', { id: customer._id, status: update.botStatus });
    res.json({ message: 'Customer updated', customer });
  } catch (err) {
    logger.error('Error saving bot results', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

