const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('../models/Customer');

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const res = await Customer.updateMany({}, {
      $unset: { sentToBot: 1 },
      $set: { botStatus: 'pending' }
    });
    console.log('Migration result:', res.modifiedCount);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
