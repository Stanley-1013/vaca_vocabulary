/**
 * vNext 應用整合組件
 * 
 * 整合所有 vNext 功能的主要組件
 */

import React, { useState } from 'react'
import DailyReviewManager from './DailyReviewManager'
import SettingsPage from './SettingsPage'
import FeatureToggle, { FEATURE_FLAGS, FeatureFlagDebugPanel } from './FeatureToggle'
import { useVNextSettings } from '../hooks/useVNextSettings'

type ViewMode = 'review' | 'settings'

const VNextApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('review')
  const { settings, saveSettings, isLoading: isSettingsLoading } = useVNextSettings()

  const handleMoreCards = async () => {
    // TODO: 實作載入更多卡片的邏輯
    console.log('載入更多卡片...')
    // 模擬 API 呼叫
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('更多卡片載入完成')
  }

  const handleQuiz = async () => {
    // TODO: 實作 AI 測驗功能
    console.log('啟動 AI 測驗...')
    // 模擬 API 呼叫
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('AI 測驗準備完成')
  }

  if (isSettingsLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        <span className="ml-2">載入設定中...</span>
      </div>
    )
  }

  return (
    <div className="vnext-app min-h-screen bg-gray-50">
      {/* 導航列 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">
              智能學習系統 
              <span className="text-sm font-normal text-blue-600 ml-2">vNext 1.1.0</span>
            </h1>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('review')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'review'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📚 複習
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'settings'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ⚙️ 設定
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容區域 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentView === 'review' ? (
          <FeatureToggle 
            featureKey={FEATURE_FLAGS.VNEXT_DAILY_SELECTION}
            defaultEnabled={true}
            fallback={
              <div className="text-center p-8">
                <h2 className="text-xl font-semibold text-gray-600 mb-4">
                  vNext 功能未啟用
                </h2>
                <p className="text-gray-500">
                  請在開發者面板中啟用 "vnext_daily_selection" 功能
                </p>
              </div>
            }
          >
            <DailyReviewManager
              config={settings}
              onMoreCards={handleMoreCards}
              onQuiz={
                <FeatureToggle 
                  featureKey={FEATURE_FLAGS.LLM_QUIZ}
                  defaultEnabled={false}
                >
                  {handleQuiz}
                </FeatureToggle>
              }
            />
          </FeatureToggle>
        ) : (
          <FeatureToggle 
            featureKey={FEATURE_FLAGS.VNEXT_SETTINGS}
            defaultEnabled={true}
            fallback={
              <div className="text-center p-8">
                <h2 className="text-xl font-semibold text-gray-600 mb-4">
                  設定功能未啟用
                </h2>
                <p className="text-gray-500">
                  請在開發者面板中啟用 "vnext_settings" 功能
                </p>
              </div>
            }
          >
            <SettingsPage
              initialSettings={settings}
              onSave={(newSettings) => {
                saveSettings(newSettings)
                // 顯示保存成功提示
                const toast = document.createElement('div')
                toast.textContent = '設定已保存！'
                toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
                document.body.appendChild(toast)
                setTimeout(() => {
                  document.body.removeChild(toast)
                }, 2000)
              }}
            />
          </FeatureToggle>
        )}
      </main>

      {/* 功能狀態指示器 */}
      <div className="fixed top-4 left-4 bg-white rounded-lg shadow-sm border px-3 py-2 text-xs z-40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              settings.algorithm === 'leitner' ? 'bg-blue-500' : 'bg-purple-500'
            }`} />
            <span>{settings.algorithm.toUpperCase()} 算法</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{settings.maxDailyReviews} 張/日上限</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>{settings.minNewPerDay}-{settings.maxNewPerDay} 新詞/日</span>
          </div>
        </div>
      </div>

      {/* 開發者功能面板 */}
      <FeatureFlagDebugPanel />
      
      {/* 版本資訊 */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-400 z-30">
        vNext 1.1.0 • 前端契約模式
      </div>
    </div>
  )
}

export default VNextApp