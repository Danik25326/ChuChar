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
      const existing = await db.query(
        `SELECT c.id FROM chats c
         JOIN chat_members cm1 ON c.id = cm1.chat_id
         JOIN chat_members cm2 ON c.id = cm2.chat_id
         WHERE c.is_group = false AND cm1.user_id = $1 AND cm2.user_id = $2`,
        [userId, otherUserId]
      );
      if (existing.rows.length > 0) {
        return res.status(200).json({ chatId: existing.rows[0].id, exists: true });
      }
    }

    // Створюємо чат
    const chatResult = await db.query(
      'INSERT INTO chats (name, is_group) VALUES ($1, $2) RETURNING id',
      [name || null, isGroup || false]
    );
    const chatId = chatResult.rows[0].id;

    // Додаємо творця
    await db.query(
      'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)',
      [chatId, userId]
    );

    // Додаємо інших учасників
    if (memberIds && Array.isArray(memberIds)) {
      for (const memberId of memberIds) {
        if (memberId !== userId) {
          await db.query(
            'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [chatId, memberId]
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
    const chats = await db.query(
      `SELECT c.* FROM chats c
       JOIN chat_members cm ON c.id = cm.chat_id
       WHERE cm.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    res.json(chats.rows);
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
    const chat = await db.query(
      `SELECT c.* FROM chats c
       JOIN chat_members cm ON c.id = cm.chat_id
       WHERE c.id = $1 AND cm.user_id = $2`,
      [chatId, userId]
    );
    if (chat.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat.rows[0]);
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
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
    `;
    const params = [chatId];
    if (limit) {
      query += ` LIMIT $2`;
      params.push(parseInt(limit));
    }
    const messages = await db.query(query, params);
    res.json(messages.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getChatMembers(req, res) {
  const { chatId } = req.params;
  const db = req.db;
  try {
    const members = await db.query(
      `SELECT u.id, u.username FROM users u
       JOIN chat_members cm ON u.id = cm.user_id
       WHERE cm.chat_id = $1`,
      [chatId]
    );
    res.json(members.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { createChat, getUserChats, getChat, getChatMessages, getChatMembers };
