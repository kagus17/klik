/**
 * @file server.js
 * @description Główny plik serwera aplikacji multiplayerowej umożliwiającej rozgrywkę 1v1 online. Odpowiada za konfigurację serwera Express, Socket.IO, sesji użytkownika, zabezpieczeń CSRF oraz obsługę pokojów gry i wyników.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-28
 */

/**
 * @module Server
 * @requires express
 * @requires express-session
 * @requires socket.io-express-session
 * @requires http
 * @requires socket.io
 * @requires path
 * @requires csurf
 * @requires express-mysql-session
 * @requires ./db
 * @requires ./routes/auth
 * @requires ./routes/room
 * @requires ./routes/leaderboard
 */

const express = require('express');
const session = require('express-session');
const sharedSession = require('socket.io-express-session');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const csurf = require('csurf');

const rateLimit = require('express-rate-limit');

/**
 * Konwertuje datę w formacie ISO na format MySQL DATETIME.
 * @function toMySQLDateTime
 * @param {string} dateString - Data w formacie ISO (np. "2025-05-28T12:00:00Z").
 * @returns {string} Data w formacie MySQL DATETIME ('YYYY-MM-DD HH:MM:SS').
 * @example
 * toMySQLDateTime('2025-05-28T12:00:00Z') // Zwraca '2025-05-28 12:00:00'
 */
function toMySQLDateTime(dateString) {
  const date = new Date(dateString);
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + ' ' +
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0') + ':' +
    String(date.getSeconds()).padStart(2, '0');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/**
 * Globalny rate-limiter dla wszystkich żądań przychodzących.
 * Ogranicza liczbę żądań do 100 na minutę na adres IP, aby zapobiec przeciążeniu serwera.
 * @type {import('express-rate-limit').RateLimit}
 */
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuta
  max: 100, // Maksymalnie 100 żądań na IP
  standardHeaders: true, // Włącza nagłówki RateLimit (np. RateLimit-Remaining)
  legacyHeaders: false, // Wyłącza stare nagłówki X-RateLimit
  /**
   * Funkcja middleware wywoływana przy przekroczeniu limitu.
   * Loguje IP przekraczające limit i zwraca odpowiedź HTTP 429.
   * @param {import('express').Request} req - Obiekt żądania Express.
   * @param {import('express').Response} res - Obiekt odpowiedzi Express.
   * @param {import('express').NextFunction} next - Funkcja next Express.
   * @param {import('express-rate-limit').Options} options - Opcje rate-limitera.
   */
  handler: (req, res, next, options) => {
    console.log(`Limit przekroczony dla IP: ${req.ip} o ${new Date().toISOString()}`);
    res.status(options.statusCode).send({
      error: 'Zbyt wiele żądań z tego IP, spróbuj ponownie za minutę.'
    });
  }
});

// Zastosuj globalny limiter dla wszystkich tras
app.use(globalLimiter);

const MySQLStore = require('express-mysql-session')(session);
const pool = require('./db');

/**
 * Konfiguracja magazynu sesji w bazie danych MySQL.
 * @constant {MySQLStore} sessionStore
 * @description Inicjalizuje magazyn sesji z automatycznym tworzeniem tabeli i usuwaniem wygasłych sesji.
 */
const sessionStore = new MySQLStore({
  createDatabaseTable: true, // Automatyczne tworzenie tabeli sesji
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  },
  expiration: 24 * 60 * 60 * 1000, // Sesje wygasają po 24 godzinach
  clearExpired: true, // Automatyczne usuwanie wygasłych sesji
  checkExpirationInterval: 15 * 60 * 1000 // Sprawdzanie co 15 minut
}, pool, (err) => {
  if (err) {
    console.error('Błąd inicjalizacji MySQLStore:', err);
  } else {
    console.log('MySQLStore zainicjalizowany pomyślnie');
  }
});

/**
 * Middleware do zarządzania sesjami użytkowników.
 * @constant {Function} sessionMiddleware
 * @description Konfiguruje sesje z użyciem magazynu MySQL i ciasteczek HTTP.
 */
const sessionMiddleware = session({
  secret: 'tajny-klucz',
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // <-- dodaj to
  cookie: {
    httpOnly: true,
    secure: false, // ustaw na true jeśli masz HTTPS
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // Czas ważności ciasteczka (24 godziny)
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(csurf());

/**
 * Pobiera token CSRF dla żądań zabezpieczonych.
 * @route GET /auth/csrf-token
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} JSON z tokenem CSRF.
 */
app.get('/auth/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

/**
 * Middleware obsługujący błędy CSRF.
 * @param {Error} err - Obiekt błędu.
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @param {Function} next - Funkcja do przekazania sterowania do kolejnego middleware.
 */
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Błąd CSRF. Odśwież stronę.' });
  }
  next(err);
});

/**
 * Udostępnia sesje dla Socket.IO.
 * @description Umożliwia Socket.IO korzystanie z sesji Express.
 */
io.use(sharedSession(sessionMiddleware, {
  autoSave: true
}));

/**
 * Ustawia nagłówki Content-Security-Policy dla zabezpieczenia aplikacji.
 * @description Ogranicza źródła zasobów do zaufanych domen.
 */
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self';");
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Routing
app.use('/auth', require('./routes/auth'));
app.use('/room', require('./routes/room'));
const leaderboardRoutes = require('./routes/leaderboard');
app.use(leaderboardRoutes);

/**
 * Obiekt przechowujący dane o aktywnych pokojach gry.
 * @type {Object.<string, {players: Array<{id: string, username: string, flips?: number, timePlayed?: number, matches?: number}>, difficulty: string, timeRemaining: number, kicked: Array<string>, allowed?: Array<string>, interval?: NodeJS.Timeout, winner?: string}>}
 * @description Przechowuje informacje o graczach, poziomie trudności, czasie gry i statusie pokoju.
 */
const rooms = {};

/**
 * Inicjalizuje obsługę połączeń Socket.IO.
 * @description Obsługuje zdarzenia związane z dołączaniem do pokojów, rozgrywką i rozłączaniem graczy.
 */
io.on('connection', (socket) => {
  const user = socket.handshake.session.user;
  if (!user) {
    console.log('Brak usera w sesji');
    socket.disconnect();
    return;
  }

  /**
   * Obsługuje dołączanie gracza do pokoju gry.
   * @event join-room
   * @param {Object} data - Dane dołączania do pokoju.
   * @param {string} data.roomCode - Kod pokoju gry.
   * @param {string} data.difficulty - Poziom trudności gry.
   */
  socket.on('join-room', async ({roomCode, difficulty}) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], difficulty: difficulty, timeRemaining: 100, kicked: [] };
    }
  const room = rooms[roomCode];
  const username = socket.handshake.session?.user?.username;
  // Dodaj allowed jeśli nie istnieje (pierwszy gracz)
if (!room.allowed) {
  room.allowed = [username];
}
// Dodaj drugiego gracza do allowed
if (room.allowed.length < 2 && !room.allowed.includes(username)) {
  room.allowed.push(username);
}

// Teraz sprawdzaj uprawnienia
if (!room.allowed.includes(username)) {
  socket.emit('kicked');
  return;
}
if (room.kicked && room.kicked.includes(username)) {
  socket.emit('kicked');
  return;
}


    console.log('join-room event odebrany', roomCode, difficulty);
     if (typeof roomCode !== 'string') {
      console.log('Nieprawidłowe dane wejściowe');
    socket.emit('error', 'Nieprawidłowe dane wejściowe.');
    return;
  }
  if (!username) {
    console.log('Brak username');
    socket.emit('error', 'Brak autoryzacji.');
    return;
  }

    socket.join(roomCode);

    rooms[roomCode].players.push({ id: socket.id, username });

     // Powiadom pierwszego gracza o kodzie pokoju i poziomie trudności
     if (rooms[roomCode].players.length === 1) {
      io.to(socket.id).emit('room-created', { roomCode, difficulty: rooms[roomCode].difficulty });
    }
    console.log(rooms[roomCode].players.length);
  // Gdy dwóch graczy dołączy, rozpocznij grę
  if (rooms[roomCode].players.length === 2) {
    const player1 = rooms[roomCode].players[0];
    const player2 = rooms[roomCode].players[1];

    console.log(`Gra rozpoczęta w pokoju ${roomCode}`);
    console.log(`Gracz 1: ${player1.username}`);
    console.log(`Gracz 2: ${player2.username}`);
    console.log(`Poziom trudności: ${rooms[roomCode].difficulty}`);
    
    // Wyślij nazwę przeciwnika do obu graczy
    io.to(player1.id).emit('opponent-info', { opponentName: player2.username });
    io.to(player2.id).emit('opponent-info', { opponentName: player1.username });

    io.to(roomCode).emit('game-start', { difficulty: rooms[roomCode].difficulty });

    // Rozpocznij odliczanie czasu gry
    if (rooms[roomCode].interval) {
  clearInterval(rooms[roomCode].interval);
  }
    rooms[roomCode].interval = setInterval(() => {
      rooms[roomCode].timeRemaining--;
      io.to(roomCode).emit('time-update', { timeRemaining: rooms[roomCode].timeRemaining });

      if (rooms[roomCode].timeRemaining <= 0) {
        clearInterval(rooms[roomCode].interval);
        io.to(roomCode).emit('game-ended');
      }
    }, 1000);

  }

/**
   * Obsługuje zakończenie gry z powodu upływu czasu.
   * @function handleGameOver
   * @param {string} roomCode - Kod pokoju gry.
   * @description Porównuje wyniki graczy i wysyła status gry (wygrana, przegrana, remis).
   */
  function handleGameOver(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.players.length < 2) return;

    const [player1, player2] = room.players;

    // Porównaj liczbę dopasowań obu graczy
    const player1Matches = player1.matches || 0;
    const player2Matches = player2.matches || 0;

    let player1Status, player2Status;

    if (player1Matches > player2Matches) {
      player1Status = 'Koniec czasu Wygrana';
      player2Status = 'Koniec czasu Przegrana';
    } else if (player1Matches < player2Matches) {
      player1Status = 'Koniec czasu Przegrana';
      player2Status = 'Koniec czasu Wygrana';
    } else {
      player1Status = 'Koniec czasu Remis';
      player2Status = 'Koniec czasu Remis';
    }

    // Wyślij wyniki do obu graczy
    io.to(player1.id).emit('time-up-results', { status: player1Status });
    io.to(player2.id).emit('time-up-results', { status: player2Status });
  }

  // Obsługa zakończenia gry z powodu upływu czasu
  socket.on('game-over', ({ roomCode }) => {
    if (typeof roomCode !== 'string') return;
    handleGameOver(roomCode);
  });

/**
   * Obsługuje zakończenie gry przez gracza.
   * @event player-finished
   * @param {Object} data - Dane wyniku gracza.
   * @param {string} data.roomCode - Kod pokoju gry.
   * @param {string} data.playerId - ID gracza (Socket.IO).
   * @param {number} data.flips - Liczba odwróceń kart.
   * @param {number} data.timePlayed - Czas gry w sekundach.
   * @param {number} data.matches - Liczba dopasowań.
   */
  socket.on('player-finished', ({ roomCode, playerId, flips, timePlayed, matches }) => {
    if (
    typeof roomCode !== 'string' ||
    typeof playerId !== 'string' ||
    typeof flips !== 'number' ||
    typeof timePlayed !== 'number' ||
    typeof matches !== 'number'
  ) {
    socket.emit('error', 'Nieprawidłowe dane wejściowe.');
    return;
  }
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.flips = flips;
      player.timePlayed = timePlayed;
      player.matches = matches;
    }

    // Jeśli to pierwszy gracz, który kończy grę, przypisz mu status zwycięzcy
    if (!room.winner) {
      room.winner = playerId; // Zapisz ID zwycięzcy
      io.to(playerId).emit('your-results', { flips, timePlayed, matches, isWinner: true });
    } else {
      // Jeśli to drugi gracz, przypisz mu status przegranego
      io.to(playerId).emit('your-results', { flips, timePlayed, matches, isWinner: false });
    }
  });

  /**
   * Obsługuje rozłączenie gracza.
   * @event disconnect
   * @description Usuwa gracza z pokoju i powiadamia drugiego gracza o rozłączeniu.
   */
 socket.on('disconnect', () => {
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    // Dodaj username do listy wyrzuconych
    const username = socket.handshake.session?.user?.username;
    if (username) {
      room.kicked = room.kicked || [];
      room.kicked.push(username);
    }
    // Usuń gracza z listy
    room.players = room.players.filter(player => player.id !== socket.id);

    // Powiadom drugiego gracza
    io.to(roomCode).emit('opponent-disconnected');
    // NIE usuwaj pokoju!
  }
});
});


/**
   * Obsługuje kliknięcia gracza w grze.
   * @event click
   * @param {Object} data - Dane kliknięcia.
   * @param {string} data.roomCode - Kod pokoju gry.
   * @param {number} data.clicks - Liczba kliknięć.
   */
  socket.on('click', ({ roomCode, clicks }) => {
    if (typeof roomCode !== 'string' || typeof clicks !== 'number') return;
    socket.to(roomCode).emit('opponent-clicked', clicks);
  });

  /**
   * Obsługuje zakończenie gry.
   * @event game-over
   * @param {Object} data - Dane zakończenia gry.
   * @param {string} data.roomCode - Kod pokoju gry.
   */
  socket.on('game-over', ({ roomCode}) => {
    if (typeof roomCode !== 'string') return;
    socket.to(roomCode).emit('game-ended');
  });
});

/**
 * Testowy endpoint główny serwera.
 * @route GET /
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {string} Wiadomość potwierdzająca działanie serwera.
 */
app.get('/', (req, res) => {
  res.send('Serwer działa!');
});

server.listen(8080, () => console.log('Serwer + Socket.IO działa na http://localhost:8080'));

/**
 * Sprawdza status sesji użytkownika.
 * @route GET /session/check
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} JSON z informacją o zalogowaniu i nazwą użytkownika.
 */
app.get('/session/check', (req, res) => {
    if (req.session.user) {
      res.json({ loggedIn: true, username: req.session.user.username });
    } else {
      res.json({ loggedIn: false });
    }
  });

const db = require('./db');
const { create } = require('domain');

/**
 * Zapisuje wynik gry do bazy danych.
 * @route POST /game/save-result
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} req.body - Dane wyniku gry.
 * @param {string} req.body.playerName - Nazwa gracza.
 * @param {string} req.body.roomCode - Kod pokoju gry.
 * @param {number} req.body.flips - Liczba odwróceń kart.
 * @param {number} req.body.timePlayed - Czas gry w sekundach.
 * @param {number} req.body.matches - Liczba dopasowań.
 * @param {string} req.body.difficulty - Poziom trudności.
 * @param {string} req.body.startTime - Czas rozpoczęcia gry (ISO).
 * @param {string} req.body.endTime - Czas zakończenia gry (ISO).
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} JSON z potwierdzeniem zapisu lub błędem.
 */
app.post('/game/save-result', async (req, res) => {
    const { playerName, roomCode, flips, timePlayed, matches, difficulty, startTime, endTime } = req.body;

    try {
        const [room] = await db.query('SELECT id FROM rooms WHERE code = ?', [roomCode]);
        if (!room.length) return res.status(404).json({ error: 'Pokój nie znaleziony' });

        const roomId = room[0].id;
        await db.query(
            'INSERT INTO results (player_name, room_id, flips, time_played, matches, difficulty, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [playerName, roomId, flips, timePlayed, matches, difficulty, toMySQLDateTime(startTime),toMySQLDateTime(endTime)]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd zapisu wyniku' });
    }
});

/**
 * Pobiera ostatni wynik gry użytkownika i przeciwnika.
 * @route GET /game/last-result
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} JSON z wynikami gracza i przeciwnika lub błędem.
 */
app.get('/game/last-result', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Brak zalogowania' });

    const username = req.session.user.username;
    try {
        // Pobierz ostatni wynik gracza
        const [myResults] = await db.query(
            `SELECT * FROM results WHERE player_name = ? ORDER BY end_time DESC LIMIT 1`, [username]
        );
        if (!myResults.length) return res.json({ found: false });

        const myResult = myResults[0];

        // Pobierz wynik przeciwnika z tego samego room_id (ale innego gracza)
        const [opponentResults] = await db.query(
            `SELECT * FROM results WHERE room_id = ? AND player_name != ? ORDER BY end_time DESC LIMIT 1`,
            [myResult.room_id, username]
        );
        const opponentResult = opponentResults[0] || null;

        res.json({
            found: true,
            myResult,
            opponentResult
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania wyniku' });
    }
});

/**
 * Pobiera historię gier użytkownika.
 * @route GET /game/history
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} JSON z historią gier użytkownika lub błędem.
 */
app.get('/game/history', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Brak zalogowania' });

    const username = req.session.user.username;
    try {
        const [results] = await db.query(
             `SELECT 
                r1.*, 
                (SELECT player_name FROM results r2 WHERE r2.room_id = r1.room_id AND r2.player_name != r1.player_name LIMIT 1) AS opponent_name,
                (SELECT matches FROM results r2 WHERE r2.room_id = r1.room_id AND r2.player_name != r1.player_name LIMIT 1) AS opponent_matches,
                (SELECT flips FROM results r2 WHERE r2.room_id = r1.room_id AND r2.player_name != r1.player_name LIMIT 1) AS opponent_flips,
                (SELECT time_played FROM results r2 WHERE r2.room_id = r1.room_id AND r2.player_name != r1.player_name LIMIT 1) AS opponent_time_played
             FROM results r1
             WHERE r1.player_name = ?
             ORDER BY r1.end_time DESC`, 
            [username]
        );
        res.json({ found: !!results.length, results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania historii' });
    }
});

/**
 * Wylogowuje użytkownika i usuwa sesję.
 * @route POST /auth/logout
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @returns {Object} JSON z potwierdzeniem wylogowania.
 */
  app.post('/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

