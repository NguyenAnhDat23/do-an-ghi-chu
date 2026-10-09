const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Khởi tạo thư mục dữ liệu
const dataDir = path.join(__dirname, 'data');
const notesDir = path.join(dataDir, 'notes');
const settingsFile = path.join(dataDir, 'settings.json');
const privateNotesFile = path.join(dataDir, 'private_notes.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir);

if (!fs.existsSync(settingsFile)) {
  fs.writeFileSync(
    settingsFile,
    JSON.stringify({ displayName: "Nguyễn Anh Đạt", theme: "Light", primaryColor: "#007bff", privatePassword: "123" }, null, 2),
    'utf8'
  );
}

if (!fs.existsSync(privateNotesFile)) {
  fs.writeFileSync(privateNotesFile, '[]', 'utf8');
}

const defaultTopics = ['hoc-tap', 'cong-viec', 'ca-nhan'];
defaultTopics.forEach(t => {
  const filePath = path.join(notesDir, `${t}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
});

// Helper Read/Write
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
const getTopicFilePath = (topic) => path.join(notesDir, `${topic}.json`);

/* API CÀI ĐẶT (SETTINGS) */
app.get('/api/settings', (req, res) => {
  try {
    res.json(readJson(settingsFile));
  } catch (err) {
    res.status(500).json({ message: "Lỗi đọc cài đặt" });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const currentSettings = readJson(settingsFile);
    const updatedSettings = {
      displayName: req.body.displayName || currentSettings.displayName,
      theme: req.body.theme || currentSettings.theme,
      primaryColor: req.body.primaryColor || currentSettings.primaryColor,
      privatePassword: (req.body.privatePassword && req.body.privatePassword.trim() !== '')
        ? req.body.privatePassword
        : currentSettings.privatePassword
    };

    writeJson(settingsFile, updatedSettings);
    res.json({ success: true, settings: updatedSettings });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lưu cài đặt" });
  }
});

/* API CHỦ ĐỀ (TOPICS) */
app.get('/api/topics', (req, res) => {
  try {
    const files = fs.readdirSync(notesDir);
    const topics = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    res.json(topics.length > 0 ? topics : defaultTopics);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách chủ đề" });
  }
});

app.delete('/api/topics/:topic', (req, res) => {
  const filePath = getTopicFilePath(req.params.topic);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true });
    }
    res.status(404).json({ message: "Không tìm thấy chủ đề" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa chủ đề" });
  }
});

/* API GHI CHÚ CÔNG KHAI (PUBLIC NOTES) */
app.get('/api/notes/:topic', (req, res) => {
  const filePath = getTopicFilePath(req.params.topic);
  try {
    if (!fs.existsSync(filePath)) return res.json([]);
    res.json(readJson(filePath));
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải ghi chú" });
  }
});

app.post('/api/notes/:topic', (req, res) => {
  const filePath = getTopicFilePath(req.params.topic);
  try {
    const notes = fs.existsSync(filePath) ? readJson(filePath) : [];
    const newNote = {
      id: Date.now().toString(),
      title: req.body.title || "Không tiêu đề",
      content: req.body.content || "",
      createdAt: new Date().toISOString()
    };
    notes.push(newNote);
    writeJson(filePath, notes);
    res.json({ success: true, note: newNote });
  } catch (err) {
    res.status(500).json({ message: "Lỗi thêm ghi chú" });
  }
});

app.put('/api/notes/:topic/:id', (req, res) => {
  const filePath = getTopicFilePath(req.params.topic);
  try {
    let notes = readJson(filePath);
    const index = notes.findIndex(n => n.id === req.params.id);
    if (index !== -1) {
      notes[index] = { ...notes[index], title: req.body.title, content: req.body.content };
      writeJson(filePath, notes);
      return res.json({ success: true });
    }
    res.status(404).json({ message: "Không tìm thấy ghi chú" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi sửa ghi chú" });
  }
});

app.delete('/api/notes/:topic/:id', (req, res) => {
  const filePath = getTopicFilePath(req.params.topic);
  try {
    let notes = readJson(filePath);
    notes = notes.filter(n => n.id !== req.params.id);
    writeJson(filePath, notes);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa ghi chú" });
  }
});

/* API BẢO MẬT & GHI CHÚ RIÊNG TƯ */
app.post('/api/auth/verify', (req, res) => {
  const settings = readJson(settingsFile);
  if (req.body.password === settings.privatePassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Sai mật khẩu!" });
  }
});

app.get('/api/private-notes', (req, res) => {
  res.json(readJson(privateNotesFile));
});

app.post('/api/private-notes', (req, res) => {
  try {
    const notes = readJson(privateNotesFile);
    const newNote = {
      id: Date.now().toString(),
      title: req.body.title || "Không tiêu đề",
      content: req.body.content || "",
      createdAt: new Date().toISOString()
    };
    notes.push(newNote);
    writeJson(privateNotesFile, notes);
    res.json({ success: true, note: newNote });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lưu ghi chú bí mật" });
  }
});

app.delete('/api/private-notes/:id', (req, res) => {
  try {
    let notes = readJson(privateNotesFile);
    notes = notes.filter(n => n.id !== req.params.id);
    writeJson(privateNotesFile, notes);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa ghi chú bí mật" });
  }
});

// API Thêm chủ đề mới
app.post('/api/topics', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Tên chủ đề không được để trống!" });
    }

    // Tự động chuyển tên chủ đề thành dạng slug (ví dụ: "Học Tiếng Anh" -> "hoc-tieng-anh")
    const topicSlug = name
      .trim()
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-");

    const filePath = getTopicFilePath(topicSlug);

    if (fs.existsSync(filePath)) {
      return res.status(400).json({ success: false, message: "Chủ đề này đã tồn tại!" });
    }

    // Tạo file [topicSlug].json mới với mảng rỗng
    fs.writeFileSync(filePath, '[]', 'utf8');
    res.json({ success: true, topic: topicSlug });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi thêm chủ đề mới!" });
  }
});

app.listen(PORT, () => console.log(`Server đang chạy tại http://localhost:${PORT}`));