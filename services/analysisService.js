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
 * @returns {Object} 分析結果
 */
function analyzeNumbers(results) {
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
  // 頻率: 30%, 加權頻率: 35%, 間隔: 20%, 模式: 15%
  const compositeScore = {};
  
  for (let i = 1; i <= 49; i++) {
    compositeScore[i] = 
      normalizedFrequency[i] * 0.30 +
      normalizedWeightedFrequency[i] * 0.35 +
      normalizedGapScore[i] * 0.20 +
      normalizedPatternScore[i] * 0.15;
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

module.exports = {
  analyzeNumbers
};

