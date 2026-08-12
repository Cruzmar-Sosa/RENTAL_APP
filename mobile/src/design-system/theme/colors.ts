export const COLORS = {
  primary: {
    main: '#0F766E', // Teal 700
    light: '#14B8A6', // Teal 500
    dark: '#115E59', // Teal 800
    contrast: '#FFFFFF',
    glow: 'rgba(15, 118, 110, 0.25)',
  },
  secondary: {
    main: '#6366F1', // Indigo 500
    light: '#818CF8',
    dark: '#4F46E5',
    contrast: '#FFFFFF',
    glow: 'rgba(99, 102, 241, 0.25)',
  },
  status: {
    available: '#10B981', // Emerald 500
    reserved: '#F59E0B', // Amber 500
    inUse: '#3B82F6', // Blue 500
    maintenance: '#EF4444', // Red 500
    offline: '#64748B',
  },
  neutral: {
    background: '#0F172A', // Slate 900 Premium Dark Mode
    backgroundLight: '#F8FAFC',
    surface: '#1E293B', // Slate 800 Surface
    surfaceLight: '#FFFFFF',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    borderLight: '#E2E8F0',
    disabled: '#475569',
  },
  glass: {
    surface: 'rgba(30, 41, 59, 0.75)',
    border: 'rgba(255, 255, 255, 0.12)',
    glow: 'rgba(20, 184, 166, 0.15)',
  },
} as const;
