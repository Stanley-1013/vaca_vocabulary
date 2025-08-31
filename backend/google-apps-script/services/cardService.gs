/**
 * 卡片業務邏輯服務
 * 
 * 職責：處理卡片相關的核心業務邏輯，類似前端的service層
 * 模式：服務層模式，協調資料層和業務規則
 */

const CardService = {
  /**
   * 獲取到期的卡片
   * @param {number} limit - 最大卡片數量
   * @param {string} algorithm - SRS算法 ('leitner' | 'sm2')
   * @returns {Array<Card>} 到期卡片陣列
   */
  getDueCards: function(limit, algorithm) {
    try {
      // 從資料層獲取所有卡片
      const allCards = SheetService.getAllCards();
      
      if (allCards.length === 0) {
        return [];
      }
      
      // 過濾到期卡片
      const today = new Date();
      today.setHours(23, 59, 59, 999); // 設定為當日結束時間
      
      const dueCards = allCards.filter(function(card) {
        if (!card.nextReviewAt) return false;
        const nextReview = new Date(card.nextReviewAt);
        return nextReview <= today;
      });
      
      // 按下次複習時間排序（最早的優先）
      dueCards.sort(function(a, b) {
        const dateA = new Date(a.nextReviewAt);
        const dateB = new Date(b.nextReviewAt);
        return dateA.getTime() - dateB.getTime();
      });
      
      // 限制結果數量
      const limitedCards = dueCards.slice(0, Math.min(limit, dueCards.length));
      
      // 記錄日誌
      Logger.log('CardService.getDueCards: Found ' + dueCards.length + ' due cards, returning ' + limitedCards.length);
      
      return limitedCards;
      
    } catch (error) {
      Logger.log('CardService.getDueCards error: ' + error.toString());
      throw new Error('Failed to get due cards: ' + error.message);
    }
  },
  
  /**
   * 獲取所有卡片
   * @param {number} limit - 最大卡片數量
   * @returns {Array<Card>} 卡片陣列
   */
  getAllCards: function(limit) {
    try {
      const allCards = SheetService.getAllCards();
      const limitedCards = allCards.slice(0, Math.min(limit, allCards.length));
      
      Logger.log('CardService.getAllCards: Returning ' + limitedCards.length + ' cards');
      
      return limitedCards;
      
    } catch (error) {
      Logger.log('CardService.getAllCards error: ' + error.toString());
      throw new Error('Failed to get all cards: ' + error.message);
    }
  },
  
  /**
   * 創建新卡片
   * @param {Object} cardData - 卡片資料
   * @returns {Object} 創建結果 {id: string}
   */
  createCard: function(cardData) {
    try {
      // 生成唯一ID
      const cardId = Utilities.getUuid();
      const now = new Date();
      
      // 建立完整的卡片對象
      const newCard = this.buildNewCard(cardId, cardData, now);
      
      // 驗證卡片資料
      this.validateCard(newCard);
      
      // 儲存到資料層
      SheetService.insertCard(newCard);
      
      Logger.log('CardService.createCard: Created card with ID ' + cardId);
      
      return { id: cardId };
      
    } catch (error) {
      Logger.log('CardService.createCard error: ' + error.toString());
      throw new Error('Failed to create card: ' + error.message);
    }
  },
  
  /**
   * 複習卡片
   * @param {string} cardId - 卡片ID
   * @param {number} quality - 評分 (1-3)
   * @param {string} algorithm - SRS算法
   * @returns {Object} 複習結果
   */
  reviewCard: function(cardId, quality, algorithm) {
    try {
      // 從資料層獲取卡片
      const card = SheetService.getCardById(cardId);
      
      if (!card) {
        throw new Error('Card not found with ID: ' + cardId);
      }
      
      // 使用SRS服務計算新的複習資料
      const srsResult = SrsService.calculateNextReview(card, quality, algorithm);
      
      // 更新卡片資料
      const updatedCard = Object.assign({}, card, srsResult);
      updatedCard.lastReviewedAt = new Date().toISOString();
      
      // 儲存更新到資料層
      SheetService.updateCard(cardId, updatedCard);
      
      // 記錄複習日誌
      Logger.log('CardService.reviewCard: Reviewed card ' + cardId + ' with quality ' + quality + ' using ' + algorithm);
      
      // 回傳符合前端期望的格式
      return {
        nextReviewAt: updatedCard.nextReviewAt,
        interval: updatedCard.interval,
        box: updatedCard.box,
        ease: updatedCard.ease,
        reps: updatedCard.reps,
        nextReviewIntervalDays: updatedCard.interval // vNext增強功能
      };
      
    } catch (error) {
      Logger.log('CardService.reviewCard error: ' + error.toString());
      throw new Error('Failed to review card: ' + error.message);
    }
  },
  
  /**
   * 刪除卡片
   * @param {string} cardId - 卡片ID
   * @returns {Object} 刪除結果
   */
  deleteCard: function(cardId) {
    try {
      const success = SheetService.deleteCard(cardId);
      
      if (!success) {
        throw new Error('Card not found with ID: ' + cardId);
      }
      
      Logger.log('CardService.deleteCard: Deleted card ' + cardId);
      
      return { deleted: true, id: cardId };
      
    } catch (error) {
      Logger.log('CardService.deleteCard error: ' + error.toString());
      throw new Error('Failed to delete card: ' + error.message);
    }
  },
  
  /**
   * 更新卡片
   * @param {string} cardId - 卡片ID
   * @param {Object} updateData - 更新資料
   * @returns {Object} 更新結果
   */
  updateCard: function(cardId, updateData) {
    try {
      // 獲取現有卡片
      const existingCard = SheetService.getCardById(cardId);
      
      if (!existingCard) {
        throw new Error('Card not found with ID: ' + cardId);
      }
      
      // 合併更新資料
      const updatedCard = Object.assign({}, existingCard, updateData);
      
      // 驗證更新後的卡片
      this.validateCard(updatedCard);
      
      // 儲存更新
      SheetService.updateCard(cardId, updatedCard);
      
      Logger.log('CardService.updateCard: Updated card ' + cardId);
      
      return { updated: true, id: cardId };
      
    } catch (error) {
      Logger.log('CardService.updateCard error: ' + error.toString());
      throw new Error('Failed to update card: ' + error.message);
    }
  },
  
  /**
   * 建立新卡片對象
   * @param {string} cardId - 卡片ID
   * @param {Object} cardData - 輸入的卡片資料
   * @param {Date} now - 當前時間
   * @returns {Object} 完整的卡片對象
   * @private
   */
  buildNewCard: function(cardId, cardData, now) {
    return {
      // 基本資訊
      id: cardId,
      'word.base': cardData.word.base,
      'word.forms': JSON.stringify(cardData.word.forms || []),
      posPrimary: cardData.posPrimary || '',
      meaning: cardData.meaning,
      synonyms: JSON.stringify(cardData.synonyms || []),
      antonyms: JSON.stringify(cardData.antonyms || []),
      example: cardData.example || '',
      anchors: JSON.stringify(cardData.anchors || []),
      tags: JSON.stringify(cardData.tags || []),
      createdAt: now.toISOString(),
      
      // SRS初始值
      box: 1,
      ease: Config.SM2.DEFAULT_EASE,
      reps: Config.SM2.DEFAULT_REPS,
      interval: Config.SM2.DEFAULT_INTERVAL,
      lastReviewedAt: null,
      nextReviewAt: now.toISOString()
    };
  },
  
  /**
   * 驗證卡片資料完整性
   * @param {Object} card - 待驗證的卡片
   * @throws {Error} 驗證失敗時拋出錯誤
   * @private
   */
  validateCard: function(card) {
    // 必要欄位檢查
    const requiredFields = ['id', 'word.base', 'meaning'];
    
    requiredFields.forEach(function(field) {
      if (!card[field]) {
        throw new Error('Missing required field: ' + field);
      }
    });
    
    // 資料類型檢查
    if (typeof card.box !== 'number' || card.box < 1 || card.box > 5) {
      throw new Error('Invalid box value: must be number between 1-5');
    }
    
    if (typeof card.ease !== 'number' || card.ease < 1.3 || card.ease > 3.0) {
      throw new Error('Invalid ease value: must be number between 1.3-3.0');
    }
    
    if (typeof card.reps !== 'number' || card.reps < 0) {
      throw new Error('Invalid reps value: must be non-negative number');
    }
    
    // 日期格式檢查
    if (card.nextReviewAt) {
      try {
        new Date(card.nextReviewAt);
      } catch (dateError) {
        throw new Error('Invalid nextReviewAt date format');
      }
    }
  },
  
  /**
   * 獲取卡片統計資訊
   * @returns {Object} 統計資訊
   */
  getStats: function() {
    try {
      const allCards = SheetService.getAllCards();
      const today = new Date();
      
      // 計算各種統計
      const totalCards = allCards.length;
      const dueCards = allCards.filter(function(card) {
        if (!card.nextReviewAt) return false;
        return new Date(card.nextReviewAt) <= today;
      }).length;
      
      const learnedCards = allCards.filter(function(card) {
        return card.reps > 0;
      }).length;
      
      const masteredCards = allCards.filter(function(card) {
        return card.box >= 4 || card.interval >= 14;
      }).length;
      
      const stats = {
        total: totalCards,
        due: dueCards,
        learned: learnedCards,
        mastered: masteredCards,
        newCards: totalCards - learnedCards,
        timestamp: new Date().toISOString()
      };
      
      Logger.log('CardService.getStats: ' + JSON.stringify(stats));
      
      return stats;
      
    } catch (error) {
      Logger.log('CardService.getStats error: ' + error.toString());
      throw new Error('Failed to get stats: ' + error.message);
    }
  }
};