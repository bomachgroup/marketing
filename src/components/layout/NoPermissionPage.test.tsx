import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import NoPermissionPage from './NoPermissionPage'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    userRole: { name: 'Staff' },
    currentRole: 'staff',
    employeeDetails: null,
    getFirstAccessibleScreen: () => 'dashboard',
    hasPermission: () => false,
  }),
}))

describe('NoPermissionPage', () => {
  it('shows a user-facing access message without exposing permission internals', () => {
    render(<NoPermissionPage screen="forecast" />)

    expect(screen.getByText(/You do not have access to this page\./)).toBeInTheDocument()
    expect(screen.queryByText('Required Resource:')).not.toBeInTheDocument()
    expect(screen.queryByText('Access Policy:')).not.toBeInTheDocument()
  })
})
