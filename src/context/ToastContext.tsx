/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { TickCircle, CloseCircle, InfoCircle } from 'iconsax-react'
import { parseApiError } from '../services/api/apiClient'

interface Toast {
  id: number
  msg: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  showToast: (msg: unknown, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (msg: unknown, type: 'success' | 'error' | 'info' = 'info') => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, msg: parseApiError(msg), type }])
      setTimeout(() => removeToast(id), 3000)
    },
    [removeToast],
  )

  const iconMap: Record<string, { icon: React.ReactNode; bg: string; border: string }> = {
    success: {
      icon: <TickCircle size="20" color="#ffffff" variant="Outline" />,
      bg: '#0A6B3E',
      border: '#0A6B3E',
    },
    error: {
      icon: <CloseCircle size="20" color="#ffffff" variant="Outline" />,
      bg: '#CC0000',
      border: '#CC0000',
    },
    info: {
      icon: <InfoCircle size="20" color="#ffffff" variant="Outline" />,
      bg: '#1F3D7A',
      border: '#1F3D7A',
    },
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const cfg = iconMap[t.type]
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-3 rounded-lg px-5 py-3 shadow-lg animate-slide-in-right"
              style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, color: '#ffffff' }}
            >
              {cfg.icon}
              <span className="max-w-[min(28rem,calc(100vw-5rem))] break-words text-sm font-medium">{t.msg}</span>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
