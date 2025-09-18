/******** Tailwind Config ********/
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0e7490',
          600: '#0e7490',
          700: '#0c6177'
        },
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626'
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        noto: ['Noto Sans Malayalam', 'sans-serif']
      }
    }
  },
  plugins: []
}