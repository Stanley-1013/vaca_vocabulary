import { http, HttpResponse } from 'msw'
import { Card, ApiResponse } from '../../src/types'
import MOCK_CARDS from '../fixtures/cards.json'

export const handlers = [
  // GET /cards?due=today
  http.get('/api/cards', ({ request }) => {
    const url = new URL(request.url)
    const due = url.searchParams.get('due')
    
    if (due === 'today') {
      const today = new Date()
      const dueCards = MOCK_CARDS.filter(card => {
        const nextReview = new Date(card.nextReviewAt)
        return nextReview <= today
      })
      
      return HttpResponse.json<ApiResponse<Card[]>>({
        ok: true,
        data: dueCards
      })
    }
    
    return HttpResponse.json<ApiResponse<Card[]>>({
      ok: true,
      data: MOCK_CARDS
    })
  }),

  // POST /cards
  http.post('/api/cards', async ({ request }) => {
    const newCard = await request.json() as any
    const id = `card-${Date.now()}`
    
    return HttpResponse.json<ApiResponse<{id: string}>>({
      ok: true,
      data: { id }
    }, { status: 201 })
  }),

  // PATCH /cards/:id/review
  http.patch('/api/cards/:id/review', async ({ params, request }) => {
    const { id } = params
    const { quality } = await request.json() as { quality: 1 | 2 | 3 }
    
    // Find the card and simulate SRS calculation
    const card = MOCK_CARDS.find(c => c.id === id)
    if (!card) {
      return HttpResponse.json({
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Card not found'
        }
      }, { status: 404 })
    }

    // Simple SRS simulation based on quality
    const now = new Date()
    const updatedCard: Card = {
      ...card,
      lastReviewedAt: now.toISOString(),
      reps: card.reps + 1,
      // Simple interval calculation for testing
      interval: quality === 3 ? card.interval * 2 : 
                quality === 2 ? card.interval : 1,
      nextReviewAt: new Date(now.getTime() + 
        (quality === 3 ? card.interval * 2 : 
         quality === 2 ? card.interval : 1) * 24 * 60 * 60 * 1000
      ).toISOString()
    }
    
    return HttpResponse.json<ApiResponse<Card>>({
      ok: true,
      data: updatedCard
    })
  })
]