# CHANGELOG - Vocabulary Learning App

> **規範**: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
> **版本策略**: [Semantic Versioning](https://semver.org/)

## [1.1.0] - 2025-08-28

### Added (vNext Enhancement)
- 每日複習上限與智能優先排序系統
- 間隔預測顯示 ("中(3天)"、"易(7天)" 格式)
- Again 重複功能，佇列內重排不影響 SRS
- 完成頁 "背更多單字" 功能
- LLM 整合 API 契約規格 (Phase 2+ 準備)

### Enhanced  
- SRS 演算法增加 4 個新函式介面
- API 端點支援 limit/algo 參數
- ReviewControls 升級為 4 按鈕設計
- 優先評分系統基於難度/逾期/層級計算

### Technical
- 新增 `predictNextIntervalDays()` 純函式
- 新增 `calculatePriorityScore()` 優先演算法
- 新增 `selectTodayCards()` 每日選卡策略
- 新增 `insertAgainCard()` 佇列重排邏輯

**實施狀態**: 契約就緒，可立即開發測試  
**詳細記錄**: [2025-08-28 vNext Enhancement](updates/2025-08-28-vnext-enhancement.md)

## [1.0.0] - 2025-08-27

### Added (MVP 基礎)
- 三面卡片學習系統 (Front/Meaning/Example)
- Leitner Box + SM-2 間隔重複演算法  
- React Query 資料管理與 MSW API 模擬
- Tailwind CSS 響應式介面設計
- 完整 TDD 測試套件 (130+ 測試案例)

**實施狀態**: 已完成，MVP 運行於 http://localhost:5173  
**關聯決策**: MVP-first 架構策略