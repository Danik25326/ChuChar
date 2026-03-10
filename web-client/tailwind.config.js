/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00c3ff',
          dark: '#0a0f1e',
          card: '#141b2b',
          hover: '#1e2a3a',
          border: '#1e2a3a',
          text: {
            primary: '#e0e0e0',
            secondary: '#a0b0c0',
          }
        }
      }
    },
  },
  plugins: [],
}
