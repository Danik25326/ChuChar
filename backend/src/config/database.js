const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

async function initializeDatabase() {
  const dbDir = path.dirname(process.env.DATABASE_PATH || path.join(__dirname, '../../data/chuchar.sqlite'));
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = await open({
    filename: process.env.DATABASE_PATH || path.join(__dirname, '../../data/chuchar.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      is_group BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      chat_id INTEGER,
      user_id INTEGER,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (chat_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      original_filename TEXT,
      mime TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Додаємо відсутні колонки
  try {
    await db.get('SELECT avatar FROM users LIMIT 1');
  } catch (err) {
    await db.exec('ALTER TABLE users ADD COLUMN avatar TEXT;');
  }

  try {
    await db.get('SELECT original_filename FROM messages LIMIT 1');
  } catch (err) {
    await db.exec('ALTER TABLE messages ADD COLUMN original_filename TEXT;');
  }
  try {
    await db.get('SELECT mime FROM messages LIMIT 1');
  } catch (err) {
    await db.exec('ALTER TABLE messages ADD COLUMN mime TEXT;');
  }

  // Створення AI Assistant, якщо не існує
  const aiUser = await db.get('SELECT id FROM users WHERE id = 1');
  if (!aiUser) {
    const hashedPassword = await bcrypt.hash('ai_assistant', 10);
    await db.run(
      'INSERT INTO users (id, username, password, avatar) VALUES (1, ?, ?, ?)',
      'AI Assistant', hashedPassword, '/uploads/ai-avatar.png' // дефолтна аватарка
    );
  }

  console.log('Database initialized at', process.env.DATABASE_PATH);
  return db;
}

module.exports = { initializeDatabase };
