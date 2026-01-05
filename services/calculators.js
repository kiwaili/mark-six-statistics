/**
 * 統計計算模組
 * 包含各種統計分析計算函數
 */

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
  const filtered = filteredNumbers || (excludePeriodNumbers 
        ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
        : allNumbers);
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

module.exports = {
  calculateFrequency,
  calculateWeightedFrequency,
  calculateGapAnalysis,
  calculatePatternScore,
  calculateDistributionFeatures,
  calculateDistributionScore,
  calculateTrendAnalysis,
  calculateChiSquareScore,
  calculatePoissonScore
};
