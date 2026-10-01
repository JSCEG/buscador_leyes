/**
 * The buscador's mark: a "B" built from a bar and a document page, with a gold search lens in its
 * counter. Vector redraw of the reference artwork; `cut` is the background color seen through it.
 * `shine` adds a light sweep clipped to the mark (used by the entrance animation).
 */
const BAR = { x: 217, y: 211, width: 175, height: 841 };
const PAGE = 'M462 211 H710 A185 200 0 0 1 790 590 A230 230 0 0 1 745 1052 H683 V830 A140 140 0 0 0 543 690 H462 Z';

export function brandMarkSvg({ cut = '#0d0b0b', color = '#9b2247', lens = '#d0a94e', title = 'Buscador Jurídico', className = '', shine = false } = {}) {
    const sweep = shine ? `
  <defs>
    <clipPath id="bm-clip"><rect x="${BAR.x}" y="${BAR.y}" width="${BAR.width}" height="${BAR.height}" rx="4"/><path d="${PAGE}"/></clipPath>
    <linearGradient id="bm-shine-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#ffe9c2" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#bm-clip)"><rect class="bm-shine" x="0" y="150" width="260" height="1000" fill="url(#bm-shine-grad)" transform="skewX(-18)"/></g>` : '';
    return `<svg class="${className}" viewBox="190 190 810 890" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
  <rect class="bm-bar" x="${BAR.x}" y="${BAR.y}" width="${BAR.width}" height="${BAR.height}" rx="4" fill="${color}"/>
  <path class="bm-page" fill="${color}" d="${PAGE}"/>
  <rect class="bm-line bm-line-1" x="550" y="330" width="242" height="24" rx="12" fill="${cut}"/>
  <rect class="bm-line bm-line-2" x="550" y="398" width="242" height="24" rx="12" fill="${cut}"/>${sweep}
  <g class="bm-lens"><circle class="bm-ripple" cx="528" cy="817" r="56" fill="none" stroke="${lens}" stroke-width="6" opacity="0"/><circle cx="528" cy="817" r="56" fill="${lens}"/><path d="M572 858 L613 895" stroke="${lens}" stroke-width="14" stroke-linecap="round"/></g>
</svg>`;
}
