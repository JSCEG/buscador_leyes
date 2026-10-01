/**
 * A quiet bar at the top while the device is offline, so a failed search reads as "no connection"
 * rather than "no results". It confirms briefly when the connection comes back.
 */
export function initConnectionBanner() {
    const bar = document.createElement('div');
    bar.id = 'net-banner';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.hidden = true;
    document.body.append(bar);
    let timer;
    const show = (text, kind) => {
        clearTimeout(timer);
        bar.textContent = text;
        bar.dataset.kind = kind;
        bar.hidden = false;
    };
    window.addEventListener('offline', () => show('Sin conexión. Puedes seguir leyendo lo que ya está abierto; las búsquedas se reanudan al volver la red.', 'off'));
    window.addEventListener('online', () => {
        show('Conexión restablecida.', 'on');
        timer = setTimeout(() => { bar.hidden = true; }, 2500);
    });
    if (navigator.onLine === false) window.dispatchEvent(new Event('offline'));
}
