// Core Types for Vocabulary App
export type POS = 'adj.'|'n.'|'v.'|'adv.'|'prep.'|'conj.'|'pron.'|'phr.';
export type AnchorType = 'image'|'youtube'|'mp4'|'link';
export type Quality = 1|2|3;  // 1=困難, 2=普通, 3=容易
export type Algorithm = 'leitner'|'sm2';
export type Face = 'front'|'right'|'left';

export interface Anchor {
  type: AnchorType;
  url: string;
  title?: string;
}

export interface WordForm {
  pos: POS | string;
  form: string;
}

export interface Card {
  // 基本資訊
  id: string;
  word: { base: string; phonetic?: string; forms: WordForm[] };
  posPrimary: POS | string;
  meaning: string;          // MVP: 單一意思
  synonyms: string[];       // 近義詞
  antonyms: string[];       // 反義詞
  example: string;          // 例句
  anchors: Anchor[];        // 多媒體錨點
  tags?: string[];          // 標籤分類
  createdAt: string;        // ISO 8601

  // SRS 欄位
  box: 1|2|3|4|5;          // Leitner 盒子
  ease: number;             // SM-2 難度係數 (預設 2.5)
  reps: number;             // 複習次數
  interval: number;         // 間隔天數
  lastReviewedAt: string | null; // 上次複習時間
  nextReviewAt: string;     // 下次複習時間 (ISO 8601)
}

// API Response Types
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface ReviewResponse {
  ok: boolean;
  nextReviewAt: string;
  interval: number;
  box: number;
  ease: number;
  reps: number;
  // vNext 1.1.0: 間隔預測
  nextReviewIntervalDays?: number;
}

// =================================
// vNext 1.1.0 Enhancement Types
// =================================

/**
 * 優先評分配置權重
 */
export interface PriorityConfig {
  ease: number;        // 難度權重 (預設 0.5)
  overdueDays: number; // 逾期權重 (預設 0.3)
  box: number;         // 層級權重 (預設 0.2)
}

/**
 * 每日選卡結果
 */
export interface SelectionResult {
  duePicked: Card[];   // 選中的到期卡片
  needNew: number;     // 需要的新字數量
  mayNew: number;      // 可接受的新字上限
}

/**
 * 每日學習配置
 */
export interface DailyConfig {
  maxDailyReviews: number;  // 每日複習上限 (預設 20)
  minNewPerDay: number;     // 每日新字下限 (預設 3)
  maxNewPerDay: number;     // 每日新字上限 (預設 5)
  againGapSequence: number[]; // Again 間隔序列 (預設 [2,5,10])
  priorityWeights: PriorityConfig; // 優先權重配置
}

/**
 * Again 按鈕狀態追蹤
 */
export interface AgainState {
  cardId: string;
  againCount: number;   // 當日 Again 次數
  lastPosition: number; // 上次在佇列中的位置
}

/**
 * 學習統計
 */
export interface ReviewStats {
  reviewedCount: number;
  againCount: number;
  qualityDistribution: { [key in Quality]: number };
  timeSpent: number; // 毫秒
}

/**
 * LLM API 相關類型 (Phase 3 實裝)
 */
export interface LLMSuggestRequest {
  count: number;
  tags?: string[];
  difficulty?: string;
  learned_words_summary?: string;
  avoid_words?: string[];
}

export interface LLMQuizRequest {
  cardIds: string[];
  types?: ('mcq' | 'cloze')[];
}

export interface QuizItem {
  type: 'mcq' | 'cloze';
  question: string;
  choices?: string[];
  answer: number | string;
  cardId: string;
}

/**
 * LLM 服務配置
 */
export interface LLMConfig {
  provider: 'colab' | 'openai' | 'claude' | 'gemini';
  driveBasePath?: string;  // Google Drive 基礎路徑
  apiKey?: string;         // 商業API的金鑰
  modelName?: string;      // 指定模型名稱
}

/**
 * LLM 生成請求狀態
 */
export type LLMRequestStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface LLMGenerateRequest {
  id: string;
  timestamp: string;
  status: LLMRequestStatus;
  request: LLMSuggestRequest;
  response?: {
    cards: Omit<Card, 'id' | 'box' | 'ease' | 'reps' | 'interval' | 'lastReviewedAt' | 'nextReviewAt' | 'createdAt'>[];
  };
  error?: string;
}

/**
 * 考試類型標籤枚舉
 */
export enum ExamType {
  IELTS = 'IELTS',
  TOEFL = 'TOEFL', 
  GRE = 'GRE',
  GMAT = 'GMAT',
  SAT = 'SAT',
  General = 'general',
  Business = 'business',
  Academic = 'academic'
}

/**
 * 難度等級
 */
export enum DifficultyLevel {
  Beginner = 'beginner',      // 初級 (3.0-4.5)
  Intermediate = 'intermediate', // 中級 (5.0-6.0)
  UpperInt = 'upper-intermediate', // 中高級 (6.5-7.0)
  Advanced = 'advanced'       // 高級 (7.5-9.0)
}