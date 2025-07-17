const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'supersecret';

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
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('JWT verification error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
