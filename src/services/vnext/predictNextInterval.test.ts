/**
 * vNext 1.1.0: 間隔預測模組測試
 * 
 * 功能：預測卡片下次複習的間隔天數
 * 契約：純函式，不修改卡片狀態，僅計算預測值
 * 
 * 依照 TDD 原則，先寫測試再實作
 */

import { describe, test, expect } from 'vitest';
import { Card, Quality, Algorithm } from '../../types';
import { createTestCard } from '../../../test/utils/testHelpers';
import { predictNextIntervalDays } from './predictNextInterval';

describe('predictNextIntervalDays', () => {
  describe('Leitner algorithm predictions', () => {
    test('TC-SRS-010: should predict Leitner interval correctly for quality 3', () => {
      const card = createTestCard({ box: 2, interval: 2 });
      
      // Quality 3 (Easy) → upgrade to box 3
      const result = predictNextIntervalDays(card, 3, 'leitner');
      expect(result).toBe(3); // LEITNER_INTERVALS[3]
    });

    test('TC-SRS-011: should predict Leitner interval correctly for quality 2', () => {
      const card = createTestCard({ box: 2, interval: 2 });
      
      // Quality 2 (Medium) → maintain box 2  
      const result = predictNextIntervalDays(card, 2, 'leitner');
      expect(result).toBe(2); // LEITNER_INTERVALS[2]
    });

    test('TC-SRS-012: should predict Leitner interval correctly for quality 1', () => {
      const card = createTestCard({ box: 4, interval: 7 });
      
      // Quality 1 (Hard) → reset to box 1
      const result = predictNextIntervalDays(card, 1, 'leitner');
      expect(result).toBe(1); // LEITNER_INTERVALS[1]
    });

    test('TC-SRS-013: should handle Leitner box 5 ceiling', () => {
      const card = createTestCard({ box: 5, interval: 14 });
      
      // Quality 3 from box 5 → stay at box 5
      const result = predictNextIntervalDays(card, 3, 'leitner');
      expect(result).toBe(14); // LEITNER_INTERVALS[5]
    });
  });

  describe('SM-2 algorithm predictions', () => {
    test('TC-SRS-014: should predict first SM-2 review as 1 day', () => {
      const card = createTestCard({ reps: 0, interval: 0 });
      
      const result = predictNextIntervalDays(card, 2, 'sm2');
      expect(result).toBe(1); // First review always 1 day
    });

    test('TC-SRS-015: should predict second SM-2 review as 6 days', () => {
      const card = createTestCard({ reps: 1, interval: 1 });
      
      const result = predictNextIntervalDays(card, 3, 'sm2');
      expect(result).toBe(6); // Second review always 6 days
    });

    test('TC-SRS-016: should predict SM-2 with ease factor multiplication', () => {
      const card = createTestCard({ reps: 2, interval: 6, ease: 2.5 });
      
      // Third+ review: interval * ease
      const result = predictNextIntervalDays(card, 3, 'sm2');
      const expected = Math.round(6 * (2.5 + 0.1)); // ease increases by 0.1 for quality 3
      expect(result).toBe(expected); // 16 days
    });

    test('TC-SRS-017: should predict SM-2 quality 1 reset', () => {
      const card = createTestCard({ reps: 5, interval: 30, ease: 2.8 });
      
      // Quality 1 always resets to 1 day
      const result = predictNextIntervalDays(card, 1, 'sm2');
      expect(result).toBe(1);
    });
  });

  describe('Edge cases and validation', () => {
    test('TC-SRS-018: should default to leitner algorithm', () => {
      const card = createTestCard({ box: 2 });
      
      const resultWithAlgo = predictNextIntervalDays(card, 3, 'leitner');
      const resultDefault = predictNextIntervalDays(card, 3);
      
      expect(resultDefault).toBe(resultWithAlgo);
    });

    test('TC-SRS-019: should handle invalid algorithm gracefully', () => {
      const card = createTestCard({ box: 2 });
      
      // @ts-ignore - testing runtime behavior
      const result = predictNextIntervalDays(card, 3, 'invalid' as Algorithm);
      expect(result).toBe(3); // Should fallback to leitner
    });

    test('TC-SRS-020: should handle boundary quality values', () => {
      const card = createTestCard({ box: 2 });
      
      // @ts-ignore - testing runtime behavior
      const result0 = predictNextIntervalDays(card, 0 as Quality);
      expect(result0).toBe(1); // Should treat as quality 1
      
      // @ts-ignore - testing runtime behavior  
      const result4 = predictNextIntervalDays(card, 4 as Quality);
      expect(result4).toBe(3); // Should treat as quality 3
    });

    test('TC-SRS-021: should handle extreme card states', () => {
      // Test with very high ease
      const highEaseCard = createTestCard({ 
        reps: 3, 
        interval: 10, 
        ease: 5.0 
      });
      const result = predictNextIntervalDays(highEaseCard, 3, 'sm2');
      expect(result).toBe(Math.round(10 * 5.1)); // 51 days

      // Test with minimum ease
      const lowEaseCard = createTestCard({ 
        reps: 3, 
        interval: 5, 
        ease: 1.3 
      });
      const result2 = predictNextIntervalDays(lowEaseCard, 2, 'sm2');
      expect(result2).toBe(Math.round(5 * 1.3)); // 7 days (rounded)
    });
  });
});