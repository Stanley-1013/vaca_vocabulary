/**
 * 應用程式設定向導
 * 引導使用者完成 Google 服務和 LLM API 設定
 */

import React, { useState, useEffect } from 'react'

export interface UserConfig {
  // Google 服務設定
  googleClientId?: string
  googleClientSecret?: string
  googleSheetId?: string
  googleDriveFolderId?: string
  
  // LLM 服務設定
  llmProvider: 'colab' | 'openai' | 'claude' | 'gemini'
  llmApiKey?: string
  colabNotebookId?: string
  
  // 設定狀態
  setupCompleted: boolean
  googleAuthCompleted: boolean
  llmConfigCompleted: boolean
}

interface SetupWizardProps {
  onComplete: (config: UserConfig) => void
  onSkip?: () => void
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState<UserConfig>({
    llmProvider: 'colab',
    setupCompleted: false,
    googleAuthCompleted: false,
    llmConfigCompleted: false
  })

  const steps = [
    {
      id: 'welcome',
      title: '歡迎使用 VACA 背單字',
      icon: '👋',
      component: <WelcomeStep />
    },
    {
      id: 'google-setup',
      title: 'Google 服務設定',
      icon: '🔧',
      component: <GoogleSetupStep config={config} onUpdate={setConfig} />
    },
    {
      id: 'llm-setup',
      title: 'AI 模型設定',
      icon: '🧠',
      component: <LLMSetupStep config={config} onUpdate={setConfig} />
    },
    {
      id: 'verification',
      title: '設定驗證',
      icon: '✅',
      component: <VerificationStep config={config} />
    },
    {
      id: 'complete',
      title: '設定完成',
      icon: '🎉',
      component: <CompletionStep />
    }
  ]

  const currentStepData = steps[currentStep]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete({ ...config, setupCompleted: true })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'google-setup':
        return config.googleClientId && config.googleSheetId
      case 'llm-setup':
        return config.llmProvider === 'colab' ? 
          config.colabNotebookId : 
          config.llmApiKey
      default:
        return true
    }
  }

  return (
    <div className="setup-wizard min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 進度條 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index !== steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${index <= currentStep 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {index < currentStep ? '✓' : step.icon}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index !== steps.length - 1 && (
                  <div className={`flex-1 mx-4 h-0.5 ${
                    index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 主要內容區 */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {currentStepData.icon} {currentStepData.title}
            </h1>
            <div className="text-sm text-gray-500">
              步驟 {currentStep + 1} / {steps.length}
            </div>
          </div>

          {/* 動態內容 */}
          <div className="min-h-[400px]">
            {currentStepData.component}
          </div>
        </div>

        {/* 導航按鈕 */}
        <div className="flex justify-between items-center">
          <div>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                上一步
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {onSkip && currentStep === 0 && (
              <button
                onClick={onSkip}
                className="px-6 py-2 text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              >
                暫時跳過
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`
                px-6 py-2 rounded-md transition-colors
                ${canProceed()
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {currentStep === steps.length - 1 ? '完成設定' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 歡迎步驟
const WelcomeStep: React.FC = () => (
  <div className="text-center py-8">
    <div className="text-6xl mb-6">📚</div>
    <h2 className="text-2xl font-bold text-gray-800 mb-4">
      歡迎使用 VACA 智能背單字
    </h2>
    <div className="text-gray-600 space-y-4 max-w-2xl mx-auto">
      <p className="text-lg">
        這個應用程式會幫助您高效學習英語單字，使用間隔重複演算法最大化記憶效果。
      </p>
      <p>
        為了提供完整功能，我們需要設定一些服務。別擔心，我們會逐步引導您完成設定。
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-blue-800 mb-2">🔒 隱私保證</h3>
        <p className="text-blue-700 text-sm">
          所有設定都會保存在您的本地設備中，我們不會收集或儲存您的個人資料。
          您將使用自己的 Google 服務和 AI 模型，完全掌控自己的資料。
        </p>
      </div>
    </div>
  </div>
)

// Google 服務設定步驟
interface GoogleSetupStepProps {
  config: UserConfig
  onUpdate: (config: UserConfig) => void
}

const GoogleSetupStep: React.FC<GoogleSetupStepProps> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">🔧 Google 服務設定</h3>
        <p className="text-yellow-700 text-sm">
          VACA 使用 Google Sheets 作為資料庫，Google Drive 儲存檔案。
          您需要建立自己的 Google 專案來使用這些服務。
        </p>
      </div>

      {/* Google Cloud Console 設定指南 */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">
          📋 步驟1：建立 Google Cloud 專案
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>前往 <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
          <li>點擊「建立專案」，輸入專案名稱（如：VACA-背單字）</li>
          <li>在左側選單中，前往「API 和服務」→「程式庫」</li>
          <li>搜尋並啟用以下 API：
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Google Sheets API</li>
              <li>Google Drive API</li>
              <li>Google Apps Script API</li>
            </ul>
          </li>
          <li>前往「憑證」頁面，點擊「建立憑證」→「OAuth 2.0 用戶端 ID」</li>
          <li>選擇「網頁應用程式」，新增授權的 JavaScript 來源：
            <code className="bg-gray-100 px-2 py-1 rounded text-xs ml-2">
              http://localhost:5173
            </code>
          </li>
        </ol>
      </div>

      {/* Google Sheets 設定指南 */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">
          📊 步驟2：建立 Google Sheets 資料庫
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>前往 <a href="https://sheets.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Sheets</a></li>
          <li>建立新的試算表，命名為「VACA-單字卡資料庫」</li>
          <li>設定表頭（第一列）：
            <div className="bg-gray-50 p-2 mt-1 rounded text-xs font-mono">
              id | word.base | meaning | posPrimary | example | tags | box | ease | reps | interval | lastReviewedAt | nextReviewAt | createdAt
            </div>
          </li>
          <li>複製試算表的 ID（網址中 /d/ 後面的長字串）</li>
        </ol>
      </div>

      {/* 設定表單 */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">⚙️ 步驟3：輸入設定資訊</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google OAuth 用戶端 ID
            </label>
            <input
              type="text"
              value={config.googleClientId || ''}
              onChange={(e) => onUpdate({ ...config, googleClientId: e.target.value })}
              placeholder="123456789-abc123.apps.googleusercontent.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              從 Google Cloud Console 的憑證頁面複製
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Sheets ID
            </label>
            <input
              type="text"
              value={config.googleSheetId || ''}
              onChange={(e) => onUpdate({ ...config, googleSheetId: e.target.value })}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              從 Google Sheets 網址中複製 ID
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// LLM 設定步驟
interface LLMSetupStepProps {
  config: UserConfig
  onUpdate: (config: UserConfig) => void
}

const LLMSetupStep: React.FC<LLMSetupStepProps> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-800 mb-2">🧠 AI 模型設定</h3>
        <p className="text-purple-700 text-sm">
          選擇您偏好的 AI 服務來生成個人化單字卡片。
          推薦使用免費的 Colab 方案。
        </p>
      </div>

      {/* LLM 提供商選擇 */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">📍 選擇 AI 服務</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              id: 'colab' as const,
              name: '🔬 Google Colab',
              description: '免費使用，需要手動啟動',
              pros: ['完全免費', '強大的 7B 模型', '完全掌控'],
              cons: ['需要手動設定', '12小時重啟限制']
            },
            {
              id: 'openai' as const,
              name: '🤖 OpenAI GPT',
              description: '付費 API，穩定快速',
              pros: ['穩定可靠', '即時回應', '品質優異'],
              cons: ['需要付費', '按使用量計費']
            }
          ].map((provider) => (
            <div
              key={provider.id}
              className={`
                border-2 rounded-lg p-4 cursor-pointer transition-all
                ${config.llmProvider === provider.id 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => onUpdate({ ...config, llmProvider: provider.id })}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  checked={config.llmProvider === provider.id}
                  onChange={() => onUpdate({ ...config, llmProvider: provider.id })}
                  className="mr-3"
                />
                <div>
                  <h5 className="font-medium">{provider.name}</h5>
                  <p className="text-sm text-gray-600">{provider.description}</p>
                </div>
              </div>
              
              <div className="mt-3 text-xs">
                <div className="text-green-600">
                  ✓ {provider.pros.join(', ')}
                </div>
                <div className="text-orange-600 mt-1">
                  ⚠ {provider.cons.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Colab 設定指南 */}
      {config.llmProvider === 'colab' && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">🔬 Colab 設定指南</h4>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h5 className="font-medium text-blue-800 mb-2">📋 設定步驟</h5>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                <li>
                  下載 Colab Notebook：
                  <a 
                    href="/colab/vaca_llm_generator.ipynb" 
                    download
                    className="ml-2 inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    📥 下載 Notebook
                  </a>
                </li>
                <li>前往 <a href="https://colab.research.google.com/" target="_blank" className="underline">Google Colab</a></li>
                <li>上傳剛下載的 Notebook 檔案</li>
                <li>點擊「執行階段」→「全部執行」</li>
                <li>等待模型載入完成（約5分鐘）</li>
                <li>複製 Notebook 的 ID（網址中的長字串）</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colab Notebook ID
              </label>
              <input
                type="text"
                value={config.colabNotebookId || ''}
                onChange={(e) => onUpdate({ ...config, colabNotebookId: e.target.value })}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* OpenAI 設定 */}
      {config.llmProvider === 'openai' && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">🤖 OpenAI API 設定</h4>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h5 className="font-medium text-yellow-800 mb-2">🔑 取得 API Key</h5>
              <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                <li>前往 <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">OpenAI API Keys</a></li>
                <li>註冊帳號並驗證</li>
                <li>點擊「Create new secret key」</li>
                <li>複製 API Key（以 sk- 開頭）</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={config.llmApiKey || ''}
                onChange={(e) => onUpdate({ ...config, llmApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                API Key 將安全地儲存在您的本地設備
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 驗證步驟
interface VerificationStepProps {
  config: UserConfig
}

const VerificationStep: React.FC<VerificationStepProps> = ({ config }) => {
  const [verificationStatus, setVerificationStatus] = useState<{
    google: 'pending' | 'success' | 'error'
    llm: 'pending' | 'success' | 'error'
  }>({
    google: 'pending',
    llm: 'pending'
  })

  useEffect(() => {
    // 模擬驗證過程
    setTimeout(() => {
      setVerificationStatus({
        google: config.googleClientId && config.googleSheetId ? 'success' : 'error',
        llm: (config.llmProvider === 'colab' ? config.colabNotebookId : config.llmApiKey) ? 'success' : 'error'
      })
    }, 2000)
  }, [config])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">正在驗證您的設定...</h3>
      </div>

      <div className="space-y-4">
        {/* Google 服務驗證 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Google 服務連接</h4>
              <p className="text-sm text-gray-600">驗證 Sheets API 和權限設定</p>
            </div>
            <div className="flex items-center">
              {verificationStatus.google === 'pending' && (
                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              )}
              {verificationStatus.google === 'success' && (
                <div className="text-green-500 text-2xl">✅</div>
              )}
              {verificationStatus.google === 'error' && (
                <div className="text-red-500 text-2xl">❌</div>
              )}
            </div>
          </div>
        </div>

        {/* LLM 服務驗證 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">AI 模型連接</h4>
              <p className="text-sm text-gray-600">
                驗證 {config.llmProvider === 'colab' ? 'Colab Notebook' : 'API Key'} 設定
              </p>
            </div>
            <div className="flex items-center">
              {verificationStatus.llm === 'pending' && (
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              )}
              {verificationStatus.llm === 'success' && (
                <div className="text-green-500 text-2xl">✅</div>
              )}
              {verificationStatus.llm === 'error' && (
                <div className="text-red-500 text-2xl">❌</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 錯誤提示 */}
      {(verificationStatus.google === 'error' || verificationStatus.llm === 'error') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">❌ 驗證失敗</h4>
          <p className="text-red-700 text-sm mb-3">
            請檢查以下項目，然後點擊「上一步」修正設定：
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
            {verificationStatus.google === 'error' && (
              <>
                <li>Google OAuth 用戶端 ID 是否正確</li>
                <li>Google Sheets ID 是否正確</li>
                <li>是否已啟用必要的 API</li>
              </>
            )}
            {verificationStatus.llm === 'error' && (
              <>
                <li>{config.llmProvider === 'colab' ? 'Colab Notebook 是否正在運行' : 'API Key 是否有效'}</li>
                <li>網路連接是否正常</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// 完成步驟
const CompletionStep: React.FC = () => (
  <div className="text-center py-8">
    <div className="text-6xl mb-6">🎉</div>
    <h2 className="text-2xl font-bold text-gray-800 mb-4">
      設定完成！
    </h2>
    <div className="text-gray-600 space-y-4 max-w-2xl mx-auto">
      <p className="text-lg">
        恭喜！您已經成功完成所有設定。現在可以開始使用 VACA 背單字了。
      </p>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-green-800 mb-2">🚀 接下來您可以：</h3>
        <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
          <li>開始新增單字卡片</li>
          <li>使用 AI 智能生成單字</li>
          <li>開始每日複習計劃</li>
          <li>追蹤學習進度</li>
        </ul>
      </div>
    </div>
  </div>
)

export default SetupWizard