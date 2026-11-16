import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { JSONFilePreset } from 'lowdb/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Setup Database (db.json)
const db = await JSONFilePreset('db.json', {
  user: { username: 'admin', email: 'admin@streamflix.com' },
  videos: [
    { id: 1, title: "Stranger Things", cat: "trending", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", likes: 12, comments: ["Great show!"] },
    { id: 2, title: "Interstellar", cat: "scifi", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", likes: 8, comments: [] }
  ]
});

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use(express.static(path.join(__dirname, 'public')));

// LOGIN API (Mock)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '123') {
    res.json({ success: true, user: db.data.user });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// GET PROFILE
app.get('/api/profile', (req, res) => res.json(db.data.user));

// UPLOAD API
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)) }
});
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  const newVideo = {
    id: Date.now(),
    title: req.body.title || 'My Upload',
    cat: 'downloads',
    url: '/uploads/' + req.file.filename,
    likes: 0,
    comments: []
  };
  db.data.videos.push(newVideo);
  await db.write();
  res.json({ success: true, video: newVideo });
});

// GET VIDEOS API
app.get('/api/videos', (req, res) => res.json(db.data.videos));

// LIKE API
app.post('/api/like', async (req, res) => {
  const video = db.data.videos.find(v => v.id === req.body.id);
  if (video) { video.likes++; await db.write(); }
  res.json({ success: true, likes: video.likes });
});

// COMMENT API
app.post('/api/comment', async (req, res) => {
  const video = db.data.videos.find(v => v.id === req.body.id);
  if (video) { 
    video.comments.push(req.body.comment); 
    await db.write(); 
  }
  res.json({ success: true, comments: video.comments });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
