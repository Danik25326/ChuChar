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
      for (const chatId of chatIds) {
        const member = await db.get(
          'SELECT 1 FROM chat_members WHERE chat_id = ? AND user_id = ?',
          chatId, socket.user.id
        );
        if (member) {
          socket.join(`chat:${chatId}`);
        }
      }
    });

    socket.on('send-message', async ({ chatId, content }) => {
      const member = await db.get(
        'SELECT 1 FROM chat_members WHERE chat_id = ? AND user_id = ?',
        chatId, socket.user.id
      );
      if (!member) {
        socket.emit('error', 'You are not a member of this chat');
        return;
      }

      try {
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

        io.to(`chat:${chatId}`).emit('new-message', message);

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
