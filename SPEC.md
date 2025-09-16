# 📖 VACA App - 智能單字學習系統技術規格

> **Version**: 1.1.0 Enhanced Edition  
> **Type**: Progressive Web Application  
> **Architecture**: React + TypeScript + Google Apps Script  
> **Status**: Phase 2 Complete (Frontend + Backend Integration)

## 🎯 專案概述

VACA App 是一個基於間隔重複學習（SRS）的智能單字學習系統，採用現代Web技術棧和模組化架構設計。系統支援多種SRS算法、智能卡片選擇、進度追蹤，並預留AI功能擴展介面。

## 🏗️ 系統架構

### 核心架構模式
```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Presentation  │───▶│     Service     │───▶│       Data       │
│    Components   │    │     Layer       │    │      Layer       │
│                 │    │                 │    │                  │
│ • VNextApp      │    │ • API Service   │    │ • Google Sheets  │
│ • ReviewManager │    │ • SRS Algorithms│    │ • LocalStorage   │
│ • SettingsPage  │    │ • Priority Score│    │ • MockData       │
└─────────────────┘    └─────────────────┘    └──────────────────┘
```

### 技術棧
- **前端**: React 18 + TypeScript + Vite
- **狀態管理**: React Query + Custom Hooks
- **樣式**: Tailwind CSS + 響應式設計
- **後端**: Google Apps Script (RESTful API)
- **資料庫**: Google Sheets
- **測試**: Vitest + Testing Library (93+ 測試檔案)
- **部署**: 靜態網站 + PWA

## 📋 核心功能規格

### 1. **間隔重複學習系統 (SRS)**
- **支援算法**: Leitner Box, SM-2
- **智能排程**: 基於遺忘曲線的複習時間預測
- **個人化**: 根據用戶表現調整難度係數

### 2. **智能卡片管理**
- **每日選卡**: 基於優先權評分的智能選擇
- **Again佇列**: 即時重排機制，不影響SRS狀態
- **進度追蹤**: 即時統計學習進度和成效

### 3. **多平台支援**
- **響應式設計**: 桌面版 + 手機版優化
- **PWA功能**: 離線支援、推送通知
- **跨平台**: 支援Capacitor打包成原生App

### 4. **功能開關系統**
- **15個功能開關**: 支援漸進式功能發布
- **開發者面板**: 即時切換功能狀態
- **A/B測試**: 支援不同功能組合測試

## 🧩 組件架構說明

### 🎮 **核心應用組件**


```typescript
功能: 應用程式主要整合組件
職責:
  • 路由管理 (複習/設定模式切換)
  • 全局狀態管理
  • 響應式佈局控制
  • Toast通知系統整合
特色: 支援狀態面板收合、語言選擇、重置功能
```

#### **DailyReviewManager.tsx** - 複習管理器
```typescript
功能: 每日複習流程的核心管理組件
職責:
  • 每日卡片選擇和排序
  • Again佇列管理
  • 複習進度追蹤
  • 完成狀態處理
演算法整合:
  • selectTodayCards() - 智能選卡
  • insertAgainCard() - 佇列重排
  • priorityScoring() - 優先權計算
```

#### **AppLauncher.tsx** - 應用啟動器
```typescript
功能: 初始化流程和模式選擇
職責:
  • 使用者設定引導
  • 模式切換 (經典版/增強版)
  • 初次使用體驗
特色: 支援設定嚮導、模式預覽
```

### 🃏 **卡片系統組件**

#### **Card/Card.tsx** - 卡片顯示組件
```typescript
功能: 單字卡片的視覺呈現
職責:
  • 卡片翻轉動畫
  • 多媒體內容顯示
  • 鍵盤快捷鍵處理
支援格式: 文字、圖片、音頻、範例句
```

#### **Card/ReviewControls.tsx** - 複習控制組件
```typescript
功能: SRS評分按鈕組
職責:
  • vNext模式: Again + 困難/普通/容易 (4按鈕)
  • 傳統模式: 困難/普通/容易 (3按鈕)
  • 鍵盤快捷鍵 (1-4數字鍵)
  • 間隔時間預測顯示
特色: 動態按鈕禁用、載入狀態顯示
```

#### **Card/MediaEmbed.tsx** - 媒體嵌入組件
```typescript
功能: 多媒體內容處理
支援: 圖片預覽、音頻播放、影片嵌入
職責: 媒體載入、錯誤處理、響應式顯示
```

### ⚙️ **設定系統組件**

#### **SettingsPage.tsx** - 設定頁面
```typescript
功能: 完整的學習參數配置界面
配置項目:
  • 每日學習量 (複習上限、新詞數量)
  • SRS算法選擇 (Leitner/SM-2)
  • Again間隔序列 ([2,5,10])
  • 優先權重配置 (難度/逾期/層級)
  • LLM設定 (Phase 3預留)
特色: 實時驗證、設定預覽、一鍵重置
```

#### **Settings/LLMSettingsSection.tsx** - AI功能設定
```typescript
功能: LLM整合設定 (Phase 3預留)
配置: 模型選擇、API設定、測驗偏好
狀態: 已實作介面，等待Phase 3啟用
```

### 🏳️ **功能管理組件**

#### **FeatureToggle.tsx** - 功能開關系統
```typescript
功能: 動態功能控制和A/B測試支援
管理的功能開關:
  • VNEXT_REVIEW_CONTROLS - 增強版複習控制
  • VNEXT_DAILY_SELECTION - 智能每日選卡
  • VNEXT_COMPLETION_PAGE - 完成頁面
  • VNEXT_SETTINGS - 增強版設定
  • BACKEND_INTEGRATION - 後端整合
  • LLM_QUIZ - AI測驗 (Phase 3)
  • LLM_NEW_WORDS - 智能新詞推薦 (Phase 3)
特色: LocalStorage持久化、開發者調試面板
```

### 📊 **狀態與完成組件**

#### **CompletionPage.tsx** - 完成頁面
```typescript
功能: 學習完成後的統計和操作
顯示: 複習統計、新學單詞數、學習時間
操作: 繼續學習、AI測驗、設定調整
特色: 動畫效果、鼓勵訊息、進度可視化
```

#### **Toast.tsx** - 通知系統
```typescript
功能: 全域通知和反饋系統
類型: 成功/錯誤/警告/資訊
特色: 自動消失、堆疊顯示、動畫過渡
```

### 🌐 **工具組件**

#### **LanguageSelector.tsx** - 語言選擇器
```typescript
功能: 多語言支援組件
支援: 繁體中文、簡體中文、English
特色: 緊湊模式、響應式圖示
```

#### **ErrorBoundary.tsx** - 錯誤邊界
```typescript
功能: React錯誤捕獲和降級顯示
職責: 防止整個應用崩潰、錯誤報告
特色: 用戶友善的錯誤頁面、重試機制
```

#### **LLMGenerateButton.tsx** - AI生成按鈕
```typescript
功能: AI內容生成觸發器 (Phase 3預留)
整合: 預留LLM API介面
狀態: UI已完成，等待後端整合
```

## 🔧 核心服務模組

### **API服務層**
```typescript
// src/services/api.ts
interface IApiService {
  getDueCards(): Promise<Card[]>
  addCard(card: NewCardInput): Promise<{id: string}>
  reviewCard(id: string, quality: Quality): Promise<Card>
  loadMoreCards(count?: number): Promise<Card[]>
}

// 工廠模式支援:
• MockApiService - 本地開發模式
• HttpApiService - Google Apps Script後端
```

### **SRS算法服務**
```typescript
// src/services/srs.ts
支援算法:
• Leitner Box: 5層盒子系統，間隔 [0,1,2,3,7,14] 天
• SM-2: 基於EF值的指數間隔，初始EF=2.5
```

### **vNext增強服務**
```typescript
// src/services/vnext/
• dailySelection.ts - 智能每日選卡
• againQueue.ts - Again佇列管理  
• priorityScore.ts - 優先權評分算法
• predictNextInterval.ts - 間隔預測
```

### **自定義Hooks**
```typescript
// src/hooks/
• useVNextSettings.ts - 設定管理
• useDailyReview.ts - 複習邏輯
• useReviewCard.ts - 卡片複習
• useDueCards.ts - 到期卡片查詢
• useAddCard.ts - 新增卡片
• useI18n.ts - 國際化支援
```

## 🗄️ 後端架構 (Google Apps Script)

### **模組化後端服務**
```javascript
backend/google-apps-script/
├── main.gs              // HTTP入口點 (doGet/doPost)
├── router.gs            // RESTful路由分發
├── config.gs            // 配置管理
├── controllers/         // 控制器層
│   ├── cardsController.gs
│   └── healthController.gs
├── services/            // 業務邏輯層
│   ├── cardService.gs
│   ├── srsService.gs
│   └── sheetService.gs
└── utils/               // 工具層
    └── responseUtils.gs
```

### **API端點規格**
```http
GET /health                    # 系統健康檢查
GET /cards?due=today&limit=20  # 取得到期卡片
POST /cards                    # 建立新卡片
PATCH /cards/:id/review        # 複習卡片
```

### **資料結構 (Google Sheets)**
```
Sheet名稱: cards
欄位: id | word.base | word.forms | posPrimary | meaning | 
     synonyms | antonyms | example | anchors | tags |
     createdAt | box | ease | reps | interval | 
     lastReviewedAt | nextReviewAt
```

## 🧪 測試策略

### **測試覆蓋範圍**
- **單元測試**: 93+ 測試檔案
- **整合測試**: API服務、SRS算法、複習流程
- **組件測試**: React組件渲染和互動
- **時間模擬**: 複習間隔和時間進展測試

### **測試工具鏈**
```typescript
• Vitest - 測試執行器
• @testing-library/react - 組件測試
• @testing-library/user-event - 用戶互動模擬
• jsdom - DOM環境模擬
• MSW - API模擬服務
```

## 🚀 部署與配置

### **環境變數配置**
```bash
# .env (不會被推送到Git)
VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

### **建置和部署**
```bash
# 開發模式
npm run dev         # 啟動開發服務器

# 測試執行
npm run test        # 執行測試套件
npm run test:ui     # 測試UI界面

# 生產建置
npm run build       # 建置靜態檔案到 dist/
npm run preview     # 預覽生產版本
```

### **PWA支援**
- 離線快取策略
- 推送通知 (規劃中)
- 桌面安裝支援
- 響應式設計

## 🔮 擴展規劃 (Phase 3)

### **LLM AI功能整合**
- AI測驗生成 (`LLM_QUIZ`)
- 智能新詞推薦 (`LLM_NEW_WORDS`)
- 學習分析和建議 (`TELEMETRY`)
- Colab整合支援

### **進階功能**
- 語音識別和發音評分
- 圖像識別單字學習
- 社群學習和排行榜
- 多平台同步

### **安全性增強**
- HMAC簽章驗證
- Rate Limiting
- Origin白名單
- 用戶認證系統

---

## 📊 專案統計

- **程式碼行數**: ~15,000+ 行
- **組件數量**: 25+ React組件  
- **測試檔案**: 93+ 測試檔案
- **API端點**: 4個RESTful端點
- **功能開關**: 15個feature flags
- **支援語言**: 3種 (繁中/簡中/英文)
- **瀏覽器支援**: 現代瀏覽器 + PWA

---

**📝 最後更新**: 2024-09-05  
**🏷️ 版本**: v1.1.0 Enhanced Edition  
**👨‍💻 開發**: Claude Code + Expert Analysis System