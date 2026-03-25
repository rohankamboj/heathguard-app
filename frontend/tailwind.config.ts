import type { Config } from 'tailwindcss'

/** Minimal config so tooling (e.g. shadcn CLI) detects Tailwind; v4 styles come from CSS + Vite plugin. */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
} satisfies Config
