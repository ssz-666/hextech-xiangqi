/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Noto Serif SC', 'Songti SC', 'SimSun', 'serif'],
        sans: ['Noto Serif SC', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        void: '#120f0b',
        hexblue: '#315f5a',
        hexcyan: '#65b8a6',
        hexgold: '#c49a54',
        parchment: '#f4ead2',
        crimson: '#b93f32',
      },
      boxShadow: {
        glow: '0 0 22px rgba(101, 184, 166, 0.28)',
        gold: '0 0 24px rgba(196, 154, 84, 0.34)',
      },
    },
  },
  plugins: [],
}
