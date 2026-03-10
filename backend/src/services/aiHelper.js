const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function getAIResponse(chatId, userMessage, db, members) {
  try {
    // Отримуємо останні повідомлення для контексту
    const history = await db.all(
      `SELECT m.*, u.username FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.chat_id = ?
       ORDER BY m.created_at DESC
       LIMIT 10`,
      chatId
    );
    history.reverse();

    // Формуємо повідомлення для Groq
    const messages = [
      { role: "system", content: "Ти корисний асистент у месенджері. Відповідай мовою користувача. Якщо тобі надіслали файл, згадай про це у відповіді." }
    ];

    history.forEach(msg => {
      let content = msg.content;
      if (msg.type !== 'text') {
        content = `[${msg.type}] ${msg.original_filename || 'файл'}`;
      }
      messages.push({
        role: msg.userId === 1 ? "assistant" : "user",
        content: content
      });
    });

    // Додаємо поточне повідомлення
    messages.push({ role: "user", content: userMessage });

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b", // або інша модель Groq
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const aiContent = completion.choices[0].message.content;

    // Зберігаємо відповідь AI в БД
    const result = await db.run(
      'INSERT INTO messages (chat_id, user_id, content, type) VALUES (?, ?, ?, ?)',
      chatId, 1, aiContent, 'text'
    );

    return {
      id: result.lastID,
      chatId,
      userId: 1,
      username: 'AI Assistant',
      type: 'text',
      content: aiContent,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI error:', error);
    return {
      id: Date.now(),
      chatId,
      userId: 1,
      username: 'AI Assistant',
      type: 'text',
      content: 'Вибач, сталася помилка. Спробуй пізніше.',
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = { getAIResponse };
