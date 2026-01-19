/**
 * 號碼模擬服務
 * 使用預測號碼模擬多次攪出，根據命中率迭代優化預測號碼
 */

// 延遲加載 analyzeNumbers 以避免循環依賴
let analyzeNumbers = null;
function getAnalyzeNumbers() {
  if (!analyzeNumbers) {
    analyzeNumbers = require('./analysisService').analyzeNumbers;
  }
  return analyzeNumbers;
}

/**
 * 模擬單次開獎（隨機生成6個號碼）
 * @param {number} min - 最小號碼（預設1）
 * @param {number} max - 最大號碼（預設49）
 * @param {number} count - 要生成的號碼數量（預設6）
 * @returns {Array<number>} 隨機生成的號碼陣列（已排序）
 */
function simulateSingleDraw(min = 1, max = 49, count = 6) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || !Number.isInteger(count)) {
    throw new Error('min/max/count must be integers');
  }
  if (min > max) {
    throw new Error(`min must be <= max (got ${min} > ${max})`);
  }
  if (count <= 0) {
    throw new Error(`count must be > 0 (got ${count})`);
  }
  const range = max - min + 1;
  if (count > range) {
    throw new Error(`Cannot generate ${count} unique numbers from range ${min}-${max} (only ${range} values available)`);
  }

  const numbers = new Set();

  // 生成不重複的隨機號碼
  while (numbers.size < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(num);
  }

  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * 計算預測號碼在模擬開獎中的命中次數
 * @param {Array<number>} predictedNumbers - 預測的號碼陣列
 * @param {Array<Array<number>>} simulatedDraws - 模擬開獎結果陣列
 * @returns {Object} 命中統計 { totalHits: number, hitRate: number, numberHits: Object }
 */
function calculateHitStatistics(predictedNumbers, simulatedDraws) {
  const uniquePredictedNumbers = Array.from(new Set(predictedNumbers));
  const numberHits = {};
  let totalHits = 0;

  // 初始化每個預測號碼的命中次數
  uniquePredictedNumbers.forEach(num => {
    numberHits[num] = 0;
  });

  // 統計每個模擬開獎中的命中情況
  simulatedDraws.forEach(draw => {
    const drawSet = new Set(draw);
    let drawHits = 0;

    uniquePredictedNumbers.forEach(num => {
      if (drawSet.has(num)) {
        numberHits[num]++;
        drawHits++;
      }
    });

    totalHits += drawHits;
  });

  const totalPossibleHits = uniquePredictedNumbers.length * simulatedDraws.length;
  const hitRate = totalPossibleHits > 0 ? totalHits / totalPossibleHits : 0;

  return {
    totalHits,
    hitRate,
    numberHits,
    averageHitsPerDraw: simulatedDraws.length > 0 ? totalHits / simulatedDraws.length : 0
  };
}

/**
 * 迭代模擬優化預測號碼
 * @param {Array} historicalResults - 歷史開獎結果（用於預測）
 * @param {Array<number>} initialPredictedNumbers - 初始預測號碼（預設為null，將自動生成）
 * @param {Object} options - 配置選項
 * @param {number} options.simulationRounds - 每輪模擬次數（預設1000）
 * @param {number} options.maxIterations - 最大迭代次數（預設10）
 * @param {number} options.hitThreshold - 命中率閾值，低於此值的號碼將被替換（預設0.1，即10%）
 * @param {number} options.minKeepCount - 最少保留的號碼數量（預設2）
 * @param {Object} options.weights - 預測方法的權重參數
 * @returns {Object} 模擬優化結果
 */
function iterativeSimulationOptimization(
  historicalResults,
  initialPredictedNumbers = null,
  options = {}
) {
  const {
    simulationRounds = 1000,
    maxIterations = 10,
    hitThreshold = 0.1,
    minKeepCount = 2,
    weights = {}
  } = options;

  if (!historicalResults || historicalResults.length === 0) {
    throw new Error('需要歷史開獎結果才能進行模擬優化');
  }

  // 初始化預測號碼
  let currentPredictedNumbers = initialPredictedNumbers;
  if (!currentPredictedNumbers || currentPredictedNumbers.length === 0) {
    // 如果沒有提供初始預測號碼，使用預測方法生成
    const analysisResult = getAnalyzeNumbers()(historicalResults, weights);
    currentPredictedNumbers = analysisResult.predictedNumbers ||
      analysisResult.topNumbers.slice(0, 6).map(n => n.number);
  }

  // 確保預測號碼是數字陣列
  currentPredictedNumbers = [...new Set(currentPredictedNumbers.map(n =>
    typeof n === 'object' ? n.number : parseInt(n, 10)
  ))].filter(n => !isNaN(n) && n >= 1 && n <= 49);

  if (currentPredictedNumbers.length !== 6) {
    throw new Error('預測號碼必須是6個有效的號碼（1-49）');
  }

  const iterationHistory = [];
  let iteration = 0;
  let converged = false;

  while (iteration < maxIterations && !converged) {
    iteration++;

    // 模擬指定次數的開獎
    const simulatedDraws = [];
    for (let i = 0; i < simulationRounds; i++) {
      simulatedDraws.push(simulateSingleDraw(1, 49, 6));
    }

    // 計算命中統計
    const hitStats = calculateHitStatistics(currentPredictedNumbers, simulatedDraws);

    // 計算每個號碼的命中率
    const numberHitRates = {};
    currentPredictedNumbers.forEach(num => {
      numberHitRates[num] = hitStats.numberHits[num] / simulationRounds;
    });

    // 按命中率排序號碼
    const sortedNumbers = currentPredictedNumbers
      .map(num => ({
        number: num,
        hitRate: numberHitRates[num],
        hits: hitStats.numberHits[num]
      }))
      .sort((a, b) => b.hitRate - a.hitRate);

    // 找出命中率高的號碼（保留）
    const highHitNumbers = sortedNumbers
      .filter(item => item.hitRate >= hitThreshold)
      .map(item => item.number);

    // 找出命中率低的號碼（需要替換）
    const lowHitNumbers = sortedNumbers
      .filter(item => item.hitRate < hitThreshold)
      .map(item => item.number);

    // 記錄迭代信息
    const iterationInfo = {
      iteration,
      predictedNumbers: [...currentPredictedNumbers].sort((a, b) => a - b),
      hitStatistics: {
        totalHits: hitStats.totalHits,
        hitRate: hitStats.hitRate,
        averageHitsPerDraw: hitStats.averageHitsPerDraw,
        numberHits: { ...hitStats.numberHits },
        numberHitRates: { ...numberHitRates }
      },
      highHitNumbers: [...highHitNumbers].sort((a, b) => a - b),
      lowHitNumbers: [...lowHitNumbers].sort((a, b) => a - b),
      replacementCount: lowHitNumbers.length
    };

    iterationHistory.push(iterationInfo);

    // 如果沒有需要替換的號碼，或保留的號碼太少，則收斂
    if (lowHitNumbers.length === 0) {
      converged = true;
      iterationInfo.converged = true;
      iterationInfo.reason = '所有號碼命中率都達到閾值';
      break;
    }

    // 確保至少保留指定數量的號碼
    const keepCount = Math.max(minKeepCount, highHitNumbers.length);
    const numbersToKeep = sortedNumbers.slice(0, keepCount).map(item => item.number);
    const numbersToReplace = currentPredictedNumbers.filter(num => !numbersToKeep.includes(num));

    if (numbersToReplace.length === 0) {
      converged = true;
      iterationInfo.converged = true;
      iterationInfo.reason = '無法進一步優化（保留號碼數量限制）';
      break;
    }

    // 重新預測需要替換的號碼
    // 使用歷史結果重新分析，排除當前預測號碼中要保留的部分
    const newAnalysisResult = getAnalyzeNumbers()(historicalResults, weights);

    // 從topNumbers中選擇新的號碼，排除已保留的號碼
    const availableNumbers = newAnalysisResult.topNumbers
      .map(n => typeof n === 'object' ? n.number : parseInt(n, 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= 49 && !numbersToKeep.includes(n));

    // 選擇新的號碼來替換命中率低的號碼
    const newNumbers = [];
    for (let i = 0; i < numbersToReplace.length && i < availableNumbers.length; i++) {
      newNumbers.push(availableNumbers[i]);
    }

    // 如果新號碼不足，從剩餘的候選中隨機選擇
    while (newNumbers.length < numbersToReplace.length) {
      const remaining = Array.from({ length: 49 }, (_, i) => i + 1)
        .filter(n => !numbersToKeep.includes(n) && !newNumbers.includes(n));

      if (remaining.length === 0) break;

      const randomIndex = Math.floor(Math.random() * remaining.length);
      newNumbers.push(remaining[randomIndex]);
    }

    // 更新預測號碼（確保沒有重複）
    const updatedNumbersSet = new Set([...numbersToKeep, ...newNumbers]);
    let updatedNumbers = Array.from(updatedNumbersSet);

    // 如果號碼數量不足6個，從候選中補充
    if (updatedNumbers.length < 6) {
      const allCandidates = newAnalysisResult.topNumbers
        .map(n => typeof n === 'object' ? n.number : parseInt(n, 10))
        .filter(n => !isNaN(n) && n >= 1 && n <= 49 && !updatedNumbersSet.has(n));

      while (updatedNumbers.length < 6 && allCandidates.length > 0) {
        const candidate = allCandidates.shift();
        if (!updatedNumbersSet.has(candidate)) {
          updatedNumbers.push(candidate);
          updatedNumbersSet.add(candidate);
        }
      }

      // 如果仍然不足，從所有可能的號碼中隨機選擇
      if (updatedNumbers.length < 6) {
        const allPossible = Array.from({ length: 49 }, (_, i) => i + 1)
          .filter(n => !updatedNumbersSet.has(n));

        while (updatedNumbers.length < 6 && allPossible.length > 0) {
          const randomIndex = Math.floor(Math.random() * allPossible.length);
          const selected = allPossible.splice(randomIndex, 1)[0];
          updatedNumbers.push(selected);
          updatedNumbersSet.add(selected);
        }
      }
    }

    // 檢查是否有變化
    const oldSorted = [...currentPredictedNumbers].sort((a, b) => a - b);
    const newSorted = [...updatedNumbers].sort((a, b) => a - b);

    if (JSON.stringify(oldSorted) === JSON.stringify(newSorted)) {
      converged = true;
      iterationInfo.converged = true;
      iterationInfo.reason = '預測號碼沒有變化';
      break;
    }

    currentPredictedNumbers = updatedNumbers.slice(0, 6);
    iterationInfo.newPredictedNumbers = [...currentPredictedNumbers].sort((a, b) => a - b);
  }

  // 進行最後一輪模擬以獲取最終統計
  const finalSimulatedDraws = [];
  for (let i = 0; i < simulationRounds; i++) {
    finalSimulatedDraws.push(simulateSingleDraw(1, 49, 6));
  }
  const finalHitStats = calculateHitStatistics(currentPredictedNumbers, finalSimulatedDraws);

  return {
    initialPredictedNumbers: initialPredictedNumbers || 'auto-generated',
    finalPredictedNumbers: [...currentPredictedNumbers].sort((a, b) => a - b),
    iterations: iteration,
    converged,
    finalHitStatistics: {
      totalHits: finalHitStats.totalHits,
      hitRate: finalHitStats.hitRate,
      averageHitsPerDraw: finalHitStats.averageHitsPerDraw,
      numberHits: finalHitStats.numberHits
    },
    iterationHistory,
    options: {
      simulationRounds,
      maxIterations,
      hitThreshold,
      minKeepCount
    }
  };
}

/**
 * 批量模擬測試（用於評估預測方法的有效性）
 * @param {Array<number>} predictedNumbers - 預測號碼
 * @param {number} rounds - 模擬輪數（預設1000）
 * @param {number} batchSize - 每批模擬次數（預設100）
 * @returns {Object} 批量模擬結果
 */
function batchSimulationTest(predictedNumbers, rounds = 1000, batchSize = 100) {
  if (!predictedNumbers || predictedNumbers.length !== 6) {
    throw new Error('需要6個預測號碼');
  }

  const batches = Math.ceil(rounds / batchSize);
  const batchResults = [];

  for (let batch = 0; batch < batches; batch++) {
    const batchRounds = Math.min(batchSize, rounds - batch * batchSize);
    const simulatedDraws = [];

    for (let i = 0; i < batchRounds; i++) {
      simulatedDraws.push(simulateSingleDraw(1, 49, 6));
    }

    const hitStats = calculateHitStatistics(predictedNumbers, simulatedDraws);
    batchResults.push({
      batch: batch + 1,
      rounds: batchRounds,
      hitStatistics: hitStats
    });
  }

  // 計算總體統計
  const totalHits = batchResults.reduce((sum, b) => sum + b.hitStatistics.totalHits, 0);
  const totalRounds = batchResults.reduce((sum, b) => sum + b.rounds, 0);
  const overallHitRate = totalRounds > 0 ? totalHits / (predictedNumbers.length * totalRounds) : 0;

  return {
    predictedNumbers: [...predictedNumbers].sort((a, b) => a - b),
    totalRounds,
    overallHitRate,
    averageHitsPerDraw: totalRounds > 0 ? totalHits / totalRounds : 0,
    batchResults
  };
}

module.exports = {
  simulateSingleDraw,
  calculateHitStatistics,
  iterativeSimulationOptimization,
  batchSimulationTest
};
