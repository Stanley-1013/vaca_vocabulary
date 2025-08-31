/**
 * 特性開關組件
 * 
 * 用於控制 vNext 功能的啟用/停用
 */

import React, { useState, useEffect } from 'react'

interface FeatureToggleProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  featureKey: string
  defaultEnabled?: boolean
}

export const FEATURE_FLAGS = {
  // vNext 功能開關
  VNEXT_REVIEW_CONTROLS: 'vnext_review_controls',
  VNEXT_DAILY_SELECTION: 'vnext_daily_selection', 
  VNEXT_COMPLETION_PAGE: 'vnext_completion_page',
  VNEXT_SETTINGS: 'vnext_settings',
  VNEXT_AGAIN_BUTTON: 'vnext_again_button',
  VNEXT_INTERVAL_DISPLAY: 'vnext_interval_display',
  
  // 後端整合功能
  BACKEND_INTEGRATION: 'backend_integration',
  
  // 未來功能預留
  LLM_QUIZ: 'llm_quiz',
  LLM_NEW_WORDS: 'llm_new_words',
  TELEMETRY: 'telemetry'
} as const

type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS]

class FeatureFlagManager {
  private static instance: FeatureFlagManager
  private flags: Map<string, boolean> = new Map()
  private readonly STORAGE_KEY = 'featureFlags'

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager()
    }
    return FeatureFlagManager.instance
  }

  constructor() {
    this.loadFlags()
  }

  private loadFlags(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const flags = JSON.parse(stored)
        Object.entries(flags).forEach(([key, value]) => {
          this.flags.set(key, Boolean(value))
        })
      }
    } catch (error) {
      console.warn('Failed to load feature flags:', error)
    }
  }

  private saveFlags(): void {
    try {
      const flagsObj = Object.fromEntries(this.flags)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(flagsObj))
    } catch (error) {
      console.error('Failed to save feature flags:', error)
    }
  }

  isEnabled(flag: FeatureFlag, defaultValue: boolean = false): boolean {
    return this.flags.get(flag) ?? defaultValue
  }

  setFlag(flag: FeatureFlag, enabled: boolean): void {
    this.flags.set(flag, enabled)
    this.saveFlags()
  }

  getAllFlags(): Record<string, boolean> {
    return Object.fromEntries(this.flags)
  }

  resetFlags(): void {
    this.flags.clear()
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to reset feature flags:', error)
    }
  }
}

const flagManager = FeatureFlagManager.getInstance()

/**
 * Hook 用於管理特性開關
 */
export const useFeatureFlag = (flag: FeatureFlag, defaultEnabled: boolean = false) => {
  const [isEnabled, setIsEnabled] = useState(() => 
    flagManager.isEnabled(flag, defaultEnabled)
  )

  const toggleFlag = (enabled: boolean) => {
    flagManager.setFlag(flag, enabled)
    setIsEnabled(enabled)
  }

  return {
    isEnabled,
    toggleFlag
  }
}

/**
 * 特性開關組件
 */
const FeatureToggle: React.FC<FeatureToggleProps> = ({
  children,
  fallback = null,
  featureKey,
  defaultEnabled = false
}) => {
  const { isEnabled } = useFeatureFlag(featureKey as FeatureFlag, defaultEnabled)

  return isEnabled ? <>{children}</> : <>{fallback}</>
}

/**
 * 開發者調試面板組件
 */
export const FeatureFlagDebugPanel: React.FC<{ visible?: boolean }> = ({ 
  visible = false 
}) => {
  const [isVisible, setIsVisible] = useState(visible)
  const [flags, setFlags] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isVisible) {
      setFlags(flagManager.getAllFlags())
    }
  }, [isVisible])

  const handleToggle = (flag: string, enabled: boolean) => {
    flagManager.setFlag(flag as FeatureFlag, enabled)
    setFlags(prev => ({ ...prev, [flag]: enabled }))
  }

  const handleReset = () => {
    flagManager.resetFlags()
    setFlags({})
  }

  // 開發模式下顯示切換按鈕
  if (import.meta.env.MODE === 'development') {
    return (
      <>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="fixed bottom-2 right-2 sm:bottom-4 sm:right-16 bg-gray-800 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs z-50 shadow-lg"
          style={{ fontSize: '10px' }}
        >
          <span className="hidden sm:inline">🏳️ FF</span>
          <span className="sm:hidden">🏳️</span>
        </button>

        {isVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Feature Flags</h3>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {Object.values(FEATURE_FLAGS).map(flag => (
                  <div key={flag} className="flex items-center justify-between">
                    <label className="text-sm font-mono">{flag}</label>
                    <input
                      type="checkbox"
                      checked={flags[flag] || false}
                      onChange={(e) => handleToggle(flag, e.target.checked)}
                      className="ml-2"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between">
                <button
                  onClick={handleReset}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return null
}

export default FeatureToggle