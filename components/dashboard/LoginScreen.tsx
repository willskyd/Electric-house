import { LogIn, Store } from 'lucide-react'

export function LoginScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand-mark"><Store /></div>
        <div className="eyebrow">Acme Market workspace</div>
        <h1>Welcome back</h1>
        <p>Sign in to manage your inventory and customer accounts.</p>
        <form onSubmit={(e) => { e.preventDefault(); onSignIn() }}>
          <label>
            Email
            <input type="email" defaultValue="admin@acmemarket.com" required />
          </label>
          <label>
            Password
            <input type="password" defaultValue="password" required />
          </label>
          <button className="primary-button" type="submit"><LogIn />Sign in</button>
        </form>
      </div>
    </div>
  )
}
