import { useState } from 'react'
import { EmptyState, TabBar, Topbar } from '../../shared'
import { Add, Brush } from 'iconsax-react'

const STATUS_LABEL: Record<string, string> = {
  todo: 'To do',
  review: 'In review',
  done: 'Done this week',
}

const TABS = [
  { id: 'todo', label: 'To do', count: 0 },
  { id: 'review', label: 'In review', count: 0 },
  { id: 'done', label: 'Done this week', count: 0 },
]

export function DesignPage() {
  const [tab, setTab] = useState('todo')
  const [period, setPeriod] = useState('This week')

  return (
    <div className="flex min-h-0 flex-col gap-5 p-4 sm:p-6 md:p-8">
      <Topbar
        title="Design & creative board"
        period={period}
        onPeriodChange={setPeriod}
        periodOptions={['This week', 'Today', 'This month']}
        action={
          <button
            type="button"
            disabled
            title="No confirmed design brief creation endpoint is available."
            className="inline-flex min-w-0 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-navy px-3 py-1.5 text-xs font-semibold text-white opacity-50 shadow-xs"
          >
            <Add color="currentColor" variant="Outline" size={15} />
            <span className="truncate">New design brief</span>
          </button>
        }
      />

      <TabBar tabs={TABS} activeTab={tab} onChange={setTab} />

      <div className="rounded-2xl border border-dashed border-border-2 bg-surface px-4 py-14">
        <EmptyState
          title={`No design tasks in ${STATUS_LABEL[tab]}`}
          description="Design workflow endpoints are not confirmed yet, so this board is read-only and does not show local demo tasks."
          icon="ti-brush"
        />
        <div className="mt-4 flex justify-center text-text-3">
          <Brush size={36} color="currentColor" variant="Outline" />
        </div>
      </div>
    </div>
  )
}
