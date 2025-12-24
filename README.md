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

## 部署到 Google Cloud Run

### 前置需求

1. 安裝 [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. 設定 Google Cloud 專案：
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

### 方法一：使用 gcloud 指令部署

1. 建置並推送 Docker 映像檔：
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/mark-six-statistics
   ```

2. 部署到 Cloud Run：
   ```bash
   gcloud run deploy mark-six-statistics \
     --image gcr.io/YOUR_PROJECT_ID/mark-six-statistics \
     --platform managed \
     --region asia-east1 \
     --allow-unauthenticated
   ```

### 方法二：使用 Cloud Build (CI/CD)

1. 啟用必要的 API：
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   ```

2. 提交程式碼到 Cloud Source Repositories 或連接 GitHub，然後觸發建置：
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

### 本地測試 Docker 映像檔

```bash
# 建置映像檔
docker build -t mark-six-statistics .

# 執行容器
docker run -p 8080:8080 mark-six-statistics
```

### 環境變數

Cloud Run 會自動設定 `PORT` 環境變數（預設為 8080）。應用程式會自動使用此變數。

