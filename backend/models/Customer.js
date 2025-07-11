const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  customerName: String,
  phone: String,
  email: String,
  address: String,
  startDate: String,
  roundNumber: Number,
  notes: String,
  issueDetails: String,
  creditReport: String,
  smartCreditInfo: String,
  fullFile: String,
  status: { type: String, default: 'New' },
  letters: [
    {
      name: String,
      url: String
    }
  ]
});

module.exports = mongoose.model('Customer', CustomerSchema);
