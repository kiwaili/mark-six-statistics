/**
 * 斐波那契數列分析模組
 * 基於斐波那契數列和黃金比例來分析號碼出現的模式
 */

/**
 * 計算號碼是否為斐波那契數的分數
 * @param {number} num - 號碼
 * @param {Set} fibonacciSet - 斐波那契數集合
 * @returns {Object} { score, strongSignal }
 */
function scoreSequenceMembership(num, fibonacciSet) {
  if (fibonacciSet.has(num)) {
    return { score: 30, strongSignal: true };
  }
  return { score: 0, strongSignal: false };
}

/**
 * 計算間隔模式的分數（檢查間隔是否接近斐波那契數）
 * @param {Array} gaps - 間隔陣列
 * @param {Array} fibonacciSequence - 斐波那契數列
 * @returns {Object} { score, strongSignals }
 */
function scoreGapPatterns(gaps, fibonacciSequence) {
  let score = 0;
  let strongSignals = 0;
  let gapMatches = 0;

  gaps.forEach(gap => {
    fibonacciSequence.forEach(fib => {
      const diff = Math.abs(gap - fib);
      // 使用基於百分比的容差：允許20%的誤差，但至少1期
      const tolerance = Math.max(1, Math.ceil(fib * 0.2));
      if (diff <= tolerance) {
        // 分數根據相對誤差計算：完全匹配得分最高，誤差越大分數越低
        const relativeError = diff / (fib + 1); // 避免除以0
        const matchScore = Math.round((1 - relativeError) * 15);
        score += matchScore;
        gapMatches++;
        if (diff === 0) {
          strongSignals++; // 完全匹配是強信號
        }
      }
    });
  });

  // 如果有多個間隔匹配，給予額外加分
  if (gapMatches >= 2) {
    score += 25;
    strongSignals++;
  }

  return { score, strongSignals };
}

/**
 * 計算黃金比例分析的分數
 * @param {Array} appearances - 出現位置陣列
 * @param {Array} gaps - 間隔陣列
 * @param {number} currentGap - 當前間隔
 * @param {number} filteredLength - 過濾後的期數長度
 * @param {number} goldenRatio - 黃金比例
 * @param {number} goldenRatioInverse - 反向黃金比例
 * @returns {Object} { score, strongSignals }
 */
function scoreGoldenRatioAnalysis(appearances, gaps, currentGap, filteredLength, goldenRatio, goldenRatioInverse) {
  let score = 0;
  let strongSignals = 0;

  if (appearances.length >= 2 && gaps.length > 0) {
    const lastGap = gaps[gaps.length - 1];

    // 黃金比例預測
    const predictedNextGap = Math.round(lastGap * goldenRatio);
    const diff1 = Math.abs(currentGap - predictedNextGap);
    // 使用基於百分比的容差：允許20%的誤差，但至少1期
    const tolerance1 = Math.max(1, Math.ceil(predictedNextGap * 0.2));
    if (diff1 <= tolerance1) {
      // 分數根據相對誤差計算：越接近分數越高
      const relativeError = diff1 / (predictedNextGap + 1); // 避免除以0
      const matchScore = Math.round((1 - relativeError) * 35);
      score += matchScore;
      if (diff1 <= Math.max(1, Math.ceil(predictedNextGap * 0.05))) { // 5%以內視為強信號
        strongSignals++;
      }
    }

    // 反向黃金比例
    const predictedNextGapInverse = Math.round(lastGap * goldenRatioInverse);
    const diff2 = Math.abs(currentGap - predictedNextGapInverse);
    // 使用基於百分比的容差：允許20%的誤差，但至少1期
    const tolerance2 = Math.max(1, Math.ceil(predictedNextGapInverse * 0.2));
    if (diff2 <= tolerance2) {
      // 分數根據相對誤差計算：越接近分數越高
      const relativeError = diff2 / (predictedNextGapInverse + 1); // 避免除以0
      const matchScore = Math.round((1 - relativeError) * 25);
      score += matchScore;
      if (diff2 <= Math.max(1, Math.ceil(predictedNextGapInverse * 0.05))) { // 5%以內視為強信號
        strongSignals++;
      }
    }

    // 檢查間隔序列是否符合斐波那契比例
    if (gaps.length >= 2) {
      const lastTwoGaps = gaps.slice(-2);
      const ratio = lastTwoGaps[0] !== 0 ? lastTwoGaps[1] / lastTwoGaps[0] : 0;
      if (Math.abs(ratio - goldenRatio) < 0.3 || Math.abs(ratio - goldenRatioInverse) < 0.3) {
        score += 20;
        strongSignals++;
      }
    }
  }

  return { score, strongSignals };
}

/**
 * 計算位置關係的分數（檢查號碼在歷史結果中的位置關係）
 * @param {number} num - 號碼
 * @param {Array} filtered - 過濾後的期數陣列
 * @param {Set} fibonacciSet - 斐波那契數集合
 * @returns {Object} { score, strongSignals }
 */
function scorePositionRelationships(num, filtered, fibonacciSet) {
  let score = 0;
  let strongSignals = 0;
  let positionMatches = 0;

  filtered.forEach(period => {
    const sortedNumbers = [...period.numbers].sort((a, b) => a - b);
    const numIndex = sortedNumbers.indexOf(num);

    if (numIndex !== -1) {
      // 檢查相鄰號碼的差值是否為斐波那契數
      if (numIndex > 0) {
        const diff = num - sortedNumbers[numIndex - 1];
        if (fibonacciSet.has(diff)) {
          score += 15;
          positionMatches++;
        }
      }
      if (numIndex < sortedNumbers.length - 1) {
        const diff = sortedNumbers[numIndex + 1] - num;
        if (fibonacciSet.has(diff)) {
          score += 15;
          positionMatches++;
        }
      }

      // 檢查號碼在排序後的位置是否為斐波那契數
      if (fibonacciSet.has(numIndex + 1)) {
        score += 12;
      }
    }
  });

  if (positionMatches >= 3) {
    score += 20; // 多個位置匹配給予額外加分
    strongSignals++;
  }

  return { score, strongSignals };
}

/**
 * 計算週期性分析的分數（基於斐波那契數列的週期性）
 * @param {number} num - 號碼
 * @param {Array} appearances - 出現位置陣列
 * @param {Array} gaps - 間隔陣列
 * @param {number} gapSinceLast - 距離最後一次出現的間隔
 * @param {number} filteredLength - 過濾後的期數長度
 * @param {Array} fibonacciSequence - 斐波那契數列
 * @param {number} goldenRatio - 黃金比例
 * @param {Set} fibonacciSet - 斐波那契數集合
 * @returns {Object} { score, strongSignals }
 */
function scorePeriodicityAnalysis(num, appearances, gaps, gapSinceLast, filteredLength, fibonacciSequence, goldenRatio, fibonacciSet) {
  let score = 0;
  let strongSignals = 0;

  if (appearances.length > 0) {
    let periodMatches = 0;
    fibonacciSequence.forEach(fib => {
      const diff = Math.abs(gapSinceLast - fib);
      // 使用基於百分比的容差：允許20%的誤差，但至少1期
      const tolerance = Math.max(1, Math.ceil(fib * 0.2));
      if (diff <= tolerance) {
        // 分數根據相對誤差計算：完全匹配得分最高
        const relativeError = diff / (fib + 1); // 避免除以0
        const matchScore = Math.round((1 - relativeError) * 20);
        score += matchScore;
        periodMatches++;
        if (diff === 0) {
          strongSignals++;
        }
      }
    });

    // 如果間隔接近多個斐波那契數，給予額外加分
    if (periodMatches >= 2) {
      score += 30;
      strongSignals++;
    }

    // 使用黃金比例預測下一個出現時間
    if (appearances.length >= 2 && gaps.length > 0) {
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const predictedGap = Math.round(avgGap * goldenRatio);
      // 使用基於百分比的容差：允許20%的誤差，但至少1期
      const tolerance = Math.max(1, Math.ceil(predictedGap * 0.2));
      const diff = Math.abs(gapSinceLast - predictedGap);
      if (diff <= tolerance) {
        score += 25;
        strongSignals++;
      }
    }
  } else {
    // 如果從未出現，檢查是否為斐波那契數
    if (fibonacciSet.has(num)) {
      score += 20; // 增加未出現但為斐波那契數的分數
    }
  }

  return { score, strongSignals };
}

/**
 * 計算強信號加成的分數
 * @param {number} strongSignals - 強信號數量
 * @returns {number} 分數
 */
function scoreStrongSignalBonus(strongSignals) {
  if (strongSignals >= 3) {
    return 50; // 多個強信號組合，給予大幅加分
  } else if (strongSignals >= 2) {
    return 30;
  } else if (strongSignals >= 1) {
    return 15;
  }
  return 0;
}

/**
 * 計算最近期數的斐波那契模式分析分數
 * @param {number} num - 號碼
 * @param {Array} filtered - 過濾後的期數陣列
 * @param {Array} fibonacciSequence - 斐波那契數列
 * @returns {Object} { score, strongSignals }
 */
function scoreRecentPeriodFibonacciPattern(num, filtered, fibonacciSequence) {
  let score = 0;
  let strongSignals = 0;

  if (filtered.length >= 5) {
    const recentPeriods = filtered.slice(0, 10); // 最近10期（filtered已按日期排序，最新的在前）
    let recentMatches = 0;

    recentPeriods.forEach((period, idx) => {
      if (period.numbers.includes(num)) {
        // 檢查在最近期數中的出現是否符合斐波那契模式
        // 斐波那契序列是1-based (1, 1, 2, 3, 5, 8, 13, 21, 34)
        // 數組索引是0-based，所以使用 idx === fib - 1 來匹配
        fibonacciSequence.forEach(fib => {
          if (idx === fib - 1) { // Match Fibonacci-indexed position (convert 1-based to 0-based)
            recentMatches++;
          }
        });
      }
    });

    if (recentMatches > 0) {
      score += recentMatches * 15;
      if (recentMatches >= 2) {
        strongSignals++;
      }
    }
  }

  return { score, strongSignals };
}

/**
 * 計算斐波那契數列分數
 * 基於斐波那契數列和黃金比例來分析號碼出現的模式
 * @param {Array} allNumbers - 所有期數的號碼陣列
 * @param {Set} excludePeriodNumbers - 可選，要排除的期數集合（期數字串）
 * @param {Array} filteredNumbers - 可選，預先過濾後的數組（性能優化，避免重複過濾）
 * @returns {Object} 斐波那契分數
 */
function calculateFibonacciScore(allNumbers, excludePeriodNumbers = null, filteredNumbers = null) {
  const fibonacciScore = {};

  // 初始化所有可能的號碼 (1-49)
  for (let i = 1; i <= 49; i++) {
    fibonacciScore[i] = 0;
  }

  // 生成斐波那契數列（直到49以內）
  const fibonacciSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34];
  const fibonacciSet = new Set(fibonacciSequence);

  // 黃金比例
  const goldenRatio = 1.618033988749895;
  const goldenRatioInverse = 0.618033988749895;

  // 使用預過濾的數組（如果提供），否則過濾
  const filtered = filteredNumbers || (excludePeriodNumbers
    ? allNumbers.filter(period => !excludePeriodNumbers.has(period.periodNumber))
    : allNumbers);

  if (filtered.length === 0) {
    return { scores: fibonacciScore };
  }

  // 為每個號碼計算斐波那契相關分數
  for (let num = 1; num <= 49; num++) {
    let score = 0;
    let strongSignals = 0; // 強信號計數器

    // 1. 檢查號碼本身是否為斐波那契數
    const membershipResult = scoreSequenceMembership(num, fibonacciSet);
    score += membershipResult.score;
    if (membershipResult.strongSignal) {
      strongSignals++;
    }

    // 2. 分析該號碼出現的間隔模式
    const appearances = [];
    filtered.forEach((period, index) => {
      if (period.numbers.includes(num)) {
        appearances.push(index);
      }
    });

    // 計算間隔
    const gaps = [];
    if (appearances.length > 1) {
      for (let i = 1; i < appearances.length; i++) {
        gaps.push(appearances[i] - appearances[i - 1]);
      }
    }

    // 3. 間隔模式分析
    if (appearances.length > 1) {
      const gapResult = scoreGapPatterns(gaps, fibonacciSequence);
      score += gapResult.score;
      strongSignals += gapResult.strongSignals;

      // 4. 黃金比例分析
      const currentGap = filtered.length - 1 - appearances[appearances.length - 1];
      const goldenRatioResult = scoreGoldenRatioAnalysis(
        appearances, gaps, currentGap, filtered.length, goldenRatio, goldenRatioInverse
      );
      score += goldenRatioResult.score;
      strongSignals += goldenRatioResult.strongSignals;
    }

    // 5. 位置關係分析
    const positionResult = scorePositionRelationships(num, filtered, fibonacciSet);
    score += positionResult.score;
    strongSignals += positionResult.strongSignals;

    // 6. 週期性分析
    const gapSinceLast = appearances.length > 0
      ? filtered.length - 1 - appearances[appearances.length - 1]
      : 0;
    const periodicityResult = scorePeriodicityAnalysis(
      num, appearances, gaps, gapSinceLast, filtered.length,
      fibonacciSequence, goldenRatio, fibonacciSet
    );
    score += periodicityResult.score;
    strongSignals += periodicityResult.strongSignals;

    // 7. 強信號加成
    score += scoreStrongSignalBonus(strongSignals);

    // 9. 最近期數的斐波那契模式分析
    const recentResult = scoreRecentPeriodFibonacciPattern(num, filtered, fibonacciSequence);
    score += recentResult.score;
    strongSignals += recentResult.strongSignals;

    // 確保分數範圍，但允許更高的最大值以產生更大的差異
    fibonacciScore[num] = Math.min(200, Math.max(0, score)); // 提高上限到200以產生更大差異
  }

  return {
    scores: fibonacciScore,
    fibonacciSequence: fibonacciSequence,
    goldenRatio: Math.round(goldenRatio * 1000000) / 1000000
  };
}

module.exports = {
  calculateFibonacciScore
};
