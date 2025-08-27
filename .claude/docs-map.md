# 專案文檔地圖

## 📁 文檔結構

```
docs/
├── README.md                    # 專案總覽與快速開始
├── specs/
│   ├── SPEC.md                 # 功能規格與 API 設計
│   └── TESTCASES.md            # 測試案例與驗收標準
├── guides/
│   └── CONTRIBUTING.md         # 開發貢獻指南
├── process/
│   ├── PROCESS.md              # 開發流程 SOP
│   ├── TODOLIST.md             # 任務追蹤看板
│   ├── REPORT.md               # 開發日誌與問題紀錄
│   ├── TEST-VALIDATION.md      # 測試架構驗證報告
│   ├── AI_ADR_EXECUTOR_TEMPLATE.md    # ADR 執行模板
│   └── AI_REVIEWER_TEMPLATE.md        # ADR 審查模板
├── templates/
│   └── ADR_TEMPLATE.md         # ADR 範本格式
└── adr/
    ├── ADR-001-mvp-scope.md    # MVP 範圍決策
    ├── ADR-002-apps-script-backend.md  # 後端技術選擇
    └── ADR-003-capacitor-extension.md  # 行動端擴展策略
```

## 📋 文檔類型說明

### 🎯 一次性規範 (設定後少更動)
- **README.md** - 專案介紹、技術棧、環境設定
- **SPEC.md** - 功能規格、API 介面、架構設計  
- **CONTRIBUTING.md** - Git Flow、程式碼風格、審查標準
- **PROCESS.md** - DoR/DoD、測試策略、發布流程

### 🔄 常態更新 (開發過程持續維護)
- **TODOLIST.md** - 任務狀態、進度追蹤、里程碑
- **REPORT.md** - 日誌、問題記錄、決策歷程
- **TESTCASES.md** - 驗收標準、測試案例、品質檢核
- **TEST-VALIDATION.md** - 測試架構與覆蓋率報告

### 🏛️ 架構決策記錄 (ADR)
- **ADR-001** - MVP 範圍與技術債管理策略
- **ADR-002** - Google Apps Script 後端選擇
- **ADR-003** - Capacitor 行動端擴展方案
- **AI_ADR_EXECUTOR_TEMPLATE** - ADR 自動執行流程模板
- **AI_REVIEWER_TEMPLATE** - ADR 審查標準模板

## 🔍 快速導航

**新加入開發者** → 先讀 README.md，再看 CONTRIBUTING.md  
**了解需求規格** → SPEC.md + TESTCASES.md  
**查看開發進度** → TODOLIST.md + REPORT.md  
**學習開發流程** → PROCESS.md + CONTRIBUTING.md  
**架構決策查詢** → docs/adr/ 目錄下的 ADR 文件  
**建立新 ADR** → 使用 docs/templates/ADR_TEMPLATE.md

## 📝 文檔更新原則

- **重大架構變更** 使用 ADR (Architecture Decision Records) 記錄
- **日常進度更新** REPORT.md 和 TODOLIST.md
- **規格變更** 需同步更新 SPEC.md 和 TESTCASES.md
- **測試架構變更** 更新 TEST-VALIDATION.md
- **所有變更** 都要在 git commit 中說明原因與影響範圍

## 🔄 ADR 工作流程

1. **提案階段** - 使用 ADR_TEMPLATE.md 建立新 ADR
2. **執行階段** - 使用 AI_ADR_EXECUTOR_TEMPLATE.md 指導實作
3. **審查階段** - 使用 AI_REVIEWER_TEMPLATE.md 進行代碼審查
4. **歸檔階段** - ADR 狀態更新為 Accepted/Rejected/Superseded