/**
 * vNext 1.1.0: Again 佇列管理模組
 * 
 * 功能：處理 Again 按鈕的卡片佇列重排邏輯
 * 契約：不影響 SRS 狀態，僅在當日學習佇列中重新排序
 */

import { Card } from '../../types';

/**
 * 將 Again 卡片重新插入佇列的指定位置
 * @param queue 當前學習佇列
 * @param againCard 需要重新插入的卡片
 * @param againCount 已經按 Again 的次數 (0-based)
 * @param againSequence 間隔序列 [2, 5, 10] 表示第1、2、3次的間隔
 * @param currentPosition 當前卡片在佇列中的位置
 * @returns 新的佇列（不變異原佇列）
 */
export function insertAgainCard(
  queue: Card[],
  againCard: Card,
  againCount: number,
  againSequence: number[],
  currentPosition: number
): Card[] {
  // 防止變異原陣列
  const newQueue = [...queue];
  
  // 處理邊界值
  const safeAgainCount = Math.max(0, againCount);
  const safeCurrentPosition = Math.max(0, currentPosition);
  
  // 處理空序列的情況
  if (againSequence.length === 0) {
    newQueue.push(againCard);
    return newQueue;
  }
  
  // 計算應該使用的間隔（不超過序列長度）
  const sequenceIndex = Math.min(safeAgainCount, againSequence.length - 1);
  const gap = againSequence[sequenceIndex];
  
  // 計算目標插入位置
  const targetPosition = safeCurrentPosition + gap;
  
  // 處理位置越界的情況
  const insertPosition = Math.min(targetPosition, newQueue.length);
  
  // 在指定位置插入卡片
  newQueue.splice(insertPosition, 0, againCard);
  
  return newQueue;
}