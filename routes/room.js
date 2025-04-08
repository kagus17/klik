const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/create', async (req, res) => {
  if (!req.session.user) return res.status(403).json({ success: false });

  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  await db.query('INSERT INTO rooms (code, player1_id) VALUES (?, ?)', [code, req.session.user.id]);
  res.json({ success: true, code });
});

router.post('/join', async (req, res) => {
  const { code } = req.body;
  const [rows] = await db.query('SELECT * FROM rooms WHERE code = ?', [code]);

  if (rows.length === 0) return res.status(404).json({ success: false });
  if (rows[0].player2_id) return res.status(409).json({ success: false });

  await db.query('UPDATE rooms SET player2_id = ? WHERE code = ?', [req.session.user.id, code]);
  res.json({ success: true });
});

module.exports = router;
