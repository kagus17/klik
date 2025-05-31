/**
 * @file room.js
 * @description Moduł Express obsługujący trasy do tworzenia i dołączania do pokojów gry w trybie wieloosobowym.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-31
 */

/**
 * @module RoomRoutes
 * @requires express
 * @requires ../db
 */
const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * Trasa do tworzenia nowego pokoju gry.
 * @name POST/room/create
 * @function
 * @async
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} Odpowiedź JSON z kodem pokoju lub błędem.
 * @description Tworzy nowy pokój z unikalnym kodem i zapisuje ID pierwszego gracza.
 */
router.post('/create', async (req, res) => {
  if (!req.session.user) return res.status(403).json({ success: false });

  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  await db.query('INSERT INTO rooms (code, player1_id) VALUES (?, ?)', [code, req.session.user.id]);
  res.json({ success: true, code });
});

/**
 * Trasa do dołączania do istniejącego pokoju gry.
 * @name POST/room/join
 * @function
 * @async
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} Odpowiedź JSON z informacją o sukcesie lub błędzie.
 * @description Dołącza drugiego gracza do pokoju, jeśli pokój istnieje i nie jest pełny.
 */
router.post('/join', async (req, res) => {
  const { code } = req.body;
  const [rows] = await db.query('SELECT * FROM rooms WHERE code = ?', [code]);

  if (rows.length === 0) return res.status(404).json({ success: false });
  if (rows[0].player2_id) return res.status(409).json({ success: false });

  await db.query('UPDATE rooms SET player2_id = ? WHERE code = ?', [req.session.user.id, code]);
  res.json({ success: true });
});

module.exports = router;
