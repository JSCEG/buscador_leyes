/**
 * The buscador's mark: a "B" built from a bar and a document page, with a gold search lens in its
 * counter. Vector redraw of the reference artwork; `cut` is the background color seen through it.
 */
export function brandMarkSvg({ cut = '#0d0b0b', title = 'Buscador Jurídico', className = '' } = {}) {
    return `<svg class="${className}" viewBox="190 190 810 890" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
  <rect class="bm-bar" x="217" y="211" width="175" height="841" rx="4" fill="#9b2247"/>
  <path class="bm-page" fill="#9b2247" d="M462 211 H710 A185 200 0 0 1 790 590 A230 230 0 0 1 745 1052 H683 V830 A140 140 0 0 0 543 690 H462 Z"/>
  <rect class="bm-line bm-line-1" x="550" y="330" width="242" height="24" rx="12" fill="${cut}"/>
  <rect class="bm-line bm-line-2" x="550" y="398" width="242" height="24" rx="12" fill="${cut}"/>
  <g class="bm-lens"><circle cx="528" cy="817" r="56" fill="#d0a94e"/><path d="M572 858 L613 895" stroke="#d0a94e" stroke-width="14" stroke-linecap="round"/></g>
</svg>`;
}
