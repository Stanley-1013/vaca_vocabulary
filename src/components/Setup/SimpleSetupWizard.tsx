/**
 * 簡化設定向導 - 自用版本
 * 預設使用已配置好的 Google Sheets 和 Gemini API
 */

import React, { useState } from 'react'

export interface SimpleUserConfig {
  // 基本學習偏好
  dailyGoal: number // 每天想學幾個新單字
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  topics: string[] // 興趣主題

  // 設定狀態
  setupCompleted: boolean
}

interface SimpleSetupWizardProps {
  onComplete: (config: SimpleUserConfig) => void
}

const SimpleSetupWizard: React.FC<SimpleSetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0)
  const [config, setConfig] = useState<SimpleUserConfig>({
    dailyGoal: 5,
    difficulty: 'intermediate',
    topics: [],
    setupCompleted: false
  })

  const topicOptions = [
    { id: 'business', label: '商業', emoji: '💼' },
    { id: 'technology', label: '科技', emoji: '💻' },
    { id: 'travel', label: '旅遊', emoji: '✈️' },
    { id: 'food', label: '美食', emoji: '🍽️' },
    { id: 'science', label: '科學', emoji: '🔬' },
    { id: 'art', label: '藝術', emoji: '🎨' },
    { id: 'sports', label: '運動', emoji: '⚽' },
    { id: 'health', label: '健康', emoji: '🏥' },
    { id: 'general', label: '日常生活', emoji: '🏠' }
  ]

  const toggleTopic = (topicId: string) => {
    setConfig(prev => ({
      ...prev,
      topics: prev.topics.includes(topicId)
        ? prev.topics.filter(t => t !== topicId)
        : [...prev.topics, topicId]
    }))
  }

  const handleComplete = () => {
    const finalConfig = {
      ...config,
      setupCompleted: true,
      topics: config.topics.length === 0 ? ['general'] : config.topics
    }
    onComplete(finalConfig)
  }

  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-6">🎯</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            開始您的英語學習之旅
          </h1>
          <p className="text-gray-600 mb-8">
            VACA 使用 AI 為您生成個人化單字卡，讓學習更有效率
          </p>
          <button
            onClick={() => setStep(1)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            開始設定 →
          </button>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-gray-800">設定學習目標</h2>
            <p className="text-gray-600 text-sm mt-2">告訴我們您的學習偏好</p>
          </div>

          <div className="space-y-6">
            {/* 每日目標 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                每天想學幾個新單字？
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[3, 5, 10].map(goal => (
                  <button
                    key={goal}
                    onClick={() => setConfig(prev => ({ ...prev, dailyGoal: goal }))}
                    className={`p-3 rounded-lg border-2 transition-colors text-center ${
                      config.dailyGoal === goal
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{goal} 個</div>
                    <div className="text-xs text-gray-500">
                      {goal === 3 ? '輕鬆' : goal === 5 ? '適中' : '挑戰'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 難度等級 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                您的英語程度？
              </label>
              <div className="space-y-2">
                {[
                  { id: 'beginner', label: '初學者', desc: '基礎單字和簡單句子' },
                  { id: 'intermediate', label: '中等程度', desc: '日常對話和工作用語' },
                  { id: 'advanced', label: '進階', desc: '學術和專業詞彙' }
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
                    <div className="text-xs text-gray-500">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              繼續 →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🏷️</div>
            <h2 className="text-xl font-bold text-gray-800">選擇感興趣的主題</h2>
            <p className="text-gray-600 text-sm mt-2">我們會根據您的興趣推薦單字</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {topicOptions.map(topic => (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                className={`p-3 rounded-lg border-2 transition-colors text-center ${
                  config.topics.includes(topic.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{topic.emoji}</div>
                <div className="text-sm font-medium">{topic.label}</div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleComplete}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              🎉 開始學習！
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full text-gray-500 hover:text-gray-700 py-2 transition-colors"
            >
              ← 上一步
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default SimpleSetupWizard