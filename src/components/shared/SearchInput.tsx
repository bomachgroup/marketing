interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
}: SearchInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-3">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
      />
    </div>
  )
}