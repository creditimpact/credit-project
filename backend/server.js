require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const Customer = require('./models/Customer');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const { getSignedUrl } = require('./utils/files');
const { acquireLock, releaseLock } = require('./utils/cronLock');
const logger = require('./utils/logger');
const loadSecrets = require('./utils/loadSecrets');

function resolveMode(value) {
  return String(value || '').toLowerCase().startsWith('test') ? 'testing' : 'real';
}

async function start() {
  await loadSecrets();

  const DEFAULT_MODE = resolveMode(process.env.APP_MODE || 'real');
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Middleware
  app.use(cors({ origin: ALLOWED_ORIGIN }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic env validation
  ['MONGO_URI', 'BOT_PROCESS_URL', 'BOT_START_URL'].forEach((key) => {
    if (!process.env[key]) {
      logger.warn('Missing environment variable', { key });
    }
  });

  // MongoDB connection
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      logger.info('MongoDB connected');
      app.listen(PORT, () => {
        logger.info('Server running', { url: `http://localhost:${PORT}` });
      });
    })
    .catch((err) => logger.error('Mongo connection error', { error: err.message }));

// Routes
const customersRoutes = require('./routes/customers');
const uploadRoutes = require('./routes/upload');
const botRoutes = require('./routes/bot');
const filesRoutes = require('./routes/files');

app.use('/api', authRoutes);
app.use('/api/customers', authMiddleware, customersRoutes);
app.use('/api/clients', authMiddleware, customersRoutes); // alias for convenience
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/files', filesRoutes); // auth inside route
// Bot routes handle their own authentication
app.use('/api/bot', botRoutes);

// simple health endpoints
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/health', (req, res) => {
  res.send('OK');
});

// Serve local uploads only when no S3 bucket is configured
if (!process.env.AWS_S3_BUCKET) {
  app.use('/uploads', express.static('uploads'));
}

app.get('/', (req, res) => {
  res.send('✅ Backend API is running!');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: err.message || 'Server error' });
});

// Optional cron job to send one pending customer to the bot every 5 minutes.
// It is enabled only when ENABLE_CRON=true is set in the environment.
if (process.env.ENABLE_CRON === 'true') {
  cron.schedule('*/5 * * * *', async () => {
    if (!(await acquireLock())) {
      logger.info('Cron job locked, skipping');
      return;
    }
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
      logger.warn('Skipping customer due to missing fields', { id: customer._id, missing });
      return;
    }

    if (!customer.creditReport) {
      logger.info('Skipping bot missing credit report', { name: customer.customerName });
      return;
    }

    customer.botStatus = 'processing';
    customer.botError = undefined;
    await customer.save();
    logger.info('Set botStatus to processing', { id: customer._id });

    const payload = {
      clientId: customer._id,
      creditReportUrl: getSignedUrl(customer.creditReport),
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
      logger.info('Sent to bot via cron', { mode: DEFAULT_MODE, name: customer.customerName });
    } catch (err) {
      logger.error('Cron bot request failed', { error: err.message });
      customer.botStatus = 'failed';
      customer.botError = err.message;
      await customer.save();
      logger.info('Set customer botStatus to failed', { id: customer._id });
    }
  } catch (err) {
    logger.error('Cron job error', { error: err.message });
  } finally {
    await releaseLock();
  }
  });
}

}
start();

