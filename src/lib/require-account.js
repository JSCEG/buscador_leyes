/**
 * Downloads (Excel, PowerPoint) are for registered users. `requireAccount` returns true when the
 * reader is signed in; otherwise it explains why and offers to create an account or sign in.
 * The sign-in modal is opened through the `auth:open` event, which ui.js handles.
 */
import { isLoggedIn } from '../scripts/auth.js';
import { openDialog } from '../scripts/site-dialogs.js';

export const LOCK_ICON = '<svg class="ra-lock" aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

export function requireAccount(what = 'descargar') {
    if (isLoggedIn()) return true;
    const { wrap, close } = openDialog(`<header><h2 id="sd-title">Crea tu cuenta para ${what}</h2><button type="button" class="sd-x" data-sd-close aria-label="Cerrar">×</button></header>
        <div class="sd-body">
            <p>Las descargas en Excel y PowerPoint están disponibles para usuarios registrados. Crear tu cuenta es gratis y toma un minuto.</p>
            <p class="sd-intro">Con tu cuenta también conservas tus guardados, notas y mesas de consulta en cualquier equipo.</p>
            <div class="sd-actions"><button type="button" class="sd-secondary" data-ra="login">Ya tengo cuenta</button><button type="button" class="sd-primary" data-ra="register">Crear cuenta</button></div>
        </div>`, 'sd-title');
    wrap.addEventListener('click', event => {
        const tab = event.target.closest('[data-ra]')?.dataset.ra;
        if (!tab) return;
        close();
        window.dispatchEvent(new CustomEvent('auth:open', { detail: { tab } }));
    });
    return false;
}

/** Marks download buttons with a lock while signed out. */
export function lockLabel(label) {
    return isLoggedIn() ? label : `${LOCK_ICON} ${label}`;
}
