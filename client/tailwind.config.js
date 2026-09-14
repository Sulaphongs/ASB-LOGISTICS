/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Lao"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
