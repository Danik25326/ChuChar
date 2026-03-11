const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|mp3|wav|ogg|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.split('/')[1]);
  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Тип файлу не підтримується'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не завантажено' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    url: fileUrl,
    original_filename: req.file.originalname,
    stored_filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
}

module.exports = { upload, uploadFile };
