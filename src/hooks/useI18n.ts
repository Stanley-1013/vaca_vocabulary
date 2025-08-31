/**
 * 多語言 Hook
 * 
 * 提供語言切換和翻譯功能
 */

import { useState, useEffect, useCallback } from 'react'
import { Language, getTranslationResource, TranslationResource } from '../i18n'
import { Card } from '../types'

const STORAGE_KEY = 'vaca_language'
const DEFAULT_LANGUAGE: Language = 'zh-TW'

export const useI18n = () => {
  // 從 localStorage 讀取語言設定
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return (stored as Language) || DEFAULT_LANGUAGE
    } catch {
      return DEFAULT_LANGUAGE
    }
  })
  
  // 獲取當前翻譯資源
  const translations = getTranslationResource(language)
  
  // 切換語言
  const setLanguage = useCallback((newLanguage: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLanguage)
      setLanguageState(newLanguage)
    } catch (error) {
      console.warn('Failed to save language preference:', error)
      setLanguageState(newLanguage)
    }
  }, [])
  
  // 翻譯 UI 文本
  const t = useCallback((key: string): string => {
    try {
      const keys = key.split('.')
      let value: any = translations.ui
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          console.warn(`Translation key not found: ${key}`)
          return key // 如果找不到翻譯，返回 key 本身
        }
      }
      
      return typeof value === 'string' ? value : key
    } catch {
      return key
    }
  }, [translations])
  
  // 翻譯單字 (針對 Colab 生成的英文單字卡)
  const translateWord = useCallback((englishWord: string): string => {
    // 如果目前語言是英文，直接返回
    if (language === 'en-US') return englishWord
    
    // 查找對應的中文翻譯
    const translation = translations.words[englishWord.toLowerCase()]
    if (translation) return translation
    
    // 如果沒有找到翻譯，返回原始英文
    console.warn(`No translation found for word: ${englishWord}`)
    return englishWord
  }, [language, translations])
  
  // 翻譯卡片 (處理 Colab 生成的英文卡片)
  const translateCard = useCallback((card: Card): Card => {
    if (language === 'en-US') return card
    
    // 翻譯 meaning 欄位
    const translatedMeaning = translateWord(card.word.base)
    
    return {
      ...card,
      meaning: translatedMeaning !== card.word.base ? translatedMeaning : card.meaning
    }
  }, [language, translateWord])
  
  // 批量翻譯卡片
  const translateCards = useCallback((cards: Card[]): Card[] => {
    return cards.map(translateCard)
  }, [translateCard])
  
  return {
    language,
    setLanguage,
    translations,
    t,
    translateWord,
    translateCard,
    translateCards,
    isEnglish: language === 'en-US',
    isChinese: language === 'zh-TW'
  }
}

// 語言選擇器組件的 Hook
export const useLanguageSelector = () => {
  const { language, setLanguage } = useI18n()
  
  const toggleLanguage = useCallback(() => {
    const newLanguage = language === 'zh-TW' ? 'en-US' : 'zh-TW'
    setLanguage(newLanguage)
  }, [language, setLanguage])
  
  return {
    language,
    setLanguage,
    toggleLanguage,
    isEnglish: language === 'en-US',
    isChinese: language === 'zh-TW'
  }
}