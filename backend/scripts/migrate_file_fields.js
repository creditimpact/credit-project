const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('../models/Customer');

dotenv.config();

function extractKey(url) {
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const { pathname } = new URL(url);
    let key = pathname.replace(/^\//, '');
    if (process.env.AWS_S3_BUCKET && key.startsWith(process.env.AWS_S3_BUCKET + '/')) {
      key = key.slice(process.env.AWS_S3_BUCKET.length + 1);
    }
    if (key.startsWith('uploads/')) key = key.slice('uploads/'.length);
    const rIndex = key.indexOf('reports/');
    const lIndex = key.indexOf('letters/');
    if (rIndex >= 0) key = key.slice(rIndex);
    else if (lIndex >= 0) key = key.slice(lIndex);
    return key;
  } catch (e) {
    return url;
  }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  let count = 0;
  const customers = await Customer.find();
  for (const customer of customers) {
    let changed = false;
    if (customer.creditReport) {
      const newKey = extractKey(customer.creditReport);
      if (newKey !== customer.creditReport) {
        customer.creditReport = newKey;
        changed = true;
      }
    }
    if (Array.isArray(customer.letters)) {
      for (const letter of customer.letters) {
        if (letter.key) {
          const newKey = extractKey(letter.key);
          if (newKey !== letter.key) {
            letter.key = newKey;
            changed = true;
          }
        }
      }
    }
    if (changed) {
      await customer.save();
      count++;
    }
  }
  console.log(`Updated ${count} customers`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  mongoose.disconnect();
});
