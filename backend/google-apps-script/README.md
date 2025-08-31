# Google Apps Script 後端 - 模組化架構

## 📋 概述

本專案實作了模組化的Google Apps Script後端，採用與前端React相同的分層架構設計理念：

- **入口層** - HTTP請求處理
- **路由層** - RESTful API路由分發
- **控制層** - 請求處理和參數驗證
- **服務層** - 核心業務邏輯
- **資料層** - Google Sheets資料存取

## 🏗 架構設計

### 檔案結構
```
backend/google-apps-script/
├── main.gs                      # HTTP入口點 (doGet/doPost)
├── router.gs                    # 路由分發器
├── config.gs                    # 配置管理
├── controllers/
│   ├── cardsController.gs       # 卡片CRUD控制器
│   └── healthController.gs      # 健康檢查控制器
├── services/
│   ├── cardService.gs           # 卡片業務邏輯
│   ├── srsService.gs            # SRS算法服務
│   └── sheetService.gs          # Google Sheets資料存取
├── utils/
│   └── responseUtils.gs         # HTTP回應工具
└── README.md                    # 本文檔
```

### 模組間依賴關係
```
main.gs → router.gs → controllers/* → services/* → Google Sheets
                                  ↓
                               utils/responseUtils.gs
                                  ↑
                               config.gs
```

## 🚀 部署指南

### 1. 準備Google Sheets

1. 建立新的Google Sheets文檔
2. 將第一個工作表重命名為 `cards`
3. 設定標題行（第一行）：

```
id | word.base | word.forms | posPrimary | meaning | synonyms | antonyms | example | anchors | tags | createdAt | box | ease | reps | interval | lastReviewedAt | nextReviewAt
```

### 2. 建立Apps Script專案

1. 前往 [Google Apps Script](https://script.google.com/)
2. 建立新專案，命名為 "Vocabulary Learning API"
3. 刪除預設的 `Code.gs` 檔案

### 3. 上傳模組化程式碼

按以下順序複製程式碼到Apps Script專案：

1. **config.gs** - 配置管理（⚠️ 更新SHEET_ID）
2. **utils/responseUtils.gs** - 工具函數
3. **services/sheetService.gs** - 資料存取層
4. **services/srsService.gs** - SRS算法
5. **services/cardService.gs** - 業務邏輯
6. **controllers/cardsController.gs** - 卡片控制器
7. **controllers/healthController.gs** - 健康檢查
8. **router.gs** - 路由器
9. **main.gs** - 入口點

### 4. 配置設定

在 `config.gs` 中更新以下設定：

```javascript
const Config = {
  SHEET_ID: '你的Google_Sheet_ID', // 替換為步驟1建立的Sheet ID
  CORS: {
    ALLOWED_ORIGINS: [
      'http://localhost:5173',    // 開發環境
      'https://your-domain.com'   // 替換為你的生產域名
    ]
  }
};
```

### 5. 部署為Web應用程式

1. 點選「部署」→「新增部署」
2. 類型選擇「網路應用程式」
3. 設定：
   - **說明**：Vocabulary Learning API v1.0
   - **執行身分**：我
   - **具有應用程式存取權的使用者**：任何人
4. 點選「部署」
5. 複製「網路應用程式」網址作為API_BASE_URL

### 6. 測試部署

使用瀏覽器或curl測試API：

```bash
# 健康檢查
curl "YOUR_WEBAPP_URL/health"

# 獲取到期卡片（應該回傳空陣列）
curl "YOUR_WEBAPP_URL/cards?due=today"
```

## 📡 API端點

### 卡片相關
- `GET /cards?due=today&limit=20` - 獲取到期卡片
- `POST /cards` - 建立新卡片
- `PATCH /cards/:id/review` - 複習卡片

### 系統監控
- `GET /health` - 基本健康檢查
- `GET /health/detailed` - 詳細健康檢查

### API格式範例

#### 建立卡片
```json
POST /cards
{
  "word": {
    "base": "example",
    "forms": [{"pos": "n.", "form": "example"}]
  },
  "posPrimary": "n.",
  "meaning": "例子",
  "synonyms": ["sample", "instance"],
  "antonyms": [],
  "example": "This is an example sentence.",
  "anchors": [],
  "tags": ["academic"]
}
```

#### 複習卡片
```json
PATCH /cards/uuid-123/review
{
  "quality": 2,
  "algorithm": "leitner"
}
```

## 🔧 開發與維護

### 本地開發
1. 使用Apps Script編輯器進行開發
2. 利用 `Logger.log()` 進行除錯
3. 在「執行」面板檢視執行結果和錯誤

### 版本管理
- 每次重要更新建立新的部署版本
- 在部署說明中記錄版本變更
- 保留舊版本以供回滾

### 監控與日誌
- 使用健康檢查端點監控系統狀態
- 檢查Apps Script執行記錄以排除問題
- 設定Google Cloud Monitoring（可選）

### 效能優化
- Sheet資料快取（已實作5分鐘快取）
- 批次操作以減少API呼叫
- 限制單次查詢的資料量

## 🚨 限制與注意事項

### Google Apps Script限制
- **執行時間**：最長6分鐘
- **觸發頻率**：每分鐘20次
- **同時使用者**：建議10-50人
- **資料大小**：單一檔案50MB

### 安全性考量
- 目前實作基本CORS控制
- 建議Phase 2實作HMAC簽章驗證
- 敏感資料不要寫入程式碼中

### 錯誤處理
- 所有API都有統一錯誤格式
- 詳細錯誤日誌記錄
- 優雅降級處理

## 🔄 與前端整合

### 環境變數設定
在前端專案的 `.env` 檔案中設定：

```bash
VITE_API_BASE_URL=YOUR_WEBAPP_URL
```

### 功能開關
前端已預留 `BACKEND_INTEGRATION` 功能開關，部署完成後可動態切換：

```javascript
// 在前端開發者面板中啟用
featureFlags.BACKEND_INTEGRATION = true
```

### API相容性
後端API完全相容前端現有的：
- `IApiService` 介面規範
- TypeScript型別定義
- 錯誤處理機制

## 📞 支援與故障排除

### 常見問題
1. **404錯誤**：檢查路由配置和部署狀態
2. **403錯誤**：檢查CORS設定和权限配置
3. **500錯誤**：檢查Sheet ID和欄位結構
4. **超時**：檢查資料量大小和執行邏輯

### 除錯步驟
1. 檢查健康檢查端點
2. 查看Apps Script執行記錄
3. 驗證Sheet資料結構
4. 確認配置參數正確

---

**模組化設計讓維護更容易！** 🎯  
每個模組都有明確的職責，遵循單一職責原則，便於擴展和維護。