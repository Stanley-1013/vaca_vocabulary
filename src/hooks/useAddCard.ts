import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { NewCardInput } from '../types'

export const useAddCard = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newCard: NewCardInput): Promise<{ id: string }> => {
      try {
        // Validate input
        if (!newCard.word?.base?.trim()) {
          throw new Error('Word base is required')
        }
        if (!newCard.meaning?.trim()) {
          throw new Error('Meaning is required')
        }
        if (!newCard.example?.trim()) {
          throw new Error('Example is required')
        }

        return await apiService.addCard(newCard)
      } catch (error) {
        console.error('Failed to add card:', error)
        throw error
      }
    },
    onSuccess: (result, newCard) => {
      // Invalidate and refetch due cards to include the new card
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] })
      
      // Optionally invalidate other card-related queries
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      
      console.log(`Successfully added card: ${newCard.word.base} (ID: ${result.id})`)
    },
    onError: (error, newCard) => {
      console.error('Add card mutation failed:', error)
      console.error('Failed card data:', newCard)
      // Could show error toast/notification here
    },
    // Retry logic
    retry: (failureCount, error) => {
      // Don't retry validation errors
      if (error instanceof Error) {
        if (error.message.includes('required') || 
            error.message.includes('invalid') ||
            error.message.includes('malformed')) {
          return false
        }
      }
      
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })
}