/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rwanda-blue': '#0EA5E9',
        'rwanda-green': '#10B981',
        'rwanda-yellow': '#F59E0B',
      }
    },
  },
  plugins: [],
}