export function capitalizeName(str: string | null | undefined, fallback = ''): string {
  if (!str || typeof str !== 'string') return fallback
  const trimmed = str.trim()
  if (!trimmed) return fallback

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return ''
      return word
        .split('-')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ''))
        .join('-')
    })
    .join(' ')
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function moneyNum(v: string | number): number {
  if (typeof v === 'number') return v
  if (!v || v === '—') return 0
  const n = parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0
  return /M/i.test(v) ? n * 1000000 : /K/i.test(v) ? n * 1000 : n
}

export function fmtMoney(n: number): string {
  if (n >= 1000000000)
    return '₦' + parseFloat((n / 1000000000).toFixed(1)) + 'B'
  if (n >= 1000000)
    return '₦' + parseFloat((n / 1000000).toFixed(1)) + 'M'
  if (n >= 1000) return '₦' + Math.round(n / 1000).toLocaleString() + 'K'
  return '₦' + Math.round(n).toLocaleString()
}

export function money(v: string | number): string {
  const n = moneyNum(v)
  return fmtMoney(n)
}

export function deterministicIndex(id: string, mod: number): number {
  return id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % mod
}

export function daysRemaining(end: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(end + 'T00:00:00')
  return Math.ceil((d.getTime() - now.getTime()) / 86400000)
}

export function c4Pct(a: number, b: number): number {
  return b ? Math.round((Number(a || 0) / Number(b)) * 100) : 0
}

export function c4Today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function c4Now(): string {
  return new Date().toLocaleString()
}

export function c4Id(prefix: string): string {
  return (
    prefix +
    '-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 6)
  )
}

export function cloneDeep<T>(x: T): T {
  return JSON.parse(JSON.stringify(x))
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export interface LeadDerived {
  score: number
  age: number
  priority: string
  next: string
  sla: string
}

export function leadDerived(l: { id: string; stage: string; source: string; value: string; overdue?: boolean }): LeadDerived {
  const stageBase: Record<string, number> = {
    new: 22,
    contacted: 38,
    qualified: 64,
    proposal: 74,
    negotiation: 86,
    won: 100,
    lost: 18,
  }
  const base = stageBase[l.stage] || 30
  const sourceBonus = /Referral/i.test(l.source)
    ? 10
    : /WhatsApp|Website/i.test(l.source)
      ? 7
      : /Facebook|Instagram/i.test(l.source)
        ? 4
        : 2
  const valueBonus = Math.min(10, Math.round(moneyNum(l.value) / 3000000))
  const overduePenalty = l.overdue ? -16 : 0
  const score = Math.max(5, Math.min(99, base + sourceBonus + valueBonus + overduePenalty + deterministicIndex(l.id, 6)))
  const age = 1 + deterministicIndex(l.id, 18)
  const priority = score >= 75 ? 'Hot' : score >= 50 ? 'Warm' : 'Nurture'
  const nextMap: Record<string, string> = {
    new: 'Call + qualify',
    contacted: 'Confirm need & timeline',
    qualified: 'Book meeting / inspection',
    proposal: 'Proposal follow-up',
    negotiation: 'Decision call',
    won: 'Onboard + referral',
    lost: 'Reactivation review',
  }
  const next = nextMap[l.stage] || 'Define next action'
  const sla = l.overdue ? 'Breach' : l.stage === 'new' ? 'Due now' : 'Safe'
  return { score, age, priority, next, sla }
}

export function pillClass(stage: string): string {
  const map: Record<string, string> = {
    new: 'p-new',
    contacted: 'p-contact',
    qualified: 'p-qual',
    proposal: 'p-prop',
    negotiation: 'p-neg',
    won: 'p-won',
    lost: 'p-lost',
    active: 'p-active',
    draft: 'p-draft',
    pause: 'p-pause',
    over: 'p-over',
    review: 'p-review',
    pub: 'p-pub',
    brief: 'p-brief',
    prog: 'p-prog',
  }
  return map[stage] || 'p-draft'
}

export function divPillClass(div: string): string {
  const map: Record<string, string> = {
    re: 'd-re',
    eng: 'd-eng',
    sur: 'd-sur',
    ben: 'd-ben',
    ict: 'd-ict',
    agr: 'd-agr',
  }
  return map[div] || 'd-re'
}

export function divLabel(div: string): string {
  const map: Record<string, string> = {
    re: 'Real Estate',
    eng: 'Engineering',
    sur: 'Surveying',
    ben: 'Benji',
    ict: 'ICT',
    agr: 'Agriculture',
  }
  return map[div] || div
}