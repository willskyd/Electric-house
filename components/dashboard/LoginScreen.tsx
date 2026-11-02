'use client'

import { useState } from 'react'
import { LogIn, Store } from 'lucide-react'

export function LoginScreen({
  onSignIn,
  checking = false,
}: {
  onSignIn: (identifier: string, password: string) => Promise<void>
  checking?: boolean
}) {
  const [identifier, setIdentifier] = useState('electrichouse.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onSignIn(identifier, password)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand-mark"><Store /></div>
        <div className="eyebrow">Electric house Admin</div>
        <h1>{checking ? 'Checking your session' : 'Welcome back'}</h1>
        <p>{checking ? 'Verifying your sign-in…' : 'Sign in to manage your stock and customer accounts.'}</p>
        {!checking && <form onSubmit={submit}>
          <label>
            Admin email or username
            <input
              type="text"
              name="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            <LogIn />{submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>}
      </div>
    </div>
  )
}
