const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function getAIResponse(userMessage, userId, db) {
  try {
    // Виклик OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userMessage }],
    });

    const aiContent = completion.data.choices[0].message.content;

    // Збереження відповіді ШІ в БД (як повідомлення від спеціального користувача, наприклад, id = 1 для ШІ)
    // Припустимо, що ШІ має ID = 1 (потрібно створити такого користувача)
    const result = await db.run(
      'INSERT INTO messages (chat_id, user_id, content) VALUES (?, ?, ?)',
      chatId, 1, aiContent
    );

    return {
      id: result.lastID,
      chatId,
      userId: 1,
      username: 'AI Assistant',
      content: aiContent,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI error:', error);
    return {
      chatId,
      userId: 1,
      username: 'AI Assistant',
      content: 'Вибач, сталася помилка. Спробуй пізніше.',
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = { getAIResponse };
