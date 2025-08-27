# TODOLIST.md - 任務追蹤看板

> **專案進度 | 任務狀態 | 開發里程碑**

**Last Updated**: 2025-08-27  
**Current Phase**: Phase 1 MVP Development  
**Sprint**: Initialization & Core Setup

---

## 🎯 專案概覽

### 完成度統計
```
Overall Progress: ░░░░░░░░░░ 0% (0/40)

Phase 1 MVP:     ░░░░░░░░░░ 0% (0/30)  
Testing:         ░░░░░░░░░░ 0% (0/15)
Documentation:   ██████████ 100% (7/7) ✅  
Infrastructure:  ░░░░░░░░░░ 0% (0/10)
```

### 目前里程碑
🎯 **M1: 專案初始化** (預計: 2025-08-30)  
- 設定開發環境
- 建立專案結構  
- 實作核心 SRS 算法

---

## 📋 任務狀態板

### 🟢 進行中 (In Progress)
| 任務 | 負責人 | 預計完成 | 優先級 | 進度 |
|------|--------|----------|--------|------|
| 專案文檔建立 | - | 2025-08-27 | P0 | 100% ✅ |

### 🔵 待辦 (TODO) - 高優先級 (基於ADR-001 MVP策略)
| 任務 | 描述 | 預估工時 | 相依性 | 標籤 |
|------|------|----------|--------|------|
| **ENV-001** | Vite + React 專案初始化 | 0.5天 | 無 | `setup`, `p0` |
| **ENV-002** | TypeScript 配置與型別定義 | 0.5天 | ENV-001 | `setup`, `p0` |
| **ENV-003** | Tailwind CSS 設定 | 0.5天 | ENV-001 | `styling`, `p0` |
| **ENV-004** | ESLint + Prettier 配置 | 0.5天 | ENV-002 | `tooling`, `p0` |
| **ENV-005** | Jest + RTL 測試環境 | 1天 | ENV-002 | `testing`, `p0` |
| **SRV-001** | services/api.ts 抽象化介面 | 0.5天 | ENV-002 | `service`, `p0` |
| **SRV-002** | services/storage.ts localStorage實作 | 0.5天 | ENV-002 | `service`, `p0` |
| **SRV-003** | services/notifications.ts stub實作 | 0.5天 | ENV-002 | `service`, `p0` |
| **SRV-004** | JSON fixtures 資料模擬 | 0.5天 | SRV-001 | `service`, `p0` |
| **SRS-001** | Leitner Box 算法實作 | 1天 | ENV-002 | `core`, `p0` |
| **SRS-002** | SM-2 算法實作 | 1天 | SRS-001 | `core`, `p0` |
| **SRS-003** | SRS 算法單元測試 | 1天 | SRS-002 | `testing`, `p0` |
| **API-002** | React Query 配置 | 0.5天 | SRV-001 | `data`, `p0` |

### 🟡 待辦 (TODO) - 中優先級  
| 任務 | 描述 | 預估工時 | 相依性 | 標籤 |
|------|------|----------|--------|------|
| **COMP-001** | 基礎 Card 組件實作 | 1天 | ENV-003 | `component`, `p1` |
| **COMP-002** | CardFaceFront 組件 | 0.5天 | COMP-001 | `component`, `p1` |
| **COMP-003** | CardFaceMeaning 組件 | 0.5天 | COMP-001 | `component`, `p1` |  
| **COMP-004** | CardFaceExample 組件 | 0.5天 | COMP-001 | `component`, `p1` |
| **COMP-005** | MediaEmbed 組件 | 1天 | COMP-004 | `component`, `p1` |
| **COMP-006** | ReviewControls 組件 | 1天 | COMP-001 | `component`, `p1` |
| **HOOK-001** | useDueCards hook 實作 | 1天 | API-002, SRV-004 | `hook`, `p1` |
| **HOOK-002** | useReviewCard hook 實作 | 1天 | API-002, SRV-004 | `hook`, `p1` |  
| **HOOK-003** | useAddCard hook 實作 | 1天 | API-002, SRV-004 | `hook`, `p1` |
| **PAGE-001** | DeckView 主頁面實作 | 1.5天 | HOOK-001, COMP-001 | `page`, `p1` |

### 🟤 待辦 (TODO) - 低優先級 (Phase 2+ 後端整合)
| 任務 | 描述 | 預估工時 | 相依性 | 標籤 |
|------|------|----------|--------|------|
| **PAGE-002** | AddCardForm 頁面實作 | 1.5天 | HOOK-003 | `page`, `p2` |
| **TEST-001** | MediaEmbed 組件測試 | 0.5天 | COMP-005 | `testing`, `p2` |
| **TEST-002** | Card 導航測試 | 0.5天 | COMP-001 | `testing`, `p2` |
| **TEST-003** | API Hooks 整合測試 | 1天 | HOOK-003 | `testing`, `p2` |
| **TEST-004** | 組件互動測試 | 1天 | PAGE-001 | `testing`, `p2` |
| **E2E-001** | 核心學習流程 E2E 測試腳本 | 1天 | PAGE-001 | `e2e`, `p2` |
| **PERF-001** | Bundle 大小優化 | 0.5天 | PAGE-002 | `performance`, `p2` |
| **SRV-005** | services/api.ts HTTP client切換 | 1天 | MVP完成 | `service`, `phase2` |
| **SRV-006** | services/storage.ts IndexedDB切換 | 1天 | MVP完成 | `service`, `phase2` |
| **SRV-007** | services/notifications.ts實作 | 1天 | MVP完成 | `service`, `phase2` |
| **DEPLOY-001** | 代理層設定 (Cloudflare Workers) | 1天 | SRV-005 | `deploy`, `phase2` |
| **DEPLOY-002** | Google Apps Script 後端 | 2天 | DEPLOY-001 | `deploy`, `phase2` |
| **DEPLOY-003** | 環境變數與部署配置 | 0.5天 | DEPLOY-002 | `deploy`, `phase2` |

### ⏸️ 暫停 (On Hold)
| 任務 | 原因 | 重新評估日期 | 標籤 |
|------|------|-------------|------|
| **LLM-001** | LLM 建議功能設計 | 等待 Phase 1 完成 | 2025-09-15 | `future`, `llm` |
| **MULTI-001** | 多使用者支援架構 | Phase 2 功能 | 2025-10-01 | `future`, `multi-user` |

### ✅ 完成 (Done)
| 任務 | 完成日期 | 負責人 | 備註 |
|------|----------|--------|------|
| **DOC-001** | README.md 撰寫 | 2025-08-27 | - | 專案介紹、技術棧、快速啟動 |
| **DOC-002** | SPEC.md 撰寫 | 2025-08-27 | - | 功能規格、API、架構設計 |
| **DOC-003** | CONTRIBUTING.md 撰寫 | 2025-08-27 | - | Git Flow、程式碼風格 |
| **DOC-004** | PROCESS.md 撰寫 | 2025-08-27 | - | DoR/DoD、任務流程 SOP |
| **DOC-005** | TODOLIST.md 撰寫 | 2025-08-27 | - | 任務追蹤看板 |
| **DOC-006** | REPORT.md 撰寫 | 2025-08-27 | - | 開發日誌、問題紀錄 |
| **DOC-007** | TESTCASES.md 撰寫 | 2025-08-27 | - | 驗收標準與測試案例 |

---

## 🗓 里程碑計劃

### M1: 專案基礎建設 (2025-08-27 - 2025-08-30)
**目標**: 建立可運行的開發環境與核心算法
- [x] 專案文檔完成
- [ ] 開發環境設定 (ENV-001 to ENV-005)
- [ ] SRS 算法實作 (SRS-001 to SRS-003)  
- [ ] 基礎 API 層 (API-001, API-002)

**交付物**: 
- 可執行的 Vite + React 專案
- 完整測試的 SRS 算法
- API 服務基礎架構

### M2: 核心組件開發 (2025-08-31 - 2025-09-07)
**目標**: 完成主要 UI 組件與學習流程
- [ ] 所有 Card 相關組件 (COMP-001 to COMP-006)
- [ ] React Query Hooks (HOOK-001 to HOOK-003)
- [ ] 主學習頁面 (PAGE-001)

**交付物**:
- 可互動的卡片學習介面
- 完整的複習流程
- 本地 Mock 資料測試

### M3: 測試與優化 (2025-09-08 - 2025-09-14)  
**目標**: 完善測試覆蓋與效能優化
- [ ] 單元測試完成 (TEST-001 to TEST-004)
- [ ] E2E 測試腳本 (E2E-001)
- [ ] 效能優化 (PERF-001)

**交付物**:
- 80%+ 測試覆蓋率
- E2E 測試自動化
- 效能基準確立

### M4: 部署與整合 (2025-09-15 - 2025-09-21)
**目標**: 完成後端整合與生產環境部署
- [ ] 代理層實作 (DEPLOY-001)
- [ ] Google Apps Script 後端 (DEPLOY-002)  
- [ ] 生產環境配置 (DEPLOY-003)

**交付物**:
- 可用的生產環境
- 完整的 CI/CD 流程
- 監控與日誌系統

---

## 🚀 Sprint 規劃

### Current Sprint: Initialization (2025-08-27 - 2025-08-30)
**Sprint Goal**: 建立穩固的開發基礎

**Sprint Backlog**:
- [x] ~~DOC-001 to DOC-007~~ ✅ (專案文檔)
- [ ] ENV-001: Vite + React 專案初始化
- [ ] ENV-002: TypeScript 配置
- [ ] ENV-003: Tailwind CSS 設定  
- [ ] ENV-004: ESLint + Prettier 配置
- [ ] ENV-005: Jest + RTL 測試環境

**Sprint 容量**: 15 story points (3 天 × 5 points/天)

### Next Sprint: Core Algorithm (2025-08-31 - 2025-09-06)
**Sprint Goal**: 實作並測試 SRS 核心算法

**計劃 Backlog**:
- [ ] SRS-001: Leitner Box 算法
- [ ] SRS-002: SM-2 算法  
- [ ] SRS-003: SRS 算法測試
- [ ] API-001: API 服務層
- [ ] API-002: React Query 配置

---

## 📊 進度追蹤

### 每日更新 (Daily Standup Notes)
**2025-08-27**
- **完成**: 所有專案文檔撰寫完成
- **進行中**: 準備開始開發環境設定
- **阻礙**: 無
- **明日計劃**: 開始 Vite 專案初始化

### 每週總結 (Weekly Summary)
**Week 35 (2025-08-26 - 2025-09-01)**
- **本週目標**: 完成專案文檔與開發環境設定
- **完成任務**: 7/7 文檔任務
- **下週重點**: SRS 算法實作與基礎 API 層

---

## 🔍 標籤系統

### 優先級標籤
- `p0` - 必須完成 (Blocker)
- `p1` - 高優先級 (High) 
- `p2` - 中優先級 (Medium)
- `p3` - 低優先級 (Low)

### 功能標籤  
- `setup` - 環境設定
- `core` - 核心邏輯
- `component` - UI 組件
- `api` - API 相關
- `testing` - 測試相關
- `deploy` - 部署相關
- `docs` - 文檔相關

### 狀態標籤
- `blocked` - 被阻擋
- `review` - 等待審查
- `rework` - 需要重做  
- `future` - 未來功能

---

## 🎯 個人任務 (如適用)

### 指派給開發者 A
- [ ] ENV-001: Vite 專案初始化
- [ ] SRS-001: Leitner 算法實作
- [ ] COMP-001: Card 組件基礎

### 指派給開發者 B  
- [ ] ENV-005: 測試環境設定
- [ ] TEST-003: API 整合測試
- [ ] DEPLOY-001: 代理層實作

---

## 📈 指標追蹤

### 開發指標 (本週)
- **任務完成率**: 100% (7/7)
- **平均完成時間**: 0.14 天/任務
- **程式碼覆蓋率**: N/A (尚無程式碼)
- **技術債務**: 0 issues

### 品質指標
- **Bug 發現率**: 0 bugs
- **PR 平均審查時間**: N/A
- **建構成功率**: 100%

---

## 🔄 流程改進

### 本週學習
- 文檔驅動開發有助於釐清需求
- TDD 方法論需要更具體的測試案例規劃
- 任務拆分粒度適中，有利於進度追蹤

### 下週調整
- 增加每日 standup 紀錄
- 建立 PR 模板與審查清單
- 設定自動化測試 pipeline

---

**📝 Note**: 此檔案為活文件，每日更新進度，每週總結調整。使用 ADR 記錄重大決策變更。