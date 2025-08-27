/**
 * SRS (Spaced Repetition System) Algorithm Tests
 * 
 * 根據 TDD 原則，這些測試必須在實作前撰寫完成
 * 測試不得為了配合實作而修改，應該修改實作來通過測試
 * 
 * 測試涵蓋範圍：
 * 1. Leitner Box 系統
 * 2. SM-2 演算法
 * 3. 邊界條件與錯誤處理
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Card, Quality } from '../types';
import { createTestCard, testDates } from '../../test/utils/testHelpers';

// 這些函式必須在 src/services/srs.ts 中實作
import { 
  LEITNER_INTERVALS,
  nextByLeitner,
  nextBySM2,
  addDays,
  iso 
} from './srs';

describe('SRS Constants', () => {
  test('LEITNER_INTERVALS should have correct values', () => {
    expect(LEITNER_INTERVALS).toEqual([0, 1, 2, 3, 7, 14]);
    expect(LEITNER_INTERVALS).toHaveLength(6); // index 0-5, but use 1-5
  });
});

describe('Utility Functions', () => {
  describe('addDays', () => {
    test('should add positive days correctly', () => {
      const date = new Date('2025-08-27T00:00:00.000Z');
      const result = addDays(date, 5);
      
      expect(result.toISOString()).toBe('2025-09-01T00:00:00.000Z');
    });

    test('should handle zero days', () => {
      const date = new Date('2025-08-27T00:00:00.000Z');
      const result = addDays(date, 0);
      
      expect(result.toISOString()).toBe('2025-08-27T00:00:00.000Z');
    });

    test('should subtract days with negative input', () => {
      const date = new Date('2025-08-27T00:00:00.000Z');
      const result = addDays(date, -3);
      
      expect(result.toISOString()).toBe('2025-08-24T00:00:00.000Z');
    });

    test('should not mutate original date', () => {
      const originalDate = new Date('2025-08-27T00:00:00.000Z');
      const originalISO = originalDate.toISOString();
      
      addDays(originalDate, 5);
      
      expect(originalDate.toISOString()).toBe(originalISO);
    });
  });

  describe('iso', () => {
    test('should format date to ISO string correctly', () => {
      const date = new Date('2025-08-27T15:30:45.123Z');
      const result = iso(date);
      
      expect(result).toBe('2025-08-27T15:30:45.123Z');
    });

    test('should handle different timezones consistently', () => {
      const date = new Date(2025, 7, 27, 12, 0, 0); // Local time
      const result = iso(date);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});

describe('Leitner Box Algorithm', () => {
  describe('nextByLeitner', () => {
    let baseCard: Card;
    const today = testDates.today;

    beforeEach(() => {
      baseCard = createTestCard({
        box: 2,
        interval: 2,
        reps: 1,
        lastReviewedAt: null,
      });
    });

    describe('Quality 3 (Easy) - Should upgrade box', () => {
      test('should upgrade from box 1 to box 2', () => {
        const card = createTestCard({ box: 1, interval: 1 });
        const result = nextByLeitner(card, 3, today);

        expect(result.box).toBe(2);
        expect(result.interval).toBe(2); // LEITNER_INTERVALS[2]
        expect(result.nextReviewAt).toBe('2025-08-29T00:00:00.000Z'); // today + 2 days
        expect(result.reps).toBe(card.reps + 1);
        expect(result.lastReviewedAt).toBe('2025-08-27T00:00:00.000Z');
      });

      test('should upgrade from box 2 to box 3', () => {
        const result = nextByLeitner(baseCard, 3, today);

        expect(result.box).toBe(3);
        expect(result.interval).toBe(3); // LEITNER_INTERVALS[3]
        expect(result.nextReviewAt).toBe('2025-08-30T00:00:00.000Z'); // today + 3 days
      });

      test('should upgrade from box 3 to box 4', () => {
        const card = createTestCard({ box: 3, interval: 3 });
        const result = nextByLeitner(card, 3, today);

        expect(result.box).toBe(4);
        expect(result.interval).toBe(7); // LEITNER_INTERVALS[4]
        expect(result.nextReviewAt).toBe('2025-09-03T00:00:00.000Z'); // today + 7 days
      });

      test('should upgrade from box 4 to box 5', () => {
        const card = createTestCard({ box: 4, interval: 7 });
        const result = nextByLeitner(card, 3, today);

        expect(result.box).toBe(5);
        expect(result.interval).toBe(14); // LEITNER_INTERVALS[5]
        expect(result.nextReviewAt).toBe('2025-09-10T00:00:00.000Z'); // today + 14 days
      });

      test('should cap at box 5 - cannot upgrade further', () => {
        const card = createTestCard({ box: 5, interval: 14 });
        const result = nextByLeitner(card, 3, today);

        expect(result.box).toBe(5); // Still box 5
        expect(result.interval).toBe(14); // Still 14 days
        expect(result.nextReviewAt).toBe('2025-09-10T00:00:00.000Z');
      });
    });

    describe('Quality 2 (Medium) - Should maintain current box', () => {
      test('should maintain box 1', () => {
        const card = createTestCard({ box: 1, interval: 1 });
        const result = nextByLeitner(card, 2, today);

        expect(result.box).toBe(1);
        expect(result.interval).toBe(1); // LEITNER_INTERVALS[1]
        expect(result.nextReviewAt).toBe('2025-08-28T00:00:00.000Z'); // today + 1 day
        expect(result.reps).toBe(card.reps + 1);
      });

      test('should maintain box 3', () => {
        const card = createTestCard({ box: 3, interval: 3 });
        const result = nextByLeitner(card, 2, today);

        expect(result.box).toBe(3);
        expect(result.interval).toBe(3);
        expect(result.nextReviewAt).toBe('2025-08-30T00:00:00.000Z');
      });

      test('should maintain box 5', () => {
        const card = createTestCard({ box: 5, interval: 14 });
        const result = nextByLeitner(card, 2, today);

        expect(result.box).toBe(5);
        expect(result.interval).toBe(14);
        expect(result.nextReviewAt).toBe('2025-09-10T00:00:00.000Z');
      });
    });

    describe('Quality 1 (Hard) - Should reset to box 1', () => {
      test('should reset from box 2 to box 1', () => {
        const result = nextByLeitner(baseCard, 1, today);

        expect(result.box).toBe(1);
        expect(result.interval).toBe(1); // LEITNER_INTERVALS[1]
        expect(result.nextReviewAt).toBe('2025-08-28T00:00:00.000Z');
        expect(result.reps).toBe(baseCard.reps); // reps unchanged on failure
      });

      test('should reset from box 5 to box 1', () => {
        const card = createTestCard({ box: 5, interval: 14, reps: 10 });
        const result = nextByLeitner(card, 1, today);

        expect(result.box).toBe(1);
        expect(result.interval).toBe(1);
        expect(result.nextReviewAt).toBe('2025-08-28T00:00:00.000Z');
        expect(result.reps).toBe(10); // reps unchanged on quality=1
      });

      test('should handle already at box 1', () => {
        const card = createTestCard({ box: 1, interval: 1, reps: 3 });
        const result = nextByLeitner(card, 1, today);

        expect(result.box).toBe(1);
        expect(result.interval).toBe(1);
        expect(result.nextReviewAt).toBe('2025-08-28T00:00:00.000Z');
        expect(result.reps).toBe(3); // reps unchanged
      });
    });

    describe('Edge cases and data integrity', () => {
      test('should preserve other card properties', () => {
        const card = createTestCard({
          id: 'test-preserve',
          word: { base: 'preserve', forms: [] },
          meaning: '保持不變',
          synonyms: ['keep', 'maintain'],
          antonyms: ['change'],
          example: 'Preserve the original data.',
          box: 2,
        });

        const result = nextByLeitner(card, 3, today);

        // These should be preserved
        expect(result.id).toBe('test-preserve');
        expect(result.word.base).toBe('preserve');
        expect(result.meaning).toBe('保持不變');
        expect(result.synonyms).toEqual(['keep', 'maintain']);
        expect(result.antonyms).toEqual(['change']);
        expect(result.example).toBe('Preserve the original data.');
        
        // These should be updated
        expect(result.box).toBe(3);
        expect(result.lastReviewedAt).toBe('2025-08-27T00:00:00.000Z');
      });

      test('should handle invalid quality values gracefully', () => {
        // TypeScript should prevent this, but runtime safety
        const result1 = nextByLeitner(baseCard, 0 as Quality, today);
        expect(result1.box).toBe(1); // Should treat as quality=1
        
        const result2 = nextByLeitner(baseCard, 4 as Quality, today);
        expect(result2.box).toBe(3); // Should treat as quality=3
      });

      test('should handle different today dates', () => {
        const customToday = new Date('2025-12-25T00:00:00.000Z');
        const result = nextByLeitner(baseCard, 3, customToday);

        expect(result.nextReviewAt).toBe('2025-12-28T00:00:00.000Z'); // customToday + 3 days
        expect(result.lastReviewedAt).toBe('2025-12-25T00:00:00.000Z');
      });
    });
  });
});

describe('SM-2 Algorithm', () => {
  describe('nextBySM2', () => {
    let baseCard: Card;
    const today = testDates.today;

    beforeEach(() => {
      baseCard = createTestCard({
        ease: 2.5,
        reps: 0,
        interval: 0,
        box: 1, // box should be preserved in SM-2
      });
    });

    describe('First review (reps: 0 -> 1)', () => {
      test('should set interval to 1 day regardless of quality', () => {
        const qualities: Quality[] = [1, 2, 3];
        
        qualities.forEach(quality => {
          const result = nextBySM2(baseCard, quality, today);
          
          expect(result.interval).toBe(1);
          expect(result.reps).toBe(1);
          expect(result.nextReviewAt).toBe('2025-08-28T00:00:00.000Z'); // today + 1 day
        });
      });

      test('should adjust ease based on quality', () => {
        const result1 = nextBySM2(baseCard, 1, today);
        expect(result1.ease).toBe(1.3); // Math.max(1.3, 2.5 - 0.2) = 1.3 (capped)
        
        const result2 = nextBySM2(baseCard, 2, today);
        expect(result2.ease).toBe(2.5); // unchanged
        
        const result3 = nextBySM2(baseCard, 3, today);
        expect(result3.ease).toBe(2.6); // 2.5 + 0.1
      });
    });

    describe('Second review (reps: 1 -> 2)', () => {
      beforeEach(() => {
        baseCard = createTestCard({
          ease: 2.5,
          reps: 1,
          interval: 1,
        });
      });

      test('should set interval to 6 days regardless of quality', () => {
        const qualities: Quality[] = [1, 2, 3];
        
        qualities.forEach(quality => {
          if (quality === 1) {
            // Quality 1 resets, so different behavior
            const result = nextBySM2(baseCard, quality, today);
            expect(result.interval).toBe(1); // reset
            expect(result.reps).toBe(0); // reset
          } else {
            const result = nextBySM2(baseCard, quality, today);
            expect(result.interval).toBe(6);
            expect(result.reps).toBe(2);
            expect(result.nextReviewAt).toBe('2025-09-02T00:00:00.000Z'); // today + 6 days
          }
        });
      });

      test('should adjust ease for quality 2 and 3', () => {
        const result2 = nextBySM2(baseCard, 2, today);
        expect(result2.ease).toBe(2.5); // unchanged
        
        const result3 = nextBySM2(baseCard, 3, today);
        expect(result3.ease).toBe(2.6); // 2.5 + 0.1
      });
    });

    describe('Subsequent reviews (reps >= 2)', () => {
      beforeEach(() => {
        baseCard = createTestCard({
          ease: 2.6,
          reps: 2,
          interval: 6,
        });
      });

      test('should multiply interval by ease factor', () => {
        const result = nextBySM2(baseCard, 2, today);
        
        expect(result.interval).toBe(Math.round(6 * 2.6)); // 16 days
        expect(result.reps).toBe(3);
        expect(result.nextReviewAt).toBe('2025-09-12T00:00:00.000Z'); // today + 16 days
      });

      test('should handle quality 3 with ease increase', () => {
        const result = nextBySM2(baseCard, 3, today);
        
        expect(result.ease).toBe(2.7); // 2.6 + 0.1
        expect(result.interval).toBe(Math.round(6 * 2.7)); // 16 days (6 * 2.7 = 16.2, rounded)
        expect(result.reps).toBe(3);
      });

      test('should handle long intervals with high ease', () => {
        const card = createTestCard({
          ease: 3.0,
          reps: 5,
          interval: 30,
        });
        
        const result = nextBySM2(card, 3, today);
        
        expect(result.ease).toBe(3.1); // 3.0 + 0.1
        expect(result.interval).toBe(Math.round(30 * 3.1)); // 93 days
        expect(result.reps).toBe(6);
      });
    });

    describe('Quality 1 (Hard) - Reset behavior', () => {
      test('should reset reps and interval, reduce ease', () => {
        const card = createTestCard({
          ease: 2.8,
          reps: 5,
          interval: 45,
        });
        
        const result = nextBySM2(card, 1, today);
        
        expect(result.reps).toBe(0); // reset
        expect(result.interval).toBe(1); // reset
        expect(result.ease).toBe(2.6); // 2.8 - 0.2
        expect(result.nextReviewAt).toBe('2025-08-28T00:00:00.000Z'); // today + 1 day
      });

      test('should cap ease at minimum 1.3', () => {
        const card = createTestCard({
          ease: 1.4,
          reps: 3,
          interval: 10,
        });
        
        const result = nextBySM2(card, 1, today);
        
        expect(result.ease).toBe(1.3); // Math.max(1.3, 1.4 - 0.2)
        expect(result.reps).toBe(0);
        expect(result.interval).toBe(1);
      });

      test('should handle already minimum ease', () => {
        const card = createTestCard({
          ease: 1.3,
          reps: 2,
        });
        
        const result = nextBySM2(card, 1, today);
        
        expect(result.ease).toBe(1.3); // Cannot go lower
      });
    });

    describe('Edge cases and data integrity', () => {
      test('should preserve box and other card properties', () => {
        const card = createTestCard({
          id: 'sm2-test',
          box: 3, // Should be preserved
          ease: 2.5,
          reps: 2,
          interval: 6,
        });
        
        const result = nextBySM2(card, 2, today);
        
        expect(result.box).toBe(3); // Preserved from original
        expect(result.id).toBe('sm2-test');
      });

      test('should handle floating point precision in ease calculations', () => {
        const card = createTestCard({
          ease: 2.55,
          reps: 0,
        });
        
        const result = nextBySM2(card, 3, today);
        
        expect(result.ease).toBeCloseTo(2.65, 2); // 2.55 + 0.1, within 0.01
      });

      test('should handle very high ease values', () => {
        const card = createTestCard({
          ease: 4.0,
          reps: 2,
          interval: 10,
        });
        
        const result = nextBySM2(card, 3, today);
        
        expect(result.ease).toBe(4.1);
        expect(result.interval).toBe(Math.round(10 * 4.1)); // 41 days
      });
    });
  });
});

describe('Algorithm Comparison and Integration', () => {
  test('both algorithms should handle same card consistently', () => {
    const card = createTestCard({
      box: 2,
      ease: 2.5,
      reps: 1,
      interval: 2,
    });
    
    const today = testDates.today;
    
    const leitnerResult = nextByLeitner(card, 3, today);
    const sm2Result = nextBySM2(card, 3, today);
    
    // Both should update lastReviewedAt
    expect(leitnerResult.lastReviewedAt).toBe('2025-08-27T00:00:00.000Z');
    expect(sm2Result.lastReviewedAt).toBe('2025-08-27T00:00:00.000Z');
    
    // Both should preserve original card data
    expect(leitnerResult.id).toBe(card.id);
    expect(sm2Result.id).toBe(card.id);
    expect(leitnerResult.meaning).toBe(card.meaning);
    expect(sm2Result.meaning).toBe(card.meaning);
  });

  test('both algorithms should handle quality 1 as failure', () => {
    const card = createTestCard({
      box: 4,
      ease: 2.8,
      reps: 5,
      interval: 20,
    });
    
    const today = testDates.today;
    
    const leitnerResult = nextByLeitner(card, 1, today);
    const sm2Result = nextBySM2(card, 1, today);
    
    // Both should show some form of "restart" behavior
    expect(leitnerResult.box).toBe(1); // Leitner resets box
    expect(sm2Result.reps).toBe(0);   // SM-2 resets reps
    
    // Both should have shorter intervals after failure
    expect(leitnerResult.interval).toBe(1);
    expect(sm2Result.interval).toBe(1);
  });
});