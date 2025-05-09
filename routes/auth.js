const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// Rejestracja
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
  res.json({ success: true });
});

// Logowanie
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  if (rows.length === 0) return res.status(401).json({ success: false });

  const match = await bcrypt.compare(password, rows[0].password);
  if (!match) return res.status(401).json({ success: false });

  req.session.user = { id: rows[0].id, username };
  res.json({ success: true });
});

// Reset hasła (na teraz testowo – zmienia na '1234')
router.post('/reset', async (req, res) => {
  const { username } = req.body;
  const hash = await bcrypt.hash('1234', 10);
  await db.query('UPDATE users SET password = ? WHERE username = ?', [hash, username]);
  res.json({ success: true });
});

module.exports = router;
