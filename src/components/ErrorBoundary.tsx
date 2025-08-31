/**
 * 錯誤邊界組件
 * 
 * 捕獲子組件中的 JavaScript 錯誤並顯示備用 UI，防止整個應用崩潰
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // 更新 state 以便下一次渲染能夠顯示降級後的 UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 你同樣可以將錯誤日誌上報給服務器
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 調用外部錯誤處理函數
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  public render() {
    if (this.state.hasError) {
      // 使用自定義的 fallback UI 或默認的錯誤 UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                應用程序出現錯誤
              </h2>
              <p className="text-gray-600 mb-6">
                很抱歉，應用程序遇到了意外錯誤。請嘗試重新載入頁面。
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  重新載入頁面
                </button>
                
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  嘗試恢復
                </button>
              </div>

              {/* 開發模式下顯示錯誤詳情 */}
              {import.meta.env.MODE === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    錯誤詳情 (開發模式)
                  </summary>
                  <div className="mt-2 p-3 bg-red-50 rounded border text-xs">
                    <div className="font-mono text-red-800 whitespace-pre-wrap">
                      {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div className="mt-2 font-mono text-red-600 whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary