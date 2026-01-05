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
系統使用十三種統計方法進行綜合分析：

- **頻率分析 (Frequency Analysis)**: 統計每個號碼（1-49）在歷史資料中出現的總次數
- **加權頻率分析 (Weighted Frequency)**: 近期出現的號碼權重更高，使用指數衰減模型（每往前一期權重減少 5%）
- **間隔分析 (Gap Analysis)**: 計算每個號碼距離上次出現的期數，間隔越長分數越高
- **模式分析 (Pattern Analysis)**: 分析最近 10 期的出現模式，識別連續出現或交替出現的趨勢
- **分布分析 (Distribution Analysis)**: 分析號碼在 1-49 範圍內的分布均勻度，識別分布不均的區域
- **趨勢分析 (Trend Analysis)**: 分析號碼出現的趨勢變化，識別上升或下降趨勢
- **卡方檢驗 (Chi-Square Test)**: 使用統計學方法檢驗號碼出現是否符合均勻分布
- **泊松分布分析 (Poisson Analysis)**: 使用泊松分布模型分析號碼出現的機率
- **斐波那契分析 (Fibonacci Analysis)**: 基於斐波那契數列和黃金比例分析號碼出現模式
- **相關性分析 (Correlation Analysis)**: 計算號碼之間的皮爾遜相關係數，識別號碼之間的關聯性
- **熵分析 (Entropy Analysis)**: 使用香農熵評估號碼出現的不確定性，識別非隨機模式
- **馬可夫鏈分析 (Markov Chain Analysis)**: 分析號碼之間的轉移機率，預測基於上一期號碼的條件機率
- **組合數學分析 (Combinatorial Analysis)**: 分析號碼組合的數學特性（和、差、連續對等），識別組合規律

### 3. 智能預測
- **綜合評分系統**: 將十三種分析方法的分數正規化後加權組合，產生綜合預測分數
- **可自訂權重**: 支援自訂各分析方法的權重比例（預設：頻率 8%、加權頻率 10%、間隔 10%、模式 6%、分布 10%、趨勢 9%、卡方 3%、泊松 3%、斐波那契 8%、相關性 8%、熵 6%、馬可夫鏈 10%、組合數學 9%）
- **Top 40 候選**: 返回綜合分數最高的前 40 個號碼作為候選，提高預測覆蓋率
- **複式投注建議**: 提供兩種複式投注方案
  - **完整複式建議**: 使用縮減輪轉系統，以較少注數覆蓋所有預測號碼
  - **$100 複式建議**: 精選 10 注組合（總金額 $100），適合預算有限的投注者

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
- **複式投注建議**: 在最新預測頁面顯示兩種複式投注方案，包含所有投注組合詳情

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
│   ├── analysisService.js     # 統計分析與預測服務（主協調器）
│   ├── calculators.js         # 統計計算函數（頻率、加權、間隔、模式、分布、趨勢、卡方、泊松）
│   ├── fibonacci.js           # 斐波那契數列分析
│   ├── selectionStrategies.js # 號碼選擇策略
│   ├── betting.js             # 投注建議生成
│   ├── validation.js          # 驗證和權重調整
│   └── utils.js               # 工具函數（數據提取、期數解析）
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
    "frequency": 0.10,
    "weightedFrequency": 0.14,
    "gap": 0.14,
    "pattern": 0.08,
    "distribution": 0.14,
    "trend": 0.12,
    "chiSquare": 0.04,
    "poisson": 0.04,
    "fibonacci": 0.12
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
        "patternScore": 18.67,
        "distributionScore": 15.23,
        "trendScore": 14.56,
        "chiSquareScore": 6.78,
        "poissonScore": 5.43,
        "fibonacciScore": 12.89
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
    "compoundBetSuggestion": {
      "numbers": [15, 23, 31, 7, 12, 28, 35, 42, 5, 18, 25, 33, 9, 21, 37],
      "bets": [
        [15, 23, 31, 7, 12, 28],
        [15, 23, 31, 7, 12, 35],
        ...
      ],
      "totalBets": 156,
      "totalAmount": 1560,
      "strategy": "縮減輪轉系統",
      "description": "使用核心組（前7個號碼）+ 外圍組（後8個號碼）的縮減輪轉系統，以 156 注覆蓋所有15個預測號碼，相比完整複式投注（5005注）大幅減少注數"
    },
    "compoundBetSuggestion100": {
      "numbers": [15, 23, 31, 7, 12, 28, 35, 42, 5, 18, 25, 33, 9, 21, 37],
      "bets": [
        [15, 23, 31, 7, 12, 28],
        [15, 23, 31, 7, 12, 35],
        ...
      ],
      "totalBets": 10,
      "totalAmount": 100,
      "strategy": "$100 精選組合",
      "description": "使用精選組合策略，以 10 注（$100）覆蓋所有15個預測號碼，適合預算有限的投注者"
    },
    "analysisDetails": {
      "frequency": { "1": 10, "2": 12, ... },
      "weightedFrequency": { "1": 5.2, "2": 6.1, ... },
      "gapScore": { "1": 15.3, "2": 18.7, ... },
      "patternScore": { "1": 8.5, "2": 9.2, ... },
      "distributionFeatures": { ... },
      "distributionScore": { "1": 12.3, "2": 14.5, ... },
      "trendScore": { "1": 8.9, "2": 10.2, ... },
      "chiSquare": {
        "scores": { "1": 5.1, "2": 6.3, ... },
        "chiSquare": 45.23,
        "degreesOfFreedom": 48,
        "expectedFrequency": 12.24
      },
      "poisson": {
        "scores": { "1": 4.8, "2": 5.9, ... },
        "lambda": 12.24
      },
      "fibonacci": {
        "scores": { "1": 7.2, "2": 8.1, ... },
        "fibonacciSequence": [1, 1, 2, 3, 5, 8, 13, 21, 34],
        "goldenRatio": 1.618
      },
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
          "frequency": 0.10,
          "weightedFrequency": 0.14,
          "gap": 0.14,
          "pattern": 0.08,
          "distribution": 0.14,
          "trend": 0.12,
          "chiSquare": 0.04,
          "poisson": 0.04,
          "fibonacci": 0.12
        }
      }
    ],
    "finalWeights": {
      "frequency": 0.10,
      "weightedFrequency": 0.14,
      "gap": 0.14,
      "pattern": 0.08,
      "distribution": 0.14,
      "trend": 0.12,
      "chiSquare": 0.04,
      "poisson": 0.04,
      "fibonacci": 0.12
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

### 1. 頻率分析 (Frequency Analysis)
統計每個號碼在歷史資料中出現的總次數。出現次數越多的號碼，分數越高。

### 2. 加權頻率分析 (Weighted Frequency)
考慮時間因素，近期出現的號碼權重更高。使用指數衰減模型：
- 最新一期權重為 1.0
- 每往前一期權重減少 5%（權重 = 0.95^(總期數 - 索引 - 1)）

### 3. 間隔分析 (Gap Analysis)
計算每個號碼距離上次出現的期數。間隔越長，分數越高（表示「該出現了」）。
使用對數函數平滑化：`gapScore = log(gap + 1) * 10`

### 4. 模式分析 (Pattern Analysis)
分析最近 10 期的出現模式，識別連續出現或交替出現的趨勢。
越近期的期數權重越高：`weight = 1 / (index + 1)`

### 5. 分布分析 (Distribution Analysis)
分析號碼在 1-49 範圍內的分布均勻度，將範圍分成多個區間，計算每個號碼所在區間的分布密度。
分布不均的區域（過多或過少號碼）會得到不同的分數。

### 6. 趨勢分析 (Trend Analysis)
分析號碼出現的趨勢變化，計算最近 N 期與更早 N 期的出現頻率差異。
識別上升趨勢（近期出現頻率增加）或下降趨勢（近期出現頻率減少）。

### 7. 卡方檢驗 (Chi-Square Test)
使用統計學的卡方檢驗方法，檢驗號碼出現是否符合均勻分布。
計算期望頻率和實際頻率的差異，偏差越大分數越高。

### 8. 泊松分布分析 (Poisson Analysis)
使用泊松分布模型分析號碼出現的機率。
計算每個號碼的泊松機率，並根據實際出現次數與期望值的差異評分。

### 9. 斐波那契分析 (Fibonacci Analysis)
基於斐波那契數列和黃金比例（約 1.618）分析號碼出現模式：
- 分析號碼是否為斐波那契數列成員
- 分析號碼間隔是否符合斐波那契數列
- 分析號碼位置關係是否符合黃金比例
- 分析週期性模式

### 10. 相關性分析 (Correlation Analysis)
計算號碼之間的皮爾遜相關係數，識別號碼之間的關聯性：
- 計算每對號碼之間的相關係數
- 識別強相關的號碼對（|r| > 0.3）
- 如果某號碼與多個號碼有強相關性，給予較高分數
- 應用：識別可能一起出現的號碼組合

### 11. 熵分析 (Entropy Analysis)
使用香農熵評估號碼出現的不確定性：
- 計算整體熵值：`H(X) = -Σ P(x) * log₂(P(x))`
- 分析每個號碼出現頻率與期望值的偏差
- 偏差大的號碼（非隨機模式）給予較高分數
- 應用：識別非隨機模式，評估分布的隨機性

### 12. 馬可夫鏈分析 (Markov Chain Analysis)
分析號碼之間的轉移機率，建立狀態轉移矩陣：
- 計算從上一期號碼轉移到下一期號碼的機率
- 基於最新一期的號碼，預測下一期各號碼出現的條件機率
- 轉移機率高的號碼給予較高分數
- 應用：捕捉短期依賴關係，預測基於上一期的條件機率

### 13. 組合數學分析 (Combinatorial Analysis)
分析號碼組合的數學特性：
- **和值分析**：計算歷史組合的總和分布，識別常見和值範圍
- **差值分析**：分析相鄰號碼的差值分布，識別常見差值
- **連續對分析**：識別經常一起出現的連續號碼對
- **位置關係**：分析號碼在排序後的位置關係
- 應用：識別組合規律，預測符合歷史組合特性的號碼

### 14. 綜合評分
將十三種分析方法的分數正規化到 0-100 範圍，然後加權組合：
```
compositeScore = 
  normalizedFrequency * weight_frequency +
  normalizedWeightedFrequency * weight_weightedFrequency +
  normalizedGapScore * weight_gap +
  normalizedPatternScore * weight_pattern +
  normalizedDistributionScore * weight_distribution +
  normalizedTrendScore * weight_trend +
  normalizedChiSquareScore * weight_chiSquare +
  normalizedPoissonScore * weight_poisson +
  normalizedFibonacciScore * weight_fibonacci +
  normalizedCorrelationScore * weight_correlation +
  normalizedEntropyScore * weight_entropy +
  normalizedMarkovScore * weight_markov +
  normalizedCombinatorialScore * weight_combinatorial
```

### 15. 智能學習
在迭代驗證過程中，系統會：
1. 分析命中號碼和未命中號碼在各指標中的排名
2. 計算各指標的效能分數
3. 根據準確率差距動態調整學習率
4. 增加表現好的指標權重，減少表現差的指標權重
5. 確保權重總和為 1，且每個權重在合理範圍內（0.1 - 0.5）

### 7. 複式投注建議演算法

系統提供兩種複式投注建議方案：

#### 完整複式建議（縮減輪轉系統）
- **策略**: 從 Top 40 候選號碼中選擇前 15 個，分成核心組（前 7 個）和外圍組（後 8 個）
- **組合方式**:
  - 核心組選 6 個（C(7,6) = 7 注）
  - 核心組選 5 個 + 外圍組選 1 個（精選組合）
  - 核心組選 4 個 + 外圍組選 2 個（精選組合）
  - 核心組選 3 個 + 外圍組選 3 個（精選組合）
  - 核心組選 2 個 + 外圍組選 4 個（少量組合）
- **優勢**: 相比完整複式投注（C(15,6) = 5005 注）大幅減少注數，同時確保覆蓋所有 15 個號碼

#### $100 複式建議（精選組合）
- **策略**: 從 Top 40 候選號碼中選擇前 15 個，使用精選組合策略，生成恰好 10 注（$100）的投注方案
- **組合方式**:
  - 核心組選 6 個（2 注）
  - 核心組選 5 個 + 外圍組選 1 個（4 注，確保外圍號碼均勻分布）
  - 核心組選 4 個 + 外圍組選 2 個（2 注）
  - 核心組選 3 個 + 外圍組選 3 個（補充至 10 注）
- **優勢**: 固定預算（$100），適合預算有限的投注者，同時確保覆蓋所有 15 個預測號碼

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
5. **投注建議**: 複式投注建議僅供參考，投注前請自行評估風險，理性投注
6. **投注金額**: 每注投注金額為 $10，複式投注總金額 = 注數 × $10

## 授權

ISC License

## 作者

Mark Six Statistics Project
