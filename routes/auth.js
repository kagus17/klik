const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Klucz API z SendGrid

// Rejestracja
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body; // Dodano email
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email jest wymagany.' });
  }
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hash, email]); // Dodano email
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
