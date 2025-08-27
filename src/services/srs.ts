import { Card, Quality } from '../types'

// Leitner Box intervals (in days)
export const LEITNER_INTERVALS = [0, 1, 2, 3, 7, 14] as const

/**
 * Leitner Box System - Simple spaced repetition algorithm
 * 
 * @param card - Current card state
 * @param quality - User rating (1=hard, 2=normal, 3=easy)
 * @param reviewDate - Date of review (defaults to now)
 * @returns Updated card with new SRS values
 */
export function nextByLeitner(
  card: Card, 
  quality: Quality, 
  reviewDate: Date = new Date()
): Card {
  let newBox = card.box
  
  // Box progression logic
  switch (quality) {
    case 3: // Easy - move up one box
      newBox = Math.min(5, card.box + 1)
      break
    case 2: // Normal - stay in same box
      newBox = card.box
      break
    case 1: // Hard - back to box 1
      newBox = 1
      break
  }
  
  // Calculate next review date
  const intervalDays = LEITNER_INTERVALS[newBox]
  const nextReviewAt = new Date(reviewDate)
  nextReviewAt.setDate(reviewDate.getDate() + intervalDays)
  
  return {
    ...card,
    box: newBox as 1|2|3|4|5,
    reps: card.reps + 1,
    interval: intervalDays,
    lastReviewedAt: reviewDate.toISOString(),
    nextReviewAt: nextReviewAt.toISOString()
  }
}

/**
 * SM-2 Algorithm - More sophisticated spaced repetition
 * Based on SuperMemo-2 algorithm by Piotr Wozniak
 * 
 * @param card - Current card state
 * @param quality - User rating (1=hard, 2=normal, 3=easy)
 * @param reviewDate - Date of review (defaults to now)
 * @returns Updated card with new SRS values
 */
export function nextBySM2(
  card: Card,
  quality: Quality,
  reviewDate: Date = new Date()
): Card {
  let newInterval = card.interval
  let newEase = card.ease
  const newReps = card.reps + 1
  
  if (quality >= 3) {
    // Correct response
    if (card.reps === 0) {
      newInterval = 1
    } else if (card.reps === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(card.interval * card.ease)
    }
  } else {
    // Incorrect response - restart
    newInterval = 1
  }
  
  // Update ease factor (only for quality ratings 3 and above)
  if (quality >= 3) {
    // SM-2 ease factor formula: new_ease = old_ease + (0.1 - (5-quality) * (0.08 + (5-quality) * 0.02))
    // Simplified for 3-point scale:
    const qFactor = quality === 3 ? 5 : 3 // Map to original 5-point scale
    newEase = card.ease + (0.1 - (5 - qFactor) * (0.08 + (5 - qFactor) * 0.02))
    
    // Minimum ease factor is 1.3
    if (newEase < 1.3) {
      newEase = 1.3
    }
  }
  
  // Calculate next review date
  const nextReviewAt = new Date(reviewDate)
  nextReviewAt.setDate(reviewDate.getDate() + newInterval)
  
  return {
    ...card,
    ease: Number(newEase.toFixed(2)),
    reps: newReps,
    interval: newInterval,
    lastReviewedAt: reviewDate.toISOString(),
    nextReviewAt: nextReviewAt.toISOString()
  }
}

/**
 * Get cards due for review
 * 
 * @param cards - Array of cards
 * @param date - Reference date (defaults to now)
 * @returns Cards that are due for review
 */
export function getDueCards(cards: Card[], date: Date = new Date()): Card[] {
  return cards.filter(card => {
    const nextReview = new Date(card.nextReviewAt)
    return nextReview <= date
  }).sort((a, b) => {
    // Sort by next review date (earliest first)
    return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
  })
}

/**
 * Calculate learning progress statistics
 * 
 * @param cards - Array of cards
 * @returns Statistics about learning progress
 */
export function calculateStats(cards: Card[]) {
  if (cards.length === 0) {
    return {
      total: 0,
      due: 0,
      learned: 0,
      mastery: 0,
      averageInterval: 0
    }
  }
  
  const now = new Date()
  const dueCards = getDueCards(cards, now)
  const learnedCards = cards.filter(card => card.reps > 0)
  const masteredCards = cards.filter(card => card.box >= 4 || card.interval >= 14)
  
  const totalInterval = cards.reduce((sum, card) => sum + card.interval, 0)
  const averageInterval = totalInterval / cards.length
  
  return {
    total: cards.length,
    due: dueCards.length,
    learned: learnedCards.length,
    mastery: masteredCards.length,
    averageInterval: Math.round(averageInterval * 100) / 100
  }
}