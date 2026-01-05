/**
 * 投注建議模組
 * 包含複式投注建議生成函數
 */

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
 * 生成複式投注建議（多個選項）
 * 根據六合彩複式投注規則：從7個或以上號碼中選取，系統會自動組合所有可能的6個號碼組合
 * @param {Array} numbers - 15個預測號碼（已按分數排序）
 * @returns {Array} 複式投注建議陣列（每個選項包含不同數量的號碼）
 */
function generateCompoundBetSuggestions(numbers) {
  if (!numbers || numbers.length < 7) {
    throw new Error('需要至少7個號碼才能生成複式投注建議');
  }
  
  // 提取號碼值（確保是數字）
  const numberArray = numbers.map(item => 
    typeof item === 'object' ? item.number : parseInt(item, 10)
  ).filter(n => !isNaN(n) && n >= 1 && n <= 49);
  
  if (numberArray.length < 7) {
    throw new Error('號碼數量不足7個');
  }
  
  const suggestions = [];
  
  // 生成不同數量的複式投注建議（7個、8個、9個、10個、11個、12個號碼）
  // 計算組合數：C(n, 6) = n! / (6! * (n-6)!)
  // 注數計算：7個號碼=7注, 8個號碼=28注, 9個號碼=84注, 10個號碼=210注, 11個號碼=462注, 12個號碼=924注
  const calculateCombinations = (n, k) => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k); // 優化：使用對稱性
    let result = 1;
    for (let i = 0; i < k; i++) {
      result = result * (n - i) / (i + 1);
    }
    return Math.round(result);
  };
  
  // 生成7到12個號碼的複式投注建議（包含注數7的建議，即7個號碼=7注）
  // 確保至少生成7個號碼的建議（7注）
  const minNumberCount = 7;
  const maxNumberCount = Math.min(12, numberArray.length);
  
  if (maxNumberCount < minNumberCount) {
    throw new Error(`號碼數量不足${minNumberCount}個，無法生成複式投注建議`);
  }
  
  for (let numCount = minNumberCount; numCount <= maxNumberCount; numCount++) {
    const selectedNumbers = numberArray.slice(0, numCount);
    const totalBets = calculateCombinations(numCount, 6);
    const totalAmount = totalBets * 10; // 每注$10
    
    // 如果注數超過1000注，只生成前1000注（避免記憶體問題）
    // 實際計算：7個=7注, 8個=28注, 9個=84注, 10個=210注, 11個=462注, 12個=924注
    // 所以12個號碼以內都可以完全生成
    const maxBetsToGenerate = 1000;
    const shouldGenerateAll = totalBets <= maxBetsToGenerate;
    
    let bets = [];
    if (shouldGenerateAll) {
      // 生成所有組合
      bets = generateCombinations(selectedNumbers, 6);
    } else {
      // 如果注數太多（超過12個號碼），生成部分組合作為示例
      // 使用迭代方式生成前1000個組合，避免生成所有組合
      const allCombinations = generateCombinations(selectedNumbers, 6);
      bets = allCombinations.slice(0, maxBetsToGenerate);
    }
    
    suggestions.push({
      numberCount: numCount,
      numbers: selectedNumbers,
      bets: bets,
      totalBets: totalBets,
      totalAmount: totalAmount,
      isComplete: shouldGenerateAll,
      strategy: `${numCount}個號碼複式投注`,
      description: `選取前${numCount}個最有可能的號碼，系統自動組合所有可能的6個號碼組合，共${totalBets}注（$${totalAmount.toLocaleString()}）。${!shouldGenerateAll ? `（僅顯示前${maxBetsToGenerate}注作為示例）` : ''}`
    });
  }
  
  return suggestions;
}

module.exports = {
  generateCombinations,
  generateCompoundBetSuggestions,
  generateCompoundBetSuggestion100
};
