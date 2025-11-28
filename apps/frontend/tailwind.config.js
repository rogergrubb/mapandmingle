/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF1F5',
          100: '#FFE4EC',
          200: '#FFCBDB',
          300: '#FFA8C5',
          400: '#FF6B9D',
          500: '#FF4785',
          600: '#E91E63',
          700: '#C2185B',
          800: '#AD1457',
          900: '#880E4F',
        },
      },
    },
  },
  plugins: [],
}
