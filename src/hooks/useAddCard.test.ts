/**
 * useAddCard Hook Tests
 * 
 * 根據 TDD 原則，這些測試必須在實作前完成
 * 定義了 useAddCard hook 的完整行為規格
 * 
 * 測試涵蓋：
 * 1. 基本新增卡片功能
 * 2. 表單資料驗證
 * 3. 錯誤處理與重試
 * 4. Cache 更新與同步
 * 5. Loading 狀態管理
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { createTestCard, createTestAnchor } from '../../test/utils/testHelpers';
import { Card, ApiResponse, WordForm, Anchor } from '../types';

// 這個 hook 必須在 src/hooks/useAddCard.ts 中實作
import { useAddCard } from './useAddCard';

// Type for new card input (without server-generated fields)
type NewCardInput = Omit<Card, 'id' | 'box' | 'ease' | 'reps' | 'interval' | 'lastReviewedAt' | 'nextReviewAt' | 'createdAt'>;

// Mock server setup
const server = setupServer(
  rest.post('/cards', async (req, res, ctx) => {
    const body = await req.json() as NewCardInput;
    
    // Validate required fields
    if (!body.word?.base || !body.meaning || !body.example) {
      return res(
        ctx.status(400),
        ctx.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields'
          }
        } as ApiResponse<never>)
      );
    }
    
    // Simulate successful creation
    const newId = `card-${Math.random().toString(36).substr(2, 9)}`;
    
    return res(
      ctx.json({
        ok: true,
        id: newId
      } as ApiResponse<{ id: string }>)
    );
  })
);

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useAddCard Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Basic Functionality', () => {
    test('should add new card with minimal required data', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const newCard: NewCardInput = {
        word: { base: 'test', forms: [{ pos: 'n.', form: 'test' }] },
        posPrimary: 'n.',
        meaning: '測試',
        synonyms: [],
        antonyms: [],
        example: 'This is a test.',
        anchors: []
      };

      let response: { id: string } | undefined;

      await act(async () => {
        response = await result.current.mutateAsync(newCard);
      });

      expect(response).toBeDefined();
      expect(response!.id).toMatch(/^card-/); // Should have generated ID
      expect(result.current.isSuccess).toBe(true);
    });

    test('should add card with complete data including forms and anchors', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const completeCard: NewCardInput = {
        word: { 
          base: 'ubiquitous', 
          forms: [
            { pos: 'adj.', form: 'ubiquitous' },
            { pos: 'n.', form: 'ubiquity' },
            { pos: 'adv.', form: 'ubiquitously' }
          ] 
        },
        posPrimary: 'adj.',
        meaning: '無所不在的，普遍存在的',
        synonyms: ['omnipresent', 'pervasive', 'universal'],
        antonyms: ['rare', 'scarce'],
        example: 'Smartphones have become ubiquitous in modern society.',
        anchors: [
          createTestAnchor({
            type: 'image',
            url: 'https://example.com/smartphone.jpg',
            title: 'smartphone'
          })
        ],
        tags: ['technology', 'vocabulary']
      };

      await act(async () => {
        await result.current.mutateAsync(completeCard);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeDefined();
    });

    test('should add card with multiple anchors of different types', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const cardWithMedia: NewCardInput = {
        word: { base: 'multimedia', forms: [] },
        posPrimary: 'adj.',
        meaning: '多媒體的',
        synonyms: [],
        antonyms: [],
        example: 'This is a multimedia presentation.',
        anchors: [
          { type: 'image', url: 'https://example.com/image.jpg', title: 'Image' },
          { type: 'youtube', url: 'https://youtube.com/embed/test', title: 'Video' },
          { type: 'link', url: 'https://example.com/article', title: 'Article' }
        ]
      };

      await act(async () => {
        await result.current.mutateAsync(cardWithMedia);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should handle empty arrays for optional fields', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const minimalCard: NewCardInput = {
        word: { base: 'minimal', forms: [] },
        posPrimary: 'adj.',
        meaning: '最小的',
        synonyms: [], // Empty array
        antonyms: [], // Empty array
        example: 'This is minimal.',
        anchors: [] // Empty array
      };

      await act(async () => {
        await result.current.mutateAsync(minimalCard);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Validation and Error Handling', () => {
    test('should fail when missing required word.base', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const invalidCard = {
        word: { base: '', forms: [] }, // Empty base
        posPrimary: 'n.',
        meaning: '測試',
        synonyms: [],
        antonyms: [],
        example: 'Test example.',
        anchors: []
      } as NewCardInput;

      await act(async () => {
        try {
          await result.current.mutateAsync(invalidCard);
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });

    test('should fail when missing required meaning', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const invalidCard = {
        word: { base: 'test', forms: [] },
        posPrimary: 'n.',
        meaning: '', // Empty meaning
        synonyms: [],
        antonyms: [],
        example: 'Test example.',
        anchors: []
      } as NewCardInput;

      await act(async () => {
        try {
          await result.current.mutateAsync(invalidCard);
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);
    });

    test('should fail when missing required example', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const invalidCard = {
        word: { base: 'test', forms: [] },
        posPrimary: 'n.',
        meaning: '測試',
        synonyms: [],
        antonyms: [],
        example: '', // Empty example
        anchors: []
      } as NewCardInput;

      await act(async () => {
        try {
          await result.current.mutateAsync(invalidCard);
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);
    });

    test('should handle server validation errors', async () => {
      server.use(
        rest.post('/cards', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              ok: false,
              error: {
                code: 'INVALID_POS',
                message: 'Invalid part of speech'
              }
            } as ApiResponse<never>)
          );
        })
      );

      const { result } = renderHook(() => useAddCard(), { wrapper });

      const card: NewCardInput = {
        word: { base: 'test', forms: [] },
        posPrimary: 'invalid-pos' as any,
        meaning: '測試',
        synonyms: [],
        antonyms: [],
        example: 'Test.',
        anchors: []
      };

      await act(async () => {
        try {
          await result.current.mutateAsync(card);
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);
    });

    test('should handle network errors', async () => {
      server.use(
        rest.post('/cards', (req, res, ctx) => {
          return res.networkError('Connection failed');
        })
      );

      const { result } = renderHook(() => useAddCard(), { wrapper });

      const card: NewCardInput = {
        word: { base: 'test', forms: [] },
        posPrimary: 'n.',
        meaning: '測試',
        synonyms: [],
        antonyms: [],
        example: 'Test.',
        anchors: []
      };

      await act(async () => {
        try {
          await result.current.mutateAsync(card);
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);
    });

    test('should handle server errors with detailed error message', async () => {
      server.use(
        rest.post('/cards', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              ok: false,
              error: {
                code: 'SERVER_ERROR',
                message: 'Database connection failed'
              }
            } as ApiResponse<never>)
          );
        })
      );

      const { result } = renderHook(() => useAddCard(), { wrapper });

      const card: NewCardInput = {
        word: { base: 'test', forms: [] },
        posPrimary: 'n.',
        meaning: '測試',
        synonyms: [],
        antonyms: [],
        example: 'Test.',
        anchors: []
      };

      await act(async () => {
        try {
          await result.current.mutateAsync(card);
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    test('should show correct loading states during mutation', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      // Initial state
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      const card: NewCardInput = {
        word: { base: 'loading-test', forms: [] },
        posPrimary: 'n.',
        meaning: '載入測試',
        synonyms: [],
        antonyms: [],
        example: 'Loading test example.',
        anchors: []
      };

      // Start mutation
      const mutationPromise = act(async () => {
        return result.current.mutateAsync(card);
      });

      // Should be loading
      expect(result.current.isPending).toBe(true);

      await mutationPromise;

      // Should be complete
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isError).toBe(false);
    });

    test('should provide mutation data after successful submission', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const card: NewCardInput = {
        word: { base: 'data-test', forms: [] },
        posPrimary: 'n.',
        meaning: '資料測試',
        synonyms: [],
        antonyms: [],
        example: 'Data test example.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(card);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.id).toBeDefined();
      expect(result.current.data!.id).toMatch(/^card-/);
    });

    test('should reset state between mutations', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      // First mutation
      const card1: NewCardInput = {
        word: { base: 'reset-test-1', forms: [] },
        posPrimary: 'n.',
        meaning: '重置測試1',
        synonyms: [],
        antonyms: [],
        example: 'Reset test 1.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(card1);
      });

      expect(result.current.isSuccess).toBe(true);
      const firstId = result.current.data!.id;

      // Second mutation
      const card2: NewCardInput = {
        word: { base: 'reset-test-2', forms: [] },
        posPrimary: 'n.',
        meaning: '重置測試2',
        synonyms: [],
        antonyms: [],
        example: 'Reset test 2.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(card2);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data!.id).not.toBe(firstId); // Different ID
    });
  });

  describe('Cache Invalidation and Updates', () => {
    test('should invalidate due cards cache on successful addition', async () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn()
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={mockQueryClient as any}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAddCard(), { wrapper: customWrapper });

      const card: NewCardInput = {
        word: { base: 'cache-test', forms: [] },
        posPrimary: 'n.',
        meaning: '快取測試',
        synonyms: [],
        antonyms: [],
        example: 'Cache test.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(card);
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['cards', 'due']
      });
    });

    test('should not invalidate cache on failed addition', async () => {
      server.use(
        rest.post('/cards', (req, res, ctx) => {
          return res(ctx.status(400));
        })
      );

      const mockQueryClient = {
        invalidateQueries: vi.fn()
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={mockQueryClient as any}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useAddCard(), { wrapper: customWrapper });

      const card: NewCardInput = {
        word: { base: 'fail-test', forms: [] },
        posPrimary: 'n.',
        meaning: '失敗測試',
        synonyms: [],
        antonyms: [],
        example: 'Fail test.',
        anchors: []
      };

      await act(async () => {
        try {
          await result.current.mutateAsync(card);
        } catch (error) {
          // Expected to fail
        }
      });

      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    test('should support custom onSuccess callback', async () => {
      const onSuccessMock = vi.fn();

      const { result } = renderHook(() => useAddCard(), { wrapper });

      const card: NewCardInput = {
        word: { base: 'success-callback', forms: [] },
        posPrimary: 'n.',
        meaning: '成功回調',
        synonyms: [],
        antonyms: [],
        example: 'Success callback test.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(card, {
          onSuccess: onSuccessMock
        });
      });

      expect(onSuccessMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^card-/)
        }),
        card,
        expect.any(Object) // context
      );
    });

    test('should support custom onError callback', async () => {
      server.use(
        rest.post('/cards', (req, res, ctx) => {
          return res(ctx.status(400));
        })
      );

      const onErrorMock = vi.fn();

      const { result } = renderHook(() => useAddCard(), { wrapper });

      const card: NewCardInput = {
        word: { base: 'error-callback', forms: [] },
        posPrimary: 'n.',
        meaning: '錯誤回調',
        synonyms: [],
        antonyms: [],
        example: 'Error callback test.',
        anchors: []
      };

      await act(async () => {
        try {
          await result.current.mutateAsync(card, {
            onError: onErrorMock
          });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Object), // error
        card, // variables
        expect.any(Object) // context
      );
    });
  });

  describe('Data Structure Validation', () => {
    test('should handle complex word forms correctly', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const cardWithForms: NewCardInput = {
        word: { 
          base: 'complex', 
          forms: [
            { pos: 'adj.', form: 'complex' },
            { pos: 'n.', form: 'complexity' },
            { pos: 'v.', form: 'complicate' },
            { pos: 'adv.', form: 'complexly' }
          ] 
        },
        posPrimary: 'adj.',
        meaning: '複雜的',
        synonyms: ['complicated', 'intricate'],
        antonyms: ['simple', 'easy'],
        example: 'This is a complex problem.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(cardWithForms);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should handle Unicode characters in content', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const unicodeCard: NewCardInput = {
        word: { base: 'café', forms: [{ pos: 'n.', form: 'café' }] },
        posPrimary: 'n.',
        meaning: '咖啡廳，來自法語',
        synonyms: ['coffee shop', 'bistro'],
        antonyms: [],
        example: 'Let\'s meet at the café for coffee ☕',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(unicodeCard);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should handle long text content', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const longTextCard: NewCardInput = {
        word: { base: 'comprehensive', forms: [] },
        posPrimary: 'adj.',
        meaning: '全面的，綜合的，詳盡的，包含一切必要部分的',
        synonyms: ['complete', 'thorough', 'extensive', 'all-inclusive', 'wide-ranging'],
        antonyms: ['incomplete', 'partial', 'limited'],
        example: 'The comprehensive report covered all aspects of the environmental impact assessment, including detailed analysis of air quality, water pollution, soil contamination, and biodiversity effects.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(longTextCard);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should handle special characters in URLs', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const specialUrlCard: NewCardInput = {
        word: { base: 'url-test', forms: [] },
        posPrimary: 'n.',
        meaning: 'URL測試',
        synonyms: [],
        antonyms: [],
        example: 'Testing special URLs.',
        anchors: [
          {
            type: 'link',
            url: 'https://example.com/path?param=value&other=123#section',
            title: 'Complex URL'
          },
          {
            type: 'youtube',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
            title: 'YouTube with timestamp'
          }
        ]
      };

      await act(async () => {
        await result.current.mutateAsync(specialUrlCard);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very short word', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const shortCard: NewCardInput = {
        word: { base: 'a', forms: [{ pos: 'art.', form: 'a' }] },
        posPrimary: 'art.',
        meaning: '一個（不定冠詞）',
        synonyms: ['an'],
        antonyms: [],
        example: 'A cat is sleeping.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(shortCard);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should handle word with numbers', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const numberCard: NewCardInput = {
        word: { base: 'COVID-19', forms: [] },
        posPrimary: 'n.',
        meaning: '2019冠狀病毒病',
        synonyms: ['coronavirus disease'],
        antonyms: [],
        example: 'COVID-19 affected the world in 2020.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(numberCard);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should handle empty form arrays gracefully', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const noFormsCard: NewCardInput = {
        word: { base: 'unique', forms: [] }, // No forms provided
        posPrimary: 'adj.',
        meaning: '獨特的',
        synonyms: [],
        antonyms: [],
        example: 'This is unique.',
        anchors: []
      };

      await act(async () => {
        await result.current.mutateAsync(noFormsCard);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should not create new mutation function on every render', () => {
      const { result, rerender } = renderHook(() => useAddCard(), { wrapper });

      const firstMutate = result.current.mutate;
      const firstMutateAsync = result.current.mutateAsync;

      rerender();

      const secondMutate = result.current.mutate;
      const secondMutateAsync = result.current.mutateAsync;

      expect(firstMutate).toBe(secondMutate);
      expect(firstMutateAsync).toBe(secondMutateAsync);
    });

    test('should handle multiple rapid submissions', async () => {
      const { result } = renderHook(() => useAddCard(), { wrapper });

      const cards: NewCardInput[] = Array.from({ length: 5 }, (_, i) => ({
        word: { base: `rapid-${i}`, forms: [] },
        posPrimary: 'n.',
        meaning: `快速測試 ${i}`,
        synonyms: [],
        antonyms: [],
        example: `Rapid test ${i}.`,
        anchors: []
      }));

      const mutations = cards.map(card =>
        act(async () => {
          return result.current.mutateAsync(card);
        })
      );

      const results = await Promise.all(mutations);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.id).toBeDefined();
      });
    });

    test('should clean up properly on unmount', async () => {
      const { result, unmount } = renderHook(() => useAddCard(), { wrapper });

      const card: NewCardInput = {
        word: { base: 'cleanup-test', forms: [] },
        posPrimary: 'n.',
        meaning: '清理測試',
        synonyms: [],
        antonyms: [],
        example: 'Cleanup test.',
        anchors: []
      };

      // Start mutation
      const mutationPromise = act(async () => {
        return result.current.mutateAsync(card);
      });

      // Unmount before completion
      unmount();

      // Should not cause memory leaks
      await expect(mutationPromise).resolves.toBeDefined();
    });
  });
});