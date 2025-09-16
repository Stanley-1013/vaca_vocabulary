/**
 * Google Apps Script 主入口點
 * 
 * 職責：HTTP請求入口，路由分發
 * 模組化設計：參考前端React架構模式
 */

/**
 * HTTP GET 請求處理器 (也處理 OPTIONS 預檢請求)
 * @param {Object} e - 請求事件對象
 * @returns {TextOutput} HTTP 回應
 */
function doGet(e) {
  try {
    // Google Apps Script 中 OPTIONS 請求會被當作 GET 處理
    // 需要檢查是否為 CORS 預檢請求
    const method = (e.parameter && e.parameter._method) || 'GET';
    return Router.handle(e, method);
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    return ResponseUtils.serverError('Internal server error');
  }
}

/**
 * HTTP POST/PATCH 請求處理器  
 * @param {Object} e - 請求事件對象
 * @returns {TextOutput} HTTP 回應
 */
function doPost(e) {
  try {
    // 根據HTTP method分發到不同處理器
    const method = e.parameter.method || 'POST';
    return Router.handle(e, method);
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    return ResponseUtils.serverError('Internal server error');
  }
}

/**
 * HTTP OPTIONS 請求處理 (CORS 預檢)
 * @param {Object} e - 請求事件對象  
 * @returns {TextOutput} CORS 回應
 */
function doOptions(e) {
  return ResponseUtils.corsResponse();
}