async function createChat(req, res) {
  const { name, isGroup, memberIds } = req.body;
  const userId = req.user.id;
  const db = req.db;

  // Для особистого чату memberIds має бути [id_іншого_користувача]
  if (!isGroup && (!memberIds || memberIds.length !== 1)) {
    return res.status(400).json({ error: 'Personal chat requires exactly one other user' });
  }

  try {
    // Якщо це особистий чат, перевіримо, чи він уже існує
    if (!isGroup) {
      const otherUserId = memberIds[0];
      // Шукаємо спільний чат між userId та otherUserId, який не є групою
      const existing = await db.get(
        `SELECT c.id FROM chats c
         JOIN chat_members cm1 ON c.id = cm1.chat_id
         JOIN chat_members cm2 ON c.id = cm2.chat_id
         WHERE c.is_group = 0 AND cm1.user_id = ? AND cm2.user_id = ?`,
        userId, otherUserId
      );
      if (existing) {
        return res.status(200).json({ chatId: existing.id, exists: true });
      }
    }

    // Створюємо чат
    const result = await db.run(
      'INSERT INTO chats (name, is_group) VALUES (?, ?)',
      name || null, isGroup ? 1 : 0
    );
    const chatId = result.lastID;

    // Додаємо творця
    await db.run(
      'INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)',
      chatId, userId
    );

    // Додаємо інших учасників
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
    const chats = await db.all(
      `SELECT c.* FROM chats c
       JOIN chat_members cm ON c.id = cm.chat_id
       WHERE cm.user_id = ?
       ORDER BY c.created_at DESC`,
      userId
    );
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
    const chat = await db.get(
      `SELECT c.* FROM chats c
       JOIN chat_members cm ON c.id = cm.chat_id
       WHERE c.id = ? AND cm.user_id = ?`,
      chatId, userId
    );
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
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const db = req.db;

  try {
    const messages = await db.all(
      `SELECT m.*, u.username FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.chat_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      chatId, parseInt(limit), parseInt(offset)
    );
    // Повертаємо у хронологічному порядку
    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getChatMembers(req, res) {
  const { chatId } = req.params;
  const db = req.db;
  try {
    const members = await db.all(
      `SELECT u.id, u.username FROM users u
       JOIN chat_members cm ON u.id = cm.user_id
       WHERE cm.chat_id = ?`,
      chatId
    );
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { createChat, getUserChats, getChat, getChatMessages, getChatMembers };
