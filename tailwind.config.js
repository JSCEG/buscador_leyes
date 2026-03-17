/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        guinda: '#9B2247',
        'guinda-dk': '#7A1A38',
        'guinda-lt': '#C4375E',
        verde: '#1E5B4F',
        'verde-lt': '#2A7A68',
        dorado: '#A57F2C',
        'dorado-lt': '#D4A843',
        bg: '#F6F4F1',
        'bg-card': '#FFFFFF',
        txt: '#1A1A1A',
        'txt-muted': '#6B6B6B',
        border: '#E2DEDD',
      },
      fontFamily: {
        head: ['Merriweather', 'Georgia', 'serif'],
        body: ['Noto Sans', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      }
    },
  },
  safelist: [
    // Clases del resaltado de búsqueda (generadas dinámicamente en JS)
    'bg-yellow-200', 'bg-yellow-300',
    'text-gray-900', 'rounded-sm', 'px-0.5',
    // Dark mode mark
    'bg-yellow-900', 'text-yellow-100',
  ],
  plugins: [],
}
