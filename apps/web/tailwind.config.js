/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
        },
        cr: { blue: '#002b7f', red: '#ce1126' },
      },
    },
  },
  plugins: [],
};
