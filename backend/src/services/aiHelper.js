const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function getAIResponse(chatId, message, db, members) {
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
    const systemMessage = "Ти корисний асистент у месенджері. Відповідай мовою користувача. Якщо тобі надіслали файл, проаналізуй його за наявною інформацією. Для зображень опиши, що на них зображено.";
    const messages = [{ role: "system", content: systemMessage }];

    history.forEach(msg => {
      let content = msg.content;
      if (msg.type !== 'text') {
        // Для нетекстових повідомлень передаємо тип та назву
        content = `[${msg.type}] ${msg.original_filename || 'файл'}`;
      }
      messages.push({
        role: msg.userId === 1 ? "assistant" : "user",
        content: content
      });
    });

    // Додаємо поточне повідомлення
    let userContent;
    if (message.type !== 'text') {
      userContent = `[${message.type}] ${message.original_filename || 'файл'}`;
    } else {
      userContent = message.content;
    }
    messages.push({ role: "user", content: userContent });

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-4-vision-preview", // або модель з vision, якщо доступна
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const aiContent = completion.choices[0].message.content;

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
