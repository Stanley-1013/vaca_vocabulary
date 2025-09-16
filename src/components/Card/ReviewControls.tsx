import React, { useEffect, useCallback } from 'react'
import { Quality, Card, Algorithm } from '../../types'
import { predictNextIntervalDays } from '../../services/vnext/predictNextInterval'

interface ReviewControlsProps {
  onRate: (quality: Quality) => Promise<void>
  onAgain?: () => Promise<void>  // 新功能：Again 按鈕回調
  card?: Card  // 新功能：用於預測間隔
  algorithm?: Algorithm  // 新功能：算法選擇
  busy?: boolean
}

const ReviewControls: React.FC<ReviewControlsProps> = ({ 
  onRate, 
  onAgain, 
  card, 
  algorithm = 'leitner', 
  busy = false 
}) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (busy) return
    
    const key = event.key
    let quality: Quality | null = null
    
    switch (key) {
      case '1':
        if (onAgain) {
          // vNext 模式：1 = Again
          event.preventDefault()
          onAgain().catch(console.error)
          return
        } else {
          // 傳統模式：1 = 困難
          quality = 1
        }
        break
      case '2':
        quality = onAgain ? 1 : 2  // vNext: 2=困難, 傳統: 2=普通
        break
      case '3':
        quality = onAgain ? 2 : 3  // vNext: 3=普通, 傳統: 3=容易
        break
      case '4':
        if (onAgain) {
          quality = 3  // vNext: 4=容易
        }
        break
    }
    
    if (quality) {
      event.preventDefault()
      onRate(quality).catch(console.error)
    }
  }, [onRate, onAgain, busy])

  // 修復：鍵盤事件監聽器 - 避免與 Card 組件衝突
  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      // 只處理數字鍵，其他鍵盤事件由 Card 組件處理
      if (['1', '2', '3', '4'].includes(event.key)) {
        handleKeyPress(event)
      }
    }

    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('keydown', keyHandler)
    }
  }, [handleKeyPress])

  const handleButtonClick = (quality: Quality) => {
    if (busy) return
    onRate(quality).catch(console.error)
  }

  const buttonBaseClass = `
    px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-white
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:transform hover:scale-105 active:scale-95
    text-sm sm:text-base
  `

  // 獲取間隔預測文字
  const getIntervalText = (quality: Quality): string => {
    if (!card) return ''
    try {
      const days = predictNextIntervalDays(card, quality, algorithm)
      return ` (${days}天)`
    } catch {
      return ''
    }
  }

  const handleAgainClick = () => {
    if (busy || !onAgain) return
    onAgain().catch(console.error)
  }

  // vNext 模式：四個按鈕
  if (onAgain) {
    return (
      <div className="review-controls flex flex-wrap gap-2 sm:gap-3 justify-center mt-4 sm:mt-6">
        <button
          data-testid="again-button"
          onClick={handleAgainClick}
          disabled={busy}
          className={`
            ${buttonBaseClass}
            bg-gray-600 hover:bg-gray-700 focus:ring-gray-500
          `}
          aria-label="Review again (keyboard: 1)"
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Again
            </span>
          ) : (
            <span>Again (1)</span>
          )}
        </button>

        <button
          data-testid="quality-1"
          onClick={() => handleButtonClick(1)}
          disabled={busy}
          className={`
            ${buttonBaseClass}
            bg-red-500 hover:bg-red-600 focus:ring-red-500
          `}
          aria-label="Rate as difficult (keyboard: 2)"
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              困難
            </span>
          ) : (
            <span>困難{getIntervalText(1)} (2)</span>
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
          aria-label="Rate as normal (keyboard: 3)"
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              普通
            </span>
          ) : (
            <span>普通{getIntervalText(2)} (3)</span>
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
          aria-label="Rate as easy (keyboard: 4)"
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              容易
            </span>
          ) : (
            <span>容易{getIntervalText(3)} (4)</span>
          )}
        </button>
      </div>
    )
  }

  // 傳統模式：三個按鈕（向下相容）
  return (
    <div className="review-controls flex flex-wrap gap-2 sm:gap-4 justify-center mt-4 sm:mt-6">
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