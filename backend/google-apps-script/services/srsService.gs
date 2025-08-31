/**
 * SRS (Spaced Repetition System) 算法服務
 * 
 * 職責：實作Leitner Box和SM-2算法，與前端srs.ts保持一致
 * 模式：純函數設計，無副作用，易於測試
 */

const SrsService = {
  /**
   * 計算下次複習時間（統一入口）
   * @param {Object} card - 當前卡片狀態
   * @param {number} quality - 評分 (1=困難, 2=普通, 3=容易)
   * @param {string} algorithm - 算法類型 ('leitner' | 'sm2')
   * @param {Date} reviewDate - 複習日期（可選，預設為當前時間）
   * @returns {Object} 更新後的SRS欄位
   */
  calculateNextReview: function(card, quality, algorithm, reviewDate) {
    const now = reviewDate || new Date();
    
    if (algorithm === 'sm2') {
      return this.calculateSM2(card, quality, now);
    } else {
      return this.calculateLeitner(card, quality, now);
    }
  },
  
  /**
   * Leitner Box 算法實作
   * @param {Object} card - 當前卡片狀態
   * @param {number} quality - 評分 (1-3)
   * @param {Date} reviewDate - 複習日期
   * @returns {Object} 更新後的SRS欄位
   */
  calculateLeitner: function(card, quality, reviewDate) {
    let newBox = card.box || 1;
    const intervals = Config.LEITNER.INTERVALS;
    
    // 根據評分決定盒子變化
    switch (quality) {
      case 3: // 容易 - 升級到下一個盒子
        newBox = Math.min(Config.LEITNER.MAX_BOX, newBox + 1);
        break;
      case 2: // 普通 - 保持在當前盒子
        newBox = newBox;
        break;
      case 1: // 困難 - 回到第一個盒子
        newBox = 1;
        break;
      default:
        throw new Error('Invalid quality value: ' + quality + '. Must be 1, 2, or 3.');
    }
    
    // 計算間隔天數
    const intervalDays = intervals[newBox] || 0;
    
    // 計算下次複習日期
    const nextReviewDate = new Date(reviewDate);
    nextReviewDate.setDate(reviewDate.getDate() + intervalDays);
    
    // 回傳更新的欄位
    return {
      box: newBox,
      ease: card.ease || Config.SM2.DEFAULT_EASE, // Leitner不使用ease，但保持欄位一致性
      reps: (card.reps || 0) + 1,
      interval: intervalDays,
      nextReviewAt: nextReviewDate.toISOString()
    };
  },
  
  /**
   * SM-2 算法實作
   * 基於SuperMemo-2算法，適配3級評分系統
   * @param {Object} card - 當前卡片狀態
   * @param {number} quality - 評分 (1-3)
   * @param {Date} reviewDate - 複習日期
   * @returns {Object} 更新後的SRS欄位
   */
  calculateSM2: function(card, quality, reviewDate) {
    let ease = card.ease || Config.SM2.DEFAULT_EASE;
    let reps = card.reps || Config.SM2.DEFAULT_REPS;
    let interval = card.interval || Config.SM2.DEFAULT_INTERVAL;
    
    if (quality === 1) {
      // 困難：重置學習進度
      reps = 0;
      interval = 1;
      ease = Math.max(Config.SM2.MIN_EASE, ease - 0.2);
    } else {
      // 普通或容易：正常進階
      reps += 1;
      
      // 調整ease factor
      if (quality === 3) {
        ease = Math.min(Config.SM2.MAX_EASE, ease + 0.1);
      }
      // quality === 2時ease不變
      
      // 計算新間隔
      if (reps === 1) {
        interval = 1;
      } else if (reps === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease);
      }
    }
    
    // 計算下次複習日期
    const nextReviewDate = new Date(reviewDate);
    nextReviewDate.setDate(reviewDate.getDate() + interval);
    
    // 回傳更新的欄位
    return {
      box: card.box || 1, // SM-2不使用box，但保持欄位一致性
      ease: Number(ease.toFixed(2)), // 保持2位小數
      reps: reps,
      interval: interval,
      nextReviewAt: nextReviewDate.toISOString()
    };
  },
  
  /**
   * 預測間隔天數（用於前端按鈕顯示）
   * 與前端predictNextInterval.ts功能一致
   * @param {Object} card - 當前卡片狀態
   * @param {number} quality - 預期評分 (1-3)
   * @param {string} algorithm - 算法類型
   * @returns {number} 預測的間隔天數
   */
  predictNextIntervalDays: function(card, quality, algorithm) {
    try {
      const result = this.calculateNextReview(card, quality, algorithm);
      return result.interval;
    } catch (error) {
      Logger.log('SrsService.predictNextIntervalDays error: ' + error.toString());
      return 0; // 錯誤時回傳0，避免前端顯示異常
    }
  },
  
  /**
   * 驗證SRS參數
   * @param {Object} card - 卡片對象
   * @param {number} quality - 評分
   * @param {string} algorithm - 算法類型
   * @throws {Error} 參數無效時拋出錯誤
   */
  validateSrsParams: function(card, quality, algorithm) {
    // 驗證卡片對象
    if (!card || typeof card !== 'object') {
      throw new Error('Invalid card object');
    }
    
    // 驗證評分
    if (![1, 2, 3].includes(quality)) {
      throw new Error('Quality must be 1, 2, or 3');
    }
    
    // 驗證算法
    if (!['leitner', 'sm2'].includes(algorithm)) {
      throw new Error('Algorithm must be "leitner" or "sm2"');
    }
    
    // 驗證卡片必要欄位
    if (typeof card.box !== 'number' || card.box < 1 || card.box > 5) {
      throw new Error('Card box must be number between 1-5');
    }
    
    if (typeof card.ease !== 'number' || card.ease < 1.3 || card.ease > 3.0) {
      throw new Error('Card ease must be number between 1.3-3.0');
    }
    
    if (typeof card.reps !== 'number' || card.reps < 0) {
      throw new Error('Card reps must be non-negative number');
    }
  },
  
  /**
   * 測試SRS算法功能（用於健康檢查）
   * @returns {Object} 測試結果
   */
  testAlgorithms: function() {
    try {
      const testCard = {
        id: 'test-card',
        box: 1,
        ease: 2.5,
        reps: 0,
        interval: 0
      };
      
      const testResults = {};
      
      // 測試Leitner算法
      try {
        const leitnerResult = this.calculateLeitner(testCard, 2, new Date());
        testResults.leitner = {
          status: 'pass',
          result: leitnerResult
        };
      } catch (leitnerError) {
        testResults.leitner = {
          status: 'fail',
          error: leitnerError.message
        };
      }
      
      // 測試SM-2算法
      try {
        const sm2Result = this.calculateSM2(testCard, 2, new Date());
        testResults.sm2 = {
          status: 'pass',
          result: sm2Result
        };
      } catch (sm2Error) {
        testResults.sm2 = {
          status: 'fail',
          error: sm2Error.message
        };
      }
      
      // 測試預測功能
      try {
        const predictedInterval = this.predictNextIntervalDays(testCard, 3, 'leitner');
        testResults.prediction = {
          status: 'pass',
          predictedInterval: predictedInterval
        };
      } catch (predictError) {
        testResults.prediction = {
          status: 'fail',
          error: predictError.message
        };
      }
      
      return {
        overall: 'completed',
        tests: testResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      Logger.log('SrsService.testAlgorithms error: ' + error.toString());
      return {
        overall: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 獲取算法配置資訊
   * @param {string} algorithm - 算法類型
   * @returns {Object} 算法配置
   */
  getAlgorithmConfig: function(algorithm) {
    if (algorithm === 'sm2') {
      return {
        name: 'SM-2',
        description: 'SuperMemo-2 Algorithm',
        config: Config.SM2,
        features: ['Dynamic ease factor', 'Exponential intervals', 'Mistake penalty']
      };
    } else {
      return {
        name: 'Leitner Box',
        description: 'Leitner Box System',
        config: Config.LEITNER,
        features: ['Fixed intervals', 'Box progression', 'Simple and reliable']
      };
    }
  }
};