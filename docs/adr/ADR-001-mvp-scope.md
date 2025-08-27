# **ADR-001-mvp-scope**

狀態: Accepted

日期: 2025-08-27

作者: Front-end Architect

## **背景**

本專案目標是開發以「三面卡片」背單字的應用。未來考慮行動端（Android/iOS via Capacitor）與後端持久化（Google Apps Script + Google Sheet）。為維持敏捷節奏，需先交付最小可行產品（MVP）。

## **選項**

1. MVP 就整合 Capacitor 與 Apps Script

   * 優點：一次打通 Web/App/後端。

   * 缺點：整合與學習成本高，拉長交付週期。

2. MVP 先用假資料/JSON fixtures 驗證 UI 與流程

   * 優點：專注核心行為（UI + SRS），最快可用。

   * 缺點：MVP 階段資料未持久化。

## **決策**

採 方案 2。MVP 不直接整合 Capacitor / Apps Script，但在設計上預留鉤子：

* services/api.ts 以介面抽象 API，後續可無痛切換到後端。

* services/storage.ts 先以 localStorage，後續可替換 IndexedDB / SQLite。

* services/notifications.ts 先提供 stub，後續接 LocalNotifications。

## **後果**

* 能快速交付可用 MVP；後續以 ADR-002、ADR-003 追蹤演進。

* 初期不處理雲端安全與行動端封裝，降低風險與複雜度。

## **文件修改 (Documentation Changes)**
