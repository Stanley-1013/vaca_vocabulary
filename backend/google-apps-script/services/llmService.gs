/**
 * LLM 服務（後端代理）
 * 
 * 職責：封裝與外部 LLM 供應商（Gemini）之間的通訊，
 *       僅在伺服器端保存與使用 API Key，前端不接觸金鑰。
 */

const LLMService = {
  /**
   * 取得 Gemini API Key（從 Script Properties）
   * @returns {string|null}
   */
  getGeminiApiKey_: function() {
    try {
      const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      return key || null;
    } catch (e) {
      Logger.log('LLMService.getGeminiApiKey_ error: ' + e.toString());
      return null;
    }
  },

  /**
   * 呼叫 Gemini 產生內容（JSON 格式）
   * @param {string} systemPrompt - 系統說明 / 任務說明
   * @param {string} userPrompt - 使用者請求內容
   * @param {string} model - 模型名稱（預設 gemini-1.5-flash）
   * @returns {Object} 解析後的 JSON 結果
   */
  callGeminiJson_: function(systemPrompt, userPrompt, model) {
    const apiKey = this.getGeminiApiKey_();
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in Script Properties.');
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + (model || 'gemini-1.5-flash') + ':generateContent';

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + '\n\n' + userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-goog-api-key': apiKey },
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });

    const status = res.getResponseCode();
    const text = res.getContentText();

    if (status < 200 || status >= 300) {
      Logger.log('Gemini error: ' + status + ' ' + text);
      throw new Error('Gemini request failed: HTTP ' + status);
    }

    const json = ResponseUtils.safeJsonParse(text, null);
    if (!json || !json.candidates || !json.candidates.length || !json.candidates[0].content) {
      throw new Error('Gemini response malformed');
    }

    // Gemini 文字輸出位於 candidates[0].content.parts[].text
    const parts = json.candidates[0].content.parts || [];
    const combined = parts.map(function(p){ return (p && p.text) ? p.text : ''; }).join('\n');

    // 嘗試解析為 JSON
    const parsed = ResponseUtils.safeJsonParse(combined, null);
    if (!parsed) {
      // 若模型未能嚴格輸出 JSON，嘗試從 Markdown code fence 中提取
      const match = combined.match(/```json[\s\S]*?```/i);
      if (match && match[0]) {
        const inner = match[0].replace(/```json/i, '').replace(/```/, '').trim();
        const parsedInner = ResponseUtils.safeJsonParse(inner, null);
        if (parsedInner) return parsedInner;
      }
      throw new Error('Failed to parse JSON from Gemini response');
    }

    return parsed;
  },

  /**
   * 建立單字卡建議（後端代理）
   * @param {Object} req - { count, tags, difficulty, learned_words_summary, avoid_words }
   * @returns {{ cards: Array<Object> }}
   */
  suggest: function(req) {
    const count = Math.max(1, Math.min(parseInt(req.count || 3, 10), 20));
    const tags = Array.isArray(req.tags) ? req.tags : [];
    const difficulty = (req.difficulty || '5.0-6.0').toString();
    const learnedSummary = (req.learned_words_summary || '').toString();
    const avoidWords = Array.isArray(req.avoid_words) ? req.avoid_words : [];

    const systemPrompt = [
      'You are an assistant that generates English vocabulary flashcards for a spaced-repetition app.',
      'Return STRICT JSON ONLY. No explanations. No markdown.',
      'Output shape: { "cards": [ {',
      '  "word": { "base": string, "forms": [{"pos": string, "form": string}] },',
      '  "posPrimary": string,',
      '  "meaning": string,',
      '  "synonyms": string[],',
      '  "antonyms": string[],',
      '  "example": string,',
      '  "tags": string[]',
      '} ] }'
    ].join(' ');

    const userPrompt = [
      'Generate', count, 'vocabulary cards.',
      tags.length ? ('Tags: ' + tags.join(', ') + '.') : '',
      'Target difficulty (IELTS band-ish): ' + difficulty + '.',
      learnedSummary ? ('Learned summary: ' + learnedSummary + '.') : '',
      avoidWords.length ? ('Avoid words: ' + avoidWords.join(', ') + '.') : '',
      'Return high-quality, concise examples.'
    ].join(' ');

    const result = this.callGeminiJson_(systemPrompt, userPrompt, 'gemini-1.5-flash');

    // 輕度校驗輸出結構
    const cards = (result && result.cards && Array.isArray(result.cards)) ? result.cards : [];
    const sanitized = cards.slice(0, count).map(function(c){
      return {
        word: c.word || { base: '', forms: [] },
        posPrimary: c.posPrimary || '',
        meaning: c.meaning || '',
        synonyms: Array.isArray(c.synonyms) ? c.synonyms : [],
        antonyms: Array.isArray(c.antonyms) ? c.antonyms : [],
        example: c.example || '',
        tags: Array.isArray(c.tags) ? c.tags : [],
        anchors: []
      };
    });

    return { cards: sanitized };
  },

  /**
   * 產生測驗題目（可先用規則法，未來可切到 LLM）
   * @param {Object} req - { cardIds: string[], types?: string[] }
   * @returns {{ items: Array<Object> }}
   */
  quiz: function(req) {
    const ids = Array.isArray(req.cardIds) ? req.cardIds : [];
    const types = Array.isArray(req.types) ? req.types : ['mcq'];
    const items = [];

    ids.slice(0, 10).forEach(function(id) {
      const card = SheetService.getCardById(id);
      if (!card) return;
      if (types.includes('mcq')) {
        const correct = card.meaning || '';
        const distractors = ['相近詞義', '無關詞義', '反義含義'];
        const choices = [correct].concat(distractors).sort(function(){ return Math.random() - 0.5; });
        items.push({
          type: 'mcq',
          question: 'Select the best meaning for: ' + (card.word && card.word.base ? card.word.base : card.id),
          choices: choices,
          answer: choices.indexOf(correct),
          cardId: card.id
        });
      }
      if (types.includes('cloze')) {
        const example = (card.example || '').replace(new RegExp(card.word && card.word.base ? card.word.base : '', 'i'), '_____');
        items.push({
          type: 'cloze',
          question: example || '_____',
          answer: (card.word && card.word.base) || '',
          cardId: card.id
        });
      }
    });

    return { items: items };
  }
};


