import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  notificationsApi,
  resolveMarketingNotificationHref,
  type MarketingNotification,
} from '../../services/api/notificationsApi'
import { presentErrorMessage } from '../../shared/errors/presentError'
import { AppIcon } from './AppIcon'

function relativeTime(value: string) {
  const then = new Date(value).getTime()
  if (!Number.isFinite(then)) return ''
  const delta = Date.now() - then
  const minutes = Math.round(delta / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export default function NotificationCenter({
  compact = false,
}: {
  compact?: boolean
}) {
  const { hasPermission } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<MarketingNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const canList = hasPermission('notifications', 'list')
  const canView = hasPermission('notifications', 'view')
  const canMarkRead = hasPermission('notifications', 'mark_read')
  const canMarkAllRead = hasPermission('notifications', 'mark_all_read')

  const refresh = useCallback(async () => {
    if (!canList && !canView) return
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        canList ? notificationsApi.list({ limit: 12, offset: 0 }) : Promise.resolve(null),
        canView ? notificationsApi.stats() : Promise.resolve(null),
      ])
      if (listRes?.error) {
        showToast(presentErrorMessage({ error: listRes.error, status: listRes.status }, 'section-load'), 'error')
      } else if (listRes?.data) {
        setItems(listRes.data.items)
      }
      if (statsRes?.data) setUnreadCount(statsRes.data.unread_count)
    } catch (error) {
      showToast(presentErrorMessage(error, 'section-load'), 'error')
    } finally {
      setLoading(false)
    }
  }, [canList, canView, showToast])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  if (!canList && !canView) return null

  async function openNotification(notification: MarketingNotification) {
    const href = resolveMarketingNotificationHref(notification)
    if (!notification.is_read && canMarkRead) {
      try {
        await notificationsApi.markRead(notification.id)
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        )
        setUnreadCount((count) => Math.max(0, count - 1))
      } catch {
        // Opening should still work if mark-read fails.
      }
    }
    setOpen(false)
    if (!href) {
      showToast('This notification has no linked page yet.', 'info')
      return
    }
    if (href.startsWith('/leads-detail')) {
      const id = new URL(href, window.location.origin).searchParams.get('id') || ''
      void navigate({ to: '/leads-detail', search: { id } })
      return
    }
    void navigate({ to: href as never })
  }

  async function markAllRead() {
    if (!canMarkAllRead) return
    const result = await notificationsApi.markAllRead()
    if (result.error) {
      showToast(presentErrorMessage({ error: result.error, status: result.status }, 'background-action'), 'error')
      return
    }
    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
    setUnreadCount(0)
    showToast('All notifications marked as read', 'success')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current)
          if (!open) void refresh()
        }}
        className={
          compact
            ? 'relative flex h-9 w-9 items-center justify-center rounded-xl text-[#64718A] transition-colors hover:bg-[#EEF0F8] hover:text-[#1A2038] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30'
            : 'relative flex h-9 w-9 items-center justify-center rounded-xl text-[#64718A] transition-colors hover:bg-[#EEF0F8] hover:text-[#1A2038] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30'
        }
        title="Notifications"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <AppIcon name="notification" size={18} />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-[#F7F8FA] bg-red" />
        ) : null}
      </button>

      {open ? (
        <div className="fixed left-4 top-14 z-[9999] w-80 max-h-96 overflow-y-auto rounded-xl border border-[#E3E6EF] bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between border-b border-[#E3E6EF] px-3 py-2.5">
            <span className="text-[11px] font-bold text-[#1A2038]">Notifications</span>
            {unreadCount > 0 && canMarkAllRead ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-[10px] font-medium text-navy hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {loading && items.length === 0 ? (
            <div className="px-3 py-5 text-center text-xs text-[#7B82A0]">Loading notifications…</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-5 text-center text-xs text-[#7B82A0]">No notifications</div>
          ) : (
            items.map((notification) => {
              const href = resolveMarketingNotificationHref(notification)
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={`flex w-full items-start gap-2 border-b border-[#E3E6EF] px-3 py-2.5 text-left text-xs transition hover:bg-[#F7F8FA] ${
                    notification.is_read ? '' : 'bg-blue-50/60'
                  }`}
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy">
                    <AppIcon name="notification" size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold leading-snug text-[#1A2038]">
                      {notification.title}
                    </p>
                    {notification.message ? (
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-[#64718A]">
                        {notification.message}
                      </p>
                    ) : null}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#7B82A0]">
                        {relativeTime(notification.created_at)}
                      </span>
                      {href ? (
                        <span className="text-[10px] font-semibold text-navy">
                          {href.startsWith('/leads-detail') ? 'Open lead' : 'Open'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
