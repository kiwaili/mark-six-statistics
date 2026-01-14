/**
 * 神經網絡模組
 * 使用多層感知器（MLP）學習歷史數據模式並預測號碼
 */

/**
 * 激活函數：Sigmoid
 * @param {number} x - 輸入值
 * @returns {number} 激活後的輸出值
 */
function sigmoid(x) {
  // 防止溢出
  if (x > 700) return 1;
  if (x < -700) return 0;
  return 1 / (1 + Math.exp(-x));
}

/**
 * 激活函數的導數
 * @param {number} x - 輸入值（通常是激活後的輸出）
 * @returns {number} 導數值
 */
function sigmoidDerivative(x) {
  return x * (1 - x);
}

/**
 * 初始化權重矩陣（Xavier初始化）
 * @param {number} inputSize - 輸入層大小
 * @param {number} outputSize - 輸出層大小
 * @returns {Array<Array<number>>} 權重矩陣
 */
function initializeWeights(inputSize, outputSize) {
  const weights = [];
  const limit = Math.sqrt(6 / (inputSize + outputSize));
  
  for (let i = 0; i < inputSize; i++) {
    weights[i] = [];
    for (let j = 0; j < outputSize; j++) {
      // Xavier初始化：均勻分布在 [-limit, limit]
      weights[i][j] = (Math.random() * 2 - 1) * limit;
    }
  }
  
  return weights;
}

/**
 * 初始化偏置向量
 * @param {number} size - 向量大小
 * @returns {Array<number>} 偏置向量
 */
function initializeBiases(size) {
  return Array(size).fill(0).map(() => (Math.random() * 2 - 1) * 0.1);
}

/**
 * 矩陣乘法
 * @param {Array<Array<number>>} a - 矩陣A
 * @param {Array<number>} b - 向量B
 * @returns {Array<number>} 結果向量
 */
function matrixVectorMultiply(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    let sum = 0;
    for (let j = 0; j < b.length; j++) {
      sum += a[i][j] * b[j];
    }
    result.push(sum);
  }
  return result;
}

/**
 * 前向傳播
 * @param {Array<number>} input - 輸入向量
 * @param {Object} network - 神經網絡結構
 * @returns {Object} 包含各層輸出的對象
 */
function forwardPropagation(input, network) {
  const activations = [input];
  const zValues = [];
  
  let currentInput = input;
  
  // 遍歷每一層
  for (let layer = 0; layer < network.weights.length; layer++) {
    // 計算加權和
    const z = matrixVectorMultiply(network.weights[layer], currentInput);
    
    // 加上偏置
    for (let i = 0; i < z.length; i++) {
      z[i] += network.biases[layer][i];
    }
    
    zValues.push(z);
    
    // 應用激活函數
    const activation = z.map(sigmoid);
    activations.push(activation);
    
    currentInput = activation;
  }
  
  return {
    activations,
    zValues
  };
}

/**
 * 反向傳播
 * @param {Array<number>} input - 輸入向量
 * @param {Array<number>} target - 目標輸出向量
 * @param {Object} network - 神經網絡結構
 * @param {Object} forwardResult - 前向傳播結果
 * @param {number} learningRate - 學習率
 * @returns {Object} 更新後的網絡
 */
function backPropagation(input, target, network, forwardResult, learningRate = 0.01) {
  const { activations, zValues } = forwardResult;
  const output = activations[activations.length - 1];
  
  // 計算輸出層誤差
  let errors = [];
  for (let i = 0; i < output.length; i++) {
    errors[i] = (target[i] - output[i]) * sigmoidDerivative(output[i]);
  }
  
  // 從輸出層向輸入層反向傳播
  const updatedWeights = network.weights.map(w => w.map(row => [...row]));
  const updatedBiases = network.biases.map(b => [...b]);
  
  for (let layer = network.weights.length - 1; layer >= 0; layer--) {
    const currentActivation = activations[layer];    
    
    // 更新權重和偏置
    for (let i = 0; i < network.weights[layer].length; i++) {
      for (let j = 0; j < network.weights[layer][i].length; j++) {
        updatedWeights[layer][i][j] += learningRate * errors[i] * currentActivation[j];
      }
      updatedBiases[layer][i] += learningRate * errors[i];
    }
    
    // 計算前一層的誤差（如果不是輸入層）
    if (layer > 0) {
      const newErrors = [];
      for (let j = 0; j < currentActivation.length; j++) {
        let error = 0;
        for (let i = 0; i < errors.length; i++) {
          error += errors[i] * network.weights[layer][i][j];
        }
        newErrors[j] = error * sigmoidDerivative(currentActivation[j]);
      }
      errors = newErrors;
    }
  }
  
  return {
    weights: updatedWeights,
    biases: updatedBiases
  };
}

/**
 * 將歷史數據轉換為神經網絡輸入特徵
 * @param {Array} historicalResults - 歷史開獎結果
 * @param {number} lookbackPeriods - 回看期數
 * @returns {Array<Array<number>>} 輸入特徵矩陣
 */
function prepareInputFeatures(historicalResults, lookbackPeriods = 10) {
  if (!historicalResults || historicalResults.length < lookbackPeriods) {
    return [];
  }
  
  const features = [];
  
  // 從最新期開始，往前取 lookbackPeriods 期
  for (let i = 0; i < historicalResults.length - lookbackPeriods; i++) {
    const feature = [];
    
    // 提取最近 lookbackPeriods 期的號碼特徵
    for (let j = 0; j < lookbackPeriods; j++) {
      const result = historicalResults[i + j];
      const numbers = result.numbers || [];
      
      // 為每個號碼（1-49）創建二進制特徵（是否出現）
      const numberVector = Array(49).fill(0);
      numbers.forEach(num => {
        if (num >= 1 && num <= 49) {
          numberVector[num - 1] = 1;
        }
      });
      
      feature.push(...numberVector);
    }
    
    // 添加統計特徵
    const recentNumbers = [];
    for (let j = 0; j < lookbackPeriods; j++) {
      const result = historicalResults[i + j];
      if (result.numbers) {
        recentNumbers.push(...result.numbers);
      }
    }
    
    // 頻率特徵（每個號碼在最近 lookbackPeriods 期出現的次數，正規化到 0-1）
    const frequencyVector = Array(49).fill(0);
    recentNumbers.forEach(num => {
      if (num >= 1 && num <= 49) {
        frequencyVector[num - 1]++;
      }
    });
    const maxFreq = Math.max(...frequencyVector, 1);
    const normalizedFreq = frequencyVector.map(f => f / maxFreq);
    feature.push(...normalizedFreq);
    
    features.push(feature);
  }
  
  return features;
}

/**
 * 將目標期數的號碼轉換為輸出標籤
 * @param {Array} targetResult - 目標期數的開獎結果
 * @returns {Array<number>} 輸出標籤向量（49維，每個號碼是否出現）
 */
function prepareOutputLabels(targetResult) {
  const labels = Array(49).fill(0);
  const numbers = targetResult.numbers || [];
  
  numbers.forEach(num => {
    if (num >= 1 && num <= 49) {
      labels[num - 1] = 1;
    }
  });
  
  return labels;
}

/**
 * 創建神經網絡
 * @param {number} inputSize - 輸入層大小
 * @param {Array<number>} hiddenLayers - 隱藏層大小陣列，例如 [64, 32]
 * @param {number} outputSize - 輸出層大小（49，對應1-49號碼）
 * @returns {Object} 神經網絡結構
 */
function createNeuralNetwork(inputSize, hiddenLayers = [64, 32], outputSize = 49) {
  const network = {
    weights: [],
    biases: [],
    inputSize,
    hiddenLayers,
    outputSize
  };
  
  // 創建輸入層到第一個隱藏層的權重
  let currentSize = inputSize;
  for (let i = 0; i < hiddenLayers.length; i++) {
    const nextSize = hiddenLayers[i];
    network.weights.push(initializeWeights(nextSize, currentSize));
    network.biases.push(initializeBiases(nextSize));
    currentSize = nextSize;
  }
  
  // 創建最後一個隱藏層到輸出層的權重
  network.weights.push(initializeWeights(outputSize, currentSize));
  network.biases.push(initializeBiases(outputSize));
  
  return network;
}

/**
 * 訓練神經網絡
 * @param {Object} network - 神經網絡結構
 * @param {Array<Array<number>>} inputs - 輸入特徵矩陣
 * @param {Array<Array<number>>} targets - 目標輸出矩陣
 * @param {Object} options - 訓練選項
 * @param {number} options.epochs - 訓練輪數（預設50）
 * @param {number} options.learningRate - 學習率（預設0.01）
 * @param {number} options.batchSize - 批次大小（預設10）
 * @returns {Object} 訓練後的網絡和訓練歷史
 */
function trainNeuralNetwork(network, inputs, targets, options = {}) {
  const {
    epochs = 50,
    learningRate = 0.01,
    batchSize = 10
  } = options;
  
  if (inputs.length !== targets.length) {
    throw new Error('輸入和目標的數量必須相同');
  }
  
  const trainingHistory = {
    losses: [],
    accuracies: []
  };
  
  let currentNetwork = {
    weights: network.weights.map(w => w.map(row => [...row])),
    biases: network.biases.map(b => [...b])
  };
  
  // 訓練多個epoch
  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;
    let correctPredictions = 0;
    
    // 隨機打亂數據
    const indices = Array.from({ length: inputs.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // 批次訓練
    for (let batch = 0; batch < Math.ceil(inputs.length / batchSize); batch++) {
      const batchIndices = indices.slice(
        batch * batchSize,
        Math.min((batch + 1) * batchSize, inputs.length)
      );
      
      // 累積梯度
      const gradientWeights = currentNetwork.weights.map(w => 
        w.map(row => Array(row.length).fill(0))
      );
      const gradientBiases = currentNetwork.biases.map(b => 
        Array(b.length).fill(0)
      );
      
      // 計算批次梯度
      for (const idx of batchIndices) {
        const input = inputs[idx];
        const target = targets[idx];
        
        const forwardResult = forwardPropagation(input, currentNetwork);
        const output = forwardResult.activations[forwardResult.activations.length - 1];
        
        // 計算損失（均方誤差）
        let loss = 0;
        for (let i = 0; i < output.length; i++) {
          loss += Math.pow(target[i] - output[i], 2);
        }
        totalLoss += loss / output.length;
        
        // 計算準確率（預測前6個最高概率的號碼，看是否包含實際號碼）
        const predictedIndices = output
          .map((val, idx) => ({ val, idx }))
          .sort((a, b) => b.val - a.val)
          .slice(0, 6)
          .map(item => item.idx);
        const actualIndices = target
          .map((val, idx) => ({ val, idx }))
          .filter(item => item.val > 0.5)
          .map(item => item.idx);
        
        const hits = predictedIndices.filter(idx => actualIndices.includes(idx)).length;
        if (hits >= 3) {
          correctPredictions++;
        }
        
        // 反向傳播
        const updated = backPropagation(input, target, currentNetwork, forwardResult, learningRate);
        
        // 累積梯度
        for (let layer = 0; layer < currentNetwork.weights.length; layer++) {
          for (let i = 0; i < currentNetwork.weights[layer].length; i++) {
            for (let j = 0; j < currentNetwork.weights[layer][i].length; j++) {
              gradientWeights[layer][i][j] += 
                (updated.weights[layer][i][j] - currentNetwork.weights[layer][i][j]) / batchIndices.length;
            }
          }
          for (let i = 0; i < currentNetwork.biases[layer].length; i++) {
            gradientBiases[layer][i] += 
              (updated.biases[layer][i] - currentNetwork.biases[layer][i]) / batchIndices.length;
          }
        }
      }
      
      // 更新權重和偏置
      for (let layer = 0; layer < currentNetwork.weights.length; layer++) {
        for (let i = 0; i < currentNetwork.weights[layer].length; i++) {
          for (let j = 0; j < currentNetwork.weights[layer][i].length; j++) {
            currentNetwork.weights[layer][i][j] += gradientWeights[layer][i][j];
          }
        }
        for (let i = 0; i < currentNetwork.biases[layer].length; i++) {
          currentNetwork.biases[layer][i] += gradientBiases[layer][i];
        }
      }
    }
    
    const avgLoss = totalLoss / inputs.length;
    const accuracy = correctPredictions / inputs.length;
    
    trainingHistory.losses.push(avgLoss);
    trainingHistory.accuracies.push(accuracy);
    
    // 減少日誌輸出以提高性能（只在最後一個epoch或每20個epoch輸出一次）
    if ((epoch + 1) % 20 === 0 || epoch === epochs - 1) {
      // 只在開發環境或需要調試時輸出
      if (process.env.NODE_ENV === 'development') {
        console.log(`Neural Network Epoch ${epoch + 1}/${epochs} - Loss: ${avgLoss.toFixed(4)}, Accuracy: ${(accuracy * 100).toFixed(2)}%`);
      }
    }
  }
  
  return {
    network: currentNetwork,
    history: trainingHistory
  };
}

/**
 * 使用神經網絡進行預測
 * @param {Object} network - 訓練後的神經網絡
 * @param {Array<number>} input - 輸入特徵向量
 * @returns {Object} 預測結果，包含每個號碼的預測概率
 */
function predictWithNeuralNetwork(network, input) {
  const forwardResult = forwardPropagation(input, network);
  const output = forwardResult.activations[forwardResult.activations.length - 1];
  
  // 將輸出轉換為號碼預測分數（1-49）
  const predictions = {};
  for (let i = 0; i < output.length; i++) {
    predictions[i + 1] = output[i];
  }
  
  return {
    predictions,
    topNumbers: Object.entries(predictions)
      .map(([num, score]) => ({ number: parseInt(num), score }))
      .sort((a, b) => b.score - a.score)
  };
}

/**
 * 在迭代驗證中使用神經網絡進行預測和權重調整
 * @param {Array} historicalResults - 歷史開獎結果
 * @param {number} lookbackPeriods - 回看期數（用於準備特徵）
 * @param {Object} options - 選項
 * @returns {Object} 神經網絡預測結果和調整建議
 */
function neuralNetworkAnalysis(historicalResults, lookbackPeriods = 10, options = {}) {
  if (!historicalResults || historicalResults.length < lookbackPeriods + 1) {
    return {
      predictions: {},
      topNumbers: [],
      network: null,
      error: '資料不足，無法進行神經網絡分析'
    };
  }
  
  try {
    // 準備訓練數據（優化：限制數據量以提高速度）
    const maxTrainingSamples = options.maxTrainingSamples || 30; // 限制訓練樣本數量
    const limitedResults = historicalResults.slice(0, Math.min(maxTrainingSamples + lookbackPeriods, historicalResults.length));
    
    const inputs = prepareInputFeatures(limitedResults, lookbackPeriods);
    const targets = [];
    
    for (let i = 0; i < inputs.length; i++) {
      const targetIndex = i + lookbackPeriods;
      if (targetIndex < limitedResults.length) {
        targets.push(prepareOutputLabels(limitedResults[targetIndex]));
      }
    }
    
    // 確保輸入和目標數量匹配
    const minLength = Math.min(inputs.length, targets.length);
    const trimmedInputs = inputs.slice(0, minLength);
    const trimmedTargets = targets.slice(0, minLength);
    
    if (trimmedInputs.length < 10) {
      return {
        predictions: {},
        topNumbers: [],
        network: null,
        error: '訓練數據不足（需要至少10個樣本）'
      };
    }
    
    // 創建神經網絡（優化：使用較小的網絡以提高速度）
    const inputSize = trimmedInputs[0].length;
    // 使用較小的隱藏層以提高訓練速度
    const hiddenLayers = options.hiddenLayers || [32, 16]; // 從 [64, 32] 減少到 [32, 16]
    const network = createNeuralNetwork(inputSize, hiddenLayers, 49);
    
    // 訓練神經網絡（使用較少的epoch以加快速度）
    const trainingOptions = {
      epochs: options.epochs || 15, // 默認減少到15
      learningRate: options.learningRate || 0.01,
      batchSize: options.batchSize || 5 // 默認減少批次大小
    };
    
    const trainingResult = trainNeuralNetwork(network, trimmedInputs, trimmedTargets, trainingOptions);
    
    // 使用最新的數據進行預測
    const latestInput = prepareInputFeatures(
      historicalResults.slice(0, lookbackPeriods + 1),
      lookbackPeriods
    );
    
    if (latestInput.length > 0) {
      const prediction = predictWithNeuralNetwork(trainingResult.network, latestInput[0]);
      
      return {
        predictions: prediction.predictions,
        topNumbers: prediction.topNumbers,
        network: trainingResult.network,
        trainingHistory: trainingResult.history,
        inputSize,
        hiddenLayers: hiddenLayers,
        outputSize: 49
      };
    } else {
      return {
        predictions: {},
        topNumbers: [],
        network: trainingResult.network,
        trainingHistory: trainingResult.history,
        error: '無法準備預測輸入'
      };
    }
  } catch (error) {
    // 減少錯誤日誌輸出
    if (process.env.NODE_ENV === 'development') {
      console.error('神經網絡分析錯誤:', error);
    }
    return {
      predictions: {},
      topNumbers: [],
      network: null,
      error: error.message
    };
  }
}

module.exports = {
  createNeuralNetwork,
  trainNeuralNetwork,
  predictWithNeuralNetwork,
  neuralNetworkAnalysis,
  prepareInputFeatures,
  prepareOutputLabels,
  sigmoid,
  sigmoidDerivative
};
