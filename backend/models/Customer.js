const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  startDate: { type: Date, required: true },
  roundNumber: { type: Number, default: 1 },
  notes: String,
  issueDetails: String,
  creditReport: String,
  smartCreditInfo: String,
  fullFile: String,
  status: { type: String, default: 'New' },
  botStatus: {
    type: String,
    enum: ['pending', 'processing', 'failed', 'done'],
    default: 'pending'
  },
  botError: String,
  letters: [
    {
      name: String,
      url: String
    }
  ]
});

module.exports = mongoose.model('Customer', CustomerSchema);
