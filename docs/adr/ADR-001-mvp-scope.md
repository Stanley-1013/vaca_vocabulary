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

### 受影響文件
- **docs/specs/SPEC.md**: 新增服務層抽象化架構設計
- **docs/README.md**: 更新技術棧說明，區分MVP與完整後端
- **docs/process/TODOLIST.md**: 調整任務優先級，新增服務層任務
- **docs/specs/TESTCASES.md**: 標註後端相關測試適用階段
- **docs/guides/CONTRIBUTING.md**: 更新環境變數設定說明

### 修改內容摘要
- **SPEC.md**: 增加 MVP架構策略章節，定義 IApiService/IStorageService/INotificationService 介面
- **README.md**: 後端架構章節區分 Phase 1 MVP (JSON fixtures) 與 Phase 2+ (Apps Script)
- **TODOLIST.md**: 新增 SRV-001~004 服務層任務，調整 API 相關任務相依性
- **TESTCASES.md**: 標註 HMAC 測試適用於 Phase 2+ 後端整合
- **CONTRIBUTING.md**: 環境變數設定區分 MVP 階段與後端整合階段

---
### AI Implementation Log

**執行日期**: 2025-08-27  
**執行者**: AI ADR Executor  
**ADR參考**: ADR-001-mvp-scope  

#### Phase 1: Initial Implementation
**修改的主要文件**:
1. **docs/specs/SPEC.md** - 新增 MVP 架構策略章節
   - 添加服務層抽象化介面定義 (IApiService, IStorageService, INotificationService)
   - 更新 System Context Diagram 區分 MVP 與 Future 架構
   - 明確標示 Phase 1 使用 JSON fixtures + localStorage

2. **docs/README.md** - 更新後端架構說明
   - 重構後端架構章節，明確區分 Phase 1 MVP 與 Phase 2+ 完整後端
   - 新增 API 設計抽象化介面說明
   - 強調服務層切換的無痛特性

3. **docs/process/TODOLIST.md** - 任務優先級調整
   - 新增 SRV-001~004 服務層實作任務至高優先級
   - 調整 Hook 任務相依性，依賴 JSON fixtures (SRV-004)
   - 將後端部署任務移至低優先級 Phase 2+

#### Phase 2: Ripple Effect Analysis & Correction
**修正的衝突文件**:
1. **docs/specs/TESTCASES.md** - 標註測試適用階段
   - 為 HMAC 安全測試添加註解，說明適用於 Phase 2+ 後端整合
   - 保持測試案例完整性，為未來後端切換做準備

2. **docs/guides/CONTRIBUTING.md** - 環境設定更新
   - 更新環境變數設定章節，區分 MVP 階段與後端整合階段
   - MVP 階段說明無需 API_BASE_URL，Phase 2+ 提供完整環境變數設定

#### 實施影響評估
- ✅ **一致性**: 所有文件均反映 ADR-001 的 MVP-first 策略
- ✅ **可追溯性**: 每個變更都能追溯至 ADR-001 的具體決策點
- ✅ **向前相容**: 為 Phase 2+ 後端整合預留清晰的升級路徑
- ✅ **開發效率**: 服務層抽象化確保開發團隊可專注核心功能

#### 總結
按照 ADR-001 決策，成功將專案文檔從「完整後端架構」調整為「MVP-first 漸進式架構」。透過服務層抽象化，既能快速交付 MVP，又能為後續後端整合奠定基礎，完全符合「預留鉤子」的架構策略。

---

### vNext Enhancement Implementation (2025-08-28)

**增強版本**: 1.1.0  
**執行日期**: 2025-08-28  
**執行者**: AI Enhancement Executor  
**決策基礎**: ADR-001 MVP-first 漸進式架構策略

#### vNext 1.1.0 增強內容

**增強類型**: Feature Enhancement (非新 ADR)
- 基於 MVP 1.0.0 使用回饋的功能增強
- 不涉及重大架構變更，在既有基礎上增強
- 遵循 ADR-001 預留鉤子與漸進式升級策略
- 契約優先開發，立即可實作測試

#### 核心增強功能

1. **每日複習上限與智能優先排序**
   - 當到期卡片 > 每日上限 (預設20張) 時智能篩選
   - 基於難度 (0.5) + 逾期 (0.3) + 層級 (0.2) 的優先評分
   - 前端即時計算，不改現有資料模型

2. **Again 重複功能**  
   - 當日佇列重排，不影響 SRS 演算法
   - 插入間隔序列 [2,5,10]，依次數使用
   - 提供適度重複練習機會

3. **間隔預測顯示**
   - 按鈕顯示預測下次複習間隔
   - 「困難 (1天)」、「普通 (3天)」、「容易 (7天)」格式
   - 支援 Leitner 和 SM-2 算法

4. **完成頁延續選項**
   - 複習完成後提供「背更多單字」功能
   - 為 Phase 2+ AI 測驗準備「智能測驗」選項
   - 顯示今日學習統計與成效

5. **LLM 整合 API 契約**
   - `/llm/suggest` 新字建議端點契約
   - `/llm/quiz` 智能測驗端點契約  
   - 錯誤處理與降級策略準備

#### 文檔更新範圍

**主要文檔變更**:
- `docs/specs/SPEC.md` → v1.1.0: 新增 vNext 增強規格
- `docs/CHANGELOG.md` → 建立版本控制記錄
- `docs/updates/2025-08-28-vnext-enhancement.md` → 詳細實施文檔
- `docs/specs/TESTCASES.md` → v1.1.0: 增強功能測試案例

**架構一致性**:
- ✅ 保持 ADR-001 MVP-first 原則
- ✅ 服務層抽象化架構不變  
- ✅ JSON fixtures + localStorage 策略延續
- ✅ 為 Phase 2+ 後端整合預留升級路徑

#### 實施影響評估

**向後相容**: ✅ 既有 MVP 功能完全保留  
**契約就緒**: ✅ 4 個新函式可立即實作測試  
**Phase 2+ 準備**: ✅ LLM 端點契約完整，後端可直接對齊  
**文檔完整性**: ✅ 更新日誌、測試案例、實施記錄完備

#### 後續開發路徑

**立即開發** (契約就緒):
1. `services/srs.ts` 新增 4 個預測函式
2. `ReviewControls` 升級為 4 按鈕設計  
3. `useDueCards` 整合優先排序邏輯
4. `CompletionPage` 提供延續學習選項

**Phase 2+ 整合**:
- 後端 API 對齊既有契約，無痛切換
- LLM 服務整合準備完成
- 測試套件覆蓋完整功能

**結論**: vNext 1.1.0 成功在 ADR-001 架構框架內實現功能增強，保持 MVP-first 漸進式發展策略，為後續階段奠定穩固基礎。
