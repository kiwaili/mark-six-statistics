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
系統使用十八種統計方法進行綜合分析：

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
- **自回歸模型 (AR - Autoregressive Model)**: 使用過去N期的值預測未來值，捕捉時間序列中的自相關性
- **生存分析 (Survival Analysis)**: 分析號碼「存活」（未出現）的時間長度，計算危險率預測再次出現時機
- **極值理論 (Extreme Value Theory)**: 分析極端事件（如某號碼長期未出現）的分布，評估「冷門號碼」出現的機率
- **聚類分析 (Cluster Analysis)**: 將號碼分組，識別相似的出現模式，發現號碼之間的關聯性和組合模式
- **號碼球排列方式分析 (Number Range Analysis)**: 將1-49分成5個範圍（1-10, 11-20, 21-30, 31-40, 41-49），統計實際號碼的分佈，命中號碼最多的範圍裡的號碼就是高機率

### 3. 智能預測
- **綜合評分系統**: 將十八種分析方法的分數正規化後加權組合，產生綜合預測分數
- **可自訂權重**: 支援自訂各分析方法的權重比例（預設：頻率 7%、加權頻率 9%、間隔 9%、模式 5%、分布 9%、趨勢 8%、卡方 3%、泊松 3%、斐波那契 7%、相關性 7%、熵 5%、馬可夫鏈 9%、組合數學 8%、自回歸 6%、生存分析 7%、極值理論 6%、聚類分析 7%、號碼範圍 6%）
- **Top 40 候選**: 返回綜合分數最高的前 40 個號碼作為候選，提高預測覆蓋率
- **複式投注建議**: 提供兩種複式投注方案
  - **完整複式建議**: 使用縮減輪轉系統，以較少注數覆蓋所有預測號碼
  - **$100 複式建議**: 精選 10 注組合（總金額 $100），適合預算有限的投注者

### 4. 迭代驗證
- **歷史回測**: 從最新期數往前推 N 期（預設 100 期），逐步驗證預測準確率
- **智能學習**: 根據驗證結果自動調整權重參數，提升預測準確率
- **多組權重測試**: 自動測試多組初始權重，選擇表現最佳的一組
- **模擬評估優化**: 在驗證過程中，對每個候選組合進行1000次模擬評估，選擇模擬表現最好的組合
- **神經運算**: 使用多層感知器（MLP）神經網絡學習歷史數據模式
  - 自動從歷史數據中提取特徵（號碼出現模式、頻率特徵等）
  - 訓練神經網絡識別複雜的非線性模式
  - 將神經網絡預測整合到統計分析中（權重15%）
  - 在候選組合評分中加入神經網絡預測加成
  - 提供神經網絡預測的Top號碼列表
- **自動重試機制**: 如果平均每期命中數未達到3或以上，自動重試最多50次
  - 每次重試會調整權重，嘗試不同的組合
  - 選擇最接近目標（平均命中數3）的結果
  - 記錄所有重試結果，提供詳細的重試統計
- **詳細統計**: 提供平均準確率、平均命中數、覆蓋率等統計指標

### 5. 模擬優化
- **迭代模擬優化**: 使用預測號碼模擬1000次開獎，根據命中率迭代優化預測號碼
  - 保留命中率高的號碼
  - 對命中率低的號碼，重新使用預測方法計算替換
  - 重複迭代直到收斂或達到最大迭代次數
- **批量模擬測試**: 批量模擬測試預測號碼的有效性，提供詳細的命中統計
- **可配置參數**: 支援自訂模擬輪數、迭代次數、命中率閾值等參數

### 6. 前端介面
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
│   ├── neural.js              # 神經網絡分析（多層感知器）
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
    "frequency": 0.08,
    "weightedFrequency": 0.10,
    "gap": 0.10,
    "pattern": 0.06,
    "distribution": 0.10,
    "trend": 0.09,
    "chiSquare": 0.03,
    "poisson": 0.03,
    "fibonacci": 0.07,
    "correlation": 0.07,
    "entropy": 0.05,
    "markov": 0.09,
    "combinatorial": 0.08,
    "autoregressive": 0.06,
    "survival": 0.07,
    "extremeValue": 0.06,
    "cluster": 0.07
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
        "fibonacciScore": 12.89,
        "correlationScore": 8.45,
        "entropyScore": 7.23,
        "markovScore": 9.12,
        "combinatorialScore": 8.67,
        "autoregressiveScore": 7.89,
        "survivalScore": 8.34,
        "extremeValueScore": 7.56,
        "clusterScore": 8.12
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
      "correlation": {
        "scores": { "1": 5.8, "2": 6.2, ... },
        "correlations": { "1": [{ "number": 15, "correlation": 0.35 }], ... }
      },
      "entropy": {
        "scores": { "1": 4.5, "2": 5.1, ... },
        "overallEntropy": 5.89,
        "maxEntropy": 5.61
      },
      "markov": {
        "scores": { "1": 6.2, "2": 7.1, ... },
        "transitionMatrix": { "1": { "2": 0.15, "3": 0.12, ... }, ... }
      },
      "combinatorial": {
        "scores": { "1": 5.8, "2": 6.5, ... },
        "patterns": {
          "avgSum": 150.5,
          "avgDiff": 8.2,
          "commonSums": [145, 150, 155, ...]
        }
      },
      "autoregressive": {
        "scores": { "1": 6.2, "2": 7.1, ... },
        "coefficients": { "1": [0.15], "2": [0.18], ... },
        "predictions": { "1": 0.12, "2": 0.15, ... }
      },
      "survival": {
        "scores": { "1": 7.3, "2": 8.2, ... },
        "survivalTimes": { "1": [5, 8, 12], "2": [6, 9, 11], ... },
        "hazardRates": { "1": 0.15, "2": 0.18, ... }
      },
      "extremeValue": {
        "scores": { "1": 6.8, "2": 7.5, ... },
        "extremeGaps": { "1": 25, "2": 30, ... },
        "returnLevels": { "1": 0.12, "2": 0.15, ... }
      },
      "cluster": {
        "scores": { "1": 7.1, "2": 7.8, ... },
        "clusters": { "0": [1, 5, 12], "1": [8, 15, 22], ... },
        "clusterCenters": [1, 8, 15, 22, 29, 36, 43]
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
  "lookbackPeriods": 100
}
```

**注意**: `lookbackPeriods` 參數在函數內部實際使用，API 端點目前不支援此參數，使用預設值 100

**參數說明：**
- `results` (必需): 歷史開獎結果陣列
- `lookbackPeriods` (可選): 往前推的期數，預設 100

**功能特點：**
- 自動重試機制：如果平均每期命中數未達到3或以上，自動重試最多50次
- 模擬評估：對每個候選組合進行1000次模擬評估，選擇最佳組合
- 智能選擇：選擇最接近目標（平均命中數3）的結果

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
        "predictedNumbers": [15, 23, 31, 7, 12, 28],
        "actualNumbers": [15, 24, 32, 7, 12, 28],
        "strategy": "optimal",
        "simulation": {
          "averageHitsPerDraw": 1.2,
          "hitRate": 0.2,
          "totalHits": 1200,
          "numberHits": {
            "15": 210,
            "23": 198,
            "31": 205,
            "7": 192,
            "12": 201,
            "28": 194
          }
        },
        "comparison": {
          "hitCount": 4,
          "totalPredicted": 6,
          "totalActual": 6,
          "hits": [15, 7, 12, 28],
          "misses": [24, 32],
          "predictedButNotActual": [23, 31],
          "accuracy": 66.67,
          "coverage": 66.67,
          "meetsTarget": true,
          "targetHitCount": 3,
          "hitCountStatus": "達標",
          "hitDetails": {
            "hitCount": 4,
            "targetHitCount": 3,
            "meetsTarget": true,
            "status": "達標",
            "hits": [15, 7, 12, 28],
            "misses": [24, 32]
          }
        },
        "weights": {
          "frequency": 0.08,
          "weightedFrequency": 0.10,
          "gap": 0.10,
          "pattern": 0.06,
          "distribution": 0.10,
          "trend": 0.09,
          "chiSquare": 0.03,
          "poisson": 0.03,
          "fibonacci": 0.08,
          "correlation": 0.07,
          "entropy": 0.05,
          "markov": 0.09,
          "combinatorial": 0.08,
          "autoregressive": 0.06,
          "survival": 0.07,
          "extremeValue": 0.06,
          "cluster": 0.07
        }
      }
    ],
    "finalWeights": {
      "frequency": 0.08,
      "weightedFrequency": 0.10,
      "gap": 0.10,
      "pattern": 0.06,
      "distribution": 0.10,
      "trend": 0.09,
      "chiSquare": 0.03,
      "poisson": 0.03,
      "fibonacci": 0.07,
      "correlation": 0.07,
      "entropy": 0.05,
      "markov": 0.09,
      "combinatorial": 0.08,
      "autoregressive": 0.06,
      "survival": 0.07,
      "extremeValue": 0.06,
      "cluster": 0.07
    },
    "statistics": {
      "totalHits": 300,
      "averageHitsPerPeriod": 3.0,
      "averageAccuracy": 50.0,
      "averageCoverage": 50.0,
      "targetHitCount": 3,
      "targetAverageHitCount": 3,
      "targetAverageAccuracy": 50,
      "meetsHitCountTarget": true,
      "meetsAccuracyTarget": true,
      "meetsAllTargets": true,
      "periodsWithAtLeast3Hits": 85,
      "hitRateAtLeast3": 85.0,
      "hitCountDistribution": {
        "0": 5,
        "1": 10,
        "2": 20,
        "3": 30,
        "4": 25,
        "5": 8,
        "6": 2
      },
      "hitCountDetails": [
        {
          "hitCount": 6,
          "periods": 2,
          "percentage": 2.0,
          "meetsTarget": true
        },
        {
          "hitCount": 5,
          "periods": 8,
          "percentage": 8.0,
          "meetsTarget": true
        },
        {
          "hitCount": 4,
          "periods": 25,
          "percentage": 25.0,
          "meetsTarget": true
        },
        {
          "hitCount": 3,
          "periods": 30,
          "percentage": 30.0,
          "meetsTarget": true
        },
        {
          "hitCount": 2,
          "periods": 20,
          "percentage": 20.0,
          "meetsTarget": false
        },
        {
          "hitCount": 1,
          "periods": 10,
          "percentage": 10.0,
          "meetsTarget": false
        },
        {
          "hitCount": 0,
          "periods": 5,
          "percentage": 5.0,
          "meetsTarget": false
        }
      ],
      "targetSummary": {
        "averageHitCount": {
          "current": 3.0,
          "target": 3,
          "meetsTarget": true,
          "gap": 0,
          "status": "達標"
        },
        "averageAccuracy": {
          "current": 50.0,
          "target": 50,
          "meetsTarget": true,
          "gap": 0,
          "status": "達標"
        },
        "overall": {
          "meetsAllTargets": true,
          "status": "所有目標已達成"
        }
      }
    },
    "retryInfo": {
      "totalRetries": 5,
      "maxRetries": 50,
      "meetsTarget": true,
      "allRetryResults": [
        {
          "retryCount": 0,
          "averageHitCount": 2.5,
          "averageAccuracy": 18.5,
          "meetsHitCountTarget": false
        },
        {
          "retryCount": 1,
          "averageHitCount": 2.8,
          "averageAccuracy": 19.2,
          "meetsHitCountTarget": false
        },
        {
          "retryCount": 2,
          "averageHitCount": 3.1,
          "averageAccuracy": 20.0,
          "meetsHitCountTarget": true
        }
      ]
    }
  }
}
```

### 4. POST /api/lottery/simulate

迭代模擬優化預測號碼：使用預測號碼模擬多次開獎，根據命中率迭代優化

**請求體：**
```json
{
  "results": [...],
  "predictedNumbers": [1, 2, 3, 4, 5, 6],
  "options": {
    "simulationRounds": 1000,
    "maxIterations": 10,
    "hitThreshold": 0.1,
    "minKeepCount": 2,
    "weights": {}
  }
}
```

**參數說明：**
- `results` (必需): 歷史開獎結果陣列
- `predictedNumbers` (可選): 初始預測號碼（6個號碼），如果不提供則自動生成
- `options.simulationRounds` (可選): 每輪模擬次數，預設 1000
- `options.maxIterations` (可選): 最大迭代次數，預設 10
- `options.hitThreshold` (可選): 命中率閾值，低於此值的號碼將被替換，預設 0.1 (10%)
- `options.minKeepCount` (可選): 最少保留的號碼數量，預設 2
- `options.weights` (可選): 預測方法的權重參數

**回應範例：**
```json
{
  "success": true,
  "data": {
    "initialPredictedNumbers": [1, 2, 3, 4, 5, 6],
    "finalPredictedNumbers": [7, 12, 23, 31, 35, 42],
    "iterations": 5,
    "converged": true,
    "finalHitStatistics": {
      "totalHits": 1200,
      "hitRate": 0.2,
      "averageHitsPerDraw": 1.2,
      "numberHits": {
        "7": 210,
        "12": 198,
        "23": 205,
        "31": 192,
        "35": 201,
        "42": 194
      }
    },
    "iterationHistory": [
      {
        "iteration": 1,
        "predictedNumbers": [1, 2, 3, 4, 5, 6],
        "hitStatistics": {
          "totalHits": 800,
          "hitRate": 0.133,
          "averageHitsPerDraw": 0.8,
          "numberHits": { "1": 120, "2": 135, ... },
          "numberHitRates": { "1": 0.12, "2": 0.135, ... }
        },
        "highHitNumbers": [2, 3],
        "lowHitNumbers": [1, 4, 5, 6],
        "replacementCount": 4,
        "newPredictedNumbers": [2, 3, 15, 23, 31, 35]
      }
    ],
    "options": {
      "simulationRounds": 1000,
      "maxIterations": 10,
      "hitThreshold": 0.1,
      "minKeepCount": 2
    }
  }
}
```

### 5. POST /api/lottery/simulate/batch

批量模擬測試：批量模擬測試預測號碼的有效性

**請求體：**
```json
{
  "results": [...],
  "predictedNumbers": [1, 2, 3, 4, 5, 6],
  "rounds": 1000,
  "batchSize": 100
}
```

**參數說明：**
- `results` (必需): 歷史開獎結果陣列
- `predictedNumbers` (必需): 預測號碼（6個號碼）
- `rounds` (可選): 模擬輪數，預設 1000
- `batchSize` (可選): 每批模擬次數，預設 100

**回應範例：**
```json
{
  "success": true,
  "data": {
    "predictedNumbers": [1, 2, 3, 4, 5, 6],
    "totalRounds": 1000,
    "overallHitRate": 0.15,
    "averageHitsPerDraw": 0.9,
    "batchResults": [
      {
        "batch": 1,
        "rounds": 100,
        "hitStatistics": {
          "totalHits": 90,
          "hitRate": 0.15,
          "averageHitsPerDraw": 0.9
        }
      }
    ]
  }
}
```

## 技術架構

### 後端
- **Node.js + Express**: 輕量級 Web 框架
- **模組化架構**: 將不同功能拆分到獨立模組
      "averageCoverage": 50.0
    }
  }
}
```

### 6. GET /health

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

### 14. 自回歸模型 (AR - Autoregressive Model)
使用時間序列分析預測未來值：
- **原理**：使用過去N期的值預測未來值，捕捉時間序列中的自相關性
- **模型階數**：預設為3階（AR(3)）
- **預測方法**：基於最小二乘法估計AR係數，計算下一期出現機率
- 應用：捕捉時間序列中的自相關性，識別短期趨勢

### 15. 生存分析 (Survival Analysis)
分析號碼「存活」（未出現）的時間長度：
- **生存時間**：計算每個號碼每次未出現的連續期數
- **危險率 (Hazard Rate)**：在給定時間t，號碼在下一期出現的條件機率
- **指數分布模型**：使用指數分布模型預測號碼再次出現的時機
- 應用：預測號碼何時會再次出現，改進間隔分析

### 16. 極值理論 (Extreme Value Theory)
分析極端事件（如某號碼長期未出現）的分布：
- **最大間隔**：計算每個號碼的歷史最大間隔
- **廣義極值分布 (GEV)**：使用GEV模型分析極值分布
- **回歸水平 (Return Level)**：在給定時間內，極值超過某個閾值的機率
- 應用：評估「冷門號碼」出現的機率，改進間隔分析

### 17. 聚類分析 (Cluster Analysis)
將號碼分組，識別相似的出現模式：
- **相似度計算**：使用餘弦相似度計算號碼之間的相似性
- **K-means聚類**：將號碼分成K個聚類（預設7個），識別相似的出現模式
- **聚類預測**：如果某聚類在最新一期有號碼出現，該聚類的其他號碼可能也會出現
- 應用：發現號碼之間的關聯性，識別號碼組合模式

### 18. 綜合評分
將十八種統計分析方法的分數正規化到 0-100 範圍，然後加權組合：
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
  normalizedCombinatorialScore * weight_combinatorial +
  normalizedAutoregressiveScore * weight_autoregressive +
  normalizedSurvivalScore * weight_survival +
  normalizedExtremeValueScore * weight_extremeValue +
  normalizedClusterScore * weight_cluster +
  normalizedNumberRangeScore * weight_numberRange
```

### 19. 神經運算整合
在迭代驗證過程中，神經網絡預測會整合到綜合評分中：
- **特徵提取**: 從歷史數據中提取號碼出現模式和頻率特徵
- **神經網絡訓練**: 使用多層感知器（2個隱藏層：24和12個神經元）學習模式
- **預測整合**: 神經網絡預測分數佔總分的15%權重
  ```javascript
  finalScore = originalScore * 0.85 + neuralScore * 0.15
  ```
- **候選組合加成**: 在候選組合的模擬評分中，神經網絡預測的號碼獲得額外加成
- **未來預測**: 在生成未來一期預測時，同樣整合神經網絡預測結果

### 20. 智能學習與自動重試
在迭代驗證過程中，系統會：
1. **神經運算**: 使用多層感知器神經網絡學習歷史數據模式
   - 從歷史數據中提取特徵（最近N期的號碼出現模式、頻率特徵等）
   - 訓練神經網絡（2個隱藏層：24和12個神經元）
   - 使用反向傳播算法優化權重
   - 將神經網絡預測分數整合到統計分析中（佔總分15%）
   - 在候選組合評分中加入神經網絡預測加成
2. **模擬評估優化**: 對每個候選組合進行1000次模擬評估，選擇模擬表現最好的組合
3. **分析命中號碼和未命中號碼在各指標中的排名**
4. **計算各指標的效能分數**
5. **根據準確率差距動態調整學習率**
6. **增加表現好的指標權重，減少表現差的指標權重**
7. **確保權重總和為 1，且每個權重在合理範圍內（0.05 - 0.5）**
8. **自動重試機制**: 如果平均每期命中數未達到3或以上，自動重試最多50次
   - 每次重試會調整權重，嘗試不同的組合
   - 選擇最接近目標（平均命中數3）的結果
   - 記錄所有重試結果，提供詳細的重試統計

### 21. 複式投注建議演算法

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
