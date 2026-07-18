/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1cb0f6',
          dark: '#1899d6',
        },
        success: '#58cc02',
        error: '#ff4b4b',
        warning: '#ffc800',
      },
    },
  },
  plugins: [],
}
