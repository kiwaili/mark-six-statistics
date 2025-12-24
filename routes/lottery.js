const express = require('express');
const router = express.Router();
const lotteryService = require('../services/lotteryService');

/**
 * 取得攪珠結果
 * GET /api/lottery/results
 */
router.get('/results', async (req, res) => {
  try {
    const results = await lotteryService.fetchLotteryResults();
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

module.exports = router;

