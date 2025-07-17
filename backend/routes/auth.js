const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const USERNAME = process.env.ADMIN_USER;
const PASSWORD = process.env.ADMIN_PASS;
const SECRET = process.env.JWT_SECRET;

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = router;
