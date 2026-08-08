import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { EmptyState, ErrorState, SkeletonKanban, SkeletonKpiGrid, Topbar } from '../../shared'
import { marketingService } from '../../../services/api/marketingService'
import { parseApiError } from '../../../services/api/apiClient'
import { transformLeadPipeline } from '../../../services/transformers/marketingTransformers'

type PipelineState = ReturnType<typeof transformLeadPipeline>

const stageCols: Record<string, string> = {
  new: 'p-new',
  contacted: 'p-contact',
  qualified: 'p-qual',
  proposal: 'p-prop',
  negotiation: 'p-neg',
  won: 'p-won',
  lost: 'p-lost',
}

const divCols: Record<string, string> = {
  re: 'd-re',
  eng: 'd-eng',
  sur: 'd-sur',
  ben: 'd-ben',
  ict: 'd-ict',
  agr: 'd-agr',
}

function periodRange(period: string) {
  const end = new Date()
  const start = new Date(end)
  if (period === 'today') start.setDate(end.getDate())
  else if (period === 'month') start.setDate(end.getDate() - 29)
  else if (period === 'quarter') start.setDate(end.getDate() - 89)
  else start.setDate(end.getDate() - 6)

  return {
    date_from: start.toISOString().slice(0, 10),
    date_to: end.toISOString().slice(0, 10),
  }
}

function totalLeadsInPipeline(value: PipelineState) {
  return value.stages.reduce((sum, stage) => sum + stage.leads.length, 0)
}

function money(value: number) {
  return `NGN ${value.toLocaleString()}`
}

function uiDivision(value: string) {
  const key = value.trim().toLowerCase()
  const map: Record<string, string> = {
    real_estate: 're',
    realestate: 're',
    'real estate': 're',
    re: 're',
    engineering: 'eng',
    eng: 'eng',
    benji: 'ben',
    ben: 'ben',
    surveying: 'sur',
    survey: 'sur',
    sur: 'sur',
    ict: 'ict',
  }
  return map[key] || key
}

function filterPipelineByDivision(value: PipelineState, division: string): PipelineState {
  const nextDivision = uiDivision(division)
  if (nextDivision === 'all') return value

  const stages = value.stages.map((stage) => ({
    ...stage,
    leads: stage.leads.filter((lead) => uiDivision(lead.division) === nextDivision),
  }))
  const leads = value.leads.filter((lead) => uiDivision(lead.division) === nextDivision)
  const pipelineValue = leads.reduce((sum, lead) => sum + lead.value, 0)
  const wonCount = leads.filter((lead) => lead.stage === 'won').length
  const conversionRate = leads.length ? `${parseFloat(((wonCount / leads.length) * 100).toFixed(1))}%` : '0%'

  return {
    ...value,
    stages,
    leads,
    metrics: {
      totalLeads: leads.length,
      overdueCount: leads.filter((lead) => lead.overdue).length,
      pipelineValue,
      pipelineValueLabel: money(pipelineValue),
      conversionRate,
    },
  }
}

export function PipelinePage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('week')
  const [division, setDivision] = useState('all')
  const [pipeline, setPipeline] = useState<PipelineState>(() => transformLeadPipeline({}))
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const loadPipeline = useCallback(async () => {
    setIsLoading(true)
    setApiError('')
    try {
      const res = await marketingService.getLeadPipeline({
        ...periodRange(period),
        division,
      })
      if (res.data) {
        const nextPipeline = filterPipelineByDivision(transformLeadPipeline(res.data), division)
        if (totalLeadsInPipeline(nextPipeline) === 0) {
          const leadRes = await marketingService.getLeads({
            limit: 100,
          })
          setPipeline(leadRes.data ? filterPipelineByDivision(transformLeadPipeline(leadRes.data), division) : nextPipeline)
        } else {
          setPipeline(nextPipeline)
        }
      } else if (res.error) {
        setPipeline(transformLeadPipeline({}))
        setApiError(parseApiError(res.error))
      }
    } catch (err) {
      setPipeline(transformLeadPipeline({}))
      setApiError(parseApiError(err instanceof Error ? err.message : err))
    } finally {
      setIsLoading(false)
    }
  }, [division, period])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPipeline()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadPipeline])

  const totalStageLeads = totalLeadsInPipeline(pipeline)

  return (
    <div className="flex min-h-0 flex-col overflow-x-hidden">
      <Topbar title="CRM pipeline" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
        <div className="space-y-4">
          <div className="flex max-w-full flex-wrap items-center gap-1 border-b border-border/80 pb-2">
            {[
              { id: 'all', label: 'All divisions' },
              { id: 're', label: 'Real Estate' },
              { id: 'eng', label: 'Engineering' },
              { id: 'ben', label: 'Benji' },
              { id: 'sur', label: 'Surveying' },
              { id: 'ict', label: 'ICT' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDivision(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  division === tab.id
                    ? 'bg-navy text-white shadow-xs'
                    : 'text-text-3 hover:bg-surface-1 hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {apiError ? <ErrorState message={apiError} onRetry={loadPipeline} compact /> : null}

          {isLoading ? (
            <SkeletonKpiGrid />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total leads" value={pipeline.metrics.totalLeads} />
              <MetricCard label="Overdue" value={pipeline.metrics.overdueCount} tone="text-rose-600" />
              <MetricCard label="Pipeline value" value={pipeline.metrics.pipelineValueLabel} />
              <MetricCard label="Conversion rate" value={pipeline.metrics.conversionRate} />
            </div>
          )}

          {isLoading ? (
            <SkeletonKanban stages={pipeline.stages.length || 7} />
          ) : totalStageLeads === 0 ? (
            <EmptyState
              title="No leads in this pipeline"
              description="No leads were returned for the selected period and division."
              icon="ti-chart-arrows-vertical"
            />
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
              {pipeline.stages.map((stage) => (
              <div key={stage.id} className="min-w-0 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-1 p-2 text-xs font-bold text-text">
                  <span className="min-w-0 truncate">{stage.label}</span>
                  <span className={`pill ${stageCols[stage.id] || 'p-qual'}`}>{stage.leads.length}</span>
                </div>

                <div className="space-y-2">
                  {stage.leads.map((lead) => (
                    <button
                      key={String(lead.id)}
                      type="button"
                      onClick={() => navigate({ to: '/leads-detail', search: { id: String(lead.id) } })}
                      className={`block w-full min-w-0 rounded-xl border bg-surface p-3 text-left shadow-xs transition-all hover:border-navy/40 ${
                        lead.overdue ? 'border-red-300 bg-red-50/30' : 'border-border'
                      }`}
                    >
                      <div className="truncate text-xs font-bold text-text">{lead.name}</div>
                      <div className="mt-1 truncate text-[10.5px] font-medium text-text-3">
                        {lead.source}{lead.overdue ? ' - Overdue' : ''}
                      </div>
                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className={`pill ${divCols[lead.division] || 'd-re'}`}>{lead.divisionLabel}</span>
                        <span className="truncate text-[10.5px] font-semibold text-text-3">{lead.valueLabel}</span>
                      </div>
                      <div className="mt-2 truncate text-[10.5px] font-medium text-text-3">{lead.nextAction}</div>
                    </button>
                  ))}
                  {stage.leads.length === 0 && (
                    <EmptyState title="No leads" description="This stage has no leads." compact />
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, tone = 'text-text' }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <div className="mb-1 text-xs font-medium text-text-3">{label}</div>
      <div className={`text-2xl font-extrabold tracking-tight ${tone}`}>{value}</div>
    </div>
  )
}
