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

/**
 * 計算相關性分析分數（分析號碼之間的相關性）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 相關性分數
 */
function calculateCorrelationScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const correlationScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    correlationScore[i] = 0;
  }

  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);

  if (filtered.length < 2) {
    return { scores: correlationScore, correlations: {} };
  }

  // 計算每個號碼的出現序列（每期是否出現：1或0）
  const appearanceMatrix = {};
  for (let i = 1; i <= 49; i++) {
    appearanceMatrix[i] = [];
  }

  filtered.forEach(period => {
    for (let i = 1; i <= 49; i++) {
      appearanceMatrix[i].push(period.numbers.includes(i) ? 1 : 0);
    }
  });

  // 計算皮爾遜相關係數
  const calculatePearsonCorrelation = (x, y) => {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
  };

  // 計算每個號碼與其他號碼的平均相關性
  const correlations = {};
  for (let i = 1; i <= 49; i++) {
    let totalCorrelation = 0;
    let count = 0;

    for (let j = 1; j <= 49; j++) {
      if (i !== j) {
        const corr = calculatePearsonCorrelation(appearanceMatrix[i], appearanceMatrix[j]);
        totalCorrelation += Math.abs(corr); // 使用絕對值，因為正負相關都表示有關係
        count++;

        // 記錄強相關性（|r| > 0.3）
        if (Math.abs(corr) > 0.3) {
          if (!correlations[i]) correlations[i] = [];
          correlations[i].push({ number: j, correlation: Math.round(corr * 100) / 100 });
        }
      }
    }

    // 平均相關性作為分數（相關性高的號碼可能更容易一起出現）
    const avgCorrelation = count > 0 ? totalCorrelation / count : 0;
    correlationScore[i] = Math.min(100, avgCorrelation * 200); // 放大並限制在100以內
  }

  return {
    scores: correlationScore,
    correlations: correlations
  };
}

/**
 * 計算熵分析分數（評估號碼出現的不確定性）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 熵分析分數
 */
function calculateEntropyScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const entropyScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    entropyScore[i] = 0;
  }

  const frequency = calculateFrequency(allNumbers, excludePeriodNumbers, filteredNumbers);
  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);
  const totalPeriods = filtered.length;
  const totalNumbers = totalPeriods * 6; // 每期6個號碼

  // 計算整體熵（香農熵）
  let overallEntropy = 0;
  for (let i = 1; i <= 49; i++) {
    const probability = frequency[i] / totalNumbers;
    if (probability > 0) {
      overallEntropy -= probability * Math.log2(probability);
    }
  }

  // 計算每個號碼的熵分數
  // 如果號碼出現頻率接近期望值，熵較高（更隨機）
  // 如果號碼出現頻率偏離期望值，熵較低（可能有模式）
  const expectedProbability = 6 / 49; // 每個號碼每期出現的期望機率

  for (let i = 1; i <= 49; i++) {
    const probability = frequency[i] / totalNumbers;
    const deviation = Math.abs(probability - expectedProbability);

    // 如果偏差小（接近隨機），給予較高分數
    // 如果偏差大（有模式），給予較低分數
    // 但我們想要預測，所以給偏差大的號碼較高分數（表示可能有規律）
    if (deviation > 0) {
      // 使用對數函數平滑化
      entropyScore[i] = Math.min(100, Math.log(deviation * 100 + 1) * 20);
    } else {
      entropyScore[i] = 50; // 完全隨機的情況
    }
  }

  return {
    scores: entropyScore,
    overallEntropy: Math.round(overallEntropy * 100) / 100,
    maxEntropy: Math.log2(49) // 最大熵（完全均勻分布）
  };
}

/**
 * 計算馬可夫鏈分析分數（分析號碼之間的轉移機率）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 馬可夫鏈分數
 */
function calculateMarkovChainScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const markovScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    markovScore[i] = 0;
  }

  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);

  if (filtered.length < 2) {
    return { scores: markovScore, transitionMatrix: {} };
  }

  // 建立轉移矩陣：從上一期的號碼轉移到下一期的號碼
  const transitionCounts = {};
  const fromCounts = {}; // 記錄每個號碼作為起點的次數

  // 初始化
  for (let i = 1; i <= 49; i++) {
    fromCounts[i] = 0;
    transitionCounts[i] = {};
    for (let j = 1; j <= 49; j++) {
      transitionCounts[i][j] = 0;
    }
  }

  // 計算轉移次數
  for (let t = 0; t < filtered.length - 1; t++) {
    const currentPeriod = filtered[t];
    const nextPeriod = filtered[t + 1];

    currentPeriod.numbers.forEach(fromNum => {
      fromCounts[fromNum]++;
      nextPeriod.numbers.forEach(toNum => {
        transitionCounts[fromNum][toNum]++;
      });
    });
  }

  // 計算轉移機率並生成分數
  const transitionMatrix = {};
  const latestPeriod = filtered[0]; // 最新一期

  // 基於最新一期的號碼，計算下一期各號碼出現的機率
  latestPeriod.numbers.forEach(fromNum => {
    if (!transitionMatrix[fromNum]) {
      transitionMatrix[fromNum] = {};
    }

    for (let toNum = 1; toNum <= 49; toNum++) {
      const count = transitionCounts[fromNum][toNum];
      const total = fromCounts[fromNum];
      const probability = total > 0 ? count / total : 0;

      transitionMatrix[fromNum][toNum] = Math.round(probability * 1000) / 1000;

      // 累加分數：如果從最新期的號碼轉移到某號碼的機率高，給予高分
      markovScore[toNum] += probability * 100;
    }
  });

  // 正規化分數
  const maxScore = Math.max(...Object.values(markovScore));
  if (maxScore > 0) {
    for (let i = 1; i <= 49; i++) {
      markovScore[i] = (markovScore[i] / maxScore) * 100;
    }
  }

  return {
    scores: markovScore,
    transitionMatrix: transitionMatrix
  };
}

/**
 * 計算組合數學分析分數（分析號碼組合的數學特性）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 組合數學分數
 */
function calculateCombinatorialScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const combinatorialScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    combinatorialScore[i] = 0;
  }

  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);

  if (filtered.length === 0) {
    return { scores: combinatorialScore, patterns: {} };
  }

  // 分析歷史組合的數學特性
  const sumFrequency = {}; // 號碼和的分佈
  const diffFrequency = {}; // 號碼差的分佈
  const productFrequency = {}; // 號碼積的分佈（簡化，只考慮小值）
  const consecutivePairs = {}; // 連續號碼對的頻率

  filtered.forEach(period => {
    const sorted = [...period.numbers].sort((a, b) => a - b);

    // 計算和、差、積
    const sum = sorted.reduce((a, b) => a + b, 0);
    sumFrequency[sum] = (sumFrequency[sum] || 0) + 1;

    // 計算相鄰號碼的差
    for (let i = 0; i < sorted.length - 1; i++) {
      const diff = sorted[i + 1] - sorted[i];
      diffFrequency[diff] = (diffFrequency[diff] || 0) + 1;

      // 記錄連續號碼對
      if (diff === 1) {
        const pair = `${sorted[i]}-${sorted[i + 1]}`;
        consecutivePairs[pair] = (consecutivePairs[pair] || 0) + 1;
      }
    }
  });

  // 計算平均和、平均差
  const avgSum = Object.keys(sumFrequency).reduce((sum, key) => {
    return sum + parseInt(key) * sumFrequency[key];
  }, 0) / filtered.length;

  const totalDiffs = Object.values(diffFrequency).reduce((a, b) => a + b, 0);
  const avgDiff = totalDiffs > 0
    ? Object.keys(diffFrequency).reduce((sum, key) => {
      return sum + parseInt(key) * diffFrequency[key];
    }, 0) / totalDiffs
    : 0;

  // 分析最新一期的組合特性
  const latestPeriod = filtered[0];
  const latestSorted = [...latestPeriod.numbers].sort((a, b) => a - b);
  const latestSum = latestSorted.reduce((a, b) => a + b, 0);
  const latestAvg = latestSum / latestSorted.length;

  // 計算每個號碼的分數
  for (let i = 1; i <= 49; i++) {
    let score = 0;

    // 1. 如果加入該號碼後，總和接近歷史平均，給予加分
    const potentialSum = latestSum + i;
    const potentialAvg = potentialSum / 7; // 假設下一期有7個號碼（6個+這個）
    const sumDeviation = Math.abs(potentialAvg - avgSum);
    if (sumDeviation < 5) {
      score += (5 - sumDeviation) * 10;
    }

    // 2. 如果該號碼與最新期的號碼形成常見的差值，給予加分
    latestSorted.forEach(num => {
      const diff = Math.abs(i - num);
      if (diffFrequency[diff] && diffFrequency[diff] > filtered.length * 0.1) {
        score += 15;
      }
    });

    // 3. 如果該號碼與最新期的號碼形成連續對，給予加分
    latestSorted.forEach(num => {
      if (Math.abs(i - num) === 1) {
        const pair = i < num ? `${i}-${num}` : `${num}-${i}`;
        if (consecutivePairs[pair] && consecutivePairs[pair] > filtered.length * 0.05) {
          score += 20;
        }
      }
    });

    // 4. 如果該號碼在常見的和值範圍內，給予加分
    const commonSums = Object.keys(sumFrequency)
      .filter(key => sumFrequency[key] > filtered.length * 0.1)
      .map(key => parseInt(key));

    if (commonSums.length > 0) {
      const potentialSum = latestSum + i;
      const closestCommonSum = commonSums.reduce((closest, sum) => {
        return Math.abs(sum - potentialSum) < Math.abs(closest - potentialSum) ? sum : closest;
      }, commonSums[0]);

      if (Math.abs(potentialSum - closestCommonSum) < 10) {
        score += 10;
      }
    }

    combinatorialScore[i] = Math.min(100, score);
  }

  return {
    scores: combinatorialScore,
    patterns: {
      avgSum: Math.round(avgSum * 100) / 100,
      avgDiff: Math.round(avgDiff * 100) / 100,
      commonSums: Object.keys(sumFrequency)
        .filter(key => sumFrequency[key] > filtered.length * 0.1)
        .map(key => parseInt(key))
        .sort((a, b) => sumFrequency[b] - sumFrequency[a])
        .slice(0, 10)
    }
  };
}

/**
 * 計算加權移動平均分數
 * 使用過去N期的加權值預測未來值，較近期的值權重較高
 * @param {Array<number>} appearances - 號碼出現序列（每期是否出現：1或0）
 * @param {number} order - 移動平均階數
 * @returns {number} 正規化後的預測值（0-1範圍）
 */
function calculateWeightedRecentScore(appearances, order) {
  if (appearances.length < order) {
    return 0;
  }

  let prediction = 0;
  for (let j = 1; j <= order; j++) {
    if (appearances.length >= j) {
      prediction += appearances[appearances.length - j] * (1 / j);
    }
  }
  // 正規化預測值
  prediction = prediction / order;

  return Math.max(0, Math.min(1, prediction));
}

/**
 * 計算加權移動平均分析分數
 * 使用過去N期的加權值預測未來值，較近期的值權重較高
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @param {number} order - 移動平均階數，預設為3
 * @returns {Object} 加權移動平均分析分數
 */
function calculateAutoregressiveScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null, order = 3) {
  const weightedRecentScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    weightedRecentScore[i] = 0;
  }

  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);

  if (filtered.length < order + 1) {
    return { scores: weightedRecentScore, coefficients: {}, predictions: {} };
  }

  // 對每個號碼計算加權移動平均
  const predictions = {};

  for (let num = 1; num <= 49; num++) {
    // 建立出現序列（每期是否出現：1或0）
    const appearances = [];
    for (let i = 0; i < filtered.length; i++) {
      appearances.push(filtered[i].numbers.includes(num) ? 1 : 0);
    }

    if (appearances.length >= order) {
      predictions[num] = calculateWeightedRecentScore(appearances, order);
      weightedRecentScore[num] = predictions[num] * 100;
    }
  }

  return {
    scores: weightedRecentScore,
    predictions: predictions
  };
}

/**
 * 計算生存分析 (Survival Analysis) 分數
 * 分析號碼「存活」（未出現）的時間長度，預測號碼何時會再次出現
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 生存分析分數
 */
function calculateSurvivalAnalysisScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const survivalScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    survivalScore[i] = 0;
  }

  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);

  if (filtered.length < 2) {
    return { scores: survivalScore, survivalTimes: {}, hazardRates: {} };
  }

  // 計算每個號碼的生存時間（未出現的連續期數）
  const survivalTimes = {}; // 記錄每次「存活」的時間長度
  const lastAppearance = {}; // 記錄最後一次出現的位置

  // 初始化
  for (let i = 1; i <= 49; i++) {
    survivalTimes[i] = [];
    lastAppearance[i] = -1;
  }

  // 從最新到最舊遍歷
  for (let i = 0; i < filtered.length; i++) {
    const period = filtered[i];
    for (let num = 1; num <= 49; num++) {
      if (period.numbers.includes(num)) {
        // 如果之前有記錄最後出現位置，計算生存時間
        if (lastAppearance[num] >= 0) {
          const survivalTime = i - lastAppearance[num];
          survivalTimes[num].push(survivalTime);
        }
        lastAppearance[num] = i;
      }
    }
  }

  // 計算當前生存時間（距離最後一次出現的期數）
  const currentSurvivalTime = {};
  for (let num = 1; num <= 49; num++) {
    if (lastAppearance[num] >= 0) {
      currentSurvivalTime[num] = lastAppearance[num];
    } else {
      currentSurvivalTime[num] = filtered.length; // 從未出現
    }
  }

  // 計算危險率（hazard rate）：在給定時間t，號碼在下一期出現的條件機率
  const hazardRates = {};
  for (let num = 1; num <= 49; num++) {
    const times = survivalTimes[num];
    if (times.length === 0) {
      // 如果從未出現過，使用平均生存時間
      const avgSurvivalTime = filtered.length / 2;
      hazardRates[num] = 1 / (avgSurvivalTime + 1);
    } else {
      // 計算平均生存時間
      const avgSurvivalTime = times.reduce((a, b) => a + b, 0) / times.length;
      const currentTime = currentSurvivalTime[num];

      // 使用指數分布模型：hazard rate = 1 / mean
      // 如果當前生存時間接近或超過平均生存時間，危險率增加
      const baseHazard = 1 / (avgSurvivalTime + 1);
      const timeRatio = currentTime / (avgSurvivalTime + 1);

      // 如果當前生存時間超過平均，危險率增加
      hazardRates[num] = baseHazard * (1 + timeRatio * 0.5);
    }

    // 將危險率轉換為分數（0-100）
    survivalScore[num] = Math.min(100, hazardRates[num] * 200);
  }

  return {
    scores: survivalScore,
    survivalTimes: survivalTimes,
    hazardRates: hazardRates
  };
}

/**
 * 計算極值理論 (Extreme Value Theory) 分數
 * 分析極端事件（如某號碼長期未出現）的分布，評估「冷門號碼」出現的機率
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 極值理論分數
 */
function calculateExtremeValueScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const extremeScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    extremeScore[i] = 0;
  }

  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);

  if (filtered.length < 10) {
    return { scores: extremeScore, extremeGaps: {}, returnLevels: {} };
  }

  // 計算每個號碼的最大間隔（極值）
  const gaps = {}; // 記錄所有間隔
  const maxGaps = {}; // 記錄最大間隔
  const lastAppearance = {}; // 記錄最後一次出現的位置

  // 初始化
  for (let i = 1; i <= 49; i++) {
    gaps[i] = [];
    maxGaps[i] = 0;
    lastAppearance[i] = -1;
  }

  // 計算間隔
  for (let i = 0; i < filtered.length; i++) {
    const period = filtered[i];
    for (let num = 1; num <= 49; num++) {
      if (period.numbers.includes(num)) {
        if (lastAppearance[num] >= 0) {
          const gap = i - lastAppearance[num];
          gaps[num].push(gap);
          maxGaps[num] = Math.max(maxGaps[num], gap);
        }
        lastAppearance[num] = i;
      }
    }
  }

  // 計算當前間隔
  const currentGaps = {};
  for (let num = 1; num <= 49; num++) {
    if (lastAppearance[num] >= 0) {
      currentGaps[num] = lastAppearance[num];
    } else {
      currentGaps[num] = filtered.length; // 從未出現
    }
  }

  // 使用廣義極值分布 (GEV) 的簡化模型
  // 計算回歸水平（return level）：在給定時間內，極值超過某個閾值的機率
  const returnLevels = {};
  for (let num = 1; num <= 49; num++) {
    const gapList = gaps[num];
    if (gapList.length === 0) {
      // 從未出現，使用極值理論預測
      const expectedGap = filtered.length / 49; // 期望間隔
      const extremeThreshold = expectedGap * 2; // 極值閾值
      const currentGap = currentGaps[num];

      // 如果當前間隔超過極值閾值，機率增加
      if (currentGap >= extremeThreshold) {
        const exceedanceProb = 1 - Math.exp(-currentGap / (expectedGap + 1));
        returnLevels[num] = exceedanceProb;
        extremeScore[num] = Math.min(100, exceedanceProb * 150);
      } else {
        extremeScore[num] = 30; // 未達到極值閾值，給予較低分數
      }
    } else {
      // 計算統計量
      const sortedGaps = [...gapList].sort((a, b) => a - b);
      const meanGap = gapList.reduce((a, b) => a + b, 0) / gapList.length;
      const maxGap = maxGaps[num];
      const currentGap = currentGaps[num];

      // 使用極值理論：如果當前間隔接近或超過歷史最大間隔，機率增加
      if (currentGap >= maxGap * 0.8) {
        // 接近歷史極值，使用極值分布模型
        const exceedanceProb = 1 - Math.exp(-(currentGap - meanGap) / (maxGap - meanGap + 1));
        returnLevels[num] = exceedanceProb;
        extremeScore[num] = Math.min(100, exceedanceProb * 120);
      } else if (currentGap >= meanGap * 1.5) {
        // 超過平均間隔的1.5倍，給予中等分數
        const ratio = currentGap / (meanGap + 1);
        extremeScore[num] = Math.min(100, 50 + ratio * 20);
      } else {
        extremeScore[num] = 30;
      }
    }
  }

  return {
    scores: extremeScore,
    extremeGaps: maxGaps,
    returnLevels: returnLevels
  };
}

/**
 * 計算聚類分析 (Cluster Analysis) 分數
 * 將號碼分組，識別相似的出現模式，發現號碼之間的關聯性
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @param {number} numClusters - 聚類數量，預設為7（接近每期號碼數）
 * @returns {Object} 聚類分析分數
 */
function calculateClusterAnalysisScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null, numClusters = 7) {
  const clusterScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    clusterScore[i] = 0;
  }

  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);

  if (filtered.length < numClusters) {
    return { scores: clusterScore, clusters: {}, clusterCenters: {} };
  }

  // 建立號碼出現模式向量（每期是否出現）
  const appearanceVectors = {};
  for (let num = 1; num <= 49; num++) {
    appearanceVectors[num] = [];
    for (let i = 0; i < filtered.length; i++) {
      appearanceVectors[num].push(filtered[i].numbers.includes(num) ? 1 : 0);
    }
  }

  // 計算號碼之間的相似度（使用餘弦相似度）
  const similarityMatrix = {};
  for (let i = 1; i <= 49; i++) {
    similarityMatrix[i] = {};
    for (let j = 1; j <= 49; j++) {
      if (i === j) {
        similarityMatrix[i][j] = 1;
      } else {
        const vec1 = appearanceVectors[i];
        const vec2 = appearanceVectors[j];
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let k = 0; k < vec1.length; k++) {
          dotProduct += vec1[k] * vec2[k];
          norm1 += vec1[k] * vec1[k];
          norm2 += vec2[k] * vec2[k];
        }

        const similarity = (norm1 > 0 && norm2 > 0)
          ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
          : 0;
        similarityMatrix[i][j] = similarity;
      }
    }
  }

  // 使用簡化的K-means聚類（基於相似度）
  // 選擇初始聚類中心（選擇相似度較低的號碼作為中心）
  const clusterCenters = [];
  const used = new Set();

  // 選擇第一個中心：使用頻率最高的號碼
  let firstCenter = 1;
  let maxFreq = 0;
  for (let num = 1; num <= 49; num++) {
    const freq = appearanceVectors[num].reduce((a, b) => a + b, 0);
    if (freq > maxFreq) {
      maxFreq = freq;
      firstCenter = num;
    }
  }
  clusterCenters.push(firstCenter);
  used.add(firstCenter);

  // 選擇其他中心（選擇與已選中心相似度較低的號碼）
  while (clusterCenters.length < numClusters && used.size < 49) {
    let bestCandidate = null;
    let minSimilarity = Infinity;

    for (let num = 1; num <= 49; num++) {
      if (!used.has(num)) {
        let maxSimilarityToCenters = 0;
        for (const center of clusterCenters) {
          maxSimilarityToCenters = Math.max(maxSimilarityToCenters, similarityMatrix[num][center]);
        }

        if (maxSimilarityToCenters < minSimilarity) {
          minSimilarity = maxSimilarityToCenters;
          bestCandidate = num;
        }
      }
    }

    if (bestCandidate) {
      clusterCenters.push(bestCandidate);
      used.add(bestCandidate);
    } else {
      break;
    }
  }

  // 將每個號碼分配到最近的聚類
  const clusters = {};
  clusterCenters.forEach((center, idx) => {
    clusters[idx] = [center];
  });

  for (let num = 1; num <= 49; num++) {
    if (!used.has(num)) {
      let bestCluster = 0;
      let maxSimilarity = -1;

      clusterCenters.forEach((center, idx) => {
        const similarity = similarityMatrix[num][center];
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestCluster = idx;
        }
      });

      clusters[bestCluster].push(num);
    }
  }

  // 分析最新一期的號碼屬於哪些聚類
  const latestPeriod = filtered[0];
  const latestNumbers = latestPeriod.numbers;
  const clusterFrequencies = {}; // 每個聚類在最新一期出現的號碼數

  for (let i = 0; i < numClusters; i++) {
    clusterFrequencies[i] = 0;
  }

  // 建立號碼到聚類的映射表
  const numberToCluster = {};
  for (let i = 0; i < numClusters; i++) {
    clusters[i].forEach(num => {
      numberToCluster[num] = i;
    });
  }

  latestNumbers.forEach(num => {
    const clusterId = numberToCluster[num];
    if (clusterId !== undefined) {
      clusterFrequencies[clusterId]++;
    }
  });

  // 計算每個號碼的分數
  // 如果號碼所在的聚類在最新一期出現較多，該聚類的其他號碼可能也會出現
  for (let num = 1; num <= 49; num++) {
    let score = 0;

    // 找到號碼所屬的聚類
    for (let i = 0; i < numClusters; i++) {
      if (clusters[i].includes(num)) {
        // 如果該聚類在最新一期有號碼出現，給予加分
        const clusterFreq = clusterFrequencies[i];
        if (clusterFreq > 0) {
          // 聚類中出現的號碼越多，分數越高
          score += clusterFreq * 15;
        }

        // 如果號碼與聚類中心的相似度高，給予加分
        const center = clusterCenters[i];
        if (center) {
          const similarity = similarityMatrix[num][center];
          score += similarity * 20;
        }
        break;
      }
    }

    clusterScore[num] = Math.min(100, score);
  }

  return {
    scores: clusterScore,
    clusters: clusters,
    clusterCenters: clusterCenters
  };
}

/**
 * 計算號碼球排列方式分數（基於號碼範圍分佈）
 * 將1-49分成5個範圍：1-10, 11-20, 21-30, 31-40, 41-49
 * 統計實際號碼的分佈，命中號碼最多的範圍裡的號碼就是高機率
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 號碼範圍分數
 */
function calculateNumberRangeScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const rangeScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    rangeScore[i] = 0;
  }

  // 定義5個號碼範圍
  const ranges = [
    { min: 1, max: 10, id: 0 },
    { min: 11, max: 20, id: 1 },
    { min: 21, max: 30, id: 2 },
    { min: 31, max: 40, id: 3 },
    { min: 41, max: 49, id: 4 }
  ];

  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);

  if (filtered.length === 0) {
    return { scores: rangeScore, rangeHits: {}, rangeStatistics: {} };
  }

  // 統計每個範圍在每期的命中次數
  const rangeHits = {}; // 記錄每期每個範圍的命中數
  const rangeTotalHits = {}; // 記錄每個範圍的總命中數

  // 初始化
  ranges.forEach(range => {
    rangeTotalHits[range.id] = 0;
  });

  // 統計每期的範圍分佈
  filtered.forEach((period, periodIndex) => {
    const periodRangeHits = {};
    ranges.forEach(range => {
      periodRangeHits[range.id] = 0;
    });

    // 統計該期每個範圍的命中數
    period.numbers.forEach(num => {
      if (num >= 1 && num <= 49) {
        for (const range of ranges) {
          if (num >= range.min && num <= range.max) {
            periodRangeHits[range.id]++;
            rangeTotalHits[range.id]++;
            break;
          }
        }
      }
    });

    // Consider: use `period.periodNumber` (or `period.date`) instead of index for easier debugging/UI mapping
    rangeHits[periodIndex] = periodRangeHits;
  });

  // 計算每個範圍的平均命中數和最近N期的命中趨勢
  const recentPeriods = Math.min(20, filtered.length); // 分析最近20期
  const recentRangeHits = {}; // 最近N期每個範圍的命中數
  const recentRangeMaxHits = {}; // 最近N期每個範圍的最大單期命中數

  ranges.forEach(range => {
    recentRangeHits[range.id] = 0;
    recentRangeMaxHits[range.id] = 0;
  });

  // 統計最近N期的範圍分佈
  for (let i = 0; i < recentPeriods; i++) {
    if (rangeHits[i]) {
      ranges.forEach(range => {
        const hits = rangeHits[i][range.id] || 0;
        recentRangeHits[range.id] += hits;
        recentRangeMaxHits[range.id] = Math.max(recentRangeMaxHits[range.id], hits);
      });
    }
  }

  // 找出最近N期命中最多的範圍（考慮總命中數和單期最大命中數）
  const rangeScores = {};
  ranges.forEach(range => {
    const avgHits = recentRangeHits[range.id] / recentPeriods;
    const maxHits = recentRangeMaxHits[range.id];
    // 綜合評分：平均命中數 * 0.6 + 最大單期命中數 * 0.4
    rangeScores[range.id] = avgHits * 0.6 + maxHits * 0.4;
  });

  // 找出得分最高的範圍（可能有多個）
  const maxScore = Math.max(...Object.values(rangeScores));

  // 如果 maxScore <= 0，topRanges 為空數組，否則找出高機率範圍
  const topRanges = maxScore > 0
    ? ranges.filter(range => {
      // 如果得分接近最高分（差距在10%以內），也視為高機率範圍
      return rangeScores[range.id] >= maxScore * 0.9;
    })
    : [];

  // 計算每個號碼的分數
  // 如果號碼屬於高機率範圍，給予高分
  for (let num = 1; num <= 49; num++) {
    for (const range of ranges) {
      if (num >= range.min && num <= range.max) {
        if (maxScore > 0) {
          // 如果該範圍是高機率範圍
          if (topRanges.some(r => r.id === range.id)) {
            // 根據該範圍的得分給予分數
            const rangeScoreValue = rangeScores[range.id];
            // 正規化到0-100範圍
            rangeScore[num] = Math.min(100, (rangeScoreValue / maxScore) * 100);
          } else {
            // 非高機率範圍，給予較低分數
            rangeScore[num] = Math.max(0, (rangeScores[range.id] / maxScore) * 50);
          }
        } else {
          // maxScore <= 0，無法正規化，設置為0
          rangeScore[num] = 0;
        }
        break;
      }
    }
  }

  // 計算範圍統計信息（始終填充，確保一致的響應形狀）
  const rangeStatistics = {};
  ranges.forEach(range => {
    rangeStatistics[range.id] = {
      range: `${range.min}-${range.max}`,
      totalHits: rangeTotalHits[range.id],
      averageHitsPerPeriod: Math.round((rangeTotalHits[range.id] / filtered.length) * 100) / 100,
      recentAverageHits: Math.round((recentRangeHits[range.id] / recentPeriods) * 100) / 100,
      recentMaxHits: recentRangeMaxHits[range.id],
      score: Math.round(rangeScores[range.id] * 100) / 100,
      isTopRange: topRanges.some(r => r.id === range.id)
    };
  });

  return {
    scores: rangeScore,
    rangeHits: rangeHits,
    rangeStatistics: rangeStatistics
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
  calculatePoissonScore,
  calculateCorrelationScore,
  calculateEntropyScore,
  calculateMarkovChainScore,
  calculateCombinatorialScore,
  calculateAutoregressiveScore,
  calculateSurvivalAnalysisScore,
  calculateExtremeValueScore,
  calculateClusterAnalysisScore,
  calculateNumberRangeScore
};
