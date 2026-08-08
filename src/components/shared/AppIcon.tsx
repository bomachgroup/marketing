import React from 'react'
import * as Iconsax from 'iconsax-react'
import type { Icon } from 'iconsax-react'

interface AppIconProps {
  name: string
  size?: number
  className?: string
  color?: string
}

export function AppIcon({ name, size = 18, className = '', color = 'currentColor' }: AppIconProps) {
  const clean = (name || '').replace(/^ti-/, '').toLowerCase()

  let Component: Icon | React.ComponentType<React.SVGProps<SVGSVGElement>> | undefined

  switch (clean) {
    case 'device-desktop':
    case 'desk':
    case 'desktop':
    case 'workdesk':
    case 'monitor':
      Component = Iconsax.Monitor
      break

    case 'address-book':
    case 'lead-journal':
    case 'journal':
      Component = Iconsax.BookSaved
      break

    case 'plug-connected':
    case 'plug':
    case 'integrations':
    case 'routing':
      Component = Iconsax.Routing2
      break

    case 'command':
    case 'revenue-command':
    case 'crown':
      Component = Iconsax.Crown1
      break

    case 'bolt':
    case 'daily-execution':
    case 'flash':
      Component = Iconsax.Flash
      break

    case 'road':
    case 'turnaround':
    case 'trend-up':
      Component = Iconsax.TrendUp
      break

    case 'layout-dashboard':
    case 'dashboard':
    case 'category':
      Component = Iconsax.Category
      break

    case 'target':
    case 'okrs':
    case 'radar':
      Component = Iconsax.Radar
      break

    case 'file-analytics':
    case 'reports':
    case 'document-text':
      Component = Iconsax.DocumentText
      break

    case 'radar-2':
    case 'lead-control':
    case 'eye':
      Component = Iconsax.Eye
      break

    case 'filter-search':
    case 'funnel-audit':
    case 'filter':
      Component = Iconsax.FilterSearch
      break

    case 'chart-arrows-vertical':
    case 'forecast':
    case 'chart-square':
      Component = Iconsax.ChartSquare
      break

    case 'shield-check':
    case 'compliance':
    case 'security-safe':
      Component = Iconsax.SecuritySafe
      break

    case 'users':
    case 'pipeline':
    case 'people':
      Component = Iconsax.People
      break

    case 'speakerphone':
    case 'campaigns':
    case 'notification-bing':
      Component = Iconsax.NotificationBing
      break

    case 'calendar':
    case 'calendar-event':
    case 'marketing-meetings':
    case 'calendar-1':
      Component = Iconsax.Calendar1
      break

    case 'photo-video':
    case 'media':
    case 'gallery':
      Component = Iconsax.Gallery
      break

    case 'users-group':
    case 'partners':
    case 'profile-2user':
      Component = Iconsax.Profile2User
      break

    case 'chart-bar':
    case 'analytics':
    case 'chart-2':
      Component = Iconsax.Chart2
      break

    case 'headset':
    case 'support':
    case 'call':
      Component = Iconsax.Call
      break

    case 'user-plus':
    case 'new-lead':
    case 'user-add':
      Component = Iconsax.UserAdd
      break

    case 'book-2':
    case 'playbooks':
    case 'book-1':
      Component = Iconsax.Book1
      break

    case 'school':
    case 'coaching':
    case 'teacher':
      Component = Iconsax.Teacher
      break

    case 'layout-kanban':
    case 'content-studio':
    case 'video-play':
      Component = Iconsax.VideoPlay
      break

    case 'repeat':
    case 'retention':
    case 'refresh-2':
      Component = Iconsax.Refresh2
      break

    case 'mail-forward':
    case 'email-center':
    case 'sms':
      Component = Iconsax.Sms
      break

    case 'ad':
    case 'media-register':
    case 'broadcasting':
      Component = Iconsax.Brodcast
      break

    case 'transfer':
    case 'handoff':
    case 'convert-card':
      Component = Iconsax.ConvertCard
      break

    case 'user-star':
    case 'realtor-portal':
    case 'user-tag':
      Component = Iconsax.UserTag
      break

    case 'brand-instagram':
    case 'partner-portal':
    case 'briefcase':
      Component = Iconsax.Briefcase
      break

    case 'lock-access':
    case 'role-governance':
    case 'shield-security':
      Component = Iconsax.ShieldSecurity
      break

    case 'checkup-list':
    case 'approvals':
    case 'tick-square':
      Component = Iconsax.TickSquare
      break

    case 'history':
    case 'audit-log':
    case 'receipt-square':
      Component = Iconsax.ReceiptSquare
      break

    case 'palette':
    case 'design':
    case 'brush-1':
      Component = Iconsax.Brush
      break

    case 'brand-whatsapp':
    case 'whatsapp':
    case 'message-text':
      Component = Iconsax.MessageText1
      break

    case 'bell':
    case 'notification':
      Component = Iconsax.NotificationBing
      break

    case 'chevron-down':
    case 'arrow-down':
      Component = Iconsax.ArrowDown2
      break

    case 'chevron-right':
    case 'arrow-right':
      Component = Iconsax.ArrowRight2
      break

    case 'chevron-left':
    case 'arrow-left':
      Component = Iconsax.ArrowLeft2
      break

    case 'menu-2':
    case 'menu':
    case 'hamberger-menu':
      Component = Iconsax.HambergerMenu
      break

    case 'search':
    case 'search-normal':
      Component = Iconsax.SearchNormal1
      break

    case 'x':
    case 'square-x':
    case 'close-square':
      Component = Iconsax.CloseSquare
      break

    case 'logout':
      Component = Iconsax.Logout
      break

    case 'plus':
    case 'add':
      Component = Iconsax.Add
      break

    case 'rotate':
    case 'rotate-right':
    case 'refresh':
    case 'reload':
    case 'sync':
    case 'refresh-circle':
    case 'loader-2':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 inline-block align-middle ${className}`}
        >
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 20v-4h4" />
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 4v4h-4" />
        </svg>
      )

    case 'download':
      Component = Iconsax.Import
      break

    case 'folder':
    case 'folder-open':
      Component = Iconsax.FolderOpen
      break

    case 'send':
      Component = Iconsax.Send2
      break

    case 'edit':
      Component = Iconsax.Edit2
      break

    case 'trash':
      Component = Iconsax.Trash
      break

    case 'grid':
    case 'element-3':
    case 'layout-grid':
      Component = Iconsax.Element3
      break

    case 'check':
      Component = Iconsax.Check
      break

    case 'checklist':
      Component = Iconsax.TaskSquare
      break

    case 'circle':
      Component = Iconsax.Status
      break

    case 'circle-check':
      Component = Iconsax.TickCircle
      break

    case 'corner-down-right':
      Component = Iconsax.ArrowDown2
      break

    case 'user-check':
      Component = Iconsax.UserTick
      break

    case 'arrow-up':
      Component = Iconsax.ArrowUp2
      break

    case 'link':
      Component = Iconsax.Link
      break

    case 'notebook':
      Component = Iconsax.BookSaved
      break

    case 'copy':
      Component = Iconsax.Copy
      break

    case 'home':
      Component = Iconsax.Home
      break

    case 'player-pause':
      Component = Iconsax.Pause
      break

    case 'message':
      Component = Iconsax.Message
      break

    case 'alert-circle':
      Component = Iconsax.InfoCircle
      break

    case 'shield-alert':
      Component = Iconsax.ShieldSlash
      break

    case 'scan':
      Component = Iconsax.Scanner
      break

    case 'currency-naira':
      Component = Iconsax.Money
      break

    case 'chart-line':
      Component = Iconsax.Chart
      break

    case 'alert-small':
      Component = Iconsax.Information
      break

    case 'alert-triangle':
      Component = Iconsax.Warning2
      break

    case 'sun':
      Component = Iconsax.Sun
      break

    case 'sun-high':
      Component = Iconsax.Sun1
      break

    case 'moon':
      Component = Iconsax.Moon
      break

    case 'upload':
      Component = Iconsax.Export
      break

    case 'mail':
      Component = Iconsax.Sms
      break

    case 'book':
      Component = Iconsax.Book
      break

    case 'file-text':
      Component = Iconsax.DocumentText
      break

    case 'setting-2':
      Component = Iconsax.Setting2
      break

    case 'building':
      Component = Iconsax.Building
      break

    case 'box':
      Component = Iconsax.Box
      break

    case 'clock':
      Component = Iconsax.Clock
      break

    case 'messages':
      Component = Iconsax.Messages
      break

    case 'trending-up':
      Component = Iconsax.TrendUp
      break

    case 'trending-down':
      Component = Iconsax.TrendDown
      break

    case 'info-circle':
      Component = Iconsax.InfoCircle
      break

    case 'check-check':
      Component = Iconsax.Check
      break

    case 'minus':
      Component = Iconsax.Minus
      break

    case 'scale':
      Component = Iconsax.Data
      break

    case 'hierarchy-3':
      Component = Iconsax.Hierarchy3
      break

    case 'database':
      Component = Iconsax.Data
      break

    case 'list-check':
      Component = Iconsax.TaskSquare
      break

    case 'lock-check':
      Component = Iconsax.ShieldSecurity
      break

    case 'ban':
      Component = Iconsax.CloseCircle
      break

    case 'lock':
      Component = Iconsax.Lock1
      break

    case 'database-off':
      Component = Iconsax.Data
      break

    case 'layout-board':
      Component = Iconsax.Element3
      break

    case 'photo':
      Component = Iconsax.Gallery
      break

    case 'mail-check':
      Component = Iconsax.Sms
      break

    case 'mail-opened':
      Component = Iconsax.Sms
      break

    case 'click':
      Component = Iconsax.Mouse
      break

    case 'archive':
      Component = Iconsax.Archive
      break

    case 'chart-pie':
      Component = Iconsax.Chart2
      break

    case 'heart-pulse':
      Component = Iconsax.Health
      break

    case 'hourglass':
      Component = Iconsax.Clock
      break

    case 'target-arrow':
      Component = Iconsax.Radar
      break

    case 'message-circle':
      Component = Iconsax.Message
      break

    case 'message-question':
      Component = Iconsax.MessageText1
      break

    default:
      Component = Iconsax.Discover
  }

  if (Component) {
    return <Component size={size} color={color} variant="Outline" className={`shrink-0 inline-block align-middle ${className}`} />
  }

  return <i className={`ti ti-${clean} shrink-0 inline-block align-middle ${className}`} style={{ fontSize: `${size}px` }} />
}
