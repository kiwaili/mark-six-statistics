# 六合彩攪珠結果統計與預測系統

一個功能完整的六合彩（Mark Six）攪珠結果抓取、統計分析和號碼預測系統。使用 Node.js + Express 建立後端 API，搭配現代化的前端介面，提供多種統計分析方法來預測下一期最有可能開出的號碼。

## 主要功能

### 1. 資料抓取
- 從 [lottery.hk](https://lottery.hk/liuhecai/jieguo/) 自動抓取攪珠結果
- 支援年份範圍查詢（可查詢單一年份或跨年份範圍）
- 自動解析表格資料並轉換為結構化格式
- 並行抓取多個年份的資料，提升效率
- 自動按日期排序（最新的在前）

### 2. 統計分析
系統使用四種統計方法進行綜合分析：

- **頻率分析 (Frequency Analysis)**: 統計每個號碼（1-49）在歷史資料中出現的總次數
- **加權頻率分析 (Weighted Frequency)**: 近期出現的號碼權重更高，使用指數衰減模型（每往前一期權重減少 5%）
- **間隔分析 (Gap Analysis)**: 計算每個號碼距離上次出現的期數，間隔越長分數越高
- **模式分析 (Pattern Analysis)**: 分析最近 10 期的出現模式，識別連續出現或交替出現的趨勢

### 3. 智能預測
- **綜合評分系統**: 將四種分析方法的分數正規化後加權組合，產生綜合預測分數
- **可自訂權重**: 支援自訂各分析方法的權重比例（預設：頻率 30%、加權頻率 35%、間隔 20%、模式 15%）
- **Top 15 預測**: 返回綜合分數最高的前 15 個號碼，提高預測覆蓋率

### 4. 迭代驗證
- **歷史回測**: 從最新期數往前推 N 期（預設 10 期），逐步驗證預測準確率
- **智能學習**: 根據驗證結果自動調整權重參數，提升預測準確率
- **多組權重測試**: 自動測試多組初始權重，選擇表現最佳的一組
- **詳細統計**: 提供平均準確率、平均命中數、覆蓋率等統計指標

### 5. 前端介面
- **響應式設計**: 支援桌面、平板和手機裝置
- **年份選擇器**: 可選擇查詢的年份範圍
- **結果展示**: 以表格形式展示攪珠結果，號碼以徽章樣式顯示
- **分析結果視覺化**: 以卡片形式展示預測號碼及其詳細分數
- **統計資訊**: 顯示總期數、平均頻率、最常出現號碼等統計資訊

## 專案結構

```
mark-six-statistics/
├── server.js                  # Express 伺服器主檔案
├── package.json               # 專案依賴配置
├── Dockerfile                 # Docker 容器配置
├── cloudbuild.yaml            # Google Cloud Build 配置
├── models/
│   └── LotteryResultDTO.js    # 攪珠結果資料傳輸物件（DTO）
├── routes/
│   └── lottery.js             # 彩券相關 API 路由
├── services/
│   ├── lotteryService.js      # 資料抓取服務（網頁爬蟲）
│   └── analysisService.js     # 統計分析與預測服務
└── public/
    └── index.html             # 前端單頁應用程式
```

## 技術架構

### 後端技術
- **Node.js 20+**: 執行環境
- **Express 4.18+**: Web 框架
- **Axios 1.6+**: HTTP 客戶端（用於網頁抓取）
- **Cheerio 1.0+**: 伺服器端 HTML 解析（類似 jQuery）

### 前端技術
- **原生 HTML/CSS/JavaScript**: 無需額外框架，輕量高效
- **響應式 CSS**: 使用 Flexbox 和 Grid 布局
- **漸層設計**: 現代化的視覺效果

### 部署
- **Docker**: 容器化部署
- **Google Cloud Run**: 無伺服器容器平台
- **Cloud Build**: CI/CD 自動化部署

## 安裝與執行

### 前置需求
- Node.js >= 20.0.0
- npm >= 10.0.0

### 本地開發

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **啟動伺服器**
   ```bash
   npm start
   ```
   伺服器將在 http://localhost:3000 啟動

3. **開發模式（自動重啟）**
   ```bash
   npm run dev
   ```
   需要先安裝 nodemon：`npm install -g nodemon` 或使用專案內的 devDependencies

### Docker 本地測試

```bash
# 建置映像檔
docker build -t mark-six-statistics .

# 執行容器
docker run -p 8080:8080 mark-six-statistics
```

## API 文件

### 1. GET /api/lottery/results

取得攪珠結果資料

**查詢參數：**
- `startYear` (可選): 開始年份，預設為當前年份
- `endYear` (可選): 結束年份，預設為當前年份

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

### 2. POST /api/lottery/analyze

分析攪珠結果並預測下一期最有可能的號碼

**請求體：**
```json
{
  "results": [
    {
      "periodNumber": "2025001",
      "date": "2025-01-01",
      "numbers": ["01", "02", "03", "04", "05", "06"]
    }
  ],
  "weights": {
    "frequency": 0.30,
    "weightedFrequency": 0.35,
    "gap": 0.20,
    "pattern": 0.15
  }
}
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "topNumbers": [
      {
        "number": 15,
        "score": 85.23,
        "frequency": 45,
        "weightedFrequency": 12.34,
        "gapScore": 23.45,
        "patternScore": 18.67
      }
    ],
    "stats": {
      "totalPeriods": 100,
      "totalNumbers": 600,
      "averageFrequency": 12.24,
      "mostFrequent": [
        { "number": 15, "count": 45 }
      ]
    },
    "analysisDetails": {
      "frequency": { "1": 10, "2": 12, ... },
      "weightedFrequency": { "1": 5.2, "2": 6.1, ... },
      "gapScore": { "1": 15.3, "2": 18.7, ... },
      "patternScore": { "1": 8.5, "2": 9.2, ... },
      "compositeScore": { "1": 45.6, "2": 52.3, ... }
    }
  }
}
```

### 3. POST /api/lottery/validate

迭代驗證分析：從最新期數往前推 N 期開始，逐步驗證並調整權重

**請求體：**
```json
{
  "results": [...],
  "lookbackPeriods": 10
}
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "latestPeriod": "2025001",
    "startPeriod": "2024991",
    "totalValidations": 10,
    "validationResults": [
      {
        "trainingPeriod": "2025001",
        "targetPeriod": "2025002",
        "predictedNumbers": [15, 23, 31, ...],
        "actualNumbers": [15, 24, 32, ...],
        "comparison": {
          "hitCount": 3,
          "totalPredicted": 15,
          "totalActual": 6,
          "hits": [15],
          "misses": [24, 32, ...],
          "predictedButNotActual": [23, 31, ...],
          "accuracy": 20.0,
          "coverage": 16.67
        },
        "weights": {
          "frequency": 0.30,
          "weightedFrequency": 0.35,
          "gap": 0.20,
          "pattern": 0.15
        }
      }
    ],
    "finalWeights": {
      "frequency": 0.28,
      "weightedFrequency": 0.37,
      "gap": 0.22,
      "pattern": 0.13
    },
    "statistics": {
      "totalHits": 30,
      "averageHitsPerPeriod": 3.0,
      "averageAccuracy": 20.0,
      "averageCoverage": 50.0
    }
  }
}
```

### 4. GET /health

健康檢查端點（用於 Cloud Run）

**回應：**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 資料模型

### LotteryResultDTO

攪珠結果資料傳輸物件

**欄位：**
- `periodNumber` (string): 攪珠期數，格式如 "2025001" 或 "25/132"
- `date` (string): 攪珠日期，格式為 "yyyy-mm-dd"
- `numbers` (array): 攪出的號碼陣列，每個號碼為 1-49 的整數

## 分析演算法詳解

### 1. 頻率分析
統計每個號碼在歷史資料中出現的總次數。出現次數越多的號碼，分數越高。

### 2. 加權頻率分析
考慮時間因素，近期出現的號碼權重更高。使用指數衰減模型：
- 最新一期權重為 1.0
- 每往前一期權重減少 5%（權重 = 0.95^(總期數 - 索引 - 1)）

### 3. 間隔分析
計算每個號碼距離上次出現的期數。間隔越長，分數越高（表示「該出現了」）。
使用對數函數平滑化：`gapScore = log(gap + 1) * 10`

### 4. 模式分析
分析最近 10 期的出現模式，識別連續出現或交替出現的趨勢。
越近期的期數權重越高：`weight = 1 / (index + 1)`

### 5. 綜合評分
將四種分析方法的分數正規化到 0-100 範圍，然後加權組合：
```
compositeScore = 
  normalizedFrequency * weight_frequency +
  normalizedWeightedFrequency * weight_weightedFrequency +
  normalizedGapScore * weight_gap +
  normalizedPatternScore * weight_pattern
```

### 6. 智能學習
在迭代驗證過程中，系統會：
1. 分析命中號碼和未命中號碼在各指標中的排名
2. 計算各指標的效能分數
3. 根據準確率差距動態調整學習率
4. 增加表現好的指標權重，減少表現差的指標權重
5. 確保權重總和為 1，且每個權重在合理範圍內（0.1 - 0.5）

## 部署到 Google Cloud Run

### 前置需求

1. 安裝 [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. 設定 Google Cloud 專案：
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

### 方法一：使用 gcloud 指令部署

1. **建置並推送 Docker 映像檔：**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/mark-six-statistics
   ```

2. **部署到 Cloud Run：**
   ```bash
   gcloud run deploy mark-six-statistics \
     --image gcr.io/YOUR_PROJECT_ID/mark-six-statistics \
     --platform managed \
     --region asia-east1 \
     --allow-unauthenticated
   ```

### 方法二：使用 Cloud Build (CI/CD)

1. **啟用必要的 API：**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   ```

2. **提交程式碼到 Cloud Source Repositories 或連接 GitHub，然後觸發建置：**
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

### Cloud Run 配置

根據 `cloudbuild.yaml`，服務配置如下：
- **區域**: asia-east1
- **記憶體**: 512Mi
- **CPU**: 1
- **最小實例數**: 0（按需啟動）
- **最大實例數**: 10
- **超時時間**: 300 秒
- **端口**: 8080

### 環境變數

Cloud Run 會自動設定 `PORT` 環境變數（預設為 8080）。應用程式會自動使用此變數。

## 注意事項

1. **網頁抓取**: 系統從公開網站抓取資料，請遵守該網站的使用條款和 robots.txt
2. **預測準確率**: 本系統僅供參考，彩票結果具有隨機性，無法保證預測準確率
3. **資料來源**: 資料來源於第三方網站，如網站結構變更可能需要更新爬蟲邏輯
4. **效能考量**: 查詢大量年份資料時，可能需要較長時間，建議分批查詢

## 授權

ISC License

## 作者

Mark Six Statistics Project
