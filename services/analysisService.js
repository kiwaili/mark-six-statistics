/**
 * 六合彩號碼分析服務（重構版）
 * 使用多種統計方法預測最有可能在下一期被抽中的號碼
 * 
 * 此文件已重構為使用模組化架構：
 * - utils.js: 工具函數（數據提取、期數解析）
 * - calculators.js: 統計計算函數
 * - fibonacci.js: 斐波那契數列分析
 * - selectionStrategies.js: 號碼選擇策略
 * - betting.js: 投注建議生成
 * - validation.js: 驗證和權重調整
 */

// 導入工具函數
const { extractAllNumbers, parsePeriodNumber, isNextPeriod } = require('./utils');

// 導入統計計算函數
const {
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
  calculateCombinatorialScore
} = require('./calculators');

// 導入斐波那契分析
const { calculateFibonacciScore } = require('./fibonacci');

// 導入選擇策略
const { selectOptimalNumbers, generateMultipleCandidates } = require('./selectionStrategies');

// 導入投注建議
const { generateCompoundBetSuggestions, generateCompoundBetSuggestion100 } = require('./betting');

// 導入驗證函數
const { comparePrediction, adjustWeights, iterativeValidation, setAnalyzeNumbers } = require('./validation');

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
  const fibonacciResult = calculateFibonacciScore(allNumbers, excludePeriodNumbers, filteredNumbers);
  
  // 計算新增的統計分析方法
  const correlationResult = calculateCorrelationScore(allNumbers, excludePeriodNumbers, filteredNumbers);
  const entropyResult = calculateEntropyScore(allNumbers, excludePeriodNumbers, filteredNumbers);
  const markovResult = calculateMarkovChainScore(allNumbers, excludePeriodNumbers, filteredNumbers);
  const combinatorialResult = calculateCombinatorialScore(allNumbers, excludePeriodNumbers, filteredNumbers);

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
  const normalizedFibonacciScore = normalize(fibonacciResult.scores);
  const normalizedCorrelationScore = normalize(correlationResult.scores);
  const normalizedEntropyScore = normalize(entropyResult.scores);
  const normalizedMarkovScore = normalize(markovResult.scores);
  const normalizedCombinatorialScore = normalize(combinatorialResult.scores);

  // 計算綜合分數（加權組合）
  // 優化權重分配以提高準確率：更重視趨勢和分布分析
  // 預設權重: 頻率: 8%, 加權頻率: 10%, 間隔: 10%, 模式: 6%, 分布: 10%, 趨勢: 9%, 卡方: 3%, 泊松: 3%, 斐波那契: 8%
  // 新增方法權重: 相關性: 8%, 熵: 6%, 馬可夫鏈: 10%, 組合數學: 9%
  // 注意：迭代驗證會根據實際表現動態調整所有權重。
  // 如果提供了自訂權重，則使用自訂權重
  const defaultWeights = {
    frequency: 0.08,
    weightedFrequency: 0.10,
    gap: 0.10,
    pattern: 0.06,
    distribution: 0.10,
    trend: 0.09,
    chiSquare: 0.03,
    poisson: 0.03,
    fibonacci: 0.08,
    correlation: 0.08,
    entropy: 0.06,
    markov: 0.10,
    combinatorial: 0.09
  };
  
  const finalWeights = {
    frequency: weights.frequency !== undefined ? weights.frequency : defaultWeights.frequency,
    weightedFrequency: weights.weightedFrequency !== undefined ? weights.weightedFrequency : defaultWeights.weightedFrequency,
    gap: weights.gap !== undefined ? weights.gap : defaultWeights.gap,
    pattern: weights.pattern !== undefined ? weights.pattern : defaultWeights.pattern,
    distribution: weights.distribution !== undefined ? weights.distribution : defaultWeights.distribution,
    trend: weights.trend !== undefined ? weights.trend : defaultWeights.trend,
    chiSquare: weights.chiSquare !== undefined ? weights.chiSquare : defaultWeights.chiSquare,
    poisson: weights.poisson !== undefined ? weights.poisson : defaultWeights.poisson,
    fibonacci: weights.fibonacci !== undefined ? weights.fibonacci : defaultWeights.fibonacci,
    correlation: weights.correlation !== undefined ? weights.correlation : defaultWeights.correlation,
    entropy: weights.entropy !== undefined ? weights.entropy : defaultWeights.entropy,
    markov: weights.markov !== undefined ? weights.markov : defaultWeights.markov,
    combinatorial: weights.combinatorial !== undefined ? weights.combinatorial : defaultWeights.combinatorial
  };
  
  // 正規化權重，確保總和為1
  const totalWeight = finalWeights.frequency + finalWeights.weightedFrequency + finalWeights.gap + 
                      finalWeights.pattern + finalWeights.distribution + finalWeights.trend + 
                      finalWeights.chiSquare + finalWeights.poisson + finalWeights.fibonacci +
                      finalWeights.correlation + finalWeights.entropy + finalWeights.markov + finalWeights.combinatorial;
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
      normalizedPoissonScore[i] * finalWeights.poisson +
      normalizedFibonacciScore[i] * finalWeights.fibonacci +
      normalizedCorrelationScore[i] * finalWeights.correlation +
      normalizedEntropyScore[i] * finalWeights.entropy +
      normalizedMarkovScore[i] * finalWeights.markov +
      normalizedCombinatorialScore[i] * finalWeights.combinatorial;
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
      poissonScore: Math.round(poissonResult.scores[num] * 100) / 100,
      fibonacciScore: Math.round(fibonacciResult.scores[num] * 100) / 100,
      correlationScore: Math.round(correlationResult.scores[num] * 100) / 100,
      entropyScore: Math.round(entropyResult.scores[num] * 100) / 100,
      markovScore: Math.round(markovResult.scores[num] * 100) / 100,
      combinatorialScore: Math.round(combinatorialResult.scores[num] * 100) / 100
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
  
  // 選擇最終的6個預測號碼（使用智能選擇策略）
  let predictedNumbers = null;
  let predictionStrategy = 'optimal';
  try {
    predictedNumbers = selectOptimalNumbers(topNumbers, 6, null);
    if (predictedNumbers && predictedNumbers.length > 0) {
      // 確定使用的策略
      const top6 = topNumbers.slice(0, 6).map(n => n.number).sort((a, b) => a - b);
      const predNums = predictedNumbers.map(n => n.number || n).sort((a, b) => a - b);
      if (JSON.stringify(predNums) === JSON.stringify(top6)) {
        predictionStrategy = 'top6';
      } else {
        predictionStrategy = 'optimal';
      }
    }
  } catch (error) {
    console.warn('選擇最終預測號碼失敗:', error.message);
    // 如果選擇失敗，使用前6個最高分作為備選
    predictedNumbers = topNumbers.slice(0, 6);
    predictionStrategy = 'top6';
  }
  
  return {
    topNumbers,
    stats,
    compoundBetSuggestions, // 複式投注建議（多個選項）
    compoundBetSuggestion100, // $100 複式投注建議
    predictedNumbers: predictedNumbers ? predictedNumbers.map(n => n.number || n).sort((a, b) => a - b) : null, // 最終預測的6個號碼
    predictionStrategy: predictionStrategy, // 使用的選擇策略
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
      },
      fibonacci: {
        scores: fibonacciResult.scores,
        fibonacciSequence: fibonacciResult.fibonacciSequence,
        goldenRatio: fibonacciResult.goldenRatio
      },
      correlation: {
        scores: correlationResult.scores,
        correlations: correlationResult.correlations
      },
      entropy: {
        scores: entropyResult.scores,
        overallEntropy: entropyResult.overallEntropy,
        maxEntropy: entropyResult.maxEntropy
      },
      markov: {
        scores: markovResult.scores,
        transitionMatrix: markovResult.transitionMatrix
      },
      combinatorial: {
        scores: combinatorialResult.scores,
        patterns: combinatorialResult.patterns
      }
    }
  };
}

// 設置 analyzeNumbers 到 validation 模組（解決循環依賴）
setAnalyzeNumbers(analyzeNumbers);

// 包裝 iterativeValidation 以確保 analyzeNumbers 已設置
const wrappedIterativeValidation = function(allResults, lookbackPeriods = 100) {
  return iterativeValidation(allResults, lookbackPeriods);
};

module.exports = {
  analyzeNumbers,
  parsePeriodNumber,
  isNextPeriod,
  comparePrediction,
  adjustWeights,
  iterativeValidation: wrappedIterativeValidation,
  generateCompoundBetSuggestions,
  generateCompoundBetSuggestion100,
  selectOptimalNumbers
};
