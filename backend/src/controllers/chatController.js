async function createChat(req, res) {
  const { name, isGroup, memberIds } = req.body; // memberIds = [userId, ...]
  const userId = req.user.id; // з мідлвари авторизації
  const db = req.db;

  try {
    const result = await db.run(
      'INSERT INTO chats (name, is_group) VALUES (?, ?)',
      name || null, isGroup ? 1 : 0
    );
    const chatId = result.lastID;

    // Додаємо творця чату
    await db.run(
      'INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)',
      chatId, userId
    );

    // Додаємо інших учасників (якщо є)
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

async function getChatMessages(req, res) {
  const { chatId } = req.params;
  const db = req.db;

  try {
    const messages = await db.all(`
      SELECT m.*, u.username FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
    `, chatId);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { createChat, getUserChats, getChatMessages };
