import { useCallback, useEffect, useMemo, useState } from 'react'
import { BusyLabel, EmptyState, ErrorState, SkeletonCardGrid, SkeletonKpiGrid, SkeletonList, Topbar } from '../shared'
import { parseApiError } from '../../services/api/apiClient'
import { marketingService } from '../../services/api/marketingService'
import { useToast } from '../../context/ToastContext'
import { AppIcon } from '../../components/shared/AppIcon'
import NoPermissionPage from '../layout/NoPermissionPage'

type Scenario = 'conservative' | 'base' | 'stretch'
type UnknownRecord = Record<string, unknown>

type QualityRow = {
  id: string
  label: string
  pct: number
  displayValue: string
  status: string
  supported: boolean
  reason: string
}

type DivisionForecast = {
  id: string
  division: string
  opportunities: number
  pipeline: string
  weighted: string
  gap: string
}

type ForecastKpiCard = {
  key: string
  label: string
  value: string
  foot: string
}

type ForecastScenarioOption = {
  key: Scenario
  label: string
  factor: string
  description: string
}

type Methodology = {
  source: string
  sourceLabel: string
  statusWeights: Array<{
    status: string
    label: string
    weight: string
  }>
  limitations: string[]
}

const PERIOD_RANGES: Record<string, number> = {
  today: 1,
  week: 7,
  month: 30,
  quarter: 90,
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function record(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const data = record(value)
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.divisions)) return data.divisions
  if (Array.isArray(data.quality_controls)) return data.quality_controls
  return []
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePercent(value: unknown, fallback = 0) {
  const parsed = num(value, fallback)
  const pct = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed
  return Math.max(0, Math.min(100, Math.round(pct)))
}

function formatMoney(value: unknown) {
  const amount = num(value)
  if (amount >= 1_000_000_000) return `NGN ${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `NGN ${(amount / 1_000_000).toFixed(amount % 1_000_000 ? 1 : 0)}M`
  if (amount >= 1_000) return `NGN ${Math.round(amount / 1_000).toLocaleString()}K`
  return `NGN ${Math.round(amount).toLocaleString()}`
}

function dateFromPeriod(period: string) {
  const days = PERIOD_RANGES[period] || 7
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days + 1)
  return {
    period_start: start.toISOString().slice(0, 10),
    period_end: end.toISOString().slice(0, 10),
  }
}

function pickNumber(data: UnknownRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return num(data[key], fallback)
  }
  return fallback
}

function pickDisplay(data: UnknownRecord, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = text(data[key])
    if (value) return value
  }
  return fallback
}

function transformQualityRows(forecast: UnknownRecord, leadSummary: UnknownRecord): QualityRow[] {
  const explicit = asArray(forecast.quality_controls || forecast.quality || forecast.controls)
  if (explicit.length) {
    return explicit.map((item, index) => {
      const data = record(item)
      const supported = data.supported !== false
      const pct = supported ? normalizePercent(data.pct || data.percentage || data.score || data.value) : 0
      return {
        id: text(data.key || data.id, `quality-${index}`),
        label: text(data.label || data.name || data.metric, `Quality control ${index + 1}`),
        pct,
        displayValue: pickDisplay(data, ['display_value'], supported ? `${pct}%` : 'Not tracked'),
        status: text(data.status, supported ? 'ok' : 'unsupported'),
        supported,
        reason: text(data.reason),
      }
    })
  }

  const total = num(leadSummary.total)
  if (!total) return []
  return [
    {
      id: 'sla',
      label: 'SLA-safe leads',
      pct: normalizePercent(((total - num(leadSummary.sla_breaches)) / total) * 100),
      displayValue: `${normalizePercent(((total - num(leadSummary.sla_breaches)) / total) * 100)}%`,
      status: 'derived',
      supported: true,
      reason: '',
    },
    {
      id: 'fresh',
      label: 'Non-stale leads',
      pct: normalizePercent(((total - num(leadSummary.stale_leads)) / total) * 100),
      displayValue: `${normalizePercent(((total - num(leadSummary.stale_leads)) / total) * 100)}%`,
      status: 'derived',
      supported: true,
      reason: '',
    },
    {
      id: 'followups',
      label: 'Follow-up coverage',
      pct: normalizePercent((num(leadSummary.upcoming_followups) / total) * 100),
      displayValue: `${normalizePercent((num(leadSummary.upcoming_followups) / total) * 100)}%`,
      status: 'derived',
      supported: true,
      reason: '',
    },
  ]
}

function transformDivisionForecasts(forecast: UnknownRecord): DivisionForecast[] {
  return asArray(forecast.division_rows || forecast.divisions || forecast.by_division || forecast.division_forecast).map((item, index) => {
    const data = record(item)
    return {
      id: text(data.id, `division-${index}`),
      division: text(data.division_label || data.division_display || data.division || data.name, `Division ${index + 1}`),
      opportunities: num(data.opportunities || data.opps || data.deals || data.count),
      pipeline: pickDisplay(data, ['display_pipeline'], formatMoney(data.pipeline || data.pipeline_value || data.unweighted_pipeline)),
      weighted: pickDisplay(data, ['display_weighted_forecast'], formatMoney(data.weighted || data.weighted_forecast || data.forecast)),
      gap: pickDisplay(data, ['display_target_gap'], formatMoney(data.gap || data.target_gap || data.coverage_gap)),
    }
  })
}

function transformKpiCards(forecast: UnknownRecord): ForecastKpiCard[] {
  const cards = asArray(forecast.kpi_cards).map((item, index) => {
    const data = record(item)
    return {
      key: text(data.key, `kpi-${index}`),
      label: text(data.label, `KPI ${index + 1}`),
      value: pickDisplay(data, ['display_value'], formatMoney(data.value)),
      foot: text(data.foot),
    }
  })

  return cards
}

function transformScenarioOptions(forecast: UnknownRecord): ForecastScenarioOption[] {
  const options = asArray(forecast.scenario_options)
    .map((item) => {
      const data = record(item)
      const key = text(data.key).toLowerCase()
      if (!['conservative', 'base', 'stretch'].includes(key)) return null
      return {
        key: key as Scenario,
        label: text(data.label, key),
        factor: text(data.factor),
        description: text(data.description),
      }
    })
    .filter((item): item is ForecastScenarioOption => Boolean(item))

  if (options.length) return options
  return [
    { key: 'conservative', label: 'Conservative', factor: '0.75', description: '' },
    { key: 'base', label: 'Base', factor: '1.00', description: '' },
    { key: 'stretch', label: 'Stretch', factor: '1.25', description: '' },
  ]
}

function transformMethodology(forecast: UnknownRecord): Methodology | null {
  const data = record(forecast.methodology)
  if (!Object.keys(data).length) return null

  return {
    source: text(data.source),
    sourceLabel: text(data.source_label),
    statusWeights: asArray(data.status_weights).map((item) => {
      const itemData = record(item)
      return {
        status: text(itemData.status),
        label: text(itemData.label || itemData.status, 'Status'),
        weight: text(itemData.weight),
      }
    }),
    limitations: asArray(data.limitations).map((item) => text(item)).filter(Boolean),
  }
}

export function ForecastPage() {
  const { showToast } = useToast()
  const [period, setPeriod] = useState('week')
  const [scenario, setScenario] = useState<Scenario>('base')
  const [forecastData, setForecastData] = useState<UnknownRecord | null>(null)
  const [pipelineReport, setPipelineReport] = useState<UnknownRecord | null>(null)
  const [leadSummary, setLeadSummary] = useState<UnknownRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [apiError, setApiError] = useState('')

  const loadForecast = useCallback(async () => {
    setIsLoading(true)
    setApiError('')

    try {
      const range = dateFromPeriod(period)
      const days = PERIOD_RANGES[period] || 7
      const [forecastRes, pipelineRes, leadRes] = await Promise.all([
        marketingService.getRevenueForecast({ ...range, scenario }),
        marketingService.getPipelineSummary({ period: days }),
        marketingService.getLeadSummary(),
      ])

      const errors = [forecastRes.error, pipelineRes.error, leadRes.error].filter(Boolean)
      if (errors.length) setApiError(parseApiError(errors[0]))

      setForecastData(forecastRes.data ? record(forecastRes.data) : null)
      setPipelineReport(pipelineRes.data ? record(pipelineRes.data) : null)
      setLeadSummary(leadRes.data ? record(leadRes.data) : null)
    } catch (err) {
      setApiError(parseApiError(err))
    } finally {
      setIsLoading(false)
    }
  }, [period, scenario])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadForecast()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadForecast])

  const forecast = useMemo(() => forecastData || {}, [forecastData])
  const pipeline = useMemo(() => pipelineReport || {}, [pipelineReport])
  const leads = useMemo(() => leadSummary || {}, [leadSummary])
  const hero = useMemo(() => record(forecast.hero), [forecast])
  const weightedForecast = pickNumber(hero, ['weighted_forecast'], pickNumber(forecast, ['weighted_forecast', 'weighted', 'forecast', 'forecast_value'], pickNumber(pipeline, ['revenue'])))
  const weightedForecastDisplay = pickDisplay(hero, ['display_weighted_forecast'], formatMoney(weightedForecast))
  const target = pickNumber(hero, ['target'], pickNumber(forecast, ['target', 'revenue_target', 'target_revenue']))
  const targetDisplay = pickDisplay(hero, ['display_target'], target ? formatMoney(target) : 'No backend target')
  const heroProgress = normalizePercent(hero.progress_percentage, target ? (weightedForecast / target) * 100 : 0)
  const qualityControls = useMemo(() => transformQualityRows(forecast, leads), [forecast, leads])
  const divisionForecastData = useMemo(() => transformDivisionForecasts(forecast), [forecast])
  const kpiCards = useMemo(() => transformKpiCards(forecast), [forecast])
  const scenarioOptions = useMemo(() => transformScenarioOptions(forecast), [forecast])
  const methodology = useMemo(() => transformMethodology(forecast), [forecast])

  const exportForecast = async () => {
    setIsExporting(true)
    try {
      const response = await marketingService.exportRevenueForecast({ ...dateFromPeriod(period), scenario })
      if (response.error) {
        showToast(response.error, 'error')
        return
      }
      showToast('Forecast export requested successfully.', 'success')
    } catch (err) {
      showToast(err, 'error')
    } finally {
      setIsExporting(false)
    }
  }

  if (apiError && (apiError.toLowerCase().includes('permission') || apiError.includes('403'))) {
    return <NoPermissionPage screen="forecast" />
  }

  return (
    <div className="flex min-h-0 flex-col">
      <Topbar title="Revenue forecast" period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-text">Revenue Forecast & Pipeline Coverage</h3>
            <p className="text-xs text-text-3">Weighted forecast based on stage probability, deal quality and close date confidence</p>
          </div>
          <button
            type="button"
            onClick={exportForecast}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text shadow-xs hover:bg-surface-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? <BusyLabel>Exporting...</BusyLabel> : <><AppIcon name="download" size={14} /> Export forecast</>}
          </button>
        </div>

        {apiError ? <ErrorState message={apiError} onRetry={() => void loadForecast()} compact /> : null}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {isLoading ? (
            <div className="xl:col-span-2">
              <SkeletonCardGrid cards={2} />
            </div>
          ) : (
          <>
          <section className="flex flex-col justify-between space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div>
              <div className="text-xs font-semibold text-text-3">Weighted forecast</div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-navy">{weightedForecastDisplay}</div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-gradient-to-r from-navy via-indigo-600 to-emerald-600 transition-all duration-300" style={{ width: `${heroProgress}%` }} />
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] font-medium text-text-3">
                <span>Current</span>
                <span>Target: {targetDisplay}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/80 pt-2">
              {scenarioOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  title={item.description || undefined}
                  onClick={() => setScenario(item.key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                    scenario === item.key ? 'bg-navy text-white shadow-xs' : 'border border-border/80 bg-surface-1 text-text-3 hover:bg-surface-2'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div className="border-b border-border/80 pb-2.5">
              <h3 className="text-sm font-bold text-text">Forecast quality controls</h3>
            </div>

            {qualityControls.length ? (
              <div className="space-y-2.5 pt-1">
                {qualityControls.map((row) => (
                  <div key={row.id} className="grid grid-cols-1 items-center gap-2 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(120px,1fr)_76px] sm:gap-3">
                    <span className="truncate font-semibold text-text" title={row.reason || undefined}>{row.label}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: progressColor(row.pct) }} />
                    </div>
                    <span className="font-medium text-text-3 sm:text-right">{row.displayValue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No forecast quality controls" description="No forecast quality controls were returned." icon="ti-shield-check" compact />
            )}
          </section>
          </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full">
              <SkeletonKpiGrid cards={4} />
            </div>
          ) : kpiCards.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No forecast KPI cards"
                description="No backend forecast KPI cards were returned."
                icon="ti-chart-arrows-vertical"
                compact
              />
            </div>
          ) : kpiCards.map((card) => (
            <Metric key={card.key} label={card.label} value={card.value} sub={card.foot} />
          ))}
        </div>

        <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="border-b border-border/80 pb-2.5">
            <h3 className="text-sm font-bold text-text">Forecast by division</h3>
          </div>

          {isLoading ? (
            <SkeletonList rows={5} />
          ) : divisionForecastData.length ? (
            <div className="space-y-2">
              {divisionForecastData.map((row) => (
                <div key={row.id} className="grid grid-cols-1 gap-2 rounded-xl border border-border/80 bg-surface-1 p-3 text-xs sm:grid-cols-[minmax(0,1fr)_78px_100px_110px_100px] sm:gap-3">
                  <span className="truncate font-bold text-text">{row.division}</span>
                  <span>{row.opportunities.toLocaleString()}</span>
                  <span className="font-bold">{row.pipeline}</span>
                  <span className="font-bold">{row.weighted}</span>
                  <span className="font-bold text-rose-600">{row.gap}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No division forecast rows" description="No division forecast rows were returned." icon="ti-chart-infographic" compact />
          )}
        </section>

        {methodology ? (
          <section className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs xl:grid-cols-2">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-text">Forecast methodology</h3>
                <p className="text-xs text-text-3">{methodology.sourceLabel || methodology.source}</p>
              </div>
              {methodology.statusWeights.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {methodology.statusWeights.map((item) => (
                    <div key={item.status || item.label} className="rounded-xl border border-border/80 bg-surface-1 p-3">
                      <div className="text-xs font-bold text-text">{item.label}</div>
                      <div className="mt-1 text-lg font-extrabold text-navy">{num(item.weight) * 100}%</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {methodology.limitations.length ? (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-text">Limitations</h3>
                {methodology.limitations.map((item) => (
                  <div key={item} className="rounded-xl border border-border/80 bg-surface-1 px-3 py-2 text-xs font-medium text-text-3">
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function progressColor(pct: number) {
  if (pct >= 80) return '#0A6B3E'
  if (pct >= 60) return '#B87D00'
  return '#CC0000'
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="mb-1 text-xs font-medium text-text-3">{label}</div>
      <div className="text-2xl font-extrabold tracking-tight text-text">{value}</div>
      <div className="mt-1 text-xs font-medium text-text-3">{sub}</div>
    </div>
  )
}
