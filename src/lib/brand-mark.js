/**
 * The buscador's mark: an S under a sharp owl brow, with one eye. `color` draws the letter and the
 * brow, `lens` the eye. `shine` adds a light sweep clipped to the mark. The class names `bm-bar`,
 * `bm-page`, and `bm-lens` are what the entrance animation plays, so they stay on these parts.
 */
const FRAME = 'translate(190 190) scale(6.53)';
const BROW = 'M6 2 C22 24 50 31 78 29 C94 28 108 18 118 2 C116 24 106 44 90 66 C90 52 82 41 68 40 C42 38 22 26 6 2 Z';
const BODY = 'M58 42 C36 42 18 56 22 72 C26 86 52 87 68 91 C84 95 91 105 88 119 C86 127 81 138 72 150 L32 124 C22 116 12 114 2 122 L72 162 C92 150 106 128 105 106 C104 88 86 80 68 75 C52 71 36 68 36 58 C36 50 46 44 58 42 Z';
const EYE = 'M56 49 C60 60 70 64 84 59 C74 72 54 68 56 49 Z';

export function brandMarkSvg({ color = '#9b2247', lens = '#c9a24c', title = 'Buscador Jurídico', className = '', shine = false } = {}) {
    const sweep = shine ? `
  <defs>
    <clipPath id="bm-clip"><path transform="${FRAME}" d="${BROW}"/><path transform="${FRAME}" d="${BODY}"/></clipPath>
    <linearGradient id="bm-shine-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#ffe9c2" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#bm-clip)"><rect class="bm-shine" x="0" y="150" width="260" height="1200" fill="url(#bm-shine-grad)" transform="skewX(-18)"/></g>` : '';
    return `<svg class="${className}" viewBox="190 190 810 1084" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
  <g transform="${FRAME}">
    <path class="bm-body bm-bar" d="${BODY}" fill="${color}"/>
    <path class="bm-brow bm-page" d="${BROW}" fill="${color}"/>
    <g class="bm-lens"><path class="bm-eye" d="${EYE}" fill="${lens}"/><circle class="bm-ripple" cx="68" cy="60" r="12" fill="none" stroke="${lens}" stroke-width="1" opacity="0"/></g>
  </g>${sweep}
</svg>`;
}
