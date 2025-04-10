const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'tajny-klucz',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', require('./routes/auth'));
app.use('/room', require('./routes/room'));

// Socket.IO logika
const rooms = {}; // Przechowuje listy socket.id dla każdego pokoju

io.on('connection', (socket) => {
  console.log('Połączono:', socket.id);

  socket.on('join-room', (roomCode) => {
    socket.join(roomCode);

    if (!rooms[roomCode]) {
      rooms[roomCode] = [];
    }

    rooms[roomCode].push(socket.id);

    // Powiadom pierwszego gracza o kodzie pokoju
    if (rooms[roomCode].length === 1) {
      io.to(socket.id).emit('room-created', roomCode);
  }

  if (rooms[roomCode].length === 2) {
      io.to(roomCode).emit('game-start');
  }

  socket.on('disconnect', () => {
      rooms[roomCode] = rooms[roomCode].filter(id => id !== socket.id);
      if (rooms[roomCode].length === 0) {
          delete rooms[roomCode];
      } else {
          // Powiadom pozostałego gracza o rozłączeniu przeciwnika
          io.to(roomCode).emit('opponent-disconnected');
      }
  });
});

  socket.on('click', ({ roomCode, clicks }) => {
    socket.to(roomCode).emit('opponent-clicked', clicks);
  });

  socket.on('game-over', ({ roomCode }) => {
    socket.to(roomCode).emit('game-ended');
  });
});

app.get('/', (req, res) => {
  res.send('Serwer działa!');
});

server.listen(8080, () => console.log('Serwer + Socket.IO działa na http://localhost:3000'));

app.get('/session/check', (req, res) => {
    if (req.session.user) {
      res.json({ loggedIn: true, username: req.session.user.username });
    } else {
      res.json({ loggedIn: false });
    }
  });

  app.post('/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
  
