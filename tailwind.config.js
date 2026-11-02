/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        heru: {
          blue: '#2563EB',
          'blue-dark': '#1D4ED8',
          'blue-deep': '#1E40AF',
          'blue-light': '#EFF6FF',
          'blue-border': '#DBEAFE',
          orange: '#F97316',
          'orange-dark': '#EA580C',
          'orange-light': '#FFF7ED',
          'orange-border': '#FED7AA',
        },
        clinical: {
          sage: '#4A7C6D',
          'sage-dark': '#345D51',
          'sage-light': '#EBF2EE',
          'sage-border': '#CADBD4',
          amber: '#D97706',
          'amber-light': '#FFFBEB',
          'amber-border': '#FDE68A',
        },
        vimedika: {
          green: '#709D89',
          'green-dark': '#598370',
          'green-light': '#EBF3F0',
          orange: '#FBA220',
          'orange-dark': '#E08C12',
          'orange-light': '#FEF5E8',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }
      }
    },
  },
  plugins: [],
}
