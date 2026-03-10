const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Налаштування зберігання файлів
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    // Створюємо папку, якщо її немає
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Генеруємо унікальне ім'я файлу
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Фільтр для типів файлів (можна розширити)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Дозволені тільки зображення та відео'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// Контролер для завантаження файлу
async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не завантажено' });
  }
  
  // Формуємо URL для доступу до файлу
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
}

module.exports = { upload, uploadFile };
