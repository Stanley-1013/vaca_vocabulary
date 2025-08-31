/**
 * HTTP回應工具模組
 * 
 * 職責：統一HTTP回應格式，類似前端的API response utilities
 * 模式：靜態工具函數集合，統一錯誤處理
 */

const ResponseUtils = {
  /**
   * 建立成功回應
   * @param {*} data - 回應資料
   * @param {Object} headers - 額外的HTTP headers
   * @returns {TextOutput} Google Apps Script TextOutput
   */
  success: function(data, headers = {}) {
    const response = {
      ok: true,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    return this.createResponse(response, 200, headers);
  },
  
  /**
   * 建立錯誤回應
   * @param {string} code - 錯誤代碼
   * @param {string} message - 錯誤訊息
   * @param {number} statusCode - HTTP狀態碼
   * @param {Object} headers - 額外的HTTP headers
   * @returns {TextOutput} Google Apps Script TextOutput
   */
  error: function(code, message, statusCode = 500, headers = {}) {
    const response = {
      ok: false,
      error: {
        code: code,
        message: message
      },
      timestamp: new Date().toISOString()
    };
    
    return this.createResponse(response, statusCode, headers);
  },
  
  /**
   * 400 Bad Request 回應
   * @param {string} message - 錯誤訊息
   * @param {Object} headers - 額外的HTTP headers
   * @returns {TextOutput} HTTP回應
   */
  badRequest: function(message = 'Bad Request', headers = {}) {
    return this.error(Config.ERROR_CODES.VALIDATION_ERROR, message, 400, headers);
  },
  
  /**
   * 401 Unauthorized 回應
   * @param {string} message - 錯誤訊息
   * @param {Object} headers - 額外的HTTP headers
   * @returns {TextOutput} HTTP回應
   */
  unauthorized: function(message = 'Unauthorized', headers = {}) {
    return this.error(Config.ERROR_CODES.UNAUTHORIZED, message, 401, headers);
  },
  
  /**
   * 404 Not Found 回應
   * @param {string} message - 錯誤訊息
   * @param {Object} headers - 額外的HTTP headers
   * @returns {TextOutput} HTTP回應
   */
  notFound: function(message = 'Not Found', headers = {}) {
    return this.error(Config.ERROR_CODES.NOT_FOUND, message, 404, headers);
  },
  
  /**
   * 429 Too Many Requests 回應
   * @param {string} message - 錯誤訊息
   * @param {Object} headers - 額外的HTTP headers
   * @returns {TextOutput} HTTP回應
   */
  tooManyRequests: function(message = 'Too Many Requests', headers = {}) {
    return this.error(Config.ERROR_CODES.RATE_LIMIT, message, 429, headers);
  },
  
  /**
   * 500 Internal Server Error 回應
   * @param {string} message - 錯誤訊息
   * @param {Object} headers - 額外的HTTP headers
   * @returns {TextOutput} HTTP回應
   */
  serverError: function(message = 'Internal Server Error', headers = {}) {
    return this.error(Config.ERROR_CODES.SERVER_ERROR, message, 500, headers);
  },
  
  /**
   * CORS預檢回應
   * @param {Object} headers - CORS headers
   * @returns {TextOutput} CORS回應
   */
  corsResponse: function(headers = {}) {
    const defaultCorsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': Config.CORS.ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Headers': Config.CORS.ALLOWED_HEADERS.join(', '),
      'Access-Control-Max-Age': '86400'
    };
    
    const mergedHeaders = Object.assign(defaultCorsHeaders, headers);
    
    return this.createResponse({
      ok: true,
      message: 'CORS preflight'
    }, 200, mergedHeaders);
  },
  
  /**
   * 建立TextOutput回應對象
   * @param {Object} data - 回應資料
   * @param {number} statusCode - HTTP狀態碼
   * @param {Object} headers - HTTP headers
   * @returns {TextOutput} Google Apps Script TextOutput
   */
  createResponse: function(data, statusCode = 200, headers = {}) {
    const response = ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
    
    // 設定預設headers
    const defaultHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    // 合併headers
    const allHeaders = Object.assign(defaultHeaders, headers);
    
    // 設定所有headers
    Object.keys(allHeaders).forEach(function(key) {
      response.setHeader(key, allHeaders[key]);
    });
    
    // 記錄回應（僅在開發模式）
    if (Config.LOG_LEVEL === 'DEBUG') {
      Logger.log('Response: ' + JSON.stringify({
        statusCode: statusCode,
        data: data,
        headers: allHeaders
      }));
    }
    
    return response;
  },
  
  /**
   * 驗證必要欄位
   * @param {Object} data - 待驗證的資料
   * @param {string[]} requiredFields - 必要欄位陣列
   * @throws {Error} 缺少必要欄位時拋出錯誤
   */
  validateRequiredFields: function(data, requiredFields) {
    const missingFields = [];
    
    requiredFields.forEach(function(field) {
      if (!data.hasOwnProperty(field) || data[field] == null || data[field] === '') {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      throw new Error('Missing required fields: ' + missingFields.join(', '));
    }
  },
  
  /**
   * 安全的JSON解析
   * @param {string} jsonString - JSON字串
   * @param {*} defaultValue - 解析失敗時的預設值
   * @returns {*} 解析結果或預設值
   */
  safeJsonParse: function(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      Logger.log('JSON parse failed: ' + error.toString());
      return defaultValue;
    }
  }
};