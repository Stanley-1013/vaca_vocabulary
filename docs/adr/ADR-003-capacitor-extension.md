# **ADR-003-capacitor-extension**

狀態: Planned

日期: 2025-08-27

作者: Front-end Architect

## **背景**

MVP 已能於 Web 運行，但未來需要行動端體驗（通知、離線、SQLite、手勢）。

希望最大化重用現有 React 程式碼。

## **選項**

1. React Native

   * 優點：原生體驗佳。

   * 缺點：需重寫大部分程式碼。

2. PWA + Service Worker

   * 優點：免安裝，瀏覽器即可使用。

   * 缺點：無法完全取代原生 App 功能。

3. Capacitor 打包現有 React App

   * 優點：重用程式碼，可接原生插件（通知、SQLite）。

   * 缺點：需學習 Capacitor 插件生態。

## **決策**

採用 方案 3：

* 使用 Capacitor 將現有 React Web App 打包成原生應用。

* 透過 Capacitor 插件支援通知與本地資料庫。

## **後果**

* 保留 Web + App 雙重使用模式。

* TDD 文件需新增 NFR：

  * 離線儲存（IndexedDB / SQLite）。

  * LocalNotifications 提醒 due 卡片。

  * 深色模式、橫豎切換支援。

* 發佈管線：Vite build → Capacitor → Android Studio。

## **Documentation Changes**