export default {
  darkMode: 'class',
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
          50: '#fff8f0',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#FFE3B3',
          400: '#FBB931',
          500: '#F88F22',
          600: '#EA6113',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        sunset: {
          deep: '#EA6113',
          orange: '#F88F22',
          amber: '#FBB931',
          cream: '#FFE3B3',
          dark: '#000000',
          deepDark: '#000000',
          card: '#080808',
          panel: '#0e0e0e',
          border: '#1f1f1f',
          borderLight: '#2a2a2a',
        },
        neon: {
          green: '#10b981',
          cyan: '#FBB931',
          pink: '#EA6113',
          magenta: '#F88F22',
          amber: '#FBB931',
          purple: '#EA6113',
        },
        cyber: {
          dark: '#000000',
          surface: '#080808',
          panel: '#0e0e0e',
          border: 'rgba(248, 143, 34, 0.2)',
          borderPink: 'rgba(234, 97, 19, 0.3)',
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
