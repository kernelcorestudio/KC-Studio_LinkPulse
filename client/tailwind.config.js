export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        retro: ['"JetBrains Mono"', 'ui-monospace', 'monospace'], // Graceful fallback
      },
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#F88F22',
          600: '#EA6113',
          700: '#c4500e',
        },
        neon: {
          green: '#10b981',
          cyan: '#38bdf8',
          pink: '#f43f5e',
          magenta: '#d946ef',
          amber: '#FBB931',
          purple: '#8b5cf6',
        },
        cyber: {
          dark: '#100800',
          surface: '#130900',
          panel: '#1c1004',
          border: 'rgba(251, 185, 49, 0.08)',
          borderPink: 'rgba(234, 97, 19, 0.25)',
        },
        // Sunset dark palette
        slate: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#27272a',
          800: '#18181b',
          900: '#130900',
          950: '#100800',
        },
      },
    },
  },
  plugins: [],
};
