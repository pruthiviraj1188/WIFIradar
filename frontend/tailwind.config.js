/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F6F5F1',
        surface: '#FFFFFF',
        subtle: '#EFEDE7',
        hairline: '#E2DFD7',
        ink: {
          DEFAULT: '#181816',
          secondary: '#5C5A54',
          muted: '#85827A',
        },
        signal: {
          ok: '#1E6B47',
          'ok-bg': '#ECF6F0',
          warn: '#9A580A',
          'warn-bg': '#FDF4E7',
          alert: '#B42318',
          'alert-bg': '#FCECEB',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
