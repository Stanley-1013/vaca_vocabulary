# VACA App - API 合約文檔

> **版本**: 2.0.0
> **平台**: Vercel Serverless Functions
> **更新日期**: 2025-01-16

## 🎯 總覽

此 API 合約定義了 VACA 背單字應用程式的完整後端介面，取代原有的 Google Apps Script 後端。新的 Vercel Serverless Functions 提供了更好的性能、開發體驗和擴展性。

## 🔗 基礎資訊

- **Base URL**: `https://your-app.vercel.app/api`
- **開發環境**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **編碼**: UTF-8

## 🛡️ 認證與安全

目前版本不需要認證，但建議在生產環境中添加 API Key 或 JWT 認證機制。

## 📡 API 端點

### 1. 獲取到期卡片

**GET** `/cards`

獲取需要複習的單字卡片列表。

#### Query Parameters

| 參數 | 類型 | 必需 | 預設值 | 描述 |
|------|------|------|--------|------|
| `due` | string | 否 | - | 篩選條件，目前只支援 `"today"` |
| `limit` | number | 否 | 20 | 回傳卡片數量限制 (1-100) |
| `algo` | string | 否 | "leitner" | SRS 算法 (`"leitner"` 或 `"sm2"`) |

#### 範例請求

```http
GET /api/cards?due=today&limit=10&algo=leitner
```

#### 成功回應 (200)

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid-123",
      "word": {
        "base": "vocabulary",
        "forms": ["vocabularies"]
      },
      "posPrimary": "noun",
      "meaning": "詞彙，字彙",
      "synonyms": ["lexicon", "terminology"],
      "antonyms": [],
      "example": "Building vocabulary is essential for language learning.",
      "anchors": ["學習", "語言"],
      "tags": ["學術", "基礎"],
      "createdAt": "2025-01-15T10:00:00.000Z",
      "box": 2,
      "ease": 2.5,
      "reps": 3,
      "interval": 7,
      "lastReviewedAt": "2025-01-10T14:30:00.000Z",
      "nextReviewAt": "2025-01-16T14:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-16T08:00:00.000Z"
}
```

#### 錯誤回應

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Algorithm must be \"leitner\" or \"sm2\""
  },
  "timestamp": "2025-01-16T08:00:00.000Z"
}
```

### 2. 複習卡片

**POST** `/cards`

提交單字卡片的複習結果，更新 SRS 資料。

#### Request Body

```json
{
  "cardId": "uuid-123",
  "quality": 2,
  "algorithm": "leitner"
}
```

| 欄位 | 類型 | 必需 | 描述 |
|------|------|------|------|
| `cardId` | string | 是 | 卡片 UUID |
| `quality` | number | 是 | 複習評分 (1=困難, 2=普通, 3=容易) |
| `algorithm` | string | 否 | SRS 算法，預設 "leitner" |

#### 成功回應 (200)

```json
{
  "ok": true,
  "data": {
    "nextReviewAt": "2025-01-19T14:30:00.000Z",
    "interval": 3,
    "box": 3,
    "ease": 2.5,
    "reps": 4
  },
  "timestamp": "2025-01-16T08:05:00.000Z"
}
```

#### 錯誤回應

**卡片不存在 (404)**
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Card not found"
  },
  "timestamp": "2025-01-16T08:05:00.000Z"
}
```

**參數驗證失敗 (400)**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quality must be 1, 2, or 3"
  },
  "timestamp": "2025-01-16T08:05:00.000Z"
}
```

### 3. 系統健康檢查

**GET** `/health`

檢查系統和 Google Sheets 連線狀態。

#### Query Parameters

| 參數 | 類型 | 必需 | 描述 |
|------|------|------|------|
| `detailed` | boolean | 否 | 是否回傳詳細檢查結果 |

#### 範例請求

```http
GET /api/health
GET /api/health?detailed=true
```

#### 成功回應 (200)

**基本檢查**
```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-16T08:00:00.000Z",
    "version": "2.0.0",
    "platform": "Vercel Serverless Functions",
    "responseTime": "120ms",
    "checks": {
      "configuration": {
        "status": "pass",
        "message": "All required environment variables are configured"
      },
      "database": {
        "status": "pass",
        "message": "Google Sheets connection successful",
        "spreadsheetTitle": "VACA 背單字資料庫",
        "sheetName": "cards"
      }
    },
    "environment": {
      "nodeVersion": "v18.19.0",
      "platform": "linux",
      "sheetId": "1eZmBKuJ..."
    }
  },
  "timestamp": "2025-01-16T08:00:00.000Z"
}
```

**詳細檢查** (with `detailed=true`)
```json
{
  "ok": true,
  "data": {
    // ... 基本檢查內容 ...
    "detailedChecks": {
      "sheetStructure": {
        "status": "pass",
        "message": "Sheet structure is correct",
        "expectedColumns": 17,
        "actualColumns": 17,
        "missingColumns": []
      },
      "memory": {
        "status": "pass",
        "message": "Memory usage within normal range",
        "used": 45,
        "total": 128
      },
      "uptime": {
        "status": "pass",
        "message": "Process uptime: 1800s",
        "uptime": 1800
      }
    }
  },
  "timestamp": "2025-01-16T08:00:00.000Z"
}
```

#### 不健康狀態回應 (503)

```json
{
  "ok": true,
  "data": {
    "status": "unhealthy",
    "timestamp": "2025-01-16T08:00:00.000Z",
    "version": "2.0.0",
    "responseTime": "5000ms",
    "checks": {
      "configuration": {
        "status": "pass",
        "message": "All required environment variables are configured"
      },
      "database": {
        "status": "fail",
        "message": "Google Sheets connection failed: Service account key is invalid"
      }
    }
  },
  "timestamp": "2025-01-16T08:00:00.000Z"
}
```

## 📊 資料模型

### Card 物件

```typescript
interface Card {
  // 基本資訊
  id: string;                    // UUID
  word: {
    base: string;                // 基本形式
    forms: string[];             // 其他形式 (複數、過去式等)
  };
  posPrimary: string;            // 主要詞性
  meaning: string;               // 中文含義
  synonyms: string[];            // 同義詞
  antonyms: string[];            // 反義詞
  example: string;               // 例句
  anchors: string[];             // 記憶錨點
  tags: string[];                // 標籤
  createdAt: string;             // ISO 8601 格式

  // SRS 資料
  box: number;                   // Leitner Box (1-5)
  ease: number;                  // SM-2 難易度係數 (1.3-3.0)
  reps: number;                  // 複習次數
  interval: number;              // 間隔天數
  lastReviewedAt: string | null; // 最後複習時間 (ISO 8601)
  nextReviewAt: string;          // 下次複習時間 (ISO 8601)
}
```

### API 回應格式

```typescript
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string; // ISO 8601 格式
}
```

## 🔧 SRS 算法

### Leitner Box System
- **Box 1**: 立即重複 (0 天)
- **Box 2**: 1 天後
- **Box 3**: 2 天後
- **Box 4**: 3 天後
- **Box 5**: 7 天後
- **Box 6**: 14 天後

### SM-2 Algorithm
- **初始難易度**: 2.5
- **首次間隔**: 1 天
- **第二次間隔**: 6 天
- **後續間隔**: 前次間隔 × 難易度係數

## 🚨 錯誤碼

| 錯誤碼 | HTTP Status | 描述 |
|--------|-------------|------|
| `VALIDATION_ERROR` | 400 | 請求參數驗證失敗 |
| `NOT_FOUND` | 404 | 資源不存在 |
| `METHOD_NOT_ALLOWED` | 405 | HTTP 方法不被允許 |
| `SERVER_ERROR` | 500 | 伺服器內部錯誤 |

## 🔄 與舊 API 的差異

| 項目 | Google Apps Script | Vercel Serverless |
|------|-------------------|-------------------|
| Base URL | `https://script.google.com/macros/s/{id}/exec` | `https://your-app.vercel.app/api` |
| 回應時間 | 2-5 秒 | 100-500ms |
| 冷啟動 | 3-8 秒 | 50-200ms |
| 並發限制 | 30 requests/100s | 1000 requests/10s |
| 超時限制 | 5 分鐘 | 10 秒 |

## 📝 使用範例

### JavaScript/TypeScript

```typescript
const API_BASE = 'https://your-app.vercel.app/api';

// 獲取到期卡片
async function getDueCards(limit = 20) {
  const response = await fetch(`${API_BASE}/cards?due=today&limit=${limit}`);
  const result = await response.json();
  return result.ok ? result.data : [];
}

// 複習卡片
async function reviewCard(cardId: string, quality: number) {
  const response = await fetch(`${API_BASE}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cardId,
      quality,
      algorithm: 'leitner'
    }),
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
}

// 健康檢查
async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`);
  const result = await response.json();
  return result.data.status === 'healthy';
}
```

### cURL 範例

```bash
# 獲取到期卡片
curl -X GET "https://your-app.vercel.app/api/cards?due=today&limit=10"

# 複習卡片
curl -X POST "https://your-app.vercel.app/api/cards" \
  -H "Content-Type: application/json" \
  -d '{"cardId": "uuid-123", "quality": 2, "algorithm": "leitner"}'

# 健康檢查
curl -X GET "https://your-app.vercel.app/api/health?detailed=true"
```

## 🚀 部署與環境配置

### 必需的環境變數

| 變數名稱 | 描述 | 範例 |
|----------|------|------|
| `SHEET_ID` | Google Sheets ID | `1eZmBKuJQocALTnA1VZem6oushLIRq4sGKvKbyxfohTM` |
| `GOOGLE_CREDENTIALS_BASE64` | Base64 編碼的服務帳戶憑證 | `eyJ0eXBlIjoi...` |

### Vercel 部署命令

```bash
# 安裝依賴
npm install

# 本地開發
npm run vercel-dev

# 部署到生產環境
npm run deploy
```

---

**🎉 【任務一：重建橋樑】完成！**

新的 Vercel Serverless Functions 後端已準備就緒，提供：
- ⚡ 更快的回應時間
- 🔧 現代化的開發體驗
- 📈 更好的擴展性
- 🛡️ 安全的憑證管理
- 📋 完整的 API 文檔

請按照憑證設置指導完成 Google Cloud Service Account 配置，然後即可開始使用新的後端 API。