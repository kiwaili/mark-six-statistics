/**
 * 工具函數模組
 * 包含數據提取、期數解析等通用功能
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
 * 解析期數字串（支援格式：25/132 或 2025001）
 * @param {string} periodNumber - 期數字串
 * @returns {Object} { year, period } 或 null
 */
function parsePeriodNumber(periodNumber) {
  if (!periodNumber) return null;

  // 格式 25/132 (年份/期數)
  const match1 = periodNumber.match(/^(\d{2})\/(\d+)$/);
  if (match1) {
    const shortYear = parseInt(match1[1], 10);
    // Convert 2-digit year to 4-digit (assuming 2000s)
    const year = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
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

module.exports = {
  extractAllNumbers,
  parsePeriodNumber,
  isNextPeriod
};
