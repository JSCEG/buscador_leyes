/**
 * «Compartir la app» and «Instalar la app» in the menu (rail and the phone's «Más»).
 * Sharing copies the install link (buscador-juridico.com/instalar), ready to paste in WhatsApp, and the button says so
 * for a moment; on a phone it also opens the share sheet (WhatsApp, mail…). «Instalar la app» is a plain
 * link to /instalar, hidden once the app runs installed (CSS, display-mode: standalone).
 */
export const SHARE_TEXT = 'Buscador Jurídico: leyes y reglas de energía de México, en un solo lugar. Instálalo en tu celular:';

export function installUrl(origin = location.origin) {
    return `${origin}/instalar`;
}

/**
 * Copies the install link and, on a phone, also opens the share sheet (WhatsApp, mail…). Resolves with what happened:
 * { copied, shared }. Without a clipboard the visitor copies it from a prompt.
 */
export async function shareApp({ nav = navigator, mobile = matchMedia('(pointer: coarse)').matches } = {}) {
    const url = installUrl();
    let copied = false;
    try { await nav.clipboard.writeText(url); copied = true; } catch { /* no clipboard */ }
    if (nav.share && mobile) {
        try { await nav.share({ title: 'Buscador Jurídico', text: SHARE_TEXT, url }); } catch { /* cancelled */ }
        return { copied, shared: true };
    }
    if (!copied) window.prompt('Copia el enlace para instalar la app:', url);
    return { copied, shared: false };
}

export function initAppLinks() {
    document.addEventListener('click', async event => {
        const button = event.target.closest?.('[data-compartir-app]');
        if (!button) return;
        event.preventDefault();
        const label = button.querySelector('span') || button;
        const before = label.textContent;
        const { copied } = await shareApp();
        if (!copied) return;
        label.textContent = 'Enlace copiado ✓';
        setTimeout(() => { label.textContent = before; }, 2200);
    });
}
