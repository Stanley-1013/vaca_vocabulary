import { Card, Quality, NewCardInput, ApiResponse } from '../types'
import { FEATURE_FLAGS } from '../components/FeatureToggle'
import MOCK_CARDS from '../../test/fixtures/cards.json'

// Service layer abstraction - MVP implementation using JSON fixtures
export interface IApiService {
  getDueCards(): Promise<Card[]>
  addCard(card: NewCardInput): Promise<{id: string}>
  reviewCard(id: string, quality: Quality): Promise<Card>
  loadMoreCards(count?: number): Promise<Card[]>
}

// MVP Implementation: JSON fixtures with localStorage persistence
class MockApiService implements IApiService {
  private getStoredCards(): Card[] {
    const stored = localStorage.getItem('vaca-cards')
    return stored ? JSON.parse(stored) : [...MOCK_CARDS]
  }

  private setStoredCards(cards: Card[]): void {
    localStorage.setItem('vaca-cards', JSON.stringify(cards))
  }

  async getDueCards(): Promise<Card[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const cards = this.getStoredCards()
    const today = new Date()
    
    return cards.filter(card => {
      const nextReview = new Date(card.nextReviewAt)
      return nextReview <= today
    }).sort((a, b) => 
      new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
    )
  }

  // 新增：載入更多卡片功能
  async loadMoreCards(count: number = 5): Promise<Card[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const existingCards = this.getStoredCards()
    const existingIds = new Set(existingCards.map(card => card.id))
    
    // 從 mock cards 中選擇還沒有的卡片
    const availableCards = MOCK_CARDS.filter((card: any) => !existingIds.has(card.id))
    
    if (availableCards.length === 0) {
      console.log('沒有更多卡片可載入 - 所有mock卡片已存在')
      return []
    }
    
    const newCards = availableCards.slice(0, count)
    
    // 確保每張新卡片都有唯一的ID（避免重複）
    const cardsToAdd = newCards.map((card: any, index: number) => {
      const uniqueId = `${card.id}_${Date.now()}_${index}`
      return {
        ...card,
        id: uniqueId, // 使用唯一ID避免重複
        nextReviewAt: new Date().toISOString(),
        lastReviewedAt: null,
        reps: 0,
        interval: 0
      }
    })
    
    // 加入到現有卡片
    const updatedCards = [...existingCards, ...cardsToAdd]
    this.setStoredCards(updatedCards)
    
    console.log(`✅ 已加入 ${cardsToAdd.length} 張新卡片`)
    console.log(`📊 總卡片數量: ${existingCards.length} -> ${updatedCards.length}`)
    return cardsToAdd
  }

  async addCard(newCard: NewCardInput): Promise<{id: string}> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const cards = this.getStoredCards()
    const id = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const card: Card = {
      ...newCard,
      id,
      // SRS initial values
      box: 1,
      ease: 2.5,
      reps: 0,
      interval: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    
    cards.push(card)
    this.setStoredCards(cards)
    
    return { id }
  }

  async reviewCard(id: string, quality: Quality): Promise<Card> {
    await new Promise(resolve => setTimeout(resolve, 150))
    
    const cards = this.getStoredCards()
    const cardIndex = cards.findIndex(c => c.id === id)
    
    if (cardIndex === -1) {
      throw new Error(`Card with id ${id} not found`)
    }

    const card = cards[cardIndex]
    
    // Import SRS algorithms for calculation
    const { nextByLeitner } = await import('./srs')
    const updatedCard = nextByLeitner(card, quality, new Date())
    
    cards[cardIndex] = updatedCard
    this.setStoredCards(cards)
    
    return updatedCard
  }
}

// Google Apps Script HTTP client implementation
class HttpApiService implements IApiService {
  private baseUrl: string
  private timeout: number = 30000 // 30 seconds
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // 移除結尾斜線
  }

  private async makeRequest(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`
    
    // 設定預設headers和timeout
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(this.timeout)
    }
    
    const mergedOptions = { ...defaultOptions, ...options }
    
    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
      const response = await fetch(url, mergedOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result: ApiResponse<any> = await response.json()
      
      if (!result.ok) {
        throw new Error(result.error?.message || 'API request failed')
      }
      
      return result.data
      
    } catch (error) {
      console.error('API request failed:', error)
      if (error instanceof Error) {
        // 針對常見錯誤提供更好的錯誤訊息
        if (error.name === 'TimeoutError') {
          throw new Error('請求超時，請檢查網路連線')
        } else if (error.message.includes('CORS')) {
          throw new Error('跨域請求錯誤，請檢查後端CORS設定')
        } else {
          throw error
        }
      }
      throw new Error('Unknown network error')
    }
  }

  async getDueCards(): Promise<Card[]> {
    return await this.makeRequest('/cards?due=today&limit=20')
  }

  async addCard(card: NewCardInput): Promise<{id: string}> {
    return await this.makeRequest('/cards', {
      method: 'POST',
      body: JSON.stringify(card)
    })
  }

  async reviewCard(id: string, quality: Quality): Promise<Card> {
    // 注意：Google Apps Script回傳的格式可能與前端期望不同
    // 我們需要適配回傳格式
    const reviewResult = await this.makeRequest(`/cards/${id}/review`, {
      method: 'POST', // Google Apps Script使用POST而非PATCH
      body: JSON.stringify({ 
        quality, 
        algorithm: 'leitner',  // 預設使用Leitner算法
        method: 'PATCH'        // 告訴後端這是PATCH請求
      })
    })
    
    // 後端回傳的是SRS結果，需要轉換為完整的Card對象
    // 這裡我們需要重新獲取更新後的卡片
    // 由於Google Apps Script的限制，我們模擬一個卡片回傳
    return {
      id,
      // 其他欄位會由後端更新，這裡先回傳基本結構
      ...reviewResult
    } as Card
  }

  async loadMoreCards(count: number = 5): Promise<Card[]> {
    return await this.makeRequest('/cards/more', {
      method: 'POST',
      body: JSON.stringify({ count })
    })
  }
}

// Factory function to create appropriate service based on environment and feature flags
export function createApiService(): IApiService {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  
  // Check if backend integration is enabled via feature flag
  const backendIntegrationEnabled = (() => {
    try {
      const flagManager = (window as any).flagManager || 
        JSON.parse(localStorage.getItem('featureFlags') || '{}')
      return flagManager[FEATURE_FLAGS.BACKEND_INTEGRATION] || false
    } catch {
      return false
    }
  })()
  
  // Use backend if feature flag is enabled AND API URL is configured
  if (backendIntegrationEnabled && apiBaseUrl && apiBaseUrl !== '') {
    console.log('🚀 Using Google Apps Script backend:', apiBaseUrl)
    return new HttpApiService(apiBaseUrl)
  }
  
  // Default to Mock service
  console.log('📚 Using Mock API service (localStorage)')
  return new MockApiService()
}

// Default export for convenience
export const apiService = createApiService()