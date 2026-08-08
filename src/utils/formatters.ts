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

export function pluralize(count: number | string | undefined | null, singular: string, plural?: string): string {
  const num = typeof count === 'number' ? count : parseFloat(String(count || 0)) || 0
  const absCount = Math.abs(num)
  const noun = absCount === 1 ? singular : (plural || `${singular}s`)
  return `${num} ${noun}`
}

export function pluralizeNoun(count: number | string | undefined | null, singular: string, plural?: string): string {
  const num = typeof count === 'number' ? count : parseFloat(String(count || 0)) || 0
  const absCount = Math.abs(num)
  return absCount === 1 ? singular : (plural || `${singular}s`)
}

export function sanitizePluralText(textStr: string): string {
  if (!textStr || typeof textStr !== 'string') return ''
  return textStr.replace(/\b1\s+([a-zA-Z]+)\b/g, (_match, word) => {
    const lower = word.toLowerCase()
    let singularWord = word
    if (lower === 'activities') singularWord = word[0] === 'A' ? 'Activity' : 'activity'
    else if (lower === 'entries') singularWord = word[0] === 'E' ? 'Entry' : 'entry'
    else if (lower === 'breaches') singularWord = word[0] === 'B' ? 'Breach' : 'breach'
    else if (lower === 'statuses') singularWord = word[0] === 'S' ? 'Status' : 'status'
    else if (lower.endsWith('s') && !lower.endsWith('ss')) {
      singularWord = word.slice(0, -1)
    }
    return `1 ${singularWord}`
  })
}

export function trimTrailingZeroDecimals(num: number | string, decimals = 1): string {
  const parsed = typeof num === 'number' ? num : parseFloat(String(num))
  if (!Number.isFinite(parsed)) return String(num || '')
  return String(parseFloat(parsed.toFixed(decimals)))
}


