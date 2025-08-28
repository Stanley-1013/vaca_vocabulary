# vNext Enhancement Implementation Log

> **日期**: 2025-08-28  
> **版本**: 1.1.0  
> **類型**: Feature Enhancement  
> **基於**: SRS Algorithm & Flow Update — vNext (Integrated Draft)

## 📋 實施概覽

### 決策依據
基於 MVP 使用回饋，使用者需要更進階的 SRS 功能：
- 每日複習卡片過多時需要智能篩選
- 按鈕顯示預測間隔提升學習預期  
- Again 功能用於當日重複學習
- 完成後延續學習的選項

### 實施策略
採用 **Enhancement** 而非新 ADR 的原因：
1. 不涉及重大架構變更，在既有 MVP 基礎上增強
2. 契約優先開發，可立即實作測試  
3. 保持向後相容，既有功能不受影響
4. 遵循 ADR-001 的漸進式升級策略

## 🔧 技術實施詳情

### Phase 1: 文檔更新 ✅

#### SPEC.md v1.1.0 變更內容
1. **功能總覽增強**
   - 新增 "vNext 增強功能 (Phase 1.5)" 段落
   - 明確區分立即可實作 vs 需後端配合的功能

2. **SRS 算法規格擴展**  
   - `predictNextIntervalDays()` - 間隔預測函式
   - `calculatePriorityScore()` - 優先評分系統
   - `selectTodayCards()` - 每日選卡策略
   - `insertAgainCard()` - Again 佇列重排

3. **API 規格增強**
   - GET `/cards?due=today&limit=20&algo=leitner`
   - PATCH `/cards/:id/review` 增強回應
   - POST `/llm/suggest` (Phase 2+)  
   - POST `/llm/quiz` (Phase 2+)

#### 契約就緒功能 (立即可實作)
- ✅ `predictNextIntervalDays()` 純函式
- ✅ 優先評分計算 (基於現有欄位)
- ✅ 每日上限篩選邏輯
- ✅ Again 佇列重排機制
- ✅ 按鈕間隔顯示格式

#### 需後端配合功能 (Phase 2+)
- ⏸ LLM 新字建議 `/llm/suggest`
- ⏸ AI 智能測驗 `/llm/quiz`
- ⏸ 伺服器端優先排序
- ⏸ 新字注入完整流程

## 📊 優先評分演算法規格

### 計算公式
```typescript
// 難度項：ease 越低越優先
difficulty = clamp(3.0 - ease, 0, 2)

// 逾期項：越逾期越優先  
overdueDays = max(0, today - nextReviewAt) // 日數
overdueDaysNorm = min(overdueDays / 7, 1)

// 層級項：盒子越低越優先
level = 5 - box
levelNorm = level / 4

// 綜合評分
priorityScore = 0.5 * difficulty + 0.3 * overdueDaysNorm + 0.2 * levelNorm
```

### 權重設計邏輯
- **難度權重 0.5**: 主要因子，困難卡片優先複習
- **逾期權重 0.3**: 防止卡片長期被忽略
- **層級權重 0.2**: 低階卡片需更頻繁練習

## 🎯 使用者體驗改善

### Before (MVP 1.0.0)
- 複習按鈕: "困難 / 普通 / 容易"
- 無法預知下次複習時間
- 所有到期卡片都必須複習
- 單一學習循環，無法延續

### After (vNext 1.1.0)  
- 複習按鈕: "Again / 困難(1天) / 普通(3天) / 容易(7天)"
- 清楚預期下次複習間隔
- 智能篩選最重要的 20 張卡片
- 完成頁選項: "背更多單字 / AI 測驗"

## 📝 後續實施計畫

### 立即開發 (契約就緒)
1. **services/srs.ts** 新增 4 個預測函式
2. **ReviewControls** 升級為 4 按鈕設計  
3. **useDueCards** 整合優先排序邏輯
4. **App.tsx** 新增每日上限與 Again 處理
5. **完成頁組件** 提供延續學習選項

### 測試策略
- **單元測試**: 4 個新函式的邊界條件覆蓋
- **組件測試**: ReviewControls 按鈕文案與行為
- **整合測試**: 日期推進與優先排序正確性
- **E2E 測試**: Again 重排與完成頁流程

### 後端整合準備 (Phase 2+)
- API mock 契約已就緒，後端可直接對齊實作
- LLM 端點設計完整，可無痛整合 OpenAI/Claude
- 錯誤處理與降級策略已規劃

## 📈 成功指標

### 量化目標
- 每日學習完成率 > 80%
- 平均學習時間 < 20 分鐘 
- Again 使用率 10-15% (適度重複)
- 間隔預測準確率 > 95%

### 定性目標  
- 使用者反饋學習效率提升
- 減少「卡片堆積焦慮感」
- 增加「可控學習節奏感」

---

**實施負責**: AI Development Team  
**預估完成**: 2025-08-30 (2 工作日)  
**下一階段**: Phase 2 LLM 整合規劃