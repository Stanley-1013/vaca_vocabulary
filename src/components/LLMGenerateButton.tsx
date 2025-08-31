/**
 * LLM 智能生成按鈕組件
 * 
 * 提供單字生成功能的快速入口
 */

import React, { useState } from 'react'
import { useLLMGenerate } from '../hooks/useLLMGenerate'
import { useVNextSettings } from '../hooks/useVNextSettings'
import { Card, ExamType } from '../types'

interface LLMGenerateButtonProps {
  existingCards: Card[]
  onCardsGenerated: (cards: Card[]) => void
  className?: string
}

const LLMGenerateButton: React.FC<LLMGenerateButtonProps> = ({
  existingCards,
  onCardsGenerated,
  className = ''
}) => {
  const { generateCards, createLearningHistory, getRecentWords, isGenerating, error } = useLLMGenerate()
  const { settings } = useVNextSettings()
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 快速生成（使用預設設定）
  const handleQuickGenerate = async () => {
    try {
      const learnedSummary = createLearningHistory(existingCards)
      const recentWords = getRecentWords(existingCards, 20)

      const request = {
        count: settings.generateCount,
        tags: settings.preferredExamTypes,
        difficulty: getDifficultyText(settings.defaultDifficulty),
        learned_words_summary: learnedSummary,
        avoid_words: recentWords
      }

      const newCards = await generateCards(request)
      onCardsGenerated(newCards)
    } catch (err) {
      console.error('生成失敗:', err)
    }
  }

  const getDifficultyText = (difficulty: string): string => {
    const mapping: Record<string, string> = {
      'beginner': '3.0-4.5',
      'intermediate': '5.0-6.0', 
      'upper-intermediate': '6.5-7.0',
      'advanced': '7.5-9.0'
    }
    return mapping[difficulty] || '5.0-6.0'
  }

  return (
    <div className={`llm-generate-section ${className}`}>
      <div className="flex items-center gap-3">
        {/* 主要生成按鈕 */}
        <button
          onClick={handleQuickGenerate}
          disabled={isGenerating}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md transition-all
            ${isGenerating 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
            }
          `}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
              <span>AI 生成中...</span>
            </>
          ) : (
            <>
              <span>🧠</span>
              <span>AI 智能生成</span>
            </>
          )}
        </button>

        {/* 高級選項切換 */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          title="高級選項"
        >
          ⚙️
        </button>

        {/* 生成狀態指示 */}
        {settings.llmConfig.provider === 'colab' && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'}`}></div>
            Colab {isGenerating ? '運行中' : '待命'}
          </div>
        )}
      </div>

      {/* 錯誤顯示 */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          <span className="font-medium">生成失敗：</span>
          {error}
        </div>
      )}

      {/* 高級選項面板 */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-gray-700 mb-3">🎛️ 高級選項</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 考試類型快選 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                考試類型
              </label>
              <div className="flex flex-wrap gap-2">
                {[ExamType.IELTS, ExamType.TOEFL, ExamType.GRE, ExamType.General].map(type => (
                  <button
                    key={type}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      settings.preferredExamTypes.includes(type)
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 生成預覽 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                生成預覽
              </label>
              <div className="text-sm text-gray-500 space-y-1">
                <div>數量: {settings.generateCount} 個單字</div>
                <div>難度: {getDifficultyText(settings.defaultDifficulty)}</div>
                <div>標籤: {settings.preferredExamTypes.join(', ')}</div>
              </div>
            </div>
          </div>

          {/* Colab 狀態檢查 */}
          {settings.llmConfig.provider === 'colab' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-700">Colab 連接狀態</div>
                  <div className="text-xs text-blue-600">確保 Notebook 正在運行</div>
                </div>
                <button
                  onClick={() => window.open('/colab/vaca_llm_generator.ipynb', '_blank')}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  檢查 Colab
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 學習統計摘要 */}
      <div className="mt-3 text-xs text-gray-500">
        已學習 {existingCards.filter(c => c.reps > 0).length} / {existingCards.length} 個單字
        {existingCards.length > 0 && (
          <span className="ml-2">
            • 最近學習: {getRecentWords(existingCards, 5).slice(0, 3).join(', ')}
            {getRecentWords(existingCards, 5).length > 3 && '...'}
          </span>
        )}
      </div>
    </div>
  )
}

export default LLMGenerateButton