/**
 * @file leaderboard.js
 * @description Moduł Express obsługujący trasę do pobierania rankingu najlepszych wyników gry.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-31
 */

/**
 * @module LeaderboardRoutes
 * @requires express
 * @requires ../db
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * Trasa do pobierania rankingu najlepszych wyników.
 * @name GET/leaderboard
 * @function
 * @async
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} Odpowiedź JSON z listą wyników lub błędem.
 * @description Zwraca 10 najlepszych wyników, posortowanych malejąco według punktów (obliczanych jako matches * (100 - time_played)).
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT player_name AS player, difficulty, (matches * (100-time_played)) AS points
       FROM results
       ORDER BY points DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania wyników.' });
  }
});

module.exports = router;