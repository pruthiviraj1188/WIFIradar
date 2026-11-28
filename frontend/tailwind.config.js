/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brighter base — deep navy instead of near-black
        obsidian: '#0F1A2E',
        glass: '#1A2744',
        radar: {
          cyan:    '#06B6D4',
          sky:     '#38BDF8',
          emerald: '#10B981',
          amber:   '#F59E0B',
          crimson: '#EF4444',
        },
        // Legacy aliases — updated to lighter values
        paper:   '#0F1A2E',
        surface: '#1A2744',
        subtle:  '#243352',
        hairline: 'rgba(255,255,255,0.14)',
        ink: {
          DEFAULT:   '#F1F5F9',
          secondary: '#CBD5E1',
          muted:     '#94A3B8',
        },
        signal: {
          ok:        '#34D399',
          'ok-bg':   'rgba(52,211,153,0.15)',
          warn:      '#FBBF24',
          'warn-bg': 'rgba(251,191,36,0.15)',
          alert:     '#F87171',
          'alert-bg':'rgba(248,113,113,0.15)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        'glass-panel': 'linear-gradient(135deg, rgba(26,39,68,0.90) 0%, rgba(15,26,46,0.95) 100%)',
        'glass-card':  'linear-gradient(135deg, rgba(36,51,82,0.75) 0%, rgba(26,39,68,0.85) 100%)',
        'radar-glow':  'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.18) 0%, transparent 65%)',
        'fall-glow':   'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.20) 0%, transparent 65%)',
      },
      boxShadow: {
        'glass':        '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-lg':     '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)',
        'cyan-glow':    '0 0 24px rgba(6,182,212,0.30)',
        'crimson-glow': '0 0 24px rgba(239,68,68,0.35)',
        'emerald-glow': '0 0 20px rgba(16,185,129,0.25)',
      },
      animation: {
        'signal-dot': 'subtlePulse 2s ease-in-out infinite',
        'fade-up':    'fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'radar-ping': 'radarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        'alert-glow': 'alertGlow 1.5s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'scan-line':  'scanLine 2.5s linear infinite',
      },
      keyframes: {
        subtlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        radarPing: {
          '0%':        { transform: 'scale(0.95)', opacity: '0.75' },
          '75%, 100%': { transform: 'scale(2.1)',  opacity: '0' },
        },
        alertGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.40)' },
          '50%':      { boxShadow: '0 0 0 10px rgba(239,68,68,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
    },
  },
  plugins: [],
}
