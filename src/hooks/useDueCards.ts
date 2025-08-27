import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { Card } from '../types'

interface UseDueCardsOptions {
  refetchInterval?: number
  enabled?: boolean
}

export const useDueCards = (options: UseDueCardsOptions = {}) => {
  const { 
    refetchInterval = 5 * 60 * 1000, // 5 minutes
    enabled = true 
  } = options

  return useQuery({
    queryKey: ['cards', 'due'],
    queryFn: async (): Promise<Card[]> => {
      try {
        return await apiService.getDueCards()
      } catch (error) {
        console.error('Failed to fetch due cards:', error)
        throw error
      }
    },
    refetchInterval,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount >= 3) return false
      
      // Don't retry for client errors (4xx)
      if (error instanceof Error && error.message.includes('4')) {
        return false
      }
      
      return true
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}