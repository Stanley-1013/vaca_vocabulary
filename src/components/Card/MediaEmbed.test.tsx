/**
 * MediaEmbed Component Tests
 * 
 * 根據 TDD 原則，這些測試定義了 MediaEmbed 組件的完整規格
 * 必須在 MediaEmbed.tsx 實作前完成
 * 
 * 測試涵蓋：
 * 1. 不同媒體類型的渲染 (image, youtube, mp4, link)
 * 2. 無障礙支援 (alt text, titles)
 * 3. 錯誤處理 (載入失敗、無效 URL)
 * 4. 安全性 (external links)
 */

import React from 'react';
import { describe, test, expect, vi } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createTestAnchor } from '../../../test/utils/testHelpers';
import { Anchor } from '../../types';

// 這個組件必須在 src/components/Card/MediaEmbed.tsx 中實作
import MediaEmbed from './MediaEmbed';

describe('MediaEmbed Component', () => {
  describe('Image Type', () => {
    test('should render image with proper attributes', () => {
      const anchor = createTestAnchor({
        type: 'image',
        url: 'https://example.com/test.jpg',
        title: 'Test Image'
      });

      render(<MediaEmbed anchor={anchor} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/test.jpg');
      expect(img).toHaveAttribute('alt', 'Test Image');
      expect(img).toHaveClass('max-w-full', 'rounded');
    });

    test('should use url as alt text when title is missing', () => {
      const anchor = createTestAnchor({
        type: 'image',
        url: 'https://example.com/photo.png',
        // title is undefined
      });

      render(<MediaEmbed anchor={anchor} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'https://example.com/photo.png');
    });

    test('should use "image" as fallback alt text for empty title', () => {
      const anchor = createTestAnchor({
        type: 'image',
        url: 'https://example.com/photo.png',
        title: ''
      });

      render(<MediaEmbed anchor={anchor} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'image');
    });

    test('should handle image load error gracefully', async () => {
      const anchor = createTestAnchor({
        type: 'image',
        url: 'https://example.com/broken.jpg',
        title: 'Broken Image'
      });

      render(<MediaEmbed anchor={anchor} />);

      const img = screen.getByRole('img');
      
      // Simulate image load error
      fireEvent.error(img);

      // Should show error state or fallback
      await waitFor(() => {
        const errorElement = screen.queryByTestId('media-error') || screen.queryByText(/failed to load/i);
        expect(errorElement).toBeInTheDocument();
      });
    });

    test('should have proper container for responsive design', () => {
      const anchor = createTestAnchor({ type: 'image' });
      
      const { container } = render(<MediaEmbed anchor={anchor} />);
      const mediaContainer = container.querySelector('[data-testid="media-embed"]');
      
      expect(mediaContainer).toHaveClass('media-embed-container');
    });
  });

  describe('YouTube Type', () => {
    test('should render YouTube iframe with proper attributes', () => {
      const anchor = createTestAnchor({
        type: 'youtube',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: 'Test Video'
      });

      render(<MediaEmbed anchor={anchor} />);

      const iframe = screen.getByTitle('Test Video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(iframe).toHaveClass('w-full', 'aspect-video', 'rounded');
    });

    test('should have required iframe attributes for security', () => {
      const anchor = createTestAnchor({
        type: 'youtube',
        url: 'https://www.youtube.com/embed/test123',
        title: 'Security Test Video'
      });

      render(<MediaEmbed anchor={anchor} />);

      const iframe = screen.getByTitle('Security Test Video');
      expect(iframe).toHaveAttribute('allowFullScreen');
      expect(iframe).toHaveAttribute('allow', expect.stringContaining('accelerometer'));
      expect(iframe).toHaveAttribute('allow', expect.stringContaining('autoplay'));
      expect(iframe).toHaveAttribute('allow', expect.stringContaining('encrypted-media'));
    });

    test('should use "youtube" as fallback title', () => {
      const anchor = createTestAnchor({
        type: 'youtube',
        url: 'https://www.youtube.com/embed/test123',
        // title is undefined
      });

      render(<MediaEmbed anchor={anchor} />);

      const iframe = screen.getByTitle('youtube');
      expect(iframe).toBeInTheDocument();
    });

    test('should handle non-embed YouTube URLs by converting', () => {
      const anchor = createTestAnchor({
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Convert Test'
      });

      render(<MediaEmbed anchor={anchor} />);

      const iframe = screen.getByTitle('Convert Test');
      // Should automatically convert to embed URL
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    test('should handle YouTube short URLs', () => {
      const anchor = createTestAnchor({
        type: 'youtube',
        url: 'https://youtu.be/dQw4w9WgXcQ',
        title: 'Short URL Test'
      });

      render(<MediaEmbed anchor={anchor} />);

      const iframe = screen.getByTitle('Short URL Test');
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });

  describe('MP4 Type', () => {
    test('should render video element with controls', () => {
      const anchor = createTestAnchor({
        type: 'mp4',
        url: 'https://example.com/video.mp4',
        title: 'Test Video'
      });

      render(<MediaEmbed anchor={anchor} />);

      const video = screen.getByRole('application'); // video with controls has 'application' role
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
      expect(video).toHaveAttribute('controls');
      expect(video).toHaveClass('w-full', 'rounded');
    });

    test('should have proper video attributes for accessibility', () => {
      const anchor = createTestAnchor({
        type: 'mp4',
        url: 'https://example.com/video.mp4',
        title: 'Accessible Video'
      });

      render(<MediaEmbed anchor={anchor} />);

      const video = screen.getByRole('application');
      expect(video).toHaveAttribute('aria-label', 'Accessible Video');
      expect(video).toHaveAttribute('preload', 'metadata'); // Don't auto-load full video
    });

    test('should handle video load error', async () => {
      const anchor = createTestAnchor({
        type: 'mp4',
        url: 'https://example.com/broken.mp4',
        title: 'Broken Video'
      });

      render(<MediaEmbed anchor={anchor} />);

      const video = screen.getByRole('application');
      
      // Simulate video load error
      fireEvent.error(video);

      await waitFor(() => {
        const errorElement = screen.queryByTestId('media-error');
        expect(errorElement).toBeInTheDocument();
      });
    });

    test('should support common video formats', () => {
      const formats = ['mp4', 'webm', 'ogg'];
      
      formats.forEach(format => {
        const anchor = createTestAnchor({
          type: 'mp4',
          url: `https://example.com/video.${format}`,
          title: `${format} video`
        });

        const { unmount } = render(<MediaEmbed anchor={anchor} />);
        
        const video = screen.getByRole('application');
        expect(video).toHaveAttribute('src', `https://example.com/video.${format}`);
        
        unmount();
      });
    });
  });

  describe('Link Type', () => {
    test('should render external link with proper attributes', () => {
      const anchor = createTestAnchor({
        type: 'link',
        url: 'https://example.com/article',
        title: 'External Article'
      });

      render(<MediaEmbed anchor={anchor} />);

      const link = screen.getByRole('link', { name: 'External Article' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com/article');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('should use URL as link text when title is missing', () => {
      const anchor = createTestAnchor({
        type: 'link',
        url: 'https://example.com/page',
        // title is undefined
      });

      render(<MediaEmbed anchor={anchor} />);

      const link = screen.getByRole('link', { name: 'https://example.com/page' });
      expect(link).toBeInTheDocument();
    });

    test('should have underline styling for links', () => {
      const anchor = createTestAnchor({
        type: 'link',
        url: 'https://example.com',
        title: 'Styled Link'
      });

      render(<MediaEmbed anchor={anchor} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('underline');
    });

    test('should handle different URL protocols', () => {
      const protocols = [
        'https://example.com',
        'http://example.com',
        'mailto:test@example.com',
        'tel:+1234567890'
      ];

      protocols.forEach((url, index) => {
        const anchor = createTestAnchor({
          type: 'link',
          url,
          title: `Link ${index}`
        });

        const { unmount } = render(<MediaEmbed anchor={anchor} />);
        
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', url);
        
        unmount();
      });
    });

    test('should validate URL format and show error for invalid URLs', () => {
      const invalidAnchor = createTestAnchor({
        type: 'link',
        url: 'not-a-valid-url',
        title: 'Invalid Link'
      });

      render(<MediaEmbed anchor={invalidAnchor} />);

      // Should show error state instead of broken link
      const errorElement = screen.queryByTestId('media-error');
      expect(errorElement).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should show error message for unsupported media type', () => {
      const unsupportedAnchor = {
        type: 'unsupported' as any,
        url: 'https://example.com/file',
        title: 'Unsupported'
      };

      render(<MediaEmbed anchor={unsupportedAnchor} />);

      const errorElement = screen.getByTestId('media-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(/unsupported media type/i);
    });

    test('should handle empty URL gracefully', () => {
      const emptyUrlAnchor = createTestAnchor({
        type: 'image',
        url: '',
        title: 'Empty URL'
      });

      render(<MediaEmbed anchor={emptyUrlAnchor} />);

      const errorElement = screen.getByTestId('media-error');
      expect(errorElement).toBeInTheDocument();
    });

    test('should handle null/undefined anchor gracefully', () => {
      // This should not crash the component
      expect(() => {
        render(<MediaEmbed anchor={null as any} />);
      }).toThrow(); // Should throw error for required prop

      expect(() => {
        render(<MediaEmbed anchor={undefined as any} />);
      }).toThrow();
    });
  });

  describe('Loading States', () => {
    test('should show loading indicator for images', () => {
      const anchor = createTestAnchor({
        type: 'image',
        url: 'https://example.com/large-image.jpg',
        title: 'Large Image'
      });

      render(<MediaEmbed anchor={anchor} />);

      // Should show loading state initially
      const loadingElement = screen.queryByTestId('media-loading');
      expect(loadingElement).toBeInTheDocument();
    });

    test('should hide loading indicator when image loads', async () => {
      const anchor = createTestAnchor({
        type: 'image',
        url: 'https://example.com/image.jpg',
        title: 'Test Image'
      });

      render(<MediaEmbed anchor={anchor} />);

      const img = screen.getByRole('img');
      
      // Simulate successful load
      fireEvent.load(img);

      await waitFor(() => {
        const loadingElement = screen.queryByTestId('media-loading');
        expect(loadingElement).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('should lazy load images when supported', () => {
      const anchor = createTestAnchor({
        type: 'image',
        url: 'https://example.com/image.jpg',
        title: 'Lazy Image'
      });

      render(<MediaEmbed anchor={anchor} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    test('should not preload videos automatically', () => {
      const anchor = createTestAnchor({
        type: 'mp4',
        url: 'https://example.com/video.mp4',
        title: 'Performance Video'
      });

      render(<MediaEmbed anchor={anchor} />);

      const video = screen.getByRole('application');
      expect(video).toHaveAttribute('preload', 'metadata');
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive container classes', () => {
      const anchor = createTestAnchor({ type: 'image' });
      
      render(<MediaEmbed anchor={anchor} />);

      const container = screen.getByTestId('media-embed');
      expect(container).toHaveClass('media-embed-container');
      
      const img = screen.getByRole('img');
      expect(img).toHaveClass('max-w-full'); // Responsive width
    });

    test('should maintain aspect ratio for videos', () => {
      const anchor = createTestAnchor({ type: 'youtube' });
      
      render(<MediaEmbed anchor={anchor} />);

      const iframe = screen.getByTitle('youtube');
      expect(iframe).toHaveClass('aspect-video'); // 16:9 aspect ratio
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for all media types', () => {
      const mediaTypes = [
        { type: 'image' as const, role: 'img' },
        { type: 'youtube' as const, title: 'YouTube Video' },
        { type: 'mp4' as const, role: 'application' },
        { type: 'link' as const, role: 'link' }
      ];

      mediaTypes.forEach(({ type, role, title }) => {
        const anchor = createTestAnchor({
          type,
          title: title || 'Accessible Media'
        });

        const { unmount } = render(<MediaEmbed anchor={anchor} />);

        if (role) {
          const element = screen.getByRole(role);
          expect(element).toBeInTheDocument();
        } else {
          const element = screen.getByTitle(title!);
          expect(element).toBeInTheDocument();
        }

        unmount();
      });
    });

    test('should support keyboard navigation for interactive elements', () => {
      const anchor = createTestAnchor({
        type: 'link',
        url: 'https://example.com',
        title: 'Keyboard Link'
      });

      render(<MediaEmbed anchor={anchor} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('tabIndex', '0');
    });

    test('should provide alternative text for broken media', async () => {
      const anchor = createTestAnchor({
        type: 'image',
        url: 'https://example.com/broken.jpg',
        title: 'Broken Image'
      });

      render(<MediaEmbed anchor={anchor} />);

      const img = screen.getByRole('img');
      fireEvent.error(img);

      await waitFor(() => {
        const errorText = screen.getByText(/failed to load/i);
        expect(errorText).toBeInTheDocument();
        expect(errorText).toHaveAttribute('role', 'alert');
      });
    });
  });
});