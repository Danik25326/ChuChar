async function createChat(req, res) {
  const { name, isGroup, memberIds } = req.body;
  const userId = req.user.id;
  const db = req.db;

  try {
    const result = await db.run(
      'INSERT INTO chats (name, is_group) VALUES (?, ?)',
      name || null, isGroup ? 1 : 0
    );
    const chatId = result.lastID;

    await db.run(
      'INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)',
      chatId, userId
    );

    if (memberIds && Array.isArray(memberIds)) {
      for (const memberId of memberIds) {
        if (memberId !== userId) {
          await db.run(
            'INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)',
            chatId, memberId
          );
        }
      }
    }

    res.status(201).json({ chatId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getUserChats(req, res) {
  const userId = req.user.id;
  const db = req.db;

  try {
    const chats = await db.all(`
      SELECT c.* FROM chats c
      JOIN chat_members cm ON c.id = cm.chat_id
      WHERE cm.user_id = ?
      ORDER BY c.created_at DESC
    `, userId);
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getChat(req, res) {
  const { chatId } = req.params;
  const userId = req.user.id;
  const db = req.db;

  try {
    const chat = await db.get(`
      SELECT c.* FROM chats c
      JOIN chat_members cm ON c.id = cm.chat_id
      WHERE c.id = ? AND cm.user_id = ?
    `, chatId, userId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getChatMessages(req, res) {
  const { chatId } = req.params;
  const { limit } = req.query;
  const db = req.db;

  try {
    let query = `
      SELECT m.*, u.username FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
    `;
    if (limit) {
      query += ` LIMIT ?`;
      const messages = await db.all(query, chatId, parseInt(limit));
      res.json(messages);
    } else {
      const messages = await db.all(query, chatId);
      res.json(messages);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { createChat, getUserChats, getChat, getChatMessages };
