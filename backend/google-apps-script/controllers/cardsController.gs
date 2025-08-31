/**
 * 卡片控制器模組
 * 
 * 職責：處理卡片相關的HTTP請求，類似前端的API層
 * 模式：RESTful控制器，依賴服務層處理業務邏輯
 */

const CardsController = {
  /**
   * GET /cards - 獲取到期卡片
   * @param {Object} request - 請求對象 {path, query, body, method, params}
   * @returns {Array<Card>} 到期卡片陣列
   */
  getCards: function(request) {
    const query = request.query || {};
    const due = query.due;
    const limit = parseInt(query.limit) || 20;
    const algo = query.algo || 'leitner';
    
    // 參數驗證
    if (due && due !== 'today') {
      throw new Error('Only due=today is supported');
    }
    
    if (limit < 1 || limit > Config.MAX_CARDS_PER_REQUEST) {
      throw new Error('Limit must be between 1 and ' + Config.MAX_CARDS_PER_REQUEST);
    }
    
    if (!['leitner', 'sm2'].includes(algo)) {
      throw new Error('Algorithm must be "leitner" or "sm2"');
    }
    
    try {
      // 委託給服務層處理
      if (due === 'today') {
        return CardService.getDueCards(limit, algo);
      } else {
        // 未來可擴展其他查詢類型
        return CardService.getAllCards(limit);
      }
      
    } catch (serviceError) {
      Logger.log('CardService error in getCards: ' + serviceError.toString());
      throw new Error('Failed to fetch cards: ' + serviceError.message);
    }
  },
  
  /**
   * POST /cards - 創建新卡片
   * @param {Object} request - 請求對象 {path, query, body, method, params}
   * @returns {Object} 創建結果 {id: string}
   */
  createCard: function(request) {
    const cardData = request.body || {};
    
    try {
      // 驗證必要欄位
      ResponseUtils.validateRequiredFields(cardData, ['word', 'meaning']);
      
      // 驗證word對象結構
      if (!cardData.word || !cardData.word.base) {
        throw new Error('word.base is required');
      }
      
      // 委託給服務層處理
      const result = CardService.createCard(cardData);
      
      return result;
      
    } catch (validationError) {
      Logger.log('Validation error in createCard: ' + validationError.toString());
      throw new Error('Validation failed: ' + validationError.message);
    }
  },
  
  /**
   * PATCH /cards/:id/review - 複習卡片
   * @param {Object} request - 請求對象 {path, query, body, method, params}
   * @returns {Object} 複習結果
   */
  reviewCard: function(request) {
    const cardId = request.params && request.params.id;
    const reviewData = request.body || {};
    
    // 參數驗證
    if (!cardId) {
      throw new Error('Card ID is required');
    }
    
    ResponseUtils.validateRequiredFields(reviewData, ['quality']);
    
    const quality = reviewData.quality;
    const algorithm = reviewData.algorithm || 'leitner';
    
    // 驗證quality值
    if (![1, 2, 3].includes(quality)) {
      throw new Error('Quality must be 1, 2, or 3');
    }
    
    // 驗證algorithm值
    if (!['leitner', 'sm2'].includes(algorithm)) {
      throw new Error('Algorithm must be "leitner" or "sm2"');
    }
    
    try {
      // 委託給服務層處理
      const result = CardService.reviewCard(cardId, quality, algorithm);
      
      return result;
      
    } catch (serviceError) {
      Logger.log('CardService error in reviewCard: ' + serviceError.toString());
      
      // 處理特定錯誤類型
      if (serviceError.message.includes('not found')) {
        throw new Error('Card not found');
      }
      
      throw new Error('Failed to review card: ' + serviceError.message);
    }
  },
  
  /**
   * DELETE /cards/:id - 刪除卡片 (未來功能)
   * @param {Object} request - 請求對象
   * @returns {Object} 刪除結果
   */
  deleteCard: function(request) {
    const cardId = request.params && request.params.id;
    
    if (!cardId) {
      throw new Error('Card ID is required');
    }
    
    try {
      const result = CardService.deleteCard(cardId);
      return result;
      
    } catch (serviceError) {
      Logger.log('CardService error in deleteCard: ' + serviceError.toString());
      throw new Error('Failed to delete card: ' + serviceError.message);
    }
  },
  
  /**
   * PUT /cards/:id - 更新卡片 (未來功能)
   * @param {Object} request - 請求對象
   * @returns {Object} 更新結果
   */
  updateCard: function(request) {
    const cardId = request.params && request.params.id;
    const updateData = request.body || {};
    
    if (!cardId) {
      throw new Error('Card ID is required');
    }
    
    try {
      const result = CardService.updateCard(cardId, updateData);
      return result;
      
    } catch (serviceError) {
      Logger.log('CardService error in updateCard: ' + serviceError.toString());
      throw new Error('Failed to update card: ' + serviceError.message);
    }
  }
};