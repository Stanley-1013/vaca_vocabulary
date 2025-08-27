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
└── process/
    ├── PROCESS.md              # 開發流程 SOP
    ├── TODOLIST.md             # 任務追蹤看板
    └── REPORT.md               # 開發日誌與問題紀錄
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

## 🔍 快速導航

**新加入開發者** → 先讀 README.md，再看 CONTRIBUTING.md  
**了解需求規格** → SPEC.md + TESTCASES.md  
**查看開發進度** → TODOLIST.md + REPORT.md  
**學習開發流程** → PROCESS.md + CONTRIBUTING.md

## 📝 文檔更新原則

- 重大變更使用 ADR (Architecture Decision Records)
- 日常進度更新 REPORT.md 和 TODOLIST.md
- 規格變更需同步更新 SPEC.md 和 TESTCASES.md
- 所有變更都要在 git commit 中說明