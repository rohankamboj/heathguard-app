/** Full class names so Tailwind can detect them at build time. */
export const LOCATION_TEXT_CLASS: Record<string, string> = {
  US: 'text-location-us',
  IN: 'text-location-in',
  EU: 'text-location-eu',
  AU: 'text-location-au',
}

export const LOCATION_BG_CLASS: Record<string, string> = {
  US: 'bg-location-us',
  IN: 'bg-location-in',
  EU: 'bg-location-eu',
  AU: 'bg-location-au',
}

export function locationTextClass(code?: string | null): string {
  return (code && LOCATION_TEXT_CLASS[code]) || 'text-fg-secondary'
}

export function locationBgClass(code?: string | null): string {
  return (code && LOCATION_BG_CLASS[code]) || 'bg-brand-accent'
}
