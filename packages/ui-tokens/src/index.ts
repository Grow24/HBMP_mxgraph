/**
 * Design tokens for HBMP platform
 * Consumed by both React Flow nodes and mxGraph styles for visual consistency
 */

export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Node type colors
  nodeTypes: {
    processTask: '#0ea5e9',   // Primary blue
    gateway: '#f59e0b',       // Warning amber
    event: '#22c55e',         // Success green
    dataset: '#8b5cf6',       // Purple
    report: '#06b6d4',        // Cyan
    service: '#f97316',       // Orange
    api: '#84cc16',           // Lime
    db: '#6366f1',            // Indigo
    queue: '#ec4899',         // Pink
    widget: '#10b981',        // Emerald
    lane: '#64748b',          // Slate
    flowStart: '#22c55e',
    flowDecision: '#f59e0b',
    flowAction: '#0ea5e9',
    flowProcess: '#8b5cf6',
    flowEnd: '#ef4444',
    flowTable: '#6366f1',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

/**
 * Node size presets for different node types
 */
export const nodeSizes = {
  processTask: { width: 160, height: 56 },
  gateway: { width: 72, height: 72 },
  event: { width: 56, height: 56 },
  dataset: { width: 180, height: 56 },
  report: { width: 200, height: 64 },
  service: { width: 180, height: 56 },
  api: { width: 160, height: 56 },
  db: { width: 180, height: 80 },
  queue: { width: 160, height: 56 },
  widget: { width: 220, height: 120 },
  lane: { width: 1200, height: 200 },
  flowStart: { width: 72, height: 72 },
  flowDecision: { width: 80, height: 80 },
  flowAction: { width: 160, height: 56 },
  flowProcess: { width: 180, height: 56 },
  flowEnd: { width: 72, height: 72 },
  flowTable: { width: 200, height: 120 },
} as const;

/**
 * Animation durations for consistent motion
 */
export const animation = {
  duration: {
    fast: '150ms',
    normal: '300ms', 
    slow: '500ms',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

/**
 * Export all tokens as a single object
 */
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  nodeSizes,
  animation,
} as const;

export default tokens;