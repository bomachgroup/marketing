import { describe, expect, it } from 'vitest'
import { presentError } from './presentError'

describe('presentError', () => {
  it('hides technical database errors from users', () => {
    const result = presentError(
      {
        status: 400,
        message: 'FOR UPDATE cannot be applied to the nullable side of an outer join',
      },
      'form-submit',
    )
    expect(result.message).not.toMatch(/FOR UPDATE/i)
    expect(result.message).toMatch(/try again/i)
  })

  it('keeps useful validation messages', () => {
    const result = presentError(
      { status: 400, message: 'Phone is required.' },
      'form-submit',
    )
    expect(result.message).toBe('Phone is required.')
  })
})
