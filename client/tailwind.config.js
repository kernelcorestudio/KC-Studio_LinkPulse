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
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        neon: {
          green: '#10b981',
          cyan: '#38bdf8',
          pink: '#f43f5e',
          magenta: '#d946ef',
          amber: '#f59e0b',
          purple: '#8b5cf6',
        },
        cyber: {
          dark: '#09090b',
          surface: '#0f0f12',
          panel: '#141418',
          border: 'rgba(255, 255, 255, 0.08)',
          borderPink: 'rgba(244, 63, 94, 0.25)',
        },
        // Sleek Linear / Vercel dark mode palette for slate
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
          900: '#0f0f12',
          950: '#09090b',
        },
      },
    },
  },
  plugins: [],
};
