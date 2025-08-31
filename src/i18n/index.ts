/**
 * 多語言支援系統
 * 
 * 支援 Colab 生成的英文 JSON 自動翻譯為中文
 */

export type Language = 'zh-TW' | 'en-US'

export interface TranslationResource {
  ui: {
    // App 界面
    title: string
    loading: string
    error: string
    
    // 復習相關
    review: {
      again: string
      difficult: string
      normal: string 
      easy: string
      completed: string
      reviewedCards: string
      newCards: string
      continueStudy: string
      aiQuiz: string
      backHome: string
    }
    
    // 設定相關
    settings: {
      title: string
      llmProvider: string
      examType: string
      difficulty: string
      generateCount: string
      save: string
    }
    
    // 通用
    common: {
      yes: string
      no: string
      cancel: string
      confirm: string
      close: string
      next: string
      previous: string
    }
  }
  
  // 單字翻譯對照表 (英文 -> 中文)
  words: Record<string, string>
}

// 中文翻譯資源
export const zhTW: TranslationResource = {
  ui: {
    title: 'VACA 智能背單字',
    loading: '載入中...',
    error: '發生錯誤',
    
    review: {
      again: '再來一次',
      difficult: '困難',
      normal: '普通', 
      easy: '容易',
      completed: '今日復習完成！',
      reviewedCards: '已復習卡片',
      newCards: '新學卡片',
      continueStudy: '背更多單字',
      aiQuiz: 'AI 出考題',
      backHome: '返回首頁'
    },
    
    settings: {
      title: '設定',
      llmProvider: 'AI 模型',
      examType: '考試類型',
      difficulty: '難度等級',
      generateCount: '生成數量',
      save: '儲存'
    },
    
    common: {
      yes: '是',
      no: '否',
      cancel: '取消',
      confirm: '確認',
      close: '關閉',
      next: '下一個',
      previous: '上一個'
    }
  },
  
  words: {
    // 常用單字翻譯對照
    'example': '例子；範例',
    'ubiquitous': '無所不在的，普遍存在的',
    'ephemeral': '短暫的，瞬息的',
    'meticulous': '細心的，一絲不苟的',
    'serendipity': '意外發現，機緣巧合',
    'tenacious': '堅韌的，執著的',
    'eloquent': '雄辯的，有說服力的',
    'pragmatic': '實用主義的，務實的',
    'innovative': '創新的，革新的',
    'comprehensive': '全面的，綜合的',
    'sophisticated': '複雜精密的，老練的',
    'fundamental': '基本的，根本的',
    'significant': '重要的，顯著的',
    'efficient': '高效的，有效率的',
    'substantial': '大量的，實質的',
    'contemporary': '當代的，現代的',
    'investigate': '調查，研究',
    'demonstrate': '證明，展示',
    'establish': '建立，確立',
    'maintain': '維持，保養',
    'acknowledge': '承認，確認',
    'contribute': '貢獻，促成',
    'participate': '參與，參加',
    'communicate': '溝通，交流',
    'collaborate': '合作，協作',
    'anticipate': '預期，預料'
  }
}

// 英文翻譯資源
export const enUS: TranslationResource = {
  ui: {
    title: 'VACA Smart Vocabulary',
    loading: 'Loading...',
    error: 'Error occurred',
    
    review: {
      again: 'Again',
      difficult: 'Difficult',
      normal: 'Normal',
      easy: 'Easy', 
      completed: 'Review completed!',
      reviewedCards: 'Cards reviewed',
      newCards: 'New cards',
      continueStudy: 'Study more cards',
      aiQuiz: 'AI Quiz',
      backHome: 'Back to home'
    },
    
    settings: {
      title: 'Settings',
      llmProvider: 'AI Provider',
      examType: 'Exam type',
      difficulty: 'Difficulty',
      generateCount: 'Generate count',
      save: 'Save'
    },
    
    common: {
      yes: 'Yes',
      no: 'No', 
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      next: 'Next',
      previous: 'Previous'
    }
  },
  
  words: {
    // English words keep their original meaning/definition
    'example': 'a thing characteristic of its kind or illustrating a general rule',
    'ubiquitous': 'present, appearing, or found everywhere',
    'ephemeral': 'lasting for a very short time',
    'meticulous': 'showing great attention to detail; very careful and precise',
    'serendipity': 'the occurrence and development of events by chance in a happy way',
    'tenacious': 'tending to keep a firm hold of something; clinging or adhering closely',
    // ... 更多英文定義
  }
}

// 可用語言列表
export const SUPPORTED_LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' }
]

// 獲取翻譯資源
export function getTranslationResource(language: Language): TranslationResource {
  switch (language) {
    case 'zh-TW':
      return zhTW
    case 'en-US':
      return enUS
    default:
      return zhTW // 預設中文
  }
}