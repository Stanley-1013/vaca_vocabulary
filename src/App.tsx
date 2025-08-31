import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import VNextApp from './components/VNextApp'
import Card from './components/Card/Card'
import ErrorBoundary from './components/ErrorBoundary'
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
  const [useVNext, setUseVNext] = React.useState(true) // 預設使用 vNext

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          {/* 模式切換按鈕 - 響應式位置 */}
          <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50">
            <button
              onClick={() => setUseVNext(!useVNext)}
              className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-800 text-white rounded text-xs sm:text-sm hover:bg-gray-700 transition-colors shadow-lg"
            >
              <span className="hidden sm:inline">{useVNext ? '🚀 增強版' : '📚 經典版'}</span>
              <span className="sm:hidden">{useVNext ? '🚀' : '📚'}</span>
            </button>
          </div>

          <ErrorBoundary>
            {useVNext ? <VNextApp /> : <StudySession />}
          </ErrorBoundary>
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App