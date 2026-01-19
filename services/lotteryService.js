const axios = require('axios');
const cheerio = require('cheerio');
const LotteryResultDTO = require('../models/LotteryResultDTO');

/**
 * 將日期從 dd/mm/yyyy 格式轉換為 yyyy-mm-dd 格式
 * @param {string} dateStr - dd/mm/yyyy 格式的日期字串
 * @returns {string} yyyy-mm-dd 格式的日期字串
 */
function convertDateFormat(dateStr) {
  if (!dateStr) return dateStr;

  // 匹配 dd/mm/yyyy 格式
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  // 如果格式不符合，返回原始字串
  return dateStr;
}

/**
 * 從網頁抓取單一年份的攪珠結果
 */
async function fetchLotteryResultsByYear(year) {
  try {
    const url = `https://lottery.hk/liuhecai/jieguo/${year}`;

    // 取得網頁內容
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 查找目標表格
    const table = $('table.-center._results');

    if (table.length === 0) {
      console.warn(`年份 ${year} 未找到目標表格`);
      return [];
    }

    const results = [];

    // 解析表格行
    table.find('tbody tr').each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td');

      if (cells.length >= 3) {
        // 提取期數
        const periodNumber = $row.find('td').eq(0).text().trim();

        // 提取日期並轉換格式 (dd/mm/yyyy -> yyyy-mm-dd)
        const rawDate = $row.find('td').eq(1).text().trim();
        const date = convertDateFormat(rawDate);

        // 提取號碼（可能有多列）
        const numbers = [];
        for (let i = 2; i < cells.length; i++) {
          const num = $(cells[i]).text().trim();
          if (num) {
            numbers.push(num);
          }
        }

        if (periodNumber && date) {
          const result = LotteryResultDTO.fromTableRow({
            periodNumber,
            date,
            numbers
          });
          results.push(result);
        }
      }
    });

    return results.map(r => r.toJSON());
  } catch (error) {
    console.error(`抓取年份 ${year} 資料失敗:`, error);
    // 如果某一年份失敗，返回空陣列而不是拋出錯誤
    return [];
  }
}

/**
 * 從網頁抓取攪珠結果（支援年份範圍）
 * @param {number} startYear - 開始年份
 * @param {number} endYear - 結束年份
 */
async function fetchLotteryResults(startYear, endYear) {
  try {
    const currentYear = new Date().getFullYear();
    const start = startYear || currentYear;
    const end = endYear || currentYear;

    // 確保年份範圍合理
    if (start > end) {
      throw new Error('開始年份不能大於結束年份');
    }

    const allResults = [];

    // 並行抓取所有年份的資料
    const yearPromises = [];
    for (let year = start; year <= end; year++) {
      yearPromises.push(fetchLotteryResultsByYear(year));
    }

    const yearResults = await Promise.all(yearPromises);

    // 合併所有年份的結果
    yearResults.forEach(results => {
      allResults.push(...results);
    });

    // 按日期排序（最新的在前，由近至遠）
    allResults.sort((a, b) => {
      // 解析日期，支援多種格式
      const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);

        // 嘗試直接解析
        let date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }

        // 處理中文日期格式：2025年1月1日 或 2025-01-01 等
        // 移除"年"、"月"、"日"等字符
        const cleaned = dateStr.replace(/[年月日]/g, '-').replace(/[^\d-]/g, '');
        const parts = cleaned.split('-').filter(p => p);

        if (parts.length >= 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // 月份從0開始
          const day = parseInt(parts[2]);
          date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }

        // 如果都無法解析，返回最小日期
        return new Date(0);
      };

      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);

      // 降序排序：dateB - dateA（最新的在前）
      return dateB.getTime() - dateA.getTime();
    });

    return allResults;
  } catch (error) {
    console.error('抓取資料失敗:', error);
    throw error;
  }
}

module.exports = {
  fetchLotteryResults
};

