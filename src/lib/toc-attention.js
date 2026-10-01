/**
 * The floating "Índice" button pulses until the reader opens it once (remembered per browser),
 * so first-time visitors notice it without it nagging regular users.
 */
const KEY = 'indice-usado';

export function initTocAttention() {
    const used = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
    if (used()) document.documentElement.classList.add('toc-used');
    document.addEventListener('click', event => {
        if (!event.target.closest?.('#toc-toggle-btn')) return;
        try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
        document.documentElement.classList.add('toc-used');
    }, true);
}
