import React from 'react'
import { fuzzyMatch } from '../../utils/fuzzySearch'

interface HighlightTextProps {
  text: string
  query: string
  className?: string
  highlightClassName?: string
}

interface TextChunk {
  text: string
  isMatched: boolean
}

export function HighlightText({
  text,
  query,
  className = '',
  highlightClassName = 'font-extrabold text-navy bg-blue-100/90 rounded-[2px]',
}: HighlightTextProps) {
  if (!text) return null
  if (!query || !query.trim()) return <span className={className}>{text}</span>

  const { isMatch, matchedIndices } = fuzzyMatch(text, query)

  if (!isMatch || matchedIndices.size === 0) {
    return <span className={className}>{text}</span>
  }

  // Merge consecutive matched/unmatched characters into single chunks
  const chunks: TextChunk[] = []
  let currentChunk = ''
  let currentIsMatched = matchedIndices.has(0)

  for (let i = 0; i < text.length; i++) {
    const isMatched = matchedIndices.has(i)
    if (isMatched === currentIsMatched) {
      currentChunk += text[i]
    } else {
      if (currentChunk) {
        chunks.push({ text: currentChunk, isMatched: currentIsMatched })
      }
      currentChunk = text[i]
      currentIsMatched = isMatched
    }
  }
  if (currentChunk) {
    chunks.push({ text: currentChunk, isMatched: currentIsMatched })
  }

  return (
    <span className={className}>
      {chunks.map((chunk, index) =>
        chunk.isMatched ? (
          <mark key={index} className={`bg-transparent ${highlightClassName}`}>
            {chunk.text}
          </mark>
        ) : (
          <React.Fragment key={index}>{chunk.text}</React.Fragment>
        )
      )}
    </span>
  )
}
