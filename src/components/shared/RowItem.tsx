import type { ReactNode } from 'react'

interface RowItemProps {
  icon?: ReactNode
  avatar?: ReactNode
  title: string
  meta?: string
  action?: ReactNode
}

export default function RowItem({ icon, avatar, title, meta, action }: RowItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {(icon || avatar) && (
        <div className="shrink-0">{avatar ?? icon}</div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-text">{title}</span>
        {meta && <span className="truncate text-xs text-text-3">{meta}</span>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}