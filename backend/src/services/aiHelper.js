const Groq = require('groq-sdk');
const path = require('path');
const { extractTextFromFile, transcribeAudio } = require('./fileProcessor');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function getAIResponse(chatId, message, db, members) {
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
    history.reverse();

    // Формуємо системне повідомлення
    const systemMessage = `Ти корисний асистент у месенджері. Відповідай мовою користувача.
    Якщо тобі надіслали файл, проаналізуй його вміст, якщо він доступний.
    Для зображень опиши, що на них зображено (якщо є доступ до vision).
    Для голосових повідомлень використовуй розшифровку, якщо вона надана.`;
    
    const groqMessages = [{ role: "system", content: systemMessage }];

    // Додаємо історію повідомлень
    for (const msg of history) {
      let content = msg.content;
      
      // Якщо це нетекстове повідомлення, спробуємо отримати його вміст
      if (msg.type !== 'text') {
        if (msg.type === 'file' && msg.mime && msg.content) {
          const filePath = path.join(__dirname, '../../uploads', path.basename(msg.content));
          const extractedText = await extractTextFromFile(filePath, msg.mime);
          if (extractedText) {
            content = `[Файл: ${msg.original_filename}]\nВміст файлу:\n${extractedText}`;
          } else {
            content = `[Файл: ${msg.original_filename}] (не вдалося витягнути текст)`;
          }
        } else if (msg.type === 'audio' && msg.content) {
          const filePath = path.join(__dirname, '../../uploads', path.basename(msg.content));
          const transcription = await transcribeAudio(filePath);
          if (transcription) {
            content = `[Голосове повідомлення]\nРозшифровка: ${transcription}`;
          } else {
            content = `[Голосове повідомлення: ${msg.original_filename}] (не вдалося розшифрувати)`;
          }
        } else if (msg.type === 'image') {
          content = `[Зображення: ${msg.original_filename}]`;
        } else {
          content = `[${msg.type}] ${msg.original_filename || 'файл'}`;
        }
      }
      
      groqMessages.push({
        role: msg.userId === 1 ? "assistant" : "user",
        content: content
      });
    }

    // Додаємо поточне повідомлення
    let userContent;
    if (message.type !== 'text') {
      if (message.type === 'file' && message.mime && message.content) {
        const filePath = path.join(__dirname, '../../uploads', path.basename(message.content));
        const extractedText = await extractTextFromFile(filePath, message.mime);
        if (extractedText) {
          userContent = `[Файл: ${message.original_filename}]\nВміст файлу:\n${extractedText}`;
        } else {
          userContent = `[Файл: ${message.original_filename}] (не вдалося витягнути текст)`;
        }
      } else if (message.type === 'audio' && message.content) {
        const filePath = path.join(__dirname, '../../uploads', path.basename(message.content));
        const transcription = await transcribeAudio(filePath);
        if (transcription) {
          userContent = `[Голосове повідомлення]\nРозшифровка: ${transcription}`;
        } else {
          userContent = `[Голосове повідомлення: ${message.original_filename}] (не вдалося розшифрувати)`;
        }
      } else if (message.type === 'image') {
        userContent = `[Зображення: ${message.original_filename}]`;
      } else {
        userContent = `[${message.type}] ${message.original_filename || 'файл'}`;
      }
    } else {
      userContent = message.content;
    }
    groqMessages.push({ role: "user", content: userContent });

    console.log('📤 Sending to Groq:', groqMessages[groqMessages.length-1].content.substring(0, 200) + '...');

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 1000
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
    console.error('❌ AI error details:', {
      message: error.message,
      status: error.status,
      data: error.response?.data
    });
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
