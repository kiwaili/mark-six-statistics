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
 * @returns {Object} 號碼頻率統計
 */
function calculateFrequency(allNumbers) {
  const frequency = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    frequency[i] = 0;
  }
  
  // 統計每個號碼出現的次數
  allNumbers.forEach(period => {
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
 * @returns {Object} 加權頻率統計
 */
function calculateWeightedFrequency(allNumbers) {
  const weightedFrequency = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    weightedFrequency[i] = 0;
  }
  
  // 計算總期數
  const totalPeriods = allNumbers.length;
  
  // 對每期號碼進行加權計算（越近期的權重越高）
  allNumbers.forEach((period, index) => {
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
 * @returns {Object} 號碼間隔統計
 */
function calculateGapAnalysis(allNumbers) {
  const lastAppearance = {};
  const gapScore = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    lastAppearance[i] = -1;
    gapScore[i] = 0;
  }
  
  // 從最新到最舊遍歷（因為 allNumbers 已經按日期排序，最新的在前）
  allNumbers.forEach((period, index) => {
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
    const gap = lastAppearance[num] === -1 ? allNumbers.length : lastAppearance[num];
    // 使用對數函數，讓間隔分數更平滑
    gapScore[numInt] = Math.log(gap + 1) * 10;
  });
  
  return gapScore;
}

/**
 * 計算號碼出現模式（連續出現、交替出現等）
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @returns {Object} 模式分數
 */
function calculatePatternScore(allNumbers) {
  const patternScore = {};
  
  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    patternScore[i] = 0;
  }
  
  // 檢查最近幾期的出現模式
  const recentPeriods = Math.min(10, allNumbers.length);
  
  for (let i = 0; i < recentPeriods; i++) {
    const period = allNumbers[i];
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
 * 分析並預測最有可能在下一期被抽中的號碼
 * @param {Array} results - 攪珠結果陣列
 * @param {Object} weights - 可選的權重參數 { frequency, weightedFrequency, gap, pattern }
 * @returns {Object} 分析結果
 */
function analyzeNumbers(results, weights = {}) {
  if (!results || results.length === 0) {
    throw new Error('沒有資料可供分析');
  }

  // 提取所有號碼
  const allNumbers = extractAllNumbers(results);

  if (allNumbers.length === 0) {
    throw new Error('無法從結果中提取號碼');
  }

  // 計算各種統計指標
  const frequency = calculateFrequency(allNumbers);
  const weightedFrequency = calculateWeightedFrequency(allNumbers);
  const gapScore = calculateGapAnalysis(allNumbers);
  const patternScore = calculatePatternScore(allNumbers);

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

  // 計算綜合分數（加權組合）
  // 預設權重: 頻率: 30%, 加權頻率: 35%, 間隔: 20%, 模式: 15%
  // 如果提供了自訂權重，則使用自訂權重
  const defaultWeights = {
    frequency: 0.30,
    weightedFrequency: 0.35,
    gap: 0.20,
    pattern: 0.15
  };
  
  const finalWeights = {
    frequency: weights.frequency !== undefined ? weights.frequency : defaultWeights.frequency,
    weightedFrequency: weights.weightedFrequency !== undefined ? weights.weightedFrequency : defaultWeights.weightedFrequency,
    gap: weights.gap !== undefined ? weights.gap : defaultWeights.gap,
    pattern: weights.pattern !== undefined ? weights.pattern : defaultWeights.pattern
  };
  
  // 正規化權重，確保總和為1
  const totalWeight = finalWeights.frequency + finalWeights.weightedFrequency + finalWeights.gap + finalWeights.pattern;
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
      normalizedPatternScore[i] * finalWeights.pattern;
  }
  
  // 取得前 10 名
  const topNumbers = Object.entries(compositeScore)
    .map(([num, score]) => ({
      number: parseInt(num, 10),
      score: Math.round(score * 100) / 100,
      frequency: frequency[num],
      weightedFrequency: Math.round(weightedFrequency[num] * 100) / 100,
      gapScore: Math.round(gapScore[num] * 100) / 100,
      patternScore: Math.round(patternScore[num] * 100) / 100
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  
  // 計算統計摘要
  const stats = {
    totalPeriods: allNumbers.length,
    totalNumbers: Object.values(frequency).reduce((sum, count) => sum + count, 0),
    averageFrequency: Object.values(frequency).reduce((sum, count) => sum + count, 0) / 49,
    mostFrequent: Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([num, count]) => ({ number: parseInt(num, 10), count }))
  };
  
  return {
    topNumbers,
    stats,
    analysisDetails: {
      frequency,
      weightedFrequency,
      gapScore,
      patternScore,
      compositeScore
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
  
  return {
    hitCount: hits.length,
    totalPredicted: predictedNumbers.length,
    totalActual: actualNumbers.length,
    hits: hits,
    misses: misses,
    predictedButNotActual: predictedButNotActual,
    accuracy: predictedNumbers.length > 0 ? (hits.length / predictedNumbers.length) * 100 : 0,
    coverage: actualNumbers.length > 0 ? (hits.length / actualNumbers.length) * 100 : 0
  };
}

/**
 * 根據比對結果調整權重
 * @param {Object} currentWeights - 當前權重
 * @param {Object} comparison - 比對結果
 * @param {Object} analysisDetails - 分析詳情
 * @returns {Object} 調整後的權重
 */
function adjustWeights(currentWeights, comparison, analysisDetails) {
  const newWeights = { ...currentWeights };
  
  // 如果預測準確率低，嘗試調整權重
  // 這裡使用簡單的啟發式方法：根據命中的號碼在各個指標中的表現來調整權重
  
  if (comparison.hitCount === 0) {
    // 如果完全沒命中，稍微增加間隔權重（因為可能號碼很久沒出現）
    newWeights.gap = Math.min(0.4, newWeights.gap + 0.05);
    newWeights.frequency = Math.max(0.2, newWeights.frequency - 0.02);
    newWeights.weightedFrequency = Math.max(0.25, newWeights.weightedFrequency - 0.02);
    newWeights.pattern = Math.max(0.1, newWeights.pattern - 0.01);
  } else if (comparison.hitCount >= 3) {
    // 如果命中3個或以上，保持當前權重或稍微調整
    // 可以根據命中的號碼在各指標中的排名來微調
  }
  
  // 正規化權重
  const totalWeight = newWeights.frequency + newWeights.weightedFrequency + newWeights.gap + newWeights.pattern;
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
  
  const validationResults = [];
  let currentWeights = {
    frequency: 0.30,
    weightedFrequency: 0.35,
    gap: 0.20,
    pattern: 0.15
  };
  
  // 從 startIndex 開始，逐步向前驗證
  for (let i = startIndex; i > 0; i--) {
    const trainingData = allResults.slice(i); // 從當前期數往前的所有資料
    const targetResult = allResults[i - 1]; // 要預測的下一期
    
    // 檢查是否為連續期數
    if (!isNextPeriod(trainingData[0].periodNumber, targetResult.periodNumber)) {
      continue; // 跳過不連續的期數
    }
    
    try {
      // 使用當前權重進行分析
      const analysis = analyzeNumbers(trainingData, currentWeights);
      
      // 提取實際號碼
      const actualNumbers = extractAllNumbers([targetResult])[0]?.numbers || [];
      
      if (actualNumbers.length === 0) {
        continue; // 跳過沒有號碼的結果
      }
      
      // 比對預測與實際結果
      const comparison = comparePrediction(analysis.topNumbers, actualNumbers);
      
      // 記錄驗證結果
      validationResults.push({
        trainingPeriod: trainingData[0].periodNumber,
        targetPeriod: targetResult.periodNumber,
        predictedNumbers: analysis.topNumbers.map(n => n.number),
        actualNumbers: actualNumbers,
        comparison: comparison,
        weights: { ...currentWeights }
      });
      
      // 根據比對結果調整權重
      currentWeights = adjustWeights(currentWeights, comparison, analysis.analysisDetails);
      
    } catch (error) {
      console.error(`驗證期數 ${targetResult.periodNumber} 時發生錯誤:`, error);
      continue;
    }
  }
  
  // 計算總體統計
  const totalValidations = validationResults.length;
  const totalHits = validationResults.reduce((sum, r) => sum + r.comparison.hitCount, 0);
  const averageAccuracy = totalValidations > 0 
    ? validationResults.reduce((sum, r) => sum + r.comparison.accuracy, 0) / totalValidations 
    : 0;
  const averageCoverage = totalValidations > 0
    ? validationResults.reduce((sum, r) => sum + r.comparison.coverage, 0) / totalValidations
    : 0;
  
  return {
    latestPeriod: latestPeriod,
    startPeriod: allResults[startIndex]?.periodNumber,
    totalValidations: totalValidations,
    validationResults: validationResults,
    finalWeights: currentWeights,
    statistics: {
      totalHits: totalHits,
      averageHitsPerPeriod: totalValidations > 0 ? totalHits / totalValidations : 0,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      averageCoverage: Math.round(averageCoverage * 100) / 100
    }
  };
}

module.exports = {
  analyzeNumbers,
  parsePeriodNumber,
  isNextPeriod,
  comparePrediction,
  adjustWeights,
  iterativeValidation
};

