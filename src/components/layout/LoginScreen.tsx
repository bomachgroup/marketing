import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../context/AuthContext'
import { BusyLabel } from '../shared'
import { AppIcon } from '../shared/AppIcon'
import { parseApiError } from '../../services/api/apiClient'
import { useToast } from '../../context/ToastContext'

export default function LoginScreen() {
  const { login, verify2FA, twoFactorToken, isLoading, getFirstAccessibleScreen } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleRealLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password) {
      const msg = 'Please enter both your email address and password.'
      setErrorMessage(msg)
      showToast(msg, 'error')
      return
    }

    const res = await login(email.trim(), password)
    if (res.success) {
      showToast('Signed in successfully', 'success')
      navigate({ to: `/${res.redirectTo || getFirstAccessibleScreen()}` as never })
    } else if (res.error) {
      const parsed = parseApiError(res.error)
      setErrorMessage(parsed)
      showToast(parsed, 'error')
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    if (!twoFactorCode.trim()) {
      const msg = 'Please enter your 6-digit 2FA verification code'
      setErrorMessage(msg)
      showToast(msg, 'error')
      return
    }

    const res = await verify2FA(twoFactorCode.trim())
    if (res.success) {
      showToast('Two-factor authentication verified', 'success')
      navigate({ to: `/${res.redirectTo || getFirstAccessibleScreen()}` as never })
    } else if (res.error) {
      const parsed = parseApiError(res.error)
      setErrorMessage(parsed)
      showToast(parsed, 'error')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-dark via-navy to-navy-dark p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-surface p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-xl font-black text-white shadow-md">
            B
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-text" style={{ fontFamily: 'var(--font-heading)' }}>
            Bomach OS
          </h1>
          <p className="mt-1 text-xs font-medium text-text-3">Marketing & Revenue Operating System</p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-800 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-start gap-2 min-w-0">
              <AppIcon name="shield-security" size={16} className="mt-0.5 shrink-0 text-rose-600" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="shrink-0 text-rose-600 hover:text-rose-900"
              title="Dismiss error"
            >
              <AppIcon name="close-square" size={14} />
            </button>
          </div>
        )}

        {twoFactorToken ? (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="space-y-1 text-center">
              <AppIcon name="shield-security" size={32} className="mx-auto text-navy" />
              <h2 className="text-sm font-bold text-text">Two-Factor Authentication</h2>
              <p className="text-[11px] text-text-3">Enter the 6-digit verification code sent to your device.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-text-2">Verification Code</label>
              <input
                type="text"
                value={twoFactorCode}
                disabled={isLoading}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-center font-mono text-base tracking-widest text-text outline-none focus:border-navy focus:ring-1 focus:ring-navy disabled:cursor-wait disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-navy py-2.5 text-xs font-bold text-white transition-all hover:bg-navy-dark disabled:opacity-50"
            >
              {isLoading ? <BusyLabel>Verifying...</BusyLabel> : 'Verify Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRealLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-text-2">Email Address</label>
              <input
                type="email"
                value={email}
                disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bomachgroup.com"
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-text outline-none placeholder:text-text-3 focus:border-navy focus:ring-1 focus:ring-navy disabled:cursor-wait disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-text-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-10 w-full rounded-xl border border-border bg-surface pl-3 pr-10 text-xs text-text outline-none placeholder:text-text-3 focus:border-navy focus:ring-1 focus:ring-navy disabled:cursor-wait disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-text-3 hover:text-text-2 disabled:cursor-wait disabled:opacity-60"
                >
                  <AppIcon name={showPassword ? 'eye' : 'eye'} size={16} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-xs font-bold text-white transition-all hover:bg-navy-dark disabled:opacity-50 active:scale-95"
            >
              {isLoading ? <BusyLabel>Signing in...</BusyLabel> : <><AppIcon name="logout" size={16} /> Sign in</>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
