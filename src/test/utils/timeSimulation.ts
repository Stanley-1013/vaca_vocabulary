/**
 * 時間模擬工具
 * 
 * 用於測試日期推進和時間相關邏輯
 */

export class TimeSimulator {
  private originalDateNow: () => number
  private mockTime: number

  constructor(initialTime?: Date | string | number) {
    this.originalDateNow = Date.now
    this.mockTime = initialTime ? new Date(initialTime).getTime() : Date.now()
  }

  /**
   * 設定模擬時間
   */
  setTime(time: Date | string | number): void {
    this.mockTime = new Date(time).getTime()
    Date.now = () => this.mockTime
  }

  /**
   * 前進指定天數
   */
  advanceDays(days: number): void {
    this.mockTime += days * 24 * 60 * 60 * 1000
    Date.now = () => this.mockTime
  }

  /**
   * 前進指定小時
   */
  advanceHours(hours: number): void {
    this.mockTime += hours * 60 * 60 * 1000
    Date.now = () => this.mockTime
  }

  /**
   * 前進指定分鐘
   */
  advanceMinutes(minutes: number): void {
    this.mockTime += minutes * 60 * 1000
    Date.now = () => this.mockTime
  }

  /**
   * 取得當前模擬時間
   */
  getCurrentTime(): Date {
    return new Date(this.mockTime)
  }

  /**
   * 重置時間模擬
   */
  restore(): void {
    Date.now = this.originalDateNow
  }
}

/**
 * 建立時間模擬器的工廠函數
 */
export const createTimeSimulator = (initialTime?: Date | string | number): TimeSimulator => {
  return new TimeSimulator(initialTime)
}

/**
 * 時間測試輔助函數
 */
export const timeTestHelpers = {
  /**
   * 建立指定日期的卡片
   */
  createCardWithDates(baseCard: any, dates: {
    lastReviewedAt?: string | Date
    nextReviewAt?: string | Date
    createdAt?: string | Date
  }) {
    return {
      ...baseCard,
      lastReviewedAt: dates.lastReviewedAt ? new Date(dates.lastReviewedAt).toISOString() : undefined,
      nextReviewAt: dates.nextReviewAt ? new Date(dates.nextReviewAt).toISOString() : undefined,
      createdAt: dates.createdAt ? new Date(dates.createdAt).toISOString() : undefined
    }
  },

  /**
   * 檢查卡片是否到期
   */
  isCardDue(card: any, today: Date): boolean {
    if (!card.nextReviewAt) return false
    return new Date(card.nextReviewAt) <= today
  },

  /**
   * 計算逾期天數
   */
  getOverdueDays(card: any, today: Date): number {
    if (!card.nextReviewAt) return 0
    const nextReview = new Date(card.nextReviewAt)
    const diffTime = today.getTime() - nextReview.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  },

  /**
   * 生成測試用的日期序列
   */
  generateDateSequence(startDate: Date, days: number): Date[] {
    const dates: Date[] = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    return dates
  }
}