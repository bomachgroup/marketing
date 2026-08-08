/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { SelectOption } from '../components/shared/Select'

export interface TopbarConfig {
  title: string
  period?: string
  onPeriodChange?: (period: string) => void
  periodOptions?: SelectOption[] | string[]
  hidePeriod?: boolean
  action?: ReactNode
}

interface ShellContextValue {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  topbarConfig: TopbarConfig | null
  setTopbarConfig: (config: TopbarConfig | null) => void
}

const ShellContext = createContext<ShellContextValue | null>(null)

export function ShellProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [topbarConfig, setTopbarConfig] = useState<TopbarConfig | null>(null)

  return (
    <ShellContext.Provider value={{ mobileOpen, setMobileOpen, sidebarCollapsed, setSidebarCollapsed, topbarConfig, setTopbarConfig }}>
      {children}
    </ShellContext.Provider>
  )
}

export function useShell() {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used inside ShellProvider')
  return ctx
}
