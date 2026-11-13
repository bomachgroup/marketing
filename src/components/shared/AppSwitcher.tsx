import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { rememberedWorkspaceHref } from '../../shared/auth/workspace-memory'
import {
  consumeWorkspaceSwitchTransition,
  rememberWorkspaceSwitch,
  WORKSPACE_ARRIVAL_MS,
  WORKSPACE_SWITCH_DELAY_MS,
  type WorkspaceSwitchOrigin,
  type WorkspaceSwitchTransition,
} from '../../shared/auth/workspace-switch'
import { getSharedOsOrigin } from '../../shared-host'
import {
  getAvailableApps,
  WORKSPACE_APPS,
  type WorkspaceApp,
  type WorkspaceAppId,
} from '../../app/shell/app-switcher.utils'
import './app-switcher.css'

function Glyph({ app }: { app: WorkspaceAppId }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[19px]"
    >
      {app === 'os' ? (
        <>
          <path d="M4 20V6l8-3 8 3v14" />
          <path d="M8 20v-5h8v5M8 8h.01M12 8h.01M16 8h.01" />
        </>
      ) : null}
      {app === 'services' ? (
        <>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        </>
      ) : null}
      {app === 'marketing' ? (
        <>
          <path d="M4 19V5M4 19h17" />
          <path d="m7 15 4-4 3 2 6-7" />
          <path d="M16 6h4v4" />
        </>
      ) : null}
    </svg>
  )
}

function OpenInNewTabIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-[17px]">
      <path
        d="M11.25 3.75h5v5M16 4l-7 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 11.25v4A.75.75 0 0 1 14.25 16h-9.5A.75.75 0 0 1 4 15.25v-9.5A.75.75 0 0 1 4.75 5h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Transition({
  source,
  destination,
  origin,
  phase,
}: {
  source: WorkspaceApp
  destination: WorkspaceApp
  origin: WorkspaceSwitchOrigin
  phase: 'departing' | 'arriving'
}) {
  const style = {
    '--switch-origin-x': `${origin.x * 100}%`,
    '--switch-origin-y': `${origin.y * 100}%`,
  } as CSSProperties

  return (
    <div
      className="workspace-switch-overlay"
      data-phase={phase}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={
        phase === 'departing'
          ? `Switching to ${destination.label}`
          : `Opening ${destination.label}`
      }
    >
      <div className="workspace-switch-card">
        <span className="workspace-switch-brand" aria-hidden="true">
          B
        </span>
        <div className="workspace-switch-route" aria-hidden="true">
          <span className="workspace-switch-route__step workspace-switch-route__step--source">
            <span className="workspace-switch-route__app">
              <Glyph app={source.id} />
            </span>
            <span className="workspace-switch-route__label">{source.label}</span>
          </span>
          <span className="workspace-switch-route__line" />
          <span className="workspace-switch-route__arrow">→</span>
          <span className="workspace-switch-route__step workspace-switch-route__step--destination">
            <span className="workspace-switch-route__destination">
              <Glyph app={destination.id} />
            </span>
            <span className="workspace-switch-route__label">{destination.label}</span>
          </span>
        </div>
        <p className="workspace-switch-eyebrow">BOMACH WORKSPACE</p>
        <p className="workspace-switch-title">
          {phase === 'departing'
            ? `Leaving ${source.label}`
            : `${destination.label} is ready`}
        </p>
        <p className="workspace-switch-description">
          {phase === 'departing'
            ? `Opening your ${destination.label} workspace`
            : destination.description}
        </p>
        <div className="workspace-switch-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  )
}

function randomSwitchOrigin(anchor: HTMLElement | null): WorkspaceSwitchOrigin {
  if (!anchor) return { x: 0.92, y: 0.08 }

  const bounds = anchor.getBoundingClientRect()
  const x = bounds.left + bounds.width * (0.25 + Math.random() * 0.5)
  const y = bounds.top + bounds.height * (0.25 + Math.random() * 0.5)
  return {
    x: Math.min(1, Math.max(0, x / Math.max(1, window.innerWidth))),
    y: Math.min(1, Math.max(0, y / Math.max(1, window.innerHeight))),
  }
}

export default function AppSwitcher({
  compact = false,
  placement = 'right',
}: {
  compact?: boolean
  placement?: 'left' | 'right'
}) {
  const { user, currentRole, hasPermission } = useAuth()
  const apps = getAvailableApps(user, currentRole, hasPermission)
  const currentApp: WorkspaceAppId = 'marketing'
  const currentWorkspace = WORKSPACE_APPS.find((app) => app.id === currentApp)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [switching, setSwitching] = useState<WorkspaceSwitchTransition | null>(null)
  const [arriving, setArriving] = useState<WorkspaceSwitchTransition | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const transition = consumeWorkspaceSwitchTransition(currentApp)
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (transition && !reducedMotion) setArriving(transition)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [currentApp])

  useEffect(() => {
    if (!arriving) return
    const timer = window.setTimeout(() => setArriving(null), WORKSPACE_ARRIVAL_MS)
    return () => window.clearTimeout(timer)
  }, [arriving])

  useLayoutEffect(() => {
    if (!menuOpen || !detailsRef.current || !menuRef.current) return
    const anchor = detailsRef.current
    const menu = menuRef.current
    const position = () => {
      const rect = anchor.getBoundingClientRect()
      const width = Math.min(296, window.innerWidth - 24)
      const left = placement === 'left' ? rect.left : rect.right - width
      const viewportLeft = Math.min(Math.max(12, left), window.innerWidth - width - 12)
      menu.style.left = `${viewportLeft - rect.left}px`
      menu.style.right = 'auto'
      menu.style.width = `${width}px`
      menu.style.transformOrigin = `${Math.min(
        Math.max(rect.left + rect.width / 2 - viewportLeft, 12),
        width - 12,
      )}px 0px`
    }
    position()
    window.addEventListener('resize', position)
    return () => {
      window.removeEventListener('resize', position)
      menu.style.left = ''
      menu.style.right = ''
      menu.style.width = ''
      menu.style.transformOrigin = ''
    }
  }, [menuOpen, placement])

  function switchApp(
    event: MouseEvent<HTMLAnchorElement>,
    app: WorkspaceApp,
    href: string,
  ) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    const origin = randomSwitchOrigin(detailsRef.current)
    const transition: WorkspaceSwitchTransition = {
      sourceApp: currentApp,
      targetApp: app.id,
      origin,
      startedAt: Date.now(),
    }
    rememberWorkspaceSwitch(app.id, { sourceApp: currentApp, origin })
    detailsRef.current?.removeAttribute('open')
    setSwitching(transition)

    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : WORKSPACE_SWITCH_DELAY_MS
    window.setTimeout(() => window.location.assign(href), delay)
  }

  function getHref(app: WorkspaceApp) {
    const path = rememberedWorkspaceHref(user?.id ?? '', app.id) ?? app.href
    const sharedUrl = new URL(path, getSharedOsOrigin())
    return sharedUrl.origin === window.location.origin
      ? `${sharedUrl.pathname}${sharedUrl.search}${sharedUrl.hash}`
      : sharedUrl.toString()
  }

  function renderTransition(transition: WorkspaceSwitchTransition, phase: 'departing' | 'arriving') {
    const source = WORKSPACE_APPS.find((app) => app.id === transition.sourceApp)
    const destination = WORKSPACE_APPS.find((app) => app.id === transition.targetApp)
    return source && destination
      ? createPortal(
          <Transition
            source={source}
            destination={destination}
            origin={transition.origin}
            phase={phase}
          />,
          document.body,
        )
      : null
  }

  return (
    <>
      <details
        ref={detailsRef}
        className="group/app-switcher relative z-40 shrink-0"
        onToggle={(event) => setMenuOpen(event.currentTarget.open)}
      >
        <summary
          className="workspace-switch-trigger"
          aria-label="Switch workspace"
          title="Switch workspace"
        >
          <span className="workspace-switch-grid" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="workspace-switch-chevron" aria-hidden="true">
            ⌄
          </span>
        </summary>
        <div
          ref={menuRef}
          className={`workspace-switch-menu ${placement === 'left' ? 'align-left' : 'align-right'}`}
          aria-label="Available workspaces"
        >
          <header>
            <strong>Switch workspace</strong>
          </header>
          <div className="workspace-switch-menu__list">
            {apps.map((app) => {
              const active = app.id === currentApp
              const href = getHref(app)
              return (
                <div
                  key={app.id}
                  className={`workspace-switch-option ${active ? 'is-current' : ''}`}
                >
                  {active ? (
                    <span className="workspace-switch-option__main" aria-current="page">
                      <span
                        className={`workspace-switch-option__icon workspace-switch-option__icon--${app.id}`}
                      >
                        <Glyph app={app.id} />
                      </span>
                      <span className="workspace-switch-option__copy">
                        <strong>{app.label}</strong>
                        {compact ? null : <small>{app.description}</small>}
                      </span>
                      <span className="workspace-switch-option__state">Current</span>
                    </span>
                  ) : (
                    <a
                      href={href}
                      className="workspace-switch-option__main"
                      onClick={(event) => switchApp(event, app, href)}
                    >
                      <span
                        className={`workspace-switch-option__icon workspace-switch-option__icon--${app.id}`}
                      >
                        <Glyph app={app.id} />
                      </span>
                      <span className="workspace-switch-option__copy">
                        <strong>{app.label}</strong>
                        {compact ? null : <small>{app.description}</small>}
                      </span>
                      <span className="workspace-switch-option__arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  )}
                  <a
                    href={href}
                    className="workspace-switch-option__open"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${app.label} in a new tab`}
                    title={`Open ${app.label} in a new tab`}
                  >
                    <OpenInNewTabIcon />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </details>
      {switching ? renderTransition(switching, 'departing') : null}
      {!switching && arriving && currentWorkspace
        ? renderTransition({ ...arriving, targetApp: currentApp }, 'arriving')
        : null}
    </>
  )
}
