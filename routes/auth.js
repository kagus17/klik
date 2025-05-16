const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();
require('dotenv').config();

// Rejestracja
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  // Sprawdź, czy wszystkie dane są podane
  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: 'Wszystkie pola są wymagane.' });
  }

  // Sprawdź, czy e-mail jest unikalny
  const [existingEmail] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (existingEmail.length > 0) {
    return res.status(409).json({ success: false, message: 'E-mail jest już zarejestrowany.' });
  }

  // Hashowanie hasła
  const hash = await bcrypt.hash(password, 10);

  // Dodanie użytkownika do bazy danych
  await db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hash, email]);
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

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Endpoint do generowania tokenu resetu hasła
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  // Sprawdź, czy e-mail istnieje w bazie
  const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (user.length === 0) {
    return res.status(404).json({ success: false, message: 'Nie znaleziono użytkownika z tym e-mailem.' });
  }

  // Generowanie tokenu i ustawienie daty wygaśnięcia
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // Token ważny przez 1 godzinę

  await db.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [token, expiry, email]);

  // Konfiguracja transportera e-mail
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Możesz użyć innego dostawcy
    auth: {
      user: process.env.EMAIL_USER, // Pobiera e-mail z pliku .env
      pass: process.env.EMAIL_PASS  // Pobiera hasło z pliku .env
    }
  });

  // Treść e-maila
  const resetLink = `https://my-klik-app-e9f0fcd4hhe4atbn.westeurope-01.azurewebsites.net/reset-password.html?token=${token}`;
  const mailOptions = {
    from: 'kliktester78@gmail.com',
    to: email,
    subject: 'Reset hasła',
    text: `Kliknij w poniższy link, aby zresetować hasło: ${resetLink}`,
    html: `<p>Kliknij w poniższy link, aby zresetować hasło:</p><a href="${resetLink}">${resetLink}</a>`
  };

  // Wysyłanie e-maila
  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'E-mail z linkiem do resetu hasła został wysłany.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Błąd podczas wysyłania e-maila.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  // Sprawdź, czy token istnieje i czy nie wygasł
  const [user] = await db.query('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?', [token, new Date()]);
  if (user.length === 0) {
    return res.status(400).json({ success: false, message: 'Nieprawidłowy lub wygasły token.' });
  }

  // Hashowanie nowego hasła
  const hash = await bcrypt.hash(newPassword, 10);

  // Aktualizacja hasła i usunięcie tokenu
  await db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hash, user[0].id]);

  res.json({ success: true, message: 'Hasło zostało zresetowane.' });
});

module.exports = router;
