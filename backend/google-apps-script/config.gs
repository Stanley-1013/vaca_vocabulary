/**
 * 配置管理模組
 * 
 * 職責：集中管理所有配置項目
 * 模式：單例配置對象，類似前端的config.ts
 */

const Config = {
  // Google Sheets 配置
  SHEET_ID: '1eZmBKuJQocALTnA1VZem6oushLIRq4sGKvKbyxfohTM', // VACA 背單字資料庫
  SHEET_NAME: 'cards',
  
  // 時區配置
  TIMEZONE: 'Asia/Taipei',
  
  // 性能配置
  MAX_EXECUTION_TIME: 300000, // 5分鐘 (毫秒)
  MAX_CARDS_PER_REQUEST: 100,  // 單次請求最大卡片數
  
  // SRS算法配置
  LEITNER: {
    INTERVALS: [0, 1, 2, 3, 7, 14], // 對應box 0-5的間隔天數
    MAX_BOX: 5
  },
  
  SM2: {
    DEFAULT_EASE: 2.5,
    DEFAULT_REPS: 0,
    DEFAULT_INTERVAL: 0,
    MIN_EASE: 1.3,
    MAX_EASE: 3.0
  },
  
  // API配置
  CORS: {
    ALLOWED_ORIGINS: [
      'http://localhost:5173',    // 開發環境
      'http://localhost:3000',    // 備用開發環境
      'https://your-domain.com'   // 生產環境 (需要替換)
    ],
    ALLOWED_METHODS: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'X-Timestamp', 'X-Signature']
  },
  
  // 錯誤碼定義
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND', 
    SERVER_ERROR: 'SERVER_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    RATE_LIMIT: 'RATE_LIMIT'
  },
  
  // 日誌等級
  LOG_LEVEL: 'INFO', // DEBUG, INFO, WARN, ERROR
  
  /**
   * 取得Sheet配置
   * @returns {Object} Sheet配置對象
   */
  getSheetConfig: function() {
    return {
      id: this.SHEET_ID,
      name: this.SHEET_NAME,
      timezone: this.TIMEZONE
    };
  },
  
  /**
   * 取得SRS配置
   * @param {string} algorithm - 算法類型 ('leitner' | 'sm2')
   * @returns {Object} SRS配置對象
   */
  getSrsConfig: function(algorithm = 'leitner') {
    return algorithm === 'sm2' ? this.SM2 : this.LEITNER;
  },
  
  /**
   * 驗證必要配置是否完整
   * @returns {boolean} 配置是否有效
   */
  isValid: function() {
    return this.SHEET_ID && 
           this.SHEET_ID !== '你的Google_Sheet_ID_需要替換' &&
           this.SHEET_NAME;
  }
};