// 🎨 TRII Design System - Loveable Style
// Premium design tokens and utilities for modern investment platform

export const designSystem = {
  // 🌈 Premium Color Palette - Loveable Inspired
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#f0f7ff',
      100: '#e0efff',
      200: '#bae1ff',
      300: '#7cc8ff',
      400: '#36acff',
      500: '#0c8ce9',  // Main brand color
      600: '#0070c7',
      700: '#0158a1',
      800: '#064c85',
      900: '#0b406e',
      950: '#082945',
    },
    
    // Success & Growth Colors
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',  // Main success
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    
    // Warning & Alert Colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',  // Main warning
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Error & Risk Colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',  // Main error
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Premium Neutrals
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    
    // Special Colors
    gradient: {
      primary: 'linear-gradient(135deg, #0c8ce9 0%, #36acff 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      sunset: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      premium: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
    },
    
    // Semantic Colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      dark: '#0f172a',
    },
    
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      tertiary: '#94a3b8',
      inverse: '#ffffff',
    },
    
    border: {
      light: '#e2e8f0',
      medium: '#cbd5e1',
      dark: '#94a3b8',
    },
  },
  
  // 📐 Spacing System - Golden Ratio Inspired
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
    '5xl': '6rem',    // 96px
    '6xl': '8rem',    // 128px
  },
  
  // 📝 Typography System - Premium Fonts
  typography: {
    fontFamily: {
      sans: [
        'Inter', 
        '-apple-system', 
        'BlinkMacSystemFont', 
        'Segoe UI', 
        'Roboto', 
        'sans-serif'
      ].join(', '),
      mono: [
        'JetBrains Mono', 
        'Monaco', 
        'Cascadia Code', 
        'Fira Code', 
        'monospace'
      ].join(', '),
      display: [
        'Inter', 
        'system-ui', 
        'sans-serif'
      ].join(', '),
    },
    
    fontSize: {
      xs: { size: '0.75rem', lineHeight: '1rem' },      // 12px
      sm: { size: '0.875rem', lineHeight: '1.25rem' },   // 14px
      base: { size: '1rem', lineHeight: '1.5rem' },      // 16px
      lg: { size: '1.125rem', lineHeight: '1.75rem' },   // 18px
      xl: { size: '1.25rem', lineHeight: '1.75rem' },    // 20px
      '2xl': { size: '1.5rem', lineHeight: '2rem' },     // 24px
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' },  // 36px
      '5xl': { size: '3rem', lineHeight: '1' },          // 48px
      '6xl': { size: '3.75rem', lineHeight: '1' },       // 60px
      '7xl': { size: '4.5rem', lineHeight: '1' },        // 72px
    },
    
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  
  // 🎭 Animation & Transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      slower: '500ms',
    },
    
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
    
    keyframes: {
      fadeIn: `
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      `,
      slideUp: `
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      `,
      scaleIn: `
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      `,
      shimmer: `
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      `,
    },
  },
  
  // 🎯 Shadows & Elevation
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    
    // Premium glows
    glow: {
      primary: '0 0 20px rgba(12, 140, 233, 0.3)',
      success: '0 0 20px rgba(16, 185, 129, 0.3)',
      warning: '0 0 20px rgba(245, 158, 11, 0.3)',
      error: '0 0 20px rgba(239, 68, 68, 0.3)',
    },
  },
  
  // 🔘 Border Radius
  borderRadius: {
    none: '0',
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    base: '0.375rem', // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // 📱 Breakpoints
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // 📏 Layout
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
  
  // 🎨 Component Variants
  variants: {
    button: {
      primary: 'primary',
      secondary: 'secondary',
      success: 'success',
      warning: 'warning',
      error: 'error',
      ghost: 'ghost',
      outline: 'outline',
    },
    
    card: {
      elevated: 'elevated',
      outlined: 'outlined',
      filled: 'filled',
      ghost: 'ghost',
    },
  },
} as const;

export type DesignSystem = typeof designSystem;
export type ColorScale = keyof typeof designSystem.colors.primary;
export type SpacingScale = keyof typeof designSystem.spacing;
export type FontSize = keyof typeof designSystem.typography.fontSize;

// Utility functions
export const getColor = (color: string, shade?: ColorScale) => {
  if (shade && designSystem.colors[color as keyof typeof designSystem.colors]) {
    return (designSystem.colors[color as keyof typeof designSystem.colors] as any)[shade];
  }
  return color;
};

export const mediaQuery = (breakpoint: keyof typeof designSystem.breakpoints) => {
  return `@media (min-width: ${designSystem.breakpoints[breakpoint]})`;
};