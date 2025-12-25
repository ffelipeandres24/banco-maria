/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primario: '#00D1FF',
        fondo: '#0F172A',
      },
    },
  },
  plugins: [],
}