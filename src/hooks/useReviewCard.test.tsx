/**
 * useReviewCard Hook Tests
 * 
 * 根據 TDD 原則，這些測試必須在實作前完成
 * 定義了 useReviewCard hook 的完整行為規格
 * 
 * 測試涵蓋：
 * 1. 基本複習評分功能
 * 2. 樂觀更新與錯誤處理
 * 3. Cache 失效與同步
 * 4. Loading 狀態管理
 * 5. 重試機制
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { createTestCard } from '../../test/utils/testHelpers';
import { Quality, ReviewResponse, ApiResponse } from '../types';

// 這個 hook 必須在 src/hooks/useReviewCard.ts 中實作
import { useReviewCard } from './useReviewCard';

// Mock server setup
const server = setupServer(
  rest.patch('/cards/:id/review', (req, res, ctx) => {
    const { id } = req.params;
    const body = req.json() as { quality: Quality; algorithm?: string };
    
    // Simulate SRS calculation
    const mockResponse: ReviewResponse = {
      ok: true,
      nextReviewAt: '2025-08-28T00:00:00Z',
      interval: body.quality === 1 ? 1 : body.quality === 2 ? 2 : 4,
      box: body.quality === 1 ? 1 : 2,
      ease: body.quality === 1 ? 2.3 : 2.5,
      reps: 1
    };
    
    return res(ctx.json(mockResponse));
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

describe('useReviewCard Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Basic Functionality', () => {
    test('should submit review with quality 1 (hard)', async () => {
      const { result } = renderHook(() => useReviewCard(), { wrapper });

      const reviewData = { id: 'test-card-1', quality: 1 as Quality };
      let response: ReviewResponse | undefined;

      await act(async () => {
        response = await result.current.mutateAsync(reviewData);
      });

      expect(response).toBeDefined();
      expect(response!.ok).toBe(true);
      expect(response!.nextReviewAt).toBe('2025-08-28T00:00:00Z');
      expect(response!.interval).toBe(1); // Hard should have short interval
      expect(response!.box).toBe(1);
    });

    test('should submit review with quality 2 (medium)', async () => {
      const { result } = renderHook(() => useReviewCard(), { wrapper });

      const reviewData = { id: 'test-card-2', quality: 2 as Quality };
      let response: ReviewResponse | undefined;

      await act(async () => {
        response = await result.current.mutateAsync(reviewData);
      });

      expect(response!.interval).toBe(2); // Medium should have moderate interval
      expect(response!.box).toBe(2);
    });

    test('should submit review with quality 3 (easy)', async () => {
      const { result } = renderHook(() => useReviewCard(), { wrapper });

      const reviewData = { id: 'test-card-3', quality: 3 as Quality };
      let response: ReviewResponse | undefined;

      await act(async () => {
        response = await result.current.mutateAsync(reviewData);
      });

      expect(response!.interval).toBe(4); // Easy should have longer interval
      expect(response!.box).toBe(2);
    });

    test('should support algorithm parameter', async () => {
      server.use(
        rest.patch('/cards/:id/review', async (req, res, ctx) => {
          const body = await req.json();
          expect(body.algorithm).toBe('sm2');
          
          return res(ctx.json({
            ok: true,
            nextReviewAt: '2025-08-30T00:00:00Z',
            interval: 6,
            box: 1,
            ease: 2.6,
            reps: 2
          } as ReviewResponse));
        })
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'test-card',
          quality: 3,
          algorithm: 'sm2'
        });
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should default to leitner algorithm when not specified', async () => {
      server.use(
        rest.patch('/cards/:id/review', async (req, res, ctx) => {
          const body = await req.json();
          expect(body.algorithm).toBe('leitner'); // Should default to leitner
          
          return res(ctx.json({
            ok: true,
            nextReviewAt: '2025-08-28T00:00:00Z',
            interval: 2,
            box: 2,
            ease: 2.5,
            reps: 1
          } as ReviewResponse));
        })
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'test-card',
          quality: 2
          // algorithm not specified
        });
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Loading and Status Management', () => {
    test('should show correct loading states during mutation', async () => {
      const { result } = renderHook(() => useReviewCard(), { wrapper });

      // Initial state
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      // Start mutation
      const mutationPromise = act(async () => {
        return result.current.mutateAsync({ id: 'test', quality: 2 });
      });

      // Should be loading
      expect(result.current.isPending).toBe(true);

      await mutationPromise;

      // Should be complete
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isError).toBe(false);
    });

    test('should provide mutation result data', async () => {
      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ id: 'test', quality: 3 });
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data!.nextReviewAt).toBe('2025-08-28T00:00:00Z');
      expect(result.current.data!.interval).toBe(4);
    });

    test('should reset state between mutations', async () => {
      const { result } = renderHook(() => useReviewCard(), { wrapper });

      // First mutation
      await act(async () => {
        await result.current.mutateAsync({ id: 'test1', quality: 1 });
      });

      expect(result.current.isSuccess).toBe(true);
      const firstData = result.current.data;

      // Second mutation
      await act(async () => {
        await result.current.mutateAsync({ id: 'test2', quality: 3 });
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).not.toBe(firstData);
      expect(result.current.data!.interval).toBe(4); // Different from first
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          return res.networkError('Connection failed');
        })
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 'test', quality: 2 });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    test('should handle API error responses', async () => {
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({
              ok: false,
              error: {
                code: 'CARD_NOT_FOUND',
                message: 'Card not found'
              }
            } as ApiResponse<never>)
          );
        })
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 'nonexistent', quality: 2 });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });

    test('should handle validation errors', async () => {
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              ok: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid quality value'
              }
            } as ApiResponse<never>)
          );
        })
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 'test', quality: 0 as Quality });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isError).toBe(true);
    });

    test('should handle server errors with retry', async () => {
      let attemptCount = 0;
      
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          attemptCount++;
          
          if (attemptCount === 1) {
            return res(
              ctx.status(500),
              ctx.json({
                ok: false,
                error: {
                  code: 'SERVER_ERROR',
                  message: 'Temporary server error'
                }
              })
            );
          }
          
          // Success on retry
          return res(ctx.json({
            ok: true,
            nextReviewAt: '2025-08-28T00:00:00Z',
            interval: 2,
            box: 2,
            ease: 2.5,
            reps: 1
          } as ReviewResponse));
        })
      );

      // Override wrapper to allow retry
      const retryWrapper = () => {
        const queryClient = new QueryClient({
          defaultOptions: {
            mutations: {
              retry: 1, // Allow 1 retry
            },
          },
        });

        return ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
      };

      const { result } = renderHook(() => useReviewCard(), { wrapper: retryWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ id: 'test', quality: 2 });
      });

      expect(attemptCount).toBe(2);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Cache Invalidation', () => {
    test('should invalidate due cards cache on successful review', async () => {
      const mockQueryClient = {
        invalidateQueries: vi.fn()
      };

      // Mock the query client
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={mockQueryClient as any}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper: customWrapper });

      await act(async () => {
        await result.current.mutateAsync({ id: 'test', quality: 2 });
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['cards', 'due']
      });
    });

    test('should not invalidate cache on failed review', async () => {
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          return res(ctx.status(500));
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

      const { result } = renderHook(() => useReviewCard(), { wrapper: customWrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 'test', quality: 2 });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    test('should support custom onSuccess callback', async () => {
      const onSuccessMock = vi.fn();

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(
          { id: 'test', quality: 3 },
          { onSuccess: onSuccessMock }
        );
      });

      expect(onSuccessMock).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          interval: 4
        }),
        { id: 'test', quality: 3 },
        expect.any(Object) // context
      );
    });

    test('should support custom onError callback', async () => {
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          return res(ctx.status(400));
        })
      );

      const onErrorMock = vi.fn();

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(
            { id: 'test', quality: 2 },
            { onError: onErrorMock }
          );
        } catch (error) {
          // Expected to fail
        }
      });

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Object), // error
        { id: 'test', quality: 2 }, // variables
        expect.any(Object) // context
      );
    });
  });

  describe('Optimistic Updates', () => {
    test('should support optimistic updates for immediate UI feedback', async () => {
      // This test ensures the hook can handle optimistic updates
      // The actual optimistic logic might be implemented in the component layer
      
      let serverCallMade = false;
      
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          serverCallMade = true;
          return res(
            ctx.delay(100), // Slow response
            ctx.json({
              ok: true,
              nextReviewAt: '2025-08-29T00:00:00Z',
              interval: 3,
              box: 2,
              ease: 2.5,
              reps: 1
            } as ReviewResponse)
          );
        })
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      // Start mutation
      const mutationPromise = act(async () => {
        return result.current.mutateAsync({ id: 'test', quality: 2 });
      });

      // Should be pending immediately
      expect(result.current.isPending).toBe(true);
      expect(serverCallMade).toBe(false);

      await mutationPromise;

      expect(serverCallMade).toBe(true);
      expect(result.current.isSuccess).toBe(true);
    });

    test('should handle optimistic update rollback on error', async () => {
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          return res(
            ctx.delay(50),
            ctx.status(500)
          );
        })
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 'test', quality: 2 });
        } catch (error) {
          // Expected to fail
        }
      });

      // Should be in error state, not success
      expect(result.current.isError).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should handle invalid card ID', async () => {
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          const { id } = req.params;
          
          if (id === 'invalid-id') {
            return res(
              ctx.status(404),
              ctx.json({
                ok: false,
                error: { code: 'NOT_FOUND', message: 'Card not found' }
              })
            );
          }
          
          return res(ctx.json({ ok: true } as ReviewResponse));
        })
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 'invalid-id', quality: 2 });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);
    });

    test('should handle quality boundary values', async () => {
      const { result } = renderHook(() => useReviewCard(), { wrapper });

      // Test all valid quality values
      const qualityValues: Quality[] = [1, 2, 3];
      
      for (const quality of qualityValues) {
        await act(async () => {
          await result.current.mutateAsync({ id: `test-${quality}`, quality });
        });

        expect(result.current.isSuccess).toBe(true);
        
        // Reset mutation state
        result.current.reset();
      }
    });

    test('should handle malformed response from server', async () => {
      server.use(
        rest.patch('/cards/:id/review', (req, res, ctx) => {
          return res(ctx.text('Not JSON'));
        })
      );

      const { result } = renderHook(() => useReviewCard(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 'test', quality: 2 });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);
    });

    test('should handle concurrent mutations', async () => {
      const { result } = renderHook(() => useReviewCard(), { wrapper });

      // Start two mutations concurrently
      const mutation1 = act(async () => {
        return result.current.mutateAsync({ id: 'test1', quality: 1 });
      });

      const mutation2 = act(async () => {
        return result.current.mutateAsync({ id: 'test2', quality: 3 });
      });

      // Both should complete successfully
      const [result1, result2] = await Promise.all([mutation1, mutation2]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should not create new mutation function on every render', () => {
      const { result, rerender } = renderHook(() => useReviewCard(), { wrapper });

      const firstMutate = result.current.mutate;
      const firstMutateAsync = result.current.mutateAsync;

      rerender();

      const secondMutate = result.current.mutate;
      const secondMutateAsync = result.current.mutateAsync;

      expect(firstMutate).toBe(secondMutate);
      expect(firstMutateAsync).toBe(secondMutateAsync);
    });

    test('should handle rapid successive mutations', async () => {
      const { result } = renderHook(() => useReviewCard(), { wrapper });

      const mutations = [];
      
      // Submit 5 rapid mutations
      for (let i = 1; i <= 5; i++) {
        mutations.push(
          act(async () => {
            return result.current.mutateAsync({ id: `rapid-${i}`, quality: 2 });
          })
        );
      }

      const results = await Promise.all(mutations);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.ok).toBe(true);
      });
    });
  });
});