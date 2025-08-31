/**
 * 完成頁組件
 * 
 * 當日複習完成後顯示的頁面，提供繼續學習的選項
 */

import React from 'react'
import { useI18n } from '../hooks/useI18n'

interface CompletionPageProps {
  onMoreCards?: () => Promise<void>
  onQuiz?: () => Promise<void>
  reviewedCount: number
  newCardsCount: number
  busy?: boolean
}

const CompletionPage: React.FC<CompletionPageProps> = ({
  onMoreCards,
  onQuiz,
  reviewedCount,
  newCardsCount,
  busy = false
}) => {
  const { t } = useI18n()
  
  const handleMoreCards = () => {
    if (busy || !onMoreCards) return
    onMoreCards().catch(console.error)
  }

  const handleQuiz = () => {
    if (busy || !onQuiz) return
    onQuiz().catch(console.error)
  }

  return (
    <div className="completion-page max-w-md mx-auto p-6 text-center">
      {/* 完成統計 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          🎉 {t('review.completed')}
        </h1>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('review.reviewedCards')}：</span>
            <span className="font-semibold text-blue-600">{reviewedCount} 張</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('review.newCards')}：</span>
            <span className="font-semibold text-green-600">{newCardsCount} 張</span>
          </div>
        </div>
      </div>

      {/* 行動選項 */}
      <div className="space-y-4">
        {onMoreCards && (
          <button
            data-testid="more-cards-button"
            onClick={handleMoreCards}
            disabled={busy}
            className="
              w-full px-6 py-4 rounded-lg font-semibold text-white
              bg-blue-500 hover:bg-blue-600 focus:ring-blue-500
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:transform hover:scale-105 active:scale-95
            "
            aria-label="Continue with more cards"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                載入中...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                📚 {t('review.continueStudy')}
              </span>
            )}
          </button>
        )}

        {onQuiz && (
          <button
            data-testid="quiz-button"
            onClick={handleQuiz}
            disabled={busy}
            className="
              w-full px-6 py-4 rounded-lg font-semibold text-white
              bg-purple-500 hover:bg-purple-600 focus:ring-purple-500
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:transform hover:scale-105 active:scale-95
            "
            aria-label="Start AI quiz"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                載入中...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🤖 {t('review.aiQuiz')}
              </span>
            )}
          </button>
        )}

        {/* 完成時的返回選項 */}
        <button
          className="
            w-full px-6 py-3 rounded-lg font-medium text-gray-600
            bg-gray-100 hover:bg-gray-200 focus:ring-gray-400
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-offset-2
          "
          onClick={() => window.location.reload()}
        >
{t('review.backHome')}
        </button>
      </div>

      {/* 鼓勵信息 */}
      <div className="mt-8 text-sm text-gray-500">
        <p>堅持每日復習，讓學習成為習慣！ 💪</p>
      </div>
    </div>
  )
}

export default CompletionPage