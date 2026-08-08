import { useEffect, useCallback, type ReactNode } from 'react'

type ModalSize = 'sm' | 'md' | 'lg'

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 flex-col rounded-lg bg-surface shadow-lg sm:max-h-[calc(100dvh-2rem)] ${sizeStyles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="modal-title" className="min-w-0 break-words text-base font-semibold text-text">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-3 hover:bg-surface-1 hover:text-text"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-w-0 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
