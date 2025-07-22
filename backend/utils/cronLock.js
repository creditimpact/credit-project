const mongoose = require('mongoose');

const CronLockSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  lockedUntil: Date
});

const CronLock = mongoose.models.CronLock || mongoose.model('CronLock', CronLockSchema);

async function acquireLock(ttlMs = 5 * 60 * 1000) {
  const now = new Date();
  try {
    const lock = await CronLock.findOneAndUpdate(
      { name: 'cron', $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }] },
      { name: 'cron', lockedUntil: new Date(now.getTime() + ttlMs) },
      { new: true, upsert: true }
    ).exec();
    return !!lock;
  } catch (err) {
    if (err.code === 11000) {
      return false;
    }
    throw err;
  }
}

async function releaseLock() {
  await CronLock.deleteOne({ name: 'cron' }).catch(() => {});
}

module.exports = { acquireLock, releaseLock };

