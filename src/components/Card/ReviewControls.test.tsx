/**
 * ReviewControls Component Tests
 * 
 * 根據 TDD 原則，這些測試必須在實作前完成
 * 定義了 ReviewControls 組件的完整行為規格
 * 
 * 測試涵蓋：
 * 1. 三個評分按鈕的渲染與行為
 * 2. 鍵盤快捷鍵 (1, 2, 3)
 * 3. Loading/Disabled 狀態
 * 4. 無障礙支援
 * 5. 非同步操作處理
 */

import React from 'react';
import { describe, test, expect, vi } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Quality } from '../../types';

// 這個組件必須在 src/components/Card/ReviewControls.tsx 中實作
import ReviewControls from './ReviewControls';

describe('ReviewControls Component', () => {
  let mockOnRate: jest.MockedFunction<(quality: Quality) => Promise<void>>;

  beforeEach(() => {
    mockOnRate = vi.fn().mockResolvedValue(undefined);
  });

  describe('Initial Render', () => {
    test('should render three quality rating buttons', () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      // Should have all three buttons
      const hardButton = screen.getByRole('button', { name: /困難|1|hard/i });
      const mediumButton = screen.getByRole('button', { name: /普通|2|medium|normal/i });
      const easyButton = screen.getByRole('button', { name: /容易|3|easy/i });
      
      expect(hardButton).toBeInTheDocument();
      expect(mediumButton).toBeInTheDocument();
      expect(easyButton).toBeInTheDocument();
      
      // All buttons should be enabled by default
      expect(hardButton).toBeEnabled();
      expect(mediumButton).toBeEnabled();
      expect(easyButton).toBeEnabled();
    });

    test('should have proper button styling and identification', () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const hardButton = screen.getByTestId('quality-1');
      const mediumButton = screen.getByTestId('quality-2');
      const easyButton = screen.getByTestId('quality-3');
      
      expect(hardButton).toHaveClass('quality-button', 'quality-hard');
      expect(mediumButton).toHaveClass('quality-button', 'quality-medium');
      expect(easyButton).toHaveClass('quality-button', 'quality-easy');
    });

    test('should display quality labels and shortcuts', () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      // Should show quality descriptions and keyboard shortcuts
      expect(screen.getByText(/困難/)).toBeInTheDocument();
      expect(screen.getByText(/普通/)).toBeInTheDocument();
      expect(screen.getByText(/容易/)).toBeInTheDocument();
      
      // Keyboard shortcuts should be visible
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Button Click Interactions', () => {
    test('should call onRate with quality 1 when hard button is clicked', async () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const hardButton = screen.getByTestId('quality-1');
      fireEvent.click(hardButton);
      
      expect(mockOnRate).toHaveBeenCalledTimes(1);
      expect(mockOnRate).toHaveBeenCalledWith(1);
    });

    test('should call onRate with quality 2 when medium button is clicked', async () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const mediumButton = screen.getByTestId('quality-2');
      fireEvent.click(mediumButton);
      
      expect(mockOnRate).toHaveBeenCalledTimes(1);
      expect(mockOnRate).toHaveBeenCalledWith(2);
    });

    test('should call onRate with quality 3 when easy button is clicked', async () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const easyButton = screen.getByTestId('quality-3');
      fireEvent.click(easyButton);
      
      expect(mockOnRate).toHaveBeenCalledTimes(1);
      expect(mockOnRate).toHaveBeenCalledWith(3);
    });

    test('should handle rapid clicks without double-calling', async () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const hardButton = screen.getByTestId('quality-1');
      
      // Rapid clicks
      fireEvent.click(hardButton);
      fireEvent.click(hardButton);
      fireEvent.click(hardButton);
      
      // Should only register one click (button should be disabled during processing)
      await waitFor(() => {
        expect(mockOnRate).toHaveBeenCalledTimes(1);
      });
    });

    test('should handle async onRate function correctly', async () => {
      let resolvePromise: () => void;
      const slowOnRate = vi.fn(() => {
        return new Promise<void>((resolve) => {
          resolvePromise = resolve;
        });
      });

      render(<ReviewControls onRate={slowOnRate} />);
      
      const hardButton = screen.getByTestId('quality-1');
      fireEvent.click(hardButton);
      
      // Should be called immediately
      expect(slowOnRate).toHaveBeenCalledWith(1);
      
      // Button should be disabled while processing
      expect(hardButton).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!();
      
      // Button should be enabled again
      await waitFor(() => {
        expect(hardButton).toBeEnabled();
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should respond to number key 1 for hard', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      // Focus on the component
      const container = screen.getByTestId('review-controls');
      container.focus();
      
      await user.keyboard('1');
      
      expect(mockOnRate).toHaveBeenCalledWith(1);
    });

    test('should respond to number key 2 for medium', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      const container = screen.getByTestId('review-controls');
      container.focus();
      
      await user.keyboard('2');
      
      expect(mockOnRate).toHaveBeenCalledWith(2);
    });

    test('should respond to number key 3 for easy', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      const container = screen.getByTestId('review-controls');
      container.focus();
      
      await user.keyboard('3');
      
      expect(mockOnRate).toHaveBeenCalledWith(3);
    });

    test('should ignore other number keys', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      const container = screen.getByTestId('review-controls');
      container.focus();
      
      await user.keyboard('4567890');
      
      expect(mockOnRate).not.toHaveBeenCalled();
    });

    test('should ignore non-number keys', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      const container = screen.getByTestId('review-controls');
      container.focus();
      
      await user.keyboard('abc{Enter}{Space}');
      
      expect(mockOnRate).not.toHaveBeenCalled();
    });

    test('should work with keyboard when buttons are focused', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      // Focus on specific button and press Enter or Space
      const mediumButton = screen.getByTestId('quality-2');
      mediumButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockOnRate).toHaveBeenCalledWith(2);
    });
  });

  describe('Busy/Loading State', () => {
    test('should disable all buttons when busy=true', () => {
      render(<ReviewControls onRate={mockOnRate} busy={true} />);
      
      const hardButton = screen.getByTestId('quality-1');
      const mediumButton = screen.getByTestId('quality-2');
      const easyButton = screen.getByTestId('quality-3');
      
      expect(hardButton).toBeDisabled();
      expect(mediumButton).toBeDisabled();
      expect(easyButton).toBeDisabled();
    });

    test('should show loading indicators when busy', () => {
      render(<ReviewControls onRate={mockOnRate} busy={true} />);
      
      const loadingIndicator = screen.queryByTestId('loading-indicator');
      expect(loadingIndicator).toBeInTheDocument();
    });

    test('should prevent keyboard shortcuts when busy', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} busy={true} />);
      
      const container = screen.getByTestId('review-controls');
      container.focus();
      
      await user.keyboard('123');
      
      expect(mockOnRate).not.toHaveBeenCalled();
    });

    test('should show proper ARIA states when busy', () => {
      render(<ReviewControls onRate={mockOnRate} busy={true} />);
      
      const container = screen.getByTestId('review-controls');
      expect(container).toHaveAttribute('aria-busy', 'true');
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-disabled', 'true');
      });
    });

    test('should transition from busy to ready state', async () => {
      const { rerender } = render(<ReviewControls onRate={mockOnRate} busy={true} />);
      
      const hardButton = screen.getByTestId('quality-1');
      expect(hardButton).toBeDisabled();
      
      rerender(<ReviewControls onRate={mockOnRate} busy={false} />);
      
      expect(hardButton).toBeEnabled();
    });
  });

  describe('Error Handling', () => {
    test('should handle onRate rejection gracefully', async () => {
      const failingOnRate = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<ReviewControls onRate={failingOnRate} />);
      
      const hardButton = screen.getByTestId('quality-1');
      fireEvent.click(hardButton);
      
      await waitFor(() => {
        expect(failingOnRate).toHaveBeenCalled();
      });
      
      // Should show error state or remain enabled for retry
      await waitFor(() => {
        expect(hardButton).toBeEnabled();
      });
      
      // Should show error message
      const errorMessage = screen.queryByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });

    test('should allow retry after error', async () => {
      const onRateWithRetry = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce(undefined);
        
      render(<ReviewControls onRate={onRateWithRetry} />);
      
      const hardButton = screen.getByTestId('quality-1');
      
      // First attempt fails
      fireEvent.click(hardButton);
      
      await waitFor(() => {
        expect(hardButton).toBeEnabled();
      });
      
      // Second attempt succeeds
      fireEvent.click(hardButton);
      
      await waitFor(() => {
        expect(onRateWithRetry).toHaveBeenCalledTimes(2);
      });
    });

    test('should clear error state on successful retry', async () => {
      const onRateWithRetry = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
        
      render(<ReviewControls onRate={onRateWithRetry} />);
      
      const hardButton = screen.getByTestId('quality-1');
      
      // First click fails
      fireEvent.click(hardButton);
      
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });
      
      // Second click succeeds
      fireEvent.click(hardButton);
      
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('error-message');
        expect(errorMessage).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const hardButton = screen.getByTestId('quality-1');
      const mediumButton = screen.getByTestId('quality-2');
      const easyButton = screen.getByTestId('quality-3');
      
      expect(hardButton).toHaveAttribute('aria-label', expect.stringContaining('困難'));
      expect(mediumButton).toHaveAttribute('aria-label', expect.stringContaining('普通'));
      expect(easyButton).toHaveAttribute('aria-label', expect.stringContaining('容易'));
    });

    test('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      // Tab through buttons
      await user.tab();
      expect(screen.getByTestId('quality-1')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('quality-2')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('quality-3')).toHaveFocus();
    });

    test('should have proper role and group labeling', () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const container = screen.getByTestId('review-controls');
      expect(container).toHaveAttribute('role', 'group');
      expect(container).toHaveAttribute('aria-label', expect.stringContaining('複習評分'));
    });

    test('should announce loading state to screen readers', () => {
      render(<ReviewControls onRate={mockOnRate} busy={true} />);
      
      const statusElement = screen.queryByRole('status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveTextContent(/處理中|loading/i);
    });

    test('should have high contrast colors for buttons', () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const hardButton = screen.getByTestId('quality-1');
      const mediumButton = screen.getByTestId('quality-2');
      const easyButton = screen.getByTestId('quality-3');
      
      // Should have distinct colors with sufficient contrast
      const hardStyle = getComputedStyle(hardButton);
      const mediumStyle = getComputedStyle(mediumButton);
      const easyStyle = getComputedStyle(easyButton);
      
      expect(hardStyle.backgroundColor).toBeDefined();
      expect(mediumStyle.backgroundColor).toBeDefined();
      expect(easyStyle.backgroundColor).toBeDefined();
      
      // Colors should be different
      expect(hardStyle.backgroundColor).not.toBe(mediumStyle.backgroundColor);
      expect(mediumStyle.backgroundColor).not.toBe(easyStyle.backgroundColor);
    });
  });

  describe('Visual Design', () => {
    test('should have proper button layouts and spacing', () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const container = screen.getByTestId('review-controls');
      expect(container).toHaveClass('review-controls-container');
      
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(3);
      
      // Should be displayed in a row or proper grid
      buttons.forEach(button => {
        expect(button).toHaveClass('quality-button');
      });
    });

    test('should show different visual states for different qualities', () => {
      render(<ReviewControls onRate={mockOnRate} />);
      
      const hardButton = screen.getByTestId('quality-1');
      const mediumButton = screen.getByTestId('quality-2');
      const easyButton = screen.getByTestId('quality-3');
      
      // Should have distinct visual styles
      expect(hardButton).toHaveClass('quality-hard');
      expect(mediumButton).toHaveClass('quality-medium');
      expect(easyButton).toHaveClass('quality-easy');
    });

    test('should have hover states for interactive feedback', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      const hardButton = screen.getByTestId('quality-1');
      
      await user.hover(hardButton);
      
      // Should have hover styling
      expect(hardButton).toHaveClass('hover:scale-105'); // Example Tailwind hover class
    });

    test('should have focus states for keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      await user.tab();
      
      const focusedButton = screen.getByTestId('quality-1');
      expect(focusedButton).toHaveFocus();
      expect(focusedButton).toHaveClass('focus:ring-2'); // Focus ring styling
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const { rerender } = render(<ReviewControls onRate={mockOnRate} />);
      
      const initialButton = screen.getByTestId('quality-1');
      
      // Re-render with same props
      rerender(<ReviewControls onRate={mockOnRate} />);
      
      // Should be same element (React.memo optimization)
      expect(screen.getByTestId('quality-1')).toBe(initialButton);
    });

    test('should handle rapid interactions efficiently', async () => {
      const user = userEvent.setup();
      render(<ReviewControls onRate={mockOnRate} />);
      
      const startTime = performance.now();
      
      // Rapid keyboard interactions
      const container = screen.getByTestId('review-controls');
      container.focus();
      
      for (let i = 0; i < 10; i++) {
        await user.keyboard('1');
      }
      
      const endTime = performance.now();
      
      // Should complete quickly (< 50ms)
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Props Validation', () => {
    test('should handle missing onRate prop gracefully', () => {
      // This should show TypeScript error, but shouldn't crash at runtime
      expect(() => {
        render(<ReviewControls onRate={undefined as any} />);
      }).toThrow();
    });

    test('should handle boolean busy prop correctly', () => {
      const { rerender } = render(<ReviewControls onRate={mockOnRate} busy={false} />);
      
      expect(screen.getByTestId('quality-1')).toBeEnabled();
      
      rerender(<ReviewControls onRate={mockOnRate} busy={true} />);
      
      expect(screen.getByTestId('quality-1')).toBeDisabled();
      
      rerender(<ReviewControls onRate={mockOnRate} busy={undefined} />);
      
      expect(screen.getByTestId('quality-1')).toBeEnabled(); // Should default to false
    });
  });
});