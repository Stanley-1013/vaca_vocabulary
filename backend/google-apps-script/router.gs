/**
 * 路由管理模組
 * 
 * 職責：HTTP請求路由分發，類似Express.js路由器
 * 模式：集中式路由管理，支援RESTful API設計
 */

const Router = {
  /**
   * 路由表定義
   * 格式：[method, pattern, controller.action]
   */
  routes: [
    // 卡片相關API
    ['GET', /^cards$/, 'CardsController.getCards'],
    ['POST', /^cards$/, 'CardsController.createCard'],
    ['PATCH', /^cards\/([^\/]+)\/review$/, 'CardsController.reviewCard'],
    
    // 健康檢查
    ['GET', /^health$/, 'HealthController.check'],
    
    // 未來API預留
    ['POST', /^llm\/suggest$/, 'LLMController.suggest'],
    ['POST', /^llm\/quiz$/, 'LLMController.quiz']
  ],
  
  /**
   * 主要路由處理函數
   * @param {Object} e - 請求事件對象
   * @param {string} method - HTTP方法
   * @returns {TextOutput} HTTP回應
   */
  handle: function(e, method) {
    // 設定CORS headers
    const corsHeaders = this.getCorsHeaders(e);
    
    // 處理OPTIONS請求（CORS預檢）
    if (method === 'OPTIONS') {
      return ResponseUtils.corsResponse(corsHeaders);
    }
    
    // 解析路徑
    const path = this.parsePath(e);
    const queryParams = e.parameter || {};
    
    // 解析請求體（POST/PATCH）
    let requestBody = {};
    if (method !== 'GET' && e.postData) {
      try {
        requestBody = JSON.parse(e.postData.contents);
      } catch (parseError) {
        Logger.log('JSON parse error: ' + parseError.toString());
        return ResponseUtils.badRequest('Invalid JSON format', corsHeaders);
      }
    }
    
    // 路由匹配
    const route = this.findRoute(method, path);
    if (!route) {
      return ResponseUtils.notFound('Endpoint not found', corsHeaders);
    }
    
    // 執行控制器動作
    try {
      const result = this.executeController(route, {
        path: path,
        query: queryParams,
        body: requestBody,
        method: method
      });
      
      return ResponseUtils.success(result, corsHeaders);
      
    } catch (controllerError) {
      Logger.log('Controller error: ' + controllerError.toString());
      return ResponseUtils.serverError(controllerError.message, corsHeaders);
    }
  },
  
  /**
   * 解析請求路徑
   * @param {Object} e - 請求事件對象
   * @returns {string} 清理後的路徑
   */
  parsePath: function(e) {
    // 從pathInfo獲取路徑，如果沒有則為根路徑
    const pathInfo = e.pathInfo || '';
    
    // 移除首尾斜線並返回
    return pathInfo.replace(/^\/|\/$/g, '');
  },
  
  /**
   * 找到匹配的路由
   * @param {string} method - HTTP方法
   * @param {string} path - 請求路徑
   * @returns {Object|null} 匹配的路由或null
   */
  findRoute: function(method, path) {
    for (let i = 0; i < this.routes.length; i++) {
      const [routeMethod, pattern, controller] = this.routes[i];
      
      if (routeMethod === method) {
        const match = path.match(pattern);
        if (match) {
          return {
            controller: controller,
            matches: match,
            params: this.extractParams(pattern, match)
          };
        }
      }
    }
    
    return null;
  },
  
  /**
   * 從正則匹配提取參數
   * @param {RegExp} pattern - 路由正則模式
   * @param {Array} matches - 正則匹配結果
   * @returns {Object} 提取的參數對象
   */
  extractParams: function(pattern, matches) {
    const params = {};
    
    // 對於 cards/([^/]+)/review 這樣的模式，提取ID參數
    if (matches.length > 1) {
      params.id = matches[1]; // 第一個捕獲組通常是ID
    }
    
    return params;
  },
  
  /**
   * 執行控制器動作
   * @param {Object} route - 匹配的路由信息
   * @param {Object} request - 請求對象
   * @returns {*} 控制器執行結果
   */
  executeController: function(route, request) {
    const [controllerName, actionName] = route.controller.split('.');
    
    // 動態調用控制器方法
    const controller = this.getController(controllerName);
    if (!controller || typeof controller[actionName] !== 'function') {
      throw new Error('Controller or action not found: ' + route.controller);
    }
    
    // 合併路由參數到請求對象
    request.params = route.params;
    
    // 調用控制器動作
    return controller[actionName](request);
  },
  
  /**
   * 獲取控制器實例
   * @param {string} controllerName - 控制器名稱
   * @returns {Object} 控制器對象
   */
  getController: function(controllerName) {
    // 支持的控制器映射
    const controllers = {
      'CardsController': typeof CardsController !== 'undefined' ? CardsController : null,
      'HealthController': typeof HealthController !== 'undefined' ? HealthController : null,
      'LLMController': typeof LLMController !== 'undefined' ? LLMController : null
    };
    
    return controllers[controllerName];
  },
  
  /**
   * 獲取CORS headers
   * @param {Object} e - 請求事件對象
   * @returns {Object} CORS headers對象
   */
  getCorsHeaders: function(e) {
    const origin = e.headers ? e.headers['Origin'] : '';
    const allowedOrigins = Config.CORS.ALLOWED_ORIGINS;
    
    return {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Methods': Config.CORS.ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Headers': Config.CORS.ALLOWED_HEADERS.join(', '),
      'Access-Control-Max-Age': '86400' // 24小時
    };
  }
};