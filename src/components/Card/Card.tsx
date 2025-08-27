import React, { useState, useEffect, useCallback } from 'react'
import { Card as CardType } from '../../types'
import MediaEmbed from './MediaEmbed'

interface CardProps {
  card: CardType
  onFlip?: (face: 'front' | 'meaning' | 'example') => void
  onNext?: () => void
  showNavigationHints?: boolean
}

type CardFace = 'front' | 'meaning' | 'example'

const Card: React.FC<CardProps> = ({ 
  card, 
  onFlip, 
  onNext, 
  showNavigationHints = true 
}) => {
  const [currentFace, setCurrentFace] = useState<CardFace>('front')

  const handleFaceChange = useCallback((newFace: CardFace) => {
    setCurrentFace(newFace)
    onFlip?.(newFace)
  }, [onFlip])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault()
        if (currentFace === 'front') {
          handleFaceChange('meaning')
        } else if (currentFace === 'meaning') {
          handleFaceChange('example')
        }
        break
      
      case 'ArrowLeft':
        event.preventDefault()
        if (currentFace === 'example') {
          handleFaceChange('meaning')
        } else if (currentFace === 'meaning') {
          handleFaceChange('front')
        }
        break
      
      case 'ArrowDown':
        event.preventDefault()
        onNext?.()
        break
    }
  }, [currentFace, handleFaceChange, onNext])

  // Keyboard navigation
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isRightSwipe && currentFace === 'meaning') {
      handleFaceChange('front')
    } else if (isRightSwipe && currentFace === 'example') {
      handleFaceChange('meaning')
    } else if (isLeftSwipe && currentFace === 'front') {
      handleFaceChange('meaning')
    } else if (isLeftSwipe && currentFace === 'meaning') {
      handleFaceChange('example')
    }
  }

  const renderCardFace = () => {
    switch (currentFace) {
      case 'front':
        return (
          <div data-testid="card-face-front" className="card-face">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800 mb-4">
                {card.word.base}
              </div>
              <div className="text-lg text-gray-600 mb-2">
                {card.posPrimary}
              </div>
              {card.word.phonetic && (
                <div className="text-base text-blue-600 mb-4 font-mono">
                  {card.word.phonetic}
                </div>
              )}
              {card.word.forms && card.word.forms.length > 0 && (
                <div className="text-sm text-gray-500 space-y-1">
                  {card.word.forms.map((form, index) => (
                    <div key={index} className="flex justify-center gap-2">
                      <span className="font-medium">{form.pos}</span>
                      <span>{form.form}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'meaning':
        return (
          <div data-testid="card-face-meaning" className="card-face">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-800 mb-6">
                {card.meaning}
              </div>
              
              {(card.synonyms.length > 0 || card.antonyms.length > 0) && (
                <div className="space-y-4">
                  {card.synonyms.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-600 mb-2">同義詞</div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {card.synonyms.map((synonym, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {synonym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {card.antonyms.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-600 mb-2">反義詞</div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {card.antonyms.map((antonym, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                          >
                            {antonym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 'example':
        return (
          <div data-testid="card-face-example" className="card-face">
            <div className="space-y-6">
              <div className="text-lg text-gray-700 leading-relaxed">
                "{card.example}"
              </div>
              
              {card.anchors && card.anchors.length > 0 && (
                <div className="space-y-4">
                  {card.anchors.map((anchor, index) => (
                    <MediaEmbed key={index} anchor={anchor} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
    }
  }

  const getFaceTitle = (face: CardFace): string => {
    switch (face) {
      case 'front': return '單字'
      case 'meaning': return '意思'
      case 'example': return '例句'
    }
  }

  return (
    <div 
      className="card-container bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto min-h-[400px] flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card Navigation Tabs */}
      <div className="flex justify-center mb-6 border-b">
        {(['front', 'meaning', 'example'] as CardFace[]).map((face) => (
          <button
            key={face}
            onClick={() => handleFaceChange(face)}
            className={`
              px-4 py-2 font-medium text-sm transition-colors
              ${currentFace === face 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
            data-testid={`face-tab-${face}`}
          >
            {getFaceTitle(face)}
          </button>
        ))}
      </div>

      {/* Card Content */}
      <div className="flex-1 flex items-center justify-center">
        {renderCardFace()}
      </div>

      {/* Navigation Hints */}
      {showNavigationHints && (
        <div className="mt-6 text-center text-xs text-gray-400 space-y-1">
          <div>← → 切換面向 | ↓ 下一張卡片</div>
          <div>滑動手勢支援</div>
        </div>
      )}

      {/* Card Metadata */}
      <div className="mt-4 pt-4 border-t text-xs text-gray-400 text-center space-y-1">
        <div>Box: {card.box} | Reps: {card.reps} | Interval: {card.interval}d</div>
        {card.tags && card.tags.length > 0 && (
          <div className="flex justify-center gap-1">
            {card.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Card