/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glow: '0 20px 60px rgba(52, 211, 153, 0.25)',
      },
    },
  },
  plugins: [],
};
