const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const crypto = require('crypto');

const USERNAME = process.env.ADMIN_USER;
const PASS_DATA = process.env.ADMIN_PASS_HASH || '';
const SECRET = process.env.JWT_SECRET;

function verifyPassword(input) {
  const [salt, stored] = PASS_DATA.split('$');
  if (!salt || !stored) return false;
  const hash = crypto.scryptSync(input, salt, 64);
  const storedBuf = Buffer.from(stored, 'hex');
  if (storedBuf.length !== hash.length) return false;
  return crypto.timingSafeEqual(hash, storedBuf);
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && verifyPassword(password)) {
    const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = router;
