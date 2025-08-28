/**
 * vNext 設定管理 Hook
 * 
 * 管理 vNext 功能的設定參數
 */

import { useState, useEffect } from 'react'
import { Algorithm, PriorityConfig } from '../types'

export interface VNextSettings {
  maxDailyReviews: number
  minNewPerDay: number
  maxNewPerDay: number
  algorithm: Algorithm
  againGapSequence: number[]
  priorityWeights: PriorityConfig
}

const defaultSettings: VNextSettings = {
  maxDailyReviews: 20,
  minNewPerDay: 3,
  maxNewPerDay: 5,
  algorithm: 'leitner',
  againGapSequence: [2, 5, 10],
  priorityWeights: { ease: 0.5, overdueDays: 0.3, box: 0.2 }
}

const STORAGE_KEY = 'vNextSettings'

export const useVNextSettings = () => {
  const [settings, setSettings] = useState<VNextSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  // 載入設定
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.warn('Failed to load vNext settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 保存設定
  const saveSettings = (newSettings: Partial<VNextSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save vNext settings:', error)
    }
  }

  // 重置設定
  const resetSettings = () => {
    setSettings(defaultSettings)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to reset vNext settings:', error)
    }
  }

  return {
    settings,
    isLoading,
    saveSettings,
    resetSettings
  }
}