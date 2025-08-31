/**
 * Google Sheets 資料存取服務
 * 
 * 職責：封裝Google Sheets操作，提供資料持久化
 * 模式：資料存取層(DAL)，類似前端的storage service
 */

const SheetService = {
  // 快取工作表實例以提升性能
  _cachedSheet: null,
  _cacheTimestamp: null,
  _cacheTimeout: 5 * 60 * 1000, // 5分鐘快取
  
  /**
   * 獲取工作表實例
   * @returns {Sheet} Google Sheets 工作表對象
   */
  getSheet: function() {
    const now = new Date().getTime();
    
    // 檢查快取是否有效
    if (this._cachedSheet && this._cacheTimestamp && 
        (now - this._cacheTimestamp < this._cacheTimeout)) {
      return this._cachedSheet;
    }
    
    try {
      const config = Config.getSheetConfig();
      const spreadsheet = SpreadsheetApp.openById(config.id);
      const sheet = spreadsheet.getSheetByName(config.name);
      
      if (!sheet) {
        throw new Error('Sheet "' + config.name + '" not found in spreadsheet');
      }
      
      // 更新快取
      this._cachedSheet = sheet;
      this._cacheTimestamp = now;
      
      return sheet;
      
    } catch (error) {
      Logger.log('SheetService.getSheet error: ' + error.toString());
      throw new Error('Failed to access Google Sheet: ' + error.message);
    }
  },
  
  /**
   * 測試Google Sheets連線
   * @throws {Error} 連線失敗時拋出錯誤
   */
  testConnection: function() {
    try {
      const sheet = this.getSheet();
      const lastRow = sheet.getLastRow();
      
      Logger.log('SheetService.testConnection: Success, last row = ' + lastRow);
      
    } catch (error) {
      Logger.log('SheetService.testConnection error: ' + error.toString());
      throw new Error('Sheet connection test failed: ' + error.message);
    }
  },
  
  /**
   * 獲取標題行
   * @returns {Array<string>} 標題行陣列
   */
  getHeaders: function() {
    try {
      const sheet = this.getSheet();
      const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
      const headers = headerRange.getValues()[0];
      
      return headers.map(function(header) {
        return header.toString().trim();
      });
      
    } catch (error) {
      Logger.log('SheetService.getHeaders error: ' + error.toString());
      throw new Error('Failed to get headers: ' + error.message);
    }
  },
  
  /**
   * 獲取所有卡片
   * @returns {Array<Card>} 卡片陣列
   */
  getAllCards: function() {
    try {
      const sheet = this.getSheet();
      const lastRow = sheet.getLastRow();
      
      if (lastRow <= 1) {
        return []; // 只有標題行或空工作表
      }
      
      // 獲取資料範圍
      const dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
      const values = dataRange.getValues();
      
      const headers = values[0];
      const rows = values.slice(1);
      
      // 轉換為卡片對象陣列
      const cards = rows.map(function(row) {
        return this.rowToCard(row, headers);
      }.bind(this));
      
      // 過濾掉無效的卡片
      const validCards = cards.filter(function(card) {
        return card && card.id;
      });
      
      Logger.log('SheetService.getAllCards: Loaded ' + validCards.length + ' cards');
      
      return validCards;
      
    } catch (error) {
      Logger.log('SheetService.getAllCards error: ' + error.toString());
      throw new Error('Failed to get all cards: ' + error.message);
    }
  },
  
  /**
   * 根據ID獲取卡片
   * @param {string} cardId - 卡片ID
   * @returns {Card|null} 卡片對象或null
   */
  getCardById: function(cardId) {
    try {
      const allCards = this.getAllCards();
      
      const card = allCards.find(function(card) {
        return card.id === cardId;
      });
      
      return card || null;
      
    } catch (error) {
      Logger.log('SheetService.getCardById error: ' + error.toString());
      throw new Error('Failed to get card by ID: ' + error.message);
    }
  },
  
  /**
   * 插入新卡片
   * @param {Card} card - 卡片對象
   * @returns {boolean} 插入是否成功
   */
  insertCard: function(card) {
    try {
      const sheet = this.getSheet();
      const headers = this.getHeaders();
      
      // 將卡片對象轉換為行資料
      const rowData = this.cardToRow(card, headers);
      
      // 插入新行
      sheet.appendRow(rowData);
      
      Logger.log('SheetService.insertCard: Inserted card ' + card.id);
      
      // 清除快取以確保資料一致性
      this.clearCache();
      
      return true;
      
    } catch (error) {
      Logger.log('SheetService.insertCard error: ' + error.toString());
      throw new Error('Failed to insert card: ' + error.message);
    }
  },
  
  /**
   * 更新卡片
   * @param {string} cardId - 卡片ID
   * @param {Card} updatedCard - 更新後的卡片對象
   * @returns {boolean} 更新是否成功
   */
  updateCard: function(cardId, updatedCard) {
    try {
      const sheet = this.getSheet();
      const lastRow = sheet.getLastRow();
      
      if (lastRow <= 1) {
        throw new Error('No data rows found');
      }
      
      // 獲取所有資料
      const dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
      const values = dataRange.getValues();
      
      const headers = values[0];
      const idColumnIndex = headers.indexOf('id');
      
      if (idColumnIndex === -1) {
        throw new Error('ID column not found');
      }
      
      // 尋找目標行
      let targetRowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][idColumnIndex] === cardId) {
          targetRowIndex = i;
          break;
        }
      }
      
      if (targetRowIndex === -1) {
        throw new Error('Card not found with ID: ' + cardId);
      }
      
      // 轉換更新後的卡片為行資料
      const updatedRowData = this.cardToRow(updatedCard, headers);
      
      // 更新整行
      const updateRange = sheet.getRange(targetRowIndex + 1, 1, 1, headers.length);
      updateRange.setValues([updatedRowData]);
      
      Logger.log('SheetService.updateCard: Updated card ' + cardId);
      
      // 清除快取
      this.clearCache();
      
      return true;
      
    } catch (error) {
      Logger.log('SheetService.updateCard error: ' + error.toString());
      throw new Error('Failed to update card: ' + error.message);
    }
  },
  
  /**
   * 刪除卡片
   * @param {string} cardId - 卡片ID
   * @returns {boolean} 刪除是否成功
   */
  deleteCard: function(cardId) {
    try {
      const sheet = this.getSheet();
      const lastRow = sheet.getLastRow();
      
      if (lastRow <= 1) {
        return false; // 沒有資料行
      }
      
      // 獲取所有資料
      const dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
      const values = dataRange.getValues();
      
      const headers = values[0];
      const idColumnIndex = headers.indexOf('id');
      
      if (idColumnIndex === -1) {
        throw new Error('ID column not found');
      }
      
      // 尋找目標行
      let targetRowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][idColumnIndex] === cardId) {
          targetRowIndex = i;
          break;
        }
      }
      
      if (targetRowIndex === -1) {
        return false; // 卡片不存在
      }
      
      // 刪除行（+1因為Sheets行數從1開始）
      sheet.deleteRow(targetRowIndex + 1);
      
      Logger.log('SheetService.deleteCard: Deleted card ' + cardId);
      
      // 清除快取
      this.clearCache();
      
      return true;
      
    } catch (error) {
      Logger.log('SheetService.deleteCard error: ' + error.toString());
      throw new Error('Failed to delete card: ' + error.message);
    }
  },
  
  /**
   * 將工作表行轉換為卡片對象
   * @param {Array} row - 工作表行資料
   * @param {Array<string>} headers - 標題行
   * @returns {Card} 卡片對象
   * @private
   */
  rowToCard: function(row, headers) {
    try {
      const card = {};
      
      headers.forEach(function(header, index) {
        const value = row[index];
        
        // 處理JSON字串欄位
        if (['word.forms', 'synonyms', 'antonyms', 'anchors', 'tags'].includes(header)) {
          try {
            card[header] = value ? JSON.parse(value.toString()) : [];
          } catch (jsonError) {
            Logger.log('JSON parse error for ' + header + ': ' + jsonError.toString());
            card[header] = [];
          }
        } else {
          card[header] = value;
        }
      });
      
      // 重構word對象（保持與前端一致的結構）
      if (card['word.base']) {
        card.word = {
          base: card['word.base'],
          forms: card['word.forms'] || []
        };
        delete card['word.base'];
        delete card['word.forms'];
      }
      
      return card;
      
    } catch (error) {
      Logger.log('SheetService.rowToCard error: ' + error.toString());
      return null;
    }
  },
  
  /**
   * 將卡片對象轉換為工作表行
   * @param {Card} card - 卡片對象
   * @param {Array<string>} headers - 標題行
   * @returns {Array} 工作表行資料
   * @private
   */
  cardToRow: function(card, headers) {
    return headers.map(function(header) {
      let value = card[header];
      
      // 處理word對象的特殊欄位
      if (header === 'word.base' && card.word) {
        value = card.word.base;
      } else if (header === 'word.forms' && card.word) {
        value = JSON.stringify(card.word.forms || []);
      }
      // 處理其他JSON陣列欄位
      else if (['synonyms', 'antonyms', 'anchors', 'tags'].includes(header)) {
        value = JSON.stringify(value || []);
      }
      
      // 確保值不為undefined
      return value !== undefined ? value : '';
    });
  },
  
  /**
   * 清除快取
   */
  clearCache: function() {
    this._cachedSheet = null;
    this._cacheTimestamp = null;
    Logger.log('SheetService.clearCache: Cache cleared');
  },
  
  /**
   * 獲取工作表統計資訊
   * @returns {Object} 統計資訊
   */
  getSheetStats: function() {
    try {
      const sheet = this.getSheet();
      const lastRow = sheet.getLastRow();
      const lastColumn = sheet.getLastColumn();
      
      const stats = {
        totalRows: lastRow,
        totalColumns: lastColumn,
        dataRows: Math.max(0, lastRow - 1), // 排除標題行
        sheetName: sheet.getName(),
        sheetId: sheet.getSheetId(),
        timestamp: new Date().toISOString()
      };
      
      return stats;
      
    } catch (error) {
      Logger.log('SheetService.getSheetStats error: ' + error.toString());
      throw new Error('Failed to get sheet stats: ' + error.message);
    }
  }
};