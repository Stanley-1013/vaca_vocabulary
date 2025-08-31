/**
 * vNext 應用整合組件
 * 
 * 整合所有 vNext 功能的主要組件
 */

import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import DailyReviewManager from './DailyReviewManager'
import SettingsPage from './SettingsPage'
import FeatureToggle, { FEATURE_FLAGS, FeatureFlagDebugPanel, useFeatureFlag } from './FeatureToggle'
import LanguageSelector from './LanguageSelector'
import { useVNextSettings } from '../hooks/useVNextSettings'
import { useToast } from './Toast'

type ViewMode = 'review' | 'settings'

const VNextApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('review')
  const [showStatusPanel, setShowStatusPanel] = useState(false) // 預設收起
  const [isLoadingMoreCards, setIsLoadingMoreCards] = useState(false)
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false)
  
  const queryClient = useQueryClient()
  const { settings, saveSettings, isLoading: isSettingsLoading } = useVNextSettings()
  const { isEnabled: isQuizEnabled } = useFeatureFlag(FEATURE_FLAGS.LLM_QUIZ, true)
  const { showToast, ToastProvider } = useToast()

  const handleMoreCards = async () => {
    if (isLoadingMoreCards) return
    
    setIsLoadingMoreCards(true)
    try {
      console.log('🔄 載入更多卡片...')
      
      // 實際調用 API 載入更多卡片
      const { apiService } = await import('../services/api')
      const newCards = await apiService.loadMoreCards(5)
      
      if (newCards.length > 0) {
        console.log(`✅ 已載入 ${newCards.length} 張新卡片`)
        showToast(`成功載入 ${newCards.length} 張新卡片！`, 'success')
        
        // 觸發重新查詢卡片資料，不需要重新載入頁面
        await queryClient.invalidateQueries({ queryKey: ['cards', 'due'] })
      } else {
        showToast('沒有更多卡片可載入', 'info')
      }
    } catch (error) {
      console.error('❌ 載入更多卡片失敗:', error)
      showToast('載入卡片失敗，請稍後再試', 'error')
    } finally {
      setIsLoadingMoreCards(false)
    }
  }

  const handleQuiz = async () => {
    if (isLoadingQuiz) return
    
    setIsLoadingQuiz(true)
    try {
      // TODO: 實作 AI 測驗功能
      console.log('🤖 啟動 AI 測驗...')
      console.log('📡 連接 LLM API...')
      // 模擬較長的 LLM API 呼叫
      await new Promise(resolve => setTimeout(resolve, 3000))
      console.log('✅ AI 測驗準備完成')
      alert('🎯 AI 測驗功能尚未完全實作，請等待 Phase 3 LLM 整合完成！')
    } catch (error) {
      console.error('❌ AI 測驗啟動失敗:', error)
      alert('AI 測驗啟動失敗，請稍後再試')
    } finally {
      setIsLoadingQuiz(false)
    }
  }

  const handleResetSetup = () => {
    if (confirm('確定要重置所有設定並回到初始設定頁面嗎？\n\n這將清除：\n• 使用者配置\n• Google API 設定\n• 功能開關狀態\n\n注意：不會清除學習進度和卡片資料')) {
      try {
        // 清除設定相關的 localStorage 項目
        localStorage.removeItem('vaca-user-config')
        localStorage.removeItem('vaca-vnext-settings')
        localStorage.removeItem('featureFlags')
        localStorage.removeItem('google-auth-state')
        
        // 顯示成功訊息
        showToast('設定已重置，即將重新載入...', 'success')
        
        // 延遲重新載入頁面
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (error) {
        console.error('重置設定失敗:', error)
        showToast('重置設定失敗', 'error')
      }
    }
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
      {/* 導航列 - 響應式 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              <span className="hidden sm:inline">智能學習系統</span>
              <span className="sm:hidden">學習系統</span>
              <span className="text-xs sm:text-sm font-normal text-blue-600 ml-1 sm:ml-2">
                <span className="hidden sm:inline">增強版 1.1.0</span>
                <span className="sm:hidden">v1.1</span>
              </span>
            </h1>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {/* 語言選擇器 */}
              <LanguageSelector 
                showText={false} 
                size="sm" 
                className="mr-1 sm:mr-2" 
              />
              
              <button
                onClick={() => setCurrentView('review')}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'review'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="hidden sm:inline">📚 複習</span>
                <span className="sm:hidden">📚</span>
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'settings'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="hidden sm:inline">⚙️ 設定</span>
                <span className="sm:hidden">⚙️</span>
              </button>
              
              {/* 重置設定按鈕 */}
              <button
                onClick={handleResetSetup}
                className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg font-medium text-xs sm:text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                title="清除所有設定，回到初始設定頁面"
              >
                <span className="hidden sm:inline">🔄 重設</span>
                <span className="sm:hidden">🔄</span>
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
                  增強功能未啟用
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
              onQuiz={isQuizEnabled ? handleQuiz : undefined}
              busy={isLoadingMoreCards || isLoadingQuiz}
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
                // 修復：使用 React Toast 組件替代直接 DOM 操作
                showToast('設定已保存！', 'success', 2000)
              }}
            />
          </FeatureToggle>
        )}
      </main>

      {/* 功能狀態指示器 - 可收起/展開 */}
      <div className="fixed top-2 left-2 sm:top-4 sm:left-4 z-40">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* 切換按鈕 */}
          <button
            onClick={() => setShowStatusPanel(!showStatusPanel)}
            className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-2 text-xs hover:bg-gray-50 transition-colors rounded-lg w-full"
          >
            <div className={`w-2 h-2 rounded-full ${
              settings.algorithm === 'leitner' ? 'bg-blue-500' : 'bg-purple-500'
            }`} />
            <span className="hidden sm:inline">狀態</span>
            <span className="ml-auto text-gray-400">
              {showStatusPanel ? '▼' : '▶'}
            </span>
          </button>
          
          {/* 展開的狀態面板 */}
          {showStatusPanel && (
            <div className="border-t px-3 py-2 text-xs space-y-1">
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
          )}
        </div>
      </div>

      {/* 開發者功能面板 */}
      <FeatureFlagDebugPanel />
      
      {/* 版本資訊 - 響應式位置 */}
      <div className="fixed bottom-2 left-2 sm:bottom-4 sm:left-4 text-xs text-gray-400 z-30">
        <span className="hidden sm:inline">智能學習系統 1.1.0 • 增強版</span>
        <span className="sm:hidden">v1.1.0</span>
      </div>

      {/* 修復：添加 Toast 提供者 */}
      <ToastProvider />
    </div>
  )
}

export default VNextApp