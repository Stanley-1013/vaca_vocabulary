# 🌍 多語言支援指南

## 概覽

VACA App 支援中英文雙語，解決 Colab 生成中文 JSON 亂碼的問題。

## 🎯 解決方案

### **問題分析**
- Colab 環境生成中文 JSON 時出現編碼亂碼
- 直接輸出中文字符在某些環境下不穩定

### **解決策略**
1. **Colab 生成英文 JSON** - 避免編碼問題
2. **前端翻譯系統** - 將英文內容翻譯為中文
3. **語言切換功能** - 用戶可選擇中英文界面

## 🔧 技術實現

### 1. Colab Notebook 修改

```python
# 修改 prompt 模板，要求生成純英文 JSON
prompt = f"""Generate English vocabulary cards in strict JSON format.
IMPORTANT: ALL text content MUST be in English only.
No Chinese characters in the JSON output."""
```

**輸出格式：**
```json
{
  "cards": [
    {
      "word": {"base": "example"},
      "meaning": "a thing characteristic of its kind",
      "definition": "an instance serving for illustration",
      "example": "This is a good example.",
      "translation_key": "example"
    }
  ]
}
```

### 2. 前端翻譯系統

**翻譯 Hook：**
```typescript
const { t, translateCard, translateCards } = useI18n()

// UI 翻譯
const title = t('ui.title') // "VACA 智能背單字"

// 單字翻譯
const translatedCard = translateCard(englishCard)
```

**語言切換：**
```typescript
const { language, setLanguage, toggleLanguage } = useLanguageSelector()
```

### 3. 組件整合

```tsx
// 在任何組件中使用
import { useI18n } from '../hooks/useI18n'

const MyComponent = () => {
  const { t, translateCards } = useI18n()
  
  return (
    <div>
      <h1>{t('review.completed')}</h1>
      {/* 自動翻譯卡片內容 */}
    </div>
  )
}
```

## 📝 翻譯配置

### 添加新翻譯

**步驟 1：** 更新 `src/i18n/index.ts`

```typescript
export const zhTW: TranslationResource = {
  ui: {
    // 添加新的 UI 翻譯
    newFeature: {
      title: '新功能',
      description: '功能描述'
    }
  },
  
  words: {
    // 添加新的單字翻譯
    'sophisticated': '複雜精密的，老練的',
    'innovative': '創新的，革新的'
  }
}
```

**步驟 2：** 在組件中使用

```tsx
const title = t('newFeature.title')
const meaning = translateWord('sophisticated')
```

### 支援的語言

- `zh-TW`: 繁體中文 🇹🇼
- `en-US`: English 🇺🇸

## 🎨 UI 組件

### 語言選擇器

```tsx
// 完整版（帶文字）
<LanguageSelector showText={true} size="md" />

// 簡潔版（只有國旗）
<LanguageSelector showText={false} size="sm" />

// 下拉式選擇器
<LanguageDropdown />
```

### 在不同頁面使用

```tsx
// 完成頁面
const { t } = useI18n()
return <h1>{t('review.completed')}</h1>

// 設定頁面  
const { t } = useI18n()
return <label>{t('settings.difficulty')}</label>
```

## 🔄 流程圖

```
Colab 請求 → 英文 Prompt → 英文 JSON → Drive 保存
     ↓
前端讀取 → 檢測語言設定 → 翻譯顯示 → 用戶界面
```

## 🧪 測試步驟

### 1. Colab 測試
```python
# 在 Colab 中執行測試
result = generate_vocabulary_cards({
    "count": 2,
    "tags": ["IELTS"],
    "difficulty": "intermediate"
})

# 檢查輸出是否為純英文 JSON
print(json.dumps(result, ensure_ascii=False, indent=2))
```

### 2. 前端測試
1. 訪問應用：`http://localhost:5174`
2. 點擊語言切換按鈕 🇹🇼/🇺🇸
3. 檢查界面文字是否正確翻譯
4. 測試卡片內容翻譯

## 📊 優勢

### ✅ 解決的問題
- **編碼穩定性**：避免 Colab 中文亂碼
- **性能優化**：減少 Colab 處理複雜字符
- **用戶體驗**：支援中英文切換
- **維護性**：分離內容和顯示邏輯

### 🚀 未來擴展
- 新增更多語言（日文、韓文等）
- 專業術語字典
- 用戶自訂翻譯
- 離線翻譯支援

## 🔧 故障排除

### 常見問題

**Q: 翻譯沒有顯示？**
A: 檢查 `localStorage` 中的語言設定，確保翻譯 key 正確

**Q: Colab 還是生成中文？**  
A: 檢查 prompt 模板，確保包含 "English only" 指令

**Q: 新單字沒有翻譯？**
A: 在 `src/i18n/index.ts` 的 `words` 字典中添加翻譯

### 調試工具

```typescript
// 查看當前語言設定
console.log(localStorage.getItem('vaca_language'))

// 查看翻譯資源
const { translations } = useI18n()
console.log(translations)
```

---

**版本：** 1.1.0  
**更新日期：** 2025-08-31  
**狀態：** 生產就緒 🚀