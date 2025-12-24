const axios = require('axios');
const cheerio = require('cheerio');
const LotteryResultDTO = require('../models/LotteryResultDTO');

/**
 * 從網頁抓取攪珠結果
 */
async function fetchLotteryResults() {
  try {
    const url = 'https://lottery.hk/liuhecai/jieguo/2025';
    
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
      throw new Error('未找到目標表格');
    }

    const results = [];

    // 解析表格行
    table.find('tbody tr').each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td');

      if (cells.length >= 3) {
        // 提取期數
        const periodNumber = $row.find('td').eq(0).text().trim();
        
        // 提取日期
        const date = $row.find('td').eq(1).text().trim();
        
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
    console.error('抓取資料失敗:', error);
    throw error;
  }
}

module.exports = {
  fetchLotteryResults
};

