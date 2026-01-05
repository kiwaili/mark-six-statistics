/**
 * 號碼選擇策略模組
 * 包含各種選擇策略和候選組合生成函數
 */

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

module.exports = {
  selectOptimalNumbers,
  generateMultipleCandidates,
  selectWithDiversity,
  selectBalanced,
  selectEvenlyDistributed,
  selectTop4Plus2,
  selectTop5Plus1,
  selectHybrid,
  selectBasedOnHistory,
  determineStrategy
};
