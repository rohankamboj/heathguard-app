import type { Config } from 'tailwindcss'

/**
 * HealthGuard design tokens → utilities (mirrors `src/styles/globals.css` :root).
 * Examples: `bg-surface-base`, `text-fg-primary`, `border-line-bright`, `shadow-accent-hg`, `animate-fade-in-hg`.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'var(--bg-base)',
          DEFAULT: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          hover: 'var(--bg-hover)',
          card: 'var(--bg-card)',
        },
        fg: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        brand: {
          accent: 'var(--accent)',
          'accent-dim': 'var(--accent-dim)',
          'accent-glow': 'var(--accent-glow)',
          'accent-glow-sm': 'var(--accent-glow-sm)',
        },
        semantic: {
          success: 'var(--success)',
          'success-bg': 'var(--success-bg)',
          warning: 'var(--warning)',
          'warning-bg': 'var(--warning-bg)',
          danger: 'var(--danger)',
          'danger-bg': 'var(--danger-bg)',
          info: 'var(--info)',
          'info-bg': 'var(--info-bg)',
        },
        role: {
          admin: 'var(--role-admin)',
          manager: 'var(--role-manager)',
          user: 'var(--role-user)',
        },
        location: {
          us: 'var(--loc-us)',
          in: 'var(--loc-in)',
          eu: 'var(--loc-eu)',
          au: 'var(--loc-au)',
        },
        line: {
          DEFAULT: 'var(--border)',
          bright: 'var(--border-bright)',
          accent: 'var(--border-accent)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'sm-hg': 'var(--radius-sm)',
        'lg-hg': 'var(--radius-lg)',
        'xl-hg': 'var(--radius-xl)',
        'full-hg': 'var(--radius-full)',
      },
      boxShadow: {
        'sm-hg': 'var(--shadow-sm)',
        hg: 'var(--shadow)',
        'lg-hg': 'var(--shadow-lg)',
        'accent-hg': 'var(--shadow-accent)',
      },
      transitionDuration: {
        hg: '150ms',
        'hg-slow': '300ms',
      },
      transitionTimingFunction: {
        hg: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in-hg': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-hg': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring-hg': {
          '0%': {
            transform: 'scale(0.95)',
            boxShadow: '0 0 0 0 rgba(0,212,191,0.4)',
          },
          '70%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 10px rgba(0,212,191,0)',
          },
          '100%': {
            transform: 'scale(0.95)',
            boxShadow: '0 0 0 0 rgba(0,212,191,0)',
          },
        },
        'shimmer-hg': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in-hg': 'fade-in-hg 0.4s ease both',
        'slide-in-hg': 'slide-in-hg 0.3s ease both',
        'pulse-ring-hg': 'pulse-ring-hg 2s ease-in-out infinite',
        'shimmer-hg': 'shimmer-hg 2s linear infinite',
      },
    },
  },
} satisfies Config
