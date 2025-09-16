/**
 * 應用程式啟動器
 * 檢查設定狀態，決定顯示設定向導或主應用程式
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// --- Hook and Service Imports ---
import { useUserConfig } from '../hooks/useUserConfig';
import { useGoogleAPI } from '../hooks/useGoogleAPI';
import { useFeatureFlag, FEATURE_FLAGS, FeatureFlagDebugPanel } from './FeatureToggle';
import { useVNextSettings } from '../hooks/useVNextSettings';
import { useToast } from './Toast';
import { useDueCards } from '../hooks/useDueCards';
import { useReviewCard } from '../hooks/useReviewCard';

// --- Component Imports ---
import ImprovedSetupWizard, { ImprovedUserConfig } from './Setup/ImprovedSetupWizard';
import DailyReviewManager from './DailyReviewManager';
import SettingsPage from './SettingsPage';
import LanguageSelector from './LanguageSelector';
import Card from './Card/Card';
import CompletionPage from './CompletionPage';
import FeatureToggle from './FeatureToggle';

// --- Type Imports ---
import { Quality } from '../types';

// #################################################################################
// VNextApp UI Logic (Previously in VNextApp.tsx)
// #################################################################################
const VNextAppUI: React.FC = () => {
  type ViewMode = 'review' | 'settings';
  const [currentView, setCurrentView] = useState<ViewMode>('review');
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [isLoadingMoreCards, setIsLoadingMoreCards] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { settings, saveSettings, isLoading: isSettingsLoading } = useVNextSettings();
  const { isEnabled: isQuizEnabled } = useFeatureFlag(FEATURE_FLAGS.LLM_QUIZ, true);
  const { showToast, ToastProvider } = useToast();

  const handleMoreCards = async () => {
    if (isLoadingMoreCards) return;
    setIsLoadingMoreCards(true);
    try {
      const { apiService } = await import('../services/api');
      const newCards = await apiService.loadMoreCards(5);
      if (newCards.length > 0) {
        showToast(`成功載入 ${newCards.length} 張新卡片！`, 'success');
        await queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });
      } else {
        showToast('沒有更多卡片可載入', 'info');
      }
    } catch (error) {
      console.error('❌ 載入更多卡片失敗:', error);
      showToast('載入卡片失敗，請稍後再試', 'error');
    } finally {
      setIsLoadingMoreCards(false);
    }
  };

  const handleQuiz = async () => {
    if (isLoadingQuiz) return;
    setIsLoadingQuiz(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('🎯 AI 測驗功能尚未完全實作！');
    } catch (error) {
      console.error('❌ AI 測驗啟動失敗:', error);
      alert('AI 測驗啟動失敗，請稍後再試');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleResetSetup = () => {
    if (confirm('確定要重置所有設定並回到初始設定頁面嗎？')) {
      try {
        localStorage.removeItem('vaca-user-config');
        localStorage.removeItem('vaca-vnext-settings');
        localStorage.removeItem('featureFlags');
        localStorage.removeItem('google-auth-state');
        showToast('設定已重置，即將重新載入...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('重置設定失敗:', error);
        showToast('重置設定失敗', 'error');
      }
    }
  };

  if (isSettingsLoading) {
    return <LoadingView message="載入設定中..." />;
  }

  return (
    <div className="vnext-app min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              智能學習系統 <span className="text-xs sm:text-sm font-normal text-blue-600 ml-1 sm:ml-2">v1.1</span>
            </h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <LanguageSelector showText={false} size="sm" className="mr-1 sm:mr-2" />
              <button onClick={() => setCurrentView('review')} className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm ${currentView === 'review' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>📚 複習</button>
              <button onClick={() => setCurrentView('settings')} className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm ${currentView === 'settings' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>⚙️ 設定</button>
              <button onClick={handleResetSetup} className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg font-medium text-xs sm:text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors" title="清除所有設定，回到初始設定頁面">🔄 重設</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentView === 'review' ? (
          <FeatureToggle featureKey={FEATURE_FLAGS.VNEXT_DAILY_SELECTION} defaultEnabled={true} fallback={<div>增強功能未啟用</div>}>
            <DailyReviewManager config={settings} onMoreCards={handleMoreCards} onQuiz={isQuizEnabled ? handleQuiz : undefined} busy={isLoadingMoreCards || isLoadingQuiz} />
          </FeatureToggle>
        ) : (
          <FeatureToggle featureKey={FEATURE_FLAGS.VNEXT_SETTINGS} defaultEnabled={true} fallback={<div>設定功能未啟用</div>}>
            <SettingsPage initialSettings={settings} onSave={(newSettings) => { saveSettings(newSettings); showToast('設定已保存！', 'success', 2000); }} />
          </FeatureToggle>
        )}
      </main>
      <FeatureFlagDebugPanel />
      <ToastProvider />
    </div>
  );
};

// #################################################################################
// Legacy StudySession UI Logic (Previously in App.tsx)
// #################################################################################
const StudySession: React.FC = () => {
  const { data: dueCards = [], isLoading, error } = useDueCards();
  const reviewCardMutation = useReviewCard();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const currentCard = dueCards[currentCardIndex];

  const handleReview = useCallback(async (quality: Quality) => {
    if (!currentCard) return;
    try {
      await reviewCardMutation.mutateAsync({ id: currentCard.id, quality });
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % dueCards.length);
    } catch (err) {
      console.error('Review failed:', err);
    }
  }, [currentCard, reviewCardMutation, dueCards.length]);

  if (isLoading) return <LoadingView message="Loading cards..." />;
  if (error) return <div className="text-white">Error: {error.message}</div>;
  if (dueCards.length === 0) return <CompletionPage reviewedCount={0} newCardsCount={0} />;

  return (
    <div className="relative">
      {dueCards.length > 1 && <div className="progress-indicator">{currentCardIndex + 1} / {dueCards.length}</div>}
      <Card card={currentCard} onReview={handleReview} isLoading={reviewCardMutation.isPending} />
    </div>
  );
};

// #################################################################################
// AppLauncher Logic
// #################################################################################
const AppLauncher: React.FC = () => {
  const { isConfigured, updateConfig } = useUserConfig();
  const { isAuthenticated, initializeAPI, authenticate } = useGoogleAPI();
  const [currentView, setCurrentView] = useState<'loading' | 'setup' | 'authenticating' | 'app'>('loading');

  useEffect(() => {
    const determineView = async () => {
      if (!isConfigured) return setCurrentView('setup');
      if (!isAuthenticated) {
        setCurrentView('authenticating');
        try {
          const initialized = await initializeAPI();
          if (initialized) {
            const authenticated = await authenticate();
            if (authenticated) setCurrentView('app');
            else setCurrentView('setup');
          } else {
            setCurrentView('setup');
          }
        } catch (error) {
          console.error('驗證過程失敗:', error);
          setCurrentView('setup');
        }
      } else {
        setCurrentView('app');
      }
    };
    determineView();
  }, [isConfigured, isAuthenticated, updateConfig, initializeAPI, authenticate]);

  const handleSetupComplete = (newConfig: ImprovedUserConfig) => {
    // 轉換簡化設定為完整設定格式
    const fullConfig = {
      googleSheetId: newConfig.googleSheetId,
      llmProvider: 'gemini' as const,
      llmApiKey: newConfig.geminiApiKey,
      setupCompleted: true,
      googleAuthCompleted: false, // 讓正常的認證流程處理
      llmConfigCompleted: true,
      // 同時保存學習偏好
      dailyGoal: newConfig.dailyGoal,
      difficulty: newConfig.difficulty,
      preferredTopics: newConfig.preferredTopics,
      examTypes: newConfig.examTypes
    };

    // 儲存完整設定
    localStorage.setItem('improvedUserConfig', JSON.stringify(newConfig));

    // 建立對應的 vNext 設定
    const vNextSettings = {
      maxDailyReviews: newConfig.dailyGoal * 4,
      minNewPerDay: Math.max(1, newConfig.dailyGoal - 2),
      maxNewPerDay: newConfig.dailyGoal,
      algorithm: 'leitner',
      againGapSequence: [2, 5, 10],
      priorityWeights: { ease: 0.5, overdueDays: 0.3, box: 0.2 },
      llmConfig: {
        provider: 'gemini',
        driveBasePath: '/VACA_LLM',
        modelName: 'gemini-1.5-flash'
      },
      preferredExamTypes: newConfig.examTypes,
      defaultDifficulty: newConfig.difficulty,
      generateCount: newConfig.dailyGoal,
      preferredTopics: newConfig.preferredTopics
    };

    localStorage.setItem('vNextSettings', JSON.stringify(vNextSettings));

    updateConfig(fullConfig);

    // 直接跳到 app，跳過認證步驟
    setCurrentView('app');
  };

  const renderView = () => {
    switch (currentView) {
      case 'loading': return <LoadingView />;
      case 'setup': return <ImprovedSetupWizard onComplete={handleSetupComplete} />;
      case 'authenticating': return <AuthenticatingView />;
      case 'app': return <AppView />;
      default: return <LoadingView />;
    }
  };

  return <div className="app-launcher">{renderView()}</div>;
};

// #################################################################################
// Helper and View Components
// #################################################################################
const LoadingView: React.FC<{ message?: string }> = ({ message = '正在載入...' }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">VACA 背單字</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

const AuthenticatingView: React.FC = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-bounce text-6xl mb-6">🔐</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">正在驗證 Google 服務</h2>
        </div>
    </div>
);

const AppView: React.FC = () => {
  const { isEnabled: useVNext } = useFeatureFlag(FEATURE_FLAGS.VNEXT_DAILY_SELECTION, true);
  return useVNext ? <VNextAppUI /> : <StudySession />;
};

export default AppLauncher;
''