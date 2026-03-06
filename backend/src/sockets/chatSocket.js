const jwt = require('jsonwebtoken');

function setupSocket(io, db) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.id} connected`);

    // Приєднання до кімнат чатів
    socket.on('join-chats', async (chatIds) => {
      chatIds.forEach(chatId => socket.join(`chat:${chatId}`));
    });

    // Відправка повідомлення
    socket.on('send-message', async ({ chatId, content }) => {
      try {
        // Збереження в БД
        const result = await db.run(
          'INSERT INTO messages (chat_id, user_id, content) VALUES (?, ?, ?)',
          chatId, socket.user.id, content
        );

        const message = {
          id: result.lastID,
          chatId,
          userId: socket.user.id,
          username: socket.user.username,
          content,
          createdAt: new Date().toISOString()
        };

        // Відправка всім у кімнаті
        io.to(`chat:${chatId}`).emit('new-message', message);

        // Якщо це повідомлення для ШІ (наприклад, починається з "/ai")
        if (content.startsWith('/ai ')) {
          const aiService = require('../services/aiHelper');
          const aiReply = await aiService.getAIResponse(content.slice(4), socket.user.id, db);
          // Відправка відповіді ШІ як окремого повідомлення
          io.to(`chat:${chatId}`).emit('new-message', aiReply);
        }
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.id} disconnected`);
    });
  });
}

module.exports = { setupSocket };
