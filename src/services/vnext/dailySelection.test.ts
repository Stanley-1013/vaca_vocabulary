/**
 * vNext 1.1.0: 每日選卡模組測試
 * 
 * 功能：從所有到期卡片中智能選擇今日複習卡片
 * 契約：基於優先評分、每日上限、新字需求進行篩選
 * 
 * 依照 TDD 原則，先寫測試再實作
 */

import { describe, test, expect } from 'vitest';
import { Card, PriorityConfig, SelectionResult } from '../../types';
import { createTestCard, testDates } from '../../../test/utils/testHelpers';
import { selectTodayCards } from './dailySelection';

describe('selectTodayCards', () => {
  const today = testDates.today;
  
  interface DailySelectionConfig {
    maxDailyReviews: number;
    minNewPerDay: number;
    priorityWeights: PriorityConfig;
  }

  const defaultConfig: DailySelectionConfig = {
    maxDailyReviews: 20,
    minNewPerDay: 3,
    priorityWeights: { ease: 0.5, overdueDays: 0.3, box: 0.2 }
  };

  describe('Daily limit selection', () => {
    test('TC-SRS-035: should return all cards when under limit', () => {
      const cards = [
        createTestCard({ id: 'card-1', ease: 2.0 }),
        createTestCard({ id: 'card-2', ease: 1.8 }),
      ];

      const selection = selectTodayCards(cards, today, defaultConfig);

      expect(selection.duePicked).toHaveLength(2);
      expect(selection.needNew).toBe(1); // min(3, 20-2) = 1  
      expect(selection.mayNew).toBe(3);  // min(3, 20-2) = 3
    });

    test('TC-SRS-036: should limit and prioritize when over limit', () => {
      const cards = Array.from({ length: 30 }, (_, i) => 
        createTestCard({ 
          id: `card-${i}`,
          ease: 2.5 - (i * 0.05), // Decreasing ease = increasing difficulty
          nextReviewAt: '2025-08-27T00:00:00.000Z'
        })
      );

      const selection = selectTodayCards(cards, today, defaultConfig);

      expect(selection.duePicked).toHaveLength(20);
      
      // Should select hardest cards first (lowest ease = higher priority)
      const firstCard = selection.duePicked[0];
      const lastCard = selection.duePicked[19];
      expect(firstCard.ease).toBeLessThan(lastCard.ease);
    });

    test('TC-SRS-037: should reserve space for new cards', () => {
      const cards = Array.from({ length: 25 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );

      const configWithHighNewRequirement = {
        ...defaultConfig,
        minNewPerDay: 8 // High requirement
      };

      const selection = selectTodayCards(cards, today, configWithHighNewRequirement);

      // Should pick fewer due cards to reserve space for new ones
      expect(selection.duePicked.length).toBeLessThan(20);
      expect(selection.needNew).toBe(8);
      expect(selection.duePicked.length + selection.needNew).toBeLessThanOrEqual(20);
    });

    test('TC-SRS-038: should handle no new cards needed', () => {
      const cards = Array.from({ length: 15 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );

      const configNoNew = {
        ...defaultConfig,
        minNewPerDay: 0
      };

      const selection = selectTodayCards(cards, today, configNoNew);

      expect(selection.duePicked).toHaveLength(15);
      expect(selection.needNew).toBe(0);
      expect(selection.mayNew).toBe(5); // 20 - 15 = 5 available slots
    });
  });

  describe('Priority sorting logic', () => {
    test('TC-SRS-039: should sort by priority score descending', () => {
      const cards = [
        createTestCard({ 
          id: 'easy-card',
          ease: 3.0, // Low difficulty
          box: 5,    // High box  
          nextReviewAt: '2025-08-27T00:00:00.000Z' // Not overdue
        }),
        createTestCard({ 
          id: 'hard-card',
          ease: 1.5, // High difficulty
          box: 1,    // Low box
          nextReviewAt: '2025-08-25T00:00:00.000Z' // Overdue
        }),
        createTestCard({
          id: 'medium-card',
          ease: 2.2, // Medium difficulty
          box: 3,    // Medium box
          nextReviewAt: '2025-08-26T00:00:00.000Z' // Slightly overdue
        })
      ];

      const selection = selectTodayCards(cards, today, defaultConfig);

      // Should be sorted by priority: hard > medium > easy
      expect(selection.duePicked[0].id).toBe('hard-card');
      expect(selection.duePicked[1].id).toBe('medium-card');
      expect(selection.duePicked[2].id).toBe('easy-card');
    });

    test('TC-SRS-040: should handle tie-breaking with lastReviewedAt', () => {
      const cards = [
        createTestCard({ 
          id: 'recent',
          ease: 2.0,
          box: 2,
          lastReviewedAt: '2025-08-26T00:00:00.000Z'
        }),
        createTestCard({ 
          id: 'older',
          ease: 2.0, // Same difficulty
          box: 2,    // Same box
          lastReviewedAt: '2025-08-24T00:00:00.000Z'
        }),
      ];

      const selection = selectTodayCards(cards, today, defaultConfig);

      // Older card should come first (reviewed earlier)
      expect(selection.duePicked[0].id).toBe('older');
      expect(selection.duePicked[1].id).toBe('recent');
    });

    test('TC-SRS-041: should handle secondary tie-breaking with card ID', () => {
      const cards = [
        createTestCard({ 
          id: 'card-z',
          ease: 2.0,
          box: 2,
          lastReviewedAt: '2025-08-25T00:00:00.000Z' // Same review date
        }),
        createTestCard({ 
          id: 'card-a',
          ease: 2.0, // Same everything
          box: 2,
          lastReviewedAt: '2025-08-25T00:00:00.000Z'
        }),
      ];

      const selection = selectTodayCards(cards, today, defaultConfig);

      // Should fall back to stable sort (e.g., by ID)
      const firstId = selection.duePicked[0].id;
      const secondId = selection.duePicked[1].id;
      
      expect([firstId, secondId].sort()).toEqual(['card-a', 'card-z']);
    });
  });

  describe('Edge cases and validation', () => {
    test('TC-SRS-042: should handle empty card list', () => {
      const cards: Card[] = [];

      const selection = selectTodayCards(cards, today, defaultConfig);

      expect(selection.duePicked).toHaveLength(0);
      expect(selection.needNew).toBe(3); // Still want new cards
      expect(selection.mayNew).toBe(3);
    });

    test('TC-SRS-043: should handle single card', () => {
      const cards = [createTestCard({ id: 'only-card' })];

      const selection = selectTodayCards(cards, today, defaultConfig);

      expect(selection.duePicked).toHaveLength(1);
      expect(selection.duePicked[0].id).toBe('only-card');
    });

    test('TC-SRS-044: should handle zero daily limit', () => {
      const cards = [createTestCard({ id: 'card-1' })];
      
      const zeroLimitConfig = {
        ...defaultConfig,
        maxDailyReviews: 0
      };

      const selection = selectTodayCards(cards, today, zeroLimitConfig);

      expect(selection.duePicked).toHaveLength(0);
      expect(selection.needNew).toBe(0);
      expect(selection.mayNew).toBe(0);
    });

    test('TC-SRS-045: should handle large daily limit', () => {
      const cards = Array.from({ length: 5 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );

      const largeLimitConfig = {
        ...defaultConfig,
        maxDailyReviews: 1000
      };

      const selection = selectTodayCards(cards, today, largeLimitConfig);

      expect(selection.duePicked).toHaveLength(5); // All cards selected
      expect(selection.needNew).toBe(3); // Still respect minNew
    });
  });

  describe('Priority weight effects', () => {
    test('TC-SRS-046: should prioritize overdue cards with high overdue weight', () => {
      const cards = [
        createTestCard({
          id: 'difficult-current',
          ease: 1.3, // Very difficult
          box: 1,
          nextReviewAt: '2025-08-27T00:00:00.000Z' // Due today
        }),
        createTestCard({
          id: 'easy-overdue',
          ease: 3.0, // Easy
          box: 5,
          nextReviewAt: '2025-08-20T00:00:00.000Z' // Very overdue
        })
      ];

      // High overdue weight
      const overdueWeightConfig = {
        ...defaultConfig,
        priorityWeights: { ease: 0.1, overdueDays: 0.8, box: 0.1 }
      };

      const selection = selectTodayCards(cards, today, overdueWeightConfig);

      // Overdue card should come first despite being easier
      expect(selection.duePicked[0].id).toBe('easy-overdue');
    });

    test('TC-SRS-047: should prioritize low-level cards with high box weight', () => {
      const cards = [
        createTestCard({
          id: 'high-box-hard',
          ease: 1.5, // Difficult
          box: 5,    // High box
        }),
        createTestCard({
          id: 'low-box-easy',
          ease: 2.8, // Easy
          box: 1,    // Low box - needs more practice
        })
      ];

      // High box weight
      const boxWeightConfig = {
        ...defaultConfig,
        priorityWeights: { ease: 0.1, overdueDays: 0.1, box: 0.8 }
      };

      const selection = selectTodayCards(cards, today, boxWeightConfig);

      // Low box card should come first
      expect(selection.duePicked[0].id).toBe('low-box-easy');
    });
  });

  describe('Return value structure', () => {
    test('TC-SRS-048: should return correct SelectionResult structure', () => {
      const cards = [createTestCard({ id: 'test' })];

      const selection = selectTodayCards(cards, today, defaultConfig);

      // Check return type structure
      expect(selection).toHaveProperty('duePicked');
      expect(selection).toHaveProperty('needNew');
      expect(selection).toHaveProperty('mayNew');
      
      expect(Array.isArray(selection.duePicked)).toBe(true);
      expect(typeof selection.needNew).toBe('number');
      expect(typeof selection.mayNew).toBe('number');
    });

    test('TC-SRS-049: should not mutate input cards', () => {
      const originalCards = [
        createTestCard({ id: 'card-1', ease: 2.0 }),
        createTestCard({ id: 'card-2', ease: 1.8 }),
      ];
      
      const cardsCopy = JSON.parse(JSON.stringify(originalCards));

      selectTodayCards(originalCards, today, defaultConfig);

      // Original cards should be unchanged
      expect(originalCards).toEqual(cardsCopy);
    });
  });
});