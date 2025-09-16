# 🚀 VACA App 後端整合設定指南

> **簡化版設定流程** - 不需要複製大量程式碼！

## 📋 快速設定檢查清單 (15分鐘)

- [ ] Google Cloud 專案設定
- [ ] Google Sheets 資料庫建立  
- [ ] Google Apps Script 一鍵部署
- [ ] 前端環境配置
- [ ] 測試整合

---

## 🔧 步驟 1：Google Cloud 專案設定

### 1.1 建立專案並啟用API
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案：`VACA-背單字`
3. 前往「**API 和服務**」→「**程式庫**」
4. 搜尋並啟用：
   - **Google Sheets API** ✅
   - **Google Drive API** ✅  
   - **Google Apps Script API** ✅

### 1.2 OAuth 設定
1. 「**憑證**」→「**建立憑證**」→「**OAuth 2.0 用戶端 ID**」
2. 類型：「**網頁應用程式**」
3. **授權來源**：
   ```
   http://localhost:5173
   ```

---

## 📊 步驟 2：建立 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com/) 建立空白試算表
2. 檔案名稱：`VACA 背單字資料庫`
3. 工作表名稱改為：`cards`
4. **第一行標題**（複製貼上即可）：
   ```
   id	word.base	word.forms	posPrimary	meaning	synonyms	antonyms	example	anchors	tags	createdAt	box	ease	reps	interval	lastReviewedAt	nextReviewAt
   ```
5. **複製 Sheet ID**（URL中 `/d/` 和 `/edit` 之間的字串）
6. 設定分享：「**任何知道連結的使用者**」→「**編輯者**」

---

## ⚙️ 步驟 3：Google Apps Script 部署 (簡化版)

### 3.1 使用現有檔案快速部署
1. 前往 [Google Apps Script](https://script.google.com/)
2. 建立新專案：`VACA Vocabulary API`
3. **重要：不要一個個複製檔案！**

### 3.2 批次上傳方式
**選項A：使用 clasp 工具（推薦）**
```bash
# 安裝 clasp
npm install -g @google/clasp

# 登入 Google 帳號
clasp login

# ⚠️ 如果出現 "User has not enabled the Apps Script API" 錯誤：
# 1. 前往 https://script.google.com/home/usersettings
# 2. 啟用 "Google Apps Script API"
# 3. 重新執行下面的命令

# 在專案目錄執行
cd backend/google-apps-script
clasp create --type standalone --title "VACA Vocabulary API"
clasp push
```

**選項B：手動建立檔案**
只需要建立以下**核心檔案**，其他會自動載入：

1. **config.gs** - 更新你的 Sheet ID：
   ```javascript
   SHEET_ID: '你的_Google_Sheet_ID_在這裡'
   ```

2. **main.gs** - 複製 `backend/google-apps-script/main.gs`

3. **其他檔案** - 可以之後再慢慢加

### 3.3 部署
1. 「**部署**」→「**新增部署**」
2. 類型：「**網路應用程式**」
3. 執行身分：「**我**」
4. 存取權：「**任何人**」
5. **複製部署網址** 🔗

---

## 🔧 步驟 4：前端配置（30秒）

### 4.1 建立環境檔案
```bash
cp .env.example .env
```

### 4.2 編輯 .env（只改一行）
```env
VITE_API_BASE_URL=你剛才複製的Apps_Script部署網址
```

### 4.3 重啟開發服務器
```bash
npm run dev
```

---

## ✅ 步驟 5：測試（1分鐘）

1. 開啟 http://localhost:5173/
2. 按 F12 → Console
3. 右下角按「**🏳️**」→ 勾選 `backend_integration`
4. 看到：`🚀 Using Google Apps Script backend` ✅

### 快速測試 API：
在 Console 執行：
```javascript
fetch('你的部署網址/health').then(r=>r.json()).then(console.log)
```

看到 `{ok: true}` 就成功了！🎉

### LLM 後端代理設定（Gemini）
1. 前往 Apps Script 專案 → Project Settings → Script properties
2. 新增 `GEMINI_API_KEY`（值為你的 Gemini API key）
3. 重新部署 Web App（New deployment）
4. 前端不需要也不應保存金鑰；`LLM 設定` 會顯示使用伺服器代理

### 測試 LLM 生成/測驗
1. 在網址加上 `?test=true` 進入開發測試頁（DevTestPage）
2. 切到「LLM 生成按鈕」分頁，按「AI 智能生成」
   - 成功：能看到依條件產生的單字卡列表（由後端 `/llm/suggest` 代理 Gemini）
3. 或在正式 App 完成頁/設定頁呼叫生成（前端已改走 `/llm/*` 後端代理）

---

## 🚨 問題排除

### ❌ 還是看到 "Mock API service"？
1. 清除快取：`localStorage.clear()`
2. 重新勾選功能開關
3. 重新載入頁面

### ❌ CORS 錯誤？
在 `config.gs` 加上：
```javascript
ALLOWED_ORIGINS: ['http://localhost:5173']
```

### ❌ LLM 相關錯誤？
- 確認 Script properties 已設定 `GEMINI_API_KEY`
- 重新部署 Web App（部署後 URL 可能更新，請同步到 `.env` 的 `VITE_API_BASE_URL`）
- 查看 Apps Script 日誌（Executions）追蹤錯誤訊息

### ❌ clasp 錯誤："User has not enabled the Apps Script API"？
1. 前往 https://script.google.com/home/usersettings
2. 啟用 "Google Apps Script API" 開關
3. 重新執行 `clasp create` 命令

### ❌ 404 錯誤？
檢查 `.env` 中的網址是否正確（要有 `/exec` 結尾）

---

## 🎯 成功標準

✅ Console 顯示：`🚀 Using Google Apps Script backend`  
✅ 健康檢查回傳：`{ok: true}`  
✅ 新增卡片會出現在 Google Sheets  

**就這麼簡單！不需要複製一大堆程式碼** 💪

---

## 📂 進階設定

如果你想要完整功能，可以之後再：
1. 使用 `clasp` 工具同步所有檔案
2. 或者參考 `backend/google-apps-script/README.md` 逐步完善

**先讓基本功能跑起來最重要！** 🚀