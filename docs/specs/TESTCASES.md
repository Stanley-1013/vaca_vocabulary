# TESTCASES.md - 測試案例與驗收標準

> **驗收標準 (AC) | 功能測試案例 | 測試規格書**

**Project**: 背單字 MVP - Vocabulary Learning App  
**Last Updated**: 2025-08-27  
**Testing Strategy**: TDD (Test-Driven Development)

---

## 📋 Table of Contents

1. [測試總覽](#測試總覽)
2. [驗收標準 (AC)](#驗收標準-ac)
3. [單元測試案例](#單元測試案例)
4. [組件測試案例](#組件測試案例)
5. [整合測試案例](#整合測試案例)
6. [End-to-End 測試案例](#end-to-end-測試案例)
7. [效能測試案例](#效能測試案例)
8. [安全測試案例](#安全測試案例)
9. [可用性測試案例](#可用性測試案例)

---

## 🎯 測試總覽

### 測試金字塔策略
```
        /\     E2E (10%)
       /  \    關鍵使用者流程
      /    \   
     /      \  Integration (20%)  
    /        \ API + Component 互動
   /          \
  /______________\ Unit Tests (70%)
   純函式 + 業務邏輯
```

### 覆蓋率目標
- **整體覆蓋率**: ≥ 80%
- **核心模組** (SRS, API): ≥ 90%
- **UI 組件**: ≥ 70%
- **關鍵路徑**: 100%

### 測試環境配置
```json
{
  "unit": "Jest + Testing Library",
  "integration": "MSW + React Testing Library", 
  "e2e": "Playwright (概念驗證)",
  "performance": "Lighthouse + Web Vitals",
  "security": "手動測試 + 自動掃描"
}
```

---

## ✅ 驗收標準 (AC)

### AC-001: 基本學習流程
**Feature**: 使用者能完成完整的單字複習流程

**Given**: 使用者有3張到期的單字卡  
**When**: 使用者進入應用程式  
**Then**: 
- [ ] 顯示「開始複習」按鈕和今日統計
- [ ] 點擊後進入第一張卡片 (Front 面)
- [ ] 可以切換到 Meaning 和 Example 面
- [ ] 可以選擇困難度評分 (1-3)
- [ ] 評分後自動進入下一張卡片  
- [ ] 完成所有卡片後顯示完成畫面

### AC-002: 卡片三面導航
**Feature**: 單字卡片支援三面切換與鍵盤操作

**Given**: 使用者在複習一張單字卡  
**When**: 使用者進行導航操作  
**Then**:
- [ ] 預設顯示 Front 面 (單字)
- [ ] 按 `→` 或右滑進入 Meaning 面
- [ ] 按 `→` 或右滑進入 Example 面  
- [ ] 按 `←` 或左滑回到上一面
- [ ] 按 `Space` 循環切換三面
- [ ] 每面都有清楚的視覺指示

### AC-003: SRS 演算法正確性
**Feature**: 間隔複習演算法按照規格運作

**Given**: 使用者對卡片進行評分  
**When**: 系統計算下次複習時間  
**Then**:
- [ ] Leitner: 簡單(3) → 升盒，普通(2) → 維持，困難(1) → 回到盒子1
- [ ] SM-2: 根據 ease 係數動態調整間隔
- [ ] 計算結果與伺服器端算法一致
- [ ] 下次複習時間正確更新

### AC-004: 多媒體錨點支援
**Feature**: 卡片支援圖片、影片、連結等多媒體內容

**Given**: 單字卡片包含多媒體錨點  
**When**: 使用者查看 Example 面  
**Then**:
- [ ] 圖片正確顯示，有 alt 文字
- [ ] YouTube 影片使用 embed iframe
- [ ] MP4 影片有 controls 控制項
- [ ] 外部連結在新分頁開啟
- [ ] 載入失敗時顯示友善錯誤訊息

### AC-005: 新增卡片功能
**Feature**: 使用者可以新增自己的單字卡片

**Given**: 使用者想要新增單字  
**When**: 使用者填寫新增表單  
**Then**:
- [ ] 必填欄位: 單字、詞性、中文意思、例句
- [ ] 可選欄位: 同義詞、反義詞、多媒體錨點、標籤
- [ ] 表單驗證提供即時回饋
- [ ] 提交成功後自動回到主頁面
- [ ] 新卡片明日出現在複習列表

### AC-006: 錯誤處理與恢復
**Feature**: 系統優雅處理各種錯誤情況

**Given**: 發生網路或系統錯誤  
**When**: 使用者執行操作  
**Then**:
- [ ] 網路錯誤: 顯示重試按鈕，保持當前狀態
- [ ] API 錯誤: 顯示具體錯誤訊息
- [ ] 驗證錯誤: 高亮問題欄位
- [ ] 未知錯誤: 提供聯繫管理員選項
- [ ] 所有錯誤都有使用者友善的文案

---

## 🧪 單元測試案例

### SRS 演算法測試 (services/srs.test.ts)

#### Leitner Box 算法
```typescript
describe('Leitner Box Algorithm', () => {
  describe('nextByLeitner', () => {
    test('TC-SRS-001: 評分3應該升級盒子', () => {
      // Arrange
      const card = createTestCard({ box: 2, interval: 2 });
      const today = new Date('2025-08-27');
      
      // Act  
      const result = nextByLeitner(card, 3, today);
      
      // Assert
      expect(result.box).toBe(3);
      expect(result.interval).toBe(3); // LEITNER_INTERVALS[3]
      expect(result.nextReviewAt).toBe('2025-08-30T00:00:00.000Z');
      expect(result.reps).toBe(card.reps + 1);
    });
    
    test('TC-SRS-002: 評分2應該維持當前盒子', () => {
      const card = createTestCard({ box: 3, interval: 3 });
      const result = nextByLeitner(card, 2);
      
      expect(result.box).toBe(3);
      expect(result.interval).toBe(3);
      expect(result.reps).toBe(card.reps + 1);
    });
    
    test('TC-SRS-003: 評分1應該回到第一個盒子', () => {
      const card = createTestCard({ box: 5, interval: 14, reps: 10 });
      const result = nextByLeitner(card, 1);
      
      expect(result.box).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.reps).toBe(10); // reps 在評分1時不變
    });
    
    test('TC-SRS-004: 第5盒不能再升級', () => {
      const card = createTestCard({ box: 5 });
      const result = nextByLeitner(card, 3);
      
      expect(result.box).toBe(5); // 封頂
      expect(result.interval).toBe(14);
    });
  });
});
```

#### SM-2 算法
```typescript
describe('SM-2 Algorithm', () => {
  describe('nextBySM2', () => {
    test('TC-SRS-005: 首次複習間隔應為1天', () => {
      const card = createTestCard({ reps: 0, interval: 0, ease: 2.5 });
      const result = nextBySM2(card, 2);
      
      expect(result.interval).toBe(1);
      expect(result.reps).toBe(1);
      expect(result.ease).toBe(2.5);
    });
    
    test('TC-SRS-006: 第二次複習間隔應為6天', () => {
      const card = createTestCard({ reps: 1, interval: 1, ease: 2.5 });
      const result = nextBySM2(card, 3);
      
      expect(result.interval).toBe(6);
      expect(result.reps).toBe(2);
      expect(result.ease).toBe(2.6); // 評分3增加0.1
    });
    
    test('TC-SRS-007: 第三次開始使用ease係數', () => {
      const card = createTestCard({ reps: 2, interval: 6, ease: 2.6 });
      const result = nextBySM2(card, 2);
      
      expect(result.interval).toBe(Math.round(6 * 2.6)); // 16天
      expect(result.reps).toBe(3);
      expect(result.ease).toBe(2.6);
    });
    
    test('TC-SRS-008: 評分1重置進度並降低ease', () => {
      const card = createTestCard({ reps: 5, interval: 30, ease: 2.8 });
      const result = nextBySM2(card, 1);
      
      expect(result.reps).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.ease).toBe(2.6); // 2.8 - 0.2
    });
    
    test('TC-SRS-009: ease係數不能低於1.3', () => {
      const card = createTestCard({ ease: 1.4 });
      const result = nextBySM2(card, 1);
      
      expect(result.ease).toBe(1.3); // Math.max(1.3, 1.4 - 0.2)
    });
  });
});
```

### 工具函式測試 (utils.test.ts)
```typescript
describe('Utility Functions', () => {
  describe('dateUtils', () => {
    test('TC-UTIL-001: addDays 正確計算日期', () => {
      const date = new Date('2025-08-27');
      const result = addDays(date, 5);
      expect(result.toISOString().split('T')[0]).toBe('2025-09-01');
    });
    
    test('TC-UTIL-002: iso 格式化正確', () => {
      const date = new Date('2025-08-27T15:30:00');
      expect(iso(date)).toBe('2025-08-27T15:30:00.000Z');
    });
  });
});
```

---

## ⚛️ 組件測試案例

### Card 組件測試 (components/Card/Card.test.tsx)
```typescript
describe('Card Component', () => {
  const mockCard = createTestCard({
    word: { base: 'ubiquitous', forms: [{ pos: 'adj.', form: 'ubiquitous' }] },
    meaning: '無所不在的'
  });
  
  test('TC-CARD-001: 預設顯示 Front 面', () => {
    render(<Card card={mockCard} onFlip={vi.fn()} onNext={vi.fn()} />);
    
    expect(screen.getByText('ubiquitous')).toBeInTheDocument();
    expect(screen.getByText('adj.')).toBeInTheDocument();
    expect(screen.queryByText('無所不在的')).not.toBeInTheDocument();
  });
  
  test('TC-CARD-002: 右箭頭鍵切換到 Meaning 面', async () => {
    const user = userEvent.setup();
    render(<Card card={mockCard} onFlip={vi.fn()} onNext={vi.fn()} />);
    
    await user.keyboard('{ArrowRight}');
    
    expect(screen.getByText('無所不在的')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /meaning/i })).toBeInTheDocument();
  });
  
  test('TC-CARD-003: 左箭頭鍵回到上一面', async () => {
    const user = userEvent.setup();
    render(<Card card={mockCard} onFlip={vi.fn()} onNext={vi.fn()} />);
    
    // 先到 Meaning 面
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('無所不在的')).toBeInTheDocument();
    
    // 再回到 Front 面
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('ubiquitous')).toBeInTheDocument();
  });
  
  test('TC-CARD-004: Space 鍵循環切換面', async () => {
    const user = userEvent.setup();
    render(<Card card={mockCard} onFlip={vi.fn()} onNext={vi.fn()} />);
    
    // Front -> Meaning
    await user.keyboard(' ');
    expect(screen.getByText('無所不在的')).toBeInTheDocument();
    
    // Meaning -> Example  
    await user.keyboard(' ');
    expect(screen.getByRole('region', { name: /example/i })).toBeInTheDocument();
    
    // Example -> Front
    await user.keyboard(' ');
    expect(screen.getByText('ubiquitous')).toBeInTheDocument();
  });
});
```

### MediaEmbed 組件測試 (components/Card/MediaEmbed.test.tsx)
```typescript
describe('MediaEmbed Component', () => {
  test('TC-MEDIA-001: 渲染圖片錨點', () => {
    const anchor: Anchor = {
      type: 'image',
      url: 'https://example.com/image.jpg',
      title: 'Test Image'
    };
    
    render(<MediaEmbed anchor={anchor} />);
    
    const img = screen.getByAltText('Test Image');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(img).toHaveClass('max-w-full', 'rounded');
  });
  
  test('TC-MEDIA-002: 渲染YouTube嵌入', () => {
    const anchor: Anchor = {
      type: 'youtube',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'Test Video'
    };
    
    render(<MediaEmbed anchor={anchor} />);
    
    const iframe = screen.getByTitle('Test Video');
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(iframe).toHaveAttribute('allowfullscreen');
  });
  
  test('TC-MEDIA-003: 渲染MP4影片', () => {
    const anchor: Anchor = {
      type: 'mp4',
      url: 'https://example.com/video.mp4'
    };
    
    render(<MediaEmbed anchor={anchor} />);
    
    const video = screen.getByRole('application'); // video with controls
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
    expect(video).toHaveAttribute('controls');
  });
  
  test('TC-MEDIA-004: 渲染外部連結', () => {
    const anchor: Anchor = {
      type: 'link',
      url: 'https://example.com',
      title: 'Example Link'
    };
    
    render(<MediaEmbed anchor={anchor} />);
    
    const link = screen.getByRole('link', { name: 'Example Link' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
  });
  
  test('TC-MEDIA-005: 缺少title時使用URL', () => {
    const anchor: Anchor = {
      type: 'link',
      url: 'https://example.com'
      // title 缺少
    };
    
    render(<MediaEmbed anchor={anchor} />);
    
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });
});
```

### ReviewControls 組件測試
```typescript
describe('ReviewControls Component', () => {
  test('TC-REVIEW-001: 渲染三個評分按鈕', () => {
    const onRate = vi.fn();
    render(<ReviewControls onRate={onRate} />);
    
    expect(screen.getByRole('button', { name: /困難|1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /普通|2/i })).toBeInTheDocument();  
    expect(screen.getByRole('button', { name: /容易|3/i })).toBeInTheDocument();
  });
  
  test('TC-REVIEW-002: 點擊按鈕觸發正確評分', async () => {
    const onRate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(<ReviewControls onRate={onRate} />);
    
    await user.click(screen.getByRole('button', { name: /容易|3/i }));
    
    expect(onRate).toHaveBeenCalledWith(3);
  });
  
  test('TC-REVIEW-003: busy狀態時按鈕被禁用', () => {
    const onRate = vi.fn();
    render(<ReviewControls onRate={onRate} busy={true} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
  
  test('TC-REVIEW-004: 鍵盤快捷鍵1-3', async () => {
    const onRate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(<ReviewControls onRate={onRate} />);
    
    await user.keyboard('2');
    expect(onRate).toHaveBeenCalledWith(2);
  });
});
```

---

## 🔗 整合測試案例

### API Hooks 測試 (hooks.test.tsx)
```typescript
describe('API Hooks Integration', () => {
  let server: SetupServerApi;
  
  beforeAll(() => {
    server = setupServer(
      rest.get('/cards', (req, res, ctx) => {
        const due = req.url.searchParams.get('due');
        if (due === 'today') {
          return res(ctx.json({
            ok: true,
            data: [createTestCard(), createTestCard({ id: 'test-2' })]
          }));
        }
        return res(ctx.status(400));
      })
    );
    server.listen();
  });
  
  afterAll(() => server.close());
  
  test('TC-HOOK-001: useDueCards 載入今日卡片', async () => {
    const { result } = renderHook(() => useDueCards(), {
      wrapper: ({ children }) => (
        <QueryClient>
          <QueryClientProvider client={new QueryClient()}>
            {children}
          </QueryClientProvider>
        </QueryClient>
      )
    });
    
    // 等待載入完成
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].id).toBe('test-1');
  });
  
  test('TC-HOOK-002: useReviewCard 提交評分', async () => {
    server.use(
      rest.patch('/cards/:id/review', (req, res, ctx) => {
        return res(ctx.json({
          ok: true,
          nextReviewAt: '2025-08-28T00:00:00Z',
          box: 2,
          interval: 2
        }));
      })
    );
    
    const { result } = renderHook(() => useReviewCard(), {
      wrapper: createQueryWrapper()
    });
    
    await act(async () => {
      const response = await result.current.mutateAsync({
        id: 'test-1',
        quality: 3
      });
      
      expect(response.ok).toBe(true);
      expect(response.box).toBe(2);
    });
  });
  
  test('TC-HOOK-003: API錯誤處理', async () => {
    server.use(
      rest.get('/cards', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({
          ok: false,
          error: { code: 'SERVER_ERROR', message: 'Internal error' }
        }));
      })
    );
    
    const { result } = renderHook(() => useDueCards(), {
      wrapper: createQueryWrapper()
    });
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    
    expect(result.current.error).toBeTruthy();
  });
});
```

### 組件整合測試
```typescript
describe('DeckView Integration', () => {
  test('TC-INTEGRATION-001: 完整學習流程', async () => {
    const mockCards = [
      createTestCard({ id: 'card-1', word: { base: 'test1', forms: [] } }),
      createTestCard({ id: 'card-2', word: { base: 'test2', forms: [] } })
    ];
    
    server.use(
      rest.get('/cards', (req, res, ctx) => res(ctx.json({ ok: true, data: mockCards }))),
      rest.patch('/cards/:id/review', (req, res, ctx) => 
        res(ctx.json({ ok: true, nextReviewAt: '2025-08-28' }))
      )
    );
    
    const user = userEvent.setup();
    render(<DeckView />, { wrapper: createAppWrapper() });
    
    // 等待卡片載入
    await screen.findByText('test1');
    
    // 查看意思面
    await user.keyboard('{ArrowRight}');
    
    // 評分為容易
    await user.click(screen.getByRole('button', { name: /容易/i }));
    
    // 應該進入下一張卡片
    await screen.findByText('test2');
    
    expect(screen.queryByText('test1')).not.toBeInTheDocument();
  });
});
```

---

## 🌐 End-to-End 測試案例

### 核心學習流程 (e2e/learning-flow.spec.ts)
```typescript
import { test, expect } from '@playwright/test';

describe('Learning Flow E2E', () => {
  test('TC-E2E-001: 完整學習工作流程', async ({ page }) => {
    // 1. 進入應用
    await page.goto('/');
    
    // 2. 確認今日統計顯示
    await expect(page.locator('[data-testid="due-count"]')).toContainText('3');
    
    // 3. 開始複習
    await page.click('[data-testid="start-review-btn"]');
    
    // 4. 確認在第一張卡片
    await expect(page.locator('[data-testid="card-front"]')).toBeVisible();
    await expect(page.locator('[data-testid="word-text"]')).toContainText('ubiquitous');
    
    // 5. 導航到意思面
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="card-meaning"]')).toBeVisible();
    await expect(page.locator('[data-testid="meaning-text"]')).toContainText('無所不在的');
    
    // 6. 導航到例句面  
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="card-example"]')).toBeVisible();
    
    // 7. 評分為容易
    await page.click('[data-testid="quality-3"]');
    
    // 8. 確認進入下一張
    await expect(page.locator('[data-testid="card-counter"]')).toContainText('2/3');
    await expect(page.locator('[data-testid="word-text"]')).toContainText('ephemeral');
    
    // 9. 快速完成剩餘卡片
    await page.click('[data-testid="quality-2"]'); // 第二張
    await page.click('[data-testid="quality-1"]'); // 第三張
    
    // 10. 確認完成畫面
    await expect(page.locator('[data-testid="completion-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="completion-message"]')).toContainText('今日複習完成');
  });
  
  test('TC-E2E-002: 新增卡片流程', async ({ page }) => {
    await page.goto('/');
    
    // 進入新增頁面
    await page.click('[data-testid="add-card-btn"]');
    await expect(page).toHaveURL('/add');
    
    // 填寫表單
    await page.fill('[data-testid="word-input"]', 'serendipity');
    await page.selectOption('[data-testid="pos-select"]', 'n.');
    await page.fill('[data-testid="meaning-input"]', '意外的發現');
    await page.fill('[data-testid="example-input"]', 'It was pure serendipity that we met.');
    
    // 提交表單
    await page.click('[data-testid="submit-btn"]');
    
    // 確認成功並返回主頁
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('新增成功');
  });
  
  test('TC-E2E-003: 錯誤恢復流程', async ({ page }) => {
    // 模擬網路錯誤
    await page.route('/cards**', route => route.abort());
    
    await page.goto('/');
    
    // 確認錯誤訊息
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
    
    // 恢復網路並重試
    await page.unroute('/cards**');
    await page.click('[data-testid="retry-btn"]');
    
    // 確認恢復正常
    await expect(page.locator('[data-testid="due-count"]')).toBeVisible();
  });
});
```

### 可存取性測試 (a11y)
```typescript
test('TC-A11Y-001: 鍵盤導航完整性', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="start-review-btn"]');
  
  // 使用 Tab 鍵導航
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'quality-1');
  
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'quality-2');
  
  // 確認 ARIA labels
  const card = page.locator('[data-testid="card-container"]');
  await expect(card).toHaveAttribute('role', 'region');
  await expect(card).toHaveAttribute('aria-label');
});
```

---

## ⚡ 效能測試案例

### 載入效能測試
```typescript
describe('Performance Tests', () => {
  test('TC-PERF-001: 首次載入時間', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3秒內完成載入
  });
  
  test('TC-PERF-002: 卡片切換動畫流暢度', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="start-review-btn"]');
    
    const startTime = performance.now();
    await page.keyboard.press('ArrowRight');
    
    // 等待動畫完成
    await page.waitForSelector('[data-testid="card-meaning"]', { state: 'visible' });
    
    const animationTime = performance.now() - startTime;
    expect(animationTime).toBeLessThan(300); // 300ms內完成動畫
  });
  
  test('TC-PERF-003: 記憶體洩漏檢查', async ({ page }) => {
    await page.goto('/');
    
    // 記錄初始記憶體使用
    const initialMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize);
    
    // 執行多次卡片操作
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowLeft');
    }
    
    // 強制垃圾回收 (如果可用)
    await page.evaluate(() => {
      if (window.gc) window.gc();
    });
    
    const finalMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize);
    const memoryIncrease = finalMemory - initialMemory;
    
    // 記憶體增長應該在合理範圍內 (< 5MB)
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
  });
});
```

### Web Vitals 測試
```typescript
test('TC-VITALS-001: Core Web Vitals', async ({ page }) => {
  await page.goto('/');
  
  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        const vitals = {};
        
        getCLS(metric => vitals.cls = metric.value);
        getFID(metric => vitals.fid = metric.value);  
        getFCP(metric => vitals.fcp = metric.value);
        getLCP(metric => vitals.lcp = metric.value);
        getTTFB(metric => vitals.ttfb = metric.value);
        
        setTimeout(() => resolve(vitals), 2000);
      });
    });
  });
  
  // Core Web Vitals 閾值檢查
  expect(vitals.cls).toBeLessThan(0.1);      // Cumulative Layout Shift
  expect(vitals.fid).toBeLessThan(100);      // First Input Delay (ms)
  expect(vitals.lcp).toBeLessThan(2500);     // Largest Contentful Paint (ms)
});
```

---

## 🔒 安全測試案例

### XSS 防護測試
```typescript
describe('Security Tests', () => {
  test('TC-SEC-001: XSS 防護 - 使用者輸入淨化', async ({ page }) => {
    await page.goto('/add');
    
    // 嘗試注入惡意腳本
    const maliciousInput = '<script>alert("XSS")</script>';
    await page.fill('[data-testid="meaning-input"]', maliciousInput);
    await page.click('[data-testid="submit-btn"]');
    
    // 確認腳本沒有執行
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
    
    // 確認內容被適當轉義
    await page.goto('/');
    // 假設新卡片會出現在列表中
    const content = await page.textContent('[data-testid="card-content"]');
    expect(content).toContain('&lt;script&gt;');
  });
  
  test('TC-SEC-002: API 請求頭驗證', async ({ page }) => {
    // 攔截 API 請求檢查安全頭
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/cards')) {
        requests.push(request);
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const apiRequest = requests[0];
    expect(apiRequest.headers()['content-type']).toBe('application/json');
    
    // 檢查是否有 HMAC 相關頭 (由代理層添加)
    // 實際實作後需要驗證具體頭部名稱
  });
  
  test('TC-SEC-003: 本地存儲安全性', async ({ page }) => {
    await page.goto('/');
    
    // 確認沒有敏感資訊存儲在 localStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    
    // 確認沒有 API keys, tokens 等敏感資料
    Object.values(localStorage).forEach(value => {
      expect(value).not.toMatch(/api[_-]?key/i);
      expect(value).not.toMatch(/secret/i);
      expect(value).not.toMatch(/token/i);
    });
  });
});
```

---

## 👥 可用性測試案例

### 使用者體驗測試
```typescript
describe('Usability Tests', () => {
  test('TC-UX-001: 首次使用者引導', async ({ page }) => {
    // 清空本地存儲模擬首次使用
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // 確認有適當的引導提示
    await expect(page.locator('[data-testid="welcome-guide"]')).toBeVisible();
    await expect(page.locator('[data-testid="keyboard-hints"]')).toBeVisible();
    
    // 確認引導可以關閉
    await page.click('[data-testid="dismiss-guide"]');
    await expect(page.locator('[data-testid="welcome-guide"]')).not.toBeVisible();
  });
  
  test('TC-UX-002: 行動裝置觸控支援', async ({ page }) => {
    // 設定行動裝置視口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.click('[data-testid="start-review-btn"]');
    
    // 模擬觸控滑動
    const card = page.locator('[data-testid="card-container"]');
    await card.hover();
    
    // 向右滑動
    await page.mouse.down();
    await page.mouse.move(100, 0);
    await page.mouse.up();
    
    // 確認切換到 meaning 面
    await expect(page.locator('[data-testid="card-meaning"]')).toBeVisible();
  });
  
  test('TC-UX-003: 錯誤訊息友善性', async ({ page }) => {
    // 模擬表單驗證錯誤
    await page.goto('/add');
    await page.click('[data-testid="submit-btn"]'); // 不填寫任何內容直接提交
    
    // 確認錯誤訊息具體且有幫助
    const errorMessage = page.locator('[data-testid="validation-error"]');
    await expect(errorMessage).toBeVisible();
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('必填');
    expect(errorText).not.toContain('Error'); // 避免技術性錯誤訊息
  });
  
  test('TC-UX-004: 載入狀態友善提示', async ({ page }) => {
    // 模擬慢速網路
    await page.route('/cards**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 延遲2秒
      route.continue();
    });
    
    await page.goto('/');
    
    // 確認載入指示器顯示
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-message"]')).toContainText('載入中');
    
    // 等待載入完成
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });
});
```

### 無障礙功能測試 (Accessibility)
```typescript
test('TC-A11Y-002: 螢幕閱讀器支援', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="start-review-btn"]');
  
  // 檢查 ARIA attributes
  const card = page.locator('[data-testid="card-container"]');
  await expect(card).toHaveAttribute('role', 'region');
  await expect(card).toHaveAttribute('aria-label');
  
  // 檢查按鈕有適當的 aria-label
  const reviewButtons = page.locator('[data-testid^="quality-"]');
  for (const button of await reviewButtons.all()) {
    await expect(button).toHaveAttribute('aria-label');
  }
  
  // 檢查焦點管理
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'quality-1');
});

test('TC-A11Y-003: 顏色對比度檢查', async ({ page }) => {
  await page.goto('/');
  
  // 使用 axe-core 檢查顏色對比
  await page.addScriptTag({ path: require.resolve('axe-core') });
  
  const results = await page.evaluate(() => {
    return axe.run({
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });
  
  expect(results.violations).toHaveLength(0);
});
```

---

## 📊 測試執行與報告

### 測試執行指令
```bash
# 單元測試
npm run test                    # 執行所有單元測試
npm run test:watch             # 監聽模式
npm run test:coverage          # 覆蓋率報告

# 組件測試
npm run test:components        # 僅執行組件測試
npm run test:hooks            # 僅執行 hooks 測試

# 整合測試
npm run test:integration      # API 整合測試
npm run test:msw             # 使用 MSW mock server

# E2E 測試
npm run test:e2e             # Playwright E2E 測試
npm run test:e2e:headed      # 有頭模式 (可視化)
npm run test:e2e:debug       # 除錯模式

# 效能測試
npm run test:performance     # Lighthouse 效能測試
npm run test:vitals         # Core Web Vitals

# 安全測試
npm run test:security       # 安全性掃描
npm run audit              # npm audit 安全檢查

# 無障礙測試  
npm run test:a11y           # axe-core 無障礙檢查

# 完整測試套件
npm run test:all            # 執行所有測試 (CI 模式)
```

### 測試報告格式
```bash
# Jest 單元測試報告
npm run test:coverage -- --reporter=lcov --reporter=text

# Playwright 測試報告
npm run test:e2e -- --reporter=html

# 整合報告 (包含所有測試類型)
npm run test:report
```

### CI/CD 整合
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:coverage
        
      - name: Run E2E tests  
        run: npm run test:e2e
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📋 測試檢核清單

### 開發階段檢核
- [ ] 每個新功能都有對應的單元測試
- [ ] 關鍵組件有完整的組件測試  
- [ ] API 整合有模擬測試覆蓋
- [ ] 錯誤情況有適當的測試案例
- [ ] 測試覆蓋率達到目標 (80%+)

### 提交前檢核
- [ ] 所有測試通過 (`npm run test`)
- [ ] E2E 關鍵流程測試通過
- [ ] 效能指標在可接受範圍內
- [ ] 無障礙檢查通過
- [ ] 安全性掃描無嚴重問題

### 發布前檢核
- [ ] 完整測試套件執行通過
- [ ] 跨瀏覽器相容性確認
- [ ] 行動裝置功能測試通過
- [ ] 效能基準測試符合要求
- [ ] 用戶驗收測試完成

---

**📝 Note**: 此測試案例文件為活文件，隨著功能開發進展持續更新。所有測試案例都應該要能自動化執行，並整合進 CI/CD 流程中。