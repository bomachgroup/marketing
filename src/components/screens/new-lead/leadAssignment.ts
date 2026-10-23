function numericId(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function buildLeadAssignmentPayload(branchId: string, assignedToId: string) {
  return {
    branch_id: numericId(branchId),
    assigned_to_id: numericId(assignedToId),
  }
}

export interface LeadBranchOption {
  value: string
  label: string
}

export function transformBranchOptions(payload: unknown): LeadBranchOption[] {
  if (!payload || typeof payload !== 'object') return []
  const source = payload as Record<string, unknown>
  const rows = Array.isArray(payload)
    ? payload
    : [source.items, source.results, source.data].find(Array.isArray) ?? []
  const options = new Map<string, LeadBranchOption>()

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const branch = row as Record<string, unknown>
    if (branch.is_active === false) continue
    const id = branch.id ?? branch.branch_id
    const label = branch.name ?? branch.branch_name
    if (id === null || id === undefined || typeof label !== 'string' || !label.trim()) continue
    if (!options.has(String(id))) {
      options.set(String(id), { value: String(id), label: label.trim() })
    }
  }

  return [...options.values()]
}
