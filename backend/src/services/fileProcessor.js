const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { extractText } = require('pptx2txt');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Витягує текст з різних типів файлів
 * @param {string} filePath - шлях до файлу
 * @param {string} mimeType - MIME тип файлу
 * @returns {Promise<string|null>} - витягнутий текст або null
 */
async function extractTextFromFile(filePath, mimeType) {
  try {
    // PDF
    if (mimeType.includes('pdf')) {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    }
    
    // Word документи
    if (mimeType.includes('word') || mimeType.includes('document')) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    
    // PowerPoint презентації
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      const text = await extractText(filePath);
      return text;
    }
    
    // Текстові файли
    if (mimeType.includes('text/plain')) {
      return await fs.readFile(filePath, 'utf8');
    }
    
    // Інші типи поки що не підтримуються
    return null;
  } catch (err) {
    console.error('❌ Error extracting text from file:', err);
    return null;
  }
}

/**
 * Транскрибує аудіофайл за допомогою Whisper
 * @param {string} filePath - шлях до аудіофайлу
 * @returns {Promise<string|null>} - розпізнаний текст
 */
async function transcribeAudio(filePath) {
  try {
    const response = await openai.audio.transcriptions.create({
      file: require('fs').createReadStream(filePath),
      model: "whisper-1",
    });
    return response.text;
  } catch (err) {
    console.error('❌ Error transcribing audio:', err);
    return null;
  }
}

module.exports = { extractTextFromFile, transcribeAudio };
