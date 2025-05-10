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

// Reset hasła (na teraz testowo – zmienia dla użytkownika lukasz)
router.post('/reset', async (req, res) => {
  //console.log("Zażądano resetu hasła: ", req.body);
  const { password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  if (!password || password.length < 8)
	  res.status(400).send("Hasło musi zawierać co najmniej 8 znaków.");
  else
  {
    try
    {
      await db.query("UPDATE users SET password = ? WHERE username = 'lukasz'", [hash]);
      res.status(200).send("Hasło zostało zmienione.");
      res.json({ success: true });
      return;
    }
    catch (err)
    {
      console.error(err);
      res.status(500).send("Brak komunikacji z serwerem.");
    }
  }
  
});

module.exports = router;
