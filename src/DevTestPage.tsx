/**
 * 開發測試頁面
 * 用於測試各個新組件
 */

import React, { useState } from 'react'
import SetupWizardTest from './components/Setup/SetupWizardTest'
import LLMGenerateButton from './components/LLMGenerateButton'
import LLMSettingsSection from './components/Settings/LLMSettingsSection'
import { LLMConfig, ExamType, DifficultyLevel } from './types'

const DevTestPage: React.FC = () => {
  const [activeTest, setActiveTest] = useState('setup')
  
  // 測試用的設定狀態
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'colab',
    driveBasePath: '/VACA_LLM',
    modelName: 'Qwen2.5-7B-Instruct'
  })
  
  const [preferredExamTypes, setPreferredExamTypes] = useState<ExamType[]>([
    ExamType.IELTS, 
    ExamType.General
  ])
  
  const [defaultDifficulty, setDefaultDifficulty] = useState<DifficultyLevel>(
    DifficultyLevel.Intermediate
  )
  
  const [generateCount, setGenerateCount] = useState(5)

  const tests = [
    { id: 'setup', name: '設定向導', icon: '🔧' },
    { id: 'llm-settings', name: 'LLM 設定', icon: '🧠' },
    { id: 'llm-generate', name: 'LLM 生成按鈕', icon: '⚡' },
    { id: 'all-components', name: '所有組件', icon: '🎯' }
  ]

  const renderTest = () => {
    switch (activeTest) {
      case 'setup':
        return <SetupWizardTest />
      
      case 'llm-settings':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <LLMSettingsSection
              llmConfig={llmConfig}
              preferredExamTypes={preferredExamTypes}
              defaultDifficulty={defaultDifficulty}
              generateCount={generateCount}
              onUpdateLLMConfig={setLlmConfig}
              onUpdateExamTypes={setPreferredExamTypes}
              onUpdateDifficulty={setDefaultDifficulty}
              onUpdateGenerateCount={setGenerateCount}
            />
          </div>
        )
      
      case 'llm-generate':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">LLM 生成按鈕測試</h2>
            <LLMGenerateButton
              existingCards={[]}
              onCardsGenerated={(cards) => {
                console.log('🎉 生成的卡片:', cards)
                alert(`成功生成 ${cards.length} 張卡片！查看 Console 了解詳情。`)
              }}
            />
          </div>
        )
      
      case 'all-components':
        return (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">🧠 LLM 設定</h3>
              <LLMSettingsSection
                llmConfig={llmConfig}
                preferredExamTypes={preferredExamTypes}
                defaultDifficulty={defaultDifficulty}
                generateCount={generateCount}
                onUpdateLLMConfig={setLlmConfig}
                onUpdateExamTypes={setPreferredExamTypes}
                onUpdateDifficulty={setDefaultDifficulty}
                onUpdateGenerateCount={setGenerateCount}
              />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">⚡ LLM 生成</h3>
              <LLMGenerateButton
                existingCards={[]}
                onCardsGenerated={(cards) => {
                  console.log('🎉 生成的卡片:', cards)
                  alert(`成功生成 ${cards.length} 張卡片！`)
                }}
              />
            </div>
          </div>
        )
      
      default:
        return <div>選擇一個測試項目</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            🧪 VACA 組件測試頁面
          </h1>
          
          <div className="flex flex-wrap gap-3">
            {tests.map((test) => (
              <button
                key={test.id}
                onClick={() => setActiveTest(test.id)}
                className={`
                  px-4 py-2 rounded-lg transition-colors
                  ${activeTest === test.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {test.icon} {test.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 當前測試資訊 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">
            目前測試：{tests.find(t => t.id === activeTest)?.name}
          </h2>
          <p className="text-blue-700 text-sm">
            打開瀏覽器開發者工具的 Console 查看詳細資訊
          </p>
        </div>

        {/* 測試內容 */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderTest()}
        </div>
      </div>
    </div>
  )
}

export default DevTestPage