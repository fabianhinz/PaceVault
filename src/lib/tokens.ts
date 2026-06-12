/**
 * Design system tokens — JavaScript mirror of CSS custom properties in src/index.css.
 *
 * IMPORTANT: Keep in sync with src/index.css @theme block.
 * The CSS file is the source of truth. Update both when changing token values.
 */

export const tokens = {
  // Surfaces
  surfaceSunken: '#0a0b0f',
  surface: '#111318',
  surfaceElevated: '#1a1d24',
  surfaceOverlay: '#252830',

  // Borders
  border: '#252830',
  borderSubtle: '#1a1d24',

  // Text hierarchy
  textPrimary: '#e5e7eb',
  textSecondary: '#b0b4be',
  textTertiary: '#8b8f9a',
  textQuaternary: '#5c616e',

  // Accent
  accent: '#3b82f6',
  accentHover: '#60a5fa',
  accentStrong: '#2563eb',

  // Status
  statusSuccess: '#4ade80',
  statusSuccessStrong: '#22c55e',
  statusWarning: '#facc15',
  statusWarningStrong: '#eab308',
  statusDanger: '#f87171',
  statusDangerStrong: '#ef4444',
  statusInfo: '#60a5fa',
  statusNeutral: '#8b8f9a',

  // Sport
  sportRunning: '#4ade80',
  sportCycling: '#60a5fa',

  // Chart data series
  chartFitness: '#3b82f6',
  chartFatigue: '#ec4899',
  chartForm: '#eab308',
  chartHr: '#ef4444',
  chartPower: '#3b82f6',
  chartSpeed: '#22c55e',
  chartLoad: '#3b82f6',
  chartGrade: '#a78bfa',
  chartCadence: '#f59e0b',
  chartElevation: '#8b5cf6',
  chartPace: '#06b6d4',
  chartGap: '#ec4899',

  // Border radius
  radiusSm: '4px',
  radiusMd: '8px',
  radiusLg: '12px',
  radiusXl: '16px',
} as const;
