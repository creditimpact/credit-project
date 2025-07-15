const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const axios = require('axios');
const Customer = require('./models/Customer');

dotenv.config();

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
      status: 'New',
      sentToBot: { $ne: true },
      creditReport: { $exists: true, $ne: '' },
    });

    if (!customer) return;

    const required = ['customerName', 'phone', 'email', 'address', 'creditReport'];
    const missing = required.filter((f) => !customer[f]);
    if (missing.length) {
      console.warn(`Skipping customer ${customer._id}. Missing: ${missing.join(', ')}`);
      return;
    }

    customer.status = 'In Progress';
    customer.sentToBot = true;
    await customer.save();

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
      await axios.post(process.env.BOT_PROCESS_URL, payload);
      console.log(`Sent to bot via cron for ${customer.customerName}`);
    } catch (err) {
      console.error('Cron bot request failed:', err.message);
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});
