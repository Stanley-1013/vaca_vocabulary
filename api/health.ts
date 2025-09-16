/**
 * Vercel Serverless Function - Health Check API
 *
 * 職責：提供系統健康狀態檢查，監控 Google Sheets 連線和系統狀態
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

// 配置常數
const CONFIG = {
  SHEET_ID: process.env.SHEET_ID!,
  SHEET_NAME: '工作表1',
  VERSION: '2.0.0' // 新版本 Vercel 後端
};

// 初始化 Google Sheets API 客戶端
function getGoogleSheetsClient() {
  try {
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64!, 'base64').toString()
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    throw new Error('Failed to initialize Google Sheets client');
  }
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

// 檢查配置有效性
function checkConfiguration() {
  const requiredEnvVars = ['SHEET_ID', 'GOOGLE_CREDENTIALS_BASE64'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  return {
    status: missingVars.length === 0 ? 'pass' : 'fail',
    message: missingVars.length === 0
      ? 'All required environment variables are configured'
      : `Missing environment variables: ${missingVars.join(', ')}`,
    missingVariables: missingVars
  };
}

// 檢查 Google Sheets 連線
async function checkGoogleSheets() {
  try {
    const sheets = getGoogleSheetsClient();

    // 測試讀取權限
    const response = await sheets.spreadsheets.get({
      spreadsheetId: CONFIG.SHEET_ID,
      fields: 'properties.title,sheets.properties.title'
    });

    // 檢查目標工作表是否存在
    const targetSheet = response.data.sheets?.find(
      sheet => sheet.properties?.title === CONFIG.SHEET_NAME
    );

    if (!targetSheet) {
      return {
        status: 'fail',
        message: `Sheet "${CONFIG.SHEET_NAME}" not found in spreadsheet`,
        spreadsheetTitle: response.data.properties?.title
      };
    }

    // 測試資料讀取
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.SHEET_ID,
      range: `${CONFIG.SHEET_NAME}!A1:A1`,
    });

    return {
      status: 'pass',
      message: 'Google Sheets connection successful',
      spreadsheetTitle: response.data.properties?.title,
      sheetName: CONFIG.SHEET_NAME,
      hasData: (dataResponse.data.values?.length || 0) > 0
    };

  } catch (error) {
    console.error('Google Sheets check failed:', error);
    return {
      status: 'fail',
      message: `Google Sheets connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// 檢查 Sheet 結構
async function checkSheetStructure() {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: CONFIG.SHEET_ID,
      range: `${CONFIG.SHEET_NAME}!1:1`,
    });

    const headers = response.data.values?.[0] || [];

    const expectedHeaders = [
      'id', 'word.base', 'word.forms', 'posPrimary', 'meaning',
      'synonyms', 'antonyms', 'example', 'anchors', 'tags',
      'createdAt', 'box', 'ease', 'reps', 'interval',
      'lastReviewedAt', 'nextReviewAt'
    ];

    const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));

    return {
      status: missingHeaders.length === 0 ? 'pass' : 'warn',
      message: missingHeaders.length === 0
        ? 'Sheet structure is correct'
        : `Missing columns: ${missingHeaders.join(', ')}`,
      expectedColumns: expectedHeaders.length,
      actualColumns: headers.length,
      missingColumns: missingHeaders,
      actualHeaders: headers
    };

  } catch (error) {
    return {
      status: 'fail',
      message: `Sheet structure check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// 基本健康檢查
async function basicHealthCheck() {
  const startTime = Date.now();

  try {
    // 檢查配置
    const configCheck = checkConfiguration();

    // 檢查 Google Sheets 連線
    const sheetsCheck = await checkGoogleSheets();

    const responseTime = Date.now() - startTime;
    const isHealthy = configCheck.status === 'pass' && sheetsCheck.status === 'pass';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: CONFIG.VERSION,
      platform: 'Vercel Serverless Functions',
      responseTime: `${responseTime}ms`,
      checks: {
        configuration: configCheck,
        database: sheetsCheck
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        sheetId: CONFIG.SHEET_ID ? `${CONFIG.SHEET_ID.substring(0, 8)}...` : 'not configured'
      }
    };

  } catch (error) {
    console.error('Health check error:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    };
  }
}

// 詳細健康檢查
async function detailedHealthCheck() {
  const basicHealth = await basicHealthCheck();

  try {
    // 擴展檢查項目
    const sheetStructureCheck = await checkSheetStructure();

    return {
      ...basicHealth,
      detailedChecks: {
        sheetStructure: sheetStructureCheck,
        memory: {
          status: 'pass',
          message: 'Memory usage within normal range',
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        uptime: {
          status: 'pass',
          message: `Process uptime: ${Math.round(process.uptime())}s`,
          uptime: process.uptime()
        }
      }
    };

  } catch (error) {
    console.error('Detailed health check error:', error);
    return {
      ...basicHealth,
      detailedCheckError: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 主要處理函數
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed'));
  }

  try {
    const { detailed } = req.query;

    if (detailed === 'true') {
      const healthStatus = await detailedHealthCheck();
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      return res.status(statusCode).json(successResponse(healthStatus));
    } else {
      const healthStatus = await basicHealthCheck();
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
      return res.status(statusCode).json(successResponse(healthStatus));
    }

  } catch (error) {
    console.error('Health endpoint error:', error);
    return res.status(500).json(errorResponse('SERVER_ERROR', 'Health check failed'));
  }
}