# **背單字 MVP — TDD 設計文件**

React 18 \+ TypeScript \+ Vite \+ Tailwind \+ React Query \+ Jest / React Testing Library

目標：以「三面卡片（Front／Meaning／Example）」進行個人向背單字。採 TDD：先列測試與可驗證行為、再落地最小可行程式碼。保留以 Google 試算表 \+ Apps Script 充當簡易後端，並預留 /llm/suggest 擴充（伺服器端呼叫 sLLM 產生候選單字，人工審核併入）。  
學習科學依據（anchors/語意網/主動回憶/間隔複習）：本產品的「例句＋多媒體錨點」「近反義詞」「主動回憶與間隔複習」設計，對應雙重編碼、語意網絡、Active Recall 與 Spaced Repetition 等研究重點。  
---

## **0\. 技術選型與理由（MVP 取捨）**

* 打包器：Vite（冷啟快、HMR 穩定、TS 友善；MVP 開發迭代效率高）。

* 樣式系統：Tailwind（共用語意化原子類別，MVP 可少寫樣式 infra；避免與 CSS Modules 混用）。

* 狀態/資料抓取：React Query（快取 due 卡片、Mutation 後自動失效/同步）。

* 測試：Jest \+ React Testing Library（RTL）（單元＋元件測；最小 E2E 僅描述腳本思路）。

* 後端：Google Sheet \+ Apps Script（由 代理層 代簽 HMAC 與做白名單／Rate Limit；前端不持有金鑰）。

---

## **1\) 簡要系統圖與檔案結構**

### **1.1 系統上下文（Mermaid）**

flowchart LR  
  subgraph Client\[Web Client (React \+ TS)\]  
    Deck\[DeckView\<br/\>Due Cards 播放\]  
    Card\[Card (Front/Meaning/Example)\]  
    Review\[ReviewControls\]  
    AddForm\[AddCardForm\]  
  end

  subgraph Proxy\[Proxy (Workers/Netlify/Vercel Fn)\]  
    HMAC\[HMAC 簽章 \+ RateLimit \+ Origin 白名單\]  
  end

  subgraph GAS\[Apps Script \+ Google Sheet\]  
    API\[/doGet/doPost/\]  
    Cards\[(Sheet: cards)\]  
    Candidates\[(Sheet: candidates)\]  
  end

  Deck \--\>|GET /cards?due=today| Proxy \--\>|簽章後| API \--\> Cards  
  Review \--\>|PATCH /cards/:id/review| Proxy \--\> API \--\> Cards  
  AddForm \--\>|POST /cards| Proxy \--\> API \--\> Cards  
  Client \--\>|POST /llm/suggest| Proxy \--\> Candidates

### **1.2 檔案結構（MVP）**

/src  
  /components  
    /Card  
      Card.tsx  
      CardFaceFront.tsx  
      CardFaceMeaning.tsx  
      CardFaceExample.tsx  
      MediaEmbed.tsx  
      ReviewControls.tsx  
  /pages  
    DeckView.tsx  
    AddCardForm.tsx  
  /services  
    api.ts        // fetch 基礎 \+ 簽名header  
    srs.ts        // Leitner / SM-2（簡化）  
  /hooks  
    useDueCards.ts  
    useReviewCard.ts  
    useAddCard.ts  
  /types  
    index.ts  
  /test  
    fixtures/cards.json  
    srs.test.ts  
    MediaEmbed.test.tsx  
    CardNavigation.test.tsx  
    hooks.test.tsx  
App.tsx  
main.tsx  
/vite-env.d.ts  
---

## **2\) 資料模型與 Sheet 欄位對應**

Sheet 名稱：cards（正式）、candidates（/llm/suggest 暫存，需人工審核）。  
Google Sheet 允許標題含點號，MVP 直接使用相同欄名。  
// /types/index.ts  
export type POS \= 'adj.'|'n.'|'v.'|'adv.'|'prep.'|'conj.'|'pron.'|'phr.';

export type AnchorType \= 'image'|'youtube'|'mp4'|'link';  
export interface Anchor { type: AnchorType; url: string; title?: string; }

export interface WordForm { pos: POS | string; form: string; }

export interface Card {  
  id: string;  
  word: { base: string; forms: WordForm\[\] };  
  posPrimary: POS | string;  
  meaning: string;          // MVP: 單義  
  synonyms: string\[\];  
  antonyms: string\[\];  
  example: string;  
  anchors: Anchor\[\];  
  tags?: string\[\];  
  createdAt: string;        // ISO  
  // SRS fields  
  box: 1|2|3|4|5;  
  ease: number;             // for SM-2 (default 2.5)  
  reps: number;  
  interval: number;         // days  
  lastReviewedAt: string | null; // ISO  
  nextReviewAt: string;     // ISO  
}

Sheet: cards 欄位（與模型同名）

id | word.base | word.forms | posPrimary | meaning | synonyms | antonyms | example | anchors | tags | createdAt | box | ease | reps | interval | lastReviewedAt | nextReviewAt

* word.forms、anchors：以 JSON 字串 存放；Apps Script 需 JSON.parse/JSON.stringify。

* candidates 與 cards 欄同構（多 source, score 供審核）。

---

## **3\) API 介面（代理層 → Apps Script）**

### **通用**

* Base URL（前端環境變數）：VITE\_API\_BASE\_URL

* Header（由 代理層 送往 Apps Script）：

  * X-Timestamp: \<unix-ms\>

  * X-Signature: \<HMAC\_SHA256(secret, method \+ path \+ body \+ timestamp)\>

* 錯誤格式（所有端點一致）：

{ "ok": false, "error": { "code": "RATE\_LIMIT", "message": "Too many requests" } }

### **3.1 取得到期卡片**

GET /cards?due=today  
resp 200:  
{ "ok": true, "data": Card\[\] }

* 伺服器以「nextReviewAt \<= 今天 23:59:59 (使用代理層時區)」過濾。

* 失敗：401 UNAUTHORIZED（Origin 不在白名單）、429 RATE\_LIMIT、500 SERVER\_ERROR。

### **3.2 新增卡片**

POST /cards  
body: Card (id/box/ease/reps/interval/lastReviewedAt/nextReviewAt 可由後端預設)  
resp 200: { "ok": true, "id": "\<uuid\>" }

### **3.3 複習回報**

PATCH /cards/:id/review  
body: { "quality": 1|2|3, "algorithm": "leitner"|"sm2" } // 預設 "leitner"  
resp 200:  
{ "ok": true, "nextReviewAt": "2025-08-28", "interval": 1, "box": 2, "ease": 2.5, "reps": 1 }

* 伺服器以 services/srs.ts 同版演算法計算；權威以後端為準。

---

## **4\) SRS（Leitner / 簡化 SM-2）與關鍵測試碼**

### **4.1 規則**

* Leitner（預設）

  * 盒 → 間隔：\[1, 2, 3, 7, 14\] 天

  * quality=3(易)：box \= min(box+1, 5\)

  * quality=2(中)：box \= box

  * quality=1(難)：box \= 1

  * nextReviewAt \= today \+ interval(box)

* SM-2（簡化）

  * 初始：ease=2.5, reps=0

  * 若 quality=1：reps=0; interval=1; ease \= max(1.3, ease \- 0.2)

  * 若 quality=2：reps+=1; if reps=1 \-\> interval=1; if reps=2 \-\> 6; else interval \= round(prevInterval \* ease)

  * 若 quality=3：同 quality=2 但 ease \= ease \+ 0.1（封頂不設，實務建議 ≤ 3.0）

### **4.2 核心實作（/services/srs.ts）**

export const LEITNER\_INTERVALS \= \[0,1,2,3,7,14\] as const; // index 1..5

export type Quality \= 1|2|3;  
export type Algo \= 'leitner'|'sm2';

export function nextByLeitner(card: Card, quality: Quality, today \= new Date()): Card {  
  let box \= card.box;  
  if (quality \=== 3\) box \= Math.min(5, box \+ 1);  
  else if (quality \=== 1\) box \= 1;  
  const interval \= LEITNER\_INTERVALS\[box\];  
  const next \= addDays(today, interval);  
  return { ...card, box, interval, reps: quality===1? card.reps : card.reps+1,  
           lastReviewedAt: iso(today), nextReviewAt: iso(next) };  
}

export function nextBySM2(card: Card, quality: Quality, today \= new Date()): Card {  
  let { ease, reps, interval } \= card;  
  if (quality \=== 1\) { reps \= 0; interval \= 1; ease \= Math.max(1.3, ease \- 0.2); }  
  else {  
    reps \+= 1;  
    ease \= quality \=== 3 ? ease \+ 0.1 : ease;  
    if (reps \=== 1\) interval \= 1;  
    else if (reps \=== 2\) interval \= 6;  
    else interval \= Math.round(interval \* ease);  
  }  
  const next \= addDays(today, interval);  
  return { ...card, ease, reps, interval, box: card.box, lastReviewedAt: iso(today), nextReviewAt: iso(next) };  
}

### **4.3 代表性測試（/test/srs.test.ts）**

import { nextByLeitner, nextBySM2 } from '@/services/srs';  
const base \= (overrides={}) \=\> ({ id:'x', word:{base:'a',forms:\[\]}, posPrimary:'adj.',  
  meaning:'', synonyms:\[\], antonyms:\[\], example:'', anchors:\[\], createdAt:'2025-08-27',  
  box:1, ease:2.5, reps:0, interval:0, lastReviewedAt:null, nextReviewAt:'2025-08-27', ...overrides });

test('Leitner: 易 → 升盒，next \= today \+ 2', () \=\> {  
  const today \= new Date('2025-08-27T00:00:00Z');  
  const out \= nextByLeitner(base({box:1}), 3, today);  
  expect(out.box).toBe(2);  
  expect(out.interval).toBe(2);  
});

test('SM-2: 首兩次間隔 1→6，之後乘以 ease', () \=\> {  
  const t \= new Date('2025-08-27T00:00:00Z');  
  let c \= nextBySM2(base({reps:0, interval:0}), 2, t);  
  expect(c.interval).toBe(1);  
  c \= nextBySM2(c, 3, t);  
  expect(c.interval).toBe(6);  
  const c3 \= nextBySM2(c, 3, t);  
  expect(c3.interval).toBeGreaterThanOrEqual(6); // 6 \* (2.5\~2.6)  
});  
---

## **5\) React 組件切分與關鍵介面**

### **5.1 結構樹**

\<DeckView\>  
  \<Card\>  
    \<CardFaceFront/\>  
    \<CardFaceMeaning/\>  
    \<CardFaceExample\>  
      \<MediaEmbed/\> // image / youtube / mp4 / link  
    \</CardFaceExample\>  
    \<ReviewControls/\>  
  \</Card\>  
\</DeckView\>  
\<AppHeader/\>\<AppFooter/\>  
\<AddCardForm/\>

### **5.2 介面（Props/事件）**

// Card.tsx  
interface CardProps { card: Card; onFlip(): void; onNext(): void; }  
type Face \= 'front'|'right'|'left';

// ReviewControls.tsx  
interface ReviewControlsProps { onRate(q: 1|2|3): Promise\<void\>; busy?: boolean; }

// MediaEmbed.tsx  
interface MediaEmbedProps { anchor: Anchor; }

// hooks  
export function useDueCards() { /\* queryKey: \['cards','due', today\] \*/ }  
export function useReviewCard() { /\* mutation PATCH /cards/:id/review \*/ }  
export function useAddCard() { /\* mutation POST /cards \*/ }  
---

## **6\) 測試清單（Jest \+ RTL）**

### **6.1 純函式（已示範）**

* Leitner：升/留/回盒、interval 映射、nextReviewAt 計算

* SM-2：ease/reps/interval 遞進、quality=1 回退

### **6.2 API hooks（以 MSW 模擬）**

* useDueCards：快取 key 正確；重取時保留舊資料（keepPreviousData）

* useReviewCard：成功後自動使 \['cards','due'\] 失效並 UI 更新

* useAddCard：新增成功後刷新列表

### **6.3 UI 元件**

* Card：按鈕/鍵盤（← → 空白/Enter）在 front/right/left 間切換

* MediaEmbed：

  * image → \<img alt="title"\>

  * youtube → \<iframe src="https://www.youtube.com/embed/..."\>

  * mp4 → \<video controls\>

  * link → \<a target="\_blank" rel="noopener"\>

* ReviewControls：點「難/中/易」觸發 mutation；顯示 loading/disabled

### **6.4 代表性元件測試**

// /test/MediaEmbed.test.tsx  
import { render, screen } from '@testing-library/react';  
import MediaEmbed from '@/components/Card/MediaEmbed';

it('renders youtube iframe with /embed/', () \=\> {  
  render(\<MediaEmbed anchor={{type:'youtube', url:'https://www.youtube.com/embed/abc', title:'demo'}}/\>);  
  const frame \= screen.getByTitle('demo');  
  expect(frame).toHaveAttribute('src', expect.stringContaining('/embed/'));  
});  
// /test/CardNavigation.test.tsx  
import { render, screen } from '@testing-library/react';  
import user from '@testing-library/user-event';  
import Card from '@/components/Card/Card';  
test('flip and navigate faces', async () \=\> {  
  const card \= /\* build a minimal Card \*/;  
  render(\<Card card={card} onFlip={()=\>{}} onNext={()=\>{}} /\>);  
  await user.keyboard('{ArrowRight}');  
  expect(screen.getByRole('region', { name:/Meaning/i })).toBeInTheDocument();  
});  
---

## **7\) 最小可執行頁面與核心程式碼**

### **7.1** 

### **MediaEmbed.tsx**

### **（MVP）**

import React from 'react';  
import { Anchor } from '@/types';

export default function MediaEmbed({ anchor }: { anchor: Anchor }) {  
  const { type, url, title } \= anchor;  
  if (type \=== 'image') return \<img src={url} alt={title || 'image'} className="max-w-full rounded" /\>;  
  if (type \=== 'youtube') return (  
    \<iframe title={title || 'youtube'} src={url}  
      className="w-full aspect-video rounded" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"  
      allowFullScreen /\>  
  );  
  if (type \=== 'mp4') return \<video src={url} controls className="w-full rounded" /\>;  
  return \<a href={url} target="\_blank" rel="noopener" className="underline"\>{title || url}\</a\>;  
}

### **7.2 React Query：**

### **useReviewCard.ts**

import { useMutation, useQueryClient } from '@tanstack/react-query';  
import { api } from '@/services/api';

export function useReviewCard() {  
  const qc \= useQueryClient();  
  return useMutation({  
    mutationFn: ({ id, quality, algorithm='leitner' }:  
      { id: string; quality: 1|2|3; algorithm?: 'leitner'|'sm2' }) \=\>  
      api.patch(\`/cards/${id}/review\`, { quality, algorithm }),  
    onSuccess: () \=\> { qc.invalidateQueries({ queryKey: \['cards','due'\] }); }  
  });  
}

### **7.3** 

### **DeckView.tsx**

### **（最小）**

import { useDueCards } from '@/hooks/useDueCards';  
import { useReviewCard } from '@/hooks/useReviewCard';  
import Card from '@/components/Card/Card';

export default function DeckView() {  
  const { data: cards=\[\], isLoading } \= useDueCards();  
  const { mutateAsync, isPending } \= useReviewCard();  
  const \[idx, setIdx\] \= React.useState(0);  
  if (isLoading) return \<div\>Loading…\</div\>;  
  const card \= cards\[idx\];  
  if (\!card) return \<div\>All done 🎉\</div\>;  
  return (  
    \<Card  
      card={card}  
      onFlip={()=\>{}}  
      onNext={()=\> setIdx(i \=\> i+1)}  
    \>  
      {/\* faces inside Card \*/}  
      \<button disabled={isPending} onClick={()=\> mutateAsync({id:card.id, quality:3}).then(()=\> setIdx(i=\>i+1))}\>易\</button\>  
      \<button disabled={isPending} onClick={()=\> mutateAsync({id:card.id, quality:2}).then(()=\> setIdx(i=\>i+1))}\>中\</button\>  
      \<button disabled={isPending} onClick={()=\> mutateAsync({id:card.id, quality:1}).then(()=\> setIdx(i=\>i+1))}\>難\</button\>  
    \</Card\>  
  );  
}  
---

## **8\) 安全性與部署備忘**

* 前端不持有金鑰：皆由代理層（Cloudflare Workers / Netlify / Vercel Functions）與 Apps Script 交握。

* HMAC：代理層以 HMAC\_SHA256(secret, method+path+body+timestamp) 產 X-Signature，Apps Script 驗簽；5 分鐘時窗。

* Origin 白名單：代理層檢查 Origin；非白名單直接 401。

* Rate Limit：IP \+ 使用者指紋（Cookie/匿名 id）組合，滑動視窗限速。

* CORS：代理層統一回應 Access-Control-Allow-Origin（精確白名單）。

* 隱私：候選單字（/llm/suggest）不直接入庫，需人工審核。

* 時區：到期計算以代理層時區（如 Asia/Taipei）為準，避免前端/伺服器誤差。

---

## **9\) 後續擴充：/llm/suggest（sLLM 接入設計）**

* 端點：POST /llm/suggest，body: { seedWords?: string\[\], tags?: string\[\] }

* 流程：伺服器端（代理層或後端）呼叫 sLLM → 產生候選卡（含 forms/meaning/example/synonyms/antonyms/anchors）→ 寫入 candidates 分頁（欄位同 cards，外加 source, score）。

* 審核 UI：在管理頁將 candidates 選擇性「併入」cards。

* Guardrails：落地前執行 Schema 驗證（Zod/TypeBox），過濾空白或來源不明連結。

---

## **10\) 五張單字卡「三面＋詞性變化」—** 

## **人可讀列表（fixtures）**

1. ubiquitous（posPrimary: adj.）

* forms：adj. ubiquitous｜n. ubiquity｜adv. ubiquitously

* 意思：無所不在的，普遍存在的

* 近義：omnipresent, pervasive, universal

* 反義：rare, scarce

* 例句：Smartphones have become ubiquitous in modern society.

* anchors：image: smartphone（Wikimedia）

2. ephemeral（posPrimary: adj.）

* forms：adj. ephemeral｜n. ephemerality/ephemera｜adv. ephemerally

* 意思：短暫的、轉瞬即逝的

* 近義：transient, fleeting, momentary

* 反義：lasting, enduring, permanent

* 例句：The beauty of a rainbow is ephemeral, lasting only a few moments.

* anchors：youtube: rainbow timelapse（/embed/）

3. meticulous（posPrimary: adj.）

* forms：adj. meticulous｜adv. meticulously｜n. meticulousness

* 意思：一絲不苟的，極度細心的

* 近義：careful, thorough, precise

* 反義：careless, sloppy, negligent

* 例句：She kept meticulous notes during the experiment.

* anchors：image: notebook（Wikimedia）

4. serendipity（posPrimary: n.）

* forms：n. serendipity｜adj. serendipitous｜adv. serendipitously

* 意思：意外收穫，機緣巧合

* 近義：chance, fluke, fortune

* 反義：misfortune, bad luck

* 例句：Discovering the café was pure serendipity.

* anchors：image: coffee（Wikimedia）

5. tenacious（posPrimary: adj.）

* forms：adj. tenacious｜n. tenacity｜adv. tenaciously

* 意思：堅持不懈的，頑強的

* 近義：persistent, determined, resolute

* 反義：weak, yielding, irresolute

* 例句：The athlete remained tenacious, despite repeated setbacks.

* anchors：image: start sprint（Wikimedia）

---

## **11\) 同組** 

## **JSON fixtures**

## **（**

## **/test/fixtures/cards.json**

## **）**

\[  
  {  
    "id": "u1",  
    "word": { "base": "ubiquitous", "forms": \[{"pos":"adj.","form":"ubiquitous"},{"pos":"n.","form":"ubiquity"},{"pos":"adv.","form":"ubiquitously"}\] },  
    "posPrimary": "adj.",  
    "meaning": "無所不在的，普遍存在的",  
    "synonyms": \["omnipresent","pervasive","universal"\],  
    "antonyms": \["rare","scarce"\],  
    "example": "Smartphones have become ubiquitous in modern society.",  
    "anchors": \[{ "type":"image","url":"https://upload.wikimedia.org/wikipedia/commons/3/3a/Smartphone.png","title":"smartphone"}\],  
    "box": 1, "ease": 2.5, "reps": 0, "interval": 0,  
    "lastReviewedAt": null, "nextReviewAt": "2025-08-27", "createdAt": "2025-08-27"  
  },  
  {  
    "id": "u2",  
    "word": { "base": "ephemeral", "forms": \[{"pos":"adj.","form":"ephemeral"},{"pos":"n.","form":"ephemerality"},{"pos":"n.","form":"ephemera"},{"pos":"adv.","form":"ephemerally"}\] },  
    "posPrimary": "adj.",  
    "meaning": "短暫的、轉瞬即逝的",  
    "synonyms": \["transient","fleeting","momentary"\],  
    "antonyms": \["lasting","enduring","permanent"\],  
    "example": "The beauty of a rainbow is ephemeral, lasting only a few moments.",  
    "anchors": \[{ "type":"youtube","url":"https://www.youtube.com/embed/4H0JDomv8ac","title":"rainbow timelapse"}\],  
    "box": 1, "ease": 2.5, "reps": 0, "interval": 0,  
    "lastReviewedAt": null, "nextReviewAt": "2025-08-27", "createdAt": "2025-08-27"  
  },  
  {  
    "id": "u3",  
    "word": { "base": "meticulous", "forms": \[{"pos":"adj.","form":"meticulous"},{"pos":"adv.","form":"meticulously"},{"pos":"n.","form":"meticulousness"}\] },  
    "posPrimary": "adj.",  
    "meaning": "一絲不苟的，極度細心的",  
    "synonyms": \["careful","thorough","precise"\],  
    "antonyms": \["careless","sloppy","negligent"\],  
    "example": "She kept meticulous notes during the experiment.",  
    "anchors": \[{ "type":"image","url":"https://upload.wikimedia.org/wikipedia/commons/0/0b/Notebook.jpg","title":"notebook"}\],  
    "box": 1, "ease": 2.5, "reps": 0, "interval": 0,  
    "lastReviewedAt": null, "nextReviewAt": "2025-08-27", "createdAt": "2025-08-27"  
  },  
  {  
    "id": "u4",  
    "word": { "base": "serendipity", "forms": \[{"pos":"n.","form":"serendipity"},{"pos":"adj.","form":"serendipitous"},{"pos":"adv.","form":"serendipitously"}\] },  
    "posPrimary": "n.",  
    "meaning": "意外收穫，機緣巧合",  
    "synonyms": \["chance","fluke","fortune"\],  
    "antonyms": \["misfortune","bad luck"\],  
    "example": "Discovering the café was pure serendipity.",  
    "anchors": \[{ "type":"image","url":"https://upload.wikimedia.org/wikipedia/commons/9/9a/Coffee\_cup.jpg","title":"coffee"}\],  
    "box": 1, "ease": 2.5, "reps": 0, "interval": 0,  
    "lastReviewedAt": null, "nextReviewAt": "2025-08-27", "createdAt": "2025-08-27"  
  },  
  {  
    "id": "u5",  
    "word": { "base": "tenacious", "forms": \[{"pos":"adj.","form":"tenacious"},{"pos":"n.","form":"tenacity"},{"pos":"adv.","form":"tenaciously"}\] },  
    "posPrimary": "adj.",  
    "meaning": "堅持不懈的，頑強的",  
    "synonyms": \["persistent","determined","resolute"\],  
    "antonyms": \["weak","yielding","irresolute"\],  
    "example": "The athlete remained tenacious, despite repeated setbacks.",  
    "anchors": \[{ "type":"image","url":"https://upload.wikimedia.org/wikipedia/commons/5/5e/Start\_sprint.jpg","title":"start sprint"}\],  
    "box": 1, "ease": 2.5, "reps": 0, "interval": 0,  
    "lastReviewedAt": null, "nextReviewAt": "2025-08-27", "createdAt": "2025-08-27"  
  }  
\]  
---

## **12\) 代理層與 Apps Script（行為要點）**

### **12.1 代理層（偽碼）**

export default async function handler(req) {  
  assertOrigin(req.headers.origin);  
  rateLimit(req.ip);  
  const ts \= Date.now().toString();  
  const sig \= hmac(secret, req.method \+ req.url \+ (await req.textRaw()) \+ ts);  
  const r \= await fetch(GAS\_URL \+ req.url, {  
    method: req.method,  
    headers: { 'X-Timestamp': ts, 'X-Signature': sig, 'Content-Type': 'application/json' },  
    body: req.method \=== 'GET' ? undefined : req.body  
  });  
  return translateErrors(r);  
}

### **12.2 Apps Script（要點）**

* 驗簽（X-Timestamp 時窗 5 分鐘）、驗 X-Signature。

* GET /cards?due=today：讀表，new Date(row.nextReviewAt) \<= todayEnd。

* PATCH /cards/:id/review：查 id → 套用 同版 SRS → 回寫欄位 → 回傳新值。

* 以批次寫入（SpreadsheetApp.flush() 前一次寫多筆）。

---

## **13\) 可追蹤的 TDD 任務清單（摘要）**

1. SRS

   * Leitner：升/留/回盒；interval 映射；nextReviewAt 計算

   * SM-2：reps/ease/interval 遞進；quality=1 回退

2. API hooks

   * useDueCards：快取與重新抓取

   * useReviewCard：成功後失效處理

   * useAddCard：成功後刷新

3. UI

   * Card 三面切換（按鈕 \+ 鍵盤）

   * MediaEmbed 各類型渲染與可存取性（alt/title）

   * ReviewControls Loading/Disabled

4. 整合流程（最小 E2E 思路）

   * 載入 due → 翻三面 → 評分 → 自動下一張 → due 減少

---

### **備註與邊界**

* MVP 僅單一使用者／單一資料表；多使用者需新增 userId、分表或過濾。

* 影片/圖片外鏈可失效：代理層可選擇加一層 URL 安全白名單 或做縮圖代理。

* 國際化（i18n）與離線模式（Service Worker）非 MVP 範圍。

---

以上即為可直接落地的 TDD 設計文件（含測試清單、資料模型、API、SRS 實作與測試片段、核心元件程式碼、安部署注意、sLLM 擴充設計）。如果你要，我可以把這份內容存成 artifacts/tdd-vocab-mvp.md 版本化、或再加上 Storybook 零件驗收案例。

