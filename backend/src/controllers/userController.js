async function getUser(req, res) {
  const { id } = req.params;
  const db = req.db;

  try {
    const user = await db.get('SELECT id, username, created_at FROM users WHERE id = ?', id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getUser };
