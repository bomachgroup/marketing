export interface FuzzyMatchResult {
  isMatch: boolean
  matchedIndices: Set<number>
  score: number
}

/**
 * Performs fuzzy sub-sequence matching between a text target and a search query.
 * Example: query "crp" matches "Corper" (indices 0, 2, 3) or "Corporate" (indices 0, 2, 3).
 */
export function fuzzyMatch(text: string, query: string): FuzzyMatchResult {
  if (!query || !query.trim()) {
    return { isMatch: true, matchedIndices: new Set(), score: 0 }
  }

  const cleanText = text || ''
  const tLower = cleanText.toLowerCase()
  const qLower = query.trim().toLowerCase()

  // First try contiguous substring match (higher priority / score)
  const exactIndex = tLower.indexOf(qLower)
  if (exactIndex !== -1) {
    const matchedIndices = new Set<number>()
    for (let i = 0; i < qLower.length; i++) {
      matchedIndices.add(exactIndex + i)
    }
    return { isMatch: true, matchedIndices, score: 100 - exactIndex }
  }

  // Fallback to fuzzy sub-sequence match
  const matchedIndices = new Set<number>()
  let qIdx = 0

  for (let tIdx = 0; tIdx < tLower.length; tIdx++) {
    if (tLower[tIdx] === qLower[qIdx]) {
      matchedIndices.add(tIdx)
      qIdx++
      if (qIdx === qLower.length) {
        break
      }
    }
  }

  const isMatch = qIdx === qLower.length
  return {
    isMatch,
    matchedIndices: isMatch ? matchedIndices : new Set(),
    score: isMatch ? 50 - cleanText.length : 0,
  }
}
