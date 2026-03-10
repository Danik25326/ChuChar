const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function getAIResponse(chatId, userMessage, userId, db) {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userMessage }],
    });

    const aiContent = completion.data.choices[0].message.content;

    const result = await db.query(
      'INSERT INTO messages (chat_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, created_at',
      [chatId, 1, aiContent]
    );

    return {
      id: result.rows[0].id,
      chatId,
      userId: 1,
      username: 'AI Assistant',
      content: aiContent,
      createdAt: result.rows[0].created_at
    };
  } catch (error) {
    console.error('AI error:', error);
    return {
      id: Date.now(),
      chatId,
      userId: 1,
      username: 'AI Assistant',
      content: 'Вибач, сталася помилка. Спробуй пізніше.',
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = { getAIResponse };
