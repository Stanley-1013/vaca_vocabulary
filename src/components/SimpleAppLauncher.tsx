/**
 * 簡化版應用啟動器 - 自用版本
 * 移除複雜的設定，直接使用預設配置
 */

import React, { useState, useEffect } from 'react'
import SimpleSetupWizard, { SimpleUserConfig } from './Setup/SimpleSetupWizard'
import DailyReviewManager from './DailyReviewManager'
import { useToast } from './Toast'

const SimpleAppLauncher: React.FC = () => {
  const [userConfig, setUserConfig] = useState<SimpleUserConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { ToastProvider } = useToast()

  // 檢查是否已經完成設定
  useEffect(() => {
    const savedConfig = localStorage.getItem('simpleUserConfig')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig) as SimpleUserConfig
        if (config.setupCompleted) {
          setUserConfig(config)
        }
      } catch (error) {
        console.error('Failed to parse saved config:', error)
        localStorage.removeItem('simpleUserConfig')
      }
    }
    setIsLoading(false)
  }, [])

  const handleSetupComplete = (config: SimpleUserConfig) => {
    // 保存設定到 localStorage
    localStorage.setItem('simpleUserConfig', JSON.stringify(config))

    // 同時保存簡化的 vNext 設定
    const vNextSettings = {
      maxDailyReviews: config.dailyGoal * 4, // 複習量 = 新單字的 4 倍
      minNewPerDay: Math.max(1, config.dailyGoal - 2),
      maxNewPerDay: config.dailyGoal,
      algorithm: 'leitner',
      againGapSequence: [2, 5, 10],
      priorityWeights: { ease: 0.5, overdueDays: 0.3, box: 0.2 },
      llmConfig: {
        provider: 'gemini', // 固定使用 Gemini
        driveBasePath: '/VACA_LLM',
        modelName: 'gemini-1.5-flash'
      },
      preferredExamTypes: ['General'],
      defaultDifficulty: config.difficulty,
      generateCount: config.dailyGoal,
      preferredTopics: config.topics
    }

    localStorage.setItem('vNextSettings', JSON.stringify(vNextSettings))

    setUserConfig(config)
  }

  const handleReset = () => {
    localStorage.removeItem('simpleUserConfig')
    localStorage.removeItem('vNextSettings')
    setUserConfig(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (!userConfig?.setupCompleted) {
    return <SimpleSetupWizard onComplete={handleSetupComplete} />
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* 簡化的頂部導航 */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-800">📚 VACA 背單字</h1>
                <p className="text-sm text-gray-600">
                  每日目標：{userConfig.dailyGoal} 個新單字 |
                  程度：{userConfig.difficulty === 'beginner' ? '初學' :
                        userConfig.difficulty === 'intermediate' ? '中等' : '進階'}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                重新設定
              </button>
            </div>
          </div>
        </header>

        {/* 主要內容區域 */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <DailyReviewManager />
        </main>
      </div>
    </ToastProvider>
  )
}

export default SimpleAppLauncher