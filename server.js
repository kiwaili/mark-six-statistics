const express = require('express');
const path = require('path');
const lotteryRoutes = require('./routes/lottery');

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 路由
app.use('/api/lottery', lotteryRoutes);

// 主頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
});

