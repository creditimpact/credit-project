const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (!BOT_TOKEN) {
    console.error('BOT_TOKEN not configured');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    if (token !== BOT_TOKEN) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.bot = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.error('Bot JWT verification error:', err);
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Bot JWT verification error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
