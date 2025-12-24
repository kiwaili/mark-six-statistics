const express = require('express');
const path = require('path');
const lotteryRoutes = require('./routes/lottery');

const app = express();
// Cloud Run sets PORT automatically - must use process.env.PORT
const PORT = process.env.PORT || 8080;

// Log port on startup for debugging
console.log(`Starting server on port: ${PORT}`);

// 中介軟體
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 路由
app.use('/api/lottery', lotteryRoutes);

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 主頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動伺服器
// Cloud Run requires listening on 0.0.0.0
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`伺服器運行在 http://0.0.0.0:${PORT}`);
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling for server startup
server.on('error', (error) => {
  console.error('伺服器啟動失敗:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...');
  server.close(() => {
    console.log('伺服器已關閉');
    process.exit(0);
  });
});

