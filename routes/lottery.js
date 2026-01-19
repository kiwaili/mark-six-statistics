const express = require('express');
const router = express.Router();
const lotteryService = require('../services/lotteryService');
const analysisService = require('../services/analysisService');
const simulationService = require('../services/simulation');

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
 * 迭代驗證分析：從最新期數往前推N期開始，逐步驗證並調整（使用 SSE 顯示進度）
 * POST /api/lottery/validate
 * Body: { results: [...], lookbackPeriods: 100 }
 */
router.post('/validate', async (req, res) => {
  try {
    const results = req.body.results;
    const lookbackPeriods = req.body.lookbackPeriods || 100;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請提供有效的攪珠結果資料'
      });
    }

    // 設置 SSE 響應頭
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 緩衝
    // 定義進度回調函數
    let clientClosed = false;
    req.on('close', () => { clientClosed = true; });
    const progressCallback = (progressData) => {
      if (clientClosed || res.writableEnded) return;
      try {
        // 確保進度數據包含 type 字段
        const dataWithType = {
          type: 'progress',
          ...progressData
        };
        res.write(`data: ${JSON.stringify(dataWithType)}\n\n`);
      } catch (err) {
        console.error('發送進度更新失敗:', err);
      }
    };
    // 發送開始消息
    res.write(`data: ${JSON.stringify({ type: 'start', message: '開始迭代驗證...' })}\n\n`);
    // 在異步上下文中執行驗證
    setImmediate(async () => {
      try {
        // 執行驗證，傳入進度回調
        const validation = await Promise.resolve(
          analysisService.iterativeValidation(results, lookbackPeriods, 50, progressCallback)
        );
        // 發送完成消息和結果
        if (!clientClosed && !res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'complete', message: '迭代驗證完成' })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'result', data: validation })}\n\n`);
          res.end();
        }
      } catch (error) {
        console.error('迭代驗證失敗:', error);
        try {
          res.write(`data: ${JSON.stringify({
            type: 'error',
            message: '迭代驗證失敗',
            error: error.message
          })}\n\n`);
        } catch (writeErr) {
          console.error('發送錯誤消息失敗:', writeErr);
        }
        res.end();
      }
    });
  } catch (error) {
    console.error('迭代驗證路由錯誤:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '迭代驗證失敗',
        error: error.message
      });
    }
  }
});

/**
 * 迭代模擬優化預測號碼
 * POST /api/lottery/simulate
 * Body: { 
 *   results: [...], 
 *   predictedNumbers: [1,2,3,4,5,6] (可選),
 *   options: {
 *     simulationRounds: 1000,
 *     maxIterations: 10,
 *     hitThreshold: 0.1,
 *     minKeepCount: 2,
 *     weights: {}
 *   }
 * }
 */
router.post('/simulate', async (req, res) => {
  try {
    const results = req.body.results;
    const predictedNumbers = req.body.predictedNumbers;
    const options = req.body.options || {};

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請提供有效的攪珠結果資料'
      });
    }

    // 如果提供了預測號碼，驗證格式
    if (predictedNumbers !== undefined) {
      if (!Array.isArray(predictedNumbers) || predictedNumbers.length !== 6) {
        return res.status(400).json({
          success: false,
          message: '預測號碼必須是6個號碼的陣列'
        });
      }
    }

    // 使用 Promise.resolve 包装同步函数调用
    const simulationResult = await Promise.resolve(
      simulationService.iterativeSimulationOptimization(
        results,
        predictedNumbers,
        options
      )
    );

    res.json({
      success: true,
      data: simulationResult
    });
  } catch (error) {
    console.error('模擬優化失敗:', error);
    res.status(500).json({
      success: false,
      message: '模擬優化失敗',
      error: error.message
    });
  }
});

/**
 * 批量模擬測試
 * POST /api/lottery/simulate/batch
 * Body: { 
 *   results: [...], 
 *   predictedNumbers: [1,2,3,4,5,6],
 *   rounds: 1000,
 *   batchSize: 100
 * }
 */
router.post('/simulate/batch', async (req, res) => {
  try {
    const results = req.body.results;
    const predictedNumbers = req.body.predictedNumbers;
    const rounds = req.body.rounds || 1000;
    const batchSize = req.body.batchSize || 100;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請提供有效的攪珠結果資料'
      });
    }

    if (!predictedNumbers || !Array.isArray(predictedNumbers) || predictedNumbers.length !== 6) {
      return res.status(400).json({
        success: false,
        message: '請提供6個預測號碼'
      });
    }

    // 使用 Promise.resolve 包装同步函数调用
    const batchResult = await Promise.resolve(
      simulationService.batchSimulationTest(
        results,
        predictedNumbers,
        rounds,
        batchSize
      )
    );

    res.json({
      success: true,
      data: batchResult
    });
  } catch (error) {
    console.error('批量模擬測試失敗:', error);
    res.status(500).json({
      success: false,
      message: '批量模擬測試失敗',
      error: error.message
    });
  }
});

module.exports = router;

