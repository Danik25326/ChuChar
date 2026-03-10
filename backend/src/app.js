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
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
  try {
    const db = await initializeDatabase();
    console.log('Database connected');

    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/chats', chatRoutes);

    app.get('/api/auth/me', authenticateToken, (req, res) => {
      res.json({ user: req.user });
    });

    app.get('/api/health', (req, res) => {
      res.send('ChuChar backend is running!');
    });

    app.use(express.static(path.join(__dirname, '../../web-client/dist')));

    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../../web-client/dist/index.html'));
      } else {
        res.status(404).json({ error: 'API route not found' });
      }
    });

    setupSocket(io, db);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();
