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
}