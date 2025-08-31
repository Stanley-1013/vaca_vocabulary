// Storage service abstraction for MVP-first architecture
export interface IStorageService {
  getItem<T>(key: string): T | null
  setItem<T>(key: string, value: T): void
  removeItem(key: string): void
}

// Phase 1 MVP: localStorage implementation
class LocalStorageService implements IStorageService {
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error)
      return null
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to set item in localStorage: ${key}`, error)
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error)
    }
  }
}

// Phase 2+: IndexedDB implementation for better performance and storage limits
class IndexedDBService implements IStorageService {
  private dbName = 'vaca-app'
  private version = 1
  
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' })
        }
      }
    })
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction(['storage'], 'readonly')
      const store = transaction.objectStore('storage')
      
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.value : null)
        }
      })
    } catch (error) {
      console.warn(`Failed to get item from IndexedDB: ${key}`, error)
      return null
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction(['storage'], 'readwrite')
      const store = transaction.objectStore('storage')
      
      return new Promise((resolve, reject) => {
        const request = store.put({ key, value })
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error(`Failed to set item in IndexedDB: ${key}`, error)
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction(['storage'], 'readwrite')
      const store = transaction.objectStore('storage')
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.warn(`Failed to remove item from IndexedDB: ${key}`, error)
    }
  }

  // Synchronous fallbacks for compatibility with localStorage interface
  getItem<T>(key: string): T | null {
    // For MVP, fallback to localStorage for synchronous interface
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn(`Failed to get item synchronously: ${key}`, error)
      return null
    }
  }

  setItem<T>(key: string, value: T): void {
    // For MVP, fallback to localStorage for synchronous interface
    try {
      localStorage.setItem(key, JSON.stringify(value))
      // Also store in IndexedDB asynchronously (修復: 調用異步版本)
      this.setAsync(key, value).catch(console.error)
    } catch (error) {
      console.error(`Failed to set item synchronously: ${key}`, error)
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
      // Also remove from IndexedDB asynchronously (修復: 調用異步版本)
      this.removeAsync(key).catch(console.error)
    } catch (error) {
      console.warn(`Failed to remove item synchronously: ${key}`, error)
    }
  }
}

// Factory function to create appropriate storage service
export function createStorageService(): IStorageService {
  // Phase 1 MVP: Always use localStorage
  if (!window.indexedDB || import.meta.env.MODE === 'development') {
    return new LocalStorageService()
  }
  
  // Phase 2+: Use IndexedDB when available and in production
  return new IndexedDBService()
}

// Default export for convenience
export const storageService = createStorageService()