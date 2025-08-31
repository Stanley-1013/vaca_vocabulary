/**
 * 語言選擇器組件
 * 
 * 提供中英文切換功能
 */

import React from 'react'
import { useLanguageSelector } from '../hooks/useI18n'
import { SUPPORTED_LANGUAGES } from '../i18n'

interface LanguageSelectorProps {
  className?: string
  showText?: boolean  // 是否顯示文字，false 則只顯示國旗
  size?: 'sm' | 'md' | 'lg'
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showText = true,
  size = 'md'
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguageSelector()
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm', 
    lg: 'px-4 py-3 text-base'
  }
  
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === language)
  const otherLang = SUPPORTED_LANGUAGES.find(lang => lang.code !== language)
  
  if (showText) {
    // 完整的語言選擇器（帶文字）
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          onClick={toggleLanguage}
          className={`
            ${sizeClasses[size]}
            bg-white border border-gray-300 rounded-lg
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-all duration-200 ease-in-out
            flex items-center gap-2
            shadow-sm hover:shadow
          `}
          title={`切換到 ${otherLang?.name}`}
        >
          <span className="text-lg">{currentLang?.flag}</span>
          {showText && (
            <span className="font-medium text-gray-700">
              {currentLang?.name}
            </span>
          )}
        </button>
      </div>
    )
  }
  
  // 簡潔版（只有國旗）
  return (
    <button
      onClick={toggleLanguage}
      className={`
        ${sizeClasses[size]}
        bg-white border border-gray-300 rounded-full
        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-all duration-200 ease-in-out
        w-10 h-10 flex items-center justify-center
        shadow-sm hover:shadow
        ${className}
      `}
      title={`Switch to ${otherLang?.name}`}
    >
      <span className="text-lg">{currentLang?.flag}</span>
    </button>
  )
}

// 下拉式語言選擇器（支援更多語言時使用）
export const LanguageDropdown: React.FC<{ className?: string }> = ({
  className = ''
}) => {
  const { language, setLanguage } = useLanguageSelector()
  const [isOpen, setIsOpen] = React.useState(false)
  
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === language)
  
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          px-3 py-2 text-sm
          bg-white border border-gray-300 rounded-lg
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-all duration-200 ease-in-out
          flex items-center gap-2
          shadow-sm hover:shadow
        "
      >
        <span className="text-lg">{currentLang?.flag}</span>
        <span className="font-medium text-gray-700">{currentLang?.name}</span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉選單 */}
          <div className="
            absolute right-0 mt-1 py-1 w-40
            bg-white border border-gray-300 rounded-lg shadow-lg
            z-20
          ">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm
                  hover:bg-gray-50 transition-colors duration-150
                  flex items-center gap-2
                  ${lang.code === language ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                `}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className={lang.code === language ? 'font-semibold' : ''}>{lang.name}</span>
                {lang.code === language && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSelector