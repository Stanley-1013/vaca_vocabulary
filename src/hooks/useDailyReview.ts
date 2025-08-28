/**
 * 每日複習管理 Hook
 * 
 * 管理每日複習的狀態和統計
 */

import { useState, useEffect, useCallback } from 'react'
import { Card } from '../types'

interface DailyReviewStats {
  reviewedCount: number
  newCardsCount: number
  againUsedCount: number
  startTime: Date | null
  endTime: Date | null
}

const STORAGE_KEY = 'dailyReviewStats'

const getDefaultStats = (): DailyReviewStats => ({
  reviewedCount: 0,
  newCardsCount: 0,
  againUsedCount: 0,
  startTime: null,
  endTime: null
})

const getTodayKey = () => {
  return new Date().toISOString().split('T')[0] // YYYY-MM-DD
}

export const useDailyReview = () => {
  const [stats, setStats] = useState<DailyReviewStats>(getDefaultStats())
  const [isLoading, setIsLoading] = useState(true)

  // 載入今日統計
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const allStats = JSON.parse(stored)
        const todayStats = allStats[getTodayKey()]
        
        if (todayStats) {
          setStats({
            ...todayStats,
            startTime: todayStats.startTime ? new Date(todayStats.startTime) : null,
            endTime: todayStats.endTime ? new Date(todayStats.endTime) : null
          })
        }
      }
    } catch (error) {
      console.warn('Failed to load daily review stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 保存統計到 localStorage
  const saveStats = useCallback((newStats: DailyReviewStats) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const allStats = stored ? JSON.parse(stored) : {}
      
      allStats[getTodayKey()] = newStats
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allStats))
      
      setStats(newStats)
    } catch (error) {
      console.error('Failed to save daily review stats:', error)
    }
  }, [])

  // 開始複習
  const startReview = useCallback(() => {
    const newStats = {
      ...stats,
      startTime: stats.startTime || new Date()
    }
    saveStats(newStats)
  }, [stats, saveStats])

  // 完成複習
  const endReview = useCallback(() => {
    const newStats = {
      ...stats,
      endTime: new Date()
    }
    saveStats(newStats)
  }, [stats, saveStats])

  // 記錄卡片複習
  const recordReview = useCallback((card: Card, isNewCard: boolean = false) => {
    const newStats = {
      ...stats,
      reviewedCount: stats.reviewedCount + 1,
      newCardsCount: isNewCard ? stats.newCardsCount + 1 : stats.newCardsCount
    }
    saveStats(newStats)
  }, [stats, saveStats])

  // 記錄 Again 使用
  const recordAgain = useCallback(() => {
    const newStats = {
      ...stats,
      againUsedCount: stats.againUsedCount + 1
    }
    saveStats(newStats)
  }, [stats, saveStats])

  // 重置今日統計
  const resetTodayStats = useCallback(() => {
    const newStats = getDefaultStats()
    saveStats(newStats)
  }, [saveStats])

  // 取得歷史統計
  const getHistoryStats = useCallback((days: number = 7): Record<string, DailyReviewStats> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return {}

      const allStats = JSON.parse(stored)
      const history: Record<string, DailyReviewStats> = {}
      
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const key = date.toISOString().split('T')[0]
        
        if (allStats[key]) {
          history[key] = allStats[key]
        }
      }
      
      return history
    } catch (error) {
      console.error('Failed to get history stats:', error)
      return {}
    }
  }, [])

  return {
    stats,
    isLoading,
    startReview,
    endReview,
    recordReview,
    recordAgain,
    resetTodayStats,
    getHistoryStats
  }
}