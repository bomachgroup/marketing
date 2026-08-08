import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import { useToast } from '../../context/ToastContext'
import { useShell } from '../../context/ShellContext'
import { ROLES } from '../../data/defaults'
import { accessibleNavGroups } from '../../navigation'
import type { Campaign } from '../../data/types'
import { Modal, HighlightText } from '../shared'
import { AppIcon } from '../shared/AppIcon'
import { capitalizeName } from '../../data/helpers'
import { fuzzyMatch } from '../../utils/fuzzySearch'

// ─── Helpers ────────────────────────────────────────────────────────────────

function NavIcon({ tiClass }: { tiClass: string }) {
  return <AppIcon name={tiClass} size={18} className="shrink-0 inline-block align-middle" />
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex" title={label}>
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-2.5 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#1A2038] px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1A2038]" />
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Sidebar() {
  const { currentRole, user, userRole, employeeDetails, logout, permissions, hasPermission } = useAuth()
  const { notifs, setNotifs, leads, c4State } = useStore()
  const campaigns = (c4State?.campaigns as Campaign[] | undefined) ?? []
  const { showToast } = useToast()
  const { mobileOpen, setMobileOpen, sidebarCollapsed, setSidebarCollapsed } = useShell()
  const navigate = useNavigate()
  const location = useLocation()

  const navGroups = useMemo(() => {
    return accessibleNavGroups(currentRole, permissions, hasPermission)
  }, [currentRole, hasPermission, permissions])

  // Find which group contains the active route
  const activeGroup = navGroups.find((g) =>
    g.items.some((item) => location.pathname === `/${item.s}`)
  )?.g ?? navGroups[0]?.g

  const [openGroup, setOpenGroup] = useState<string>(activeGroup)
  const [search, setSearch] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Keep the active group open when route changes
  useEffect(() => {
    const current = navGroups.find((g) =>
      g.items.some((item) => location.pathname === `/${item.s}`)
    )?.g
    const timer = window.setTimeout(() => {
      if (current) setOpenGroup(current)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [location.pathname, navGroups])

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input on Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        e.stopPropagation()

        if (sidebarCollapsed) setSidebarCollapsed(false)
        if (!mobileOpen && window.innerWidth < 768) setMobileOpen(true)

        requestAnimationFrame(() => {
          setTimeout(() => {
            if (searchRef.current) {
              searchRef.current.focus()
              searchRef.current.select()
            }
          }, 30)
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [sidebarCollapsed, mobileOpen, setSidebarCollapsed, setMobileOpen])

  const role = ROLES[currentRole] || ROLES['coord']
  const roleTitle =
    employeeDetails?.role_name ||
    employeeDetails?.designation ||
    userRole?.name ||
    employeeDetails?.position ||
    role.r
  const rawDisplayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      user.username?.trim() ||
      user.email?.split('@')[0] ||
      role.n
    : role.n

  const displayName = capitalizeName(rawDisplayName, 'User')

  const userInitials = user
    ? user.first_name && user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : user.username?.slice(0, 2).toUpperCase() || 'AU'
    : 'TD'

  const unreadCount = notifs.filter((n) => !n.read).length

  const handleNav = (screen: string) => {
    navigate({ to: `/${screen}` })
    setMobileOpen(false)
    setSearch('')
  }

  const handleGroupClick = (groupName: string) => {
    if (openGroup === groupName) {
      setOpenGroup('')
    } else {
      setOpenGroup(groupName)
      // Navigate to first item of newly opened group
      const group = navGroups.find((g) => g.g === groupName)
      if (group?.items[0]) handleNav(group.items[0].s)
    }
  }

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleConfirmLogout = () => {
    setShowLogoutModal(false)
    logout()
    showToast('Signed out successfully', 'info')
    navigate({ to: '/' })
  }

  const toggleNotifs = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowNotifs((prev) => !prev)
  }

  const handleMarkAllRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, read: true })))
    showToast('All notifications marked as read', 'success')
    setShowNotifs(false)
  }

  // ── Search logic ────────────────────────────────────────────────────────
  const q = search.trim()

  const groupedPageResults: Record<string, Array<{ ic: string; l: string; s: string }>> = {}
  if (q) {
    navGroups.forEach((g) => {
      const matches = g.items.filter((item) => fuzzyMatch(item.l, q).isMatch)
      if (matches.length > 0) {
        groupedPageResults[g.g] = matches
      }
    })
  }

  const hasPageResults = Object.keys(groupedPageResults).length > 0
  const canOpenLeadDetails = hasPermission('leads-detail', 'view')
  const canOpenCampaigns = hasPermission('campaigns', 'view')

  const matchedLeads = q && canOpenLeadDetails
    ? leads
        .filter(
          (l) =>
            fuzzyMatch(l.name, q).isMatch ||
            fuzzyMatch(l.phone, q).isMatch ||
            fuzzyMatch(l.id, q).isMatch
        )
        .slice(0, 4)
    : []

  const matchedCampaigns = q && canOpenCampaigns
    ? campaigns
        .filter((c: Campaign) => fuzzyMatch(c.name, q).isMatch || fuzzyMatch(c.channels, q).isMatch)
        .slice(0, 3)
    : [] as Campaign[]

  const hasSearchResults = hasPageResults || matchedLeads.length > 0 || matchedCampaigns.length > 0

  // ── Shared sidebar content (expanded) ───────────────────────────────────
  const expandedContent = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Brand header */}
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white shadow-sm"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          B
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13px] font-bold leading-tight text-[#1A2038]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Bomach OS
          </div>
        </div>

        {/* Notifications bell icon */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={toggleNotifs}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl text-[#7B82A0] hover:bg-[#EEF0F8] hover:text-[#1A2038] transition-all"
            title="Notifications"
          >
            <AppIcon name="notification" size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red border-2 border-[#F7F8FA]" />
            )}
          </button>

          {showNotifs && (
            <div className="fixed left-4 top-14 z-[9999] w-72 max-h-80 overflow-y-auto rounded-xl border border-[#E3E6EF] bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between border-b border-[#E3E6EF] px-3 py-2.5">
                <span className="text-[11px] font-bold text-[#1A2038]">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-medium text-navy hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifs.length === 0 ? (
                <div className="px-3 py-5 text-center text-xs text-[#7B82A0]">No notifications</div>
              ) : (
                notifs.slice(0, 6).map((n, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 border-b border-[#E3E6EF] px-3 py-2.5 text-xs ${n.read ? '' : 'bg-blue-50/60'}`}
                  >
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px]"
                      style={{ backgroundColor: n.bg, color: n.col }}
                    >
                      <AppIcon name="notification" size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] leading-snug text-[#1A2038]">{n.txt}</p>
                      <span className="text-[10px] text-[#7B82A0]">{n.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Collapse button (desktop only) */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(true)}
          title="Collapse sidebar"
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-xl text-[#7B82A0] hover:bg-[#EEF0F8] hover:text-[#1A2038] transition-all"
        >
          <AppIcon name="arrow-left" size={16} />
        </button>
        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex md:hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#7B82A0] hover:bg-[#EEF0F8] hover:text-[#1A2038] transition-all"
          title="Close"
        >
          <AppIcon name="x" size={16} />
        </button>
      </div>


      {/* Search */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="relative">
          <AppIcon name="search-normal" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7B82A0]" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages, leads..."
            className="w-full rounded-xl border border-[#E3E6EF] bg-white py-2 pl-8 pr-3 text-xs text-[#1A2038] placeholder:text-[#7B82A0] outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-all"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B82A0] hover:text-[#1A2038]"
            >
              <AppIcon name="close-square" size={14} />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[#E3E6EF] bg-[#F7F8FA] px-1.5 py-0.5 text-[9.5px] font-mono font-medium text-[#7B82A0] pointer-events-none">
              Ctrl K
            </kbd>
          )}
        </div>
      </div>

      {/* Search results OR Nav */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {q && (
          <div className="space-y-3 pb-2">
            {!hasSearchResults && (
              <p className="px-2 py-4 text-center text-xs text-[#7B82A0]">No results for "{search}"</p>
            )}

            {/* Pages grouped by section */}
            {Object.entries(groupedPageResults).map(([groupName, items]) => (
              <div key={groupName} className="space-y-0.5">
                <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7B82A0]">
                  {groupName}
                </div>
                {items.map((item) => (
                  <button
                    key={item.s}
                    onClick={() => handleNav(item.s)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs text-[#1A2038] hover:bg-[#EEF0F8] transition-all"
                  >
                    <NavIcon tiClass={item.ic} />
                    <HighlightText text={item.l} query={q} className="flex-1 truncate font-medium" />
                  </button>
                ))}
              </div>
            ))}

            {/* Leads Section */}
            {matchedLeads.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7B82A0]">
                  Leads
                </div>
                {matchedLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => {
                      navigate({ to: '/leads-detail', search: { id: lead.id } })
                      setSearch('')
                      setMobileOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs hover:bg-[#EEF0F8] transition-all"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">
                      {lead.name.slice(0, 1)}
                    </span>
                    <HighlightText text={lead.name} query={q} className="flex-1 truncate font-semibold text-[#1A2038]" />
                    <HighlightText text={lead.phone} query={q} className="text-[10px] text-[#7B82A0]" />
                  </button>
                ))}
              </div>
            )}

            {/* Campaigns Section */}
            {matchedCampaigns.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7B82A0]">
                  Campaigns
                </div>
                {matchedCampaigns.map((camp) => (
                  <button
                    key={camp.id}
                    onClick={() => {
                      navigate({ to: '/campaigns' })
                      setSearch('')
                      setMobileOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs hover:bg-[#EEF0F8] transition-all"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red/10 text-[10px] font-bold text-red">
                      {camp.name.slice(0, 1)}
                    </span>
                    <HighlightText text={camp.name} query={q} className="flex-1 truncate font-semibold text-[#1A2038]" />
                    <HighlightText text={camp.channels} query={q} className="text-[10px] text-[#7B82A0]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!q && navGroups.map((group) => {
          const isOpen = openGroup === group.g
          const hasActive = group.items.some((item) => location.pathname === `/${item.s}`)

          return (
            <div key={group.g} className="mb-0.5">
              {/* Group header */}
              <button
                type="button"
                onClick={() => handleGroupClick(group.g)}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all ${
                  hasActive && !isOpen
                    ? 'text-navy font-semibold'
                    : 'text-[#7B82A0] hover:text-[#1A2038]'
                }`}
              >
                <span className="flex-1 truncate text-[10.5px] font-semibold uppercase tracking-wider">
                  {group.g}
                </span>
                <AppIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={13} className="transition-transform duration-200" />
              </button>

              {/* Group items */}
              {isOpen && (
                <div className="mb-1 space-y-0.5 pl-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === `/${item.s}`
                    return (
                      <button
                        key={item.s}
                        onClick={() => handleNav(item.s)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12.5px] font-medium transition-all ${
                          isActive
                            ? 'bg-navy text-white shadow-sm'
                            : 'text-[#535870] hover:bg-[#EEF0F8] hover:text-[#1A2038]'
                        }`}
                      >
                        <NavIcon tiClass={item.ic} />
                        <span className="flex-1 truncate">{item.l}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Account footer */}
      <div className="shrink-0 border-t border-[#E3E6EF] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-navy text-[11px] font-bold text-white">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-[#1A2038]">{displayName}</div>
            <div className="truncate text-[10px] text-[#7B82A0]">{roleTitle}</div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#7B82A0] hover:bg-red/10 hover:text-red transition-all"
          >
            <AppIcon name="logout" size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  // ── Collapsed icon rail (desktop only) ───────────────────────────────────
  const collapsedRail = (
    <div className="flex h-full flex-col items-center overflow-hidden py-2">
      {/* Brand icon */}
      <div className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white shadow-sm" style={{ fontFamily: 'var(--font-heading)' }}>
        B
      </div>

      {/* Expand button */}
      <Tooltip label="Expand sidebar">
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl text-[#7B82A0] hover:bg-[#EEF0F8] hover:text-[#1A2038] transition-all"
        >
          <AppIcon name="arrow-right" size={16} />
        </button>
      </Tooltip>

      {/* Notifications */}
      <Tooltip label="Notifications">
        <button
          type="button"
          onClick={(e) => {
            setSidebarCollapsed(false)
            toggleNotifs(e)
          }}
          className="relative mb-1 flex h-8 w-8 items-center justify-center rounded-xl text-[#7B82A0] hover:bg-[#EEF0F8] hover:text-[#1A2038] transition-all"
        >
          <AppIcon name="notification" size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red border-2 border-[#F7F8FA]" />
          )}
        </button>
      </Tooltip>

      {/* One icon per group */}
      <div className="mt-2 flex-1 overflow-y-auto space-y-0.5 w-full flex flex-col items-center">
        {navGroups.map((group) => {
          const firstItem = group.items[0]
          if (!firstItem) return null
          const isGroupActive = group.items.some((item) => location.pathname === `/${item.s}`)
          return (
            <Tooltip key={group.g} label={group.g}>
              <button
                type="button"
                title={group.g}
                onClick={() => {
                  setSidebarCollapsed(false)
                  setOpenGroup(group.g)
                  handleNav(firstItem.s)
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isGroupActive
                    ? 'bg-navy text-white shadow-sm'
                    : 'text-[#7B82A0] hover:bg-[#EEF0F8] hover:text-[#1A2038]'
                }`}
              >
                <NavIcon tiClass={firstItem.ic} />
              </button>
            </Tooltip>
          )
        })}
      </div>

      {/* User avatar */}
      <button
        type="button"
        onClick={() => setShowLogoutModal(true)}
        title="Sign out"
        className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-navy text-[11px] font-bold text-white hover:bg-red transition-all"
      >
        {userInitials}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-[#E3E6EF] bg-[#F7F8FA] transition-[width] duration-200 ease-in-out shrink-0 h-dvh ${
          sidebarCollapsed ? 'w-[56px] overflow-visible z-30' : 'w-60 overflow-hidden'
        }`}
      >
        {sidebarCollapsed ? collapsedRail : expandedContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#E3E6EF] bg-[#F7F8FA] shadow-xl transition-transform duration-250 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {expandedContent}
      </aside>

      {/* Custom Logout Confirmation Dialog */}
      <Modal open={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Sign Out">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
            <AppIcon name="shield-security" size={20} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-amber-950">Are you sure you want to sign out?</p>
              <p className="mt-0.5 text-amber-800">You will be logged out of your current Bomach OS session. Any unsaved work will be lost.</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-text-3 hover:text-text transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="flex items-center gap-1.5 rounded-xl bg-red px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#A80000] active:scale-95 transition-all"
            >
              <AppIcon name="logout" size={15} /> Yes, sign out
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
