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

    socket.on('join-chats', async (chatIds) => {
      // Перевіряємо, чи користувач є учасником кожного чату
      for (const chatId of chatIds) {
        const res = await db.query(
          'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
          [chatId, socket.user.id]
        );
        if (res.rows.length > 0) {
          socket.join(`chat:${chatId}`);
        }
      }
    });

    socket.on('send-message', async ({ chatId, content }) => {
      // Перевіряємо членство
      const memberCheck = await db.query(
        'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
        [chatId, socket.user.id]
      );
      if (memberCheck.rows.length === 0) {
        socket.emit('error', 'You are not a member of this chat');
        return;
      }

      try {
        const result = await db.query(
          'INSERT INTO messages (chat_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, created_at',
          [chatId, socket.user.id, content]
        );
        const message = {
          id: result.rows[0].id,
          chatId,
          userId: socket.user.id,
          username: socket.user.username,
          content,
          createdAt: result.rows[0].created_at
        };

        io.to(`chat:${chatId}`).emit('new-message', message);

        // AI помічник (якщо потрібно)
        if (content.startsWith('/ai ')) {
          const aiService = require('../services/aiHelper');
          const aiReply = await aiService.getAIResponse(chatId, content.slice(4), socket.user.id, db);
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
