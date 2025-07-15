const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  startDate: { type: Date, required: true },
  roundNumber: Number,
  notes: String,
  issueDetails: String,
  creditReport: String,
  smartCreditInfo: String,
  fullFile: String,
  status: { type: String, default: 'New' },
  sentToBot: { type: Boolean, default: false },
  letters: [
    {
      name: String,
      url: String
    }
  ]
});

module.exports = mongoose.model('Customer', CustomerSchema);
