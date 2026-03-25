import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button, Input } from '../shared/UI'
import { Lock, User, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password.trim()) {
      setError('Please enter both username and password')
      return
    }
    const result = await login(form.username.trim(), form.password)
    if (result.success) {
      toast.success(`Welcome back!`)
      const routes = { admin: '/admin', manager: '/manager', user: '/user' }
      navigate(routes[result.role] || '/user')
    } else {
      setError(result.error)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background geometric pattern */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.04 }}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00d4bf" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,191,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,166,255,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* Left panel — branding */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center',
        padding: '80px 64px', borderRight: '1px solid var(--border)',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-base) 100%)',
      }}
        className="left-panel"
      >
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-lg)', padding: 12 }}>
              <Shield size={28} color="var(--accent)" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              HealthGuard
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 24 }}>
            Secure<br />Healthcare<br />
            <span style={{ color: 'var(--accent)' }}>Platform</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 380 }}>
            Enterprise-grade patient data management with AES-256 encryption, role-based access controls, and full HIPAA compliance.
          </p>
        </div>

        {/* Feature pills */}
        {[
          { icon: '🔐', text: 'AES-256-GCM field-level encryption' },
          { icon: '🌍', text: 'Multi-location & team support' },
          { icon: '📋', text: 'Complete audit trail logging' },
          { icon: '⚡', text: 'Real-time data management' },
        ].map((f) => (
          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 18 }}>{f.icon}</span>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 32px',
        margin: '0 auto',
      }}>
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {/* Logo (mobile / standalone) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-lg)', padding: 10 }}>
              <Shield size={22} color="var(--accent)" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              HealthGuard
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Sign in
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 40 }}>
            Enter your credentials to access your dashboard
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Input
              label="Username or Email"
              icon={User}
              type="text"
              placeholder="e.g. admin or mgr_us"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              autoComplete="username"
              autoFocus
            />

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    padding: '10px 40px 10px 38px',
                    outline: 'none',
                    transition: 'var(--transition)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow-sm)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-bg)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 'var(--radius)', padding: '10px 14px', animation: 'fadeIn 0.2s ease' }}>
                <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" loading={isLoading} style={{ width: '100%', marginTop: 4 }}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 40, padding: '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Demo Credentials
            </p>
            {[
              { role: 'Admin',   user: 'admin',  pass: 'Admin@123!',   color: 'var(--role-admin)' },
              { role: 'Manager', user: 'mgr_us', pass: 'Manager@123!', color: 'var(--role-manager)' },
              { role: 'User',    user: 'user_us_ar', pass: 'User@1234!', color: 'var(--role-user)' },
            ].map(c => (
              <div key={c.role}
                onClick={() => setForm({ username: c.user, password: c.pass })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'var(--transition)', marginBottom: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.role}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.user} / {c.pass}</span>
              </div>
            ))}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Click a row to auto-fill credentials</p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
