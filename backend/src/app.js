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
const { upload, uploadFile } = require('./controllers/uploadController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' } // У продакшені краще обмежити доменом фронтенду
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Підключення до бази даних
(async () => {
  try {
    const db = await initializeDatabase();
    console.log('Database connected');

    // Додаємо db до запитів
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // Маршрути API
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/chats', chatRoutes);

    // Маршрут для завантаження файлів
    app.post('/api/upload', authenticateToken, upload.single('file'), uploadFile);

    // Статична папка для завантажених файлів
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Маршрут для перевірки автентифікації
    app.get('/api/auth/me', authenticateToken, (req, res) => {
      res.json({ user: req.user });
    });

    // Маршрут для перевірки здоров'я сервера
    app.get('/api/health', (req, res) => {
      res.send('ChuChar backend is running!');
    });

    // Якщо ви не використовуєте окремий статичний сайт, можна роздавати фронтенд звідси
    // Але краще мати окремий Static Site на Render. Залишимо це закоментованим.
    // const clientBuildPath = path.join(__dirname, '../../web-client/dist');
    // app.use(express.static(clientBuildPath));
    // app.get('*', (req, res) => {
    //   if (!req.path.startsWith('/api')) {
    //     res.sendFile(path.join(clientBuildPath, 'index.html'));
    //   } else {
    //     res.status(404).json({ error: 'API route not found' });
    //   }
    // });

    // Для кореневого маршруту просто повідомлення
    app.get('/', (req, res) => {
      res.send('ChuChar API. Використовуйте /api/...');
    });

    setupSocket(io, db);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize:', err);
    process.exit(1);
  }
})();
