/**
 * vNext 1.1.0: 優先評分模組
 * 
 * 功能：計算卡片的優先複習分數
 * 契約：基於難度、逾期天數、盒子層級計算複合評分
 */

import { Card, PriorityConfig } from '../../types';

/**
 * 計算卡片的優先複習分數
 * @param card 卡片資料
 * @param today 今日日期
 * @param weights 權重配置
 * @returns 優先分數 (0-2 之間，越高越優先)
 */
export function calculatePriorityScore(
  card: Card,
  today: Date,
  weights: PriorityConfig
): number {
  const difficulty = calculateDifficulty(card.ease);
  const overdueDaysNorm = calculateOverdueNormalized(card.nextReviewAt, today);
  const levelNorm = calculateLevelNormalized(card.box);
  
  return (
    weights.ease * difficulty +
    weights.overdueDays * overdueDaysNorm +
    weights.box * levelNorm
  );
}

/**
 * 計算難度分數 (基於 ease factor)
 * @param ease 困難度係數
 * @returns 0-2 之間的難度分數，越高越困難
 */
function calculateDifficulty(ease: number): number {
  // difficulty = 3.0 - ease，限制在 [0, 2] 區間
  return Math.max(0, Math.min(2, 3.0 - ease));
}

/**
 * 計算標準化逾期天數 (0-1)
 * @param nextReviewAt 下次復習時間
 * @param today 今日日期
 * @returns 0-1 之間的逾期分數，7天後封頂
 */
function calculateOverdueNormalized(nextReviewAt: string, today: Date): number {
  if (!nextReviewAt) return 0;
  
  const nextReview = new Date(nextReviewAt);
  const diffTime = today.getTime() - nextReview.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // 逾期天數，未來的卡片為 0
  const overdueDays = Math.max(0, diffDays);
  
  // 7 天後封頂 (normalized to 1.0)
  return Math.min(1.0, overdueDays / 7);
}

/**
 * 計算標準化層級分數 (0-1)
 * @param box 卡片所在盒子
 * @returns 0-1 之間的層級分數，越低層級分數越高
 */
function calculateLevelNormalized(box: number): number {
  // level = 5 - box，標準化到 [0, 1]
  // box 1 → level 4 → norm 1.0 (最需要練習)
  // box 5 → level 0 → norm 0.0 (最不需要練習)
  const level = 5 - box;
  return level / 4; // 標準化到 [0, 1]
}