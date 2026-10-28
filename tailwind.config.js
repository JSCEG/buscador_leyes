/** @type {import('tailwindcss').Config} */
module.exports = {
  // Colores, fuentes, radios y sombras vienen del sistema de diseño (variables CSS).
  presets: [require('./src/design/tailwind.preset.js')],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
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
