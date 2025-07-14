const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic env validation
['MONGO_URI', 'BOT_URL'].forEach((key) => {
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
