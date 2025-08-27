import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Card } from './components/Card/Card'
import { useDueCards } from './hooks/useDueCards'
import { useReviewCard } from './hooks/useReviewCard'
import { Quality } from './types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
})

function StudySession() {
  const { data: dueCards = [], isLoading, error } = useDueCards()
  const reviewCardMutation = useReviewCard()
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0)

  const currentCard = dueCards[currentCardIndex]

  const handleReview = async (quality: Quality) => {
    if (!currentCard) return

    try {
      await reviewCardMutation.mutateAsync({
        id: currentCard.id,
        quality,
      })

      // Move to next card or reset to first card if at end
      setCurrentCardIndex((prevIndex) => {
        const nextIndex = prevIndex + 1
        return nextIndex >= dueCards.length ? 0 : nextIndex
      })
    } catch (error) {
      console.error('Review failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl animate-pulse">Loading cards...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">
          Error loading cards: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  if (dueCards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">🎉 All caught up!</h2>
          <p className="text-lg">No cards due for review right now.</p>
          <p className="text-sm mt-2 opacity-75">Check back later for more reviews.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {dueCards.length > 1 && (
        <div className="progress-indicator">
          {currentCardIndex + 1} / {dueCards.length}
        </div>
      )}
      <Card
        card={currentCard}
        onReview={handleReview}
        isLoading={reviewCardMutation.isPending}
      />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <StudySession />
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App