/**
 * @file auth.js
 * @description Moduł Express obsługujący trasy uwierzytelniania, w tym rejestrację, logowanie, odzyskiwanie hasła i resetowanie hasła. Wykorzystuje ograniczenie liczby żądań i walidację danych.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-31
 */

/**
 * @module AuthRoutes
 * @requires express
 * @requires bcrypt
 * @requires ../db
 * @requires dotenv
 * @requires express-rate-limit
 * @requires crypto
 * @requires nodemailer
 */
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();
require('dotenv').config();

const rateLimit = require('express-rate-limit');

/**
 * Ogranicznik liczby prób logowania.
 * @constant {Object}
 * @description Ogranicza do 10 prób logowania w ciągu 15 minut.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 10, // max 10 prób na 15 minut
  message: { error: 'Za dużo prób logowania. Spróbuj ponownie później.' }
});

/**
 * Ogranicznik liczby prób resetu hasła.
 * @constant {Object}
 * @description Ogranicza do 5 prób resetu hasła w ciągu 15 minut.
 */
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Za dużo prób resetu hasła. Spróbuj ponownie później.' }
});

/**
 * Rate-limiter dla endpointu rejestracji (/auth/register).
 * Ogranicza liczbę prób rejestracji do 5 na 15 minut na IP, aby zapobiec masowemu tworzeniu kont.
 * @type {import('express-rate-limit').RateLimit}
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 5, // Maksymalnie 5 prób rejestracji
  standardHeaders: true,
  legacyHeaders: false,
  /**
   * Funkcja middleware wywoływana przy przekroczeniu limitu rejestracji.
   * Loguje IP przekraczające limit i zwraca odpowiedź HTTP 429.
   * @param {import('express').Request} req - Obiekt żądania Express.
   * @param {import('express').Response} res - Obiekt odpowiedzi Express.
   * @param {import('express').NextFunction} next - Funkcja next Express.
   * @param {import('express-rate-limit').Options} options - Opcje rate-limitera.
   */
  handler: (req, res, next, options) => {
    console.log(`Limit rejestracji przekroczony dla IP: ${req.ip} o ${new Date().toISOString()}`);
    res.status(options.statusCode).send({
      error: 'Zbyt wiele prób rejestracji, spróbuj ponownie za 15 minut.'
    });
  }
});

/**
 * Waliduje nazwę użytkownika.
 * @function
 * @param {string} username - Nazwa użytkownika do sprawdzenia.
 * @returns {boolean} Czy nazwa użytkownika jest prawidłowa (3-20 znaków, tylko litery, cyfry, podkreślenia).
 */
function validateUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(username);
}
/**
 * Waliduje adres e-mail.
 * @function
 * @param {string} email - Adres e-mail do sprawdzenia.
 * @returns {boolean} Czy adres e-mail jest prawidłowy.
 */
function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
/**
 * Waliduje hasło.
 * @function
 * @param {string} password - Hasło do sprawdzenia.
 * @returns {boolean} Czy hasło spełnia wymagania (min. 8 znaków, mała i wielka litera, cyfra, znak specjalny).
 */
function validatePassword(password) {
  return typeof password === 'string' && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

/**
 * Trasa do rejestracji nowego użytkownika.
 * @name POST/auth/register
 * @function
 * @async
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} Odpowiedź JSON z informacją o sukcesie lub błędzie.
 */
router.post('/register',registerLimiter, async (req, res) => {
  const { username, password, email } = req.body;

  if (!validateUsername(username)) {
    return res.status(400).json({ error: 'Nieprawidłowa nazwa użytkownika.' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Nieprawidłowy email.' });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Hasło nie spełnia wymagań bezpieczeństwa.' });
  }

  // Sprawdź, czy wszystkie dane są podane
  if (!username || !password || !email) {
    return res.status(400).json({ success: false, error: 'Wszystkie pola są wymagane.' });
  }

  // Sprawdź, czy e-mail jest unikalny
  const [existingEmail] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (existingEmail.length > 0) {
    return res.status(409).json({ success: false, error: 'E-mail jest już zarejestrowany.' });
  }

  // Sprawdź, czy username jest unikalny
  const [existingUsername] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  if (existingUsername.length > 0) {
    return res.status(409).json({ success: false, error: 'Nazwa użytkownika jest już zajęta.' });
  }

  // Hashowanie hasła
  const hash = await bcrypt.hash(password, 10);

  // Dodanie użytkownika do bazy danych
  await db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hash, email]);
  res.json({ success: true });
});

/**
 * Trasa do logowania użytkownika.
 * @name POST/auth/login
 * @function
 * @async
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} Odpowiedź JSON z informacją o sukcesie lub błędzie.
 */
router.post('/login',loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!validateUsername(username) || !validatePassword(password)) {
    return res.status(400).json({ error: 'Nieprawidłowe dane logowania.' });
  }
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  if (rows.length === 0) return res.status(401).json({ error: 'Nieprawidłowy login lub hasło.' });

  const match = await bcrypt.compare(password, rows[0].password);
  if (!match) return res.status(401).json({ error: 'Nieprawidłowy login lub hasło.' });

  req.session.user = { id: rows[0].id, username };
  res.json({ success: true });
});

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { error } = require('console');

/**
 * Trasa do generowania tokenu resetu hasła.
 * @name POST/auth/forgot-password
 * @function
 * @async
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} Odpowiedź JSON z informacją o sukcesie lub błędzie.
 */
router.post('/forgot-password', resetLimiter, async (req, res) => {
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

/**
 * Trasa do resetowania hasła użytkownika.
 * @name POST/auth/reset-password
 * @function
 * @async
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} Odpowiedź JSON z informacją o sukcesie lub błędzie.
 */
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
   if (!validatePassword(newPassword)) {
    return res.status(400).json({ error: 'Hasło nie spełnia wymagań bezpieczeństwa.' });
  }

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
