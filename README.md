# 六合彩攪珠結果統計系統

使用 Node.js + Express 建立的六合彩攪珠結果抓取和顯示系統。

## 功能

- 從 https://lottery.hk/liuhecai/jieguo/2025 抓取攪珠結果
- 解析表格資料並儲存到 DTO
- 美觀的前端介面顯示結果

## 專案結構

```
mark-six-statistics/
├── server.js              # Express 伺服器主檔案
├── package.json           # 專案依賴配置
├── models/
│   └── LotteryResultDTO.js    # 攪珠結果 DTO 模型
├── routes/
│   └── lottery.js         # 彩券相關路由
├── services/
│   └── lotteryService.js  # 資料抓取服務
└── public/
    └── index.html         # 前端主頁
```

## 安裝

```bash
npm install
```

## 執行

```bash
npm start
```

開發模式（自動重啟）：
```bash
npm run dev
```

伺服器將在 http://localhost:3000 啟動

## API

### GET /api/lottery/results

取得攪珠結果資料

**回應範例：**
```json
{
  "success": true,
  "data": [
    {
      "periodNumber": "2025001",
      "date": "2025-01-01",
      "numbers": ["01", "02", "03", "04", "05", "06"]
    }
  ],
  "count": 1
}
```

## DTO 結構

攪珠結果 DTO 包含以下欄位：
- **periodNumber**: 攪珠期數
- **date**: 攪珠日期
- **numbers**: 攪出的號碼陣列

