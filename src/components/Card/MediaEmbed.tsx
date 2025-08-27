import React, { useState, useCallback } from 'react'
import { Anchor } from '../../types'

interface MediaEmbedProps {
  anchor: Anchor
}

const MediaEmbed: React.FC<MediaEmbedProps> = ({ anchor }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  // Validate anchor
  if (!anchor || !anchor.url) {
    return (
      <div data-testid="media-error" className="media-embed-container">
        <p role="alert">Failed to load media: Invalid URL</p>
      </div>
    )
  }

  // Get display title
  const getDisplayTitle = (type: string, title?: string, url?: string): string => {
    if (title && title.trim()) return title
    if (url && type === 'image') return url
    if (type === 'link' && url) return url
    return type
  }

  const displayTitle = getDisplayTitle(anchor.type, anchor.title, anchor.url)

  // Handle unsupported media types
  if (!['image', 'youtube', 'mp4', 'link'].includes(anchor.type)) {
    return (
      <div data-testid="media-error" className="media-embed-container">
        <p role="alert">Unsupported media type: {anchor.type}</p>
      </div>
    )
  }

  // Validate URL for link type
  if (anchor.type === 'link') {
    try {
      new URL(anchor.url)
    } catch {
      return (
        <div data-testid="media-error" className="media-embed-container">
          <p role="alert">Failed to load media: Invalid URL</p>
        </div>
      )
    }
  }

  const renderMedia = () => {
    switch (anchor.type) {
      case 'image':
        return (
          <>
            {isLoading && (
              <div data-testid="media-loading" className="animate-pulse bg-gray-200 h-32 rounded" />
            )}
            <img
              src={anchor.url}
              alt={displayTitle === anchor.url ? 'image' : displayTitle}
              className="max-w-full rounded"
              onLoad={handleLoad}
              onError={handleError}
              loading="lazy"
              style={{ display: isLoading ? 'none' : 'block' }}
            />
            {hasError && (
              <div data-testid="media-error">
                <p role="alert">Failed to load image</p>
              </div>
            )}
          </>
        )

      case 'youtube':
        const getYouTubeEmbedUrl = (url: string): string => {
          // Handle different YouTube URL formats
          const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
          ]
          
          for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) {
              return `https://www.youtube.com/embed/${match[1]}`
            }
          }
          
          // If already an embed URL, return as-is
          if (url.includes('youtube.com/embed/')) {
            return url
          }
          
          return url
        }

        return (
          <iframe
            src={getYouTubeEmbedUrl(anchor.url)}
            title={displayTitle}
            className="w-full aspect-video rounded"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )

      case 'mp4':
        return (
          <>
            <video
              src={anchor.url}
              className="w-full rounded"
              controls
              preload="metadata"
              aria-label={displayTitle}
              onError={handleError}
            />
            {hasError && (
              <div data-testid="media-error">
                <p role="alert">Failed to load video</p>
              </div>
            )}
          </>
        )

      case 'link':
        return (
          <a
            href={anchor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            tabIndex={0}
          >
            {displayTitle}
          </a>
        )

      default:
        return null
    }
  }

  return (
    <div data-testid="media-embed" className="media-embed-container">
      {renderMedia()}
    </div>
  )
}

export default MediaEmbed