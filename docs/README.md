# 背單字 MVP - Vocabulary Learning App

> **個人向背單字應用 | 基於學習科學的間隔複習系統**

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Latest-green.svg)](https://vitejs.dev/)
[![Test](https://img.shields.io/badge/Test-Jest%20%2B%20RTL-red.svg)](https://jestjs.io/)

## 🎯 專案簡介

採用 **Test-Driven Development (TDD)** 方法開發的個人向背單字應用，以「三面卡片系統」（Front/Meaning/Example）結合科學化間隔複習算法，提供高效的單字學習體驗。

### 核心特色
- **🃏 三面卡片學習** - 單字正面、中文意思、例句範例
- **🧠 科學化SRS** - Leitner Box 與 SM-2 間隔複習算法
- **🎯 主動回憶訓練** - 基於 Active Recall 學習原理
- **📱 響應式設計** - 桌面與行動裝置最佳化
- **🔒 安全優先** - 多層安全架構與代理層保護

### 學習科學依據
- **雙重編碼理論** - 文字 + 多媒體錨點增強記憶
- **語意網絡** - 同義詞、反義詞建構概念連結
- **Active Recall** - 主動回憶強化長期記憶
- **Spaced Repetition** - 科學化間隔複習最佳化遺忘曲線

## 🛠 技術棧

### 前端架構
```
React 18 + TypeScript + Vite + Tailwind CSS
├── 狀態管理: React Query (TanStack Query)
├── 測試框架: Jest + React Testing Library
├── 樣式系統: Tailwind CSS (原子化設計)
└── 開發工具: Vite (HMR + 快速冷啟)
```

### 後端架構 (Phase 1 MVP)
```
Google Sheets + Apps Script
├── 代理層: Cloudflare Workers / Netlify / Vercel Functions
├── 安全機制: HMAC 簽章 + Rate Limiting + Origin 白名單
└── 資料存儲: Google Sheets (cards, candidates)
```

### API 設計
- `GET /cards?due=today` - 取得到期複習卡片
- `POST /cards` - 新增單字卡片  
- `PATCH /cards/:id/review` - 提交複習結果
- `POST /llm/suggest` - AI 建議候選單字 (規劃中)

## 🚀 快速啟動

### 環境需求
- Node.js 18+
- npm 或 yarn

### 本地開發
```bash
# 1. 複製專案
git clone <repository-url>
cd _vaca_app

# 2. 安裝依賴
npm install

# 3. 環境變數設定
cp .env.example .env.local
# 編輯 .env.local 設定 VITE_API_BASE_URL

# 4. 啟動開發伺服器
npm run dev

# 5. 執行測試
npm run test

# 6. 建置產品版本
npm run build
```

### 環境變數
```bash
VITE_API_BASE_URL=https://your-proxy-endpoint.com
```

## 🧪 測試策略

### 測試層級
- **單元測試** - SRS 算法邏輯、純函式
- **元件測試** - React 組件互動與渲染
- **整合測試** - API hooks 與資料流
- **E2E概念** - 核心學習流程腳本

### 執行測試
```bash
npm run test              # 執行所有測試
npm run test:watch        # 監聽模式
npm run test:coverage     # 覆蓋率報告
```

## 📁 專案結構

```
/src
  /components
    /Card                 # 卡片相關組件
      Card.tsx           # 主卡片容器
      CardFaceFront.tsx  # 單字正面
      CardFaceMeaning.tsx # 中文意思
      CardFaceExample.tsx # 例句面
      MediaEmbed.tsx     # 多媒體內嵌
      ReviewControls.tsx # 複習按鈕
  /pages
    DeckView.tsx         # 主學習頁面
    AddCardForm.tsx      # 新增卡片表單
  /services
    api.ts               # API 基礎服務
    srs.ts               # 間隔複習算法
  /hooks
    useDueCards.ts       # 到期卡片查詢
    useReviewCard.ts     # 複習提交
    useAddCard.ts        # 新增卡片
  /types
    index.ts             # TypeScript 類型定義
  /test
    fixtures/cards.json  # 測試資料
    *.test.ts(x)         # 測試文件
```

## 🔄 SRS 算法

### Leitner Box System (預設)
- **盒子間隔**: [1, 2, 3, 7, 14] 天
- **評分邏輯**:
  - 3 (容易) → 升級至下一個盒子
  - 2 (普通) → 保持當前盒子  
  - 1 (困難) → 回到第一個盒子

### SM-2 演算法 (進階)
- **初始值**: ease=2.5, reps=0
- **動態調整**: 根據複習品質調整難度係數
- **間隔計算**: 前兩次固定 (1天, 6天)，之後乘以 ease 係數

## 🔐 安全機制

### 多層安全架構
1. **代理層保護** - Origin 白名單、Rate Limiting
2. **HMAC 簽章** - 防止 API 偽造請求
3. **時間戳驗證** - 5分鐘時間窗口防重放
4. **金鑰隔離** - 前端不持有任何敏感金鑰

## 📋 開發指南

- 詳細開發流程請參閱 [CONTRIBUTING.md](./CONTRIBUTING.md)
- 功能規格與 API 文件請參閱 [SPEC.md](./SPEC.md)
- 開發流程與 DoR/DoD 請參閱 [PROCESS.md](./PROCESS.md)

## 🗓 專案狀態

- **當前階段**: Phase 1 MVP 開發
- **進度追蹤**: [TODOLIST.md](./TODOLIST.md)
- **開發日誌**: [REPORT.md](./REPORT.md)
- **測試案例**: [TESTCASES.md](./TESTCASES.md)

## 📞 聯絡與回饋

如有問題或建議，請透過 Issues 或 Pull Requests 與我們聯繫。

---

**⚡ Built with ❤️ using Modern React Stack | 基於學習科學打造的智能背單字系統**