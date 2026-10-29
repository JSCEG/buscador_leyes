// Tailwind's own palettes point at the design-system tokens, so the markup's text-gray-500, bg-gray-50,
// border-gray-200, amber, red, green, blue and yellow follow the four themes without dark-mode overrides.
// Opacity modifiers (bg-gray-50/80) mix the token with transparent, as the preset does.
const withOpacity = value => ({ opacityValue }) =>
  opacityValue === undefined || opacityValue === '1'
    ? value
    : `color-mix(in srgb, ${value} calc(${opacityValue} * 100%), transparent)`;
const scale = map => Object.fromEntries(Object.entries(map).map(([shade, value]) => [shade, withOpacity(value)]));
const faint = 'color-mix(in srgb, var(--ink-muted) 45%, var(--surface-1))';
const palettes = {
  gray: scale({ 50: 'var(--surface-2)', 100: 'var(--surface-sunken)', 200: 'var(--hairline)', 300: faint, 400: 'var(--ink-muted)', 500: 'var(--ink-muted)', 600: 'var(--ink-2)', 700: 'var(--ink-2)', 800: 'var(--ink)', 900: 'var(--ink)', 950: 'var(--ink)' }),
  amber: scale({ 50: 'var(--warning-soft)', 100: 'var(--warning-soft)', 200: 'color-mix(in srgb, var(--accent) 35%, var(--surface-1))', 300: 'var(--gold)', 400: 'var(--gold)', 500: 'var(--accent)', 600: 'var(--accent)', 700: 'var(--accent-ink)', 800: 'var(--accent-ink)', 900: 'var(--accent-ink)' }),
  red: scale({ 50: 'var(--danger-soft)', 100: 'var(--danger-soft)', 200: 'color-mix(in srgb, var(--danger) 30%, var(--surface-1))', 400: 'var(--danger)', 500: 'var(--danger)', 600: 'var(--danger)', 700: 'var(--danger)' }),
  green: scale({ 50: 'var(--success-soft)', 100: 'var(--success-soft)', 200: 'color-mix(in srgb, var(--success) 30%, var(--surface-1))', 400: 'var(--success)', 500: 'var(--success)', 600: 'var(--success)', 700: 'var(--success)' }),
  blue: scale({ 50: 'var(--info-soft)', 100: 'var(--info-soft)', 200: 'color-mix(in srgb, var(--info) 30%, var(--surface-1))', 400: 'var(--info)', 500: 'var(--info)', 600: 'var(--info)', 700: 'var(--info)' }),
  yellow: scale({ 100: 'var(--ink)', 200: 'var(--highlight)', 300: 'var(--highlight)', 900: 'var(--highlight)' }),
};
palettes.emerald = palettes.green;
palettes.slate = palettes.gray;

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
      colors: palettes,
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
    // Dark mode mark (yellow follows the highlight token in every theme)
    'bg-yellow-900', 'text-yellow-100',
  ],
  plugins: [],
}
