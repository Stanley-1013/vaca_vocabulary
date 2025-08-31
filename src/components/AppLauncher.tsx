/**
 * 應用程式啟動器
 * 檢查設定狀態，決定顯示設定向導或主應用程式
 */

import React, { useState, useEffect } from 'react'
import { useUserConfig } from '../hooks/useUserConfig'
import { useGoogleAPI } from '../hooks/useGoogleAPI'
import SetupWizard, { UserConfig } from './Setup/SetupWizard'
import VNextApp from './VNextApp'

interface AppLauncherProps {
  // 可選的初始設定（用於測試）
  initialConfig?: UserConfig
}

const AppLauncher: React.FC<AppLauncherProps> = ({ initialConfig }) => {
  const { isConfigured, updateConfig } = useUserConfig()
  const { isAuthenticated, initializeAPI, authenticate } = useGoogleAPI()
  const [currentView, setCurrentView] = useState<'loading' | 'setup' | 'authenticating' | 'app'>('loading')
  const [skipSetup, setSkipSetup] = useState(false)

  // 決定顯示哪個視圖
  useEffect(() => {
    const determineView = async () => {
      // 如果有初始設定，直接使用
      if (initialConfig && !isConfigured) {
        updateConfig(initialConfig)
        return
      }

      // 如果選擇跳過設定，直接進入應用
      if (skipSetup) {
        setCurrentView('app')
        return
      }

      // 如果未設定，顯示設定向導
      if (!isConfigured) {
        setCurrentView('setup')
        return
      }

      // 如果已設定但未驗證，開始驗證
      if (!isAuthenticated) {
        setCurrentView('authenticating')
        
        try {
          const initialized = await initializeAPI()
          if (initialized) {
            const authenticated = await authenticate()
            if (authenticated) {
              setCurrentView('app')
            } else {
              // 驗證失敗，回到設定
              setCurrentView('setup')
            }
          } else {
            // 初始化失敗，回到設定
            setCurrentView('setup')
          }
        } catch (error) {
          console.error('驗證過程失敗:', error)
          setCurrentView('setup')
        }
      } else {
        // 已驗證，進入主應用
        setCurrentView('app')
      }
    }

    determineView()
  }, [isConfigured, isAuthenticated, initialConfig, skipSetup, updateConfig, initializeAPI, authenticate])

  // 設定完成處理
  const handleSetupComplete = (newConfig: UserConfig) => {
    updateConfig(newConfig)
    setCurrentView('authenticating')
  }

  // 跳過設定處理
  const handleSkipSetup = () => {
    setSkipSetup(true)
    setCurrentView('app')
  }

  // 渲染不同視圖
  const renderView = () => {
    switch (currentView) {
      case 'loading':
        return <LoadingView />
      
      case 'setup':
        return (
          <SetupWizard
            onComplete={handleSetupComplete}
            onSkip={handleSkipSetup}
          />
        )
      
      case 'authenticating':
        return <AuthenticatingView />
      
      case 'app':
        return <AppView />
      
      default:
        return <LoadingView />
    }
  }

  return <div className="app-launcher">{renderView()}</div>
}

// 載入視圖
const LoadingView: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">VACA 背單字</h2>
      <p className="text-gray-600">正在載入...</p>
    </div>
  </div>
)

// 驗證視圖
const AuthenticatingView: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-bounce text-6xl mb-6">🔐</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">正在驗證 Google 服務</h2>
      <p className="text-gray-600 mb-4">請稍候，正在建立安全連線...</p>
      
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full mr-3"></div>
            <span className="text-sm text-gray-700">初始化 Google API</span>
          </div>
          <div className="flex items-center">
            <div className="animate-pulse w-5 h-5 bg-green-200 rounded-full mr-3"></div>
            <span className="text-sm text-gray-700">驗證使用者權限</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 bg-gray-200 rounded-full mr-3"></div>
            <span className="text-sm text-gray-500">連接服務</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// 主應用視圖 - 包含模式切換
const AppView: React.FC = () => {
  const [useVNext] = useState(true) // 預設使用 vNext 模式

  return (
    <div className="app">
      {/* 如果需要，可以在這裡添加模式切換按鈕 */}
      {/* 使用 React.Suspense 來處理潛在的載入問題 */}
      <React.Suspense fallback={
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-2">載入應用中...</span>
        </div>
      }>
        <VNextApp />
      </React.Suspense>
    </div>
  )
}

export default AppLauncher