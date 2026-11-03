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
        // Vi-Pharma brand palette — extracted from the APOTEK Sistem Informasi logo
        vip: {
          navy:        '#00287E',   // deep navy blue (main circle & palang)
          'navy-dark': '#001A52',   // darker navy for hover
          'navy-mid':  '#0038A8',   // mid navy
          'navy-light':'#E8EEF9',   // very light navy tint (card bg)
          'navy-border':'#C0CFEE',  // navy border
          orange:      '#F76100',   // vibrant orange (flame & capsule)
          'orange-dark':'#C44E00',  // darker orange for hover
          'orange-mid': '#FF8C38',  // lighter orange
          'orange-light':'#FFF3E8', // tint for bg
          'orange-border':'#FFD0AA',// border
        },
        // Vi-Token dark palette — exact match with vi-token mobile app
        token: {
          bg:          '#090D16',   // deep obsidian dark background
          card:        '#1E293B',   // card & container surface
          inner:       '#0F172A',   // inner badge & input bg
          border:      '#334155',   // subtle slate border
          emerald:     '#10B981',   // primary brand green (CTA & active states)
          'emerald-dark':'#059669', // hover state
          'emerald-light':'#A7F3D0',// subtle highlight text
        },
        // Kept for clinical badge reuse
        clinical: {
          sage: '#4A7C6D',
          'sage-dark': '#345D51',
          'sage-light': '#EBF2EE',
          'sage-border': '#CADBD4',
          amber: '#D97706',
          'amber-light': '#FFFBEB',
          'amber-border': '#FDE68A',
        },
      }
    },
  },
  plugins: [],
}
