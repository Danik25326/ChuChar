async function getUserChats(req, res) {
  const userId = req.user.id;
  const db = req.db;

  try {
    // Отримуємо чати з інформацією про іншого учасника для особистих чатів
    const chats = await db.all(
      `SELECT c.*, 
        (SELECT GROUP_CONCAT(u.username, ', ') 
         FROM chat_members cm 
         JOIN users u ON cm.user_id = u.id 
         WHERE cm.chat_id = c.id AND u.id != ?) as other_usernames
       FROM chats c
       JOIN chat_members cm ON c.id = cm.chat_id
       WHERE cm.user_id = ?
       ORDER BY c.created_at DESC`,
      userId, userId
    );

    // Для особистих чатів встановлюємо назву як ім'я іншого учасника
    const chatsWithNames = chats.map(chat => {
      if (!chat.is_group && chat.other_usernames) {
        chat.displayName = chat.other_usernames;
      } else {
        chat.displayName = chat.name || `Чат #${chat.id}`;
      }
      return chat;
    });

    res.json(chatsWithNames);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Також оновіть getChat, щоб повертати displayName
async function getChat(req, res) {
  const { chatId } = req.params;
  const userId = req.user.id;
  const db = req.db;

  try {
    const chat = await db.get(
      `SELECT c.*,
        (SELECT GROUP_CONCAT(u.username, ', ') 
         FROM chat_members cm 
         JOIN users u ON cm.user_id = u.id 
         WHERE cm.chat_id = c.id AND u.id != ?) as other_usernames
       FROM chats c
       JOIN chat_members cm ON c.id = cm.chat_id
       WHERE c.id = ? AND cm.user_id = ?`,
      userId, chatId, userId
    );
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    if (!chat.is_group && chat.other_usernames) {
      chat.displayName = chat.other_usernames;
    } else {
      chat.displayName = chat.name || `Чат #${chat.id}`;
    }
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
