import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import { useToast } from '../../context/ToastContext'
import { useShell } from '../../context/ShellContext'
import { ROLES } from '../../data/defaults'
import { accessibleNavGroups, NAVIGATION_GROUP_PRESENTATION } from '../../navigation'
import type { Campaign } from '../../data/types'
import { Modal, HighlightText } from '../shared'
import { AppIcon } from '../shared/AppIcon'
import NotificationCenter from '../shared/NotificationCenter'
import { capitalizeName } from '../../data/helpers'
import { fuzzyMatch } from '../../utils/fuzzySearch'
import AppSwitcher from '../shared/AppSwitcher'
import { normalizeMarketingPathname } from '../../navigation'

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
  const { leads, c4State } = useStore()
  const campaigns = (c4State?.campaigns as Campaign[] | undefined) ?? []
  const { showToast } = useToast()
  const { mobileOpen, setMobileOpen, sidebarCollapsed, setSidebarCollapsed } = useShell()
  const navigate = useNavigate()
  const location = useLocation()
  const activePath = normalizeMarketingPathname(location.pathname)

  const navGroups = useMemo(() => {
    return accessibleNavGroups(currentRole, permissions, hasPermission)
  }, [currentRole, hasPermission, permissions])

  // Find which group contains the active route
  const activeGroup = navGroups.find((g) =>
    g.items.some((item) => activePath === `/${item.s}`)
  )?.g ?? navGroups[0]?.g

  const [navigationState, setNavigationState] = useState(() => ({
    activePath,
    activeGroup,
    openGroups: activeGroup ? [activeGroup] : [],
  }))
  if (
    navigationState.activePath !== activePath ||
    navigationState.activeGroup !== activeGroup
  ) {
    setNavigationState((current) => ({
      activePath,
      activeGroup,
      openGroups:
        activeGroup && !current.openGroups.includes(activeGroup)
          ? [...current.openGroups, activeGroup]
          : current.openGroups,
    }))
  }
  const openGroups = navigationState.openGroups
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

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

  const handleNav = (screen: string) => {
    navigate({ to: `/${screen}` })
    setMobileOpen(false)
    setSearch('')
  }

  const handleGroupClick = (groupName: string) => {
    setNavigationState((current) => ({
      ...current,
      openGroups: current.openGroups.includes(groupName)
        ? current.openGroups.filter((name) => name !== groupName)
        : [...current.openGroups, groupName],
    }))
  }

  const navigationSections = useMemo(() => {
    const sections = new Map<string, typeof navGroups>()
    navGroups.forEach((group) => {
      const section = NAVIGATION_GROUP_PRESENTATION[group.g]?.section ?? 'More'
      const groups = sections.get(section) ?? []
      groups.push(group)
      sections.set(section, groups)
    })
    return [...sections.entries()]
  }, [navGroups])

  const groupIcon = (groupName: string) =>
    NAVIGATION_GROUP_PRESENTATION[groupName]?.icon ?? 'ti-layout-dashboard'

  const groupId = (groupName: string) =>
    `marketing-nav-${groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleConfirmLogout = () => {
    setShowLogoutModal(false)
    logout()
    showToast('Signed out successfully', 'info')
    navigate({ to: '/' })
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
      <div className="flex h-20 shrink-0 items-center gap-2.5 border-b border-[#E3E6EF] px-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-base font-bold text-white shadow-sm"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          B
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-sm font-bold leading-tight text-[#1A2038]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Marketing
          </div>
          <div className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7B82A0]">
            Bomach OS
          </div>
        </div>

        {/* Notifications bell icon */}
        <AppSwitcher compact placement="left" />
        <NotificationCenter compact />

        {/* Collapse button (desktop only) */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(true)}
          title="Collapse sidebar"
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-[#64718A] transition-colors hover:bg-[#EEF0F8] hover:text-[#1A2038] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
        >
          <AppIcon name="arrow-left" size={16} />
        </button>
        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex md:hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#64718A] transition-colors hover:bg-[#EEF0F8] hover:text-[#1A2038] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
          title="Close"
        >
          <AppIcon name="x" size={16} />
        </button>
      </div>


      {/* Search */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="relative">
          <AppIcon name="search-normal" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64718A]" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages"
            aria-label="Search pages, leads and campaigns"
            className="w-full rounded-xl border border-[#DCE2EC] bg-white py-2.5 pl-10 pr-16 text-[13px] text-[#1A2038] placeholder:text-[#7B82A0] outline-none transition-shadow focus:border-navy/50 focus:ring-2 focus:ring-navy/10"
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
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-[#E3E6EF] bg-[#F7F8FA] px-1.5 py-1 text-[9px] font-mono font-medium text-[#7B82A0]">
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

        {!q && navigationSections.map(([section, groups], sectionIndex) => (
          <section
            key={section}
            aria-label={`${section} navigation`}
            className={`${sectionIndex > 0 ? 'mt-3 border-t border-[#E3E6EF] pt-3' : ''} mb-3`}
          >
            <h2 className="flex items-center gap-2 px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8790A5]">
              <span>{section}</span>
              <span className="h-px flex-1 bg-[#E3E6EF]" aria-hidden="true" />
            </h2>
            <div className="space-y-1">
              {groups.map((group) => {
                const isOpen = openGroups.includes(group.g)
                const hasActive = group.items.some((item) => activePath === `/${item.s}`)
                const itemsId = groupId(group.g)

                return (
                  <div key={group.g}>
                    <button
                      type="button"
                      onClick={() => handleGroupClick(group.g)}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/25 ${
                        hasActive
                          ? 'border-[#D8E3FF] bg-[#EEF4FF] text-navy'
                          : 'border-transparent text-[#536079] hover:border-[#E3E8F0] hover:bg-white hover:text-[#1A2038]'
                      }`}
                      aria-label={`${group.g} navigation group`}
                      aria-expanded={isOpen}
                      aria-controls={isOpen ? itemsId : undefined}
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          hasActive ? 'bg-white text-navy shadow-sm' : 'bg-[#EEF1F6] text-[#64718A]'
                        }`}
                      >
                        <NavIcon tiClass={groupIcon(group.g)} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{group.g}</span>
                      <AppIcon
                        name={isOpen ? 'chevron-down' : 'chevron-right'}
                        size={15}
                        className="shrink-0 text-[#8490A5] transition-transform duration-200"
                      />
                    </button>

                    {isOpen ? (
                      <div
                        id={itemsId}
                        className="mb-1 ml-5 mt-1 space-y-1 border-l border-[#DCE2EC] pl-2"
                      >
                        {group.items.map((item) => {
                          const isActive = activePath === `/${item.s}`
                          return (
                            <div key={item.s} className="relative">
                              <span
                                className="absolute left-[-9px] top-1/2 h-px w-2 bg-[#DCE2EC]"
                                aria-hidden="true"
                              />
                              <button
                                type="button"
                                onClick={() => handleNav(item.s)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`relative flex min-h-10 w-full items-center gap-2.5 rounded-xl border px-2.5 text-left text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/25 ${
                                  isActive
                                    ? 'border-[#D8E3FF] bg-white text-navy shadow-sm'
                                    : 'border-transparent text-[#536079] hover:bg-white hover:text-[#1A2038]'
                                }`}
                              >
                                {isActive ? (
                                  <span
                                    className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-navy"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                <NavIcon tiClass={item.ic} />
                                <span className="min-w-0 flex-1 truncate">{item.l}</span>
                                {item.b ? (
                                  <span
                                    className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold ${
                                      item.bt === 'red'
                                        ? 'bg-red/10 text-red'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {item.b}
                                  </span>
                                ) : null}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
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
    <div className="flex h-full flex-col items-center overflow-hidden py-3">
      {/* Brand icon */}
      <div className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-base font-bold text-white shadow-sm" style={{ fontFamily: 'var(--font-heading)' }}>
        B
      </div>

      <Tooltip label="Switch workspace">
        <AppSwitcher compact placement="left" />
      </Tooltip>

      {/* Expand button */}
      <Tooltip label="Expand sidebar">
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-[#64718A] transition-colors hover:bg-[#EEF0F8] hover:text-[#1A2038] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
        >
          <AppIcon name="arrow-right" size={16} />
        </button>
      </Tooltip>

      {/* Notifications */}
      <Tooltip label="Notifications">
        <div className="mb-1">
          <NotificationCenter compact />
        </div>
      </Tooltip>

      {/* One icon per group */}
      <div className="mt-2 flex w-full flex-1 flex-col items-center space-y-1 overflow-y-auto">
        {navGroups.map((group) => {
          const isGroupActive = group.items.some((item) => activePath === `/${item.s}`)
          return (
            <Tooltip key={group.g} label={group.g}>
              <button
                type="button"
                title={group.g}
                aria-label={`${group.g} navigation group`}
                aria-expanded={openGroups.includes(group.g)}
                onClick={() => {
                  setSidebarCollapsed(false)
                  setNavigationState((current) => ({
                    ...current,
                    openGroups: current.openGroups.includes(group.g)
                      ? current.openGroups
                      : [...current.openGroups, group.g],
                  }))
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 ${
                  isGroupActive
                    ? 'border-[#D8E3FF] bg-[#EEF4FF] text-navy shadow-sm'
                    : 'border-transparent text-[#64718A] hover:border-[#E3E8F0] hover:bg-white hover:text-[#1A2038]'
                }`}
              >
                <NavIcon tiClass={groupIcon(group.g)} />
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
        aria-label="Primary navigation"
        className={`hidden md:flex flex-col border-r border-[#E3E6EF] bg-[#F7F8FA] transition-[width] duration-200 ease-in-out shrink-0 h-dvh ${
          sidebarCollapsed
            ? 'w-[72px] overflow-visible z-30'
            : 'w-64 overflow-hidden lg:w-72 xl:w-[300px]'
        }`}
      >
        {sidebarCollapsed ? collapsedRail : expandedContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        aria-label="Primary navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(300px,calc(100vw-2rem))] flex-col border-r border-[#E3E6EF] bg-[#F7F8FA] shadow-xl transition-transform duration-250 ease-in-out md:hidden ${
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
