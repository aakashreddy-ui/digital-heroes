/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hero: {
          bg: '#090D14',
          surface: '#111827',
          card: 'rgba(23, 32, 51, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          emerald: {
            DEFAULT: '#10B981',
            glow: '#059669',
            light: '#34D399',
            dark: '#064E3B',
          },
          gold: {
            DEFAULT: '#F59E0B',
            glow: '#D97706',
            light: '#FCD34D',
          },
          charity: {
            DEFAULT: '#3B82F6',
            accent: '#8B5CF6',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
