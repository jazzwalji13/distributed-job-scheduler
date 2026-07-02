/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}', './App.jsx'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07111d',
          900: '#0c1726',
          800: '#122238',
          700: '#1d3554'
        },
        ember: {
          50: '#fff7ed',
          200: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c'
        },
        aqua: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(103,232,249,0.12), 0 20px 60px rgba(6,182,212,0.12)'
      }
    }
  },
  plugins: []
};
