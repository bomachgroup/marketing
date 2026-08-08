import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import type { ReactNode } from 'react'

const skeletonBase = '#EEF0F4'
const skeletonHighlight = '#F8F9FB'

function ThemedSkeleton({ children }: { children: ReactNode }) {
  return (
    <SkeletonTheme baseColor={skeletonBase} highlightColor={skeletonHighlight} borderRadius={10}>
      {children}
    </SkeletonTheme>
  )
}

export function SkeletonCard({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <ThemedSkeleton>
      <div className={`rounded-xl border border-border bg-surface p-4 shadow-xs ${className}`}>
        <Skeleton width="45%" height={12} />
        <div className="mt-3">
          <Skeleton width="70%" height={24} />
        </div>
        <div className="mt-3 space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton key={index} width={`${88 - index * 12}%`} height={10} />
          ))}
        </div>
      </div>
    </ThemedSkeleton>
  )
}

export function SkeletonKpiGrid({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <SkeletonCard key={index} lines={1} />
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 4, avatar = false, className = '' }: { rows?: number; avatar?: boolean; className?: string }) {
  return (
    <ThemedSkeleton>
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-surface p-3">
            {avatar ? <Skeleton circle width={32} height={32} /> : null}
            <div className="min-w-0 flex-1">
              <Skeleton width="55%" height={12} />
              <div className="mt-2">
                <Skeleton width="82%" height={10} />
              </div>
            </div>
            <Skeleton width={54} height={20} />
          </div>
        ))}
      </div>
    </ThemedSkeleton>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <ThemedSkeleton>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid border-b border-border bg-surface-1 px-3 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} width="60%" height={10} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid border-b border-border/60 px-3 py-3 last:border-b-0"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} width={colIndex === 0 ? '76%' : '52%'} height={11} />
            ))}
          </div>
        ))}
      </div>
    </ThemedSkeleton>
  )
}

export function SkeletonTableBodyRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <ThemedSkeleton>
      <>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="border-b border-border/60">
            {Array.from({ length: columns }).map((__, colIndex) => (
              <td key={colIndex} className="px-3 py-3">
                <Skeleton width={colIndex === 0 ? '72%' : '54%'} height={11} />
              </td>
            ))}
          </tr>
        ))}
      </>
    </ThemedSkeleton>
  )
}

export function SkeletonCardGrid({ cards = 6, className = 'grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3' }: { cards?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: cards }).map((_, index) => (
        <SkeletonCard key={index} lines={2} />
      ))}
    </div>
  )
}

export function SkeletonKanban({ stages = 7, cardsPerStage = 3 }: { stages?: number; cardsPerStage?: number }) {
  return (
    <ThemedSkeleton>
      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {Array.from({ length: stages }).map((_, stageIndex) => (
          <div key={stageIndex} className="min-w-0 space-y-2">
            <div className="rounded-xl border border-border/80 bg-surface-1 p-2">
              <Skeleton width="65%" height={14} />
            </div>
            {Array.from({ length: cardsPerStage }).map((_, cardIndex) => (
              <div key={cardIndex} className="rounded-xl border border-border bg-surface p-3 shadow-xs">
                <Skeleton width="72%" height={12} />
                <div className="mt-2">
                  <Skeleton width="88%" height={10} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton width={46} height={18} />
                  <Skeleton width={62} height={10} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ThemedSkeleton>
  )
}

export function SkeletonChart({ bars = 6 }: { bars?: number }) {
  return (
    <ThemedSkeleton>
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <Skeleton width="48%" height={12} />
        <div className="flex h-24 items-end justify-between gap-2 border-b border-border/60 px-2 pt-4">
          {Array.from({ length: bars }).map((_, index) => (
            <Skeleton key={index} width="100%" height={`${35 + ((index * 17) % 55)}%`} containerClassName="flex-1" />
          ))}
        </div>
        <Skeleton width="80%" height={10} />
      </div>
    </ThemedSkeleton>
  )
}

export function SkeletonDetail({ rows = 6 }: { rows?: number }) {
  return (
    <ThemedSkeleton>
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3 border-b border-border/80 pb-4">
          <Skeleton circle width={44} height={44} />
          <div className="min-w-0 flex-1">
            <Skeleton width="45%" height={14} />
            <div className="mt-2">
              <Skeleton width="65%" height={10} />
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <Skeleton width="32%" height={10} />
              <Skeleton width="42%" height={11} />
            </div>
          ))}
        </div>
      </div>
    </ThemedSkeleton>
  )
}

export function SkeletonForm({ fields = 6 }: { fields?: number }) {
  return (
    <ThemedSkeleton>
      <div className="space-y-3">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton width="28%" height={10} />
            <Skeleton height={38} />
          </div>
        ))}
      </div>
    </ThemedSkeleton>
  )
}

export function SkeletonField() {
  return (
    <ThemedSkeleton>
      <Skeleton height={38} />
    </ThemedSkeleton>
  )
}
