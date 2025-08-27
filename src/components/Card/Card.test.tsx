/**
 * Card Component Tests
 * 
 * 根據 TDD 原則，這些測試必須在 Card.tsx 實作前完成
 * 測試定義了 Card 組件的完整行為規格
 * 
 * 測試涵蓋：
 * 1. 三面導航 (Front/Meaning/Example)
 * 2. 鍵盤快捷鍵
 * 3. 狀態管理
 * 4. Props 傳遞與事件觸發
 * 5. 無障礙支援
 */

import React from 'react';
import { describe, test, expect, beforeEach, vi } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestCard, createTestAnchor } from '../../../test/utils/testHelpers';
import { Card, Face } from '../../types';

// 這個組件必須在 src/components/Card/Card.tsx 中實作
import Card from './Card';

describe('Card Component', () => {
  let mockCard: Card;
  let mockOnFlip: jest.MockedFunction<() => void>;
  let mockOnNext: jest.MockedFunction<() => void>;

  beforeEach(() => {
    mockCard = createTestCard({
      id: 'test-card',
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
      anchors: [createTestAnchor({
        type: 'image',
        url: 'https://example.com/smartphone.jpg',
        title: 'smartphone'
      })],
    });

    mockOnFlip = vi.fn();
    mockOnNext = vi.fn();
  });

  describe('Initial Render', () => {
    test('should render card container with proper structure', () => {
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      expect(cardContainer).toBeInTheDocument();
      expect(cardContainer).toHaveAttribute('role', 'region');
      expect(cardContainer).toHaveAttribute('aria-label', expect.stringContaining('Card'));
    });

    test('should display Front face by default', () => {
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      // Front face should be visible
      expect(screen.getByTestId('card-face-front')).toBeInTheDocument();
      expect(screen.getByText('ubiquitous')).toBeInTheDocument();
      expect(screen.getByText('adj.')).toBeInTheDocument();
      
      // Other faces should not be visible
      expect(screen.queryByTestId('card-face-meaning')).not.toBeInTheDocument();
      expect(screen.queryByTestId('card-face-example')).not.toBeInTheDocument();
    });

    test('should have keyboard focus capability', () => {
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      expect(cardContainer).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Face Navigation - Keyboard', () => {
    test('should switch to Meaning face on ArrowRight', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      await user.keyboard('{ArrowRight}');
      
      // Should show Meaning face
      expect(screen.getByTestId('card-face-meaning')).toBeInTheDocument();
      expect(screen.getByText('無所不在的，普遍存在的')).toBeInTheDocument();
      expect(screen.getByText('omnipresent')).toBeInTheDocument();
      
      // Front face should be hidden
      expect(screen.queryByTestId('card-face-front')).not.toBeInTheDocument();
    });

    test('should switch to Example face on second ArrowRight', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      // Go to Meaning face first
      await user.keyboard('{ArrowRight}');
      expect(screen.getByTestId('card-face-meaning')).toBeInTheDocument();
      
      // Then to Example face
      await user.keyboard('{ArrowRight}');
      expect(screen.getByTestId('card-face-example')).toBeInTheDocument();
      expect(screen.getByText('Smartphones have become ubiquitous in modern society.')).toBeInTheDocument();
    });

    test('should wrap around to Front face after Example face', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      // Navigate: Front -> Meaning -> Example -> Front
      await user.keyboard('{ArrowRight}'); // to Meaning
      await user.keyboard('{ArrowRight}'); // to Example
      await user.keyboard('{ArrowRight}'); // back to Front
      
      expect(screen.getByTestId('card-face-front')).toBeInTheDocument();
      expect(screen.getByText('ubiquitous')).toBeInTheDocument();
    });

    test('should go backwards with ArrowLeft', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      // Start at Front, go to Example (backwards)
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByTestId('card-face-example')).toBeInTheDocument();
      
      // Go to Meaning (backwards)
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByTestId('card-face-meaning')).toBeInTheDocument();
      
      // Back to Front
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByTestId('card-face-front')).toBeInTheDocument();
    });

    test('should cycle through faces with Space key', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      // Front -> Meaning
      await user.keyboard(' ');
      expect(screen.getByTestId('card-face-meaning')).toBeInTheDocument();
      
      // Meaning -> Example
      await user.keyboard(' ');
      expect(screen.getByTestId('card-face-example')).toBeInTheDocument();
      
      // Example -> Front
      await user.keyboard(' ');
      expect(screen.getByTestId('card-face-front')).toBeInTheDocument();
    });

    test('should call onNext when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Face Content Validation', () => {
    test('should display all word forms in Front face', () => {
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      expect(screen.getByText('ubiquitous')).toBeInTheDocument(); // main word
      expect(screen.getByText('adj.')).toBeInTheDocument(); // primary POS
      
      // All forms should be displayed
      expect(screen.getByText('ubiquity')).toBeInTheDocument();
      expect(screen.getByText('ubiquitously')).toBeInTheDocument();
    });

    test('should display synonyms and antonyms in Meaning face', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      // Navigate to Meaning face
      await user.keyboard('{ArrowRight}');
      
      // Check synonyms
      expect(screen.getByText('omnipresent')).toBeInTheDocument();
      expect(screen.getByText('pervasive')).toBeInTheDocument();
      expect(screen.getByText('universal')).toBeInTheDocument();
      
      // Check antonyms
      expect(screen.getByText('rare')).toBeInTheDocument();
      expect(screen.getByText('scarce')).toBeInTheDocument();
    });

    test('should display example and anchors in Example face', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      // Navigate to Example face
      await user.keyboard('{ArrowRight}'); // to Meaning
      await user.keyboard('{ArrowRight}'); // to Example
      
      expect(screen.getByText('Smartphones have become ubiquitous in modern society.')).toBeInTheDocument();
      
      // MediaEmbed component should be rendered
      expect(screen.getByTestId('media-embed')).toBeInTheDocument();
    });
  });

  describe('Touch/Mouse Navigation', () => {
    test('should support touch swipe right', async () => {
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      
      // Simulate swipe right (touchstart -> touchend with movement)
      fireEvent.touchStart(cardContainer, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchEnd(cardContainer, {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      });
      
      expect(screen.getByTestId('card-face-meaning')).toBeInTheDocument();
    });

    test('should support touch swipe left', async () => {
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      
      // Simulate swipe left
      fireEvent.touchStart(cardContainer, {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      fireEvent.touchEnd(cardContainer, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });
      
      expect(screen.getByTestId('card-face-example')).toBeInTheDocument();
    });

    test('should ignore small touch movements', async () => {
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      
      // Small movement should not trigger navigation
      fireEvent.touchStart(cardContainer, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchEnd(cardContainer, {
        changedTouches: [{ clientX: 110, clientY: 100 }] // Only 10px movement
      });
      
      // Should still be on Front face
      expect(screen.getByTestId('card-face-front')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      expect(cardContainer).toHaveAttribute('role', 'region');
      expect(cardContainer).toHaveAttribute('aria-label');
    });

    test('should announce face changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      await user.keyboard('{ArrowRight}');
      
      const meaningFace = screen.getByTestId('card-face-meaning');
      expect(meaningFace).toHaveAttribute('role', 'region');
      expect(meaningFace).toHaveAttribute('aria-label', expect.stringContaining('Meaning'));
    });

    test('should support keyboard focus management', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      // Should be focusable
      await user.tab();
      expect(screen.getByTestId('card-container')).toHaveFocus();
    });

    test('should have appropriate semantic structure', () => {
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      // Main word should be in a heading
      const wordHeading = screen.getByRole('heading', { name: /ubiquitous/ });
      expect(wordHeading).toBeInTheDocument();
      expect(wordHeading).toHaveAttribute('aria-level', '2');
    });
  });

  describe('Edge Cases', () => {
    test('should handle card with minimal data', () => {
      const minimalCard = createTestCard({
        word: { base: 'test', forms: [] },
        synonyms: [],
        antonyms: [],
        anchors: [],
      });

      render(<Card card={minimalCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByTestId('card-face-front')).toBeInTheDocument();
    });

    test('should handle card with empty strings gracefully', () => {
      const emptyCard = createTestCard({
        word: { base: '', forms: [] },
        meaning: '',
        example: '',
      });

      render(<Card card={emptyCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      // Should not crash and should render structure
      expect(screen.getByTestId('card-container')).toBeInTheDocument();
    });

    test('should handle multiple rapid key presses', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      // Rapid key presses
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}');
      
      // Should end up on Meaning face (Front -> Meaning -> Example -> Meaning)
      expect(screen.getByTestId('card-face-meaning')).toBeInTheDocument();
    });

    test('should handle simultaneous touch and keyboard events', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      
      // Start touch event
      fireEvent.touchStart(cardContainer, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      // Keyboard event during touch
      await user.keyboard('{ArrowRight}');
      
      // Complete touch event
      fireEvent.touchEnd(cardContainer, {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      });
      
      // Should not double-navigate
      expect(screen.getByTestId('card-face-meaning')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(
        <Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />
      );
      
      const initialElement = screen.getByTestId('card-container');
      
      // Re-render with same props
      rerender(
        <Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />
      );
      
      // Should be the same element (React.memo optimization)
      expect(screen.getByTestId('card-container')).toBe(initialElement);
    });

    test('should handle rapid face switching without lag', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      const startTime = performance.now();
      
      // Rapid switching
      for (let i = 0; i < 10; i++) {
        await user.keyboard(' ');
      }
      
      const endTime = performance.now();
      
      // Should complete in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Props Integration', () => {
    test('should call onFlip when face changes', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      await user.keyboard('{ArrowRight}');
      
      expect(mockOnFlip).toHaveBeenCalledTimes(1);
    });

    test('should call onNext when appropriate', async () => {
      const user = userEvent.setup();
      render(<Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />);
      
      const cardContainer = screen.getByTestId('card-container');
      cardContainer.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    test('should update when card prop changes', () => {
      const { rerender } = render(
        <Card card={mockCard} onFlip={mockOnFlip} onNext={mockOnNext} />
      );
      
      expect(screen.getByText('ubiquitous')).toBeInTheDocument();
      
      const newCard = createTestCard({
        word: { base: 'ephemeral', forms: [] },
      });
      
      rerender(
        <Card card={newCard} onFlip={mockOnFlip} onNext={mockOnNext} />
      );
      
      expect(screen.getByText('ephemeral')).toBeInTheDocument();
      expect(screen.queryByText('ubiquitous')).not.toBeInTheDocument();
    });
  });
});