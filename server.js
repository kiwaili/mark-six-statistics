// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const express = require('express');
const path = require('path');

// Cloud Run sets PORT automatically - must use process.env.PORT
// Parse as integer since Cloud Run may provide it as a string
const PORT = parseInt(process.env.PORT, 10) || 8080;

// Log port on startup for debugging
console.log(`Starting server on port: ${PORT}`);
console.log(`Working directory: ${__dirname}`);
console.log(`Node version: ${process.version}`);

const app = express();

// Try to load routes with error handling
let lotteryRoutes;
try {
  lotteryRoutes = require('./routes/lottery');
  console.log('Routes loaded successfully');
} catch (error) {
  console.error('Failed to load routes:', error);
  process.exit(1);
}

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
let server;
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`伺服器運行在 http://0.0.0.0:${PORT}`);
    console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
    console.log('Server started successfully');
  });

  // Error handling for server startup
  server.on('error', (error) => {
    console.error('伺服器啟動失敗:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    }
    process.exit(1);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...');
  server.close(() => {
    console.log('伺服器已關閉');
    process.exit(0);
  });
});

