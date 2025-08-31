/**
 * 設定向導測試組件
 * 用於測試設定流程
 */

import React from 'react'
import SetupWizard, { UserConfig } from './SetupWizard'

const SetupWizardTest: React.FC = () => {
  const handleComplete = (config: UserConfig) => {
    console.log('✅ 設定完成:', config)
    alert('設定完成！查看 Console 了解詳細資訊。')
  }

  const handleSkip = () => {
    console.log('⏭️ 跳過設定')
    alert('已跳過設定')
  }

  return (
    <div>
      <SetupWizard onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  )
}

export default SetupWizardTest