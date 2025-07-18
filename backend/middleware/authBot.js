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

  if (token !== BOT_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
};
