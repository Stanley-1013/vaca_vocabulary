/**
 * LLM 控制器（後端代理）
 * 
 * 路由：
 *  - POST /llm/suggest  { count, tags, difficulty, learned_words_summary, avoid_words }
 *  - POST /llm/quiz     { cardIds: string[], types?: ('mcq'|'cloze')[] }
 */

const LLMController = {
  /**
   * POST /llm/suggest
   * @param {Object} request
   */
  suggest: function(request) {
    const body = request.body || {};
    try {
      ResponseUtils.validateRequiredFields(body, ['count']);
      const result = LLMService.suggest(body);
      return result;
    } catch (e) {
      Logger.log('LLMController.suggest error: ' + e.toString());
      throw new Error('LLM suggest failed: ' + e.message);
    }
  },

  /**
   * POST /llm/quiz
   * @param {Object} request
   */
  quiz: function(request) {
    const body = request.body || {};
    try {
      ResponseUtils.validateRequiredFields(body, ['cardIds']);
      const result = LLMService.quiz(body);
      return result;
    } catch (e) {
      Logger.log('LLMController.quiz error: ' + e.toString());
      throw new Error('LLM quiz failed: ' + e.message);
    }
  }
};


