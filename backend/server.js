const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// חיבור ל-MongoDB
mongoose
  .connect('mongodb+srv://creditimpact1:LdyzyDVG83OfwUj3@cluster0.yzc0tpn.mongodb.net/creditdb?retryWrites=true&w=majority&appName=Cluster0')
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
const botRoutes = require('./routes/bot'); // ✅ הוספת route של הבוט

app.use('/api/customers', customersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bot', botRoutes); // ✅ הוספת נתיב של הבוט

// חשיפת תיקיית uploads כסטטית
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('✅ Backend API is running!');
});
