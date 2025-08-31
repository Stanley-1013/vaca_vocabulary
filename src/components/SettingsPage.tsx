/**
 * 設定頁組件
 * 
 * 提供 vNext 功能的參數調整界面
 */

import React, { useState, useEffect } from 'react'
import { Algorithm, PriorityConfig, LLMConfig, ExamType, DifficultyLevel } from '../types'
import LLMSettingsSection from './Settings/LLMSettingsSection'

interface SettingsPageProps {
  onSave?: (settings: VNextSettings) => void
  initialSettings?: Partial<VNextSettings>
}

export interface VNextSettings {
  maxDailyReviews: number
  minNewPerDay: number
  maxNewPerDay: number
  algorithm: Algorithm
  againGapSequence: number[]
  priorityWeights: PriorityConfig
  // Phase 3: LLM 設定
  llmConfig: LLMConfig
  preferredExamTypes: ExamType[]
  defaultDifficulty: DifficultyLevel
  generateCount: number
}

const defaultSettings: VNextSettings = {
  maxDailyReviews: 20,
  minNewPerDay: 3,
  maxNewPerDay: 5,
  algorithm: 'leitner',
  againGapSequence: [2, 5, 10],
  priorityWeights: { ease: 0.5, overdueDays: 0.3, box: 0.2 },
  // Phase 3: LLM 預設設定
  llmConfig: {
    provider: 'colab',
    driveBasePath: '/VACA_LLM',
    modelName: 'Qwen2.5-7B-Instruct'
  },
  preferredExamTypes: [ExamType.IELTS, ExamType.General],
  defaultDifficulty: DifficultyLevel.Intermediate,
  generateCount: 5
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  onSave,
  initialSettings = {}
}) => {
  const [settings, setSettings] = useState<VNextSettings>({
    ...defaultSettings,
    ...initialSettings
  })

  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    setIsDirty(true)
  }, [settings])

  const handleSave = () => {
    if (onSave) {
      onSave(settings)
    }
    // 這裡可以添加保存到 localStorage 或 API 的邏輯
    localStorage.setItem('vNextSettings', JSON.stringify(settings))
    setIsDirty(false)
  }

  const handleReset = () => {
    setSettings(defaultSettings)
  }

  const updateSetting = <K extends keyof VNextSettings>(
    key: K,
    value: VNextSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updatePriorityWeight = (key: keyof PriorityConfig, value: number) => {
    setSettings(prev => ({
      ...prev,
      priorityWeights: {
        ...prev.priorityWeights,
        [key]: value
      }
    }))
  }

  const updateAgainSequence = (index: number, value: number) => {
    const newSequence = [...settings.againGapSequence]
    newSequence[index] = value
    setSettings(prev => ({ ...prev, againGapSequence: newSequence }))
  }

  return (
    <div className="settings-page max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">學習設定</h1>
        <p className="text-gray-600">調整您的個人化學習參數</p>
      </div>

      <div className="space-y-8">
        {/* 每日學習量設定 */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">每日學習量</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                每日複習上限
              </label>
              <input
                type="number"
                value={settings.maxDailyReviews}
                onChange={(e) => updateSetting('maxDailyReviews', parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">建議：15-30 張</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                每日新詞最少
              </label>
              <input
                type="number"
                value={settings.minNewPerDay}
                onChange={(e) => updateSetting('minNewPerDay', parseInt(e.target.value))}
                min="0"
                max={settings.maxNewPerDay}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">建議：3-5 張</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                每日新詞最多
              </label>
              <input
                type="number"
                value={settings.maxNewPerDay}
                onChange={(e) => updateSetting('maxNewPerDay', parseInt(e.target.value))}
                min={settings.minNewPerDay}
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">建議：5-10 張</p>
            </div>
          </div>
        </section>

        {/* 演算法設定 */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">複習演算法</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                演算法類型
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="leitner"
                    checked={settings.algorithm === 'leitner'}
                    onChange={(e) => updateSetting('algorithm', e.target.value as Algorithm)}
                    className="mr-2"
                  />
                  <span>Leitner Box（盒子系統）</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="sm2"
                    checked={settings.algorithm === 'sm2'}
                    onChange={(e) => updateSetting('algorithm', e.target.value as Algorithm)}
                    className="mr-2"
                  />
                  <span>SM-2（間隔重複）</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Again 間隔設定 */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Again 重現間隔</h2>
          <p className="text-sm text-gray-600 mb-4">
            按下 Again 按鈕後，卡片重新出現的位置間隔（以卡片數計算）
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            {settings.againGapSequence.map((gap, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  第 {index + 1} 次 Again
                </label>
                <input
                  type="number"
                  value={gap}
                  onChange={(e) => updateAgainSequence(index, parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{gap} 張後重現</p>
              </div>
            ))}
          </div>
        </section>

        {/* 優先權重設定 */}
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">優先排序權重</h2>
          <p className="text-sm text-gray-600 mb-4">
            調整不同因素在卡片優先排序中的重要性（權重總和建議為 1.0）
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                難度權重（{settings.priorityWeights.ease.toFixed(1)}）
              </label>
              <input
                type="range"
                value={settings.priorityWeights.ease}
                onChange={(e) => updatePriorityWeight('ease', parseFloat(e.target.value))}
                min="0"
                max="1"
                step="0.1"
                className="w-full"
              />
              <p className="text-xs text-gray-500">ease 值越低的卡片越優先</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                逾期權重（{settings.priorityWeights.overdueDays.toFixed(1)}）
              </label>
              <input
                type="range"
                value={settings.priorityWeights.overdueDays}
                onChange={(e) => updatePriorityWeight('overdueDays', parseFloat(e.target.value))}
                min="0"
                max="1"
                step="0.1"
                className="w-full"
              />
              <p className="text-xs text-gray-500">逾期天數越多的卡片越優先</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                層級權重（{settings.priorityWeights.box.toFixed(1)}）
              </label>
              <input
                type="range"
                value={settings.priorityWeights.box}
                onChange={(e) => updatePriorityWeight('box', parseFloat(e.target.value))}
                min="0"
                max="1"
                step="0.1"
                className="w-full"
              />
              <p className="text-xs text-gray-500">盒子層級越低的卡片越優先</p>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              權重總和：{Object.values(settings.priorityWeights).reduce((a, b) => a + b, 0).toFixed(1)}
            </div>
          </div>
        </section>

        {/* Phase 3: LLM 智能生成設定 */}
        <LLMSettingsSection
          llmConfig={settings.llmConfig}
          preferredExamTypes={settings.preferredExamTypes}
          defaultDifficulty={settings.defaultDifficulty}
          generateCount={settings.generateCount}
          onUpdateLLMConfig={(config) => updateSetting('llmConfig', config)}
          onUpdateExamTypes={(types) => updateSetting('preferredExamTypes', types)}
          onUpdateDifficulty={(difficulty) => updateSetting('defaultDifficulty', difficulty)}
          onUpdateGenerateCount={(count) => updateSetting('generateCount', count)}
        />
      </div>

      {/* 操作按鈕 */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          重置為預設值
        </button>

        <div className="flex gap-3">
          {isDirty && (
            <span className="text-sm text-orange-600 self-center">
              * 設定已修改
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-md transition-colors"
          >
            保存設定
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage