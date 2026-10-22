/**
 * «Cargando…» while a map layer turns on or off. Heavy layers take a few seconds to arrive and draw;
 * without a sign people click the box again and again. While the work runs, the layer's checkbox is
 * locked and shows a small spinner, and a notice sits on top of the map. One notice per map, shared by
 * every module that draws on it.
 */
const notices = new WeakMap();

function noticeFor(map) {
    let notice = notices.get(map);
    if (notice) return notice;
    const el = document.createElement('div');
    el.className = 'pmm-busy';
    el.setAttribute('role', 'status');
    el.hidden = true;
    el.innerHTML = '<span class="pmm-spinner" aria-hidden="true"></span><span data-busy-text></span>';
    map.getContainer().append(el);
    notice = { el, pending: 0 };
    notices.set(map, notice);
    return notice;
}

// Two frames: the spinner paints before synchronous drawing (thousands of markers) blocks the page.
const nextPaint = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/**
 * Runs `work` with the busy state on. `input` is the checkbox that started it (optional).
 * @param {import('leaflet').Map} map
 * @param {HTMLInputElement|null} input
 * @param {string} text
 * @param {() => unknown} work
 */
export async function withMapBusy(map, input, text, work) {
    const notice = noticeFor(map);
    const row = input?.closest('.pmm-layer');
    notice.pending += 1;
    notice.el.querySelector('[data-busy-text]').textContent = text;
    notice.el.hidden = false;
    if (input) { input.disabled = true; input.setAttribute('aria-busy', 'true'); }
    row?.classList.add('is-loading');
    try {
        await nextPaint();
        return await work();
    } finally {
        notice.pending -= 1;
        if (!notice.pending) notice.el.hidden = true;
        if (input) { input.disabled = false; input.removeAttribute('aria-busy'); }
        row?.classList.remove('is-loading');
    }
}
