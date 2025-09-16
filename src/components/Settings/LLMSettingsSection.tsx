/**
 * LLM 設定區塊組件
 */

import React from 'react'
import { LLMConfig, ExamType, DifficultyLevel } from '../../types'

interface LLMSettingsSectionProps {
  llmConfig: LLMConfig
  preferredExamTypes: ExamType[]
  defaultDifficulty: DifficultyLevel
  generateCount: number
  onUpdateLLMConfig: (config: LLMConfig) => void
  onUpdateExamTypes: (types: ExamType[]) => void
  onUpdateDifficulty: (difficulty: DifficultyLevel) => void
  onUpdateGenerateCount: (count: number) => void
}

const LLMSettingsSection: React.FC<LLMSettingsSectionProps> = ({
  llmConfig,
  preferredExamTypes,
  defaultDifficulty,
  generateCount,
  onUpdateLLMConfig,
  onUpdateExamTypes,
  onUpdateDifficulty,
  onUpdateGenerateCount
}) => {
  return (
    <section className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">🧠 智能單字生成</h2>
      <p className="text-sm text-gray-600 mb-6">
        使用 AI 模型根據您的學習進度生成個人化單字卡片
      </p>

      {/* LLM 提供商設定 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          AI 模型提供商
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['colab', 'openai', 'claude', 'gemini'] as const).map((provider) => (
            <label key={provider} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                value={provider}
                checked={llmConfig.provider === provider}
                onChange={(e) => onUpdateLLMConfig({ 
                  ...llmConfig, 
                  provider: e.target.value as LLMConfig['provider']
                })}
                className="mr-2"
              />
              <div>
                <div className="font-medium">
                  {provider === 'colab' && '🔬 Colab'}
                  {provider === 'openai' && '🤖 OpenAI'}
                  {provider === 'claude' && '🧠 Claude'}
                  {provider === 'gemini' && '💎 Gemini'}
                </div>
                <div className="text-xs text-gray-500">
                  {provider === 'colab' && '免費，需手動啟動'}
                  {provider === 'openai' && '付費API，穩定快速'}
                  {provider === 'claude' && '付費API，邏輯強'}
                  {provider === 'gemini' && '付費API，多語言'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 考試類型偏好 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          偏好的考試類型
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.values(ExamType).map((examType) => (
            <label key={examType} className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={preferredExamTypes.includes(examType)}
                onChange={(e) => {
                  const newTypes = e.target.checked
                    ? [...preferredExamTypes, examType]
                    : preferredExamTypes.filter(t => t !== examType)
                  onUpdateExamTypes(newTypes)
                }}
                className="mr-2"
              />
              <span className="text-sm">{examType}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 難度與數量設定 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            預設難度等級
          </label>
          <select
            value={defaultDifficulty}
            onChange={(e) => onUpdateDifficulty(e.target.value as DifficultyLevel)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={DifficultyLevel.Beginner}>初級 (3.0-4.5)</option>
            <option value={DifficultyLevel.Intermediate}>中級 (5.0-6.0)</option>
            <option value={DifficultyLevel.UpperInt}>中高級 (6.5-7.0)</option>
            <option value={DifficultyLevel.Advanced}>高級 (7.5-9.0)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            每次生成數量
          </label>
          <input
            type="number"
            value={generateCount}
            onChange={(e) => onUpdateGenerateCount(parseInt(e.target.value))}
            min="1"
            max="20"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">建議：3-10 個</p>
        </div>
      </div>

      {/* Colab 特殊設定 */}
      {llmConfig.provider === 'colab' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">🔬 Colab 設定</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Google Drive 路徑
              </label>
              <input
                type="text"
                value={llmConfig.driveBasePath || ''}
                onChange={(e) => onUpdateLLMConfig({
                  ...llmConfig,
                  driveBasePath: e.target.value
                })}
                placeholder="/VACA_LLM"
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-blue-600 mt-1">
                Colab Notebook 會在此路徑建立請求/回應檔案
              </p>
            </div>
            
            <div className="flex items-center justify-between bg-white rounded p-3 border border-blue-200">
              <div>
                <div className="font-medium text-blue-800">Colab Notebook</div>
                <div className="text-sm text-blue-600">先下載檔案，再上傳至Google Colab</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // 下載本地notebook檔案
                    const link = document.createElement('a');
                    link.href = '/colab/vaca_llm_generator.ipynb';
                    link.download = 'vaca_llm_generator.ipynb';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                >
                  📥 下載
                </button>
                <button
                  type="button"
                  onClick={() => window.open('https://colab.research.google.com/', '_blank')}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  📔 開啟 Colab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key 設定（商業服務） - 後端代理後，前端不再保存金鑰，只顯示狀態與提示 */}
      {llmConfig.provider !== 'colab' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">🔑 API 設定</h4>
          <p className="text-sm text-yellow-700">
            已使用伺服器代理模式。請在後端（Apps Script → Project Settings → Script properties）設定
            <span className="font-mono"> GEMINI_API_KEY</span>。前端不保存金鑰。
          </p>
        </div>
      )}
    </section>
  )
}

export default LLMSettingsSection