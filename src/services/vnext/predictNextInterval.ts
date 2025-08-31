/**
 * vNext 1.1.0: 間隔預測模組
 * 
 * 功能：預測卡片下次複習的間隔天數
 * 契約：純函式，不修改卡片狀態，僅計算預測值
 */

import { Card, Quality, Algorithm } from '../../types';

const LEITNER_INTERVALS = [0, 1, 2, 3, 7, 14]; // box 0-5 的間隔天數

/**
 * 預測卡片下次複習的間隔天數
 * @param card 卡片資料
 * @param quality 複習品質 (1=困難, 2=普通, 3=簡單)
 * @param algorithm 使用的算法 (預設: leitner)
 * @returns 預測的間隔天數
 */
export function predictNextIntervalDays(
  card: Card,
  quality: Quality,
  algorithm: Algorithm = 'leitner'
): number {
  // 邊界值處理
  const normalizedQuality = Math.max(1, Math.min(3, quality)) as Quality;
  
  if (algorithm === 'sm2') {
    return predictSM2Interval(card, normalizedQuality);
  } else {
    // 預設使用 Leitner 或處理無效算法
    return predictLeitnerInterval(card, normalizedQuality);
  }
}

/**
 * Leitner 算法間隔預測
 */
function predictLeitnerInterval(card: Card, quality: Quality): number {
  let nextBox: 1|2|3|4|5 = card.box;
  
  switch (quality) {
    case 1: // 困難 - 重置到 box 1
      nextBox = 1;
      break;
    case 2: // 普通 - 維持當前 box
      nextBox = card.box;
      break;
    case 3: // 簡單 - 升級到下一個 box (最大 5)
      nextBox = Math.min(5, card.box + 1) as 1|2|3|4|5;
      break;
  }
  
  return LEITNER_INTERVALS[nextBox] || 1;
}

/**
 * SM-2 算法間隔預測
 */
function predictSM2Interval(card: Card, quality: Quality): number {
  // Quality 1 總是重置為 1 天
  if (quality === 1) {
    return 1;
  }
  
  // 第一次複習總是 1 天
  if (card.reps === 0) {
    return 1;
  }
  
  // 第二次複習總是 6 天
  if (card.reps === 1) {
    return 6;
  }
  
  // 第三次以後：interval * (ease + adjustment)
  const currentEase = card.ease || 2.5;
  let newEase = currentEase;
  
  // 根據品質調整 ease factor
  switch (quality) {
    case 2: // 普通 - ease 不變
      break;
    case 3: // 簡單 - ease 增加 0.1
      newEase = currentEase + 0.1;
      break;
  }
  
  return Math.round(card.interval * newEase);
}