/**
 * "Install as an app" invitation for phones and tablets. It appears from the second visit, after a
 * while on the page, never while the app already runs installed, and "Ahora no" hides it for 30 days.
 * Android/Chrome gets the browser's own install dialog; iPhone/iPad (no such dialog in Safari) gets
 * the two steps to add it from the share menu.
 */
import { brandMarkSvg } from './brand-mark.js';
import '../styles/install-prompt.css';

const VISITS_KEY = 'app-visitas';
const SNOOZE_KEY = 'instalar-pospuesto';
const SNOOZE_DAYS = 30;
const DELAY = 25000;

const store = {
    get: key => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

const standalone = () => globalThis.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
const touchDevice = () => globalThis.matchMedia?.('(pointer: coarse)').matches;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const snoozed = () => Date.now() - Number(store.get(SNOOZE_KEY) || 0) < SNOOZE_DAYS * 864e5;

/** Whether this visit may show the invitation (exported for tests). */
export function shouldInvite({ visits, isStandalone, isTouch, isSnoozed }) {
    return !isStandalone && isTouch && !isSnoozed && visits >= 2;
}

export function initInstallPrompt() {
    if (standalone()) return;
    const visits = Number(store.get(VISITS_KEY) || 0) + 1;
    store.set(VISITS_KEY, String(visits));
    if (!shouldInvite({ visits, isStandalone: false, isTouch: touchDevice(), isSnoozed: snoozed() })) return;

    let deferred = null;
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferred = event; });
    window.addEventListener('appinstalled', () => { store.set(SNOOZE_KEY, String(Date.now() + 3650 * 864e5)); close(); });

    let sheet = null;
    function close() {
        if (!sheet) return;
        sheet.classList.remove('is-open');
        const node = sheet;
        sheet = null;
        setTimeout(() => node.remove(), 300);
    }

    function open() {
        // Only when there is a way to install: Chrome's dialog, or the steps on iPhone/iPad.
        if (!deferred && !isIos()) return;
        // Not over a dialog, the reader or the menu.
        if (document.querySelector('#site-dialog, #detail-modal:not(.hidden), #welcome-tour, #mobile-menu-drawer:not(.translate-x-full)')) { setTimeout(open, 15000); return; }
        sheet = document.createElement('aside');
        sheet.className = 'install-sheet';
        sheet.setAttribute('role', 'dialog');
        sheet.setAttribute('aria-labelledby', 'install-title');
        sheet.innerHTML = `
            <div class="install-mark">${brandMarkSvg({ className: 'install-logo' })}</div>
            <div class="install-text">
                <p id="install-title" class="install-title">Lleva el Buscador Jurídico en tu celular</p>
                <p class="install-body">${deferred ? 'Instálalo como app: se abre desde tu pantalla de inicio, a pantalla completa.' : 'Toca <b>Compartir</b> <span class="install-share" aria-hidden="true">⬆</span> y luego <b>Agregar a inicio</b>.'}</p>
            </div>
            <div class="install-actions">
                ${deferred ? '<button type="button" class="install-yes">Instalar</button>' : ''}
                <button type="button" class="install-no">Ahora no</button>
            </div>`;
        document.body.append(sheet);
        requestAnimationFrame(() => sheet?.classList.add('is-open'));
        sheet.querySelector('.install-no').addEventListener('click', () => { store.set(SNOOZE_KEY, String(Date.now())); close(); });
        sheet.querySelector('.install-yes')?.addEventListener('click', async () => {
            const prompt = deferred;
            deferred = null;
            close();
            try {
                await prompt.prompt();
                const { outcome } = await prompt.userChoice;
                if (outcome !== 'accepted') store.set(SNOOZE_KEY, String(Date.now()));
            } catch { /* the browser declined to show it */ }
        });
    }

    setTimeout(open, DELAY);
}
