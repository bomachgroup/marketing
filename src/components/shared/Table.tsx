import type { ReactNode } from 'react'
import { EmptyState } from './StatePanel'
import { SkeletonTable } from './Skeletons'

interface Column {
  key: string
  label: string
}

type TableRow = Record<string, ReactNode>

function rowKey(row: TableRow, index: number) {
  const id = row.id
  return typeof id === 'string' || typeof id === 'number' ? id : index
}

interface TableProps {
  columns: Column[]
  rows: TableRow[]
  onRowClick?: (row: TableRow) => void
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
}

export default function Table({
  columns,
  rows,
  onRowClick,
  loading = false,
  emptyTitle = 'No records',
  emptyDescription = 'No rows were returned for this table.',
  emptyIcon = 'ti-table',
}: TableProps) {
  if (loading) {
    return <SkeletonTable columns={columns.length || 4} rows={5} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-3"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-border transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-surface-1' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-text">
                  {row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="py-3">
          <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} compact />
        </div>
      )}
    </div>
  )
}
