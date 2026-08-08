interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  height?: string
}

export default function ProgressBar({
  value,
  max = 100,
  color = 'bg-navy',
  height = 'h-2',
}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full overflow-hidden rounded-full bg-surface-2 ${height}`}>
      <div
        className={`${height} rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  )
}