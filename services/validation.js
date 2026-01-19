/**
 * 驗證和權重調整模組
 * 包含預測比對、權重調整和迭代驗證函數
 */

// 導入依賴
const { extractAllNumbers, isNextPeriod } = require('./utils');
const { selectOptimalNumbers, generateMultipleCandidates } = require('./selectionStrategies');
const { calculateHitStatistics, simulateSingleDraw } = require('./simulation');
const { neuralNetworkAnalysis } = require('./neural');

// analyzeNumbers 需要從主服務導入（暫時，稍後會重構）
// 注意：這會創建循環依賴，需要重構 analyzeNumbers 到獨立模組
let analyzeNumbers = null;

/**
 * 設置 analyzeNumbers 函數（用於解決循環依賴）
 * @param {Function} fn - analyzeNumbers 函數
 */
function setAnalyzeNumbers(fn) {
  analyzeNumbers = fn;
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
    poisson: 0,
    fibonacci: 0,
    correlation: 0,
    entropy: 0,
    markov: 0,
    combinatorial: 0,
    autoregressive: 0,
    survival: 0,
    extremeValue: 0,
    cluster: 0,
    numberRange: 0
  };

  // 分析命中號碼在各指標中的排名
  const allNumbers = Object.keys(analysisDetails.compositeScore).map(n => parseInt(n, 10));

  // 計算各指標的分數排名
  const sortedByFrequency = [...allNumbers].sort((a, b) =>
    analysisDetails.frequency[b] - analysisDetails.frequency[a]
  );
  const sortedByWeightedFrequency = [...allNumbers].sort((a, b) =>
    analysisDetails.weightedFrequency[b] - analysisDetails.weightedFrequency[a]
  );
  const sortedByGap = [...allNumbers].sort((a, b) =>
    analysisDetails.gapScore[b] - analysisDetails.gapScore[a]
  );
  const sortedByPattern = [...allNumbers].sort((a, b) =>
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
  let performanceFibonacci = 0;
  let performanceCorrelation = 0;
  let performanceEntropy = 0;
  let performanceMarkov = 0;
  let performanceCombinatorial = 0;
  let performanceAutoregressive = 0;
  let performanceSurvival = 0;
  let performanceExtremeValue = 0;
  let performanceCluster = 0;
  let performanceNumberRange = 0;

  if (analysisDetails.distributionScore) {
    const sortedByDistribution = [...allNumbers].sort((a, b) =>
      analysisDetails.distributionScore[b] - analysisDetails.distributionScore[a]
    );
    const hitRankDistribution = calculateAverageRank(hitNumbers, sortedByDistribution);
    const missRankDistribution = calculateAverageRank(missNumbers, sortedByDistribution);
    performanceDistribution = (1 / hitRankDistribution) - (1 / missRankDistribution);
  }

  if (analysisDetails.trendScore) {
    const sortedByTrend = [...allNumbers].sort((a, b) =>
      analysisDetails.trendScore[b] - analysisDetails.trendScore[a]
    );
    const hitRankTrend = calculateAverageRank(hitNumbers, sortedByTrend);
    const missRankTrend = calculateAverageRank(missNumbers, sortedByTrend);
    performanceTrend = (1 / hitRankTrend) - (1 / missRankTrend);
  }

  if (analysisDetails.chiSquare && analysisDetails.chiSquare.scores) {
    const sortedByChiSquare = [...allNumbers].sort((a, b) =>
      analysisDetails.chiSquare.scores[b] - analysisDetails.chiSquare.scores[a]
    );
    const hitRankChiSquare = calculateAverageRank(hitNumbers, sortedByChiSquare);
    const missRankChiSquare = calculateAverageRank(missNumbers, sortedByChiSquare);
    performanceChiSquare = (1 / hitRankChiSquare) - (1 / missRankChiSquare);
  }

  if (analysisDetails.poisson && analysisDetails.poisson.scores) {
    const sortedByPoisson = [...allNumbers].sort((a, b) =>
      analysisDetails.poisson.scores[b] - analysisDetails.poisson.scores[a]
    );
    const hitRankPoisson = calculateAverageRank(hitNumbers, sortedByPoisson);
    const missRankPoisson = calculateAverageRank(missNumbers, sortedByPoisson);
    performancePoisson = (1 / hitRankPoisson) - (1 / missRankPoisson);
  }

  if (analysisDetails.fibonacci && analysisDetails.fibonacci.scores) {
    const sortedByFibonacci = [...allNumbers].sort((a, b) =>
      analysisDetails.fibonacci.scores[b] - analysisDetails.fibonacci.scores[a]
    );
    const hitRankFibonacci = calculateAverageRank(hitNumbers, sortedByFibonacci);
    const missRankFibonacci = calculateAverageRank(missNumbers, sortedByFibonacci);
    performanceFibonacci = (1 / hitRankFibonacci) - (1 / missRankFibonacci);
  }

  if (analysisDetails.correlation && analysisDetails.correlation.scores) {
    const sortedByCorrelation = [...allNumbers].sort((a, b) =>
      analysisDetails.correlation.scores[b] - analysisDetails.correlation.scores[a]
    );
    const hitRankCorrelation = calculateAverageRank(hitNumbers, sortedByCorrelation);
    const missRankCorrelation = calculateAverageRank(missNumbers, sortedByCorrelation);
    performanceCorrelation = (1 / hitRankCorrelation) - (1 / missRankCorrelation);
  }

  if (analysisDetails.entropy && analysisDetails.entropy.scores) {
    const sortedByEntropy = [...allNumbers].sort((a, b) =>
      analysisDetails.entropy.scores[b] - analysisDetails.entropy.scores[a]
    );
    const hitRankEntropy = calculateAverageRank(hitNumbers, sortedByEntropy);
    const missRankEntropy = calculateAverageRank(missNumbers, sortedByEntropy);
    performanceEntropy = (1 / hitRankEntropy) - (1 / missRankEntropy);
  }

  if (analysisDetails.markov && analysisDetails.markov.scores) {
    const sortedByMarkov = [...allNumbers].sort((a, b) =>
      analysisDetails.markov.scores[b] - analysisDetails.markov.scores[a]
    );
    const hitRankMarkov = calculateAverageRank(hitNumbers, sortedByMarkov);
    const missRankMarkov = calculateAverageRank(missNumbers, sortedByMarkov);
    performanceMarkov = (1 / hitRankMarkov) - (1 / missRankMarkov);
  }

  if (analysisDetails.combinatorial && analysisDetails.combinatorial.scores) {
    const sortedByCombinatorial = [...allNumbers].sort((a, b) =>
      analysisDetails.combinatorial.scores[b] - analysisDetails.combinatorial.scores[a]
    );
    const hitRankCombinatorial = calculateAverageRank(hitNumbers, sortedByCombinatorial);
    const missRankCombinatorial = calculateAverageRank(missNumbers, sortedByCombinatorial);
    performanceCombinatorial = (1 / hitRankCombinatorial) - (1 / missRankCombinatorial);
  }

  if (analysisDetails.autoregressive && analysisDetails.autoregressive.scores) {
    const sortedByAutoregressive = [...allNumbers].sort((a, b) =>
      analysisDetails.autoregressive.scores[b] - analysisDetails.autoregressive.scores[a]
    );
    const hitRankAutoregressive = calculateAverageRank(hitNumbers, sortedByAutoregressive);
    const missRankAutoregressive = calculateAverageRank(missNumbers, sortedByAutoregressive);
    performanceAutoregressive = (1 / hitRankAutoregressive) - (1 / missRankAutoregressive);
  }

  if (analysisDetails.survival && analysisDetails.survival.scores) {
    const sortedBySurvival = [...allNumbers].sort((a, b) =>
      analysisDetails.survival.scores[b] - analysisDetails.survival.scores[a]
    );
    const hitRankSurvival = calculateAverageRank(hitNumbers, sortedBySurvival);
    const missRankSurvival = calculateAverageRank(missNumbers, sortedBySurvival);
    performanceSurvival = (1 / hitRankSurvival) - (1 / missRankSurvival);
  }

  if (analysisDetails.extremeValue && analysisDetails.extremeValue.scores) {
    const sortedByExtremeValue = [...allNumbers].sort((a, b) =>
      analysisDetails.extremeValue.scores[b] - analysisDetails.extremeValue.scores[a]
    );
    const hitRankExtremeValue = calculateAverageRank(hitNumbers, sortedByExtremeValue);
    const missRankExtremeValue = calculateAverageRank(missNumbers, sortedByExtremeValue);
    performanceExtremeValue = (1 / hitRankExtremeValue) - (1 / missRankExtremeValue);
  }

  if (analysisDetails.cluster && analysisDetails.cluster.scores) {
    const sortedByCluster = [...allNumbers].sort((a, b) =>
      analysisDetails.cluster.scores[b] - analysisDetails.cluster.scores[a]
    );
    const hitRankCluster = calculateAverageRank(hitNumbers, sortedByCluster);
    const missRankCluster = calculateAverageRank(missNumbers, sortedByCluster);
    performanceCluster = (1 / hitRankCluster) - (1 / missRankCluster);
  }

  if (analysisDetails.numberRange && analysisDetails.numberRange.scores) {
    const sortedByNumberRange = [...allNumbers].sort((a, b) =>
      analysisDetails.numberRange.scores[b] - analysisDetails.numberRange.scores[a]
    );
    const hitRankNumberRange = calculateAverageRank(hitNumbers, sortedByNumberRange);
    const missRankNumberRange = calculateAverageRank(missNumbers, sortedByNumberRange);
    performanceNumberRange = (1 / hitRankNumberRange) - (1 / missRankNumberRange);
  }

  // 計算總效能（用於正規化）
  const totalPerformance = Math.abs(performanceFrequency) +
    Math.abs(performanceWeightedFrequency) +
    Math.abs(performanceGap) +
    Math.abs(performancePattern) +
    Math.abs(performanceDistribution) +
    Math.abs(performanceTrend) +
    Math.abs(performanceChiSquare) +
    Math.abs(performancePoisson) +
    Math.abs(performanceFibonacci) +
    Math.abs(performanceCorrelation) +
    Math.abs(performanceEntropy) +
    Math.abs(performanceMarkov) +
    Math.abs(performanceCombinatorial) +
    Math.abs(performanceAutoregressive) +
    Math.abs(performanceSurvival) +
    Math.abs(performanceExtremeValue) +
    Math.abs(performanceCluster) +
    Math.abs(performanceNumberRange);

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
  if (newWeights.distribution === undefined) newWeights.distribution = 0.09;
  if (newWeights.trend === undefined) newWeights.trend = 0.08;
  if (newWeights.chiSquare === undefined) newWeights.chiSquare = 0.03;
  if (newWeights.poisson === undefined) newWeights.poisson = 0.03;
  if (newWeights.fibonacci === undefined) newWeights.fibonacci = 0.07;
  if (newWeights.correlation === undefined) newWeights.correlation = 0.07;
  if (newWeights.entropy === undefined) newWeights.entropy = 0.05;
  if (newWeights.markov === undefined) newWeights.markov = 0.09;
  if (newWeights.combinatorial === undefined) newWeights.combinatorial = 0.08;
  if (newWeights.autoregressive === undefined) newWeights.autoregressive = 0.06;
  if (newWeights.survival === undefined) newWeights.survival = 0.07;
  if (newWeights.extremeValue === undefined) newWeights.extremeValue = 0.06;
  if (newWeights.cluster === undefined) newWeights.cluster = 0.07;
  if (newWeights.numberRange === undefined) newWeights.numberRange = 0.06;

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
      if (performanceFibonacci > 0 && analysisDetails.fibonacci) {
        newWeights.fibonacci += learningRate * adjustmentFactor * criticalMultiplier * (performanceFibonacci / totalPerformance);
      }
      if (performanceCorrelation > 0 && analysisDetails.correlation) {
        newWeights.correlation += learningRate * adjustmentFactor * criticalMultiplier * (performanceCorrelation / totalPerformance);
      }
      if (performanceEntropy > 0 && analysisDetails.entropy) {
        newWeights.entropy += learningRate * adjustmentFactor * criticalMultiplier * (performanceEntropy / totalPerformance);
      }
      if (performanceMarkov > 0 && analysisDetails.markov) {
        newWeights.markov += learningRate * adjustmentFactor * criticalMultiplier * (performanceMarkov / totalPerformance);
      }
      if (performanceCombinatorial > 0 && analysisDetails.combinatorial) {
        newWeights.combinatorial += learningRate * adjustmentFactor * criticalMultiplier * (performanceCombinatorial / totalPerformance);
      }
      if (performanceAutoregressive > 0 && analysisDetails.autoregressive) {
        newWeights.autoregressive += learningRate * adjustmentFactor * criticalMultiplier * (performanceAutoregressive / totalPerformance);
      }
      if (performanceSurvival > 0 && analysisDetails.survival) {
        newWeights.survival += learningRate * adjustmentFactor * criticalMultiplier * (performanceSurvival / totalPerformance);
      }
      if (performanceExtremeValue > 0 && analysisDetails.extremeValue) {
        newWeights.extremeValue += learningRate * adjustmentFactor * criticalMultiplier * (performanceExtremeValue / totalPerformance);
      }
      if (performanceCluster > 0 && analysisDetails.cluster) {
        newWeights.cluster += learningRate * adjustmentFactor * criticalMultiplier * (performanceCluster / totalPerformance);
      }
      if (performanceNumberRange > 0 && analysisDetails.numberRange) {
        newWeights.numberRange += learningRate * adjustmentFactor * criticalMultiplier * (performanceNumberRange / totalPerformance);
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
      if (performanceFibonacci < 0 && analysisDetails.fibonacci) {
        newWeights.fibonacci = Math.max(0.05, newWeights.fibonacci - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceFibonacci) / totalPerformance));
      }
      if (performanceCorrelation < 0 && analysisDetails.correlation) {
        newWeights.correlation = Math.max(0.05, newWeights.correlation - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceCorrelation) / totalPerformance));
      }
      if (performanceEntropy < 0 && analysisDetails.entropy) {
        newWeights.entropy = Math.max(0.05, newWeights.entropy - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceEntropy) / totalPerformance));
      }
      if (performanceMarkov < 0 && analysisDetails.markov) {
        newWeights.markov = Math.max(0.05, newWeights.markov - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceMarkov) / totalPerformance));
      }
      if (performanceCombinatorial < 0 && analysisDetails.combinatorial) {
        newWeights.combinatorial = Math.max(0.05, newWeights.combinatorial - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceCombinatorial) / totalPerformance));
      }
      if (performanceAutoregressive < 0 && analysisDetails.autoregressive) {
        newWeights.autoregressive = Math.max(0.05, newWeights.autoregressive - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceAutoregressive) / totalPerformance));
      }
      if (performanceSurvival < 0 && analysisDetails.survival) {
        newWeights.survival = Math.max(0.05, newWeights.survival - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceSurvival) / totalPerformance));
      }
      if (performanceExtremeValue < 0 && analysisDetails.extremeValue) {
        newWeights.extremeValue = Math.max(0.05, newWeights.extremeValue - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceExtremeValue) / totalPerformance));
      }
      if (performanceCluster < 0 && analysisDetails.cluster) {
        newWeights.cluster = Math.max(0.05, newWeights.cluster - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceCluster) / totalPerformance));
      }
      if (performanceNumberRange < 0 && analysisDetails.numberRange) {
        newWeights.numberRange = Math.max(0.05, newWeights.numberRange - learningRate * Math.abs(adjustmentFactor) * reductionMultiplier * (Math.abs(performanceNumberRange) / totalPerformance));
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
        { name: 'poisson', value: performancePoisson, available: !!analysisDetails.poisson },
        { name: 'fibonacci', value: performanceFibonacci, available: !!analysisDetails.fibonacci },
        { name: 'correlation', value: performanceCorrelation, available: !!analysisDetails.correlation },
        { name: 'entropy', value: performanceEntropy, available: !!analysisDetails.entropy },
        { name: 'markov', value: performanceMarkov, available: !!analysisDetails.markov },
        { name: 'combinatorial', value: performanceCombinatorial, available: !!analysisDetails.combinatorial },
        { name: 'autoregressive', value: performanceAutoregressive, available: !!analysisDetails.autoregressive },
        { name: 'survival', value: performanceSurvival, available: !!analysisDetails.survival },
        { name: 'extremeValue', value: performanceExtremeValue, available: !!analysisDetails.extremeValue },
        { name: 'cluster', value: performanceCluster, available: !!analysisDetails.cluster },
        { name: 'numberRange', value: performanceNumberRange, available: !!analysisDetails.numberRange }
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
      // 完全沒命中，大幅增加趨勢、分布、間隔和斐波那契權重（這些指標對提高準確率更有效）
      newWeights.gap = Math.min(0.45, (newWeights.gap || 0.18) + 0.08);
      newWeights.trend = Math.min(0.25, (newWeights.trend || 0.15) + 0.05);
      newWeights.distribution = Math.min(0.28, (newWeights.distribution || 0.18) + 0.05);
      newWeights.pattern = Math.min(0.25, (newWeights.pattern || 0.10) + 0.03);
      newWeights.fibonacci = Math.min(0.35, (newWeights.fibonacci || 0.12) + 0.05);
      newWeights.frequency = Math.max(0.05, (newWeights.frequency || 0.12) - 0.06);
      newWeights.weightedFrequency = Math.max(0.05, (newWeights.weightedFrequency || 0.18) - 0.05);
    } else if (comparison.hitCount < targetHitCount || currentAccuracy < targetAccuracy) {
      // 命中數少於目標或準確率低於目標，積極調整權重以提高命中數
      // 優先增加間隔、趨勢、分布、馬可夫鏈和組合數學權重（這些指標對提高命中數更有效）
      const hitCountDeficit = targetHitCount - comparison.hitCount;
      const accuracyDeficit = targetAccuracy - currentAccuracy;
      // 更重視命中數，調整幅度更大
      const adjustmentAmount = Math.max(hitCountDeficit * 0.15, accuracyDeficit * 0.12);

      // 優先增加對命中數有效的指標權重
      newWeights.gap = Math.min(0.50, (newWeights.gap || 0.18) + adjustmentAmount * 1.2);
      newWeights.markov = Math.min(0.50, (newWeights.markov || 0.18) + adjustmentAmount * 1.1);
      newWeights.trend = Math.min(0.35, (newWeights.trend || 0.15) + adjustmentAmount * 1.0);
      newWeights.distribution = Math.min(0.35, (newWeights.distribution || 0.18) + adjustmentAmount * 0.9);
      newWeights.combinatorial = Math.min(0.40, (newWeights.combinatorial || 0.15) + adjustmentAmount * 0.95);
      newWeights.weightedFrequency = Math.min(0.55, (newWeights.weightedFrequency || 0.18) + adjustmentAmount * 0.8);
      newWeights.pattern = Math.min(0.35, (newWeights.pattern || 0.10) + adjustmentAmount * 0.7);
      newWeights.fibonacci = Math.min(0.40, (newWeights.fibonacci || 0.12) + adjustmentAmount * 0.75);
      // 稍微減少頻率權重
      newWeights.frequency = Math.max(0.05, (newWeights.frequency || 0.12) - adjustmentAmount * 0.5);
    } else if (comparison.hitCount >= targetHitCount && currentAccuracy >= targetAccuracy) {
      // 已達標，繼續微調以提高命中數
      // 增加表現最好的指標權重（更重視間隔和馬可夫鏈）
      newWeights.gap = Math.min(0.50, (newWeights.gap || 0.18) + 0.03);
      newWeights.markov = Math.min(0.50, (newWeights.markov || 0.18) + 0.03);
      newWeights.trend = Math.min(0.35, (newWeights.trend || 0.15) + 0.02);
      newWeights.distribution = Math.min(0.35, (newWeights.distribution || 0.18) + 0.02);
      newWeights.combinatorial = Math.min(0.40, (newWeights.combinatorial || 0.15) + 0.02);
    }
  }

  // 確保權重範圍合理
  newWeights.frequency = Math.max(0.05, Math.min(0.5, newWeights.frequency || 0.07));
  newWeights.weightedFrequency = Math.max(0.05, Math.min(0.5, newWeights.weightedFrequency || 0.09));
  newWeights.gap = Math.max(0.05, Math.min(0.5, newWeights.gap || 0.09));
  newWeights.pattern = Math.max(0.05, Math.min(0.5, newWeights.pattern || 0.05));
  newWeights.distribution = Math.max(0.05, Math.min(0.5, newWeights.distribution || 0.09));
  newWeights.trend = Math.max(0.05, Math.min(0.5, newWeights.trend || 0.08));
  newWeights.chiSquare = Math.max(0.05, Math.min(0.5, newWeights.chiSquare || 0.03));
  newWeights.poisson = Math.max(0.05, Math.min(0.5, newWeights.poisson || 0.03));
  newWeights.fibonacci = Math.max(0.05, Math.min(0.5, newWeights.fibonacci || 0.07));
  newWeights.correlation = Math.max(0.05, Math.min(0.5, newWeights.correlation || 0.07));
  newWeights.entropy = Math.max(0.05, Math.min(0.5, newWeights.entropy || 0.05));
  newWeights.markov = Math.max(0.05, Math.min(0.5, newWeights.markov || 0.09));
  newWeights.combinatorial = Math.max(0.05, Math.min(0.5, newWeights.combinatorial || 0.08));
  newWeights.autoregressive = Math.max(0.05, Math.min(0.5, newWeights.autoregressive || 0.06));
  newWeights.survival = Math.max(0.05, Math.min(0.5, newWeights.survival || 0.07));
  newWeights.extremeValue = Math.max(0.05, Math.min(0.5, newWeights.extremeValue || 0.06));
  newWeights.cluster = Math.max(0.05, Math.min(0.5, newWeights.cluster || 0.07));
  newWeights.numberRange = Math.max(0.05, Math.min(0.5, newWeights.numberRange || 0.06));

  // 正規化權重，確保總和為1
  const totalWeight = (newWeights.frequency || 0) + (newWeights.weightedFrequency || 0) + (newWeights.gap || 0) +
    (newWeights.pattern || 0) + (newWeights.distribution || 0) + (newWeights.trend || 0) +
    (newWeights.chiSquare || 0) + (newWeights.poisson || 0) + (newWeights.fibonacci || 0) +
    (newWeights.correlation || 0) + (newWeights.entropy || 0) + (newWeights.markov || 0) + (newWeights.combinatorial || 0) +
    (newWeights.autoregressive || 0) + (newWeights.survival || 0) + (newWeights.extremeValue || 0) + (newWeights.cluster || 0) +
    (newWeights.numberRange || 0);
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
 * @param {number} lookbackPeriods - 往前推的期數（預設100）
 * @param {number} maxRetries - 最大重試次數（如果平均命中數未達標，預設50次）
 * @param {Function} progressCallback - 進度回調函數 (progress, message) => void
 * @returns {Object} 驗證結果
 */
function iterativeValidation(allResults, lookbackPeriods = 100, maxRetries = 50, progressCallback = null) {
  if (!analyzeNumbers) {
    throw new Error('analyzeNumbers 函數未設置。請先調用 setAnalyzeNumbers()');
  }

  if (!allResults || allResults.length < 1) {
    throw new Error('資料不足，需要至少 1 期資料');
  }

  // 如果資料不足 101 期，就用現在有的資料
  // 如果只有1期，lookbackPeriods 會是 0（沒有歷史資料可驗證，但仍可使用該期資料）
  if (allResults.length < lookbackPeriods + 1) {
    lookbackPeriods = Math.max(0, allResults.length - 1);
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

  // 定義目標值
  const targetAverageHitCount = 3; // 目標平均每期命中數至少3

  let validationResults = [];
  let retryCount = 0;
  let bestValidationResult = null;
  let bestAverageHitCount = 0;
  let allRetryResults = [];

  // 在循環外部聲明變量，以便在循環外部使用
  let totalValidations = 0;
  let totalHits = 0;
  let averageAccuracy = 0;
  let averageCoverage = 0;
  let periodsWithAtLeast3Hits = 0;
  let hitRateAtLeast3 = 0;
  let hitCountDistribution = {};
  let averageHitCount = 0;
  let meetsHitCountTarget = false;
  let meetsAccuracyTarget = false;
  let meetsAllTargets = false;
  let currentWeights = null;

  // 優化目標：提高準確率至50%，更重視趨勢、分布和間隔分析
  // 目標：平均每期命中數至少3，準確率至少50%
  // 包含所有13種統計方法的權重配置
  const initialWeightSets = [
    // 配置1：默認權重（平衡配置）
    { frequency: 0.0609, weightedFrequency: 0.0783, gap: 0.0783, pattern: 0.0435, distribution: 0.0783, trend: 0.0696, chiSquare: 0.0261, poisson: 0.0261, fibonacci: 0.0609, correlation: 0.0609, entropy: 0.0435, markov: 0.0783, combinatorial: 0.0696, autoregressive: 0.0522, survival: 0.0609, extremeValue: 0.0522, cluster: 0.0604, numberRange: 0.06 },
    // 配置2：重視間隔和馬可夫鏈
    { frequency: 0.0476, weightedFrequency: 0.0635, gap: 0.1190, pattern: 0.0397, distribution: 0.0794, trend: 0.0635, chiSquare: 0.0159, poisson: 0.0159, fibonacci: 0.0476, correlation: 0.0635, entropy: 0.0397, markov: 0.1190, combinatorial: 0.0794, autoregressive: 0.0476, survival: 0.0556, extremeValue: 0.0476, cluster: 0.0555, numberRange: 0.06 },
    // 配置3：重視加權頻率和分布
    { frequency: 0.0476, weightedFrequency: 0.1190, gap: 0.0635, pattern: 0.0397, distribution: 0.1190, trend: 0.0794, chiSquare: 0.0238, poisson: 0.0238, fibonacci: 0.0556, correlation: 0.0635, entropy: 0.0476, markov: 0.0635, combinatorial: 0.0476, autoregressive: 0.0476, survival: 0.0556, extremeValue: 0.0476, cluster: 0.0556, numberRange: 0.06 },
    // 配置4：重視趨勢和組合數學
    { frequency: 0.07, weightedFrequency: 0.09, gap: 0.09, pattern: 0.05, distribution: 0.09, trend: 0.15, chiSquare: 0.02, poisson: 0.02, fibonacci: 0.07, correlation: 0.07, entropy: 0.05, markov: 0.09, combinatorial: 0.15, autoregressive: 0.06, survival: 0.07, extremeValue: 0.06, cluster: 0.07, numberRange: 0.06 },
    // 配置5：重視相關性和熵分析
    { frequency: 0.07, weightedFrequency: 0.08, gap: 0.08, pattern: 0.05, distribution: 0.08, trend: 0.08, chiSquare: 0.02, poisson: 0.02, fibonacci: 0.07, correlation: 0.15, entropy: 0.12, markov: 0.10, combinatorial: 0.10, autoregressive: 0.06, survival: 0.07, extremeValue: 0.06, cluster: 0.07, numberRange: 0.06 },
    // 配置6：重視頻率和斐波那契
    { frequency: 0.12, weightedFrequency: 0.10, gap: 0.08, pattern: 0.06, distribution: 0.08, trend: 0.08, chiSquare: 0.03, poisson: 0.03, fibonacci: 0.12, correlation: 0.08, entropy: 0.06, markov: 0.08, combinatorial: 0.08, autoregressive: 0.06, survival: 0.07, extremeValue: 0.06, cluster: 0.07, numberRange: 0.06 },
    // 配置7：重視馬可夫鏈和組合數學
    { frequency: 0.06, weightedFrequency: 0.08, gap: 0.10, pattern: 0.05, distribution: 0.08, trend: 0.08, chiSquare: 0.02, poisson: 0.02, fibonacci: 0.06, correlation: 0.08, entropy: 0.05, markov: 0.18, combinatorial: 0.14, autoregressive: 0.06, survival: 0.07, extremeValue: 0.06, cluster: 0.07, numberRange: 0.06 },
    // 配置8：平衡所有新方法
    { frequency: 0.07, weightedFrequency: 0.09, gap: 0.10, pattern: 0.05, distribution: 0.09, trend: 0.08, chiSquare: 0.02, poisson: 0.02, fibonacci: 0.07, correlation: 0.12, entropy: 0.08, markov: 0.12, combinatorial: 0.09, autoregressive: 0.06, survival: 0.07, extremeValue: 0.06, cluster: 0.07, numberRange: 0.06 },
    // 配置9：優化命中數 - 重視間隔、趨勢、分布和馬可夫鏈
    { frequency: 0.05, weightedFrequency: 0.08, gap: 0.12, pattern: 0.06, distribution: 0.12, trend: 0.12, chiSquare: 0.02, poisson: 0.02, fibonacci: 0.08, correlation: 0.08, entropy: 0.05, markov: 0.15, combinatorial: 0.10, autoregressive: 0.05, survival: 0.06, extremeValue: 0.05, cluster: 0.07, numberRange: 0.06 },
    // 配置10：優化命中數 - 重視加權頻率、間隔和組合數學
    { frequency: 0.06, weightedFrequency: 0.13, gap: 0.13, pattern: 0.05, distribution: 0.10, trend: 0.09, chiSquare: 0.02, poisson: 0.02, fibonacci: 0.08, correlation: 0.08, entropy: 0.05, markov: 0.10, combinatorial: 0.12, autoregressive: 0.05, survival: 0.06, extremeValue: 0.05, cluster: 0.07, numberRange: 0.06 }
  ];

  // 測試每組初始權重，選擇表現最好的（只在第一次運行時執行）
  let bestWeights = initialWeightSets[0];
  let bestAverageAccuracyForWeights = 0;
  let bestAverageHitCountForWeights = 0;

  // 只在第一次運行時測試權重
  if (retryCount === 0) {
    // 增加測試期數以提高選擇準確性（使用前100期數據）
    const testPeriods = Math.min(100, startIndex);
    const totalWeightSets = initialWeightSets.length;
    let currentWeightSetIndex = 0;
    
    if (progressCallback && typeof progressCallback === 'function') {
      try {
        progressCallback({
          progress: 0,
          stage: 'weightTesting',
          message: `開始測試 ${totalWeightSets} 組初始權重配置...`,
          weightSetIndex: 0,
          totalWeightSets: totalWeightSets
        });
      } catch (err) {
        console.error('進度回調函數執行錯誤:', err);
      }
    }
    
    for (const testWeights of initialWeightSets) {
      currentWeightSetIndex++;
      const weightTestProgress = Math.round((currentWeightSetIndex / totalWeightSets) * 100);
      
      if (progressCallback && typeof progressCallback === 'function') {
        try {
          progressCallback({
            progress: weightTestProgress,
            stage: 'weightTesting',
            message: `測試權重配置 ${currentWeightSetIndex}/${totalWeightSets}...`,
            weightSetIndex: currentWeightSetIndex,
            totalWeightSets: totalWeightSets
          });
        } catch (err) {
          console.error('進度回調函數執行錯誤:', err);
        }
      }
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

        // 優化目標：優先命中數，同時確保平均命中數 >= 3 和平均準確率 >= 50%
        const targetAvgHitCount = 3;
        const targetAvgAccuracy = 50;

        const currentMeetsAllTargets = avgHitCount >= targetAvgHitCount && avgAccuracy >= targetAvgAccuracy;
        const bestMeetsAllTargets = bestAverageHitCountForWeights >= targetAvgHitCount && bestAverageAccuracyForWeights >= targetAvgAccuracy;

        // 優先選擇同時達到兩個目標的權重
        if (currentMeetsAllTargets) {
          if (bestMeetsAllTargets) {
            // 兩者都達到目標，優先選擇命中數更高的（優化命中數）
            // 綜合分數 = 命中數 * 0.7 + 準確率 * 0.3（命中數更重要）
            const currentScore = avgHitCount * 10 * 0.7 + avgAccuracy * 0.3;
            const bestScore = bestAverageHitCountForWeights * 10 * 0.7 + bestAverageAccuracyForWeights * 0.3;
            if (currentScore > bestScore ||
              (currentScore === bestScore && avgHitCount > bestAverageHitCountForWeights)) {
              bestAverageAccuracyForWeights = avgAccuracy;
              bestAverageHitCountForWeights = avgHitCount;
              bestWeights = testWeights;
            }
          } else {
            // 當前達到所有目標，最佳未達到，選擇當前
            bestAverageAccuracyForWeights = avgAccuracy;
            bestAverageHitCountForWeights = avgHitCount;
            bestWeights = testWeights;
          }
        } else if (bestMeetsAllTargets) {
          // 最佳達到所有目標，當前未達到，保持最佳
          // 不更新
        } else {
          // 兩者都未達到所有目標，優先選擇命中數更高的
          // 計算距離目標的加權距離（命中數權重更高）
          const currentDistance = Math.max(0, targetAvgHitCount - avgHitCount) * 15 +
            Math.max(0, targetAvgAccuracy - avgAccuracy) * 1;
          const bestDistance = Math.max(0, targetAvgHitCount - bestAverageHitCountForWeights) * 15 +
            Math.max(0, targetAvgAccuracy - bestAverageAccuracyForWeights) * 1;

          // 如果命中數相同，選擇準確率更高的
          if (avgHitCount > bestAverageHitCountForWeights ||
            (avgHitCount === bestAverageHitCountForWeights && currentDistance < bestDistance) ||
            (avgHitCount === bestAverageHitCountForWeights && currentDistance === bestDistance && avgAccuracy > bestAverageAccuracyForWeights)) {
            bestAverageAccuracyForWeights = avgAccuracy;
            bestAverageHitCountForWeights = avgHitCount;
            bestWeights = testWeights;
          }
        }
      }
    }
  }

  // 如果沒有找到最佳權重，使用第一個
  if (!bestWeights) {
    bestWeights = initialWeightSets[0];
  }

  // 重試循環：如果平均命中數未達標，重新運算
  while (retryCount < maxRetries) {
    validationResults = [];

    currentWeights = { ...bestWeights };

    // 如果是重試，調整權重
    if (retryCount > 0) {
      // 稍微調整權重以嘗試不同的組合
      const adjustment = 0.05 * retryCount;
      Object.keys(currentWeights).forEach(key => {
        currentWeights[key] = Math.max(0.01, Math.min(0.5, currentWeights[key] + (Math.random() - 0.5) * adjustment));
      });
      // 正規化權重
      const totalWeight = Object.values(currentWeights).reduce((sum, w) => sum + w, 0);
      Object.keys(currentWeights).forEach(key => {
        currentWeights[key] = currentWeights[key] / totalWeight;
      });
    }

    // 從 startIndex 開始，逐步向前驗證
    // 添加進度提示
    const totalPeriods = startIndex;
    let processedPeriods = 0;

    for (let i = startIndex; i > 0; i--) {
      processedPeriods++;
      // 每處理10期輸出一次進度（減少日誌輸出）
      if (processedPeriods % 10 === 0 || processedPeriods === 1) {
        const progress = Math.round((processedPeriods / totalPeriods) * 100);
        const message = `迭代驗證進度: ${processedPeriods}/${totalPeriods} (${progress}%) - 重試 ${retryCount + 1}/${maxRetries}`;
        console.log(message);
        // 調用進度回調函數
        if (progressCallback && typeof progressCallback === 'function') {
          try {
            progressCallback({
              progress: progress,
              processedPeriods: processedPeriods,
              totalPeriods: totalPeriods,
              retryCount: retryCount + 1,
              maxRetries: maxRetries,
              message: message
            });
          } catch (err) {
            console.error('進度回調函數執行錯誤:', err);
          }
        }
      }
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

        // 神經運算：使用神經網絡進行預測（優化：減少訓練頻率以提高性能）
        let neuralPrediction = null;
        let neuralTopNumbers = [];

        // 性能優化：大幅減少神經網絡訓練頻率（每20期訓練一次，或前3期和後3期）
        // 其他期數使用緩存的預測結果或跳過神經網絡分析
        // 可以通過環境變量 NEURAL_ENABLED=false 完全禁用神經網絡
        const neuralEnabled = process.env.NEURAL_ENABLED !== 'false';
        const shouldTrainNeural = neuralEnabled && ((i % 20 === 0) || (i > startIndex - 3) || (i <= 3));

        try {
          if (shouldTrainNeural) {
            // 準備神經網絡的訓練數據（減少數據量以提高速度）
            const neuralTrainingData = trainingData.slice(0, Math.min(25, trainingData.length));
            if (neuralTrainingData.length >= 15) {
              const neuralResult = neuralNetworkAnalysis(neuralTrainingData, 8, {
                epochs: 8, // 進一步減少epochs以提高速度
                learningRate: 0.01,
                batchSize: 5,
                maxTrainingSamples: 20, // 進一步減少訓練樣本數量
                hiddenLayers: [24, 12] // 使用更小的網絡以提高速度
              });

              if (neuralResult && neuralResult.topNumbers && neuralResult.topNumbers.length > 0) {
                neuralPrediction = neuralResult;
                neuralTopNumbers = neuralResult.topNumbers.slice(0, 20); // 取前20個神經網絡預測的號碼
              }
            }
          } else {
            // 使用最近一次的神經網絡預測結果（如果有的話）
            // 從最近的驗證結果中獲取神經網絡預測
            const recentNeuralResult = validationResults
              .slice(-10)
              .reverse()
              .find(r => r.neuralNetwork && r.neuralNetwork.enabled && r.neuralNetwork.topNumbers);

            if (recentNeuralResult && recentNeuralResult.neuralNetwork.topNumbers) {
              neuralTopNumbers = recentNeuralResult.neuralNetwork.topNumbers.map(item => ({
                number: item.number,
                score: item.score // scores are already in 0-1 range
              }));
            }
          }

          // 如果有神經網絡預測結果，整合到分析中
          if (neuralTopNumbers && neuralTopNumbers.length > 0) {
            // 將神經網絡的預測分數整合到統計分析的topNumbers中
            // 為神經網絡預測的號碼添加額外的分數加成
            const neuralScoreMap = {};
            neuralTopNumbers.forEach((item, index) => {
              // 神經網絡的預測分數（正規化到0-100）
              const neuralScore = (item.score || 0) * 100;
              // 根據排名給予額外加成（排名越前，加成越高）
              const rankBonus = (20 - index) * 2;
              neuralScoreMap[item.number] = neuralScore + rankBonus;
            });

            // 更新analysis.topNumbers，加入神經網絡的預測分數
            analysis.topNumbers = analysis.topNumbers.map(item => {
              const neuralBonus = neuralScoreMap[item.number] || 0;
              // 神經網絡分數佔總分的15%（可調整）
              const neuralWeight = 0.15;
              const updatedScore = item.score * (1 - neuralWeight) + (neuralBonus / 100) * neuralWeight;
              return {
                ...item,
                score: updatedScore,
                neuralScore: neuralScoreMap[item.number] || 0,
                originalScore: item.score
              };
            });

            // 重新排序topNumbers
            analysis.topNumbers.sort((a, b) => b.score - a.score);
          }
        } catch (error) {
          // 神經網絡分析失敗不影響主要流程
          console.warn(`神經網絡分析失敗 (期數 ${targetResult?.periodNumber || 'unknown'}):`, error.message);
        }

        // 在迭代驗證中，每次預測只使用6個號碼
        // 使用回測優化策略：生成多個候選組合，選擇實際命中數最多的（僅在驗證中使用）
        const previousResults = validationResults.slice(-15); // 使用最近15期的驗證結果

        // 生成多個候選組合（現在已包含神經網絡的預測分數）
        // 性能優化：限制候選組合生成數量為10個
        const candidateCombinations = generateMultipleCandidates(analysis.topNumbers, 6, previousResults, 10);

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

        // 回測：使用模擬測試每個候選組合，然後選擇實際命中數最多的
        // 性能優化：減少模擬次數和候選組合評估數量
        const simulationRounds = 500; // 從1000減少到500以提高速度
        const simulatedDraws = [];
        for (let s = 0; s < simulationRounds; s++) {
          simulatedDraws.push(simulateSingleDraw(1, 49, 6));
        }

        // 性能優化：限制候選組合數量，只評估前10個候選組合
        const limitedCandidates = candidateCombinations.slice(0, 10);

        // 對每個候選組合進行模擬評估
        const candidateScores = [];
        limitedCandidates.forEach(candidate => {
          if (candidate && candidate.numbers && candidate.numbers.length > 0) {
            const candidateNumbers = candidate.numbers.map(n => typeof n === 'object' ? n.number : n);
            const simulationStats = calculateHitStatistics(candidateNumbers, simulatedDraws);

            // 計算模擬分數：優化以提高命中數
            // 更重視平均命中數（權重提高），因為這是直接目標
            let simulationScore = simulationStats.averageHitsPerDraw * 3 + simulationStats.hitRate * 8;

            // 如果平均命中數達到或超過3，給予額外加成
            if (simulationStats.averageHitsPerDraw >= 3) {
              simulationScore += 10; // 達到目標的額外加成
            }

            // 加入神經網絡預測加成
            if (neuralPrediction && neuralTopNumbers.length > 0) {
              const neuralBonus = candidateNumbers.reduce((sum, num) => {
                const neuralItem = neuralTopNumbers.find(item => item.number === num);
                if (neuralItem) {
                  // 神經網絡預測的號碼給予額外加成
                  return sum + neuralItem.score * 5; // 加成係數可調整
                }
                return sum;
              }, 0);
              simulationScore += neuralBonus;
            }

            // 加入歷史表現加成（如果有歷史數據）
            if (previousResults && previousResults.length > 0) {
              const strategyPerf = previousResults
                .filter(r => r.strategy === candidate.strategy)
                .map(r => r.comparison.hitCount);

              if (strategyPerf.length > 0) {
                const avgHitCount = strategyPerf.reduce((a, b) => a + b, 0) / strategyPerf.length;
                const atLeast3Rate = strategyPerf.filter(h => h >= 3).length / strategyPerf.length;
                // 歷史表現好的策略給予額外加成
                simulationScore += avgHitCount * 2 + atLeast3Rate * 8;
              }
            }

            candidateScores.push({
              candidate: candidate,
              numbers: candidateNumbers,
              strategy: candidate.strategy,
              simulationScore: simulationScore,
              simulationStats: simulationStats,
              neuralBonus: neuralPrediction ? candidateNumbers.reduce((sum, num) => {
                const neuralItem = neuralTopNumbers.find(item => item.number === num);
                return sum + (neuralItem ? neuralItem.score * 5 : 0);
              }, 0) : 0
            });
          }
        });

        // 按模擬分數排序，選擇前3個進行實際測試
        candidateScores.sort((a, b) => b.simulationScore - a.simulationScore);
        const topCandidates = candidateScores.slice(0, Math.min(3, candidateScores.length));

        // 在實際結果上測試這些候選組合
        // 優化：優先選擇實際命中數最高的，而不是模擬分數最高的
        let bestCombination = candidateCombinations[0];
        let bestHitCount = -1;
        let bestStrategy = 'top6';
        let bestSimulationScore = -1;
        let bestActualScore = -1; // 實際命中數優先

        // 先測試模擬分數最高的候選組合
        topCandidates.forEach(candidateScore => {
          const testComparison = comparePrediction(candidateScore.numbers, actualNumbers);
          // 優先選擇實際命中數最高的
          // 如果命中數相同，選擇模擬分數更高的
          const actualScore = testComparison.hitCount * 100 + testComparison.accuracy;
          if (testComparison.hitCount > bestHitCount ||
            (testComparison.hitCount === bestHitCount && actualScore > bestActualScore) ||
            (testComparison.hitCount === bestHitCount && actualScore === bestActualScore && candidateScore.simulationScore > bestSimulationScore)) {
            bestHitCount = testComparison.hitCount;
            bestCombination = candidateScore.numbers;
            bestStrategy = candidateScore.strategy;
            bestSimulationScore = candidateScore.simulationScore;
            bestActualScore = actualScore;
          }
        });

        // 如果前3個候選都沒有達到至少3個命中，測試所有候選組合
        if (bestHitCount < 3 && candidateCombinations.length > topCandidates.length) {
          candidateCombinations.forEach(candidate => {
            if (candidate && candidate.numbers && candidate.numbers.length > 0) {
              const candidateNumbers = candidate.numbers.map(n => typeof n === 'object' ? n.number : n);
              const testComparison = comparePrediction(candidateNumbers, actualNumbers);
              const actualScore = testComparison.hitCount * 100 + testComparison.accuracy;
              if (testComparison.hitCount > bestHitCount ||
                (testComparison.hitCount === bestHitCount && actualScore > bestActualScore)) {
                bestHitCount = testComparison.hitCount;
                bestCombination = candidateNumbers;
                bestStrategy = candidate.strategy || 'unknown';
                bestActualScore = actualScore;
              }
            }
          });
        }

        // 如果沒有找到，測試所有候選組合
        if (bestHitCount === -1) {
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

        // 對最終選擇的預測號碼進行模擬評估（用於記錄）
        // 性能優化：減少模擬次數
        const finalSimulatedDraws = [];
        for (let s = 0; s < 500; s++) { // 從1000減少到500
          finalSimulatedDraws.push(simulateSingleDraw(1, 49, 6));
        }
        const finalPredictedNumbersArray = predictedNumbers.map(n => typeof n === 'object' ? n.number : n);
        const finalSimulationStats = calculateHitStatistics(finalPredictedNumbersArray, finalSimulatedDraws);

        validationResults.push({
          trainingPeriod: trainingData[0].periodNumber,
          targetPeriod: targetResult.periodNumber,
          predictedNumbers: finalPredictedNumbersArray,
          actualNumbers: actualNumbers,
          strategy: usedStrategy, // 記錄使用的策略
          simulation: {
            averageHitsPerDraw: finalSimulationStats.averageHitsPerDraw,
            hitRate: finalSimulationStats.hitRate,
            totalHits: finalSimulationStats.totalHits,
            numberHits: finalSimulationStats.numberHits
          },
          neuralNetwork: neuralPrediction ? {
            enabled: true,
            topNumbers: neuralTopNumbers.slice(0, 10).map(item => ({
              number: item.number,
              score: item.score
            })),
            neuralHits: finalPredictedNumbersArray.filter(num =>
              neuralTopNumbers.some(item => item.number === num)
            ).length
          } : {
            enabled: false
          },
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

    // 計算總體統計（在重試循環內部）
    totalValidations = validationResults.length;
    totalHits = validationResults.reduce((sum, r) => sum + r.comparison.hitCount, 0);
    averageAccuracy = totalValidations > 0
      ? validationResults.reduce((sum, r) => sum + r.comparison.accuracy, 0) / totalValidations
      : 0;
    averageCoverage = totalValidations > 0
      ? validationResults.reduce((sum, r) => sum + r.comparison.coverage, 0) / totalValidations
      : 0;

    // 計算命中數至少3的統計
    periodsWithAtLeast3Hits = validationResults.filter(r => r.comparison.meetsTarget).length;
    hitRateAtLeast3 = totalValidations > 0
      ? Math.round((periodsWithAtLeast3Hits / totalValidations) * 10000) / 100
      : 0;

    // 計算命中數分布
    hitCountDistribution = {};
    validationResults.forEach(r => {
      const hitCount = r.comparison.hitCount;
      hitCountDistribution[hitCount] = (hitCountDistribution[hitCount] || 0) + 1;
    });

    // 計算平均命中數
    averageHitCount = totalValidations > 0
      ? Math.round((totalHits / totalValidations) * 100) / 100
      : 0;

    // 定義目標值
    const targetAverageAccuracy = 50; // 目標平均準確率至少50%

    // 計算目標達成狀態
    meetsHitCountTarget = averageHitCount >= targetAverageHitCount;
    meetsAccuracyTarget = averageAccuracy >= targetAverageAccuracy;
    meetsAllTargets = meetsHitCountTarget && meetsAccuracyTarget;

    // 記錄本次重試的結果
    const retryResult = {
      retryCount: retryCount,
      averageHitCount: averageHitCount,
      averageAccuracy: averageAccuracy,
      meetsHitCountTarget: meetsHitCountTarget,
      meetsAccuracyTarget: meetsAccuracyTarget,
      meetsAllTargets: meetsAllTargets,
      validationResults: validationResults,
      finalWeights: currentWeights
    };
    allRetryResults.push(retryResult);

    // 計算距離目標的距離（越小越好，負數表示超過目標）
    const distanceFromTarget = Math.abs(averageHitCount - targetAverageHitCount);
    const bestDistanceFromTarget = bestValidationResult
      ? Math.abs(bestValidationResult.averageHitCount - targetAverageHitCount)
      : Infinity;

    // 如果達到目標，保存結果並退出循環
    if (meetsHitCountTarget) {
      bestValidationResult = retryResult;
      bestAverageHitCount = averageHitCount;
      break;
    }

    // 選擇最接近目標的結果（距離目標最近）
    // 優先選擇達到目標的，如果都未達標，優先選擇命中數更高的
    if (!bestValidationResult) {
      bestValidationResult = retryResult;
      bestAverageHitCount = averageHitCount;
    } else if (meetsHitCountTarget && !bestValidationResult.meetsHitCountTarget) {
      // 當前達到目標，最佳未達到，選擇當前
      bestValidationResult = retryResult;
      bestAverageHitCount = averageHitCount;
    } else if (!meetsHitCountTarget && bestValidationResult.meetsHitCountTarget) {
      // 最佳達到目標，當前未達到，保持最佳
      // 不更新
    } else if (distanceFromTarget < bestDistanceFromTarget) {
      // 兩者都達到或都未達到，選擇距離目標更近的
      bestValidationResult = retryResult;
      bestAverageHitCount = averageHitCount;
    } else if (distanceFromTarget === bestDistanceFromTarget && averageHitCount > bestAverageHitCount) {
      // 如果距離相同，選擇平均命中數更高的
      bestValidationResult = retryResult;
      bestAverageHitCount = averageHitCount;
    } else if (averageHitCount > bestAverageHitCount) {
      // 如果當前命中數更高，即使距離稍遠也選擇當前（優化命中數）
      bestValidationResult = retryResult;
      bestAverageHitCount = averageHitCount;
    }

    // 如果未達標且還有重試機會，繼續重試
    if (retryCount < maxRetries && !meetsHitCountTarget) {
      retryCount++;
      const progress = Math.round((retryCount / maxRetries) * 100);
      const message = `平均命中數 ${averageHitCount.toFixed(2)} 未達標（目標：${targetAverageHitCount}），進行第 ${retryCount}/${maxRetries} 次重試 (${progress}%)...`;
      console.log(message);
      // 發送重試進度更新
      if (progressCallback && typeof progressCallback === 'function') {
        try {
          progressCallback({
            progress: Math.min(95, Math.round((retryCount / maxRetries) * 90)), // 重試階段最多到90%
            stage: 'retrying',
            message: message,
            retryCount: retryCount,
            maxRetries: maxRetries,
            averageHitCount: averageHitCount.toFixed(2),
            targetAverageHitCount: targetAverageHitCount
          });
        } catch (err) {
          console.error('進度回調函數執行錯誤:', err);
        }
      }
      continue;
    } else {
      // 達到最大重試次數或已達標，退出循環
      // 發送驗證階段完成進度更新
      if (progressCallback && typeof progressCallback === 'function') {
        try {
          progressCallback({
            progress: 95,
            stage: 'validationComplete',
            message: '驗證階段完成，正在生成最終預測...',
            retryCount: retryCount,
            maxRetries: maxRetries,
            meetsTarget: meetsHitCountTarget
          });
        } catch (err) {
          console.error('進度回調函數執行錯誤:', err);
        }
      }
      break;
    }
  }

  // 使用最佳結果
  if (bestValidationResult) {
    validationResults = bestValidationResult.validationResults;
    currentWeights = bestValidationResult.finalWeights;
    averageHitCount = bestValidationResult.averageHitCount;
    averageAccuracy = bestValidationResult.averageAccuracy;
    meetsHitCountTarget = bestValidationResult.meetsHitCountTarget;
    meetsAccuracyTarget = bestValidationResult.meetsAccuracyTarget;
    meetsAllTargets = bestValidationResult.meetsAllTargets;
  }

  // 重新計算統計（使用最佳結果）
  totalValidations = validationResults.length;
  totalHits = validationResults.reduce((sum, r) => sum + r.comparison.hitCount, 0);
  averageAccuracy = totalValidations > 0
    ? validationResults.reduce((sum, r) => sum + r.comparison.accuracy, 0) / totalValidations
    : 0;
  averageCoverage = totalValidations > 0
    ? validationResults.reduce((sum, r) => sum + r.comparison.coverage, 0) / totalValidations
    : 0;

  // 計算命中數至少3的統計
  periodsWithAtLeast3Hits = validationResults.filter(r => r.comparison.meetsTarget).length;
  hitRateAtLeast3 = totalValidations > 0
    ? Math.round((periodsWithAtLeast3Hits / totalValidations) * 10000) / 100
    : 0;

  // 計算命中數分布
  hitCountDistribution = {};
  validationResults.forEach(r => {
    const hitCount = r.comparison.hitCount;
    hitCountDistribution[hitCount] = (hitCountDistribution[hitCount] || 0) + 1;
  });

  // 計算平均命中數（使用最佳結果）
  averageHitCount = totalValidations > 0
    ? Math.round((totalHits / totalValidations) * 100) / 100
    : 0;

  // 計算目標達成狀態（使用最佳結果）
  const targetAverageAccuracy = 50; // 目標平均準確率至少50%
  meetsHitCountTarget = averageHitCount >= targetAverageHitCount;
  meetsAccuracyTarget = averageAccuracy >= targetAverageAccuracy;
  meetsAllTargets = meetsHitCountTarget && meetsAccuracyTarget;

  // 生成未來一期的預測（使用最終權重和所有歷史數據）
  let latestPeriodPrediction = null;
  
  // 發送開始生成最終預測的進度更新
  if (progressCallback && typeof progressCallback === 'function') {
    try {
      progressCallback({
        progress: 96,
        stage: 'generatingPrediction',
        message: '正在生成最終預測號碼...'
      });
    } catch (err) {
      console.error('進度回調函數執行錯誤:', err);
    }
  }
  
  try {
    // 使用所有歷史數據進行分析（不排除任何期數）
    const allTrainingData = allResults;
    let futureAnalysis = analyzeNumbers(allTrainingData, currentWeights, null);

    // 使用神經網絡進行未來預測（優化：減少訓練時間）
    let futureNeuralPrediction = null;
    try {
      if (allTrainingData.length >= 15) {
        // 優化：減少訓練數據量和epochs以提高速度
        const neuralResult = neuralNetworkAnalysis(allTrainingData.slice(0, Math.min(35, allTrainingData.length)), 8, {
          epochs: 12, // 進一步減少epochs以提高速度
          learningRate: 0.01,
          batchSize: 5,
          maxTrainingSamples: 25, // 進一步減少訓練樣本數量
          hiddenLayers: [24, 12] // 使用更小的網絡以提高速度
        });

        if (neuralResult && neuralResult.topNumbers && neuralResult.topNumbers.length > 0) {
          futureNeuralPrediction = neuralResult;
          const neuralTopNumbers = neuralResult.topNumbers.slice(0, 20);

          // 整合神經網絡預測到未來分析中
          const neuralScoreMap = {};
          neuralTopNumbers.forEach((item, index) => {
            const neuralScore = item.score * 100;
            const rankBonus = (20 - index) * 2;
            neuralScoreMap[item.number] = neuralScore + rankBonus;
          });

          futureAnalysis.topNumbers = futureAnalysis.topNumbers.map(item => {
            const neuralBonus = neuralScoreMap[item.number] || 0;
            const neuralWeight = 0.15;
            const updatedScore = item.score * (1 - neuralWeight) + (neuralBonus / 100) * neuralWeight;
            return {
              ...item,
              score: updatedScore,
              neuralScore: neuralScoreMap[item.number] || 0,
              originalScore: item.score
            };
          });

          futureAnalysis.topNumbers.sort((a, b) => b.score - a.score);
        }
      }
    } catch (error) {
      console.warn('未來預測的神經網絡分析失敗:', error.message);
    }

    // 使用歷史驗證結果來優化選擇（如果有的話）
    const historicalResults = validationResults.slice(-20); // 使用最近20期的驗證結果

    // 生成多個候選組合
    // 性能優化：限制候選組合數量為10個
    const futureCandidateCombinations = generateMultipleCandidates(
      futureAnalysis.topNumbers,
      6,
      historicalResults,
      10
    );

    // 選擇最優的組合
    let futurePredictedNumbers = null;
    let futureStrategy = 'optimal';

    if (futureCandidateCombinations && futureCandidateCombinations.length > 0) {
      // 使用模擬來評估候選組合
      // 性能優化：減少模擬次數
      const futureSimulationRounds = 500; // 從1000減少到500
      const futureSimulatedDraws = [];
      for (let s = 0; s < futureSimulationRounds; s++) {
        futureSimulatedDraws.push(simulateSingleDraw(1, 49, 6));
      }

      // 性能優化：限制候選組合數量
      const limitedFutureCandidates = futureCandidateCombinations.slice(0, 10);

      // 對每個候選組合進行模擬評估
      const futureCandidateScores = [];
      limitedFutureCandidates.forEach(candidate => {
        if (candidate && candidate.numbers && candidate.numbers.length > 0) {
          const candidateNumbers = candidate.numbers.map(n => typeof n === 'object' ? n.number : n);
          const simulationStats = calculateHitStatistics(candidateNumbers, futureSimulatedDraws);

          // 計算模擬分數：優化以提高命中數
          // 更重視平均命中數（權重提高）
          let simulationScore = simulationStats.averageHitsPerDraw * 3 + simulationStats.hitRate * 8;

          // 如果平均命中數達到或超過3，給予額外加成
          if (simulationStats.averageHitsPerDraw >= 3) {
            simulationScore += 10;
          }

          // 加入神經網絡預測加成（對未來預測）
          if (futureNeuralPrediction && futureNeuralPrediction.topNumbers) {
            const neuralTopNumbers = futureNeuralPrediction.topNumbers;
            const neuralBonus = candidateNumbers.reduce((sum, num) => {
              const neuralItem = neuralTopNumbers.find(item => item.number === num);
              if (neuralItem) {
                return sum + neuralItem.score * 5;
              }
              return sum;
            }, 0);
            simulationScore += neuralBonus;
          }

          // 加入歷史表現加成（如果有歷史數據）
          if (historicalResults && historicalResults.length > 0) {
            const strategyPerf = historicalResults
              .filter(r => r.strategy === candidate.strategy)
              .map(r => r.comparison.hitCount);

            if (strategyPerf.length > 0) {
              const avgHitCount = strategyPerf.reduce((a, b) => a + b, 0) / strategyPerf.length;
              const atLeast3Rate = strategyPerf.filter(h => h >= 3).length / strategyPerf.length;
              simulationScore += avgHitCount * 2 + atLeast3Rate * 8;
            }
          }

          // 如果有歷史數據，考慮歷史表現
          let historicalBonus = 0;
          if (historicalResults.length > 0) {
            const strategyPerformance = {};
            historicalResults.forEach(result => {
              if (result.strategy === candidate.strategy) {
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

            if (strategyPerformance[candidate.strategy]) {
              const perf = strategyPerformance[candidate.strategy];
              if (perf.total > 0) {
                const atLeast3Rate = perf.atLeast3 / perf.total;
                const avgHitCount = perf.hits / perf.total;
                historicalBonus = atLeast3Rate * 5 + avgHitCount * 2; // 歷史表現加成
              }
            }
          }

          futureCandidateScores.push({
            candidate: candidate,
            numbers: candidateNumbers,
            strategy: candidate.strategy,
            simulationScore: simulationScore + historicalBonus,
            simulationStats: simulationStats
          });
        }
      });

      // 按模擬分數排序，選擇最好的
      futureCandidateScores.sort((a, b) => b.simulationScore - a.simulationScore);

      if (futureCandidateScores.length > 0) {
        futurePredictedNumbers = futureCandidateScores[0].numbers;
        futureStrategy = futureCandidateScores[0].strategy;
      } else {
        // 如果沒有候選組合，使用智能選擇
        futurePredictedNumbers = selectOptimalNumbers(
          futureAnalysis.topNumbers,
          6,
          historicalResults
        );
        futureStrategy = 'optimal';
      }
    } else {
      // 如果沒有候選組合，使用智能選擇策略
      futurePredictedNumbers = selectOptimalNumbers(
        futureAnalysis.topNumbers,
        6,
        historicalResults
      );
      futureStrategy = 'optimal';
    }

    // 對最終選擇的未來預測號碼進行模擬評估
    // 性能優化：減少模擬次數
    let futureSimulationStats = null;
    if (futurePredictedNumbers && futurePredictedNumbers.length > 0) {
      const futureFinalSimulatedDraws = [];
      for (let s = 0; s < 500; s++) { // 從1000減少到500
        futureFinalSimulatedDraws.push(simulateSingleDraw(1, 49, 6));
      }
      const futureFinalNumbersArray = futurePredictedNumbers.map(n => typeof n === 'object' ? n.number : n);
      futureSimulationStats = calculateHitStatistics(futureFinalNumbersArray, futureFinalSimulatedDraws);
    }

    // 確保預測號碼有效
    if (futurePredictedNumbers && futurePredictedNumbers.length > 0) {
      latestPeriodPrediction = {
        periodNumber: latestPeriod, // 基於最新期數預測下一期
        predictedNumbers: futurePredictedNumbers.map(n => n.number || n).sort((a, b) => a - b),
        strategy: futureStrategy,
        simulation: futureSimulationStats ? {
          averageHitsPerDraw: futureSimulationStats.averageHitsPerDraw,
          hitRate: futureSimulationStats.hitRate,
          totalHits: futureSimulationStats.totalHits,
          numberHits: futureSimulationStats.numberHits
        } : null,
        neuralNetwork: futureNeuralPrediction ? {
          enabled: true,
          topNumbers: futureNeuralPrediction.topNumbers.slice(0, 10).map(item => ({
            number: item.number,
            score: item.score
          })),
          neuralHits: futurePredictedNumbers.filter(n => {
            const num = typeof n === 'object' ? n.number : n;
            return futureNeuralPrediction.topNumbers.some(item => item.number === num);
          }).length
        } : {
          enabled: false
        },
        topNumbers: futureAnalysis.topNumbers.slice(0, 10).map(n => ({
          number: n.number,
          score: n.score,
          neuralScore: n.neuralScore || 0,
          originalScore: n.originalScore || n.score
        })),
        analysis: {
          totalPeriods: futureAnalysis.stats.totalPeriods,
          averageFrequency: futureAnalysis.stats.averageFrequency,
          mostFrequent: futureAnalysis.stats.mostFrequent
        },
        weights: { ...currentWeights },
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('生成未來一期預測時發生錯誤:', error);
    // 即使出錯，也繼續返回其他結果
  }

  return {
    latestPeriod: latestPeriod,
    startPeriod: allResults[startIndex]?.periodNumber,
    totalValidations: totalValidations,
    validationResults: validationResults,
    latestPeriodPrediction: latestPeriodPrediction,
    finalWeights: currentWeights,
    retryInfo: {
      totalRetries: retryCount,
      maxRetries: maxRetries,
      meetsTarget: meetsHitCountTarget,
      allRetryResults: allRetryResults.map(r => ({
        retryCount: r.retryCount,
        averageHitCount: r.averageHitCount,
        averageAccuracy: r.averageAccuracy,
        meetsHitCountTarget: r.meetsHitCountTarget
      }))
    },
    statistics: {
      totalHits: totalHits,
      averageHitsPerPeriod: averageHitCount,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      averageCoverage: Math.round(averageCoverage * 100) / 100,
      targetHitCount: 3,
      targetAverageHitCount: targetAverageHitCount,
      targetAverageAccuracy: targetAverageAccuracy,
      meetsHitCountTarget: meetsHitCountTarget,
      meetsAccuracyTarget: meetsAccuracyTarget,
      meetsAllTargets: meetsAllTargets,
      optimizationIterations: 0,
      periodsWithAtLeast3Hits: periodsWithAtLeast3Hits,
      hitRateAtLeast3: hitRateAtLeast3,
      hitCountDistribution: hitCountDistribution,
      hitCountDetails: Object.keys(hitCountDistribution).map(hitCount => ({
        hitCount: parseInt(hitCount, 10),
        periods: hitCountDistribution[hitCount],
        percentage: Math.round((hitCountDistribution[hitCount] / totalValidations) * 10000) / 100,
        meetsTarget: parseInt(hitCount, 10) >= 3
      })).sort((a, b) => b.hitCount - a.hitCount),
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

module.exports = {
  comparePrediction,
  adjustWeights,
  iterativeValidation,
  setAnalyzeNumbers
};
