/**
 * vNext 1.1.0: Again 佇列管理模組測試
 * 
 * 功能：處理 Again 按鈕的卡片佇列重排邏輯
 * 契約：不影響 SRS 狀態，僅在當日學習佇列中重新排序
 * 
 * 依照 TDD 原則，先寫測試再實作
 */

import { describe, test, expect } from 'vitest';
import { Card } from '../../types';
import { createTestCard } from '../../../test/utils/testHelpers';
import { insertAgainCard } from './againQueue';

describe('insertAgainCard', () => {
  describe('Again queue re-insertion', () => {
    test('TC-SRS-050: should insert at correct position for first Again', () => {
      const queue = Array.from({ length: 10 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again-card' });
      const againSequence = [2, 5, 10];
      const currentPosition = 3; // Currently at position 3

      const newQueue = insertAgainCard(queue, againCard, 0, againSequence, currentPosition);
      
      const againIndex = newQueue.findIndex(card => card.id === 'again-card');
      expect(againIndex).toBe(5); // currentPosition (3) + sequence[0] (2) = 5
      expect(newQueue).toHaveLength(11); // Original 10 + 1 again card
    });

    test('TC-SRS-051: should use correct sequence position for multiple Again', () => {
      const queue = Array.from({ length: 10 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again-card' });
      const againSequence = [2, 5, 10];
      const currentPosition = 2;

      // Second Again (againCount = 1)
      const newQueue = insertAgainCard(queue, againCard, 1, againSequence, currentPosition);
      
      const againIndex = newQueue.findIndex(card => card.id === 'again-card');
      expect(againIndex).toBe(7); // currentPosition (2) + sequence[1] (5) = 7
    });

    test('TC-SRS-052: should handle third Again with correct sequence', () => {
      const queue = Array.from({ length: 15 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again-card' });
      const againSequence = [2, 5, 10];
      const currentPosition = 1;

      // Third Again (againCount = 2)
      const newQueue = insertAgainCard(queue, againCard, 2, againSequence, currentPosition);
      
      const againIndex = newQueue.findIndex(card => card.id === 'again-card');
      expect(againIndex).toBe(11); // currentPosition (1) + sequence[2] (10) = 11
    });

    test('TC-SRS-053: should cap againCount at sequence length', () => {
      const queue = Array.from({ length: 15 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again-card' });
      const againSequence = [2, 5, 10];
      const currentPosition = 0;

      // Try to use againCount=5 (beyond sequence length)
      const newQueue = insertAgainCard(queue, againCard, 5, againSequence, currentPosition);
      
      const againIndex = newQueue.findIndex(card => card.id === 'again-card');
      expect(againIndex).toBe(10); // Should use last sequence value (10)
    });

    test('TC-SRS-054: should handle empty againSequence', () => {
      const queue = Array.from({ length: 5 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again-card' });
      const emptySequence: number[] = [];

      const newQueue = insertAgainCard(queue, againCard, 0, emptySequence, 0);
      
      // Should append to end when no sequence provided
      expect(newQueue).toHaveLength(6);
      expect(newQueue[5].id).toBe('again-card');
    });
  });

  describe('Queue overflow handling', () => {
    test('TC-SRS-055: should handle queue overflow gracefully', () => {
      const shortQueue = [createTestCard({ id: 'only-card' })];
      const againCard = createTestCard({ id: 'again-card' });
      const againSequence = [5]; // Longer than queue
      const currentPosition = 0;

      const newQueue = insertAgainCard(shortQueue, againCard, 0, againSequence, currentPosition);
      
      // Should append to end when position exceeds queue length
      expect(newQueue).toHaveLength(2);
      expect(newQueue[1].id).toBe('again-card');
    });

    test('TC-SRS-056: should handle insertion at queue boundary', () => {
      const queue = Array.from({ length: 3 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again-card' });
      const againSequence = [3]; // Exactly at queue length
      const currentPosition = 0;

      const newQueue = insertAgainCard(queue, againCard, 0, againSequence, currentPosition);
      
      // Should insert at the end (position 3)
      expect(newQueue).toHaveLength(4);
      expect(newQueue[3].id).toBe('again-card');
    });

    test('TC-SRS-057: should handle current position at queue end', () => {
      const queue = Array.from({ length: 5 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again-card' });
      const againSequence = [2];
      const currentPosition = 4; // At end of queue

      const newQueue = insertAgainCard(queue, againCard, 0, againSequence, currentPosition);
      
      // Should append to end since 4 + 2 = 6 > queue length
      expect(newQueue).toHaveLength(6);
      expect(newQueue[5].id).toBe('again-card');
    });
  });

  describe('Queue integrity', () => {
    test('TC-SRS-058: should preserve original queue order', () => {
      const originalQueue = [
        createTestCard({ id: 'first' }),
        createTestCard({ id: 'second' }),
        createTestCard({ id: 'third' }),
        createTestCard({ id: 'fourth' }),
      ];
      const againCard = createTestCard({ id: 'again' });
      const currentPosition = 0;

      const newQueue = insertAgainCard(originalQueue, againCard, 0, [2], currentPosition);
      
      // Check that original cards maintain their relative order
      expect(newQueue[0].id).toBe('first');
      expect(newQueue[1].id).toBe('second');
      expect(newQueue[2].id).toBe('again'); // Inserted at position 2
      expect(newQueue[3].id).toBe('third');
      expect(newQueue[4].id).toBe('fourth');
    });

    test('TC-SRS-059: should not mutate original queue', () => {
      const originalQueue = [createTestCard({ id: 'original' })];
      const againCard = createTestCard({ id: 'again' });

      const newQueue = insertAgainCard(originalQueue, againCard, 0, [1], 0);
      
      expect(originalQueue).toHaveLength(1); // Unchanged
      expect(newQueue).toHaveLength(2);     // New array
      expect(originalQueue).not.toBe(newQueue); // Different references
    });

    test('TC-SRS-060: should handle duplicate cards in queue', () => {
      const duplicateCard = createTestCard({ id: 'duplicate' });
      const queue = [
        duplicateCard,
        createTestCard({ id: 'other' }),
        duplicateCard, // Same reference
      ];
      const againCard = createTestCard({ id: 'again' });

      const newQueue = insertAgainCard(queue, againCard, 0, [1], 0);
      
      // Should still work correctly
      expect(newQueue).toHaveLength(4);
      expect(newQueue[1].id).toBe('again');
    });
  });

  describe('Edge cases and validation', () => {
    test('TC-SRS-061: should handle negative againCount', () => {
      const queue = [createTestCard({ id: 'card' })];
      const againCard = createTestCard({ id: 'again' });

      // Negative againCount should be treated as 0
      const newQueue = insertAgainCard(queue, againCard, -1, [2], 0);
      
      const againIndex = newQueue.findIndex(card => card.id === 'again');
      expect(againIndex).toBe(1); // Should use sequence[0]
    });

    test('TC-SRS-062: should handle negative current position', () => {
      const queue = [createTestCard({ id: 'card' })];
      const againCard = createTestCard({ id: 'again' });

      // Negative position should be treated as 0
      const newQueue = insertAgainCard(queue, againCard, 0, [1], -1);
      
      const againIndex = newQueue.findIndex(card => card.id === 'again');
      expect(againIndex).toBe(1); // 0 + 1 = 1
    });

    test('TC-SRS-063: should handle zero gap sequence', () => {
      const queue = Array.from({ length: 3 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again' });
      const zeroSequence = [0, 1, 2];
      const currentPosition = 1;

      const newQueue = insertAgainCard(queue, againCard, 0, zeroSequence, currentPosition);
      
      // Should insert at current position (1 + 0 = 1)
      expect(newQueue[1].id).toBe('again');
      expect(newQueue[2].id).toBe('card-1'); // Original card shifted
    });

    test('TC-SRS-064: should handle large gap values', () => {
      const queue = Array.from({ length: 3 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again' });
      const largeSequence = [100]; // Much larger than queue
      const currentPosition = 0;

      const newQueue = insertAgainCard(queue, againCard, 0, largeSequence, currentPosition);
      
      // Should append to end
      expect(newQueue).toHaveLength(4);
      expect(newQueue[3].id).toBe('again');
    });
  });

  describe('Performance considerations', () => {
    test('TC-SRS-065: should handle large queues efficiently', () => {
      const largeQueue = Array.from({ length: 1000 }, (_, i) => 
        createTestCard({ id: `card-${i}` })
      );
      const againCard = createTestCard({ id: 'again' });

      const startTime = performance.now();
      const newQueue = insertAgainCard(largeQueue, againCard, 0, [10], 500);
      const endTime = performance.now();

      // Should complete in reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Verify correctness
      expect(newQueue).toHaveLength(1001);
      expect(newQueue[510].id).toBe('again'); // 500 + 10 = 510
    });
  });
});