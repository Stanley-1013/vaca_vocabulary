/**
 * 日常複習管理組件
 * 
 * 整合 vNext 功能：每日選卡、優先排序、Again 佇列、完成頁
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, Quality, Algorithm, PriorityConfig, SelectionResult } from '../types'
import { selectTodayCards } from '../services/vnext/dailySelection'
import { insertAgainCard } from '../services/vnext/againQueue'
import { useDueCards } from '../hooks/useDueCards'
import { useReviewCard } from '../hooks/useReviewCard'
import CardComponent from './Card/Card'
import ReviewControls from './Card/ReviewControls'
import CompletionPage from './CompletionPage'

interface DailyReviewConfig {
  maxDailyReviews: number
  minNewPerDay: number
  maxNewPerDay: number
  algorithm: Algorithm
  againGapSequence: number[]
  priorityWeights: PriorityConfig
}

const defaultConfig: DailyReviewConfig = {
  maxDailyReviews: 20,
  minNewPerDay: 3,
  maxNewPerDay: 5,
  algorithm: 'leitner',
  againGapSequence: [2, 5, 10],
  priorityWeights: { ease: 0.5, overdueDays: 0.3, box: 0.2 }
}

interface DailyReviewManagerProps {
  config?: Partial<DailyReviewConfig>
  onMoreCards?: () => Promise<void>
  onQuiz?: () => Promise<void>
  busy?: boolean
}

interface AgainState {
  cardId: string
  count: number
  originalPosition: number
}

const DailyReviewManager: React.FC<DailyReviewManagerProps> = ({
  config: configOverride = {},
  onMoreCards,
  onQuiz,
  busy: externalBusy = false
}) => {
  const config = { ...defaultConfig, ...configOverride }
  const today = new Date()
  
  // 狀態管理
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewQueue, setReviewQueue] = useState<Card[]>([])
  const [againStates, setAgainStates] = useState<Map<string, AgainState>>(new Map())
  const [reviewedCount, setReviewedCount] = useState(0)
  const [newCardsCount] = useState(0) // 移除未使用的 setter
  const [isCompleted, setIsCompleted] = useState(false)

  // API hooks
  const { data: dueCards = [], isLoading: isDueLoading } = useDueCards()
  const { mutate: reviewCard, isPending: isReviewLoading } = useReviewCard()

  // 計算今日選卡結果
  const todaySelection: SelectionResult = useMemo(() => {
    if (!dueCards.length) {
      return { duePicked: [], needNew: config.minNewPerDay, mayNew: config.maxNewPerDay }
    }
    
    return selectTodayCards(dueCards, today, {
      maxDailyReviews: config.maxDailyReviews,
      minNewPerDay: config.minNewPerDay,
      priorityWeights: config.priorityWeights
    })
  }, [dueCards, config, today])

  // 初始化複習佇列
  useEffect(() => {
    if (todaySelection.duePicked.length > 0 && reviewQueue.length === 0) {
      setReviewQueue(todaySelection.duePicked)
    }
  }, [todaySelection.duePicked, reviewQueue.length])

  // 當前卡片
  const currentCard = reviewQueue[currentIndex]
  const isLoading = isDueLoading || isReviewLoading

  // 修復：處理評分 - 避免在回調中直接更新狀態造成無限迴圈
  const handleRate = useCallback(async (quality: Quality) => {
    if (!currentCard || isLoading) return

    try {
      // 使用 Promise 方式呼叫 mutation
      await new Promise<void>((resolve, reject) => {
        reviewCard(
          { id: currentCard.id, quality },
          { 
            onSuccess: () => {
              resolve()
            },
            onError: (error) => {
              reject(error)
            }
          }
        )
      })

      // 成功後更新狀態 - 只有實際評分才計數
      setReviewedCount(prev => prev + 1)
      handleNextCard()

    } catch (error) {
      console.error('Review failed:', error)
      // 可以添加錯誤處理 UI
    }
  }, [currentCard, isLoading, reviewCard])

  // 處理 Again
  const handleAgain = async () => {
    if (!currentCard || isLoading) return

    const currentAgainState = againStates.get(currentCard.id)
    const againCount = currentAgainState ? currentAgainState.count : 0
    const originalPosition = currentAgainState ? currentAgainState.originalPosition : currentIndex

    // 更新 Again 狀態
    setAgainStates(prev => new Map(prev).set(currentCard.id, {
      cardId: currentCard.id,
      count: againCount + 1,
      originalPosition
    }))

    // 修復：特殊處理最後一張卡片的情況
    if (currentIndex === reviewQueue.length - 1) {
      // 如果是最後一張卡片，直接重新插入到當前位置
      const updatedQueue = [...reviewQueue]
      updatedQueue.splice(currentIndex, 0, currentCard)
      setReviewQueue(updatedQueue)
      // 保持當前索引不變，讓使用者重複練習這張卡片
      return
    }

    // 正常情況：從當前佇列移除卡片
    const newQueue = reviewQueue.filter((_, index) => index !== currentIndex)
    
    // 使用 Again 佇列邏輯重新插入
    const updatedQueue = insertAgainCard(
      newQueue,
      currentCard,
      againCount,
      config.againGapSequence,
      Math.max(0, currentIndex - 1)
    )

    setReviewQueue(updatedQueue)
    
    // 調整當前索引
    if (currentIndex >= newQueue.length) {
      setCurrentIndex(Math.max(0, newQueue.length - 1))
    }
  }

  // 修復：移動到下一張卡片 - 使用 useCallback 穩定化
  const handleNextCard = useCallback(() => {
    const nextIndex = currentIndex + 1
    
    if (nextIndex >= reviewQueue.length) {
      // 完成所有卡片
      setIsCompleted(true)
    } else {
      setCurrentIndex(nextIndex)
    }
  }, [currentIndex, reviewQueue.length])

  // 處理背更多單字
  const handleMoreCards = async () => {
    if (!onMoreCards) return
    
    try {
      await onMoreCards()
      // 重置狀態以繼續複習
      setIsCompleted(false)
      setCurrentIndex(0)
    } catch (error) {
      console.error('Load more cards failed:', error)
    }
  }

  // 處理 AI 測驗
  const handleQuiz = async () => {
    if (!onQuiz) return
    
    try {
      await onQuiz()
    } catch (error) {
      console.error('Start quiz failed:', error)
    }
  }

  // 載入中狀態
  if (isDueLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        <span className="ml-2">載入今日卡片中...</span>
      </div>
    )
  }

  // 完成頁面
  if (isCompleted) {
    return (
      <CompletionPage
        onMoreCards={onMoreCards ? handleMoreCards : undefined}
        onQuiz={onQuiz ? handleQuiz : undefined}
        reviewedCount={reviewedCount}
        newCardsCount={newCardsCount}
        busy={isLoading || externalBusy}
      />
    )
  }

  // 沒有卡片（直接顯示與完成相同的完成頁面，提供相同行動選項）
  if (!currentCard) {
    return (
      <CompletionPage
        onMoreCards={onMoreCards ? handleMoreCards : undefined}
        onQuiz={onQuiz ? handleQuiz : undefined}
        reviewedCount={reviewedCount}
        newCardsCount={newCardsCount}
        busy={isLoading || externalBusy}
      />
    )
  }

  // 複習界面
  return (
    <div className="daily-review-manager">
      {/* 工具欄 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">今日複習</h2>
        <button
          onClick={handleMoreCards}
          disabled={!onMoreCards || externalBusy}
          className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-md transition-colors flex items-center gap-1"
          title="新增更多單字卡片"
        >
          <span>📚</span>
          <span className="hidden sm:inline">新增卡片</span>
        </button>
      </div>

      {/* 進度指示器 */}
      <div className="progress-bar mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>進度：{currentIndex + 1} / {reviewQueue.length}</span>
          <span>已復習：{reviewedCount} 張</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.round(((currentIndex + 1) / reviewQueue.length) * 100)}%`
            }}
          />
        </div>
      </div>

      {/* 卡片顯示 */}
      <CardComponent card={currentCard} />

      {/* vNext 複習控制項 */}
      <ReviewControls
        onRate={handleRate}
        onAgain={handleAgain}
        card={currentCard}
        algorithm={config.algorithm}
        busy={isLoading}
      />

      {/* Debug 信息 (開發用) */}
      {import.meta.env.MODE === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <p>Again Count: {againStates.get(currentCard.id)?.count || 0}</p>
          <p>Queue Length: {reviewQueue.length}</p>
          <p>Current Index: {currentIndex}</p>
        </div>
      )}
    </div>
  )
}

export default DailyReviewManager