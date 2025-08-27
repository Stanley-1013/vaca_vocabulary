import { Card, WordForm, Anchor } from '../../src/types';

/**
 * Test helper to create Card objects with default values
 * 測試輔助函式，用於建立帶預設值的 Card 物件
 */
export const createTestCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'test-card-1',
  word: { 
    base: 'test', 
    forms: [{ pos: 'n.', form: 'test' }] as WordForm[]
  },
  posPrimary: 'n.',
  meaning: '測試',
  synonyms: [],
  antonyms: [],
  example: 'This is a test example.',
  anchors: [],
  createdAt: '2025-08-27T00:00:00.000Z',
  box: 1,
  ease: 2.5,
  reps: 0,
  interval: 0,
  lastReviewedAt: null,
  nextReviewAt: '2025-08-27T00:00:00.000Z',
  ...overrides,
});

/**
 * Test helper to create Anchor objects
 */
export const createTestAnchor = (overrides: Partial<Anchor> = {}): Anchor => ({
  type: 'image',
  url: 'https://example.com/test.jpg',
  title: 'Test Image',
  ...overrides,
});

/**
 * Date utilities for consistent test dates
 */
export const testDates = {
  today: new Date('2025-08-27T00:00:00.000Z'),
  yesterday: new Date('2025-08-26T00:00:00.000Z'),
  tomorrow: new Date('2025-08-28T00:00:00.000Z'),
  nextWeek: new Date('2025-09-03T00:00:00.000Z'),
} as const;

/**
 * Helper to format date to ISO string (matches srs.ts iso function)
 */
export const formatToISO = (date: Date): string => {
  return date.toISOString();
};

/**
 * Helper to add days to a date (matches srs.ts addDays function)
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Mock card data for different test scenarios
 */
export const mockCards = {
  // 新卡片 - 從未複習過
  newCard: createTestCard({
    id: 'new-card',
    word: { base: 'new', forms: [{ pos: 'adj.', form: 'new' }] },
    box: 1,
    reps: 0,
    lastReviewedAt: null,
  }),

  // 簡單卡片 - 在高級盒子中
  easyCard: createTestCard({
    id: 'easy-card',
    word: { base: 'easy', forms: [{ pos: 'adj.', form: 'easy' }] },
    box: 5,
    reps: 10,
    ease: 3.0,
    interval: 14,
    lastReviewedAt: '2025-08-13T00:00:00.000Z',
  }),

  // 困難卡片 - 低級盒子，低 ease
  difficultCard: createTestCard({
    id: 'difficult-card',
    word: { base: 'difficult', forms: [{ pos: 'adj.', form: 'difficult' }] },
    box: 1,
    reps: 5,
    ease: 1.3,
    interval: 1,
    lastReviewedAt: '2025-08-26T00:00:00.000Z',
  }),
} as const;