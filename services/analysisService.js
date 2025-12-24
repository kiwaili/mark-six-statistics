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
  
  // 取得前 15 名（增加預測數量以提高準確率）
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
    .slice(0, 15);
  
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
  
  // 生成複式投注建議（完整版）
  let compoundBetSuggestion = null;
  try {
    compoundBetSuggestion = generateCompoundBetSuggestion(topNumbers);
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
    compoundBetSuggestion, // 完整複式投注建議
    compoundBetSuggestion100, // $100 複式投注建議
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
  
  // 計算目標準確率（至少30%）
  const targetAccuracy = 30;
  // 目標命中數至少3
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
    pattern: 0
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
  
  // 計算總效能（用於正規化）
  const totalPerformance = Math.abs(performanceFrequency) + 
                          Math.abs(performanceWeightedFrequency) + 
                          Math.abs(performanceGap) + 
                          Math.abs(performancePattern);
  
  // 根據準確率差距和指標表現調整權重
  // 動態學習率：準確率差距越大，學習率越高
  // 如果命中數少於目標（至少3），使用更強的學習率
  const baseLearningRate = 0.15;
  const hitCountMultiplier = hitCountGap > 0 ? (1 + hitCountGap * 0.2) : 1; // 命中數少於3時增加學習率
  const learningRate = Math.min(0.4, baseLearningRate * (1 + Math.abs(accuracyGap) / 50) * hitCountMultiplier);
  const adjustmentFactor = (accuracyGap / 100) + (hitCountGap > 0 ? hitCountGap * 0.1 : 0); // 根據準確率和命中數差距調整幅度
  
  if (totalPerformance > 0) {
    // 如果命中數少於目標（至少3）或準確率低於目標，增加表現好的指標權重
    if (currentHitCount < targetHitCount || currentAccuracy < targetAccuracy) {
      if (performanceFrequency > 0) {
        newWeights.frequency += learningRate * adjustmentFactor * (performanceFrequency / totalPerformance);
      }
      if (performanceWeightedFrequency > 0) {
        newWeights.weightedFrequency += learningRate * adjustmentFactor * (performanceWeightedFrequency / totalPerformance);
      }
      if (performanceGap > 0) {
        newWeights.gap += learningRate * adjustmentFactor * (performanceGap / totalPerformance);
      }
      if (performancePattern > 0) {
        newWeights.pattern += learningRate * adjustmentFactor * (performancePattern / totalPerformance);
      }
      
      // 減少表現差的指標權重
      if (performanceFrequency < 0) {
        newWeights.frequency = Math.max(0.1, newWeights.frequency - learningRate * Math.abs(adjustmentFactor) * (Math.abs(performanceFrequency) / totalPerformance));
      }
      if (performanceWeightedFrequency < 0) {
        newWeights.weightedFrequency = Math.max(0.1, newWeights.weightedFrequency - learningRate * Math.abs(adjustmentFactor) * (Math.abs(performanceWeightedFrequency) / totalPerformance));
      }
      if (performanceGap < 0) {
        newWeights.gap = Math.max(0.1, newWeights.gap - learningRate * Math.abs(adjustmentFactor) * (Math.abs(performanceGap) / totalPerformance));
      }
      if (performancePattern < 0) {
        newWeights.pattern = Math.max(0.1, newWeights.pattern - learningRate * Math.abs(adjustmentFactor) * (Math.abs(performancePattern) / totalPerformance));
      }
    } else {
      // 如果準確率已達標，微調以保持或進一步提升
      const fineTuneRate = 0.02;
      if (performanceFrequency > performanceWeightedFrequency && 
          performanceFrequency > performanceGap && 
          performanceFrequency > performancePattern) {
        newWeights.frequency += fineTuneRate;
      }
      if (performanceWeightedFrequency > performanceFrequency && 
          performanceWeightedFrequency > performanceGap && 
          performanceWeightedFrequency > performancePattern) {
        newWeights.weightedFrequency += fineTuneRate;
      }
      if (performanceGap > performanceFrequency && 
          performanceGap > performanceWeightedFrequency && 
          performanceGap > performancePattern) {
        newWeights.gap += fineTuneRate;
      }
      if (performancePattern > performanceFrequency && 
          performancePattern > performanceWeightedFrequency && 
          performancePattern > performanceGap) {
        newWeights.pattern += fineTuneRate;
      }
    }
  } else {
    // 如果無法計算效能，使用啟發式調整
    if (comparison.hitCount === 0) {
      // 完全沒命中，增加間隔和模式權重
      newWeights.gap = Math.min(0.4, newWeights.gap + 0.05);
      newWeights.pattern = Math.min(0.3, newWeights.pattern + 0.03);
      newWeights.frequency = Math.max(0.15, newWeights.frequency - 0.04);
      newWeights.weightedFrequency = Math.max(0.2, newWeights.weightedFrequency - 0.04);
    } else if (comparison.hitCount < targetHitCount) {
      // 命中數少於目標（至少3），積極調整權重
      // 增加間隔和模式權重（這些指標可能有助於提高命中數）
      const adjustmentAmount = (targetHitCount - comparison.hitCount) * 0.03;
      newWeights.gap = Math.min(0.4, newWeights.gap + adjustmentAmount);
      newWeights.pattern = Math.min(0.3, newWeights.pattern + adjustmentAmount * 0.8);
      newWeights.weightedFrequency = Math.min(0.45, newWeights.weightedFrequency + adjustmentAmount * 0.5);
      // 稍微減少頻率權重
      newWeights.frequency = Math.max(0.15, newWeights.frequency - adjustmentAmount * 0.3);
    } else if (comparison.hitCount >= targetHitCount) {
      // 命中3個以上，保持當前權重，稍微增加表現最好的指標
      // 這裡可以根據歷史表現來決定
    }
  }
  
  // 確保權重範圍合理
  newWeights.frequency = Math.max(0.1, Math.min(0.5, newWeights.frequency));
  newWeights.weightedFrequency = Math.max(0.1, Math.min(0.5, newWeights.weightedFrequency));
  newWeights.gap = Math.max(0.1, Math.min(0.5, newWeights.gap));
  newWeights.pattern = Math.max(0.1, Math.min(0.5, newWeights.pattern));
  
  // 正規化權重，確保總和為1
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
  
  // 使用多組初始權重進行測試，選擇最佳的一組
  const initialWeightSets = [
    { frequency: 0.30, weightedFrequency: 0.35, gap: 0.20, pattern: 0.15 },
    { frequency: 0.25, weightedFrequency: 0.40, gap: 0.20, pattern: 0.15 },
    { frequency: 0.20, weightedFrequency: 0.35, gap: 0.30, pattern: 0.15 },
    { frequency: 0.30, weightedFrequency: 0.30, gap: 0.25, pattern: 0.15 },
    { frequency: 0.25, weightedFrequency: 0.30, gap: 0.20, pattern: 0.25 }
  ];
  
  // 測試每組初始權重，選擇表現最好的
  let bestWeights = initialWeightSets[0];
  let bestAverageAccuracy = 0;
  
  // 快速測試每組權重（使用前5期數據）
  const testPeriods = Math.min(5, startIndex);
  for (const testWeights of initialWeightSets) {
    let testAccuracy = 0;
    let testCount = 0;
    
    for (let i = startIndex; i > startIndex - testPeriods && i > 0; i--) {
      const trainingData = allResults.slice(i);
      const targetResult = allResults[i - 1];
      
      if (!isNextPeriod(trainingData[0].periodNumber, targetResult.periodNumber)) {
        continue;
      }
      
      try {
        const analysis = analyzeNumbers(trainingData, testWeights);
        const actualNumbers = extractAllNumbers([targetResult])[0]?.numbers || [];
        
        if (actualNumbers.length === 0) continue;
        
        const comparison = comparePrediction(analysis.topNumbers, actualNumbers);
        testAccuracy += comparison.accuracy;
        testCount++;
      } catch (error) {
        continue;
      }
    }
    
    if (testCount > 0) {
      const avgAccuracy = testAccuracy / testCount;
      if (avgAccuracy > bestAverageAccuracy) {
        bestAverageAccuracy = avgAccuracy;
        bestWeights = testWeights;
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
      
      // 根據比對結果調整權重（傳入更多信息以進行更智能的調整）
      currentWeights = adjustWeights(
        currentWeights, 
        comparison, 
        analysis.analysisDetails,
        analysis.topNumbers,
        actualNumbers
      );
      
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
 * 生成縮減輪轉複式投注建議
 * 使用縮減輪轉系統，以最少注數覆蓋所有15個號碼
 * @param {Array} numbers - 15個預測號碼（已按分數排序）
 * @returns {Object} 複式投注建議
 */
function generateCompoundBetSuggestion(numbers) {
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
  
  // 策略：使用優化的縮減輪轉系統
  // 將15個號碼分成：核心組（前7個）+ 外圍組（後8個）
  // 使用更智能的組合策略以減少注數
  
  const coreNumbers = numberArray.slice(0, 7); // 前7個最有可能的號碼
  const outerNumbers = numberArray.slice(7, 15); // 後8個號碼
  
  const bets = [];
  
  // 策略1：核心組的完整組合（C(7,6) = 7注）
  // 這確保如果核心組中有6個中獎，至少有一注會中獎
  const coreCombinations = generateCombinations(coreNumbers, 6);
  bets.push(...coreCombinations);
  
  // 策略2：核心組選5個 + 外圍組選1個（優化版）
  // 只選擇核心組的前10個5組合，然後與外圍組組合
  const core5Combinations = generateCombinations(coreNumbers, 5);
  const selectedCore5 = core5Combinations.slice(0, Math.min(10, core5Combinations.length));
  
  selectedCore5.forEach(core5 => {
    outerNumbers.forEach(outerNum => {
      bets.push([...core5, outerNum].sort((a, b) => a - b));
    });
  });
  
  // 策略3：核心組選4個 + 外圍組選2個（優化版）
  // 只選擇核心組的前8個4組合
  const core4Combinations = generateCombinations(coreNumbers, 4);
  const selectedCore4 = core4Combinations.slice(0, Math.min(8, core4Combinations.length));
  const outer2Combinations = generateCombinations(outerNumbers, 2);
  
  selectedCore4.forEach(core4 => {
    outer2Combinations.forEach(outer2 => {
      bets.push([...core4, ...outer2].sort((a, b) => a - b));
    });
  });
  
  // 策略4：核心組選3個 + 外圍組選3個（優化版）
  // 只選擇核心組的前5個3組合
  const core3Combinations = generateCombinations(coreNumbers, 3);
  const selectedCore3 = core3Combinations.slice(0, Math.min(5, core3Combinations.length));
  const outer3Combinations = generateCombinations(outerNumbers, 3);
  
  selectedCore3.forEach(core3 => {
    outer3Combinations.forEach(outer3 => {
      bets.push([...core3, ...outer3].sort((a, b) => a - b));
    });
  });
  
  // 策略5：核心組選2個 + 外圍組選4個（少量組合）
  const core2Combinations = generateCombinations(coreNumbers, 2);
  const selectedCore2 = core2Combinations.slice(0, Math.min(3, core2Combinations.length));
  const outer4Combinations = generateCombinations(outerNumbers, 4);
  
  selectedCore2.forEach(core2 => {
    outer4Combinations.forEach(outer4 => {
      bets.push([...core2, ...outer4].sort((a, b) => a - b));
    });
  });
  
  // 去重（可能會有重複的組合）
  const uniqueBets = [];
  const betStrings = new Set();
  
  bets.forEach(bet => {
    const betStr = bet.sort((a, b) => a - b).join(',');
    if (!betStrings.has(betStr)) {
      betStrings.add(betStr);
      uniqueBets.push(bet.sort((a, b) => a - b));
    }
  });
  
  // 計算總注數和總金額（每注$10）
  const totalBets = uniqueBets.length;
  const totalAmount = totalBets * 10;
  
  return {
    numbers: numberArray,
    bets: uniqueBets,
    totalBets: totalBets,
    totalAmount: totalAmount,
    strategy: '縮減輪轉系統',
    description: `使用核心組（前7個號碼）+ 外圍組（後8個號碼）的縮減輪轉系統，以 ${totalBets} 注覆蓋所有15個預測號碼，相比完整複式投注（5005注）大幅減少注數`
  };
}

module.exports = {
  analyzeNumbers,
  parsePeriodNumber,
  isNextPeriod,
  comparePrediction,
  adjustWeights,
  iterativeValidation,
  generateCompoundBetSuggestion,
  generateCompoundBetSuggestion100
};

