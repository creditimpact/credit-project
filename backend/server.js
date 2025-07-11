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
app.use('/api/upload', uploadRoutes);
app.use('/api/bot', botRoutes);

// Static folder for uploaded files
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('✅ Backend API is running!');
});
