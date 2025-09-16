/**
 * 改良版設定向導 - 適度簡化版本
 * 保留必要功能但簡化流程
 */

import React, { useState } from 'react'

export interface ImprovedUserConfig {
  // Google Sheets 設定
  googleSheetId: string

  // AI 設定（簡化為只要 API Key）
  geminiApiKey: string

  // 學習偏好
  dailyGoal: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  preferredTopics: string[]
  examTypes: string[] // 考試類型

  // 設定狀態
  setupCompleted: boolean
}

interface ImprovedSetupWizardProps {
  onComplete: (config: ImprovedUserConfig) => void
}

const ImprovedSetupWizard: React.FC<ImprovedSetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState<ImprovedUserConfig>({
    googleSheetId: '1eZmBKuJQocALTnA1VZem6oushLIRq4sGKvKbyxfohTM', // 預設值
    geminiApiKey: '',
    dailyGoal: 5,
    difficulty: 'intermediate',
    preferredTopics: ['general'],
    examTypes: ['general'],
    setupCompleted: false
  })

  const steps = [
    { id: 'welcome', title: '歡迎使用', icon: '👋' },
    { id: 'google', title: 'Google Sheets', icon: '📊' },
    { id: 'ai', title: 'AI 設定', icon: '🧠' },
    { id: 'preferences', title: '學習偏好', icon: '🎯' }
  ]

  const topicOptions = [
    { id: 'general', label: '日常生活', emoji: '🏠' },
    { id: 'business', label: '商業', emoji: '💼' },
    { id: 'technology', label: '科技', emoji: '💻' },
    { id: 'travel', label: '旅遊', emoji: '✈️' },
    { id: 'science', label: '科學', emoji: '🔬' },
    { id: 'health', label: '健康', emoji: '🏥' }
  ]

  const examTypeOptions = [
    { id: 'general', label: '通用英語', emoji: '📚' },
    { id: 'ielts', label: 'IELTS', emoji: '🇬🇧' },
    { id: 'toefl', label: 'TOEFL', emoji: '🇺🇸' },
    { id: 'toeic', label: 'TOEIC', emoji: '💼' },
    { id: 'gre', label: 'GRE', emoji: '🎓' },
    { id: 'sat', label: 'SAT', emoji: '📖' }
  ]

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
    switch (currentStep) {
      case 1: // Google Sheets
        return config.googleSheetId.trim() !== ''
      case 2: // AI 設定
        return config.geminiApiKey.trim() !== ''
      default:
        return true
    }
  }

  const toggleTopic = (topicId: string) => {
    const topics = config.preferredTopics.includes(topicId)
      ? config.preferredTopics.filter(t => t !== topicId)
      : [...config.preferredTopics, topicId]

    setConfig(prev => ({ ...prev, preferredTopics: topics.length === 0 ? ['general'] : topics }))
  }

  const toggleExamType = (examId: string) => {
    const exams = config.examTypes.includes(examId)
      ? config.examTypes.filter(e => e !== examId)
      : [...config.examTypes, examId]

    setConfig(prev => ({ ...prev, examTypes: exams.length === 0 ? ['general'] : exams }))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 歡迎
        return (
          <div className="text-center">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              歡迎使用 VACA 背單字
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              VACA 使用 AI 和間隔重複算法，幫您更有效地學習英語單字。
              讓我們先完成一些基本設定。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-medium text-blue-800 mb-2">🔐 關於資料安全</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 您的 API Key 只儲存在本地</li>
                <li>• 學習資料透過 Google Sheets 同步</li>
                <li>• 所有設定都可以隨時修改</li>
              </ul>
            </div>
          </div>
        )

      case 1: // Google Sheets
        return (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">設定 Google Sheets</h2>
              <p className="text-gray-600">您的學習資料將儲存在 Google Sheets 中</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Sheets ID
                </label>
                <input
                  type="text"
                  value={config.googleSheetId}
                  onChange={(e) => setConfig(prev => ({ ...prev, googleSheetId: e.target.value }))}
                  placeholder="請輸入 Google Sheets ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  可以從 Google Sheets URL 中找到：docs.google.com/spreadsheets/d/<strong>這裡是ID</strong>/edit
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">📋 使用預設 Sheet</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  已為您預填了一個測試用的 Google Sheet。如果您想使用自己的 Sheet，請：
                </p>
                <ol className="text-sm text-yellow-700 space-y-1 ml-4">
                  <li>1. 複製我們的範本 Sheet</li>
                  <li>2. 將您的 Sheet ID 貼上上方</li>
                  <li>3. 確保 Sheet 有正確的欄位格式</li>
                </ol>
              </div>
            </div>
          </div>
        )

      case 2: // AI 設定
        return (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🧠</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">設定 AI 單字生成</h2>
              <p className="text-gray-600">使用 Google Gemini AI 為您生成個人化單字卡</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={config.geminiApiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                  placeholder="請輸入您的 Gemini API Key"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">🔑 如何取得 API Key</h3>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. 前往 <code className="bg-green-100 px-1 rounded">ai.google.dev</code></li>
                  <li>2. 點擊 "Get API Key"</li>
                  <li>3. 建立新的 API Key</li>
                  <li>4. 複製並貼上到上方欄位</li>
                </ol>
                <p className="text-xs text-green-600 mt-2">
                  💡 Gemini API 有免費額度，足夠日常學習使用
                </p>
              </div>
            </div>
          </div>
        )

      case 3: // 學習偏好
        return (
          <div>
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">設定學習偏好</h2>
              <p className="text-gray-600">告訴我們您的學習目標，我們會為您調整</p>
            </div>

            <div className="space-y-8">
              {/* 每日目標 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  每天想學習幾個新單字？
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 5, 10].map(goal => (
                    <button
                      key={goal}
                      onClick={() => setConfig(prev => ({ ...prev, dailyGoal: goal }))}
                      className={`p-4 rounded-lg border-2 transition-colors text-center ${
                        config.dailyGoal === goal
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg font-medium">{goal} 個</div>
                      <div className="text-xs text-gray-500">
                        {goal === 3 ? '輕鬆學習' : goal === 5 ? '穩定進步' : '快速提升'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 程度選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  您的英語程度？
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'beginner', label: '初學者', desc: '基礎單字，簡單句型' },
                    { id: 'intermediate', label: '中等程度', desc: '日常對話，工作場合' },
                    { id: 'advanced', label: '進階', desc: '學術用語，專業詞彙' }
                  ].map(level => (
                    <button
                      key={level.id}
                      onClick={() => setConfig(prev => ({ ...prev, difficulty: level.id as any }))}
                      className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                        config.difficulty === level.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-gray-500">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 主題選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  感興趣的學習主題（可複選）
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {topicOptions.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`p-3 rounded-lg border-2 transition-colors text-center ${
                        config.preferredTopics.includes(topic.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{topic.emoji}</div>
                      <div className="text-sm font-medium">{topic.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 考試類型選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  目標考試類型（可複選）
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {examTypeOptions.map(exam => (
                    <button
                      key={exam.id}
                      onClick={() => toggleExamType(exam.id)}
                      className={`p-3 rounded-lg border-2 transition-colors text-center ${
                        config.examTypes.includes(exam.id)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{exam.emoji}</div>
                      <div className="text-sm font-medium">{exam.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  AI 會根據您選擇的考試類型調整單字難度和出題風格
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 進度條 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index <= currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? '✓' : step.icon}
                  </div>
                  <div className="mt-2 text-xs text-center">
                    <div className={`font-medium ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-colors ${
                    index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 主要內容 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {renderStepContent()}
        </div>

        {/* 導航按鈕 */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            ← 上一步
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            {currentStep === steps.length - 1 ? '🎉 開始學習' : '下一步 →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImprovedSetupWizard