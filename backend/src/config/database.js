const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function initializeDatabase() {
  const db = await open({
    filename: process.env.DATABASE_PATH || path.join(__dirname, '../../data/chuchar.sqlite'),
    driver: sqlite3.Database
  });

  // Створення таблиць
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log('Database initialized');
  return db;
}

module.exports = { initializeDatabase };
