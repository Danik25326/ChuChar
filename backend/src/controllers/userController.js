async function getUser(req, res) {
  const { id } = req.params;
  const db = req.db;

  try {
    const user = await db.get('SELECT id, username, avatar, created_at FROM users WHERE id = ?', id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function searchUsers(req, res) {
  const { q } = req.query;
  if (!q) return res.json([]);

  const db = req.db;
  try {
    // SQLite: використовуємо LIKE з COLLATE NOCASE для нечутливості до регістру
    const users = await db.all(
      `SELECT id, username, avatar FROM users 
       WHERE username LIKE ? COLLATE NOCASE AND id != ?
       LIMIT 20`,
      [`%${q}%`, req.user.id]
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const db = req.db;
  const userId = req.user.id;
  const avatarUrl = `/uploads/${req.file.filename}`;

  try {
    await db.run('UPDATE users SET avatar = ? WHERE id = ?', avatarUrl, userId);
    res.json({ avatar: avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getUser, searchUsers, updateAvatar };
