const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use(express.static(path.join(__dirname, 'public')));

const users = [{ username: 'admin', password: '123' }];
let videos = [
  { id: 1, title: "Stranger Things", cat: "trending", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { id: 2, title: "Interstellar", cat: "scifi", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" }
];

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) res.json({ success: true, token: "mock-token-123" });
  else res.status(401).json({ success: false, message: "Invalid credentials" });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)) }
});
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  const newVideo = {
    id: Date.now(),
    title: req.body.title || 'My Upload',
    cat: 'downloads',
    url: '/uploads/' + req.file.filename
  };
  videos.push(newVideo);
  res.json({ success: true, video: newVideo });
});

app.get('/api/videos', (req, res) => res.json(videos));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
