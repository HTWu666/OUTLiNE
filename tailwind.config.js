/** @type {import('tailwindcss').Config} */
export default {
  content: ['./views/**/*.{ejs, html, js}'],
  theme: {
    extend: {}
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.animate-slide-up': {
          animation: 'slide-up 0.5s ease-in-out forwards'
        }
      })
    }
  ]
}
