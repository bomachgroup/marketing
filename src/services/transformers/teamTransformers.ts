type UnknownRecord = Record<string, unknown>

export interface TeamDirectoryMember {
  id: string | number
  initials: string
  name: string
  role: string
  meta: string
  statusLabel: string
  isActive: boolean
  avatarClass: string
}

export interface TeamDirectorySummary {
  totalMembers: number
  activeMembers: number
  departments: number
  units: number
}

export interface TeamDirectoryData {
  members: TeamDirectoryMember[]
  summary: TeamDirectorySummary
}

export interface EmployeeOption {
  id: string | number
  label: string
  sublabel: string
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function arrayFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!isRecord(value)) return []
  const candidates = [value.items, value.results, value.data, value.employees, value.rows]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

function numberFrom(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function textFrom(value: unknown, fallback = '') {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function personNameFrom(value: UnknownRecord, fallback = 'Unnamed team member') {
  const directName = textFrom(value.full_name ?? value.name ?? value.employee_name)
  if (directName && !directName.includes('@')) return directName

  const joinedName = [
    value.first_name,
    value.middle_name,
    value.last_name,
    value.surname,
  ]
    .map((part) => textFrom(part))
    .filter(Boolean)
    .join(' ')

  if (joinedName) return joinedName
  return directName || fallback
}

function boolFrom(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const key = value.trim().toLowerCase()
    if (['true', 'active', 'yes', '1'].includes(key)) return true
    if (['false', 'inactive', 'no', '0'].includes(key)) return false
  }
  return fallback
}

function initialsFrom(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'TM'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function countFrom(data: unknown, rows: unknown[]) {
  if (!isRecord(data)) return rows.length
  return numberFrom(data.count ?? data.total ?? data.total_count, rows.length)
}

function memberFrom(value: unknown, index: number): TeamDirectoryMember | null {
  if (!isRecord(value)) return null
  const id = textFrom(value.id ?? value.user_id ?? value.employee_id, String(index + 1))
  const name = personNameFrom(value)
  const role = textFrom(value.position ?? value.job_title ?? value.role ?? value.designation, 'Team member')
  const department = textFrom(value.department_name ?? value.department ?? value.unit_name)
  const branch = textFrom(value.branch_name ?? value.branch)
  const employment = textFrom(value.employment_type)
  const meta = [department, branch, employment].filter(Boolean).join(' · ') || 'No department data'
  const isActive = boolFrom(value.is_active ?? value.active ?? value.status, true)
  const palette = ['bg-blue-900', 'bg-emerald-700', 'bg-indigo-700', 'bg-rose-700', 'bg-amber-700', 'bg-slate-700']

  return {
    id,
    initials: initialsFrom(name),
    name,
    role,
    meta,
    statusLabel: isActive ? 'Active' : 'Inactive',
    isActive,
    avatarClass: `${palette[index % palette.length]} text-white`,
  }
}

export function transformTeamDirectory(employeesData: unknown, departmentsData: unknown, unitsData: unknown): TeamDirectoryData {
  const employeeRows = arrayFrom(employeesData)
  const departmentRows = arrayFrom(departmentsData)
  const unitRows = arrayFrom(unitsData)
  const members = employeeRows
    .map((row, index) => memberFrom(row, index))
    .filter((row): row is TeamDirectoryMember => Boolean(row))

  return {
    members,
    summary: {
      totalMembers: countFrom(employeesData, employeeRows),
      activeMembers: members.filter((member) => member.isActive).length,
      departments: countFrom(departmentsData, departmentRows),
      units: countFrom(unitsData, unitRows),
    },
  }
}

export function transformEmployeeOptions(data: unknown): EmployeeOption[] {
  return arrayFrom(data)
    .map((row, index): EmployeeOption | null => {
      if (!isRecord(row)) return null
      const id = textFrom(row.id ?? row.user_id ?? row.employee_id, String(index + 1))
      const label = personNameFrom(row)
      const sublabel = textFrom(row.position ?? row.job_title ?? row.department_name, 'Team member')
      return { id, label, sublabel }
    })
    .filter((row): row is EmployeeOption => Boolean(row))
}
