/**
 * vNext 1.1.0: 優先評分模組測試
 * 
 * 功能：計算卡片的優先複習分數
 * 契約：基於難度、逾期天數、盒子層級計算複合評分
 * 
 * 依照 TDD 原則，先寫測試再實作
 */

import { describe, test, expect } from 'vitest';
import { Card, PriorityConfig } from '../../types';
import { createTestCard, testDates } from '../../../test/utils/testHelpers';
import { calculatePriorityScore } from './priorityScore';

describe('calculatePriorityScore', () => {
  const today = testDates.today;
  const defaultWeights: PriorityConfig = { ease: 0.5, overdueDays: 0.3, box: 0.2 };

  describe('Priority scoring calculation', () => {
    test('TC-SRS-022: should calculate priority score correctly', () => {
      const card = createTestCard({
        ease: 1.5, // difficulty = 3.0 - 1.5 = 1.5
        box: 1,    // level = 5 - 1 = 4, normalized = 4/4 = 1.0
        nextReviewAt: '2025-08-26T00:00:00.000Z' // 1 day overdue
      });

      const score = calculatePriorityScore(card, today, defaultWeights);
      
      // difficulty: 1.5, overdueDaysNorm: 1/7 ≈ 0.143, levelNorm: 1.0
      // score = 0.5 * 1.5 + 0.3 * 0.143 + 0.2 * 1.0 ≈ 0.993
      expect(score).toBeCloseTo(0.993, 2);
    });

    test('TC-SRS-023: should handle non-overdue cards', () => {
      const card = createTestCard({
        ease: 2.5, // difficulty = 3.0 - 2.5 = 0.5
        box: 3,    // level = 5 - 3 = 2, normalized = 2/4 = 0.5  
        nextReviewAt: '2025-08-28T00:00:00.000Z' // Tomorrow, not overdue
      });

      const score = calculatePriorityScore(card, today, defaultWeights);
      
      // difficulty: 0.5, overdueDaysNorm: 0, levelNorm: 0.5
      // score = 0.5 * 0.5 + 0.3 * 0 + 0.2 * 0.5 = 0.35
      expect(score).toBeCloseTo(0.35, 2);
    });

    test('TC-SRS-024: should cap overdue days at 7 (1.0 normalized)', () => {
      const card = createTestCard({
        ease: 2.0, // difficulty = 1.0
        box: 2,    // levelNorm = 0.75
        nextReviewAt: '2025-08-10T00:00:00.000Z' // 17 days overdue
      });

      const score = calculatePriorityScore(card, today, defaultWeights);
      
      // overdueDaysNorm should be capped at 1.0
      // score = 0.5 * 1.0 + 0.3 * 1.0 + 0.2 * 0.75 = 0.95
      expect(score).toBeCloseTo(0.95, 2);
    });

    test('TC-SRS-025: should handle maximum difficulty (ease 1.3)', () => {
      const card = createTestCard({
        ease: 1.3, // difficulty = 3.0 - 1.3 = 1.7, within [0,2] range
        box: 1,
        nextReviewAt: '2025-08-27T00:00:00.000Z' // Not overdue
      });

      const score = calculatePriorityScore(card, today, defaultWeights);
      
      // difficulty should be: clamp(3.0 - 1.3, 0, 2) = 1.7 (within range)
      const expectedDifficulty = Math.min(2.0, Math.max(0, 3.0 - 1.3));
      expect(expectedDifficulty).toBe(1.7);
      
      // score = 0.5 * 1.7 + 0.3 * 0 + 0.2 * 1.0 = 1.05
      expect(score).toBeCloseTo(1.05, 2);
    });

    test('TC-SRS-026: should handle minimum difficulty (high ease)', () => {
      const card = createTestCard({
        ease: 4.0, // difficulty = 3.0 - 4.0 = -1.0, clamped to 0
        box: 5,    // levelNorm = 0
        nextReviewAt: '2025-08-27T00:00:00.000Z'
      });

      const score = calculatePriorityScore(card, today, defaultWeights);
      
      // difficulty should be clamped to 0
      // score = 0.5 * 0 + 0.3 * 0 + 0.2 * 0 = 0
      expect(score).toBe(0);
    });
  });

  describe('Weight configuration effects', () => {
    test('TC-SRS-027: should respond to different weight configurations', () => {
      const card = createTestCard({ 
        ease: 2.0, 
        box: 3, 
        nextReviewAt: '2025-08-26T00:00:00.000Z' 
      });

      const easeOnlyWeights: PriorityConfig = { ease: 1.0, overdueDays: 0.0, box: 0.0 };
      const boxOnlyWeights: PriorityConfig = { ease: 0.0, overdueDays: 0.0, box: 1.0 };

      const easeScore = calculatePriorityScore(card, today, easeOnlyWeights);
      const boxScore = calculatePriorityScore(card, today, boxOnlyWeights);

      expect(easeScore).not.toBe(boxScore);
      expect(easeScore).toBe(1.0); // difficulty = 1.0
      expect(boxScore).toBe(0.5);  // levelNorm = 0.5
    });

    test('TC-SRS-028: should handle zero weights', () => {
      const card = createTestCard({ ease: 1.5, box: 2, nextReviewAt: '2025-08-25T00:00:00.000Z' });
      const zeroWeights: PriorityConfig = { ease: 0.0, overdueDays: 0.0, box: 0.0 };

      const score = calculatePriorityScore(card, today, zeroWeights);
      expect(score).toBe(0);
    });

    test('TC-SRS-029: should handle custom weight distribution', () => {
      const card = createTestCard({ 
        ease: 2.0,  // difficulty = 1.0
        box: 2,     // levelNorm = 0.75  
        nextReviewAt: '2025-08-24T00:00:00.000Z' // 3 days overdue, norm = 3/7 ≈ 0.429
      });

      // Prioritize overdue factor
      const overdueWeights: PriorityConfig = { ease: 0.2, overdueDays: 0.7, box: 0.1 };
      const score = calculatePriorityScore(card, today, overdueWeights);
      
      // score = 0.2 * 1.0 + 0.7 * 0.429 + 0.1 * 0.75 ≈ 0.575
      expect(score).toBeCloseTo(0.575, 2);
    });
  });

  describe('Date calculation edge cases', () => {
    test('TC-SRS-030: should handle cards scheduled for future', () => {
      const card = createTestCard({
        ease: 2.0,
        box: 2,
        nextReviewAt: '2025-08-30T00:00:00.000Z' // 3 days in future
      });

      const score = calculatePriorityScore(card, today, defaultWeights);
      
      // overdueDays should be 0 (not negative)
      // score = 0.5 * 1.0 + 0.3 * 0 + 0.2 * 0.75 = 0.65
      expect(score).toBeCloseTo(0.65, 2);
    });

    test('TC-SRS-031: should handle same-day cards', () => {
      const card = createTestCard({
        ease: 2.0,
        box: 2,
        nextReviewAt: '2025-08-27T00:00:00.000Z' // Same as today
      });

      const score = calculatePriorityScore(card, today, defaultWeights);
      
      // overdueDays = 0
      // score = 0.5 * 1.0 + 0.3 * 0 + 0.2 * 0.75 = 0.65
      expect(score).toBeCloseTo(0.65, 2);
    });

    test('TC-SRS-032: should handle very old overdue cards', () => {
      const card = createTestCard({
        ease: 2.5, // difficulty = 0.5
        box: 3,    // levelNorm = 0.5
        nextReviewAt: '2025-01-01T00:00:00.000Z' // Very overdue (months)
      });

      const score = calculatePriorityScore(card, today, defaultWeights);
      
      // overdueDaysNorm should be capped at 1.0
      // score = 0.5 * 0.5 + 0.3 * 1.0 + 0.2 * 0.5 = 0.65
      expect(score).toBeCloseTo(0.65, 2);
    });
  });

  describe('Input validation', () => {
    test('TC-SRS-033: should handle missing nextReviewAt', () => {
      const card = createTestCard({
        ease: 2.0,
        box: 2,
        nextReviewAt: '' // Invalid date
      });

      // Should not throw, should handle gracefully
      expect(() => calculatePriorityScore(card, today, defaultWeights)).not.toThrow();
    });

    test('TC-SRS-034: should handle extreme ease values', () => {
      const highEaseCard = createTestCard({ ease: 10.0, box: 1 });
      const lowEaseCard = createTestCard({ ease: 0.5, box: 1 });

      const highScore = calculatePriorityScore(highEaseCard, today, defaultWeights);
      const lowScore = calculatePriorityScore(lowEaseCard, today, defaultWeights);

      // High ease → low difficulty → low score
      // Low ease → high difficulty (clamped) → high score
      expect(lowScore).toBeGreaterThan(highScore);
    });
  });
});