const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const mimeTypes = require('mime-types');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳_原文件名
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 限制文件大小为100MB
  }
});

// 获取本机局域网IP地址
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // 跳过非IPv4和内部地址
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

// 存储文件信息
let fileDatabase = [];

// 根路径 - 返回主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 文件上传API
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有选择文件' });
    }

    const localIP = getLocalIP();
    const fileInfo = {
      id: Date.now().toString(),
      originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
      filename: req.file.filename,
      size: req.file.size,
      uploadTime: new Date().toISOString(),
      downloadUrl: `http://${localIP}:${PORT}/download/${req.file.filename}`
    };

    // 生成二维码
    const qrCodeData = await QRCode.toDataURL(fileInfo.downloadUrl);
    fileInfo.qrCode = qrCodeData;

    // 保存到文件数据库
    fileDatabase.push(fileInfo);

    res.json({
      success: true,
      file: fileInfo,
      message: '文件上传成功！'
    });

  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 文件下载API
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  // 从数据库中查找文件信息
  const fileInfo = fileDatabase.find(file => file.filename === filename);
  if (!fileInfo) {
    return res.status(404).json({ error: '文件信息不存在' });
  }

  // 设置响应头
  const contentType = mimeTypes.lookup(fileInfo.originalName) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.originalName)}"`);

  // 发送文件
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('下载错误:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: '文件下载失败' });
      }
    }
  });
});

// 获取文件列表API
app.get('/api/files', (req, res) => {
  res.json({
    success: true,
    files: fileDatabase.map(file => ({
      id: file.id,
      originalName: file.originalName,
      size: file.size,
      uploadTime: file.uploadTime,
      downloadUrl: file.downloadUrl,
      qrCode: file.qrCode
    }))
  });
});

// 删除文件API
app.delete('/api/files/:id', (req, res) => {
  const fileId = req.params.id;
  const fileIndex = fileDatabase.findIndex(file => file.id === fileId);
  
  if (fileIndex === -1) {
    return res.status(404).json({ error: '文件不存在' });
  }

  const file = fileDatabase[fileIndex];
  const filePath = path.join(uploadsDir, file.filename);

  // 删除物理文件
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // 从数据库中删除
  fileDatabase.splice(fileIndex, 1);

  res.json({
    success: true,
    message: '文件删除成功'
  });
});

// 清理过期文件 (24小时)
function cleanupExpiredFiles() {
  const now = Date.now();
  const expirationTime = 24 * 60 * 60 * 1000; // 24小时

  fileDatabase = fileDatabase.filter(file => {
    const uploadTime = new Date(file.uploadTime).getTime();
    if (now - uploadTime > expirationTime) {
      // 删除过期文件
      const filePath = path.join(uploadsDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`已删除过期文件: ${file.originalName}`);
      }
      return false;
    }
    return true;
  });
}

// 每小时执行一次清理
setInterval(cleanupExpiredFiles, 60 * 60 * 1000);

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('==================================================');
  console.log('📁 文件传输服务已启动！');
  console.log(`🌐 本地访问: http://localhost:${PORT}`);
  console.log(`📱 局域网访问: http://${localIP}:${PORT}`);
  console.log(`📋 上传目录: ${uploadsDir}`);
  console.log('==================================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  process.exit(0);
});