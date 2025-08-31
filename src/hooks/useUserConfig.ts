/**
 * 使用者配置管理 Hook
 * 管理 Google 服務和 LLM API 設定
 */

import { useState, useEffect, useCallback } from 'react'
import { UserConfig } from '../components/Setup/SetupWizard'

const CONFIG_STORAGE_KEY = 'vaca-user-config'

interface UseUserConfigReturn {
  config: UserConfig | null
  isConfigured: boolean
  updateConfig: (newConfig: UserConfig) => void
  clearConfig: () => void
  validateConfig: () => Promise<boolean>
}

export function useUserConfig(): UseUserConfigReturn {
  const [config, setConfig] = useState<UserConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 載入設定
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
      if (stored) {
        const parsedConfig = JSON.parse(stored)
        setConfig(parsedConfig)
      }
    } catch (error) {
      console.error('Failed to load user config:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 更新設定
  const updateConfig = useCallback((newConfig: UserConfig) => {
    setConfig(newConfig)
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig))
  }, [])

  // 清除設定
  const clearConfig = useCallback(() => {
    setConfig(null)
    localStorage.removeItem(CONFIG_STORAGE_KEY)
  }, [])

  // 驗證設定
  const validateConfig = useCallback(async (): Promise<boolean> => {
    if (!config) return false

    try {
      // 驗證 Google 設定
      if (!config.googleClientId || !config.googleSheetId) {
        return false
      }

      // 驗證 LLM 設定
      if (config.llmProvider === 'colab') {
        if (!config.colabNotebookId) return false
      } else {
        if (!config.llmApiKey) return false
      }

      return true
    } catch (error) {
      console.error('Config validation failed:', error)
      return false
    }
  }, [config])

  const isConfigured = config?.setupCompleted ?? false

  return {
    config,
    isConfigured: isConfigured && !isLoading,
    updateConfig,
    clearConfig,
    validateConfig
  }
}