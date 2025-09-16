# 🚀 VACA 背單字 - 完整設定指南

歡迎使用 VACA 智能背單字系統！這個指南會幫助您設定自己的個人化學習環境。

## 📋 概覽

VACA 使用以下服務來提供完整功能：

- **Google Sheets** - 作為個人單字資料庫
- **Google Drive** - 儲存 AI 檔案交換
- **AI 模型** - 生成個人化單字卡（支援免費 Colab 或付費 API）

所有資料都儲存在您自己的 Google 帳號中，我們不會存取您的個人資料。

---

## 🎯 選項 1：免費方案（推薦）

使用 Google Colab + 免費開源模型

### 步驟 1：Google 服務設定

#### 1.1 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱：`VACA-背單字-[您的姓名]`
4. 點擊「建立」

#### 1.2 啟用必要的 API

1. 在左側選單選擇「API 和服務」→「程式庫」
2. 搜尋並啟用以下 API：
   ```
   ✅ Google Sheets API
   ✅ Google Drive API  
   ✅ Google Apps Script API
   ```

#### 1.3 建立 OAuth 2.0 憑證

1. 前往「API 和服務」→「憑證」
2. 點擊「建立憑證」→「OAuth 2.0 用戶端 ID」
3. 選擇「網頁應用程式」
4. 名稱：`VACA App Client`
5. 授權 JavaScript 來源：
   ```
   # Web 開發環境
   http://localhost:5173
   https://localhost:5173
   
   # Capacitor 應用程式（重要！）
   capacitor://localhost
   https://localhost
   ionic://localhost
   
   # Web 正式環境（如果你也想提供網頁版）
   https://yourdomain.com
   https://your-app.vercel.app
   ```
6. 重新導向 URI：
   ```
   # Web 開發環境
   http://localhost:5173/auth/callback
   
   # Capacitor 應用程式
   capacitor://localhost/auth/callback
   https://localhost/auth/callback
   
   # Web 正式環境
   https://yourdomain.com/auth/callback
   ```
7. 複製並保存「用戶端 ID」

### 步驟 2：建立 Google Sheets 資料庫

1. 前往 [Google Sheets](https://sheets.google.com/)
2. 建立新的試算表
3. 重新命名為：`VACA-單字卡資料庫`
4. 設定表頭（第一列）：

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| id | word.base | meaning | posPrimary | example | tags | box | ease | reps | interval | lastReviewedAt | nextReviewAt | createdAt |

5. 從網址複製 Sheet ID（`/d/` 和 `/edit` 之間的長字串）

### 步驟 3：設定 Google Drive 資料夾

1. 前往 [Google Drive](https://drive.google.com/)
2. 建立資料夾：`VACA_LLM`
3. 在該資料夾內建立子資料夾：
   ```
   📁 VACA_LLM/
   ├── 📁 requests/
   └── 📁 responses/
   ```

### 步驟 4：設定 Google Colab

1. 下載 Colab Notebook：
   - 從專案中複製 `colab/vaca_llm_generator.ipynb`
   - 或使用以下連結：[下載 Notebook](./colab/vaca_llm_generator.ipynb)

2. 前往 [Google Colab](https://colab.research.google.com/)

3. 上傳 Notebook：
   - 點擊「檔案」→「上傳筆記本」
   - 選擇剛下載的 `.ipynb` 檔案

4. 執行 Notebook：
   - 點擊「執行階段」→「全部執行」
   - 第一次執行會需要約 5-10 分鐘下載模型

5. 複製 Notebook ID：
   - 從瀏覽器網址列複製 ID（`.../drive/` 後面的長字串）

---

## 💳 選項 2：付費 API 方案

使用商業 AI 服務（OpenAI、Claude、Gemini）

### OpenAI 設定

1. 前往 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 註冊並驗證帳號
3. 前往「API Keys」頁面
4. 點擊「Create new secret key」
5. 複製 API Key（以 `sk-` 開頭）
6. 設定付費方式和使用限制

### Claude API 設定

1. 前往 [Anthropic Console](https://console.anthropic.com/)
2. 註冊並申請 API 存取權限
3. 建立 API Key
4. 設定使用限制

### Gemini API 設定

1. 前往 [Google AI Studio](https://aistudio.google.com/)
2. 建立 API Key
3. 設定專案和配額

---

## 🔧 應用程式設定

完成上述步驟後，開啟 VACA 應用程式：

1. **第一次啟動**會看到設定向導
2. **選擇 AI 服務**：
   - 🔬 Google Colab（免費）
   - 🤖 OpenAI GPT（付費）
   - 🧠 Claude（付費）
   - 💎 Gemini（付費）

3. **輸入設定資訊**：
   - Google OAuth 用戶端 ID
   - Google Sheets ID
   - AI 服務 API Key 或 Colab Notebook ID

4. **驗證設定**：
   - 系統會自動測試連接
   - 確保所有服務正常運作

5. **開始使用**！

---

## 📱 Capacitor 應用程式部署

### 安裝 Capacitor

```bash
# 安裝 Capacitor
npm install @capacitor/core @capacitor/cli

# 初始化 Capacitor
npx cap init

# 添加平台
npx cap add android
npx cap add ios
```

### 建置應用程式

```bash
# 建置 Web 應用
npm run build

# 同步到 Capacitor
npx cap sync

# 開啟 Android Studio
npx cap open android

# 開啟 Xcode (macOS)
npx cap open ios
```

### Capacitor 專用設定

在 `capacitor.config.ts` 中新增：

```typescript
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourname.vaca',
  appName: 'VACA 背單字',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: 'your-google-client-id.apps.googleusercontent.com',
      androidClientId: 'your-android-client-id.apps.googleusercontent.com'
    }
  }
}

export default config
```

### 所需的 Capacitor 插件

```bash
# Google 驗證
npm install @capacitor-community/google-auth

# 本地通知
npm install @capacitor/local-notifications

# 檔案系統
npm install @capacitor/filesystem

# App 狀態
npm install @capacitor/app
```

---

## 🔍 常見問題

### Q: 為什麼要使用我自己的 Google 服務？
A: 這確保您的學習資料完全私有，不會被其他人存取。您擁有完全控制權。

### Q: Colab 免費版有什麼限制？
A: 
- 運行時間限制：12 小時後需重新啟動
- 資源限制：適合 7B 模型，無法運行更大的模型
- 排隊等待：繁忙時需要等待

### Q: 付費 API 大概會花多少錢？
A:
- **OpenAI**: 每 1000 個單字約 $0.01-0.05
- **Claude**: 每 1000 個單字約 $0.008-0.04  
- **Gemini**: 每 1000 個單字約 $0.0001-0.002

### Q: 可以混合使用嗎？
A: 可以！您可以設定 Colab 為主要服務，當 Colab 不可用時自動切換到付費 API。

### Q: 資料安全嗎？
A: 是的！所有資料都儲存在您自己的 Google 帳號中。API Key 只儲存在您的本地設備。

---

## 🛠️ 進階設定

### 自訂 Colab 模型

如果您想使用不同的模型，可以修改 Notebook 中的模型名稱：

```python
# 在 Notebook 中找到這行並修改
model_name = "Qwen/Qwen2.5-7B-Instruct"  

# 可選替代方案：
# model_name = "microsoft/DialoGPT-medium"
# model_name = "mistralai/Mistral-7B-Instruct-v0.2"
```

### 自訂提示詞範本

您可以修改 `create_vocabulary_prompt()` 函數來調整 AI 生成的風格。

### 備份資料

定期備份您的 Google Sheets：
1. 前往您的 Google Sheets
2. 「檔案」→「下載」→「.xlsx」
3. 儲存到安全位置

---

## 🆘 技術支援

如果遇到問題：

1. **檢查設定**：確保所有 API 都已啟用，憑證正確
2. **查看 Console**：瀏覽器開發者工具中查看錯誤訊息
3. **重新驗證**：在設定頁面重新輸入憑證
4. **檢查配額**：確保 API 配額未用盡

---

## 🎉 完成！

設定完成後，您就可以：

- ✅ 建立個人化單字卡
- ✅ 使用 AI 智能生成單字
- ✅ 基於科學的間隔重複學習
- ✅ 追蹤學習進度
- ✅ 離線學習支援

享受您的智能學習旅程！🚀