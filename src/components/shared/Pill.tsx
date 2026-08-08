import type { ReactNode } from 'react'

type PillVariant =
  | 'p-new'
  | 'p-contact'
  | 'p-qual'
  | 'p-prop'
  | 'p-neg'
  | 'p-won'
  | 'p-lost'
  | 'p-active'
  | 'p-draft'
  | 'p-pause'
  | 'p-over'
  | 'p-review'

const variantStyles: Record<PillVariant, string> = {
  'p-new': 'bg-blue-50 text-blue-700 border-blue-200/80',
  'p-contact': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  'p-qual': 'bg-amber-50 text-amber-800 border-amber-200/80',
  'p-prop': 'bg-purple-50 text-purple-700 border-purple-200/80',
  'p-neg': 'bg-pink-50 text-pink-700 border-pink-200/80',
  'p-won': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  'p-lost': 'bg-rose-50 text-rose-700 border-rose-200/80',
  'p-active': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  'p-draft': 'bg-slate-100 text-slate-700 border-slate-200/80',
  'p-pause': 'bg-amber-50 text-amber-800 border-amber-200/80',
  'p-over': 'bg-rose-50 text-rose-700 border-rose-200/80',
  'p-review': 'bg-purple-50 text-purple-700 border-purple-200/80',
}

interface PillProps {
  variant: PillVariant
  children: ReactNode
}

export default function Pill({ variant, children }: PillProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all ${variantStyles[variant] || variantStyles['p-draft']}`}
    >
      {children}
    </span>
  )
}