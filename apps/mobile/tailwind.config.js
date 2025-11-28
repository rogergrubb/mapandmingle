/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: '#FFF0F5',
          100: '#FFE4ED',
          200: '#FFCCE0',
          300: '#FFA3C7',
          400: '#FF6B9D',
          500: '#FF4081',
          600: '#E91E63',
          700: '#C2185B',
          800: '#9C0F48',
          900: '#7C0A3A',
        },
        coral: {
          400: '#FFA07A',
          500: '#FF8A65',
        },
        purple: {
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['SF Pro Display', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
