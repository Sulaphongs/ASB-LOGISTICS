/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Lao"', 'Inter', 'system-ui', 'sans-serif'],
      },
      // System primary color, overriding Tailwind's default teal-* scale so every
      // existing `teal-*` utility across the app (buttons, active nav, badges,
      // focus rings, etc.) renders in the new brand blue without per-file edits.
      // teal-700 == #013DAC (was #0F766E).
      colors: {
        teal: {
          50: '#f0f5fe',
          100: '#dde8fd',
          200: '#b6cefb',
          300: '#80abfa',
          400: '#397cf9',
          500: '#0556eb',
          600: '#0245c0',
          700: '#013dac',
          800: '#033187',
          900: '#062765',
          950: '#07193c',
        },
      },
    },
  },
  plugins: [],
};
