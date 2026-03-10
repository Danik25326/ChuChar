const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function getAIResponse(chatId, userMessage, db, members) {
  try {
    // Отримуємо останні 10 повідомлень для контексту
    const history = await db.all(
      `SELECT m.*, u.username FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.chat_id = ?
       ORDER BY m.created_at DESC
       LIMIT 10`,
      chatId
    );
    history.reverse(); // хронологічний порядок

    // Формуємо повідомлення для OpenAI
    const messages = [
      { role: "system", content: "Ти корисний асистент у месенджері. Відповідай мовою користувача." }
    ];
    
    history.forEach(msg => {
      messages.push({
        role: msg.userId === 1 ? "assistant" : "user",
        content: msg.content
      });
    });

    // Додаємо поточне повідомлення, якщо воно не дублюється (останнє в історії)
    if (history.length === 0 || history[history.length-1].content !== userMessage) {
      messages.push({ role: "user", content: userMessage });
    }

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const aiContent = completion.data.choices[0].message.content;

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
