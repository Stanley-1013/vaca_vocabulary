import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { notificationService } from '../services/notifications'
import { Card, Quality } from '../types'

interface ReviewCardData {
  id: string
  quality: Quality
}

export const useReviewCard = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, quality }: ReviewCardData): Promise<Card> => {
      try {
        const updatedCard = await apiService.reviewCard(id, quality)
        
        // Schedule notification for next review (optional)
        if (updatedCard.nextReviewAt) {
          try {
            await notificationService.scheduleReviewReminder(
              updatedCard.id,
              new Date(updatedCard.nextReviewAt)
            )
          } catch (notificationError) {
            console.warn('Failed to schedule review reminder:', notificationError)
            // Don't fail the mutation if notification scheduling fails
          }
        }
        
        return updatedCard
      } catch (error) {
        console.error('Failed to review card:', error)
        throw error
      }
    },
    onSuccess: (updatedCard, { id }) => {
      // Update the due cards cache
      queryClient.setQueryData(['cards', 'due'], (oldCards: Card[] | undefined) => {
        if (!oldCards) return []
        
        // Remove the reviewed card from due cards if it's no longer due
        const nextReview = new Date(updatedCard.nextReviewAt)
        const now = new Date()
        
        if (nextReview > now) {
          // Card is no longer due, remove it
          return oldCards.filter(card => card.id !== id)
        } else {
          // Update the card in place
          return oldCards.map(card => 
            card.id === id ? updatedCard : card
          )
        }
      })

      // Optionally update other caches that might contain this card
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      
      // Show success feedback (could be moved to component level)
      console.log(`Card reviewed with quality ${updatedCard.interval ? 'high' : 'low'}`)
    },
    onError: (error) => {
      console.error('Review card mutation failed:', error)
      // Could show error toast/notification here
    },
    // Optimistic updates
    onMutate: async ({ id, quality }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cards', 'due'] })
      
      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<Card[]>(['cards', 'due'])
      
      // Optimistically update the cache
      queryClient.setQueryData<Card[]>(['cards', 'due'], (oldCards) => {
        if (!oldCards) return []
        
        return oldCards.map(card => {
          if (card.id === id) {
            // Simple optimistic update - just mark as reviewed
            return {
              ...card,
              lastReviewedAt: new Date().toISOString(),
              reps: card.reps + 1
            }
          }
          return card
        })
      })
      
      // Return a context object with the snapshotted value
      return { previousCards }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] })
    }
  })
}