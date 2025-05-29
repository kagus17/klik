const express = require('express');
const router = express.Router();
const db = require('../db');

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