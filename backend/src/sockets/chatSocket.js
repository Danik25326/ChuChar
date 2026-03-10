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

    socket.on('send-message', async ({ chatId, type = 'text', content }) => {
      // Перевіряємо, чи користувач є учасником чату
      const member = await db.get(
        'SELECT 1 FROM chat_members WHERE chat_id = ? AND user_id = ?',
        chatId, socket.user.id
      );
      if (!member) {
        socket.emit('error', 'You are not a member of this chat');
        return;
      }

      try {
        // Вставляємо повідомлення в БД
        const result = await db.run(
          'INSERT INTO messages (chat_id, user_id, content, type) VALUES (?, ?, ?, ?)',
          chatId, socket.user.id, content, type
        );

        const message = {
          id: result.lastID,
          chatId,
          userId: socket.user.id,
          username: socket.user.username,
          type,
          content,
          createdAt: new Date().toISOString()
        };

        // Відправляємо всім учасникам чату
        io.to(`chat:${chatId}`).emit('new-message', message);

        // Перевіряємо, чи є в чаті AI Assistant (id=1) і чи повідомлення не від самого AI
        const members = await db.all('SELECT user_id FROM chat_members WHERE chat_id = ?', chatId);
        const hasAI = members.some(m => m.user_id === 1);
        
        if (hasAI && socket.user.id !== 1) {
          // Викликаємо AI для відповіді
          const aiService = require('../services/aiHelper');
          const aiReply = await aiService.getAIResponse(chatId, content, db, members);
          io.to(`chat:${chatId}`).emit('new-message', aiReply);
        }
        
        // Також залишаємо стару логіку для команди /ai в будь-якому чаті
        if (type === 'text' && content.startsWith('/ai ')) {
          const aiService = require('../services/aiHelper');
          const aiReply = await aiService.getAIResponse(chatId, content.slice(4), db, members);
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
