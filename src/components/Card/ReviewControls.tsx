import React, { useEffect, useCallback } from 'react'
import { Quality } from '../../types'

interface ReviewControlsProps {
  onRate: (quality: Quality) => Promise<void>
  busy?: boolean
}

const ReviewControls: React.FC<ReviewControlsProps> = ({ onRate, busy = false }) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (busy) return
    
    const key = event.key
    let quality: Quality | null = null
    
    switch (key) {
      case '1':
        quality = 1
        break
      case '2':
        quality = 2
        break
      case '3':
        quality = 3
        break
    }
    
    if (quality) {
      event.preventDefault()
      onRate(quality).catch(console.error)
    }
  }, [onRate, busy])

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  const handleButtonClick = (quality: Quality) => {
    if (busy) return
    onRate(quality).catch(console.error)
  }

  const buttonBaseClass = `
    px-6 py-3 rounded-lg font-semibold text-white
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:transform hover:scale-105 active:scale-95
  `

  return (
    <div className="review-controls flex gap-4 justify-center mt-6">
      <button
        data-testid="quality-1"
        onClick={() => handleButtonClick(1)}
        disabled={busy}
        className={`
          ${buttonBaseClass}
          bg-red-500 hover:bg-red-600 focus:ring-red-500
        `}
        aria-label="Rate as difficult (keyboard: 1)"
      >
        {busy ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            困難
          </span>
        ) : (
          <span>困難 (1)</span>
        )}
      </button>

      <button
        data-testid="quality-2"
        onClick={() => handleButtonClick(2)}
        disabled={busy}
        className={`
          ${buttonBaseClass}
          bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500
        `}
        aria-label="Rate as normal (keyboard: 2)"
      >
        {busy ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            普通
          </span>
        ) : (
          <span>普通 (2)</span>
        )}
      </button>

      <button
        data-testid="quality-3"
        onClick={() => handleButtonClick(3)}
        disabled={busy}
        className={`
          ${buttonBaseClass}
          bg-green-500 hover:bg-green-600 focus:ring-green-500
        `}
        aria-label="Rate as easy (keyboard: 3)"
      >
        {busy ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            容易
          </span>
        ) : (
          <span>容易 (3)</span>
        )}
      </button>
    </div>
  )
}

export default ReviewControls