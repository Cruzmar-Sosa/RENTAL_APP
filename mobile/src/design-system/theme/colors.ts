export const COLORS = {
  primary: {
    main: '#0F766E', // Teal 700
    light: '#14B8A6', // Teal 500
    dark: '#115E59', // Teal 800
    contrast: '#FFFFFF',
  },
  secondary: {
    main: '#6366F1', // Indigo 500
    light: '#818CF8',
    dark: '#4F46E5',
    contrast: '#FFFFFF',
  },
  status: {
    available: '#10B981', // Emerald 500
    reserved: '#F59E0B', // Amber 500
    inUse: '#3B82F6', // Blue 500
    maintenance: '#EF4444', // Red 500
  },
  neutral: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    disabled: '#94A3B8',
  },
} as const;
