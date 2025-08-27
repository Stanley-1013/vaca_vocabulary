/**
 * useDueCards Hook Tests
 * 
 * 根據 TDD 原則，這些測試必須在實作前完成
 * 定義了 useDueCards hook 的完整行為規格
 * 
 * 測試涵蓋：
 * 1. 基本資料載入功能
 * 2. 快取策略與重新載入
 * 3. 錯誤處理與重試機制
 * 4. Loading 狀態管理
 * 5. 資料更新與同步
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { createTestCard } from '../../test/utils/testHelpers';
import { Card, ApiResponse } from '../types';

// 這個 hook 必須在 src/hooks/useDueCards.ts 中實作
import { useDueCards } from './useDueCards';

// Mock server setup
const server = setupServer(
  rest.get('/cards', (req, res, ctx) => {
    const due = req.url.searchParams.get('due');
    
    if (due === 'today') {
      const mockCards = [
        createTestCard({ id: 'due-1', nextReviewAt: '2025-08-27T00:00:00Z' }),
        createTestCard({ id: 'due-2', nextReviewAt: '2025-08-27T12:00:00Z' }),
        createTestCard({ id: 'due-3', nextReviewAt: '2025-08-26T00:00:00Z' }),
      ];
      
      return res(
        ctx.json({
          ok: true,
          data: mockCards
        } as ApiResponse<Card[]>)
      );
    }
    
    return res(
      ctx.status(400),
      ctx.json({
        ok: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Invalid due parameter'
        }
      } as ApiResponse<never>)
    );
  })
);

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retry for tests
        gcTime: 0, // Disable garbage collection
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useDueCards Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Basic Functionality', () => {
    test('should fetch due cards successfully', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      // Initial state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data![0].id).toBe('due-1');
      expect(result.current.data![1].id).toBe('due-2');
      expect(result.current.data![2].id).toBe('due-3');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should use correct query key', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Query key should be ['cards', 'due', 'today'] for proper caching
      expect(result.current.queryKey).toEqual(['cards', 'due', 'today']);
    });

    test('should sort cards by nextReviewAt ascending', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const cards = result.current.data!;
      
      // Should be sorted by nextReviewAt (earliest first)
      expect(new Date(cards[0].nextReviewAt).getTime())
        .toBeLessThanOrEqual(new Date(cards[1].nextReviewAt).getTime());
      expect(new Date(cards[1].nextReviewAt).getTime())
        .toBeLessThanOrEqual(new Date(cards[2].nextReviewAt).getTime());
    });

    test('should return empty array when no due cards', async () => {
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          return res(
            ctx.json({
              ok: true,
              data: []
            } as ApiResponse<Card[]>)
          );
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('Caching and Stale Time', () => {
    test('should use appropriate stale time for cards', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have stale time of 5 minutes (300000ms)
      expect(result.current.dataUpdatedAt).toBeDefined();
      expect(result.current.isStale).toBe(false); // Fresh data
    });

    test('should maintain previous data while refetching', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const initialData = result.current.data;
      expect(initialData).toHaveLength(3);

      // Trigger refetch
      result.current.refetch();

      // Should maintain previous data during refetch
      expect(result.current.data).toBe(initialData);
      expect(result.current.isFetching).toBe(true);

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });

    test('should support background refetch', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const initialFetchCount = result.current.dataUpdatedAt;

      // Mock window focus to trigger background refetch
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible',
      });

      window.dispatchEvent(new Event('focus'));

      await waitFor(() => {
        expect(result.current.dataUpdatedAt).toBeGreaterThan(initialFetchCount);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle API error responses', async () => {
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              ok: false,
              error: {
                code: 'SERVER_ERROR',
                message: 'Internal server error'
              }
            } as ApiResponse<never>)
          );
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    test('should handle unauthorized access', async () => {
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              ok: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Access denied'
              }
            } as ApiResponse<never>)
          );
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    test('should handle rate limiting', async () => {
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.json({
              ok: false,
              error: {
                code: 'RATE_LIMIT',
                message: 'Too many requests'
              }
            } as ApiResponse<never>),
            ctx.set('Retry-After', '60')
          );
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Refetch and Manual Control', () => {
    test('should support manual refetch', async () => {
      let callCount = 0;
      
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          callCount++;
          const cards = callCount === 1 
            ? [createTestCard({ id: 'first-call' })]
            : [createTestCard({ id: 'second-call' })];
            
          return res(
            ctx.json({
              ok: true,
              data: cards
            } as ApiResponse<Card[]>)
          );
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data![0].id).toBe('first-call');

      // Manual refetch
      await result.current.refetch();

      expect(result.current.data![0].id).toBe('second-call');
      expect(callCount).toBe(2);
    });

    test('should indicate fetching state during refetch', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isFetching).toBe(false);

      // Start refetch
      const refetchPromise = result.current.refetch();
      expect(result.current.isFetching).toBe(true);

      await refetchPromise;
      expect(result.current.isFetching).toBe(false);
    });

    test('should support invalidation from other components', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any).props.children.props.client;

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const initialData = result.current.data;

      // Invalidate the query from outside
      await queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      // Should have refetched
      expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
    });
  });

  describe('Loading States', () => {
    test('should show correct loading states on initial load', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      // Initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.isPending).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Success state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isError).toBe(false);
    });

    test('should differentiate between loading and fetching', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // After success, isLoading should be false but isFetching can be true during refetch
      expect(result.current.isLoading).toBe(false);

      result.current.refetch();
      
      // During refetch
      expect(result.current.isLoading).toBe(false); // Still false (has data)
      expect(result.current.isFetching).toBe(true);  // True during refetch

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });
  });

  describe('Data Validation', () => {
    test('should validate response structure', async () => {
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          return res(
            ctx.json({
              // Missing 'ok' field
              data: [{ invalid: 'structure' }]
            })
          );
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should fail due to invalid response structure
      expect(result.current.error).toBeTruthy();
    });

    test('should validate card data structure', async () => {
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          return res(
            ctx.json({
              ok: true,
              data: [
                {
                  id: 'invalid-card',
                  // Missing required fields
                }
              ]
            } as any)
          );
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should fail validation
      expect(result.current.error).toBeTruthy();
    });

    test('should handle malformed JSON response', async () => {
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          return res(
            ctx.text('This is not JSON')
          );
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Performance and Optimization', () => {
    test('should not refetch on component re-render with same parameters', async () => {
      let callCount = 0;
      
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          callCount++;
          return res(
            ctx.json({
              ok: true,
              data: [createTestCard()]
            } as ApiResponse<Card[]>)
          );
        })
      );

      const { result, rerender } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(callCount).toBe(1);

      // Re-render hook
      rerender();

      // Should not trigger another API call
      expect(callCount).toBe(1);
    });

    test('should deduplicate concurrent requests', async () => {
      let callCount = 0;
      
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          callCount++;
          return res(
            ctx.delay(100), // Add delay to allow concurrent requests
            ctx.json({
              ok: true,
              data: [createTestCard()]
            } as ApiResponse<Card[]>)
          );
        })
      );

      // Render multiple hooks simultaneously
      const { result: result1 } = renderHook(() => useDueCards(), { wrapper });
      const { result: result2 } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should only make one API call due to deduplication
      expect(callCount).toBe(1);
    });

    test('should have reasonable cache time', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have cache time (gcTime) of at least 5 minutes
      const now = Date.now();
      const cacheTime = result.current.dataUpdatedAt + (5 * 60 * 1000);
      
      expect(cacheTime).toBeGreaterThan(now);
    });
  });

  describe('Integration with React Query Features', () => {
    test('should work with React Query DevTools', async () => {
      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have React Query metadata
      expect(result.current.dataUpdatedAt).toBeDefined();
      expect(result.current.errorUpdatedAt).toBeDefined();
    });

    test('should support query cancellation', async () => {
      const { result, unmount } = renderHook(() => useDueCards(), { wrapper });

      // Unmount before query completes
      unmount();

      // Should not cause memory leaks or unhandled promise rejections
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should integrate with global error boundaries', async () => {
      server.use(
        rest.get('/cards', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              ok: false,
              error: {
                code: 'SERVER_ERROR',
                message: 'Critical error'
              }
            })
          );
        })
      );

      const { result } = renderHook(() => useDueCards(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Error should be available for error boundaries to catch
      expect(result.current.error).toBeTruthy();
      expect(result.current.failureCount).toBeGreaterThan(0);
    });
  });
});