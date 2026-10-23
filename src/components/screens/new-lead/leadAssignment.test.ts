import { describe, expect, it } from 'vitest'
import { buildLeadAssignmentPayload, transformBranchOptions } from './leadAssignment'

describe('lead ownership payload', () => {
  it('serializes selected branch and assignee IDs as integers', () => {
    expect(buildLeadAssignmentPayload('12', '34')).toEqual({
      branch_id: 12,
      assigned_to_id: 34,
    })
  })

  it('uses null to clear an optional branch or assignee', () => {
    expect(buildLeadAssignmentPayload('', '')).toEqual({
      branch_id: null,
      assigned_to_id: null,
    })
  })

  it('maps branch records from the published paged response shape', () => {
    expect(
      transformBranchOptions({
        items: [
          { id: 3, name: 'Lagos Branch', is_active: true },
          { id: 3, name: 'Duplicate', is_active: true },
          { id: 4, name: 'Inactive', is_active: false },
        ],
      }),
    ).toEqual([{ value: '3', label: 'Lagos Branch' }])
  })
})
