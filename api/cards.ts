/**
 * Vercel Serverless Function - Cards API
 *
 * 職責：處理單字卡片的 CRUD 操作，取代 Google Apps Script 後端
 * 支援：GET (讀取到期卡片) 和 POST (複習卡片)
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

// 配置常數
const CONFIG = {
  SHEET_ID: process.env.SHEET_ID!,
  SHEET_NAME: '工作表1',
  MAX_CARDS_PER_REQUEST: 100,

  // SRS 算法配置
  LEITNER: {
    INTERVALS: [0, 1, 2, 3, 7, 14],
    MAX_BOX: 5
  },

  SM2: {
    DEFAULT_EASE: 2.5,
    DEFAULT_REPS: 0,
    DEFAULT_INTERVAL: 0,
    MIN_EASE: 1.3,
    MAX_EASE: 3.0
  }
};

// 初始化 Google Sheets API 客戶端
function getGoogleSheetsClient() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64!, 'base64').toString()
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}

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

// GET - 獲取到期卡片
async function getCards(req: VercelRequest, res: VercelResponse) {
  try {
    const { due, limit = '20', algo = 'leitner' } = req.query;
    const cardLimit = Math.min(parseInt(limit as string), CONFIG.MAX_CARDS_PER_REQUEST);

    if (due && due !== 'today') {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Only due=today is supported'));
    }

    if (!['leitner', 'sm2'].includes(algo as string)) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Algorithm must be "leitner" or "sm2"'));
    }

    const sheets = getGoogleSheetsClient();

    // 讀取 Google Sheet 資料
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.SHEET_ID,
      range: `${CONFIG.SHEET_NAME}!A:Q`, // 假設有17個欄位 (A-Q)
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.json(successResponse([]));
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // 將行資料轉換為卡片物件
    const allCards = dataRows.map(row => rowToCard(row, headers)).filter(card => card?.id);

    // 如果請求到期卡片，進行篩選
    let cards = allCards;
    if (due === 'today') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      cards = allCards.filter(card => {
        if (!card.nextReviewAt) return false;
        const nextReview = new Date(card.nextReviewAt);
        return nextReview <= today;
      });

      // 按下次複習時間排序
      cards.sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
    }

    // 限制回傳數量
    const limitedCards = cards.slice(0, cardLimit);

    return res.json(successResponse(limitedCards));

  } catch (error) {
    console.error('GET /cards error:', error);
    return res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to fetch cards'));
  }
}

// POST - 複習卡片
async function reviewCard(req: VercelRequest, res: VercelResponse) {
  try {
    const { cardId, quality, algorithm = 'leitner' } = req.body;

    if (!cardId) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'cardId is required'));
    }

    if (![1, 2, 3].includes(quality)) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Quality must be 1, 2, or 3'));
    }

    if (!['leitner', 'sm2'].includes(algorithm)) {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Algorithm must be "leitner" or "sm2"'));
    }

    const sheets = getGoogleSheetsClient();

    // 讀取所有資料以找到目標卡片
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.SHEET_ID,
      range: `${CONFIG.SHEET_NAME}!A:Q`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Card not found'));
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // 找到目標卡片
    const cardIndex = dataRows.findIndex(row => row[headers.indexOf('id')] === cardId);
    if (cardIndex === -1) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Card not found'));
    }

    const card = rowToCard(dataRows[cardIndex], headers);

    // 使用 SRS 算法計算新的複習資料
    const srsResult = calculateNextReview(card, quality, algorithm);

    // 更新卡片資料
    const updatedCard = {
      ...card,
      ...srsResult,
      lastReviewedAt: new Date().toISOString()
    };

    // 將更新後的卡片轉換為行資料
    const updatedRow = cardToRow(updatedCard, headers);

    // 更新 Google Sheet (行號 = 資料索引 + 2，因為有標題行且索引從0開始)
    await sheets.spreadsheets.values.update({
      spreadsheetId: CONFIG.SHEET_ID,
      range: `${CONFIG.SHEET_NAME}!${cardIndex + 2}:${cardIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow]
      }
    });

    return res.json(successResponse({
      nextReviewAt: updatedCard.nextReviewAt,
      interval: updatedCard.interval,
      box: updatedCard.box,
      ease: updatedCard.ease,
      reps: updatedCard.reps
    }));

  } catch (error) {
    console.error('POST /cards/review error:', error);
    return res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to review card'));
  }
}

// 主要處理函數
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return getCards(req, res);
  }

  if (req.method === 'POST') {
    return reviewCard(req, res);
  }

  return res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed'));
}

// 工具函數：將行資料轉換為卡片物件
function rowToCard(row: any[], headers: string[]) {
  const card: any = {};

  headers.forEach((header, index) => {
    const value = row[index];

    // 處理 JSON 字串欄位
    if (['word.forms', 'synonyms', 'antonyms', 'anchors', 'tags'].includes(header)) {
      try {
        card[header] = value ? JSON.parse(value.toString()) : [];
      } catch {
        card[header] = [];
      }
    } else {
      card[header] = value;
    }
  });

  // 重構 word 物件
  if (card['word.base']) {
    card.word = {
      base: card['word.base'],
      forms: card['word.forms'] || []
    };
    delete card['word.base'];
    delete card['word.forms'];
  }

  return card;
}

// 工具函數：將卡片物件轉換為行資料
function cardToRow(card: any, headers: string[]) {
  return headers.map(header => {
    let value = card[header];

    if (header === 'word.base' && card.word) {
      value = card.word.base;
    } else if (header === 'word.forms' && card.word) {
      value = JSON.stringify(card.word.forms || []);
    } else if (['synonyms', 'antonyms', 'anchors', 'tags'].includes(header)) {
      value = JSON.stringify(value || []);
    }

    return value !== undefined ? value : '';
  });
}

// SRS 算法實現
function calculateNextReview(card: any, quality: number, algorithm: string) {
  if (algorithm === 'sm2') {
    return calculateSM2(card, quality);
  } else {
    return calculateLeitner(card, quality);
  }
}

function calculateLeitner(card: any, quality: number) {
  let newBox = card.box || 1;

  switch (quality) {
    case 3: // 容易
      newBox = Math.min(CONFIG.LEITNER.MAX_BOX, newBox + 1);
      break;
    case 2: // 普通
      break;
    case 1: // 困難
      newBox = 1;
      break;
  }

  const intervalDays = CONFIG.LEITNER.INTERVALS[newBox] || 0;
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    box: newBox,
    ease: card.ease || CONFIG.SM2.DEFAULT_EASE,
    reps: (card.reps || 0) + 1,
    interval: intervalDays,
    nextReviewAt: nextReviewDate.toISOString()
  };
}

function calculateSM2(card: any, quality: number) {
  let ease = card.ease || CONFIG.SM2.DEFAULT_EASE;
  let reps = card.reps || CONFIG.SM2.DEFAULT_REPS;
  let interval = card.interval || CONFIG.SM2.DEFAULT_INTERVAL;

  if (quality === 1) {
    reps = 0;
    interval = 1;
    ease = Math.max(CONFIG.SM2.MIN_EASE, ease - 0.2);
  } else {
    reps += 1;

    if (quality === 3) {
      ease = Math.min(CONFIG.SM2.MAX_EASE, ease + 0.1);
    }

    if (reps === 1) {
      interval = 1;
    } else if (reps === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    box: card.box || 1,
    ease: Number(ease.toFixed(2)),
    reps: reps,
    interval: interval,
    nextReviewAt: nextReviewDate.toISOString()
  };
}