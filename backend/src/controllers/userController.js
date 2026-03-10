async function getUser(req, res) {
  const { id } = req.params;
  const db = req.db;

  try {
    const result = await db.query('SELECT id, username, created_at FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
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
    const result = await db.query(
      'SELECT id, username FROM users WHERE username ILIKE $1 LIMIT 10',
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getUser, searchUsers };
