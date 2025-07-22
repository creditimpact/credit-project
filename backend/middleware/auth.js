const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const logger = require('../utils/logger');

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.error('JWT verification error', { error: err.message });
      return res.status(401).json({ error: 'Token expired' });
    }
    logger.error('JWT verification error', { error: err.message });
    return res.status(401).json({ error: 'Invalid token' });
  }
};
