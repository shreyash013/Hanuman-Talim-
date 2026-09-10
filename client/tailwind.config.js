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
        ganpati: {
          saffron: '#e65100', // Bhagwa primary
          'saffron-light': '#ff7d47',
          'saffron-dark': '#b23c00',
          maroon: '#881337', // Deep vermillion/kunku
          'maroon-dark': '#4c0519',
          gold: '#d97706',
          'gold-light': '#fef3c7',
          amber: '#f59e0b',
          cream: '#fffbeb',
          dark: '#0f172a',
          card: '#1e293b',
        }
      },
      fontFamily: {
        marathi: ['"Tiro Devanagari Marathi"', '"Noto Sans Devanagari"', 'serif'],
        sans: ['"Tiro Devanagari Marathi"', 'Inter', '"Noto Sans Devanagari"', 'sans-serif'],
      },
      boxShadow: {
        'festive': '0 10px 25px -5px rgba(230, 81, 0, 0.15), 0 8px 10px -6px rgba(230, 81, 0, 0.1)',
        'festive-lg': '0 20px 30px -10px rgba(230, 81, 0, 0.25)',
        'gold-glow': '0 0 15px rgba(245, 158, 11, 0.35)',
      }
    },
  },
  plugins: [],
}
