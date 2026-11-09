import { describe, expect, it } from 'vitest'
import { canonicalMarketingPath } from './shared-host'

describe('canonical Marketing paths', () => {
  it.each([
    ['/', '/marketing/'],
    ['/dashboard', '/marketing/dashboard'],
    ['/marketing', '/marketing/'],
    ['/marketing/leads', '/marketing/leads'],
  ])('normalizes %s to %s', (pathname, expected) => {
    expect(canonicalMarketingPath(pathname)).toBe(expected)
  })
})
