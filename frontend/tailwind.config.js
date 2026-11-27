/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#070B14',
        glass: '#0F172A',
        radar: {
          cyan: '#06B6D4',
          sky: '#38BDF8',
          emerald: '#10B981',
          amber: '#F59E0B',
          crimson: '#EF4444',
        },
        // Legacy aliases kept so old classes don't break
        paper: '#070B14',
        surface: '#0F172A',
        subtle: '#1E293B',
        hairline: 'rgba(255,255,255,0.08)',
        ink: {
          DEFAULT: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        signal: {
          ok: '#10B981',
          'ok-bg': 'rgba(16,185,129,0.12)',
          warn: '#F59E0B',
          'warn-bg': 'rgba(245,158,11,0.12)',
          alert: '#EF4444',
          'alert-bg': 'rgba(239,68,68,0.12)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        'glass-panel': 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(7,11,20,0.90) 100%)',
        'glass-card': 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.75) 100%)',
        'radar-glow': 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 65%)',
        'fall-glow': 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.18) 0%, transparent 65%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-lg': '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        'cyan-glow': '0 0 20px rgba(6,182,212,0.25)',
        'crimson-glow': '0 0 20px rgba(239,68,68,0.3)',
        'emerald-glow': '0 0 16px rgba(16,185,129,0.2)',
      },
      animation: {
        'signal-dot': 'subtlePulse 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'radar-ping': 'radarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        'alert-glow': 'alertGlow 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'scan-line': 'scanLine 2.5s linear infinite',
      },
      keyframes: {
        subtlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        radarPing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.75' },
          '75%, 100%': { transform: 'scale(2.1)', opacity: '0' },
        },
        alertGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
    },
  },
  plugins: [],
}
