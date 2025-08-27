# SPEC.md - 功能規格書 | Vocabulary Learning App

> **Version**: 1.0.0  
> **Last Updated**: 2025-08-27  
> **Status**: Phase 1 MVP Specification

---

## 📋 Table of Contents

1. [功能總覽](#功能總覽)
2. [資料模型](#資料模型)
3. [API 規格](#api-規格)
4. [架構設計](#架構設計)
5. [組件規格](#組件規格)
6. [SRS 算法規格](#srs-算法規格)
7. [安全規格](#安全規格)
8. [使用者流程](#使用者流程)

---

## 🎯 功能總覽

### 核心功能 (Phase 1 MVP)
- **三面卡片學習系統** - Front (單字) / Meaning (意思) / Example (例句)
- **間隔複習 (SRS)** - Leitner Box 與 SM-2 算法
- **到期卡片管理** - 自動篩選當日複習卡片
- **複習評分系統** - 3級評分 (困難/普通/容易)
- **新增卡片功能** - 支援多媒體錨點
- **多媒體支援** - 圖片、YouTube、MP4、外部連結

### 未來功能 (Phase 2+)
- **LLM 輔助建議** - AI 生成候選單字
- **多使用者支援** - 使用者隔離與權限管理
- **進階分析** - 學習統計與進度追蹤
- **離線模式** - Service Worker 快取

---

## 📊 資料模型

### Core Types

```typescript
export type POS = 'adj.'|'n.'|'v.'|'adv.'|'prep.'|'conj.'|'pron.'|'phr.';
export type AnchorType = 'image'|'youtube'|'mp4'|'link';
export type Quality = 1|2|3;  // 1=困難, 2=普通, 3=容易
export type Algorithm = 'leitner'|'sm2';

export interface Anchor {
  type: AnchorType;
  url: string;
  title?: string;
}

export interface WordForm {
  pos: POS | string;
  form: string;
}

export interface Card {
  // 基本資訊
  id: string;
  word: { base: string; forms: WordForm[] };
  posPrimary: POS | string;
  meaning: string;          // MVP: 單一意思
  synonyms: string[];       // 近義詞
  antonyms: string[];       // 反義詞
  example: string;          // 例句
  anchors: Anchor[];        // 多媒體錨點
  tags?: string[];          // 標籤分類
  createdAt: string;        // ISO 8601

  // SRS 欄位
  box: 1|2|3|4|5;          // Leitner 盒子
  ease: number;             // SM-2 難度係數 (預設 2.5)
  reps: number;             // 複習次數
  interval: number;         // 間隔天數
  lastReviewedAt: string | null; // 上次複習時間
  nextReviewAt: string;     // 下次複習時間 (ISO 8601)
}
```

### Google Sheets 映射

**Sheet: cards**
| Column | Type | Description |
|--------|------|-------------|
| id | string | 唯一識別碼 |
| word.base | string | 單字基本形 |
| word.forms | JSON string | 詞性變化陣列 |
| posPrimary | string | 主要詞性 |
| meaning | string | 中文意思 |
| synonyms | JSON string | 近義詞陣列 |
| antonyms | JSON string | 反義詞陣列 |
| example | string | 例句 |
| anchors | JSON string | 多媒體錨點陣列 |
| tags | JSON string | 標籤陣列 |
| createdAt | ISO string | 建立時間 |
| box | number | Leitner 盒子 (1-5) |
| ease | number | SM-2 難度係數 |
| reps | number | 複習次數 |
| interval | number | 間隔天數 |
| lastReviewedAt | ISO string | 上次複習時間 |
| nextReviewAt | ISO string | 下次複習時間 |

**Sheet: candidates** (未來功能)
- 結構同 `cards`，額外欄位：
  - `source`: string - 來源 (LLM model name)
  - `score`: number - 品質評分
  - `status`: 'pending'|'approved'|'rejected'

---

## 🔌 API 規格

### Base Configuration
- **Base URL**: `VITE_API_BASE_URL` (環境變數)
- **Content-Type**: `application/json`
- **Time Zone**: Asia/Taipei (代理層統一)

### Headers (代理層 → Apps Script)
```http
X-Timestamp: <unix-milliseconds>
X-Signature: <HMAC_SHA256(secret, method + path + body + timestamp)>
Content-Type: application/json
```

### Error Response Format
```json
{
  "ok": false,
  "error": {
    "code": "RATE_LIMIT" | "UNAUTHORIZED" | "SERVER_ERROR" | "VALIDATION_ERROR",
    "message": "Human readable error message"
  }
}
```

### Endpoints

#### GET /cards?due=today
**取得到期複習卡片**

**Query Parameters:**
- `due`: string - 過濾條件 (目前僅支援 "today")

**Response 200:**
```json
{
  "ok": true,
  "data": Card[]
}
```

**過濾邏輯:**
- `nextReviewAt <= 今日 23:59:59` (代理層時區)
- 按 `nextReviewAt` ASC 排序

**Error Codes:**
- `401 UNAUTHORIZED` - Origin 不在白名單
- `429 RATE_LIMIT` - 請求頻率超限
- `500 SERVER_ERROR` - 伺服器內部錯誤

#### POST /cards
**新增單字卡片**

**Request Body:**
```json
{
  "word": { "base": "example", "forms": [{"pos": "n.", "form": "example"}] },
  "posPrimary": "n.",
  "meaning": "例子",
  "synonyms": ["sample", "instance"],
  "antonyms": [],
  "example": "This is an example sentence.",
  "anchors": [{"type": "image", "url": "...", "title": "..."}],
  "tags": ["academic"]
}
```

**Response 200:**
```json
{
  "ok": true,
  "id": "<generated-uuid>"
}
```

**後端自動設定欄位:**
- `id`: UUID v4
- `box`: 1
- `ease`: 2.5
- `reps`: 0
- `interval`: 0
- `lastReviewedAt`: null
- `nextReviewAt`: 當日日期
- `createdAt`: 當前時間

#### PATCH /cards/:id/review
**提交複習結果**

**Path Parameters:**
- `id`: string - 卡片 ID

**Request Body:**
```json
{
  "quality": 1|2|3,
  "algorithm": "leitner"|"sm2"  // 預設 "leitner"
}
```

**Response 200:**
```json
{
  "ok": true,
  "nextReviewAt": "2025-08-28T00:00:00Z",
  "interval": 2,
  "box": 2,
  "ease": 2.5,
  "reps": 1
}
```

**演算法說明:**
- 伺服器端為權威計算來源
- 客戶端僅用於預估，實際以 API 回應為準

---

## 🏗 架構設計

### System Context Diagram

```
┌─────────────────────────────┐
│     Web Client (React)     │
│  ┌─────────┐ ┌─────────────┐│
│  │DeckView │ │AddCardForm  ││
│  │         │ │             ││
│  │ ┌─────┐ │ └─────────────┘│
│  │ │Card │ │                │
│  │ └─────┘ │                │
│  └─────────┘                │
└─────────────┬───────────────┘
              │ HTTPS + CORS
              ▼
┌─────────────────────────────┐
│      Proxy Layer            │
│  (Cloudflare/Netlify/Vercel)│
│ ┌─────────────────────────┐ │
│ │ HMAC + RateLimit +     │ │
│ │ Origin Whitelist       │ │
│ └─────────────────────────┘ │
└─────────────┬───────────────┘
              │ Signed Request
              ▼
┌─────────────────────────────┐
│   Google Apps Script        │
│ ┌─────────────────────────┐ │
│ │ /doGet /doPost          │ │
│ │ Signature Verification  │ │
│ │ SRS Algorithm           │ │
│ └─────────────────────────┘ │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│     Google Sheets           │
│ ┌─────────┐ ┌─────────────┐ │
│ │ cards   │ │ candidates  │ │
│ │ (main)  │ │ (llm/future)│ │
│ └─────────┘ └─────────────┘ │
└─────────────────────────────┘
```

### Security Layers
1. **前端**: Origin validation, no secrets
2. **代理層**: HMAC signing, rate limiting, CORS
3. **Apps Script**: Signature verification, timestamp window
4. **Google Sheets**: Google's infrastructure security

---

## ⚛️ 組件規格

### Component Tree
```
<App>
  <AppHeader />
  <Routes>
    <Route path="/" element={<DeckView />} />
    <Route path="/add" element={<AddCardForm />} />
  </Routes>
  <AppFooter />
</App>
```

### DeckView Component
**職責**: 主學習介面，管理卡片序列與複習流程

**Props**: 無 (頂層路由組件)

**State**:
- `currentIndex`: number - 當前卡片索引
- 依賴 hooks: `useDueCards()`, `useReviewCard()`

**行為**:
- 載入到期卡片列表
- 處理複習評分後自動進入下一張
- 全部複習完成顯示祝賀訊息

### Card Component  
**職責**: 單張卡片容器，管理三面切換

```typescript
interface CardProps {
  card: Card;
  onFlip(): void;      // 翻面回調 (預留)
  onNext(): void;      // 下一張回調
}

type Face = 'front' | 'right' | 'left';  // 正面 | 意思面 | 例句面
```

**行為**:
- 鍵盤導航: `← → Space Enter`
- 三面循環切換
- 整合 ReviewControls

### Face Components

#### CardFaceFront
```typescript
interface CardFaceFrontProps {
  word: { base: string; forms: WordForm[] };
  posPrimary: string;
}
```
- 顯示單字 base form
- 顯示主要詞性
- 列出所有詞性變化

#### CardFaceMeaning  
```typescript
interface CardFaceMeaningProps {
  meaning: string;
  synonyms: string[];
  antonyms: string[];
}
```
- 主要中文意思
- 近義詞與反義詞列表
- 語意網絡視覺化 (未來)

#### CardFaceExample
```typescript
interface CardFaceExampleProps {
  example: string;
  anchors: Anchor[];
}
```
- 例句展示
- 整合 MediaEmbed 組件
- 上下文高亮 (未來)

### MediaEmbed Component
```typescript
interface MediaEmbedProps {
  anchor: Anchor;
}
```

**渲染邏輯**:
- `image`: `<img src={url} alt={title} />` 
- `youtube`: `<iframe src="https://youtube.com/embed/{id}" />`
- `mp4`: `<video src={url} controls />`
- `link`: `<a href={url} target="_blank" rel="noopener">{title}</a>`

**無障礙支援**:
- 所有媒體必須有 `title` 或 `alt` 屬性
- 外部連結添加 `noopener` 安全屬性

### ReviewControls Component
```typescript
interface ReviewControlsProps {
  onRate(quality: 1|2|3): Promise<void>;
  busy?: boolean;
}
```

**UI Elements**:
- 三個評分按鈕: "困難 (1)" | "普通 (2)" | "容易 (3)"
- Loading 狀態期間 disable 所有按鈕
- 鍵盤快捷鍵: `1 2 3`

---

## 🧠 SRS 算法規格

### Leitner Box System (預設演算法)

**盒子與間隔對應**:
```typescript
const LEITNER_INTERVALS = [0, 1, 2, 3, 7, 14] as const; // index 1..5
```

**升級邏輯**:
- **Quality 3 (容易)**: `box = Math.min(5, box + 1)`
- **Quality 2 (普通)**: `box = box` (不變)
- **Quality 1 (困難)**: `box = 1` (回到第一個盒子)

**下次複習時間**: `nextReviewAt = today + LEITNER_INTERVALS[box] days`

### SM-2 演算法 (進階選項)

**初始值**:
- `ease = 2.5`
- `reps = 0` 
- `interval = 0`

**演算邏輯**:
```typescript
if (quality === 1) {
  reps = 0;
  interval = 1;
  ease = Math.max(1.3, ease - 0.2);
} else {
  reps += 1;
  ease = quality === 3 ? ease + 0.1 : ease;
  
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 6;
  else interval = Math.round(interval * ease);
}
```

**邊界條件**:
- `ease` 下限: 1.3 (防止過度懲罰)
- `ease` 上限: 無 (建議 ≤ 3.0)
- `interval` 上限: 無 (實務建議 ≤ 365天)

### 演算法選擇策略
- **Leitner**: 簡單直觀，適合初學者
- **SM-2**: 動態調整，適合長期學習者
- **預設**: Leitner (使用者可在設定中切換)

---

## 🔐 安全規格

### 威脅模型
- **API 偽造**: 惡意請求偽造 Apps Script 端點
- **資料洩露**: 未授權存取單字資料
- **DoS 攻擊**: 高頻請求癱瘓服務
- **CORS 攻擊**: 跨域資源存取

### 防護機制

#### 1. HMAC 簽章驗證
```
Signature = HMAC_SHA256(secret, method + path + body + timestamp)
```
- **密鑰管理**: 僅代理層持有，前端不可見
- **時間窗口**: 5分鐘有效期，防重放攻擊
- **驗證失敗**: 立即返回 401，不處理請求

#### 2. Rate Limiting
- **策略**: 滑動視窗 + IP + 使用者指紋
- **限制**: 每分鐘 60 requests, 每小時 1000 requests
- **回應**: 429 Too Many Requests + Retry-After header

#### 3. Origin Whitelist
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:5173',          // 開發環境
  'https://your-app-domain.com'     // 生產環境
];
```

#### 4. 輸入驗證 (建議新增)
- **Schema Validation**: Zod/TypeBox 驗證所有 POST/PATCH 請求
- **SQL Injection**: N/A (Google Sheets 不支援 SQL)
- **XSS Prevention**: DOMPurify 淨化使用者輸入

---

## 👤 使用者流程

### 主要學習流程 (Happy Path)
1. **進入應用** → 自動載入當日到期卡片
2. **開始學習** → 顯示第一張卡片 (Front 面)
3. **思考回憶** → 使用者腦中回想意思與例句
4. **檢查答案** → 翻至 Meaning 面確認理解
5. **查看例句** → 翻至 Example 面學習用法
6. **自我評分** → 點選 困難(1)/普通(2)/容易(3)
7. **系統更新** → SRS 算法計算下次複習時間
8. **下一張卡片** → 自動進入下一張，重複 3-7
9. **學習完成** → 所有到期卡片複習完成

### 新增卡片流程
1. **導航到新增頁面** → 點選 "添加新卡片" 按鈕
2. **填寫基本資訊** → 單字、詞性、中文意思
3. **添加例句** → 包含該單字的實用例句
4. **設置多媒體錨點** → 圖片/影片/連結 (選填)
5. **添加同反義詞** → 建立語意網絡 (選填)
6. **提交儲存** → 驗證後儲存至 Google Sheets
7. **回到主頁** → 新卡片將在明日出現在複習清單

### 錯誤處理流程
- **網路錯誤** → 顯示重試按鈕，保持當前狀態
- **驗證錯誤** → 高亮錯誤欄位，顯示具體錯誤訊息  
- **權限錯誤** → 引導使用者檢查網路或聯繫管理員
- **資料衝突** → 提示使用者重新整理頁面

### 邊界情況
- **無到期卡片** → 顯示祝賀訊息與學習統計
- **網路離線** → 顯示離線提示 (Phase 2 支援離線模式)
- **長時間無活動** → 自動儲存當前進度

---

## 📈 效能指標

### 前端效能目標
- **首次載入**: < 3 秒 (3G 網路)
- **卡片切換**: < 100ms 動畫完成
- **API 回應**: < 500ms (95th percentile)

### 快取策略
- **React Query**: `staleTime: 5min`, `cacheTime: 30min`
- **圖片資源**: Browser cache + CDN (未來)
- **API 回應**: Proxy layer cache (1 分鐘)

### Google Apps Script 限制
- **執行時間**: 6 分鐘上限
- **觸發頻率**: 每分鐘 20 次
- **資料大小**: 50MB 單一檔案
- **同時使用者**: ~10-50 (估算)

---

*本規格書為活文件，所有變更將透過 ADR (Architecture Decision Records) 記錄並更新至此文件。*