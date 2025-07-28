module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0F172A',
        'dark-gray': '#1E293B',
        'light-text': '#F8FAFC'
      }
    }
  },
  plugins: [],
}
