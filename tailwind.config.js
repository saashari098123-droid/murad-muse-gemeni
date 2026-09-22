/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 800: '#1e3a8a', 900: '#172c6b' },
        emerald2: '#065f46',
        gold: '#f59e0b'
      },
      fontFamily: {
        bengali: ['"Noto Serif Bengali"', '"Hind Siliguri"', 'Inter', 'sans-serif'],
        arabic: ['Amiri', 'serif']
      }
    }
  },
  plugins: []
};
