/**
 * Toast 通知組件
 * 
 * 用於替代直接 DOM 操作的 React 式通知系統
 */

import React, { useState, useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose?: () => void
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    type: ToastProps['type']
    duration?: number
  }>
  onRemove: (id: string) => void
}

// 單個 Toast 組件
const Toast: React.FC<ToastProps & { id?: string; onClose?: () => void }> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getToastStyles = () => {
    const baseStyles = 'px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform'
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500`
      case 'error':
        return `${baseStyles} bg-red-500`
      case 'warning':
        return `${baseStyles} bg-yellow-500`
      default:
        return `${baseStyles} bg-blue-500`
    }
  }

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center justify-between gap-2">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 ml-2 text-lg leading-none"
            aria-label="關閉通知"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

// Toast 容器組件
const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed z-50 space-y-2"
      style={{
        top: 'calc(env(safe-area-inset-top, 0) + 1rem)',
        right: 'calc(env(safe-area-inset-right, 0) + 1rem)'
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: ToastProps['type']
    duration?: number
  }>>([])

  const showToast = (message: string, type: ToastProps['type'] = 'info', duration = 3000) => {
    const id = Date.now().toString()
    const newToast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastProvider = () => (
    <ToastContainer toasts={toasts} onRemove={removeToast} />
  )

  return {
    showToast,
    removeToast,
    ToastProvider
  }
}

export default Toast