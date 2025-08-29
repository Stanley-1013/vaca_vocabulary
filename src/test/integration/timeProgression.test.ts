/**
 * 時間推進整合測試
 * 
 * 測試日期推進對 SRS 系統的影響
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { TimeSimulator, timeTestHelpers } from '../utils/timeSimulation'
import { createTestCard } from '../../../test/utils/testHelpers'
import { selectTodayCards } from '../../services/vnext/dailySelection'
import { calculatePriorityScore } from '../../services/vnext/priorityScore'
import { predictNextIntervalDays } from '../../services/vnext/predictNextInterval'

describe('Time Progression Integration Tests', () => {
  let timeSimulator: TimeSimulator
  
  beforeEach(() => {
    // 設定測試開始時間：2025-08-28 09:00:00
    timeSimulator = new TimeSimulator('2025-08-28T09:00:00.000Z')
  })

  afterEach(() => {
    timeSimulator.restore()
  })

  describe('Daily card selection with time progression', () => {
    test('TC-TIME-001: should select different cards as time progresses', () => {
      const today = timeSimulator.getCurrentTime()
      
      // 建立測試卡片：部分今日到期，部分明日到期
      const cards = [
        timeTestHelpers.createCardWithDates(
          createTestCard({ id: 'today-1', ease: 2.0 }),
          { nextReviewAt: today.toISOString() }
        ),
        timeTestHelpers.createCardWithDates(
          createTestCard({ id: 'today-2', ease: 1.8 }),
          { nextReviewAt: today.toISOString() }
        ),
        timeTestHelpers.createCardWithDates(
          createTestCard({ id: 'tomorrow-1', ease: 2.2 }),
          { nextReviewAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString() } // 明天
        )
      ]

      const config = {
        maxDailyReviews: 10,
        minNewPerDay: 2,
        priorityWeights: { ease: 0.5, overdueDays: 0.3, box: 0.2 }
      }

      // Day 1: 只有 2 張到期
      const day1Selection = selectTodayCards(cards, today, config)
      expect(day1Selection.duePicked).toHaveLength(2)
      expect(day1Selection.duePicked.map(c => c.id).sort()).toEqual(['today-1', 'today-2'])

      // 推進到 Day 2
      timeSimulator.advanceDays(1)
      const day2 = timeSimulator.getCurrentTime()

      // Day 2: 所有 3 張都到期
      const day2Selection = selectTodayCards(cards, day2, config)
      expect(day2Selection.duePicked).toHaveLength(3)
      expect(day2Selection.duePicked.map(c => c.id).sort()).toEqual(['today-1', 'today-2', 'tomorrow-1'])
    })

    test('TC-TIME-002: should prioritize overdue cards correctly', () => {
      const today = timeSimulator.getCurrentTime()
      
      // 建立不同逾期程度的卡片
      const cards = [
        timeTestHelpers.createCardWithDates(
          createTestCard({ id: 'overdue-3days', ease: 2.0, box: 2 }),
          { nextReviewAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) }
        ),
        timeTestHelpers.createCardWithDates(
          createTestCard({ id: 'overdue-1day', ease: 2.0, box: 2 }),
          { nextReviewAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000) }
        ),
        timeTestHelpers.createCardWithDates(
          createTestCard({ id: 'due-today', ease: 2.0, box: 2 }),
          { nextReviewAt: today }
        )
      ]

      const config = {
        maxDailyReviews: 10,
        minNewPerDay: 1,
        priorityWeights: { ease: 0.2, overdueDays: 0.7, box: 0.1 } // 重視逾期
      }

      const selection = selectTodayCards(cards, today, config)
      
      // 逾期越久的應該越優先
      expect(selection.duePicked[0].id).toBe('overdue-3days')
      expect(selection.duePicked[1].id).toBe('overdue-1day')
      expect(selection.duePicked[2].id).toBe('due-today')
    })
  })

  describe('Priority scoring with time changes', () => {
    test('TC-TIME-003: should increase priority score as cards become more overdue', () => {
      const card = timeTestHelpers.createCardWithDates(
        createTestCard({ id: 'test', ease: 2.0, box: 2 }),
        { nextReviewAt: '2025-08-28T09:00:00.000Z' } // 與初始時間相同
      )

      const weights = { ease: 0.3, overdueDays: 0.6, box: 0.1 }

      // Day 1: 剛到期
      const day1Score = calculatePriorityScore(card, timeSimulator.getCurrentTime(), weights)
      
      // Day 3: 逾期 2 天
      timeSimulator.advanceDays(2)
      const day3Score = calculatePriorityScore(card, timeSimulator.getCurrentTime(), weights)

      // Day 8: 逾期 7 天
      timeSimulator.advanceDays(5)
      const day8Score = calculatePriorityScore(card, timeSimulator.getCurrentTime(), weights)

      // 分數應該隨著逾期時間增加
      expect(day3Score).toBeGreaterThan(day1Score)
      expect(day8Score).toBeGreaterThan(day3Score)
    })

    test('TC-TIME-004: should cap overdue score at 7 days', () => {
      const card = timeTestHelpers.createCardWithDates(
        createTestCard({ id: 'test', ease: 2.0, box: 2 }),
        { nextReviewAt: '2025-08-28T09:00:00.000Z' }
      )

      const weights = { ease: 0.1, overdueDays: 0.8, box: 0.1 }

      // 7 天後
      timeSimulator.advanceDays(7)
      const day7Score = calculatePriorityScore(card, timeSimulator.getCurrentTime(), weights)

      // 14 天後
      timeSimulator.advanceDays(7)
      const day14Score = calculatePriorityScore(card, timeSimulator.getCurrentTime(), weights)

      // 分數應該相同（都封頂在 7 天）
      expect(day14Score).toBeCloseTo(day7Score, 3)
    })
  })

  describe('Interval prediction consistency', () => {
    test('TC-TIME-005: should predict same intervals regardless of current time', () => {
      const card = createTestCard({ box: 2, ease: 2.5, reps: 2, interval: 3 })

      // Day 1 的預測
      const day1Prediction = predictNextIntervalDays(card, 3, 'leitner')
      
      // 推進 5 天後的預測
      timeSimulator.advanceDays(5)
      const day6Prediction = predictNextIntervalDays(card, 3, 'leitner')

      // 間隔預測應該不受當前時間影響
      expect(day6Prediction).toBe(day1Prediction)
    })
  })

  describe('Weekly learning pattern simulation', () => {
    test('TC-TIME-006: should simulate realistic weekly learning pattern', () => {
      const startDate = timeSimulator.getCurrentTime()
      
      // 建立一週的學習模擬
      const weeklyStats: Array<{
        date: string
        dueCount: number
        selectedCount: number
        averagePriority: number
      }> = []

      // 建立初始卡片集合
      let cards = Array.from({ length: 50 }, (_, i) => {
        const daysOffset = Math.floor(Math.random() * 14) - 7 // -7 到 +7 天
        const reviewDate = new Date(startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000)
        
        return timeTestHelpers.createCardWithDates(
          createTestCard({ 
            id: `card-${i}`,
            ease: 1.5 + Math.random() * 1.0, // 1.5-2.5
            box: Math.ceil(Math.random() * 5)   // 1-5
          }),
          { nextReviewAt: reviewDate }
        )
      })

      const config = {
        maxDailyReviews: 15,
        minNewPerDay: 3,
        priorityWeights: { ease: 0.5, overdueDays: 0.3, box: 0.2 }
      }

      // 模擬一週
      for (let day = 0; day < 7; day++) {
        const currentDate = timeSimulator.getCurrentTime()
        
        // 計算到期卡片
        const dueCards = cards.filter(card => 
          timeTestHelpers.isCardDue(card, currentDate)
        )

        // 選擇今日卡片
        const selection = selectTodayCards(dueCards, currentDate, config)
        
        // 計算平均優先分數
        const avgPriority = selection.duePicked.length > 0
          ? selection.duePicked.reduce((sum, card) => 
              sum + calculatePriorityScore(card, currentDate, config.priorityWeights), 0
            ) / selection.duePicked.length
          : 0

        weeklyStats.push({
          date: currentDate.toISOString().split('T')[0],
          dueCount: dueCards.length,
          selectedCount: selection.duePicked.length,
          averagePriority: avgPriority
        })

        // 推進到下一天
        timeSimulator.advanceDays(1)
      }

      // 驗證週統計
      expect(weeklyStats).toHaveLength(7)
      
      // 每日選擇的卡片數不應超過上限
      weeklyStats.forEach(stat => {
        expect(stat.selectedCount).toBeLessThanOrEqual(config.maxDailyReviews)
      })

      // 隨時間推進，總到期數應該增加（因為有更多卡片到期）
      const firstDayDue = weeklyStats[0].dueCount
      const lastDayDue = weeklyStats[6].dueCount
      expect(lastDayDue).toBeGreaterThanOrEqual(firstDayDue)
    })
  })

  describe('Date edge cases', () => {
    test('TC-TIME-007: should handle midnight transitions correctly', () => {
      // 設定為 23:59:59
      timeSimulator.setTime('2025-08-28T23:59:59.000Z')
      
      const card = timeTestHelpers.createCardWithDates(
        createTestCard({ id: 'midnight-test' }),
        { nextReviewAt: '2025-08-29T00:00:01.000Z' } // 明天午夜1秒後
      )

      const config = {
        maxDailyReviews: 10,
        minNewPerDay: 1,
        priorityWeights: { ease: 0.5, overdueDays: 0.3, box: 0.2 }
      }

      // 23:59:59 - 還未到期 (卡片設定為00:00:01才到期)
      const beforeMidnight = selectTodayCards([card], timeSimulator.getCurrentTime(), config)
      expect(beforeMidnight.duePicked).toHaveLength(0)

      // 推進 2 秒到 00:00:01
      timeSimulator.advanceMinutes(1) // 到 00:00:59
      timeSimulator.advanceMinutes(1) // 到 00:01:59，確保超過00:00:01
      
      // 00:01:59 - 應該到期了
      const afterMidnight = selectTodayCards([card], timeSimulator.getCurrentTime(), config)
      expect(afterMidnight.duePicked).toHaveLength(1)
    })

    test('TC-TIME-008: should handle timezone consistency', () => {
      // 測試不同時區的一致性（假設系統使用 UTC）
      const card = timeTestHelpers.createCardWithDates(
        createTestCard({ id: 'tz-test' }),
        { nextReviewAt: '2025-08-28T16:00:00.000Z' } // UTC 16:00
      )

      const weights = { ease: 0.1, overdueDays: 0.8, box: 0.1 } // 增加逾期權重

      // 設定為 UTC 15:00 - 卡片尚未到期
      timeSimulator.setTime('2025-08-28T15:00:00.000Z')
      const beforeScore = calculatePriorityScore(card, timeSimulator.getCurrentTime(), weights)

      // 設定為隔天同時間 - 卡片已經逾期約1天
      timeSimulator.setTime('2025-08-29T16:00:00.000Z')
      const afterScore = calculatePriorityScore(card, timeSimulator.getCurrentTime(), weights)

      // 隔天的分數應該高於前一天（因為已經逾期1天）
      expect(afterScore).toBeGreaterThan(beforeScore)
    })
  })
})