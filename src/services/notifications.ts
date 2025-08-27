// Notifications service abstraction for cross-platform support
export interface INotificationService {
  scheduleReviewReminder(cardId: string, nextReviewAt: Date): Promise<void>
  cancelReminder(cardId: string): Promise<void>
  requestPermission?(): Promise<boolean>
}

// Phase 1 MVP: Stub implementation (no actual notifications)
class StubNotificationService implements INotificationService {
  async scheduleReviewReminder(cardId: string, nextReviewAt: Date): Promise<void> {
    console.log(`[MVP Stub] Would schedule reminder for card ${cardId} at ${nextReviewAt.toISOString()}`)
    
    // Store reminder info for future implementation
    const reminders = JSON.parse(localStorage.getItem('vaca-reminders') || '{}')
    reminders[cardId] = nextReviewAt.toISOString()
    localStorage.setItem('vaca-reminders', JSON.stringify(reminders))
  }

  async cancelReminder(cardId: string): Promise<void> {
    console.log(`[MVP Stub] Would cancel reminder for card ${cardId}`)
    
    // Remove from stored reminders
    const reminders = JSON.parse(localStorage.getItem('vaca-reminders') || '{}')
    delete reminders[cardId]
    localStorage.setItem('vaca-reminders', JSON.stringify(reminders))
  }
}

// Phase 2+: Web Notifications API implementation
class WebNotificationService implements INotificationService {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async scheduleReviewReminder(cardId: string, nextReviewAt: Date): Promise<void> {
    const hasPermission = await this.requestPermission()
    if (!hasPermission) {
      console.warn('Notification permission not granted')
      return
    }

    // Calculate delay until review time
    const now = new Date()
    const delay = nextReviewAt.getTime() - now.getTime()
    
    if (delay <= 0) {
      // Already due, could show immediately or skip
      return
    }

    // Use setTimeout for short delays (< 24 hours)
    // For longer delays, would need a service worker
    if (delay < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        new Notification('Time to review!', {
          body: 'You have cards ready for review',
          icon: '/favicon.ico',
          tag: cardId, // Prevents duplicate notifications
          requireInteraction: false
        })
      }, delay)
    }

    // Store the scheduled reminder
    const reminders = JSON.parse(localStorage.getItem('vaca-reminders') || '{}')
    reminders[cardId] = nextReviewAt.toISOString()
    localStorage.setItem('vaca-reminders', JSON.stringify(reminders))
  }

  async cancelReminder(cardId: string): Promise<void> {
    // Remove from stored reminders
    const reminders = JSON.parse(localStorage.getItem('vaca-reminders') || '{}')
    delete reminders[cardId]
    localStorage.setItem('vaca-reminders', JSON.stringify(reminders))
    
    // Note: Cannot cancel setTimeout without storing the ID
    // This would be handled better with Service Workers in production
  }
}

// Phase 3+: Capacitor LocalNotifications for mobile
class CapacitorNotificationService implements INotificationService {
  async scheduleReviewReminder(cardId: string, nextReviewAt: Date): Promise<void> {
    // This would use Capacitor's LocalNotifications plugin
    console.log(`[Capacitor] Would schedule native notification for card ${cardId}`)
    
    // Example implementation:
    // import { LocalNotifications } from '@capacitor/local-notifications';
    // 
    // await LocalNotifications.schedule({
    //   notifications: [{
    //     title: 'Time to review!',
    //     body: 'You have cards ready for review',
    //     id: parseInt(cardId.replace('card-', '')),
    //     schedule: { at: nextReviewAt },
    //     sound: null,
    //     attachments: null,
    //     actionTypeId: '',
    //     extra: { cardId }
    //   }]
    // });
  }

  async cancelReminder(cardId: string): Promise<void> {
    console.log(`[Capacitor] Would cancel native notification for card ${cardId}`)
    
    // await LocalNotifications.cancel({
    //   notifications: [{ id: parseInt(cardId.replace('card-', '')) }]
    // });
  }
}

// Factory function to create appropriate notification service
export function createNotificationService(): INotificationService {
  // Phase 1 MVP: Always use stub
  if (import.meta.env.MODE === 'development' || !window.Notification) {
    return new StubNotificationService()
  }
  
  // Check if running in Capacitor (Phase 3+)
  // @ts-ignore - Capacitor global may not be available
  if (window.Capacitor) {
    return new CapacitorNotificationService()
  }
  
  // Phase 2+: Use Web Notifications
  return new WebNotificationService()
}

// Default export for convenience
export const notificationService = createNotificationService()