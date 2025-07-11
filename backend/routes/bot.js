const express = require('express');
const router = express.Router();
const axios = require('axios');
const Customer = require('../models/Customer');

// Endpoint לעדכון סטטוס ולשליחת בקשה לבוט
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // עדכון סטטוס ב-DB
    const customer = await Customer.findByIdAndUpdate(id, { status }, { new: true });

    // אם סטטוס חדש הוא "In Progress", שולחים בקשה לבוט
    if (status === 'In Progress') {
      // כאן תכניס כתובת ה-URL של ה-BOT שלך
      const botUrl = 'http://localhost:6000/api/bot/process'; // עדכן לפי הצורך

      const payload = {
        clientId: customer._id,
        creditReportUrl: customer.creditReport,
        instructions: {
          strategy: 'aggressive',
          // אפשר להוסיף עוד שדות לפי הצורך
        },
      };

      // שליחת קריאה לבוט
      await axios.post(botUrl, payload);

      console.log(`Sent to bot for customer ${customer.customerName}`);
    }

    res.json({ message: 'Status updated', customer });
  } catch (error) {
    console.error('Error updating status or sending to bot:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
