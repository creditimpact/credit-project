const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const axios = require('axios');
const Customer = require('./models/Customer');

dotenv.config();

function resolveMode(value) {
  return String(value || '').toLowerCase().startsWith('test') ? 'testing' : 'real';
}

const DEFAULT_MODE = resolveMode(process.env.APP_MODE || 'real');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic env validation
['MONGO_URI', 'BOT_PROCESS_URL', 'BOT_START_URL'].forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️  Missing environment variable: ${key}`);
  }
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected!');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.log(err));

// Routes
const customersRoutes = require('./routes/customers');
const uploadRoutes = require('./routes/upload');
const botRoutes = require('./routes/bot');

app.use('/api/customers', customersRoutes);
app.use('/api/clients', customersRoutes); // alias for convenience
app.use('/api/upload', uploadRoutes);
app.use('/api/bot', botRoutes);

// simple health endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Static folder for uploaded files
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('✅ Backend API is running!');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

// Cron job to process one customer from the "Work Today" list every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const customer = await Customer.findOne({
      startDate: { $gte: start, $lt: end },
      status: 'In Progress',
      botStatus: 'pending',
      creditReport: { $exists: true, $ne: '' },
    });

    if (!customer) return;

    const required = ['customerName', 'phone', 'email', 'address'];
    const missing = required.filter((f) => !customer[f]);
    if (missing.length) {
      console.warn(`Skipping customer ${customer._id}. Missing: ${missing.join(', ')}`);
      return;
    }

    if (!customer.creditReport) {
      console.log(`Skipping bot for ${customer.customerName}: missing credit report`);
      return;
    }

    customer.botStatus = 'processing';
    customer.botError = undefined;
    await customer.save();
    console.log(`Set customer ${customer._id} botStatus to processing`);

    const payload = {
      clientId: customer._id,
      creditReportUrl: customer.creditReport,
      customerName: customer.customerName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      instructions: { strategy: 'aggressive' },
      mode: DEFAULT_MODE,
      clientInfo: {
        name: customer.customerName,
        address: customer.address,
        phone: customer.phone,
        email: customer.email,
      },
    };

    try {
      await axios.post(process.env.BOT_PROCESS_URL, payload, {
        headers: { 'X-App-Mode': DEFAULT_MODE },
      });
      console.log(`Sent to bot via cron (${DEFAULT_MODE}) for ${customer.customerName}`);
    } catch (err) {
      console.error('Cron bot request failed:', err.message);
      customer.botStatus = 'failed';
      customer.botError = err.message;
      await customer.save();
      console.log(`Set customer ${customer._id} botStatus to failed`);
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});
