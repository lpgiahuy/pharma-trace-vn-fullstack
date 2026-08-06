/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc9fb',
          400: '#38aaf7',
          500: '#004996', // Pharmacity Blue
          600: '#004084',
          700: '#003772',
          800: '#002e5f',
          900: '#001e3e',
        },
        medical: {
          blue: '#004996',
          teal: '#00b4a6',
          green: '#00A551', // Pharmacity Green
          red:   '#ed1c24', // Pharma Red
          orange:'#f7941d',
        },
        surface: {
          DEFAULT: '#f2f4f7', // Light grey bg
          card:    '#ffffff',
          border:  '#e5e7eb',
        },
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Be Vietnam Pro', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / .08), 0 1px 2px -1px rgb(0 0 0 / .06)',
        elevated: '0 4px 16px 0 rgb(11 125 232 / .12)',
        modal: '0 20px 60px -10px rgb(0 0 0 / .22)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn .25s ease-out',
        'slide-up': 'slideUp .3s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: .6 } },
      },
    },
  },
  plugins: [],
  corePlugins: { preflight: true },
}
