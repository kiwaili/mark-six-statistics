const express = require('express');
const router = express.Router();
const lotteryService = require('../services/lotteryService');
const analysisService = require('../services/analysisService');

/**
 * 取得攪珠結果
 * GET /api/lottery/results?startYear=2025&endYear=2025
 */
router.get('/results', async (req, res) => {
  try {
    const startYear = req.query.startYear ? parseInt(req.query.startYear) : null;
    const endYear = req.query.endYear ? parseInt(req.query.endYear) : null;
    
    const results = await lotteryService.fetchLotteryResults(startYear, endYear);
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error('取得攪珠結果失敗:', error);
    res.status(500).json({
      success: false,
      message: '取得攪珠結果失敗',
      error: error.message
    });
  }
});

/**
 * 分析攪珠結果並預測下一期最有可能的號碼
 * POST /api/lottery/analyze
 * Body: { results: [...] }
 */
router.post('/analyze', async (req, res) => {
  try {
    const results = req.body.results;
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請提供有效的攪珠結果資料'
      });
    }
    
    const analysis = analysisService.analyzeNumbers(results);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('分析失敗:', error);
    res.status(500).json({
      success: false,
      message: '分析失敗',
      error: error.message
    });
  }
});

module.exports = router;

