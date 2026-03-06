require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { initializeDatabase } = require('./config/database');
const { setupSocket } = require('./sockets/chatSocket');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
// Простий маршрут для перевірки роботи сервера (healthcheck)
app.get('/', (req, res) => {
  res.send('ChuChar backend is running!');
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Підключення до БД
const db = initializeDatabase();

// Додаємо db до запитів (через middleware)
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Маршрути
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

// WebSocket
setupSocket(io, db);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
