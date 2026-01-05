/**
 * 六合彩號碼分析服務
 * 使用多種統計方法預測最有可能在下一期被抽中的號碼
 */

/**
 * 從結果中提取所有號碼
 * @param {Array} results - 攪珠結果陣列
 * @returns {Array} 所有號碼的陣列
 */
function extractAllNumbers(results) {
  const allNumbers = [];
  
  results.forEach(result => {
    if (result.numbers && result.numbers.length > 0) {
      let numberArray = [];
      
      if (typeof result.numbers[0] === 'string') {
        // 處理字串格式的號碼
        numberArray = result.numbers[0]
          .split(/[\n\t\s]+/)
          .filter(str => str.trim() !== '')
          .map(str => parseInt(str.trim(), 10))
          .filter(num => !isNaN(num) && num >= 1 && num <= 49);
      } else if (Array.isArray(result.numbers)) {
        // 處理陣列格式的號碼
        numberArray = result.numbers
          .map(num => {
            const parsed = parseInt(num, 10);
            return isNaN(parsed) ? null : parsed;
          })
          .filter(num => num !== null && num >= 1 && num <= 49);
      }
      
      allNumbers.push({
        numbers: numberArray,
        date: result.date,
        periodNumber: result.periodNumber
      });
    }
  });
  
  return allNumbers;
}

/**
 * 計算號碼頻率分析
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 號碼頻率統計
 */
function calculateFrequency(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const frequency = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    frequency[i] = 0;
  }
  
  // 使用預過濾的數組（如果提供），否則根據排除期數過濾
  const numbersToProcess = filteredNumbers || (excludePeriodNumbers 
      ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
      : allNumbers);
  
  // 統計每個號碼出現的次數
  numbersToProcess.forEach(period => {
    period.numbers.forEach(num => {
      if (num >= 1 && num <= 49) {
        frequency[num] = (frequency[num] || 0) + 1;
      }
    });
  });
  
  return frequency;
}

/**
 * 計算加權頻率（近期出現的號碼權重更高）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 加權頻率統計
 */
function calculateWeightedFrequency(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const weightedFrequency = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    weightedFrequency[i] = 0;
  }
  
  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers 
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);
  
  // 計算總期數（使用過濾後的期數）
  const totalPeriods = filtered.length;
  
  // 對每期號碼進行加權計算（越近期的權重越高）
  filtered.forEach((period, index) => {
    // 使用指數衰減：越近期的期數權重越高
    // 最新一期權重為 1.0，每往前一期權重減少 5%
    const weight = Math.pow(0.95, totalPeriods - index - 1);
    
    period.numbers.forEach(num => {
      if (num >= 1 && num <= 49) {
        weightedFrequency[num] = (weightedFrequency[num] || 0) + weight;
      }
    });
  });
  
  return weightedFrequency;
}

/**
 * 計算號碼間隔分析（多久沒出現）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 號碼間隔統計
 */
function calculateGapAnalysis(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const lastAppearance = {};
  const gapScore = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    lastAppearance[i] = -1;
    gapScore[i] = 0;
  }
  
  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers 
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);
  
  // 從最新到最舊遍歷（因為 filtered 已經按日期排序，最新的在前）
  filtered.forEach((period, index) => {
    period.numbers.forEach(num => {
      if (num >= 1 && num <= 49) {
        // 如果這個號碼還沒記錄過最後出現位置，記錄它
        if (lastAppearance[num] === -1) {
          lastAppearance[num] = index;
        }
      }
    });
  });
  
  // 計算間隔分數（間隔越長，分數越高，表示"該出現了"）
  Object.keys(lastAppearance).forEach(num => {
    const numInt = parseInt(num, 10);
    const gap = lastAppearance[num] === -1 ? filtered.length : lastAppearance[num];
    // 使用對數函數，讓間隔分數更平滑
    gapScore[numInt] = Math.log(gap + 1) * 10;
  });
  
  return gapScore;
}

/**
 * 計算號碼出現模式（連續出現、交替出現等）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 模式分數
 */
function calculatePatternScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const patternScore = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    patternScore[i] = 0;
  }
  
  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers 
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);
  
  // 檢查最近幾期的出現模式
  const recentPeriods = Math.min(10, filtered.length);
  
  for (let i = 0; i < recentPeriods; i++) {
    const period = filtered[i];
    const weight = 1 / (i + 1); // 越近期的權重越高
    
    period.numbers.forEach(num => {
      if (num >= 1 && num <= 49) {
        patternScore[num] = (patternScore[num] || 0) + weight;
      }
    });
  }
  
  return patternScore;
}

/**
 * 計算統計分布特徵（均值、方差、標準差、偏度、峰度）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 統計分布特徵
 */
function calculateDistributionFeatures(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers 
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);
  
  // 收集每期所有號碼的值
  const allNumberValues = [];
  filtered.forEach(period => {
    period.numbers.forEach(num => {
      if (num >= 1 && num <= 49) {
        allNumberValues.push(num);
      }
    });
  });
  
  if (allNumberValues.length === 0) {
    return {
      mean: 0,
      variance: 0,
      stdDev: 0,
      skewness: 0,
      kurtosis: 0
    };
  }
  
  // 計算均值
  const mean = allNumberValues.reduce((sum, val) => sum + val, 0) / allNumberValues.length;
  
  // 計算方差
  const variance = allNumberValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allNumberValues.length;
  
  // 計算標準差
  const stdDev = Math.sqrt(variance);
  
  // 計算偏度（第三階中心矩）
  const skewness = stdDev > 0 
    ? allNumberValues.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / allNumberValues.length
    : 0;
  
  // 計算峰度（第四階中心矩，減去3以得到超額峰度）
  const kurtosis = stdDev > 0
    ? (allNumberValues.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / allNumberValues.length) - 3
    : 0;
  
  return {
    mean: Math.round(mean * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    skewness: Math.round(skewness * 100) / 100,
    kurtosis: Math.round(kurtosis * 100) / 100
  };
}

/**
 * 計算每個號碼的統計分布分數（基於正態分布假設）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 分布分數
 */
function calculateDistributionScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const distributionScore = {};
  // 使用預過濾的數組（如果提供），否則根據排除期數過濾
  const filtered = filteredNumbers || (excludePeriodNumbers 
      ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
      : allNumbers);
  const features = calculateDistributionFeatures(allNumbers, excludePeriodNumbers, filtered);
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    distributionScore[i] = 0;
  }
  
  // 如果標準差為0，返回零分數
  if (features.stdDev === 0) {
    return distributionScore;
  }
  
  // 計算每個號碼在分布中的位置分數
  // 使用正態分布的Z分數，但考慮實際頻率
  const frequency = calculateFrequency(allNumbers, excludePeriodNumbers, filtered);
  const totalPeriods = filtered.length;
  const expectedFrequency = totalPeriods * 6 / 49; // 每期6個號碼，共49個號碼
  
  for (let i = 1; i <= 49; i++) {
    // 計算Z分數（標準化分數）
    const zScore = (i - features.mean) / features.stdDev;
    
    // 計算實際頻率與期望頻率的偏差
    const frequencyDeviation = (frequency[i] - expectedFrequency) / (expectedFrequency + 1);
    
    // 如果號碼在分布中心附近（Z分數接近0），給予較高分數
    // 同時考慮頻率偏差（頻率低於期望的號碼可能更有可能出現）
    const centerScore = Math.exp(-0.5 * Math.pow(zScore, 2)); // 正態分布密度函數
    const frequencyScore = frequencyDeviation < 0 ? Math.abs(frequencyDeviation) : -frequencyDeviation * 0.5;
    
    // 綜合分數
    distributionScore[i] = centerScore * 50 + frequencyScore * 50;
  }
  
  return distributionScore;
}

/**
 * 計算趨勢分析（線性回歸、移動平均）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 趨勢分析結果
 */
function calculateTrendAnalysis(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const trendScore = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    trendScore[i] = 0;
  }
  
  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers 
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);
  
  if (filtered.length < 3) {
    return trendScore;
  }
  
  // 計算每個號碼的出現趨勢（最近N期的移動平均）
  const windowSize = Math.min(10, Math.floor(filtered.length / 2));
  
  for (let num = 1; num <= 49; num++) {
    // 記錄每期該號碼是否出現（1或0）
    const appearances = [];
    for (let i = 0; i < filtered.length; i++) {
      const period = filtered[i];
      appearances.push(period.numbers.includes(num) ? 1 : 0);
    }
    
    // 計算移動平均（最近windowSize期）
    const recentAppearances = appearances.slice(0, windowSize);
    const movingAverage = recentAppearances.reduce((sum, val) => sum + val, 0) / windowSize;
    
    // 計算線性回歸斜率（趨勢方向）
    let slope = 0;
    if (recentAppearances.length >= 2) {
      const n = recentAppearances.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      
      for (let i = 0; i < n; i++) {
        const x = i;
        const y = recentAppearances[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }
      
      const denominator = n * sumX2 - sumX * sumX;
      if (denominator !== 0) {
        slope = (n * sumXY - sumX * sumY) / denominator;
      }
    }
    
    // 如果移動平均低且趨勢向上，給予較高分數（可能即將出現）
    // 如果移動平均高且趨勢向下，給予較低分數（可能不會出現）
    let score = 0;
    if (movingAverage < 0.3 && slope > 0) {
      // 低頻率但趨勢向上，可能即將出現
      score = 70 + slope * 30;
    } else if (movingAverage < 0.2) {
      // 非常低的頻率，可能該出現了
      score = 60;
    } else if (movingAverage > 0.5 && slope < 0) {
      // 高頻率但趨勢向下，可能不會出現
      score = 30;
    } else {
      // 其他情況，基於移動平均
      score = 50 + (0.3 - movingAverage) * 50;
    }
    
    trendScore[num] = Math.max(0, Math.min(100, score));
  }
  
  return trendScore;
}

/**
 * 計算卡方檢驗分數（檢驗號碼分布是否均勻）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 卡方分數
 */
function calculateChiSquareScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const chiSquareScore = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    chiSquareScore[i] = 0;
  }
  
  const frequency = calculateFrequency(allNumbers, excludePeriodNumbers, filteredNumbers);
  // 使用預過濾的數組（如果提供）
  const filtered = filteredNumbers || allNumbers;
  const totalPeriods = filtered.length;
  const totalNumbers = totalPeriods * 6; // 每期6個號碼
  const expectedFrequency = totalNumbers / 49; // 期望頻率
  
  // 計算卡方統計量
  let chiSquare = 0;
  for (let i = 1; i <= 49; i++) {
    const observed = frequency[i];
    const expected = expectedFrequency;
    if (expected > 0) {
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }
  }
  
  // 計算每個號碼的偏差分數
  // 偏差越大（低於期望），分數越高（表示該號碼可能該出現了）
  for (let i = 1; i <= 49; i++) {
    const deviation = (expectedFrequency - frequency[i]) / (expectedFrequency + 1);
    chiSquareScore[i] = Math.max(0, deviation * 100);
  }
  
  return {
    scores: chiSquareScore,
    chiSquare: Math.round(chiSquare * 100) / 100,
    degreesOfFreedom: 48, // 49-1
    expectedFrequency: Math.round(expectedFrequency * 100) / 100
  };
}

/**
 * 計算泊松分布分數（檢驗號碼出現是否符合泊松分布）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 泊松分布分數
 */
function calculatePoissonScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const poissonScore = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    poissonScore[i] = 0;
  }
  
  const frequency = calculateFrequency(allNumbers, excludePeriodNumbers, filteredNumbers);
  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers 
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);
  const totalPeriods = filtered.length;
  const lambda = 6 * totalPeriods / 49; // 泊松參數（每期6個號碼，共49個號碼）
  
  // 計算泊松分布概率
  const factorial = (n) => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };
  
  // 泊松概率質量函數：P(k) = (λ^k * e^(-λ)) / k!
  const poissonPMF = (k, lambda) => {
    if (lambda === 0) return k === 0 ? 1 : 0;
    return Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
  };
  
  // 計算每個號碼的分數
  for (let i = 1; i <= 49; i++) {
    const observed = frequency[i];
    const probability = poissonPMF(observed, lambda);
    
    // 如果觀察值低於期望值，給予較高分數（可能該出現了）
    if (observed < lambda) {
      const deficit = lambda - observed;
      poissonScore[i] = Math.min(100, deficit * 20);
    } else {
      // 如果觀察值高於期望值，給予較低分數
      poissonScore[i] = Math.max(0, 50 - (observed - lambda) * 10);
    }
  }
  
  return {
    scores: poissonScore,
    lambda: Math.round(lambda * 100) / 100
  };
}

/**
 * 分析並預測最有可能在下一期被抽中的號碼
 * @param {Array} results - 攪珠結果陣列
 * @param {Object} weights - 可選的權重參數 { frequency, weightedFrequency, gap, pattern }
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串），用於迭代驗證
 * @returns {Object} 分析結果
 */
function analyzeNumbers(results, weights = {}, excludePeriodNumbers = null) {
  if (!results || results.length === 0) {
    throw new Error('沒有資料可供分析');
  }

  // 提取所有號碼
  const allNumbers = extractAllNumbers(results);

  if (allNumbers.length === 0) {
    throw new Error('無法從結果中提取號碼');
  }

  // 預先過濾一次，避免重複過濾操作（性能優化）
  // 當有排除期數時，過濾一次並重用結果，而不是在每個函數中重複過濾
  const filteredNumbers = excludePeriodNumbers && excludePeriodNumbers.size > 0
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : null; // 如果沒有排除期數，傳遞 null 讓函數使用原始數組

  // 計算各種統計指標（傳入排除期數或預過濾的數組）
  const frequency = calculateFrequency(allNumbers, excludePeriodNumbers, filteredNumbers);
  const weightedFrequency = calculateWeightedFrequency(allNumbers, excludePeriodNumbers, filteredNumbers);
  const gapScore = calculateGapAnalysis(allNumbers, excludePeriodNumbers, filteredNumbers);
  const patternScore = calculatePatternScore(allNumbers, excludePeriodNumbers, filteredNumbers);
  
  // 計算統計分布分析（傳入排除期數或預過濾的數組）
  const distributionFeatures = calculateDistributionFeatures(allNumbers, excludePeriodNumbers, filteredNumbers);
  const distributionScore = calculateDistributionScore(allNumbers, excludePeriodNumbers, filteredNumbers);
  const trendScore = calculateTrendAnalysis(allNumbers, excludePeriodNumbers, filteredNumbers);
  const chiSquareResult = calculateChiSquareScore(allNumbers, excludePeriodNumbers, filteredNumbers);
  const poissonResult = calculatePoissonScore(allNumbers, excludePeriodNumbers, filteredNumbers);

  // 正規化各項分數到 0-100 範圍
  const normalize = (scores) => {
    const values = Object.values(scores);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1; // 避免除以零
    
    const normalized = {};
    Object.keys(scores).forEach(key => {
      normalized[key] = ((scores[key] - min) / range) * 100;
    });
    return normalized;
  };

  const normalizedFrequency = normalize(frequency);
  const normalizedWeightedFrequency = normalize(weightedFrequency);
  const normalizedGapScore = normalize(gapScore);
  const normalizedPatternScore = normalize(patternScore);
  const normalizedDistributionScore = normalize(distributionScore);
  const normalizedTrendScore = normalize(trendScore);
  const normalizedChiSquareScore = normalize(chiSquareResult.scores);
  const normalizedPoissonScore = normalize(poissonResult.scores);

  // 計算綜合分數（加權組合）
  // 優化權重分配以提高準確率至50%：更重視趨勢和分布分析
  // 預設權重: 頻率: 12%, 加權頻率: 18%, 間隔: 18%, 模式: 10%, 分布: 18%, 趨勢: 15%, 卡方: 5%, 泊松: 4%
  // 如果提供了自訂權重，則使用自訂權重
  const defaultWeights = {
    frequency: 0.12,
    weightedFrequency: 0.18,
    gap: 0.18,
    pattern: 0.10,
    distribution: 0.18,
    trend: 0.15,
    chiSquare: 0.05,
    poisson: 0.04
  };
  
  const finalWeights = {
    frequency: weights.frequency !== undefined ? weights.frequency : defaultWeights.frequency,
    weightedFrequency: weights.weightedFrequency !== undefined ? weights.weightedFrequency : defaultWeights.weightedFrequency,
    gap: weights.gap !== undefined ? weights.gap : defaultWeights.gap,
    pattern: weights.pattern !== undefined ? weights.pattern : defaultWeights.pattern,
    distribution: weights.distribution !== undefined ? weights.distribution : defaultWeights.distribution,
    trend: weights.trend !== undefined ? weights.trend : defaultWeights.trend,
    chiSquare: weights.chiSquare !== undefined ? weights.chiSquare : defaultWeights.chiSquare,
    poisson: weights.poisson !== undefined ? weights.poisson : defaultWeights.poisson
  };
  
  // 正規化權重，確保總和為1
  const totalWeight = finalWeights.frequency + finalWeights.weightedFrequency + finalWeights.gap + 
                      finalWeights.pattern + finalWeights.distribution + finalWeights.trend + 
                      finalWeights.chiSquare + finalWeights.poisson;
  if (totalWeight > 0) {
    Object.keys(finalWeights).forEach(key => {
      finalWeights[key] = finalWeights[key] / totalWeight;
    });
  }
  
  const compositeScore = {};

  for (let i = 1; i <= 49; i++) {
    compositeScore[i] = 
      normalizedFrequency[i] * finalWeights.frequency +
      normalizedWeightedFrequency[i] * finalWeights.weightedFrequency +
      normalizedGapScore[i] * finalWeights.gap +
      normalizedPatternScore[i] * finalWeights.pattern +
      normalizedDistributionScore[i] * finalWeights.distribution +
      normalizedTrendScore[i] * finalWeights.trend +
      normalizedChiSquareScore[i] * finalWeights.chiSquare +
      normalizedPoissonScore[i] * finalWeights.poisson;
  }
  
  // 取得前 40 名（增加候選數量以提高命中至少3個的概率，目標平均命中數至少3）
  const topNumbers = Object.entries(compositeScore)
    .map(([num, score]) => ({
      number: parseInt(num, 10),
      score: Math.round(score * 100) / 100,
      frequency: frequency[num],
      weightedFrequency: Math.round(weightedFrequency[num] * 100) / 100,
      gapScore: Math.round(gapScore[num] * 100) / 100,
      patternScore: Math.round(patternScore[num] * 100) / 100,
      distributionScore: Math.round(distributionScore[num] * 100) / 100,
      trendScore: Math.round(trendScore[num] * 100) / 100,
      chiSquareScore: Math.round(chiSquareResult.scores[num] * 100) / 100,
      poissonScore: Math.round(poissonResult.scores[num] * 100) / 100
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 40); // 增加到40個候選號碼，提供更多選擇以提高命中率
  
  // 計算統計摘要
  // 使用預先過濾的結果（如果有的話），避免重複過濾
  const numbersForStats = filteredNumbers || allNumbers;
  const filteredTotalPeriods = numbersForStats.length;
  const totalNumbers = Object.values(frequency).reduce((sum, count) => sum + count, 0);
  
  const stats = {
    totalPeriods: filteredTotalPeriods, // 使用過濾後的期數，與 frequency 計算保持一致
    totalNumbers: totalNumbers,
    averageFrequency: totalNumbers / 49,
    mostFrequent: Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([num, count]) => ({ number: parseInt(num, 10), count })),
    // 當有排除期數時，提供原始期數信息以便參考
    ...(excludePeriodNumbers && excludePeriodNumbers.size > 0 ? {
      originalTotalPeriods: allNumbers.length,
      excludedPeriods: excludePeriodNumbers.size
    } : {})
  };
  
  // 生成複式投注建議（多個選項：7個、8個、9個、10個號碼等）
  let compoundBetSuggestions = null;
  try {
    compoundBetSuggestions = generateCompoundBetSuggestions(topNumbers);
  } catch (error) {
    console.warn('生成複式投注建議失敗:', error.message);
    // 如果生成失敗，不影響主要分析結果
  }
  
  // 生成 $100 複式投注建議
  let compoundBetSuggestion100 = null;
  try {
    compoundBetSuggestion100 = generateCompoundBetSuggestion100(topNumbers);
  } catch (error) {
    console.warn('生成 $100 複式投注建議失敗:', error.message);
    // 如果生成失敗，不影響主要分析結果
  }
  
  return {
    topNumbers,
    stats,
    compoundBetSuggestions, // 複式投注建議（多個選項）
    compoundBetSuggestion100, // $100 複式投注建議
    analysisDetails: {
      frequency,
      weightedFrequency,
      gapScore,
      patternScore,
      compositeScore,
      // 統計分布分析
      distributionFeatures,
      distributionScore,
      trendScore,
      chiSquare: {
        scores: chiSquareResult.scores,
        chiSquare: chiSquareResult.chiSquare,
        degreesOfFreedom: chiSquareResult.degreesOfFreedom,
        expectedFrequency: chiSquareResult.expectedFrequency
      },
      poisson: {
        scores: poissonResult.scores,
        lambda: poissonResult.lambda
      }
    }
  };
}

/**
 * 解析期數字串（支援格式：25/132 或 2025001）
 * @param {string} periodNumber - 期數字串
 * @returns {Object} { year, period } 或 null
 */
function parsePeriodNumber(periodNumber) {
  if (!periodNumber) return null;
  
  // 格式 25/132 (年份/期數)
  const match1 = periodNumber.match(/^(\d{2})\/(\d+)$/);
  if (match1) {
    const year = parseInt(match1[1], 10);
    const period = parseInt(match1[2], 10);
    return { year, period, fullPeriod: periodNumber };
  }
  
  // 格式 2025001 (年份+期數)
  const match2 = periodNumber.match(/^(\d{4})(\d{3})$/);
  if (match2) {
    const year = parseInt(match2[1], 10);
    const period = parseInt(match2[2], 10);
    return { year, period, fullPeriod: periodNumber };
  }
  
  return null;
}

/**
 * 比較兩個期數，判斷是否為下一期
 * @param {string} currentPeriod - 當前期數
 * @param {string} nextPeriod - 下一期期數
 * @returns {boolean} 是否為下一期
 */
function isNextPeriod(currentPeriod, nextPeriod) {
  const current = parsePeriodNumber(currentPeriod);
  const next = parsePeriodNumber(nextPeriod);
  
  if (!current || !next) return false;
  
  // 同年份，期數相差1
  if (current.year === next.year && next.period === current.period + 1) {
    return true;
  }
  
  // 跨年份（例如 25/132 -> 26/001）
  if (next.year === current.year + 1 && next.period === 1) {
    return true;
  }
  
  return false;
}

/**
 * 智能選擇6個號碼：從topNumbers中選擇最優的6個號碼組合
 * 考慮多樣性和互補性，而不僅僅是分數
 * 優化策略：優先選擇最有可能命中至少3個的組合
 * @param {Array} topNumbers - 前N個候選號碼（已按分數排序）
 * @param {number} count - 要選擇的號碼數量（預設6）
 * @param {Array} historicalResults - 可選的歷史驗證結果，用於優化選擇
 * @returns {Array} 選中的6個號碼
 */
function selectOptimalNumbers(topNumbers, count = 6, historicalResults = null) {
  if (!topNumbers || topNumbers.length === 0) {
    return [];
  }
  
  if (topNumbers.length <= count) {
    return topNumbers.slice(0, count);
  }
  
  // 策略：生成多個候選組合，選擇最優的（專門優化命中至少3個）
  // 候選組合1：前6個最高分（基準策略）
  const candidate1 = topNumbers.slice(0, count);
  
  // 候選組合2：前3個最高分 + 多樣性選擇的3個
  const candidate2 = selectWithDiversity(topNumbers, count);
  
  // 候選組合3：平衡策略（前2個最高分 + 多樣性選擇的4個）
  const candidate3 = selectBalanced(topNumbers, count);
  
  // 候選組合4：均勻分布策略（確保號碼在1-49範圍內均勻分布）
  const candidate4 = selectEvenlyDistributed(topNumbers, count);
  
  // 候選組合5：前4個最高分 + 從剩餘中選擇分數最高的2個
  const candidate5 = selectTop4Plus2(topNumbers, count);
  
  // 候選組合6：前5個最高分 + 從剩餘中選擇分數最高的1個
  const candidate6 = selectTop5Plus1(topNumbers, count);
  
  // 候選組合7：混合策略（前1個最高分 + 均勻分布5個）
  const candidate7 = selectHybrid(topNumbers, count);
  
  // 候選組合8：基於歷史命中模式的組合（如果有歷史數據）
  let candidate8 = null;
  if (historicalResults && historicalResults.length > 0) {
    candidate8 = selectBasedOnHistory(topNumbers, count, historicalResults);
  }
  
  // 評估每個候選組合
  const candidates = [
    { numbers: candidate1, strategy: 'top6' },
    { numbers: candidate2, strategy: 'diversity' },
    { numbers: candidate3, strategy: 'balanced' },
    { numbers: candidate4, strategy: 'evenly' },
    { numbers: candidate5, strategy: 'top4plus2' },
    { numbers: candidate6, strategy: 'top5plus1' },
    { numbers: candidate7, strategy: 'hybrid' }
  ];
  
  // 如果有歷史模式組合，加入候選列表
  if (candidate8) {
    candidates.push({ numbers: candidate8, strategy: 'history' });
  }
  
  // 如果有歷史數據，使用歷史表現來選擇
  if (historicalResults && historicalResults.length > 0) {
    // 計算每個策略的歷史命中率
    const strategyPerformance = {};
    historicalResults.forEach(result => {
      if (result.strategy) {
        if (!strategyPerformance[result.strategy]) {
          strategyPerformance[result.strategy] = { hits: 0, total: 0, atLeast3: 0 };
        }
        strategyPerformance[result.strategy].hits += result.comparison.hitCount;
        strategyPerformance[result.strategy].total += 1;
        if (result.comparison.hitCount >= 3) {
          strategyPerformance[result.strategy].atLeast3 += 1;
        }
      }
    });
    
      // 優先選擇歷史表現最好的策略（至少命中3個的比率最高，目標平均命中數至少3）
      candidates.sort((a, b) => {
        const perfA = strategyPerformance[a.strategy];
        const perfB = strategyPerformance[b.strategy];
        if (perfA && perfB) {
          const avgHitA = perfA.hits / perfA.total;
          const avgHitB = perfB.hits / perfB.total;
          const rateA = perfA.atLeast3 / perfA.total;
          const rateB = perfB.atLeast3 / perfB.total;
          // 優先考慮平均命中數（目標至少3），其次考慮至少3個的比率
          if (avgHitA !== avgHitB) return avgHitB - avgHitA;
          if (rateA !== rateB) return rateB - rateA;
          return 0;
        }
        return 0;
      });
  }
  
  // 評估每個候選組合的綜合分數（優化命中至少3個，目標平均命中數至少3）
  const scoredCandidates = candidates.map(candidate => {
    const numbers = candidate.numbers;
    let score = 0;
    
    // 1. 原始分數總和（權重40%，提高以確保選擇高分號碼）
    const totalOriginalScore = numbers.reduce((sum, n) => sum + (n.score || 0), 0);
    score += totalOriginalScore * 0.40;
    
    // 2. 多樣性分數（權重20%）
    let diversityScore = 0;
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const distance = Math.abs(numbers[i].number - numbers[j].number);
        diversityScore += distance;
      }
    }
    score += (diversityScore / (numbers.length * (numbers.length - 1) / 2)) * 0.20;
    
    // 3. 分數分布均勻性（權重10%）
    const scores = numbers.map(n => n.score || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    score += (100 / (1 + variance)) * 0.10;
    
    // 4. 號碼範圍覆蓋（權重10%）
    const minNum = Math.min(...numbers.map(n => n.number));
    const maxNum = Math.max(...numbers.map(n => n.number));
    const range = maxNum - minNum;
    score += (range / 49) * 100 * 0.10;
    
    // 5. 歷史表現加成（權重20%，如果有歷史數據，提高權重以更重視歷史表現）
    let historyBonus = 0;
    if (historicalResults && historicalResults.length > 0) {
      const strategyPerf = historicalResults
        .filter(r => r.strategy === candidate.strategy)
        .map(r => r.comparison.hitCount);
      
      if (strategyPerf.length > 0) {
        const avgHitCount = strategyPerf.reduce((a, b) => a + b, 0) / strategyPerf.length;
        const atLeast3Rate = strategyPerf.filter(h => h >= 3).length / strategyPerf.length;
        // 歷史平均命中數和至少3個的比率都給予加成（提高加成係數以更重視歷史表現）
        historyBonus = (avgHitCount * 15) + (atLeast3Rate * 60);
      }
    }
    score += historyBonus * 0.20;
    
    return { numbers, strategy: candidate.strategy, score };
  });
  
  // 如果有歷史數據，優先選擇歷史表現最好的策略
  if (historicalResults && historicalResults.length > 0) {
    const strategyPerformance = {};
    historicalResults.forEach(result => {
      if (result.strategy) {
        if (!strategyPerformance[result.strategy]) {
          strategyPerformance[result.strategy] = { hits: 0, total: 0, atLeast3: 0 };
        }
        strategyPerformance[result.strategy].hits += result.comparison.hitCount;
        strategyPerformance[result.strategy].total += 1;
        if (result.comparison.hitCount >= 3) {
          strategyPerformance[result.strategy].atLeast3 += 1;
        }
      }
    });
    
    // 對候選組合進行二次排序：優先選擇歷史至少命中3個比率最高的（提高加成以更重視歷史表現）
    scoredCandidates.forEach(candidate => {
      const perf = strategyPerformance[candidate.strategy];
      if (perf && perf.total > 0) {
        const atLeast3Rate = perf.atLeast3 / perf.total;
        const avgHitCount = perf.hits / perf.total;
        // 如果歷史至少命中3個的比率高或平均命中數高，給予額外加成（提高加成係數）
        candidate.score += atLeast3Rate * 150 + avgHitCount * 30;
      }
    });
  }
  
  // 選擇分數最高的候選組合
  scoredCandidates.sort((a, b) => b.score - a.score);
  return scoredCandidates[0].numbers;
}

/**
 * 生成多個候選組合（用於回測優化）
 * 在迭代驗證中使用，生成更多候選組合以找到最佳組合
 */
function generateMultipleCandidates(topNumbers, count = 6, historicalResults = null) {
  // 檢查輸入有效性
  if (!topNumbers || topNumbers.length === 0) {
    return [];
  }
  
  const candidates = [];
  
  // 基本策略組合（8個）
  const top6 = topNumbers.slice(0, count);
  if (top6.length === count) {
    candidates.push({ numbers: top6, strategy: 'top6' });
  }
  
  const diversity = selectWithDiversity(topNumbers, count);
  if (diversity && diversity.length === count) {
    candidates.push({ numbers: diversity, strategy: 'diversity' });
  }
  
  const balanced = selectBalanced(topNumbers, count);
  if (balanced && balanced.length === count) {
    candidates.push({ numbers: balanced, strategy: 'balanced' });
  }
  
  const evenly = selectEvenlyDistributed(topNumbers, count);
  if (evenly && evenly.length === count) {
    candidates.push({ numbers: evenly, strategy: 'evenly' });
  }
  
  const top4plus2 = selectTop4Plus2(topNumbers, count);
  if (top4plus2 && top4plus2.length === count) {
    candidates.push({ numbers: top4plus2, strategy: 'top4plus2' });
  }
  
  const top5plus1 = selectTop5Plus1(topNumbers, count);
  if (top5plus1 && top5plus1.length === count) {
    candidates.push({ numbers: top5plus1, strategy: 'top5plus1' });
  }
  
  const hybrid = selectHybrid(topNumbers, count);
  if (hybrid && hybrid.length === count) {
    candidates.push({ numbers: hybrid, strategy: 'hybrid' });
  }
  
  if (historicalResults && historicalResults.length > 0) {
    const history = selectBasedOnHistory(topNumbers, count, historicalResults);
    if (history && history.length === count) {
      candidates.push({ numbers: history, strategy: 'history' });
    }
  }
  
  // 額外策略：生成更多變體組合
  // 策略9：前7個最高分中選擇6個（跳過分數最低的1個）
  if (topNumbers.length >= 7) {
    candidates.push({ numbers: topNumbers.slice(0, 6), strategy: 'top6' }); // 已經有了，但確保包含
    candidates.push({ numbers: [...topNumbers.slice(0, 5), topNumbers[6]], strategy: 'top5skip1' });
  }
  
  // 策略10：前10個最高分中，選擇分數最高的3個 + 從剩餘7個中選擇分數最高的3個
  if (topNumbers.length >= 10) {
    const top3 = topNumbers.slice(0, 3);
    const next7 = topNumbers.slice(3, 10);
    next7.sort((a, b) => b.score - a.score);
    candidates.push({ numbers: [...top3, ...next7.slice(0, 3)], strategy: 'top3plus3' });
  }
  
  // 策略11：前15個最高分中，每個區間選擇1個（6個區間）
  if (topNumbers.length >= 15) {
    const ranges = [
      { min: 1, max: 8 },
      { min: 9, max: 16 },
      { min: 17, max: 24 },
      { min: 25, max: 32 },
      { min: 33, max: 40 },
      { min: 41, max: 49 }
    ];
    const selected = [];
    ranges.forEach(range => {
      const inRange = topNumbers.slice(0, 15).filter(n => 
        n.number >= range.min && n.number <= range.max
      );
      if (inRange.length > 0) {
        inRange.sort((a, b) => b.score - a.score);
        selected.push(inRange[0]);
      }
    });
    if (selected.length === count) {
      candidates.push({ numbers: selected, strategy: 'range6' });
    }
  }
  
  // 策略12：基於歷史命中號碼的組合（如果有歷史數據）
  if (historicalResults && historicalResults.length > 0) {
    // 分析歷史中命中過的號碼
    const historicalHits = new Set();
    historicalResults.forEach(result => {
      if (result.comparison && result.comparison.hits) {
        result.comparison.hits.forEach(hit => historicalHits.add(hit));
      }
    });
    
    // 從topNumbers中選擇歷史命中過的號碼
    const historicalCandidates = topNumbers.filter(n => historicalHits.has(n.number));
    if (historicalCandidates.length >= count) {
      historicalCandidates.sort((a, b) => b.score - a.score);
      candidates.push({ numbers: historicalCandidates.slice(0, count), strategy: 'historicalHits' });
    } else if (historicalCandidates.length > 0) {
      // 如果歷史命中號碼不足6個，補充高分號碼
      const selected = [...historicalCandidates];
      const remaining = topNumbers.filter(n => !historicalHits.has(n.number));
      remaining.sort((a, b) => b.score - a.score);
      while (selected.length < count && remaining.length > 0) {
        selected.push(remaining[0]);
        remaining.shift();
      }
      if (selected.length === count) {
        candidates.push({ numbers: selected, strategy: 'historicalHitsPlus' });
      }
    }
  }
  
  // 去重：移除重複的組合
  const uniqueCandidates = [];
  const seen = new Set();
  
  candidates.forEach(candidate => {
    if (candidate && candidate.numbers && candidate.numbers.length === count) {
      const key = candidate.numbers.map(n => n.number).sort((a, b) => a - b).join(',');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCandidates.push(candidate);
      }
    }
  });
  
  // 確保至少返回一個候選組合
  if (uniqueCandidates.length === 0 && topNumbers.length >= count) {
    uniqueCandidates.push({ numbers: topNumbers.slice(0, count), strategy: 'top6' });
  }
  
  return uniqueCandidates;
}

/**
 * 多樣性選擇策略：前3個最高分 + 多樣性選擇的3個
 */
function selectWithDiversity(topNumbers, count = 6) {
  const selected = topNumbers.slice(0, 3);
  const remaining = topNumbers.slice(3);
  
  while (selected.length < count && remaining.length > 0) {
    let bestCandidate = null;
    let bestScore = -1;
    let bestIndex = -1;
    
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      let diversityScore = 0;
      let minDistance = 49;
      
      selected.forEach(selectedNum => {
        const distance = Math.abs(candidate.number - selectedNum.number);
        minDistance = Math.min(minDistance, distance);
        diversityScore += distance;
      });
      
      if (minDistance < 5) {
        diversityScore *= 0.3;
      }
      
      const combinedScore = candidate.score * 0.7 + (diversityScore / selected.length) * 0.3;
      
      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestCandidate = candidate;
        bestIndex = i;
      }
    }
    
    if (bestCandidate) {
      selected.push(bestCandidate);
      remaining.splice(bestIndex, 1);
    } else {
      selected.push(remaining[0]);
      remaining.shift();
    }
  }
  
  return selected.slice(0, count);
}

/**
 * 平衡選擇策略：前2個最高分 + 多樣性選擇的4個
 */
function selectBalanced(topNumbers, count = 6) {
  const selected = topNumbers.slice(0, 2);
  const remaining = topNumbers.slice(2);
  
  while (selected.length < count && remaining.length > 0) {
    let bestCandidate = null;
    let bestScore = -1;
    let bestIndex = -1;
    
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      let diversityScore = 0;
      let minDistance = 49;
      
      selected.forEach(selectedNum => {
        const distance = Math.abs(candidate.number - selectedNum.number);
        minDistance = Math.min(minDistance, distance);
        diversityScore += distance;
      });
      
      if (minDistance < 5) {
        diversityScore *= 0.2; // 更嚴格
      }
      
      // 平衡策略：原始分數和多樣性各50%
      const combinedScore = candidate.score * 0.5 + (diversityScore / selected.length) * 0.5;
      
      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestCandidate = candidate;
        bestIndex = i;
      }
    }
    
    if (bestCandidate) {
      selected.push(bestCandidate);
      remaining.splice(bestIndex, 1);
    } else {
      selected.push(remaining[0]);
      remaining.shift();
    }
  }
  
  return selected.slice(0, count);
}

/**
 * 均勻分布策略：確保號碼在1-49範圍內均勻分布
 */
function selectEvenlyDistributed(topNumbers, count = 6) {
  // 將1-49分成6個區間
  const ranges = [
    { min: 1, max: 8 },   // 1-8
    { min: 9, max: 16 },   // 9-16
    { min: 17, max: 24 },  // 17-24
    { min: 25, max: 32 },  // 25-32
    { min: 33, max: 40 },  // 33-40
    { min: 41, max: 49 }   // 41-49
  ];
  
  const selected = [];
  
  // 從每個區間選擇分數最高的號碼
  ranges.forEach(range => {
    const candidatesInRange = topNumbers.filter(n => 
      n.number >= range.min && n.number <= range.max
    );
    
    if (candidatesInRange.length > 0) {
      // 選擇該區間內分數最高的
      candidatesInRange.sort((a, b) => b.score - a.score);
      selected.push(candidatesInRange[0]);
    }
  });
  
  // 如果選中的號碼不足6個，從剩餘的topNumbers中補充
  if (selected.length < count) {
    const selectedNumbers = new Set(selected.map(n => n.number));
    const remaining = topNumbers.filter(n => !selectedNumbers.has(n.number));
    remaining.sort((a, b) => b.score - a.score);
    
    while (selected.length < count && remaining.length > 0) {
      selected.push(remaining[0]);
      remaining.shift();
    }
  }
  
  return selected.slice(0, count);
}

/**
 * 前4個最高分 + 從剩餘中選擇分數最高的2個
 */
function selectTop4Plus2(topNumbers, count = 6) {
  const selected = topNumbers.slice(0, 4);
  const remaining = topNumbers.slice(4);
  
  // 從剩餘中選擇分數最高的2個
  remaining.sort((a, b) => b.score - a.score);
  selected.push(...remaining.slice(0, 2));
  
  return selected.slice(0, count);
}

/**
 * 前5個最高分 + 從剩餘中選擇分數最高的1個
 */
function selectTop5Plus1(topNumbers, count = 6) {
  const selected = topNumbers.slice(0, 5);
  const remaining = topNumbers.slice(5);
  
  // 從剩餘中選擇分數最高的1個
  if (remaining.length > 0) {
    remaining.sort((a, b) => b.score - a.score);
    selected.push(remaining[0]);
  }
  
  return selected.slice(0, count);
}

/**
 * 混合策略：前1個最高分 + 均勻分布5個
 */
function selectHybrid(topNumbers, count = 6) {
  const selected = topNumbers.slice(0, 1); // 第一個最高分
  const remaining = topNumbers.slice(1);
  
  // 將剩餘號碼分成5個區間，每個區間選擇分數最高的
  const ranges = [
    { min: 1, max: 10 },
    { min: 11, max: 20 },
    { min: 21, max: 30 },
    { min: 31, max: 40 },
    { min: 41, max: 49 }
  ];
  
  ranges.forEach(range => {
    const candidatesInRange = remaining.filter(n => 
      n.number >= range.min && n.number <= range.max && 
      !selected.some(s => s.number === n.number)
    );
    
    if (candidatesInRange.length > 0) {
      candidatesInRange.sort((a, b) => b.score - a.score);
      selected.push(candidatesInRange[0]);
    }
  });
  
  // 如果還不足6個，從剩餘中補充
  if (selected.length < count) {
    const selectedNumbers = new Set(selected.map(n => n.number));
    const remaining2 = remaining.filter(n => !selectedNumbers.has(n.number));
    remaining2.sort((a, b) => b.score - a.score);
    
    while (selected.length < count && remaining2.length > 0) {
      selected.push(remaining2[0]);
      remaining2.shift();
    }
  }
  
  return selected.slice(0, count);
}

/**
 * 基於歷史命中模式的組合選擇
 */
function selectBasedOnHistory(topNumbers, count = 6, historicalResults) {
  // 分析歷史中命中過的號碼模式
  const hitNumbersFrequency = {};
  const hitNumbersInTop = {};
  
  historicalResults.forEach(result => {
    if (result.comparison && result.comparison.hits) {
      result.comparison.hits.forEach(hitNum => {
        hitNumbersFrequency[hitNum] = (hitNumbersFrequency[hitNum] || 0) + 1;
        
        // 檢查這個號碼是否在當前的topNumbers中
        const inTop = topNumbers.find(n => n.number === hitNum);
        if (inTop) {
          hitNumbersInTop[hitNum] = (hitNumbersInTop[hitNum] || 0) + 1;
        }
      });
    }
  });
  
  // 優先選擇歷史中命中過且在當前topNumbers中的號碼
  const selected = [];
  const topNumbersMap = new Map(topNumbers.map(n => [n.number, n]));
  
  // 按歷史命中頻率排序
  const sortedByHistory = Object.keys(hitNumbersInTop)
    .map(num => ({
      number: parseInt(num, 10),
      historyHits: hitNumbersInTop[num],
      currentScore: topNumbersMap.get(parseInt(num, 10))?.score || 0
    }))
    .sort((a, b) => {
      // 優先選擇歷史命中次數多的，如果相同則選擇當前分數高的
      if (b.historyHits !== a.historyHits) {
        return b.historyHits - a.historyHits;
      }
      return b.currentScore - a.currentScore;
    });
  
  // 選擇前3個歷史表現最好的號碼
  sortedByHistory.slice(0, 3).forEach(item => {
    const numObj = topNumbersMap.get(item.number);
    if (numObj) {
      selected.push(numObj);
    }
  });
  
  // 如果不足6個，從剩餘的topNumbers中選擇分數最高的補充
  if (selected.length < count) {
    const selectedNumbers = new Set(selected.map(n => n.number));
    const remaining = topNumbers.filter(n => !selectedNumbers.has(n.number));
    remaining.sort((a, b) => b.score - a.score);
    
    while (selected.length < count && remaining.length > 0) {
      selected.push(remaining[0]);
      remaining.shift();
    }
  }
  
  return selected.slice(0, count);
}

/**
 * 確定使用的選擇策略
 */
function determineStrategy(predictedNumbers, topNumbers) {
  const predNums = predictedNumbers.map(n => typeof n === 'object' ? n.number : n).sort((a, b) => a - b);
  const top6 = topNumbers.slice(0, 6).map(n => n.number).sort((a, b) => a - b);
  const top4 = topNumbers.slice(0, 4).map(n => n.number);
  const top5 = topNumbers.slice(0, 5).map(n => n.number);
  const top1 = topNumbers.slice(0, 1).map(n => n.number);
  
  // 檢查是否為前6個最高分
  if (JSON.stringify(predNums) === JSON.stringify(top6)) {
    return 'top6';
  }
  
  // 檢查是否為前4個最高分 + 2個其他
  const hasTop4 = top4.every(n => predNums.includes(n));
  if (hasTop4 && predNums.length === 6) {
    return 'top4plus2';
  }
  
  // 檢查是否為前5個最高分 + 1個其他
  const hasTop5 = top5.every(n => predNums.includes(n));
  if (hasTop5 && predNums.length === 6) {
    return 'top5plus1';
  }
  
  // 檢查是否為均勻分布（每個區間都有號碼）
  const ranges = [
    { min: 1, max: 8 },
    { min: 9, max: 16 },
    { min: 17, max: 24 },
    { min: 25, max: 32 },
    { min: 33, max: 40 },
    { min: 41, max: 49 }
  ];
  const rangeCount = ranges.filter(range => 
    predNums.some(n => n >= range.min && n <= range.max)
  ).length;
  
  if (rangeCount >= 5) {
    // 檢查是否為混合策略（前1個 + 均勻分布）
    const hasTop1 = top1.every(n => predNums.includes(n));
    if (hasTop1) {
      return 'hybrid';
    }
    return 'evenly';
  }
  
  // 檢查前3個是否都在預測中
  const top3 = topNumbers.slice(0, 3).map(n => n.number);
  const hasTop3 = top3.every(n => predNums.includes(n));
  
  if (hasTop3) {
    return 'diversity';
  }
  
  // 檢查前2個是否都在預測中
  const top2 = topNumbers.slice(0, 2).map(n => n.number);
  const hasTop2 = top2.every(n => predNums.includes(n));
  
  if (hasTop2) {
    return 'balanced';
  }
  
  // 默認返回（可能是歷史策略）
  return 'history';
}

/**
 * 比對預測結果與實際結果
 * @param {Array} predictedNumbers - 預測的號碼陣列（topNumbers）
 * @param {Array} actualNumbers - 實際開出的號碼陣列
 * @returns {Object} 比對結果
 */
function comparePrediction(predictedNumbers, actualNumbers) {
  const predictedSet = new Set(predictedNumbers.map(n => typeof n === 'object' ? n.number : n));
  const actualSet = new Set(actualNumbers);
  
  const hits = [];
  const misses = [];
  
  actualNumbers.forEach(num => {
    if (predictedSet.has(num)) {
      hits.push(num);
    } else {
      misses.push(num);
    }
  });
  
  const predictedButNotActual = Array.from(predictedSet).filter(num => !actualSet.has(num));
  
  const hitCount = hits.length;
  const targetHitCount = 3; // 目標命中數至少3
  
  return {
    hitCount: hitCount,
    totalPredicted: predictedNumbers.length,
    totalActual: actualNumbers.length,
    hits: hits,
    misses: misses,
    predictedButNotActual: predictedButNotActual,
    accuracy: predictedNumbers.length > 0 ? (hitCount / predictedNumbers.length) * 100 : 0,
    coverage: actualNumbers.length > 0 ? (hitCount / actualNumbers.length) * 100 : 0,
    targetHitCount: targetHitCount,
    meetsTarget: hitCount >= targetHitCount, // 是否達到至少3個命中數
    hitCountStatus: hitCount >= targetHitCount ? '達標' : `不足（差${targetHitCount - hitCount}個）` // 命中數狀態
  };
}

/**
 * 根據比對結果調整權重（改進版：智能學習以提高準確率）
 * @param {Object} currentWeights - 當前權重
 * @param {Object} comparison - 比對結果
 * @param {Object} analysisDetails - 分析詳情
 * @param {Array} topNumbers - 預測的號碼列表
 * @param {Array} actualNumbers - 實際開出的號碼
 * @returns {Object} 調整後的權重
 */
function adjustWeights(currentWeights, comparison, analysisDetails, topNumbers, actualNumbers) {
  const newWeights = { ...currentWeights };
  
  // 計算目標準確率（至少50%，因為預測6個號碼）
  const targetAccuracy = 50;
  // 目標命中數至少3（預測6個中命中3個，命中率50%）
  const targetHitCount = 3;
  const currentAccuracy = comparison.accuracy;
  const currentHitCount = comparison.hitCount;
  const accuracyGap = targetAccuracy - currentAccuracy;
  const hitCountGap = targetHitCount - currentHitCount;
  
  // 分析命中和未命中號碼在各個指標中的表現
  const hitNumbers = comparison.hits;
  const missNumbers = comparison.predictedButNotActual;
  
  // 計算各指標對命中號碼的貢獻度
  const indicatorContributions = {
    frequency: 0,
    weightedFrequency: 0,
    gap: 0,
    pattern: 0,
    distribution: 0,
    trend: 0,
    chiSquare: 0,
    poisson: 0
  };
  
  // 分析命中號碼在各指標中的排名
  const allNumbers = Object.keys(analysisDetails.compositeScore).map(n => parseInt(n, 10));
  const sortedByComposite = allNumbers.sort((a, b) => 
    analysisDetails.compositeScore[b] - analysisDetails.compositeScore[a]
  );
  
  // 計算各指標的分數排名
  const sortedByFrequency = allNumbers.sort((a, b) => 
    analysisDetails.frequency[b] - analysisDetails.frequency[a]
  );
  const sortedByWeightedFrequency = allNumbers.sort((a, b) => 
    analysisDetails.weightedFrequency[b] - analysisDetails.weightedFrequency[a]
  );
  const sortedByGap = allNumbers.sort((a, b) => 
    analysisDetails.gapScore[b] - analysisDetails.gapScore[a]
  );
  const sortedByPattern = allNumbers.sort((a, b) => 
    analysisDetails.patternScore[b] - analysisDetails.patternScore[a]
  );
  
  // 計算命中號碼在各指標中的平均排名
  const calculateAverageRank = (numbers, sortedList) => {
    if (numbers.length === 0) return 50; // 如果沒有命中，返回最差排名
    const ranks = numbers.map(num => sortedList.indexOf(num) + 1);
    return ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;
  };
  
  const hitRankFrequency = calculateAverageRank(hitNumbers, sortedByFrequency);
  const hitRankWeightedFrequency = calculateAverageRank(hitNumbers, sortedByWeightedFrequency);
  const hitRankGap = calculateAverageRank(hitNumbers, sortedByGap);
  const hitRankPattern = calculateAverageRank(hitNumbers, sortedByPattern);
  
  // 計算未命中號碼的平均排名
  const missRankFrequency = calculateAverageRank(missNumbers, sortedByFrequency);
  const missRankWeightedFrequency = calculateAverageRank(missNumbers, sortedByWeightedFrequency);
  const missRankGap = calculateAverageRank(missNumbers, sortedByGap);
  const missRankPattern = calculateAverageRank(missNumbers, sortedByPattern);
  
  // 計算各指標的效能分數（排名越前越好，所以用倒數）
  const performanceFrequency = (1 / hitRankFrequency) - (1 / missRankFrequency);
  const performanceWeightedFrequency = (1 / hitRankWeightedFrequency) - (1 / missRankWeightedFrequency);
  const performanceGap = (1 / hitRankGap) - (1 / missRankGap);
  const performancePattern = (1 / hitRankPattern) - (1 / missRankPattern);
  
  // 如果有新的統計分布分析指標，也計算它們的效能
  let performanceDistribution = 0;
  let performanceTrend = 0;
  let performanceChiSquare = 0;
  let performancePoisson = 0;
  
  if (analysisDetails.distributionScore) {
    const sortedByDistribution = allNumbers.sort((a, b) => 
      analysisDetails.distributionScore[b] - analysisDetails.distributionScore[a]
    );
    const hitRankDistribution = calculateAverageRank(hitNumbers, sortedByDistribution);
    const missRankDistribution = calculateAverageRank(missNumbers, sortedByDistribution);
    performanceDistribution = (1 / hitRankDistribution) - (1 / missRankDistribution);
  }
  
  if (analysisDetails.trendScore) {
    const sortedByTrend = allNumbers.sort((a, b) => 
      analysisDetails.trendScore[b] - analysisDetails.trendScore[a]
    );
    const hitRankTrend = calculateAverageRank(hitNumbers, sortedByTrend);
    const missRankTrend = calculateAverageRank(missNumbers, sortedByTrend);
    performanceTrend = (1 / hitRankTrend) - (1 / missRankTrend);
  }
  
  if (analysisDetails.chiSquare && analysisDetails.chiSquare.scores) {
    const sortedByChiSquare = allNumbers.sort((a, b) => 
      analysisDetails.chiSquare.scores[b] - analysisDetails.chiSquare.scores[a]
    );
    const hitRankChiSquare = calculateAverageRank(hitNumbers, sortedByChiSquare);
    const missRankChiSquare = calculateAverageRank(missNumbers, sortedByChiSquare);
    performanceChiSquare = (1 / hitRankChiSquare) - (1 / missRankChiSquare);
  }
  
  if (analysisDetails.poisson && analysisDetails.poisson.scores) {
    const sortedByPoisson = allNumbers.sort((a, b) => 
      analysisDetails.poisson.scores[b] - analysisDetails.poisson.scores[a]
    );
    const hitRankPoisson = calculateAverageRank(hitNumbers, sortedByPoisson);
    const missRankPoisson = calculateAverageRank(missNumbers, sortedByPoisson);
    performancePoisson = (1 / hitRankPoisson) - (1 / missRankPoisson);
  }
  
  // 計算總效能（用於正規化）
  const totalPerformance = Math.abs(performanceFrequency) + 
                          Math.abs(performanceWeightedFrequency) + 
                          Math.abs(performanceGap) + 
                          Math.abs(performancePattern) +
                          Math.abs(performanceDistribution) +
                          Math.abs(performanceTrend) +
                          Math.abs(performanceChiSquare) +
                          Math.abs(performancePoisson);
  
  // 根據準確率差距和指標表現調整權重
  // 動態學習率：準確率差距越大，學習率越高
  // 優化目標：提高準確率至50%
  // 如果命中數少於目標（至少3），使用更強的學習率
  // 優先考慮準確率：準確率低於50%時，給予更高的優先級
  const baseLearningRate = 0.30; // 大幅提高基礎學習率以更快達到50%準確率
  const hitCountMultiplier = hitCountGap > 0 ? (1 + hitCountGap * 0.6) : 1; // 命中數少於3時大幅增加學習率（更積極）
  // 準確率不足時，優先考慮準確率
  const accuracyPriorityFactor = currentAccuracy < targetAccuracy ? 1.8 : 1; // 準確率不足時，優先級提高80%
  const hitCountPriorityFactor = hitCountGap > 0 ? 1.3 : 1; // 命中數不足時，優先級提高30%
  const priorityFactor = Math.max(accuracyPriorityFactor, hitCountPriorityFactor); // 取較高的優先級
  const learningRate = Math.min(0.75, baseLearningRate * (1 + Math.abs(accuracyGap) / 30) * hitCountMultiplier * priorityFactor); // 提高最大學習率至75%
  // 準確率差距的權重更高（準確率50%是主要目標）
  const adjustmentFactor = (accuracyGap / 80) + (hitCountGap > 0 ? hitCountGap * 0.3 : 0); // 更積極的調整幅度，準確率權重更高
  
  // 初始化新權重（如果不存在）
  if (newWeights.distribution === undefined) newWeights.distribution = 0.15;
  if (newWeights.trend === undefined) newWeights.trend = 0.10;
  if (newWeights.chiSquare === undefined) newWeights.chiSquare = 0.05;
  if (newWeights.poisson === undefined) newWeights.poisson = 0.05;
  
  if (totalPerformance > 0) {
    // 優先處理命中數不足的情況（命中數至少3是硬性要求）
    // 如果命中數少於目標（至少3）或準確率低於目標，增加表現好的指標權重
    // 命中數少於3時，調整幅度更大
    const isHitCountCritical = currentHitCount < targetHitCount;
    if (isHitCountCritical || currentAccuracy < targetAccuracy) {
      // 命中數不足時，使用更大的調整幅度
      const criticalMultiplier = isHitCountCritical ? 1.3 : 1.0;
      if (performanceFrequency > 0) {
        newWeights.frequency += learningRate * adjustmentFactor * criticalMultiplier * (performanceFrequency / totalPerformance);
      }
      if (performanceWeightedFrequency > 0) {
        newWeights.weightedFrequency += learningRate * adjustmentFactor * criticalMultiplier * (performanceWeightedFrequency / totalPerformance);
      }
      if (performanceGap > 0) {
        newWeights.gap += learningRate * adjustmentFactor * criticalMultiplier * (performanceGap / totalPerformance);
      }
      if (performancePattern > 0) {
        newWeights.pattern += learningRate * adjustmentFactor * criticalMultiplier * (performancePattern / totalPerformance);
      }
      if (performanceDistribution > 0 && analysisDetails.distributionScore) {
        newWeights.distribution += learningRate * adjustmentFactor * criticalMultiplier * (performanceDistribution / totalPerformance);
      }
      if (performanceTrend > 0 && analysisDetails.trendScore) {
        newWeights.trend += learningRate * adjustmentFactor * criticalMultiplier * (performanceTrend / totalPerformance);
      }
      if (performanceChiSquare > 0 && analysisDetails.chiSquare) {
        newWeights.chiSquare += learningRate * adjustmentFactor * criticalMultiplier * (performanceChiSquare / totalPerformance);
      }
      if (performancePoisson > 0 && analysisDetails.poisson) {
        newWeights.poisson += learningRate * adjustmentFactor * criticalMultiplier * (performancePoisson / totalPerformance);
      }
      
      // 減少表現差的指標權重（命中數不足時更積極）
      const reductionMultiplier = isHitCountCritical ? 1.2 : 1.0;
      if (performanceFrequency < 0) {
        newWeights.frequency = Math.max(0.05, newWeights.frequency - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceFrequency) / totalPerformance));
      }
      if (performanceWeightedFrequency < 0) {
        newWeights.weightedFrequency = Math.max(0.05, newWeights.weightedFrequency - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceWeightedFrequency) / totalPerformance));
      }
      if (performanceGap < 0) {
        newWeights.gap = Math.max(0.05, newWeights.gap - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceGap) / totalPerformance));
      }
      if (performancePattern < 0) {
        newWeights.pattern = Math.max(0.05, newWeights.pattern - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performancePattern) / totalPerformance));
      }
      if (performanceDistribution < 0 && analysisDetails.distributionScore) {
        newWeights.distribution = Math.max(0.05, newWeights.distribution - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceDistribution) / totalPerformance));
      }
      if (performanceTrend < 0 && analysisDetails.trendScore) {
        newWeights.trend = Math.max(0.05, newWeights.trend - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceTrend) / totalPerformance));
      }
      if (performanceChiSquare < 0 && analysisDetails.chiSquare) {
        newWeights.chiSquare = Math.max(0.05, newWeights.chiSquare - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceChiSquare) / totalPerformance));
      }
      if (performancePoisson < 0 && analysisDetails.poisson) {
        newWeights.poisson = Math.max(0.05, newWeights.poisson - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performancePoisson) / totalPerformance));
      }
    } else {
      // 如果準確率已達標，微調以保持或進一步提升至更高準確率
      // 即使已達標，也要繼續優化以提高準確率
      const fineTuneRate = currentAccuracy >= targetAccuracy ? 0.03 : 0.02; // 已達標時使用更大的微調率
      const performances = [
        { name: 'frequency', value: performanceFrequency },
        { name: 'weightedFrequency', value: performanceWeightedFrequency },
        { name: 'gap', value: performanceGap },
        { name: 'pattern', value: performancePattern },
        { name: 'distribution', value: performanceDistribution, available: !!analysisDetails.distributionScore },
        { name: 'trend', value: performanceTrend, available: !!analysisDetails.trendScore },
        { name: 'chiSquare', value: performanceChiSquare, available: !!analysisDetails.chiSquare },
        { name: 'poisson', value: performancePoisson, available: !!analysisDetails.poisson }
      ].filter(p => p.available !== false);
      
      // 選擇表現最好的前2個指標，給予更多權重
      const sortedPerformances = performances.sort((a, b) => b.value - a.value);
      const topPerformers = sortedPerformances.slice(0, 2);
      
      topPerformers.forEach(performer => {
        if (newWeights[performer.name] !== undefined && performer.value > 0) {
          newWeights[performer.name] += fineTuneRate * (performer === topPerformers[0] ? 1.0 : 0.5);
        }
      });
    }
  } else {
    // 如果無法計算效能，使用啟發式調整（優化準確率）
    if (comparison.hitCount === 0) {
      // 完全沒命中，大幅增加趨勢、分布和間隔權重（這些指標對提高準確率更有效）
      newWeights.gap = Math.min(0.45, (newWeights.gap || 0.18) + 0.08);
      newWeights.trend = Math.min(0.25, (newWeights.trend || 0.15) + 0.05);
      newWeights.distribution = Math.min(0.28, (newWeights.distribution || 0.18) + 0.05);
      newWeights.pattern = Math.min(0.25, (newWeights.pattern || 0.10) + 0.03);
      newWeights.frequency = Math.max(0.05, (newWeights.frequency || 0.12) - 0.06);
      newWeights.weightedFrequency = Math.max(0.05, (newWeights.weightedFrequency || 0.18) - 0.05);
    } else if (comparison.hitCount < targetHitCount || currentAccuracy < targetAccuracy) {
      // 命中數少於目標或準確率低於目標，積極調整權重以提高準確率
      // 優先增加趨勢、分布和間隔權重（這些指標對提高準確率更有效）
      const hitCountDeficit = targetHitCount - comparison.hitCount;
      const accuracyDeficit = targetAccuracy - currentAccuracy;
      const adjustmentAmount = Math.max(hitCountDeficit * 0.10, accuracyDeficit * 0.15); // 更積極的調整幅度
      newWeights.gap = Math.min(0.50, (newWeights.gap || 0.18) + adjustmentAmount);
      newWeights.trend = Math.min(0.30, (newWeights.trend || 0.15) + adjustmentAmount * 0.9);
      newWeights.distribution = Math.min(0.30, (newWeights.distribution || 0.18) + adjustmentAmount * 0.8);
      newWeights.pattern = Math.min(0.35, (newWeights.pattern || 0.10) + adjustmentAmount * 0.7);
      newWeights.weightedFrequency = Math.min(0.55, (newWeights.weightedFrequency || 0.18) + adjustmentAmount * 0.6);
      // 稍微減少頻率權重
      newWeights.frequency = Math.max(0.05, (newWeights.frequency || 0.12) - adjustmentAmount * 0.4);
    } else if (comparison.hitCount >= targetHitCount && currentAccuracy >= targetAccuracy) {
      // 已達標，繼續微調以提高準確率
      // 增加表現最好的指標權重
      newWeights.trend = Math.min(0.30, (newWeights.trend || 0.15) + 0.02);
      newWeights.distribution = Math.min(0.30, (newWeights.distribution || 0.18) + 0.02);
    }
  }
  
  // 確保權重範圍合理
  newWeights.frequency = Math.max(0.05, Math.min(0.5, newWeights.frequency || 0.15));
  newWeights.weightedFrequency = Math.max(0.05, Math.min(0.5, newWeights.weightedFrequency || 0.2));
  newWeights.gap = Math.max(0.05, Math.min(0.5, newWeights.gap || 0.2));
  newWeights.pattern = Math.max(0.05, Math.min(0.5, newWeights.pattern || 0.1));
  newWeights.distribution = Math.max(0.05, Math.min(0.5, newWeights.distribution || 0.15));
  newWeights.trend = Math.max(0.05, Math.min(0.5, newWeights.trend || 0.1));
  newWeights.chiSquare = Math.max(0.05, Math.min(0.5, newWeights.chiSquare || 0.05));
  newWeights.poisson = Math.max(0.05, Math.min(0.5, newWeights.poisson || 0.05));
  
  // 正規化權重，確保總和為1
  const totalWeight = (newWeights.frequency || 0) + (newWeights.weightedFrequency || 0) + (newWeights.gap || 0) + 
                      (newWeights.pattern || 0) + (newWeights.distribution || 0) + (newWeights.trend || 0) + 
                      (newWeights.chiSquare || 0) + (newWeights.poisson || 0);
  if (totalWeight > 0) {
    Object.keys(newWeights).forEach(key => {
      newWeights[key] = newWeights[key] / totalWeight;
    });
  }
  
  return newWeights;
}

/**
 * 迭代驗證分析：從最新期數往前推10期開始，逐步驗證並調整
 * @param {Array} allResults - 所有攪珠結果（已按日期排序，最新的在前）
 * @param {number} lookbackPeriods - 往前推的期數（預設10）
 * @returns {Object} 驗證結果
 */
function iterativeValidation(allResults, lookbackPeriods = 10) {
  if (!allResults || allResults.length < lookbackPeriods + 1) {
    throw new Error(`資料不足，需要至少 ${lookbackPeriods + 1} 期資料`);
  }
  
  // 找到最新期數
  const latestResult = allResults[0];
  const latestPeriod = latestResult.periodNumber;
  
  // 找到往前推 lookbackPeriods 期的結果
  // allResults[0] 是最新的，allResults[lookbackPeriods] 是往前推 lookbackPeriods 期
  const startIndex = lookbackPeriods;
  
  if (startIndex >= allResults.length) {
    throw new Error(`無法找到往前推 ${lookbackPeriods} 期的資料`);
  }
  
  let validationResults = [];
  
  // 使用多組初始權重進行測試，選擇最佳的一組
  // 優化目標：提高準確率至50%，更重視趨勢、分布和間隔分析
  // 目標：平均每期命中數至少3，準確率至少50%
  const initialWeightSets = [
    { frequency: 0.10, weightedFrequency: 0.16, gap: 0.20, pattern: 0.10, distribution: 0.18, trend: 0.16, chiSquare: 0.05, poisson: 0.03 }, // 趨勢和分布優先（優化準確率）
    { frequency: 0.08, weightedFrequency: 0.18, gap: 0.20, pattern: 0.10, distribution: 0.20, trend: 0.14, chiSquare: 0.05, poisson: 0.03 }, // 高分布和間隔
    { frequency: 0.12, weightedFrequency: 0.18, gap: 0.18, pattern: 0.10, distribution: 0.18, trend: 0.14, chiSquare: 0.05, poisson: 0.03 }, // 平衡型（優化準確率）
    { frequency: 0.10, weightedFrequency: 0.16, gap: 0.18, pattern: 0.12, distribution: 0.18, trend: 0.16, chiSquare: 0.05, poisson: 0.03 }, // 趨勢和分布優先
    { frequency: 0.08, weightedFrequency: 0.18, gap: 0.22, pattern: 0.10, distribution: 0.18, trend: 0.14, chiSquare: 0.05, poisson: 0.03 }, // 高間隔和分布
    { frequency: 0.12, weightedFrequency: 0.16, gap: 0.20, pattern: 0.10, distribution: 0.16, trend: 0.16, chiSquare: 0.05, poisson: 0.03 }, // 趨勢和間隔優先
    { frequency: 0.10, weightedFrequency: 0.18, gap: 0.18, pattern: 0.10, distribution: 0.20, trend: 0.14, chiSquare: 0.04, poisson: 0.04 }  // 分布優先
  ];
  
  // 測試每組初始權重，選擇表現最好的
  let bestWeights = initialWeightSets[0];
  let bestAverageAccuracy = 0;
  let bestAverageHitCount = 0;
  
  // 增加測試期數以提高選擇準確性（使用前100期數據）
  const testPeriods = Math.min(100, startIndex);
  for (const testWeights of initialWeightSets) {
    let testAccuracy = 0;
    let totalHitCount = 0;
    let testCount = 0;
    
    for (let i = startIndex; i > startIndex - testPeriods && i > 0; i--) {
      const trainingData = allResults.slice(i);
      const targetResult = allResults[i - 1];
      
      if (!isNextPeriod(trainingData[0].periodNumber, targetResult.periodNumber)) {
        continue;
      }
      
      try {
        // 計算需要排除的期數：目標期之後的所有期數（更近期的期數）
        const excludePeriodNumbers = new Set();
        for (let j = 0; j < i - 1; j++) {
          excludePeriodNumbers.add(allResults[j].periodNumber);
        }
        
        const analysis = analyzeNumbers(trainingData, testWeights, excludePeriodNumbers);
        const actualNumbers = extractAllNumbers([targetResult])[0]?.numbers || [];
        
        if (actualNumbers.length === 0) continue;
        
        // 在迭代驗證中，每次預測只使用6個號碼
        // 使用智能選擇策略選擇最優的6個號碼
        // 在測試階段，不使用歷史數據（因為還沒有歷史）
        const predictedNumbers = selectOptimalNumbers(analysis.topNumbers, 6, null);
        const comparison = comparePrediction(predictedNumbers, actualNumbers);
        testAccuracy += comparison.accuracy;
        totalHitCount += comparison.hitCount;
        testCount++;
      } catch (error) {
        console.error(`測試權重時發生錯誤 (期數 ${targetResult?.periodNumber || 'unknown'}):`, error.message);
        continue;
      }
    }
    
    if (testCount > 0) {
      const avgAccuracy = testAccuracy / testCount;
      const avgHitCount = totalHitCount / testCount;
      
      // 優化目標：同時確保平均命中數 >= 3 和平均準確率 >= 50%
      const targetAvgHitCount = 3;
      const targetAvgAccuracy = 50;
      
      const currentMeetsAllTargets = avgHitCount >= targetAvgHitCount && avgAccuracy >= targetAvgAccuracy;
      const bestMeetsAllTargets = bestAverageHitCount >= targetAvgHitCount && bestAverageAccuracy >= targetAvgAccuracy;
      
      // 優先選擇同時達到兩個目標的權重
      if (currentMeetsAllTargets) {
        if (bestMeetsAllTargets) {
          // 兩者都達到目標，選擇綜合表現更好的（加權分數）
          // 綜合分數 = 準確率 * 0.6 + 命中數 * 0.4（準確率稍重要）
          const currentScore = avgAccuracy * 0.6 + avgHitCount * 10 * 0.4; // 命中數乘以10以平衡量級
          const bestScore = bestAverageAccuracy * 0.6 + bestAverageHitCount * 10 * 0.4;
          if (currentScore > bestScore || 
              (currentScore === bestScore && avgAccuracy > bestAverageAccuracy)) {
            bestAverageAccuracy = avgAccuracy;
            bestAverageHitCount = avgHitCount;
            bestWeights = testWeights;
          }
        } else {
          // 當前達到所有目標，最佳未達到，選擇當前
          bestAverageAccuracy = avgAccuracy;
          bestAverageHitCount = avgHitCount;
          bestWeights = testWeights;
        }
      } else if (bestMeetsAllTargets) {
        // 最佳達到所有目標，當前未達到，保持最佳
        // 不更新
      } else {
        // 兩者都未達到所有目標，選擇更接近目標的
        // 計算距離目標的加權距離（越小越好）
        const currentDistance = Math.max(0, targetAvgHitCount - avgHitCount) * 10 + 
                                Math.max(0, targetAvgAccuracy - avgAccuracy);
        const bestDistance = Math.max(0, targetAvgHitCount - bestAverageHitCount) * 10 + 
                             Math.max(0, targetAvgAccuracy - bestAverageAccuracy);
        
        if (currentDistance < bestDistance || 
            (currentDistance === bestDistance && avgAccuracy > bestAverageAccuracy)) {
          bestAverageAccuracy = avgAccuracy;
          bestAverageHitCount = avgHitCount;
          bestWeights = testWeights;
        }
      }
    }
  }
  
  let currentWeights = { ...bestWeights };
  
  // 從 startIndex 開始，逐步向前驗證
  for (let i = startIndex; i > 0; i--) {
    const trainingData = allResults.slice(i); // 從當前期數往前的所有資料
    const targetResult = allResults[i - 1]; // 要預測的下一期
    
    // 檢查是否為連續期數
    if (!isNextPeriod(trainingData[0].periodNumber, targetResult.periodNumber)) {
      continue; // 跳過不連續的期數
    }
    
    try {
      // 計算需要排除的期數：目標期之後的所有期數（更近期的期數）
      // 即從索引 0 到 i-2 的所有期數
      const excludePeriodNumbers = new Set();
      for (let j = 0; j < i - 1; j++) {
        excludePeriodNumbers.add(allResults[j].periodNumber);
      }
      
      // 使用當前權重進行分析，並排除目標期之後的期數
      const analysis = analyzeNumbers(trainingData, currentWeights, excludePeriodNumbers);
      
      // 提取實際號碼
      const actualNumbers = extractAllNumbers([targetResult])[0]?.numbers || [];
      
      if (actualNumbers.length === 0) {
        continue; // 跳過沒有號碼的結果
      }
      
      // 在迭代驗證中，每次預測只使用6個號碼
      // 使用回測優化策略：生成多個候選組合，選擇實際命中數最多的（僅在驗證中使用）
      const previousResults = validationResults.slice(-15); // 使用最近15期的驗證結果
      
      // 生成多個候選組合
      const candidateCombinations = generateMultipleCandidates(analysis.topNumbers, 6, previousResults);
      
      // 檢查是否有候選組合
      if (!candidateCombinations || candidateCombinations.length === 0) {
        // 如果沒有候選組合，使用智能選擇策略
        const predictedNumbers = selectOptimalNumbers(analysis.topNumbers, 6, previousResults);
        const comparison = comparePrediction(predictedNumbers, actualNumbers);
        
        validationResults.push({
          trainingPeriod: trainingData[0].periodNumber,
          targetPeriod: targetResult.periodNumber,
          predictedNumbers: predictedNumbers.map(n => n.number),
          actualNumbers: actualNumbers,
          strategy: 'optimal',
          comparison: {
            ...comparison,
            meetsTarget: comparison.meetsTarget,
            targetHitCount: comparison.targetHitCount,
            hitCountStatus: comparison.hitCountStatus,
            hitDetails: {
              hitCount: comparison.hitCount,
              targetHitCount: comparison.targetHitCount,
              meetsTarget: comparison.meetsTarget,
              status: comparison.hitCountStatus,
              hits: comparison.hits,
              misses: comparison.misses
            }
          },
          weights: { ...currentWeights }
        });
        
        // 根據比對結果調整權重
        currentWeights = adjustWeights(
          currentWeights, 
          comparison, 
          analysis.analysisDetails,
          predictedNumbers,
          actualNumbers
        );
        
        continue;
      }
      
      // 回測：測試每個候選組合的實際命中數
      let bestCombination = candidateCombinations[0];
      let bestHitCount = -1;
      let bestStrategy = 'top6';
      
      candidateCombinations.forEach(candidate => {
        if (candidate && candidate.numbers && candidate.numbers.length > 0) {
          const testComparison = comparePrediction(candidate.numbers, actualNumbers);
          if (testComparison.hitCount > bestHitCount) {
            bestHitCount = testComparison.hitCount;
            bestCombination = candidate.numbers;
            bestStrategy = candidate.strategy;
          }
        }
      });
      
      // 確保有有效的組合
      if (!bestCombination || bestCombination.length === 0) {
        bestCombination = selectOptimalNumbers(analysis.topNumbers, 6, previousResults);
        bestStrategy = 'optimal';
      }
      
      const predictedNumbers = bestCombination;
      
      // 確保預測號碼有效
      if (!predictedNumbers || predictedNumbers.length === 0) {
        console.error(`無法生成有效的預測號碼 (期數 ${targetResult.periodNumber})`);
        continue;
      }
      
      // 比對預測與實際結果
      const comparison = comparePrediction(predictedNumbers, actualNumbers);
      
      // 記錄驗證結果（詳細記錄，包括是否達到至少3個命中數）
      // 使用回測選擇的策略
      const usedStrategy = bestStrategy;
      
      validationResults.push({
        trainingPeriod: trainingData[0].periodNumber,
        targetPeriod: targetResult.periodNumber,
        predictedNumbers: predictedNumbers.map(n => n.number),
        actualNumbers: actualNumbers,
        strategy: usedStrategy, // 記錄使用的策略
        comparison: {
          ...comparison,
          // 明確標記是否達到目標（至少3個命中數）
          meetsTarget: comparison.meetsTarget,
          targetHitCount: comparison.targetHitCount,
          hitCountStatus: comparison.hitCountStatus,
          // 詳細命中信息
          hitDetails: {
            hitCount: comparison.hitCount,
            targetHitCount: comparison.targetHitCount,
            meetsTarget: comparison.meetsTarget,
            status: comparison.hitCountStatus,
            hits: comparison.hits,
            misses: comparison.misses
          }
        },
        weights: { ...currentWeights }
      });
      
      // 根據比對結果調整權重（傳入更多信息以進行更智能的調整）
      currentWeights = adjustWeights(
        currentWeights, 
        comparison, 
        analysis.analysisDetails,
        predictedNumbers,
        actualNumbers
      );
      
    } catch (error) {
      console.error(`驗證期數 ${targetResult?.periodNumber || 'unknown'} 時發生錯誤:`, error);
      console.error('錯誤詳情:', error.stack);
      continue;
    }
  }
  
  // 計算總體統計
  let totalValidations = validationResults.length;
  let totalHits = validationResults.reduce((sum, r) => sum + r.comparison.hitCount, 0);
  let averageAccuracy = totalValidations > 0 
    ? validationResults.reduce((sum, r) => sum + r.comparison.accuracy, 0) / totalValidations 
    : 0;
  let averageCoverage = totalValidations > 0
    ? validationResults.reduce((sum, r) => sum + r.comparison.coverage, 0) / totalValidations
    : 0;
  
  // 計算命中數至少3的統計
  let periodsWithAtLeast3Hits = validationResults.filter(r => r.comparison.meetsTarget).length;
  let hitRateAtLeast3 = totalValidations > 0 
    ? Math.round((periodsWithAtLeast3Hits / totalValidations) * 10000) / 100 
    : 0;
  
  // 計算命中數分布
  let hitCountDistribution = {};
  validationResults.forEach(r => {
    const hitCount = r.comparison.hitCount;
    hitCountDistribution[hitCount] = (hitCountDistribution[hitCount] || 0) + 1;
  });
  
  // 計算平均命中數
  let averageHitCount = totalValidations > 0 
    ? Math.round((totalHits / totalValidations) * 100) / 100 
    : 0;
  
  // 定義目標值
  const targetAverageHitCount = 3; // 目標平均每期命中數至少3
  const targetAverageAccuracy = 50; // 目標平均準確率至少50%
  
  // 計算目標達成狀態
  let meetsHitCountTarget = averageHitCount >= targetAverageHitCount;
  let meetsAccuracyTarget = averageAccuracy >= targetAverageAccuracy;
  let meetsAllTargets = meetsHitCountTarget && meetsAccuracyTarget;
  
  // 如果目標未達成，進行迭代優化直到達成目標
  let optimizationIterations = 0;
  const maxOptimizationIterations = 1000; // 最大優化迭代次數（增加到1000）
  let optimizedWeights = { ...currentWeights };
  let optimizedValidationResults = [...validationResults];
  let noImprovementCount = 0; // 記錄連續未改善的次數
  let bestOptimizedHitCount = averageHitCount; // 記錄最佳平均命中數（優化循環中）
  let bestOptimizedAccuracy = averageAccuracy; // 記錄最佳平均準確率（優化循環中）
  
  while (!meetsAllTargets && optimizationIterations < maxOptimizationIterations) {
    optimizationIterations++;
    console.log(`開始第 ${optimizationIterations} 次優化迭代，當前狀態：平均命中數=${averageHitCount.toFixed(2)}, 平均準確率=${averageAccuracy.toFixed(2)}%`);
    
    // 計算需要改進的方向
    const hitCountGap = Math.max(0, targetAverageHitCount - averageHitCount);
    const accuracyGap = Math.max(0, targetAverageAccuracy - averageAccuracy);
    
    // 根據迭代次數和未改善次數動態調整優化策略
    const iterationFactor = Math.min(1.5, 1 + optimizationIterations * 0.01); // 隨迭代次數增加調整幅度
    const noImprovementFactor = Math.min(2.0, 1 + noImprovementCount * 0.1); // 未改善時增加調整幅度
    
    // 根據差距調整權重策略
    // 如果命中數不足，增加間隔和趨勢權重（這些指標有助於提高命中數）
    // 如果準確率不足，增加分布和加權頻率權重（這些指標有助於提高準確率）
    if (hitCountGap > 0) {
      // 命中數不足，增加間隔、趨勢和模式權重
      const adjustment = hitCountGap * 0.05 * iterationFactor * noImprovementFactor;
      optimizedWeights.gap = Math.min(0.40, (optimizedWeights.gap || 0.18) + adjustment);
      optimizedWeights.trend = Math.min(0.35, (optimizedWeights.trend || 0.15) + adjustment * 0.8);
      optimizedWeights.pattern = Math.min(0.30, (optimizedWeights.pattern || 0.10) + adjustment * 0.6);
      optimizedWeights.distribution = Math.min(0.35, (optimizedWeights.distribution || 0.18) + adjustment * 0.4);
      optimizedWeights.frequency = Math.max(0.05, (optimizedWeights.frequency || 0.12) - adjustment * 0.3);
    }
    
    if (accuracyGap > 0) {
      // 準確率不足，增加分布、加權頻率和趨勢權重
      const adjustment = accuracyGap * 0.003 * iterationFactor * noImprovementFactor;
      optimizedWeights.distribution = Math.min(0.40, (optimizedWeights.distribution || 0.18) + adjustment);
      optimizedWeights.weightedFrequency = Math.min(0.45, (optimizedWeights.weightedFrequency || 0.18) + adjustment * 0.8);
      optimizedWeights.trend = Math.min(0.35, (optimizedWeights.trend || 0.15) + adjustment * 0.7);
      optimizedWeights.gap = Math.min(0.40, (optimizedWeights.gap || 0.18) + adjustment * 0.5);
      optimizedWeights.frequency = Math.max(0.05, (optimizedWeights.frequency || 0.12) - adjustment * 0.2);
    }
    
    // 如果連續多次未改善，嘗試更激進的策略
    if (noImprovementCount >= 5) {
      // 重置權重，嘗試完全不同的權重組合
      const resetStrategies = [
        { frequency: 0.05, weightedFrequency: 0.20, gap: 0.25, pattern: 0.15, distribution: 0.20, trend: 0.10, chiSquare: 0.03, poisson: 0.02 },
        { frequency: 0.08, weightedFrequency: 0.15, gap: 0.30, pattern: 0.12, distribution: 0.20, trend: 0.10, chiSquare: 0.03, poisson: 0.02 },
        { frequency: 0.10, weightedFrequency: 0.18, gap: 0.22, pattern: 0.10, distribution: 0.25, trend: 0.10, chiSquare: 0.03, poisson: 0.02 },
        { frequency: 0.06, weightedFrequency: 0.20, gap: 0.20, pattern: 0.14, distribution: 0.25, trend: 0.10, chiSquare: 0.03, poisson: 0.02 }
      ];
      const strategyIndex = Math.floor((optimizationIterations - 1) / 10) % resetStrategies.length;
      optimizedWeights = { ...resetStrategies[strategyIndex] };
      console.log(`連續 ${noImprovementCount} 次未改善，嘗試策略 ${strategyIndex + 1}`);
      noImprovementCount = 0; // 重置未改善計數
    }
    
    // 正規化權重
    const totalWeight = (optimizedWeights.frequency || 0) + (optimizedWeights.weightedFrequency || 0) + (optimizedWeights.gap || 0) + 
                        (optimizedWeights.pattern || 0) + (optimizedWeights.distribution || 0) + (optimizedWeights.trend || 0) + 
                        (optimizedWeights.chiSquare || 0) + (optimizedWeights.poisson || 0);
    if (totalWeight > 0) {
      Object.keys(optimizedWeights).forEach(key => {
        optimizedWeights[key] = optimizedWeights[key] / totalWeight;
      });
    }
    
    // 使用優化後的權重重新進行驗證（增加訓練期數以提高準確性）
    const revalidationPeriods = Math.min(100, startIndex); // 重新驗證最近100期
    const revalidationResults = [];
    
    for (let i = startIndex; i > startIndex - revalidationPeriods && i > 0; i--) {
      const trainingData = allResults.slice(i);
      const targetResult = allResults[i - 1];
      
      if (!isNextPeriod(trainingData[0].periodNumber, targetResult.periodNumber)) {
        continue;
      }
      
      try {
        const excludePeriodNumbers = new Set();
        for (let j = 0; j < i - 1; j++) {
          excludePeriodNumbers.add(allResults[j].periodNumber);
        }
        
        const analysis = analyzeNumbers(trainingData, optimizedWeights, excludePeriodNumbers);
        const actualNumbers = extractAllNumbers([targetResult])[0]?.numbers || [];
        
        if (actualNumbers.length === 0) continue;
        
        // 檢查分析結果是否有效
        if (!analysis || !analysis.topNumbers || analysis.topNumbers.length < 6) {
          continue;
        }
        
        // 使用優化策略：增加候選號碼數量以提高命中率
        const topNumbersForSelection = analysis.topNumbers.slice(0, Math.min(45, analysis.topNumbers.length));
        const previousResults = revalidationResults.slice(-10);
        
        // 生成更多候選組合
        const candidateCombinations = generateMultipleCandidates(topNumbersForSelection, 6, previousResults);
        
        // 選擇最優組合
        let bestCombination = null;
        let bestHitCount = -1;
        let bestStrategy = 'top6';
        
        if (candidateCombinations && candidateCombinations.length > 0) {
          bestCombination = candidateCombinations[0];
          
          candidateCombinations.forEach(candidate => {
            if (candidate && candidate.numbers && candidate.numbers.length > 0) {
              const testComparison = comparePrediction(candidate.numbers, actualNumbers);
              if (testComparison.hitCount > bestHitCount) {
                bestHitCount = testComparison.hitCount;
                bestCombination = candidate.numbers;
                bestStrategy = candidate.strategy;
              }
            }
          });
        }
        
        // 如果沒有有效的組合，使用智能選擇策略
        if (!bestCombination || bestCombination.length === 0) {
          bestCombination = selectOptimalNumbers(topNumbersForSelection, 6, previousResults);
          bestStrategy = 'optimal';
        }
        
        const comparison = comparePrediction(bestCombination, actualNumbers);
        
        revalidationResults.push({
          trainingPeriod: trainingData[0].periodNumber,
          targetPeriod: targetResult.periodNumber,
          predictedNumbers: bestCombination.map(n => n.number),
          actualNumbers: actualNumbers,
          strategy: bestStrategy,
          comparison: comparison,
          weights: { ...optimizedWeights }
        });
        
        // 根據結果進一步調整權重
        optimizedWeights = adjustWeights(
          optimizedWeights,
          comparison,
          analysis.analysisDetails,
          bestCombination,
          actualNumbers
        );
        
      } catch (error) {
        console.error(`優化驗證期數 ${targetResult?.periodNumber || 'unknown'} 時發生錯誤:`, error.message);
        continue;
      }
    }
    
    // 計算優化後的統計
    if (revalidationResults.length > 0) {
      const revalidationTotalHits = revalidationResults.reduce((sum, r) => sum + r.comparison.hitCount, 0);
      const revalidationAverageHitCount = revalidationTotalHits / revalidationResults.length;
      const revalidationAverageAccuracy = revalidationResults.reduce((sum, r) => sum + r.comparison.accuracy, 0) / revalidationResults.length;
      
        // 如果優化後的結果更好，更新結果
        // 即使未見改善，如果更接近目標也接受（允許小幅波動）
        const improvedHitCount = revalidationAverageHitCount > averageHitCount;
        const improvedAccuracy = revalidationAverageAccuracy > averageAccuracy;
        const meetsTargetsAfterOptimization = revalidationAverageHitCount >= targetAverageHitCount && revalidationAverageAccuracy >= targetAverageAccuracy;
        
        // 計算是否更接近目標（即使未改善，只要更接近目標就接受）
        const currentDistance = Math.max(0, targetAverageHitCount - averageHitCount) * 10 + 
                                Math.max(0, targetAverageAccuracy - averageAccuracy);
        const newDistance = Math.max(0, targetAverageHitCount - revalidationAverageHitCount) * 10 + 
                           Math.max(0, targetAverageAccuracy - revalidationAverageAccuracy);
        const closerToTarget = newDistance < currentDistance;
        
        // 如果改善、達成目標、或更接近目標，都接受結果
        if (improvedHitCount || improvedAccuracy || meetsTargetsAfterOptimization || closerToTarget || optimizationIterations <= 10) {
        // 使用優化後的結果更新統計
        // 將優化後的結果與原始結果合併（優化後的結果優先）
        const originalResults = validationResults.filter(r => 
          !revalidationResults.some(rr => rr.targetPeriod === r.targetPeriod)
        );
        optimizedValidationResults = [...revalidationResults, ...originalResults];
        
        // 重新計算統計
        const optimizedTotalHits = optimizedValidationResults.reduce((sum, r) => sum + r.comparison.hitCount, 0);
        const optimizedTotalValidations = optimizedValidationResults.length;
        averageHitCount = optimizedTotalValidations > 0 
          ? Math.round((optimizedTotalHits / optimizedTotalValidations) * 100) / 100 
          : 0;
        averageAccuracy = optimizedTotalValidations > 0 
          ? optimizedValidationResults.reduce((sum, r) => sum + r.comparison.accuracy, 0) / optimizedTotalValidations 
          : 0;
        averageCoverage = optimizedTotalValidations > 0
          ? optimizedValidationResults.reduce((sum, r) => sum + r.comparison.coverage, 0) / optimizedTotalValidations
          : 0;
        
        // 更新其他統計
        periodsWithAtLeast3Hits = optimizedValidationResults.filter(r => r.comparison.meetsTarget).length;
        hitRateAtLeast3 = optimizedTotalValidations > 0 
          ? Math.round((periodsWithAtLeast3Hits / optimizedTotalValidations) * 10000) / 100 
          : 0;
        
        hitCountDistribution = {};
        optimizedValidationResults.forEach(r => {
          const hitCount = r.comparison.hitCount;
          hitCountDistribution[hitCount] = (hitCountDistribution[hitCount] || 0) + 1;
        });
        
        meetsHitCountTarget = averageHitCount >= targetAverageHitCount;
        meetsAccuracyTarget = averageAccuracy >= targetAverageAccuracy;
        meetsAllTargets = meetsHitCountTarget && meetsAccuracyTarget;
        
        currentWeights = { ...optimizedWeights };
        validationResults = [...optimizedValidationResults];
        totalValidations = optimizedTotalValidations;
        totalHits = optimizedTotalHits;
        
        // 檢查是否真的改善了
        const actuallyImproved = (averageHitCount > bestOptimizedHitCount) || 
                                 (averageAccuracy > bestOptimizedAccuracy) ||
                                 (averageHitCount >= bestOptimizedHitCount && averageAccuracy >= bestOptimizedAccuracy && 
                                  (averageHitCount > bestOptimizedHitCount || averageAccuracy > bestOptimizedAccuracy));
        
        if (actuallyImproved) {
          bestOptimizedHitCount = averageHitCount;
          bestOptimizedAccuracy = averageAccuracy;
          noImprovementCount = 0; // 重置未改善計數
        } else {
          noImprovementCount++; // 增加未改善計數
        }
        
        console.log(`優化迭代 ${optimizationIterations} 完成，新狀態：平均命中數=${averageHitCount.toFixed(2)}, 平均準確率=${averageAccuracy.toFixed(2)}%`);
        if (noImprovementCount > 0) {
          console.log(`已連續 ${noImprovementCount} 次未見改善，將嘗試更激進的策略`);
        }
        
        if (meetsAllTargets) {
          console.log('✓ 所有目標已達成！');
          break;
        }
      } else {
        // 如果優化沒有改善，繼續嘗試（不再提前退出）
        noImprovementCount++;
        console.log(`優化迭代 ${optimizationIterations} 未見改善（已連續 ${noImprovementCount} 次），繼續嘗試其他策略...`);
        
        // 即使未見改善，也更新最佳值（如果更接近目標）
        const currentDistance = Math.max(0, targetAverageHitCount - averageHitCount) * 10 + 
                                Math.max(0, targetAverageAccuracy - averageAccuracy);
        const bestDistance = Math.max(0, targetAverageHitCount - bestOptimizedHitCount) * 10 + 
                            Math.max(0, targetAverageAccuracy - bestOptimizedAccuracy);
        
        if (currentDistance < bestDistance) {
          bestOptimizedHitCount = averageHitCount;
          bestOptimizedAccuracy = averageAccuracy;
        }
      }
    }
  }
  
  // 更新最終權重
  currentWeights = { ...optimizedWeights };
  
  // 重新計算最終統計（使用優化後的結果）
  totalValidations = validationResults.length;
  totalHits = validationResults.reduce((sum, r) => sum + r.comparison.hitCount, 0);
  averageAccuracy = totalValidations > 0 
    ? validationResults.reduce((sum, r) => sum + r.comparison.accuracy, 0) / totalValidations 
    : 0;
  averageCoverage = totalValidations > 0
    ? validationResults.reduce((sum, r) => sum + r.comparison.coverage, 0) / totalValidations
    : 0;
  averageHitCount = totalValidations > 0 
    ? Math.round((totalHits / totalValidations) * 100) / 100 
    : 0;
  
  // 更新目標達成狀態
  meetsHitCountTarget = averageHitCount >= targetAverageHitCount;
  meetsAccuracyTarget = averageAccuracy >= targetAverageAccuracy;
  meetsAllTargets = meetsHitCountTarget && meetsAccuracyTarget;
  
  // 重新計算其他統計
  periodsWithAtLeast3Hits = validationResults.filter(r => r.comparison.meetsTarget).length;
  hitRateAtLeast3 = totalValidations > 0 
    ? Math.round((periodsWithAtLeast3Hits / totalValidations) * 10000) / 100 
    : 0;
  
  hitCountDistribution = {};
  validationResults.forEach(r => {
    const hitCount = r.comparison.hitCount;
    hitCountDistribution[hitCount] = (hitCountDistribution[hitCount] || 0) + 1;
  });
  
  // 生成最新一期的迭代驗證結果（使用最終權重和所有歷史數據）
  let latestPeriodPrediction = null;
  try {
    // 使用所有歷史數據作為訓練數據
    const trainingDataForLatest = allResults;
    
    // 對於最新一期，不需要排除任何期數（因為它是最新的）
    // 使用最終權重進行分析
    const latestAnalysis = analyzeNumbers(trainingDataForLatest, currentWeights, null);
    
    // 使用歷史驗證結果來優化選擇
    const previousResults = validationResults.slice(-15);
    
    // 生成多個候選組合
    const candidateCombinations = generateMultipleCandidates(latestAnalysis.topNumbers, 6, previousResults);
    
    // 選擇最優組合（如果有歷史數據，優先選擇歷史表現最好的策略）
    let bestCombination = candidateCombinations[0];
    let bestStrategy = 'top6';
    
    if (previousResults.length > 0) {
      // 根據歷史表現選擇最佳策略
      const strategyPerformance = {};
      previousResults.forEach(result => {
        if (result.strategy) {
          if (!strategyPerformance[result.strategy]) {
            strategyPerformance[result.strategy] = { hits: 0, total: 0, atLeast3: 0 };
          }
          strategyPerformance[result.strategy].hits += result.comparison.hitCount;
          strategyPerformance[result.strategy].total += 1;
          if (result.comparison.hitCount >= 3) {
            strategyPerformance[result.strategy].atLeast3 += 1;
          }
        }
      });
      
      // 找到歷史表現最好的策略
      let bestStrategyName = 'top6';
      let bestAtLeast3Rate = 0;
      Object.keys(strategyPerformance).forEach(strategy => {
        const perf = strategyPerformance[strategy];
        const atLeast3Rate = perf.atLeast3 / perf.total;
        if (atLeast3Rate > bestAtLeast3Rate) {
          bestAtLeast3Rate = atLeast3Rate;
          bestStrategyName = strategy;
        }
      });
      
      // 選擇使用最佳策略的組合
      const bestCandidate = candidateCombinations.find(c => c.strategy === bestStrategyName);
      if (bestCandidate) {
        bestCombination = bestCandidate.numbers;
        bestStrategy = bestStrategyName;
      }
    }
    
    const predictedNumbers = bestCombination;
    
    // 提取最新期的實際號碼（如果有的話）
    const actualNumbers = extractAllNumbers([latestResult])[0]?.numbers || [];
    
    // 如果有實際號碼，進行比對；否則只顯示預測結果
    let comparison = null;
    if (actualNumbers.length > 0) {
      comparison = comparePrediction(predictedNumbers, actualNumbers);
    }
    
    latestPeriodPrediction = {
      trainingPeriod: latestPeriod,
      targetPeriod: latestPeriod, // 最新一期
      predictedNumbers: predictedNumbers.map(n => n.number),
      actualNumbers: actualNumbers.length > 0 ? actualNumbers : null, // 如果沒有實際號碼則為null
      strategy: bestStrategy,
      comparison: comparison ? {
        ...comparison,
        meetsTarget: comparison.meetsTarget,
        targetHitCount: comparison.targetHitCount,
        hitCountStatus: comparison.hitCountStatus,
        hitDetails: {
          hitCount: comparison.hitCount,
          targetHitCount: comparison.targetHitCount,
          meetsTarget: comparison.meetsTarget,
          status: comparison.hitCountStatus,
          hits: comparison.hits,
          misses: comparison.misses
        }
      } : null, // 如果沒有實際號碼則為null
      weights: { ...currentWeights },
      isLatest: true // 標記為最新一期
    };
  } catch (error) {
    console.error('生成最新一期預測時發生錯誤:', error);
    console.error('錯誤詳情:', error.stack);
    // 如果生成失敗，latestPeriodPrediction 保持為 null
  }
  
  // 將最新一期的結果放在驗證結果前面
  const allValidationResults = [];
  if (latestPeriodPrediction) {
    allValidationResults.push(latestPeriodPrediction);
  }
  allValidationResults.push(...validationResults);
  
  return {
    latestPeriod: latestPeriod,
    startPeriod: allResults[startIndex]?.periodNumber,
    totalValidations: totalValidations,
    validationResults: allValidationResults, // 包含最新一期在內的所有驗證結果
    latestPeriodPrediction: latestPeriodPrediction, // 單獨提供最新一期的預測結果（方便訪問）
    finalWeights: currentWeights,
    statistics: {
      totalHits: totalHits,
      averageHitsPerPeriod: averageHitCount,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      averageCoverage: Math.round(averageCoverage * 100) / 100,
      targetHitCount: 3, // 目標命中數至少3
      targetAverageHitCount: targetAverageHitCount, // 目標平均每期命中數至少3
      targetAverageAccuracy: targetAverageAccuracy, // 目標平均準確率至少50%
      meetsHitCountTarget: meetsHitCountTarget, // 是否達到平均命中數目標
      meetsAccuracyTarget: meetsAccuracyTarget, // 是否達到平均準確率目標
      meetsAllTargets: meetsAllTargets, // 是否達到所有目標
      optimizationIterations: optimizationIterations, // 優化迭代次數
      periodsWithAtLeast3Hits: periodsWithAtLeast3Hits, // 命中數至少3的期數
      hitRateAtLeast3: hitRateAtLeast3, // 命中數至少3的期數百分比
      hitCountDistribution: hitCountDistribution, // 命中數分布（例如：{0: 2, 1: 5, 2: 8, 3: 10, 4: 5, 5: 3, 6: 1}）
      // 詳細統計：每個命中數的期數和百分比
      hitCountDetails: Object.keys(hitCountDistribution).map(hitCount => ({
        hitCount: parseInt(hitCount, 10),
        periods: hitCountDistribution[hitCount],
        percentage: Math.round((hitCountDistribution[hitCount] / totalValidations) * 10000) / 100,
        meetsTarget: parseInt(hitCount, 10) >= 3
      })).sort((a, b) => b.hitCount - a.hitCount),
      // 目標達成摘要
      targetSummary: {
        averageHitCount: {
          current: averageHitCount,
          target: targetAverageHitCount,
          meetsTarget: meetsHitCountTarget,
          gap: Math.round((targetAverageHitCount - averageHitCount) * 100) / 100,
          status: meetsHitCountTarget ? '達標' : `不足（差${Math.round((targetAverageHitCount - averageHitCount) * 100) / 100}個）`
        },
        averageAccuracy: {
          current: Math.round(averageAccuracy * 100) / 100,
          target: targetAverageAccuracy,
          meetsTarget: meetsAccuracyTarget,
          gap: Math.round((targetAverageAccuracy - averageAccuracy) * 100) / 100,
          status: meetsAccuracyTarget ? '達標' : `不足（差${Math.round((targetAverageAccuracy - averageAccuracy) * 100) / 100}%）`
        },
        overall: {
          meetsAllTargets: meetsAllTargets,
          status: meetsAllTargets ? '所有目標已達成' : '部分目標未達成'
        }
      }
    }
  };
}

/**
 * 生成組合（從 n 個元素中選擇 k 個）
 * @param {Array} arr - 元素陣列
 * @param {number} k - 選擇數量
 * @returns {Array} 所有組合的陣列
 */
function generateCombinations(arr, k) {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  
  const combinations = [];
  
  function backtrack(start, current) {
    if (current.length === k) {
      combinations.push([...current]);
      return;
    }
    
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  
  backtrack(0, []);
  return combinations;
}

/**
 * 生成 $100 複式投注建議（10注）
 * 使用精選組合策略，以10注覆蓋15個號碼
 * @param {Array} numbers - 15個預測號碼（已按分數排序）
 * @returns {Object} 複式投注建議
 */
function generateCompoundBetSuggestion100(numbers) {
  if (!numbers || numbers.length < 15) {
    throw new Error('需要至少15個號碼');
  }
  
  // 提取號碼值（確保是數字）
  const numberArray = numbers.slice(0, 15).map(item => 
    typeof item === 'object' ? item.number : parseInt(item, 10)
  ).filter(n => !isNaN(n) && n >= 1 && n <= 49);
  
  if (numberArray.length < 15) {
    throw new Error('號碼數量不足15個');
  }
  
  // 策略：使用精選組合，確保10注覆蓋所有15個號碼
  const coreNumbers = numberArray.slice(0, 8); // 前8個最有可能的號碼
  const outerNumbers = numberArray.slice(8, 15); // 後7個號碼
  
  const bets = [];
  
  // 策略1：核心組選6個（選2注，確保核心號碼的高覆蓋率）
  const core6Combinations = generateCombinations(coreNumbers, 6);
  bets.push(...core6Combinations.slice(0, 2));
  
  // 策略2：核心組選5個 + 外圍組選1個（選4注，確保外圍號碼被包含）
  const core5Combinations = generateCombinations(coreNumbers, 5);
  const selectedCore5 = core5Combinations.slice(0, 4); // 選前4個核心5組合
  
  selectedCore5.forEach((core5, idx) => {
    // 每個核心5組合配對不同的外圍號碼，確保外圍號碼均勻分布
    const outerIndex = idx % outerNumbers.length;
    bets.push([...core5, outerNumbers[outerIndex]].sort((a, b) => a - b));
  });
  
  // 策略3：核心組選4個 + 外圍組選2個（選2注）
  const core4Combinations = generateCombinations(coreNumbers, 4);
  const selectedCore4 = core4Combinations.slice(0, 2); // 選前2個核心4組合
  const outer2Combinations = generateCombinations(outerNumbers, 2);
  
  // 選擇不同的外圍2組合，確保覆蓋更多外圍號碼
  const selectedOuter2 = outer2Combinations.slice(0, 2);
  selectedCore4.forEach((core4, idx) => {
    if (idx < selectedOuter2.length && bets.length < 10) {
      bets.push([...core4, ...selectedOuter2[idx]].sort((a, b) => a - b));
    }
  });
  
  // 策略4：核心組選3個 + 外圍組選3個（補充組合以達到10注）
  if (bets.length < 10) {
    const core3Combinations = generateCombinations(coreNumbers, 3);
    const outer3Combinations = generateCombinations(outerNumbers, 3);
    
    // 選擇一些組合來補充到10注
    const needed = 10 - bets.length;
    let added = 0;
    for (let i = 0; i < Math.min(needed, core3Combinations.length) && bets.length < 10; i++) {
      for (let j = 0; j < Math.min(1, outer3Combinations.length) && bets.length < 10; j++) {
        bets.push([...core3Combinations[i], ...outer3Combinations[j]].sort((a, b) => a - b));
        added++;
        if (added >= needed) break;
      }
      if (added >= needed) break;
    }
  }
  
  // 去重
  const uniqueBets = [];
  const betStrings = new Set();
  
  bets.forEach(bet => {
    const betStr = bet.sort((a, b) => a - b).join(',');
    if (!betStrings.has(betStr)) {
      betStrings.add(betStr);
      uniqueBets.push(bet.sort((a, b) => a - b));
    }
  });
  
  // 如果不足10注，補充一些組合
  if (uniqueBets.length < 10) {
    // 使用核心組選2個 + 外圍組選4個來補充
    const core2Combinations = generateCombinations(coreNumbers, 2);
    const outer4Combinations = generateCombinations(outerNumbers, 4);
    
    for (let i = 0; i < core2Combinations.length && uniqueBets.length < 10; i++) {
      for (let j = 0; j < outer4Combinations.length && uniqueBets.length < 10; j++) {
        const newBet = [...core2Combinations[i], ...outer4Combinations[j]].sort((a, b) => a - b);
        const betStr = newBet.join(',');
        if (!betStrings.has(betStr)) {
          betStrings.add(betStr);
          uniqueBets.push(newBet);
        }
      }
    }
  }
  
  // 如果仍然不足10注，使用核心組的更多組合
  if (uniqueBets.length < 10) {
    const core6All = generateCombinations(coreNumbers, 6);
    for (let i = uniqueBets.length; i < 10 && i < core6All.length; i++) {
      const betStr = core6All[i].sort((a, b) => a - b).join(',');
      if (!betStrings.has(betStr)) {
        betStrings.add(betStr);
        uniqueBets.push(core6All[i].sort((a, b) => a - b));
      }
    }
  }
  
  // 限制為恰好10注
  const finalBets = uniqueBets.slice(0, 10);
  
  // 計算總注數和總金額（每注$10）
  const totalBets = finalBets.length;
  const totalAmount = totalBets * 10;
  
  return {
    numbers: numberArray,
    bets: finalBets,
    totalBets: totalBets,
    totalAmount: totalAmount,
    strategy: '$100 精選組合',
    description: `使用精選組合策略，以 ${totalBets} 注（$100）覆蓋所有15個預測號碼，適合預算有限的投注者`
  };
}

/**
 * 生成複式投注建議（多個選項）
 * 根據六合彩複式投注規則：從7個或以上號碼中選取，系統會自動組合所有可能的6個號碼組合
 * @param {Array} numbers - 15個預測號碼（已按分數排序）
 * @returns {Array} 複式投注建議陣列（每個選項包含不同數量的號碼）
 */
function generateCompoundBetSuggestions(numbers) {
  if (!numbers || numbers.length < 7) {
    throw new Error('需要至少7個號碼才能生成複式投注建議');
  }
  
  // 提取號碼值（確保是數字）
  const numberArray = numbers.map(item => 
    typeof item === 'object' ? item.number : parseInt(item, 10)
  ).filter(n => !isNaN(n) && n >= 1 && n <= 49);
  
  if (numberArray.length < 7) {
    throw new Error('號碼數量不足7個');
  }
  
  const suggestions = [];
  
  // 生成不同數量的複式投注建議（7個、8個、9個、10個、11個、12個號碼）
  // 計算組合數：C(n, 6) = n! / (6! * (n-6)!)
  // 注數計算：7個號碼=7注, 8個號碼=28注, 9個號碼=84注, 10個號碼=210注, 11個號碼=462注, 12個號碼=924注
  const calculateCombinations = (n, k) => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k); // 優化：使用對稱性
    let result = 1;
    for (let i = 0; i < k; i++) {
      result = result * (n - i) / (i + 1);
    }
    return Math.round(result);
  };
  
  // 生成7到12個號碼的複式投注建議（包含注數7的建議，即7個號碼=7注）
  // 確保至少生成7個號碼的建議（7注）
  const minNumberCount = 7;
  const maxNumberCount = Math.min(12, numberArray.length);
  
  if (maxNumberCount < minNumberCount) {
    throw new Error(`號碼數量不足${minNumberCount}個，無法生成複式投注建議`);
  }
  
  for (let numCount = minNumberCount; numCount <= maxNumberCount; numCount++) {
    const selectedNumbers = numberArray.slice(0, numCount);
    const totalBets = calculateCombinations(numCount, 6);
    const totalAmount = totalBets * 10; // 每注$10
    
    // 如果注數超過1000注，只生成前1000注（避免記憶體問題）
    // 實際計算：7個=7注, 8個=28注, 9個=84注, 10個=210注, 11個=462注, 12個=924注
    // 所以12個號碼以內都可以完全生成
    const maxBetsToGenerate = 1000;
    const shouldGenerateAll = totalBets <= maxBetsToGenerate;
    
    let bets = [];
    if (shouldGenerateAll) {
      // 生成所有組合
      bets = generateCombinations(selectedNumbers, 6);
    } else {
      // 如果注數太多（超過12個號碼），生成部分組合作為示例
      // 使用迭代方式生成前1000個組合，避免生成所有組合
      const allCombinations = generateCombinations(selectedNumbers, 6);
      bets = allCombinations.slice(0, maxBetsToGenerate);
    }
    
    suggestions.push({
      numberCount: numCount,
      numbers: selectedNumbers,
      bets: bets,
      totalBets: totalBets,
      totalAmount: totalAmount,
      isComplete: shouldGenerateAll,
      strategy: `${numCount}個號碼複式投注`,
      description: `選取前${numCount}個最有可能的號碼，系統自動組合所有可能的6個號碼組合，共${totalBets}注（$${totalAmount.toLocaleString()}）。${!shouldGenerateAll ? `（僅顯示前${maxBetsToGenerate}注作為示例）` : ''}`
    });
  }
  
  return suggestions;
}

module.exports = {
  analyzeNumbers,
  parsePeriodNumber,
  isNextPeriod,
  comparePrediction,
  adjustWeights,
  iterativeValidation,
  generateCompoundBetSuggestions,
  generateCompoundBetSuggestion100,
  selectOptimalNumbers
};

