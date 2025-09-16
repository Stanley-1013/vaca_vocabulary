/**
 * Vercel Serverless Function - LLM API with Gemini
 *
 * 職責：整合 Gemini API，提供單字建議和測驗生成功能
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// 配置常數
const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  GEMINI_MODEL: 'gemini-1.5-flash',
  MAX_WORDS_PER_REQUEST: 20,
  DEFAULT_TIMEOUT: 30000
};

// 統一回應格式
function successResponse(data: any) {
  return {
    ok: true,
    data,
    timestamp: new Date().toISOString()
  };
}

function errorResponse(code: string, message: string) {
  return {
    ok: false,
    error: { code, message },
    timestamp: new Date().toISOString()
  };
}

// 呼叫 Gemini API
async function callGeminiAPI(prompt: string): Promise<any> {
  if (!CONFIG.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid Gemini API response format');
  }

  return data.candidates[0].content.parts[0].text;
}

// 單字建議功能
async function suggestWords(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      topic = 'general',
      level = 'intermediate',
      count = 10,
      learningHistory = '',
      recentWords = [],
      tags = []
    } = req.body;

    // 驗證參數
    const wordCount = Math.min(parseInt(count), CONFIG.MAX_WORDS_PER_REQUEST);

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Topic is required'));
    }

    // 建構提示詞
    const systemPrompt = `你是一個專業的英語詞彙教學助手。請根據用戶需求生成單字卡片。

任務：為用戶生成 ${wordCount} 個適合的英語單字，主題是「${topic}」，難度為「${level}」。

要求：
1. 回傳格式必須是有效的 JSON
2. 每個單字包含：word.base, posPrimary, meaning, synonyms, antonyms, example, tags
3. 難度適中，避免過於簡單或複雜
4. 例句要實用且有助理解
5. 標籤要準確分類

${learningHistory ? `學習歷史：${learningHistory}` : ''}
${recentWords.length > 0 ? `最近學過的單字（請避免）：${recentWords.join(', ')}` : ''}
${tags.length > 0 ? `偏好標籤：${tags.join(', ')}` : ''}

回傳格式：
{
  "cards": [
    {
      "word": {"base": "example", "forms": []},
      "posPrimary": "noun",
      "meaning": "中文意思",
      "synonyms": ["同義詞"],
      "antonyms": ["反義詞"],
      "example": "英文例句",
      "tags": ["標籤"]
    }
  ]
}`;

    // 呼叫 Gemini API
    const geminiResponse = await callGeminiAPI(systemPrompt);

    // 解析 JSON 回應
    let parsedResponse;
    try {
      // 清理可能的 markdown 格式
      const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Gemini response:', geminiResponse);
      throw new Error('Failed to parse Gemini response as JSON');
    }

    // 驗證回應格式
    if (!parsedResponse.cards || !Array.isArray(parsedResponse.cards)) {
      throw new Error('Invalid response format: missing cards array');
    }

    // 添加時間戳和預設值
    const cards = parsedResponse.cards.map((card: any, index: number) => ({
      ...card,
      id: `gemini_${Date.now()}_${index}`,
      createdAt: new Date().toISOString(),
      box: 1,
      ease: 2.5,
      reps: 0,
      interval: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date().toISOString()
    }));

    return res.json(successResponse({ cards }));

  } catch (error) {
    console.error('Suggest words error:', error);
    return res.status(500).json(errorResponse('SERVER_ERROR',
      error instanceof Error ? error.message : 'Failed to generate word suggestions'));
  }
}

// 測驗生成功能
async function generateQuiz(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      words = [],
      quizType = 'multiple_choice',
      difficulty = 'medium'
    } = req.body;

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Words array is required'));
    }

    const wordList = words.map((word: any) => word.word?.base || word).slice(0, 10);

    const systemPrompt = `你是一個專業的英語測驗出題助手。請根據提供的單字生成測驗題目。

單字列表：${wordList.join(', ')}

要求：
1. 生成 ${wordList.length} 題選擇題
2. 每題包含：question, options (4個選項), correctAnswer (正確答案索引), explanation
3. 題目類型多樣化：意思選擇、例句填空、同義詞等
4. 難度：${difficulty}

回傳格式：
{
  "items": [
    {
      "id": "q1",
      "question": "題目",
      "options": ["選項A", "選項B", "選項C", "選項D"],
      "correctAnswer": 0,
      "explanation": "解釋",
      "word": "單字"
    }
  ]
}`;

    const geminiResponse = await callGeminiAPI(systemPrompt);

    let parsedResponse;
    try {
      const cleanedResponse = geminiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Quiz JSON parsing error:', parseError);
      throw new Error('Failed to parse quiz response as JSON');
    }

    if (!parsedResponse.items || !Array.isArray(parsedResponse.items)) {
      throw new Error('Invalid quiz response format');
    }

    return res.json(successResponse(parsedResponse));

  } catch (error) {
    console.error('Generate quiz error:', error);
    return res.status(500).json(errorResponse('SERVER_ERROR',
      error instanceof Error ? error.message : 'Failed to generate quiz'));
  }
}

// 主要處理函數
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', 'Only POST method allowed'));
  }

  try {
    // 解析路徑
    const { pathname } = new URL(req.url!, `http://${req.headers.host}`);

    if (pathname.endsWith('/suggest')) {
      return suggestWords(req, res);
    } else if (pathname.endsWith('/quiz')) {
      return generateQuiz(req, res);
    } else {
      return res.status(404).json(errorResponse('NOT_FOUND', 'LLM endpoint not found'));
    }

  } catch (error) {
    console.error('LLM API error:', error);
    return res.status(500).json(errorResponse('SERVER_ERROR', 'Internal server error'));
  }
}