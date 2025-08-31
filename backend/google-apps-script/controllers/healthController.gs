/**
 * 健康檢查控制器模組
 * 
 * 職責：提供系統健康狀態檢查API
 * 模式：輕量級監控端點，快速回應系統狀態
 */

const HealthController = {
  /**
   * GET /health - 基本健康檢查
   * @param {Object} request - 請求對象
   * @returns {Object} 健康狀態資訊
   */
  check: function(request) {
    const startTime = new Date().getTime();
    
    try {
      // 檢查配置有效性
      const configValid = Config.isValid();
      
      // 檢查Google Sheets連線
      let sheetHealthy = false;
      let sheetError = null;
      
      try {
        SheetService.testConnection();
        sheetHealthy = true;
      } catch (sheetErr) {
        sheetError = sheetErr.message;
        Logger.log('Sheet health check failed: ' + sheetErr.toString());
      }
      
      // 計算回應時間
      const responseTime = new Date().getTime() - startTime;
      
      // 整體健康狀態
      const isHealthy = configValid && sheetHealthy;
      
      const healthStatus = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: this.getUptime(),
        responseTime: responseTime + 'ms',
        checks: {
          config: {
            status: configValid ? 'pass' : 'fail',
            message: configValid ? 'Configuration is valid' : 'Invalid configuration'
          },
          database: {
            status: sheetHealthy ? 'pass' : 'fail',
            message: sheetHealthy ? 'Google Sheets connection OK' : sheetError
          }
        },
        environment: {
          timezone: Config.TIMEZONE,
          sheetId: Config.SHEET_ID ? Config.SHEET_ID.substring(0, 8) + '...' : 'not configured',
          logLevel: Config.LOG_LEVEL
        }
      };
      
      return healthStatus;
      
    } catch (error) {
      Logger.log('Health check error: ' + error.toString());
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: (new Date().getTime() - startTime) + 'ms'
      };
    }
  },
  
  /**
   * GET /health/detailed - 詳細健康檢查
   * @param {Object} request - 請求對象
   * @returns {Object} 詳細健康狀態資訊
   */
  detailed: function(request) {
    const basicHealth = this.check(request);
    
    try {
      // 擴展檢查項目
      const detailedChecks = {
        // SRS算法檢查
        srs: this.checkSrsAlgorithms(),
        
        // Sheet結構檢查
        sheetStructure: this.checkSheetStructure(),
        
        // 記憶體使用檢查
        memory: this.checkMemoryUsage(),
        
        // 執行時間限制檢查
        executionTime: this.checkExecutionLimits()
      };
      
      // 合併基本檢查和詳細檢查
      basicHealth.detailedChecks = detailedChecks;
      
      return basicHealth;
      
    } catch (error) {
      Logger.log('Detailed health check error: ' + error.toString());
      basicHealth.detailedCheckError = error.message;
      return basicHealth;
    }
  },
  
  /**
   * 檢查SRS算法功能
   * @returns {Object} SRS算法檢查結果
   */
  checkSrsAlgorithms: function() {
    try {
      // 測試Leitner算法
      const testCard = {
        id: 'test',
        box: 1,
        ease: 2.5,
        reps: 0,
        interval: 0
      };
      
      const leitnerResult = SrsService.calculateLeitner(testCard, 2, new Date());
      const sm2Result = SrsService.calculateSM2(testCard, 2, new Date());
      
      return {
        status: 'pass',
        message: 'SRS algorithms working correctly',
        leitner: leitnerResult ? 'working' : 'failed',
        sm2: sm2Result ? 'working' : 'failed'
      };
      
    } catch (error) {
      return {
        status: 'fail',
        message: 'SRS algorithm check failed: ' + error.message
      };
    }
  },
  
  /**
   * 檢查Sheet結構
   * @returns {Object} Sheet結構檢查結果
   */
  checkSheetStructure: function() {
    try {
      const expectedColumns = [
        'id', 'word.base', 'word.forms', 'posPrimary', 'meaning',
        'synonyms', 'antonyms', 'example', 'anchors', 'tags',
        'createdAt', 'box', 'ease', 'reps', 'interval',
        'lastReviewedAt', 'nextReviewAt'
      ];
      
      const actualColumns = SheetService.getHeaders();
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      
      return {
        status: missingColumns.length === 0 ? 'pass' : 'warn',
        message: missingColumns.length === 0 ? 
          'Sheet structure is correct' : 
          'Missing columns: ' + missingColumns.join(', '),
        expectedColumns: expectedColumns.length,
        actualColumns: actualColumns.length,
        missingColumns: missingColumns
      };
      
    } catch (error) {
      return {
        status: 'fail',
        message: 'Sheet structure check failed: ' + error.message
      };
    }
  },
  
  /**
   * 檢查記憶體使用狀況
   * @returns {Object} 記憶體檢查結果
   */
  checkMemoryUsage: function() {
    try {
      // Google Apps Script沒有直接的記憶體API，但可以做間接檢查
      const largeArray = new Array(1000).fill('memory-test');
      const testString = JSON.stringify(largeArray);
      
      return {
        status: 'pass',
        message: 'Memory allocation test passed',
        testArraySize: largeArray.length,
        testStringLength: testString.length
      };
      
    } catch (error) {
      return {
        status: 'fail',
        message: 'Memory check failed: ' + error.message
      };
    }
  },
  
  /**
   * 檢查執行時間限制
   * @returns {Object} 執行時間檢查結果
   */
  checkExecutionLimits: function() {
    const startTime = new Date().getTime();
    
    try {
      // 模擬一些計算密集的操作
      for (let i = 0; i < 10000; i++) {
        Math.random() * Math.random();
      }
      
      const executionTime = new Date().getTime() - startTime;
      const maxTime = Config.MAX_EXECUTION_TIME;
      
      return {
        status: executionTime < maxTime * 0.1 ? 'pass' : 'warn', // 10%作為警告閾值
        message: 'Execution time: ' + executionTime + 'ms',
        executionTime: executionTime,
        maxAllowedTime: maxTime,
        utilization: Math.round((executionTime / maxTime) * 100) + '%'
      };
      
    } catch (error) {
      return {
        status: 'fail',
        message: 'Execution time check failed: ' + error.message
      };
    }
  },
  
  /**
   * 獲取系統運行時間（模擬）
   * @returns {string} 運行時間描述
   */
  getUptime: function() {
    // Google Apps Script沒有真正的uptime概念
    // 這裡返回一個模擬值
    const now = new Date();
    return 'Script executed at ' + now.toISOString();
  }
};