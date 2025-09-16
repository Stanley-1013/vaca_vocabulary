import { ApiResponse, LLMSuggestRequest, LLMQuizRequest, QuizItem, Card } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || ''

async function request<T>(path: string, body: any): Promise<T> {
  if (!API_BASE) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },  // 避免 CORS 預檢
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const json = (await res.json()) as ApiResponse<T>
  if (!json.ok) {
    throw new Error(json.error?.message || 'LLM API error')
  }
  return json.data as T
}

export async function suggestWords(payload: LLMSuggestRequest): Promise<Card[]> {
  const data = await request<{ cards: Omit<Card, 'id' | 'box' | 'ease' | 'reps' | 'interval' | 'lastReviewedAt' | 'nextReviewAt' | 'createdAt'>[] }>(
    '/llm/suggest',
    payload
  )
  const timestamp = new Date().toISOString()
  // 補齊必要欄位，交由前端 later 流入新增流程
  return (data.cards || []).map((c, idx) => ({
    ...c,
    id: `llm_${Date.now()}_${idx}`,
    box: 1,
    ease: 2.5,
    reps: 0,
    interval: 0,
    lastReviewedAt: null,
    nextReviewAt: timestamp,
    createdAt: timestamp,
  })) as Card[]
}

export async function startQuiz(payload: LLMQuizRequest): Promise<QuizItem[]> {
  const data = await request<{ items: QuizItem[] }>('/llm/quiz', payload)
  return data.items || []
}


