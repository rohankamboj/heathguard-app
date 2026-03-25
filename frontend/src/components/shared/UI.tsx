import { clsx } from 'clsx'
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'
import { Loader2, X, type LucideIcon } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning'
type ButtonSize = 'sm' | 'md' | 'lg'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-all rounded-lg cursor-pointer border-0 outline-none'
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-dim)] active:scale-95',
    secondary:
      'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-bright)] hover:bg-[var(--bg-hover)] active:scale-95',
    danger:
      'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white active:scale-95',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-95',
    success:
      'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)] hover:bg-[var(--success)] hover:text-[var(--text-inverse)] active:scale-95',
    warning:
      'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning)] hover:bg-[var(--warning)] hover:text-[var(--text-inverse)] active:scale-95',
  }
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      type={type}
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        loading && 'opacity-70 pointer-events-none',
        className
      )}
      style={{ fontFamily: 'var(--font-body)' }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  )
}

export function Input({
  label,
  error,
  icon: Icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  icon?: LucideIcon
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            <Icon size={16} />
          </div>
        )}
        <input
          {...props}
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            padding: Icon ? '10px 12px 10px 38px' : '10px 12px',
            transition: 'var(--transition)',
            outline: 'none',
            ...props.style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent)'
            e.target.style.boxShadow = '0 0 0 3px var(--accent-glow-sm)'
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'
            e.target.style.boxShadow = 'none'
            props.onBlur?.(e)
          }}
          className={className}
        />
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

export function Select({
  label,
  error,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {label}
        </label>
      )}
      <select
        {...props}
        style={{
          width: '100%',
          background: 'var(--bg-elevated)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          padding: '10px 12px',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'admin'
  | 'manager'
  | 'user'

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
}: {
  children: ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}) {
  const styles: Record<BadgeVariant, CSSProperties> = {
    default: { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    accent: {
      background: 'var(--accent-glow)',
      color: 'var(--accent)',
      border: '1px solid var(--border-accent)',
    },
    success: {
      background: 'var(--success-bg)',
      color: 'var(--success)',
      border: '1px solid rgba(0,200,150,0.3)',
    },
    warning: {
      background: 'var(--warning-bg)',
      color: 'var(--warning)',
      border: '1px solid rgba(245,166,35,0.3)',
    },
    danger: {
      background: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: '1px solid rgba(255,77,109,0.3)',
    },
    info: {
      background: 'var(--info-bg)',
      color: 'var(--info)',
      border: '1px solid rgba(77,166,255,0.3)',
    },
    admin: {
      background: 'rgba(192,132,252,0.1)',
      color: 'var(--role-admin)',
      border: '1px solid rgba(192,132,252,0.3)',
    },
    manager: {
      background: 'var(--accent-glow)',
      color: 'var(--role-manager)',
      border: '1px solid var(--border-accent)',
    },
    user: {
      background: 'var(--info-bg)',
      color: 'var(--role-user)',
      border: '1px solid rgba(77,166,255,0.3)',
    },
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: 'var(--radius-full)',
        fontSize: size === 'sm' ? 11 : 13,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...styles[variant],
      }}
    >
      {children}
    </span>
  )
}

export function Card({
  children,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}

export function Spinner({ size = 24, color = 'var(--accent)' }: { size?: number; color?: string }) {
  return <Loader2 size={size} style={{ color, animation: 'spin 1s linear infinite' }} />
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 520,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}) {
  if (!open) return null
  return (
    <div
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(8,12,20,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'fadeIn 0.2s ease',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        gap: 16,
        color: 'var(--text-muted)',
      }}
    >
      {Icon && <Icon size={40} strokeWidth={1.5} />}
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          {title}
        </p>
        {description && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'var(--accent)',
  trend,
}: {
  label: string
  value: ReactNode
  icon?: LucideIcon
  color?: string
  trend?: string
}) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-body)',
          }}
        >
          {label}
        </span>
        {Icon && (
          <div
            style={{
              background: `color-mix(in srgb, ${color} 15%, transparent)`,
              padding: 8,
              borderRadius: 'var(--radius)',
              color,
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 800,
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {trend && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{trend}</p>}
    </Card>
  )
}
