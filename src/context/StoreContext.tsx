/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getIconName } from '../data/types'
import type { Lead, SupportTicket, DesignTask, WaConversation, Target, Notification } from '../data/types'
import { useAuth } from './AuthContext'
import { marketingService } from '../services/api/marketingService'
import { transformBackendLead, transformBackendCampaign } from '../services/transformers/marketingTransformers'

const STORAGE_KEY = 'bomachOS_v3_react'

interface IntegrationEvent {
  time: string
  action: string
  actor: string
}

interface OpsState {
  dailyChecks: Record<string, Record<string, Record<string, boolean>>>
  dailyReports: Record<string, Record<string, { text: string; time: string }>>
  integrationEvents: IntegrationEvent[]
  [key: string]: unknown
}

type GenericState = Record<string, unknown>

interface StoreState {
  leads: Lead[]
  tickets: SupportTicket[]
  designTasks: DesignTask[]
  broadcasts: unknown[]
  waConvs: WaConversation[]
  targets: Target[]
  notifs: Notification[]
  leadCounter: number
  opsState: OpsState
  c4State: GenericState
  revState: GenericState
  activeWaConv: WaConversation | null
  activeJournalLead: Lead | null
  activeRole: string
  leadControlFilter: string
  forecastScenario: string
  c4ActiveCampaign: string | null
  c4WizStep: number
  c4WizData: Record<string, unknown>
  c4EditId: string | null
  c4ActiveWorkTab: string
  c4MeetingEditId: string | null
  c4ActionHandler: ((action: string, payload?: unknown) => void) | null
}

interface StoreContextValue extends StoreState {
  setLeads: (v: Lead[]) => void
  setTickets: (v: SupportTicket[]) => void
  setDesignTasks: (v: DesignTask[]) => void
  setBroadcasts: (v: unknown[]) => void
  setWaConvs: (v: WaConversation[]) => void
  setTargets: (v: Target[]) => void
  setNotifs: (v: Notification[]) => void
  setLeadCounter: (v: number) => void
  setOpsState: (v: OpsState) => void
  setC4State: (v: GenericState) => void
  setRevState: (v: GenericState) => void
  setActiveWaConv: (v: WaConversation | null) => void
  setActiveJournalLead: (v: Lead | null) => void
  setActiveRole: (v: string) => void
  setLeadControlFilter: (v: string) => void
  setForecastScenario: (v: string) => void
  setC4ActiveCampaign: (v: string | null) => void
  setC4WizStep: (v: number) => void
  setC4WizData: (v: Record<string, unknown>) => void
  setC4EditId: (v: string | null) => void
  setC4ActiveWorkTab: (v: string) => void
  setC4MeetingEditId: (v: string | null) => void
  setC4ActionHandler: (v: ((action: string, payload?: unknown) => void) | null) => void
  getIconName: (tiClass: string) => string
}

function seedState(): StoreState {
  return {
    leads: [],
    tickets: [],
    designTasks: [],
    broadcasts: [],
    waConvs: [],
    targets: [],
    notifs: [],
    leadCounter: 0,
    opsState: {
      dailyChecks: {},
      dailyReports: {},
      integrationEvents: [],
    },
    c4State: { campaigns: [] },
    revState: {},
    activeWaConv: null,
    activeJournalLead: null,
    activeRole: 'coord',
    leadControlFilter: 'all',
    forecastScenario: 'base',
    c4ActiveCampaign: null,
    c4WizStep: 0,
    c4WizData: {},
    c4EditId: null,
    c4ActiveWorkTab: 'brief',
    c4MeetingEditId: null,
    c4ActionHandler: null,
  }
}

const DUMMY_LEAD_IDS = new Set(['L-2248', 'L-2249', 'L-2250', 'L-2251', 'L-2252'])
const DUMMY_LEAD_NAMES = new Set(['Adaeze Chukwu', 'Emmanuel Okonkwo', 'Ngozi Kamalu', 'Festus Ikenna', 'Bello Kabiru'])

function isDummyLead(l: Lead): boolean {
  if (!l) return false
  if (DUMMY_LEAD_IDS.has(l.id)) return true
  if (DUMMY_LEAD_NAMES.has(l.name)) return true
  return false
}

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoreState>
      const cleanLeads = (parsed.leads || []).filter((l) => !isDummyLead(l))
      const seed = seedState()
      return {
        ...seed,
        ...parsed,
        leads: cleanLeads,
        tickets: [],
        designTasks: [],
        broadcasts: [],
        waConvs: [],
        targets: [],
        notifs: [],
        opsState: {
          ...seed.opsState,
          dailyChecks: parsed.opsState?.dailyChecks || {},
          dailyReports: parsed.opsState?.dailyReports || {},
          integrationEvents: [],
        },
        c4State: seed.c4State,
        revState: seed.revState,
      }
    }
  } catch {
    /* ignore fallback */
  }
  return seedState()
}

function persistState(state: StoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota exceeded or unavailable */
  }
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadState)
  const { isLoggedIn, isLoading, hasPermission } = useAuth()

  useEffect(() => {
    persistState(state)
  }, [state])

  // Initial API sync effect for live marketing data
  useEffect(() => {
    if (isLoading || !isLoggedIn) return

    const canSyncLeads =
      hasPermission('leads', 'view') ||
      hasPermission('pipeline', 'view') ||
      hasPermission('lead-journal', 'view') ||
      hasPermission('leads-detail', 'view')
    const canSyncCampaigns =
      hasPermission('marketing_campaigns', 'view') ||
      hasPermission('campaigns', 'view')

    async function syncBackendData() {
      try {
        if (!canSyncLeads || !canSyncCampaigns) {
          setState((prev) => ({
            ...prev,
            leads: canSyncLeads ? prev.leads : [],
            c4State: canSyncCampaigns ? prev.c4State : { ...prev.c4State, campaigns: [] },
          }))
        }

        const [leadsResult, campResult] = await Promise.allSettled([
          canSyncLeads ? marketingService.getLeads() : Promise.resolve(null),
          canSyncCampaigns ? marketingService.getCampaigns() : Promise.resolve(null),
        ])

        if (leadsResult.status === 'fulfilled' && leadsResult.value?.data) {
          const rawItems = leadsResult.value.data.items || leadsResult.value.data
          if (Array.isArray(rawItems)) {
            const apiLeads = rawItems.map(transformBackendLead)
            setState((prev) => ({ ...prev, leads: apiLeads }))
          }
        }

        if (campResult.status === 'fulfilled' && campResult.value?.data) {
          const rawCamps = campResult.value.data.items || campResult.value.data
          if (Array.isArray(rawCamps)) {
            const apiCamps = rawCamps.map(transformBackendCampaign)
            setState((prev) => ({
              ...prev,
              c4State: { ...prev.c4State, campaigns: apiCamps },
            }))
          }
        }
      } catch {
        /* Ignore background sync errors */
      }
    }
    syncBackendData()
  }, [hasPermission, isLoading, isLoggedIn])

  const makeSetter = <K extends keyof StoreState>(key: K) =>
    (v: StoreState[K]) => setState((prev) => ({ ...prev, [key]: v }))

  const setters = {
    setLeads: makeSetter('leads'),
    setTickets: makeSetter('tickets'),
    setDesignTasks: makeSetter('designTasks'),
    setBroadcasts: makeSetter('broadcasts'),
    setWaConvs: makeSetter('waConvs'),
    setTargets: makeSetter('targets'),
    setNotifs: makeSetter('notifs'),
    setLeadCounter: makeSetter('leadCounter'),
    setOpsState: makeSetter('opsState'),
    setC4State: makeSetter('c4State'),
    setRevState: makeSetter('revState'),
    setActiveWaConv: makeSetter('activeWaConv'),
    setActiveJournalLead: makeSetter('activeJournalLead'),
    setActiveRole: makeSetter('activeRole'),
    setLeadControlFilter: makeSetter('leadControlFilter'),
    setForecastScenario: makeSetter('forecastScenario'),
    setC4ActiveCampaign: makeSetter('c4ActiveCampaign'),
    setC4WizStep: makeSetter('c4WizStep'),
    setC4WizData: makeSetter('c4WizData'),
    setC4EditId: makeSetter('c4EditId'),
    setC4ActiveWorkTab: makeSetter('c4ActiveWorkTab'),
    setC4MeetingEditId: makeSetter('c4MeetingEditId'),
    setC4ActionHandler: makeSetter('c4ActionHandler'),
  }

  const value: StoreContextValue = {
    ...state,
    ...setters,
    getIconName,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}
