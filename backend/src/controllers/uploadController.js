const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Налаштування зберігання
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Фільтр для допустимих типів файлів
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.split('/')[1]); // спрощено
  
  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Тип файлу не підтримується'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не завантажено' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  // Повертаємо також оригінальну назву для відображення
  res.json({ 
    url: fileUrl,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
}

module.exports = { upload, uploadFile };
