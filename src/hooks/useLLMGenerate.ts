import { useState, useCallback } from 'react'
import { LLMSuggestRequest, LLMGenerateRequest, Card } from '../types'
import { suggestWords } from '../services/llm'

/**
 * LLM 單字生成 Hook
 * 
 * 透過 Google Drive 檔案交換與 Colab 模型通訊
 */
export function useLLMGenerate() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastRequest, setLastRequest] = useState<LLMGenerateRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateCards = useCallback(async (request: LLMSuggestRequest): Promise<Card[]> => {
    setIsGenerating(true)
    setError(null)

    try {
      // 創建請求 ID
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const timestamp = new Date().toISOString()

      const llmRequest: LLMGenerateRequest = {
        id: requestId,
        timestamp,
        status: 'pending',
        request
      }

      setLastRequest(llmRequest)

      // 呼叫後端代理產生卡片
      const cards: Card[] = await suggestWords(request)

      // 更新請求狀態
      const completedRequest: LLMGenerateRequest = {
        ...llmRequest,
        status: 'completed',
        response: { cards }
      }
      
      setLastRequest(completedRequest)
      
      console.log('✅ LLM 生成完成:', cards)
      return cards

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤'
      setError(errorMessage)
      
      if (lastRequest) {
        setLastRequest({
          ...lastRequest,
          status: 'error',
          error: errorMessage
        })
      }
      
      console.error('❌ LLM 生成失敗:', err)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [lastRequest])

  const createLearningHistory = useCallback((cards: Card[]): string => {
    /**
     * 創建學習歷史摘要，用於 LLM 上下文
     */
    if (cards.length === 0) {
      return "初學者，尚未開始學習"
    }

    // 統計已學單字
    const learnedCards = cards.filter(card => card.reps > 0)
    const masteredCards = cards.filter(card => card.box >= 4 || card.interval >= 14)
    
    // 分析標籤分布
    const tagCounts: Record<string, number> = {}
    cards.forEach(card => {
      card.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag, count]) => `${tag}(${count}詞)`)
      .join(', ')

    // 分析困難詞彙
    const difficultWords = cards
      .filter(card => card.ease < 2.0 || (card.reps > 3 && card.box <= 2))
      .map(card => card.word.base)
      .slice(0, 10)

    return [
      `已學習${learnedCards.length}個單字`,
      `已掌握${masteredCards.length}個單字`,
      topTags && `主要學習領域：${topTags}`,
      difficultWords.length > 0 && `困難詞彙：${difficultWords.slice(0, 5).join(', ')}`
    ].filter(Boolean).join('，')
  }, [])

  const getRecentWords = useCallback((cards: Card[], limit: number = 20): string[] => {
    /**
     * 獲取最近學習的單字，用於避免重複
     */
    return cards
      .filter(card => card.lastReviewedAt)
      .sort((a, b) => {
        const dateA = new Date(a.lastReviewedAt || 0)
        const dateB = new Date(b.lastReviewedAt || 0)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, limit)
      .map(card => card.word.base)
  }, [])

  return {
    generateCards,
    createLearningHistory,
    getRecentWords,
    isGenerating,
    lastRequest,
    error
  }
}