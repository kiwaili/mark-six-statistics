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
    const weights = req.body.weights; // 可選的權重參數
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請提供有效的攪珠結果資料'
      });
    }
    
    // 如果提供了權重參數，使用它；否則使用預設權重
    const analysis = analysisService.analyzeNumbers(results, weights || {});
    
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

/**
 * 迭代驗證分析：從最新期數往前推N期開始，逐步驗證並調整
 * POST /api/lottery/validate
 * Body: { results: [...], lookbackPeriods: 10 }
 */
router.post('/validate', async (req, res) => {
  try {
    const results = req.body.results;
    const lookbackPeriods = req.body.lookbackPeriods || 10;
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請提供有效的攪珠結果資料'
      });
    }
    
    const validation = analysisService.iterativeValidation(results, lookbackPeriods);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('迭代驗證失敗:', error);
    res.status(500).json({
      success: false,
      message: '迭代驗證失敗',
      error: error.message
    });
  }
});

module.exports = router;

