/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'Rajdhani', 'system-ui', 'sans-serif'],
        sans: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        void: '#07111f',
        hexblue: '#0397ab',
        hexcyan: '#0ac8b9',
        hexgold: '#c8aa6e',
        parchment: '#f0e6d2',
        crimson: '#d34b54',
      },
      boxShadow: {
        glow: '0 0 24px rgba(10, 200, 185, 0.35)',
        gold: '0 0 22px rgba(200, 170, 110, 0.36)',
      },
    },
  },
  plugins: [],
}
