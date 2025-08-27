import { Card, Quality, NewCardInput, ApiResponse } from '../types'
import { MOCK_CARDS } from '../../test/fixtures/cards.json'

// Service layer abstraction - MVP implementation using JSON fixtures
export interface IApiService {
  getDueCards(): Promise<Card[]>
  addCard(card: NewCardInput): Promise<{id: string}>
  reviewCard(id: string, quality: Quality): Promise<Card>
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

// Phase 2+: HTTP client implementation would replace this
class HttpApiService implements IApiService {
  private baseUrl: string
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getDueCards(): Promise<Card[]> {
    const response = await fetch(`${this.baseUrl}/cards?due=today`)
    const result: ApiResponse<Card[]> = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || 'Failed to fetch cards')
    }
    
    return result.data
  }

  async addCard(card: NewCardInput): Promise<{id: string}> {
    const response = await fetch(`${this.baseUrl}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    })
    
    const result: ApiResponse<{id: string}> = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || 'Failed to add card')
    }
    
    return result.data
  }

  async reviewCard(id: string, quality: Quality): Promise<Card> {
    const response = await fetch(`${this.baseUrl}/cards/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quality })
    })
    
    const result: ApiResponse<Card> = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error?.message || 'Failed to review card')
    }
    
    return result.data
  }
}

// Factory function to create appropriate service based on environment
export function createApiService(): IApiService {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  
  // Phase 1 MVP: Always use MockApiService
  if (!apiBaseUrl || import.meta.env.DEV) {
    return new MockApiService()
  }
  
  // Phase 2+: Use HTTP client when API_BASE_URL is configured
  return new HttpApiService(apiBaseUrl)
}

// Default export for convenience
export const apiService = createApiService()