# **ADR-002-apps-script-backend**

狀態: Planned

日期: 2025-08-27

作者: Front-end Architect

## **背景**

MVP 目前使用 JSON fixtures / localStorage 測試流程，缺乏持久化。

後續需要低成本、快速落地的後端，能與 TDD 設計的欄位一致。

## **選項**

1. Firebase / Supabase

   * 優點：功能完整，支援多人協作。

   * 缺點：學習與維運成本高。

2. 自建 Node.js + DB

   * 優點：控制力強。

   * 缺點：過度工程化，不適合 MVP。

3. Google Apps Script + Google Sheet

   * 優點：快速、零成本，與 TDD 欄位對齊。

   * 缺點：效能有限，不適合高併發。

## **決策**

採用 方案 3：

* 以 Apps Script 部署 doGet / doPost / doPatch API。

* 使用 Google Sheet 作為資料表，結構對應 TDD。

## **後果**

* 可逐步將假資料切換為真資料。

* 後續需新增一份 ADR：安全性 Proxy（HMAC 驗證、Origin 白名單、Rate Limit）。

* 適合個人與小規模專案；若專案規模增長，可再替換。

## **Documentation Changes**