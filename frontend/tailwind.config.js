/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#64748B',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
        dark: '#0F172A',
      }
    },
  },
  plugins: [],
}