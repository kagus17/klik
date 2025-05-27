const express = require('express');
const session = require('express-session');
const sharedSession = require('socket.io-express-session');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const csurf = require('csurf');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const dbConfig = require('./dbConfig'); // Upewnij się, że masz poprawny plik konfiguracyjny
const MySQLStore = require('express-mysql-session')(session);


const sessionStore = new MySQLStore(dbConfig);

const sessionMiddleware = session({
  secret: 'tajny-klucz',
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // <-- dodaj to
  cookie: {
    httpOnly: true,
    secure: true, // ustaw na true jeśli masz HTTPS
    sameSite: 'lax'
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(sessionMiddleware);

app.use(csurf());

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Błąd CSRF. Odśwież stronę.' });
  }
  next(err);
});

// Udostępnij sesję w Socket.IO
io.use(sharedSession(sessionMiddleware, {
  autoSave: true
}));

/*app.use(session({
  secret: 'tajny-klucz',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  if (req.session.user) {
    console.log(`Zalogowany użytkownik: ${req.session.user.username}`);
  } else {
    console.log('Brak zalogowanego użytkownika');
  }
  next();
});*/

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self';");
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', require('./routes/auth'));
app.use('/room', require('./routes/room'));
const leaderboardRoutes = require('./routes/leaderboard');
app.use(leaderboardRoutes);

// Socket.IO logika
const rooms = {}; // Przechowuje listy socket.id dla każdego pokoju

io.on('connection', (socket) => {
  const user = socket.handshake.session.user;
  if (!user) {
    console.log('Brak usera w sesji');
    socket.disconnect();
    return;
  }

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

  // Funkcja obsługująca zakończenie gry z powodu upływu czasu
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

  // Obsługa zakończenia gry przez gracza
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

  socket.on('click', ({ roomCode, clicks }) => {
    if (typeof roomCode !== 'string' || typeof clicks !== 'number') return;
    socket.to(roomCode).emit('opponent-clicked', clicks);
  });

  socket.on('game-over', ({ roomCode}) => {
    if (typeof roomCode !== 'string') return;
    socket.to(roomCode).emit('game-ended');
  });
});

app.get('/', (req, res) => {
  res.send('Serwer działa!');
});

server.listen(8080, () => console.log('Serwer + Socket.IO działa na http://localhost:8080'));

app.get('/session/check', (req, res) => {
    if (req.session.user) {
      res.json({ loggedIn: true, username: req.session.user.username });
    } else {
      res.json({ loggedIn: false });
    }
  });

const db = require('./db');

app.post('/game/save-result', async (req, res) => {
    const { playerName, roomCode, flips, timePlayed, matches, difficulty, startTime, endTime } = req.body;

    try {
        const [room] = await db.query('SELECT id FROM rooms WHERE code = ?', [roomCode]);
        if (!room.length) return res.status(404).json({ error: 'Pokój nie znaleziony' });

        const roomId = room[0].id;
        await db.query(
            'INSERT INTO results (player_name, room_id, flips, time_played, matches, difficulty, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [playerName, roomId, flips, timePlayed, matches, difficulty, startTime, endTime]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd zapisu wyniku' });
    }
});

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

  app.post('/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

