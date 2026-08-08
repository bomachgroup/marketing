import type { ReactNode } from 'react'
import { parseApiError } from '../../services/api/apiClient'
import { AppIcon } from './AppIcon'

interface ModalDialogProps {
  isOpen: boolean
  title: unknown
  description?: unknown
  type?: 'success' | 'error' | 'warning' | 'info'
  confirmText?: unknown
  cancelText?: unknown
  onConfirm: () => void
  onCancel?: () => void
  children?: ReactNode
}

export function ModalDialog({
  isOpen,
  title,
  description,
  type = 'info',
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  children,
}: ModalDialogProps) {
  if (!isOpen) return null

  const parsedTitle = parseApiError(title)
  const parsedDescription = description ? parseApiError(description) : ''
  const parsedConfirmText = parseApiError(confirmText)
  const parsedCancelText = cancelText ? parseApiError(cancelText) : ''

  const iconConfig = {
    success: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      iconName: 'circle-check' as const,
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    error: {
      bg: 'bg-rose-50 text-rose-600 border-rose-200',
      iconName: 'alert-circle' as const,
      btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-600 border-amber-200',
      iconName: 'alert-triangle' as const,
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      bg: 'bg-blue-50 text-blue-600 border-blue-200',
      iconName: 'alert-circle' as const,
      btnClass: 'bg-navy hover:bg-navy-dark text-white',
    },
  }[type]

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 sm:p-4">
      <div className="w-full max-w-md min-w-0 max-h-[calc(100dvh-1.5rem)] overflow-y-auto bg-surface border border-border rounded-2xl p-4 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl ${iconConfig.bg}`}>
            <AppIcon name={iconConfig.iconName} size={20} />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="break-words text-sm font-bold leading-snug text-text">{parsedTitle}</h3>
            {parsedDescription && <p className="break-words text-xs font-medium leading-relaxed text-text-3">{parsedDescription}</p>}
          </div>
        </div>

        {children && <div className="py-1">{children}</div>}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-border/60">
          {parsedCancelText && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="min-w-0 px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text hover:bg-surface-1 transition-all active:scale-95 cursor-pointer"
            >
              {parsedCancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`min-w-0 px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer ${iconConfig.btnClass}`}
          >
            {parsedConfirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
