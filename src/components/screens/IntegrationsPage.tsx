import { useStore } from '../../context/StoreContext'
import { INTEGRATIONS } from '../../data/defaults'

const REQUIRED_FIELDS = [
  { step: 1, label: 'Brand and business division' },
  { step: 2, label: 'Campaign, ad set, ad and form ID' },
  { step: 3, label: 'Meta lead ID / GCLID / click identifiers' },
  { step: 4, label: 'UTM source, medium, campaign, content and term' },
  { step: 5, label: 'Landing page URL, referrer, device and timestamp' },
  { step: 6, label: 'First-touch, last-touch and closing-source attribution' },
  { step: 7, label: 'Consent types, timestamp and privacy-notice version' },
]

import { Topbar, AppIcon } from '../shared'

interface IntegrationEventRow {
  time: string
  action: string
  actor: string
}

export function IntegrationsPage() {
  const { opsState } = useStore()
  const { integrationEvents } = opsState

  return (
    <div className="flex flex-col min-h-0">
      <Topbar title="Channel integrations" />

      <div className="flex-1 p-5 space-y-5 overflow-y-auto">

      {/* Marketing Channel Integrations Card Container */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-text">Marketing Channel Integrations</h3>
            <p className="text-xs text-text-3">Connect advertising, forms, messaging, email, conversions and the Bomach CRM</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-navy/30 bg-navy/5 px-3 py-1.5 text-xs font-bold text-navy hover:bg-navy/10 transition-all"
          >
            <AppIcon name="refresh" size={14} className="text-navy" /> Test Meta lead sync
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTEGRATIONS.map((int, i) => {
            const isConnected = int.status === 'Connected'
            const isConfigReady = int.status === 'Configuration ready' || int.status === 'Mapping ready' || int.status === 'Design ready'
            const isDns = int.status === 'DNS required'

            return (
              <div key={i} className="flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-4 shadow-sm space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold shadow-sm"
                      style={{ backgroundColor: int.bg, color: int.col }}
                    >
                      {int.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text">{int.name}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-0.5">
                        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : isConfigReady ? 'bg-amber-500' : isDns ? 'bg-rose-500' : 'bg-slate-400'}`} />
                        <span className={isConnected ? 'text-emerald-600' : isConfigReady ? 'text-amber-600' : isDns ? 'text-rose-600' : 'text-slate-500'}>
                          {int.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-text-3 font-medium leading-normal">{int.detail}</p>
                </div>

                <button
                  type="button"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-text hover:bg-surface-2 transition-all shadow-xs"
                >
                  Configure
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lead Ingestion and Conversion Feedback Architecture */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="border-b border-border/80 pb-3">
          <h3 className="text-sm font-bold text-text">Lead ingestion and conversion feedback architecture</h3>
          <p className="text-xs text-text-3 mt-0.5">Every lead keeps campaign identifiers and every real conversion is sent back to the advertising platform</p>
        </div>

        <div className="rounded-xl border border-border bg-surface-1 p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 text-center text-xs font-bold">
            <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-xs text-text">
              Meta / Google / TikTok Ads
            </div>
            <div className="text-text-3 font-bold text-lg">→</div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-xs text-text">
              Webhook + Form Normalizer
            </div>
            <div className="text-text-3 font-bold text-lg">→</div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-xs text-text">
              Bomach Lead 360 CRM
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 text-center text-xs font-bold pt-1">
            <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-xs text-text">
              Lead activity + pipeline
            </div>
            <div className="text-text-3 font-bold text-lg">→</div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-xs text-text">
              Payment / Allocation outcome
            </div>
            <div className="text-text-3 font-bold text-lg">→</div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-xs text-text">
              Offline Conversion Feedback
            </div>
          </div>
        </div>
      </div>

      {/* Required Lead-Source Fields and Integration Event Log Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Required Lead-Source Fields Card */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
          <div className="border-b border-border/80 pb-3">
            <h3 className="text-sm font-bold text-text">Required lead-source fields</h3>
          </div>

          <div className="space-y-3">
            {REQUIRED_FIELDS.map((f) => (
              <div key={f.step} className="flex items-center gap-3 rounded-xl border border-border/80 bg-surface-1 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-sm">
                  {f.step}
                </div>
                <span className="text-xs font-bold text-text">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Event Log Card */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
          <div className="border-b border-border/80 pb-3">
            <h3 className="text-sm font-bold text-text">Integration event log</h3>
          </div>

          <div className="space-y-3">
            {integrationEvents.map((e: IntegrationEventRow, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface-1 p-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm text-xs font-bold">
                  🔗
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="text-xs font-bold text-text leading-snug">{e.action}</h4>
                  <p className="text-[11px] font-semibold text-text-3">{e.time} · {e.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
