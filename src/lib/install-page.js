/**
 * Install page (buscador-juridico.com/instalar): the link to send by WhatsApp so people install the
 * app. Android/Chrome gets one big button that opens the system "Install?" dialog (browsers only
 * show it after a tap). Opened inside WhatsApp or another app's browser, it hands the page over to
 * Chrome first. iPhone has no install dialog, so it shows the Safari steps. Opened from the
 * installed app, it goes straight to the search engine.
 */
import { brandMarkSvg } from './brand-mark.js';
import '../styles/install-page.css';

/** Whether this page load is the install page (exported for tests). */
export function isInstallPath(pathname = location.pathname) {
    return pathname.replace(/\/+$/, '').toLowerCase() === '/instalar';
}

/** What to offer on this device (exported for tests). */
export function installMode(ua = navigator.userAgent, { standalone = false, maxTouchPoints = 0, platform = '' } = {}) {
    if (standalone) return 'installed';
    const ios = /iphone|ipad|ipod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
    // WhatsApp, Facebook, Instagram, Telegram… open links in their own browser (Android WebView: "; wv)").
    const inApp = /whatsapp|fban|fbav|instagram|line\/|telegram|; wv\)/i.test(ua);
    if (ios) return inApp ? 'ios-inapp' : 'ios';
    if (/android/i.test(ua)) return inApp ? 'android-inapp' : 'android';
    return 'desktop';
}

/** intent:// link that opens this same page in Chrome on Android (exported for tests). */
export function chromeIntent(href = location.href) {
    const url = new URL(href);
    return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${url.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url.href)};end`;
}

// Chrome may fire this before the page is drawn: listen from the moment the module loads.
let deferred = null;
const waiting = [];
if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferred = event;
        waiting.splice(0).forEach(fn => fn());
    });
}

const STEP_SHARE = '<span class="ip-key" aria-hidden="true">⬆</span>';

export function initInstallPage() {
    const standalone = globalThis.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
    const mode = installMode(navigator.userAgent, { standalone, maxTouchPoints: navigator.maxTouchPoints, platform: navigator.platform });
    // Already inside the installed app: nothing to install.
    if (mode === 'installed') { history.replaceState(null, '', '/'); return; }

    const page = document.createElement('section');
    page.className = 'ip-page';
    page.setAttribute('role', 'dialog');
    page.setAttribute('aria-modal', 'true');
    page.setAttribute('aria-labelledby', 'ip-title');
    page.innerHTML = `
        <div class="ip-card">
            <div class="ip-mark">${brandMarkSvg({ className: 'ip-logo' })}</div>
            <h1 id="ip-title">Buscador Jurídico</h1>
            <p class="ip-sub">Leyes, reglamentos y permisos del sector energético, en tu celular.</p>
            <div class="ip-body" data-body></div>
            <button type="button" class="ip-skip" data-skip>Seguir en el navegador</button>
        </div>`;
    document.body.append(page);
    document.body.classList.add('ip-open');
    const body = page.querySelector('[data-body]');

    function leave() {
        history.replaceState(null, '', '/');
        document.body.classList.remove('ip-open');
        page.remove();
    }
    page.querySelector('[data-skip]').addEventListener('click', leave);

    const done = () => {
        body.innerHTML = `<p class="ip-ok">¡Listo! Ya tienes la app.</p>
            <p class="ip-hint">Búscala en tu pantalla de inicio como <b>Buscador Jurídico</b>. Se actualiza sola.</p>`;
        page.querySelector('[data-skip]').textContent = 'Abrir el buscador aquí';
    };
    window.addEventListener('appinstalled', done);

    function showInstallButton() {
        body.innerHTML = `<button type="button" class="ip-install" data-install>Instalar app</button>
            <p class="ip-hint">Gratis · No ocupa casi espacio · Se actualiza sola</p>`;
        body.querySelector('[data-install]').addEventListener('click', async () => {
            const prompt = deferred;
            if (!prompt) return;
            deferred = null;
            try {
                await prompt.prompt();
                const { outcome } = await prompt.userChoice;
                if (outcome === 'accepted') done(); else showInstallButtonLater();
            } catch { showManual(); }
        });
    }
    // After "Cancelar", Chrome hands out a new prompt event a moment later.
    function showInstallButtonLater() {
        body.innerHTML = '<p class="ip-hint">Cuando quieras, toca el botón para instalarla.</p>';
        if (deferred) showInstallButton(); else waiting.push(showInstallButton);
    }

    function showManual() {
        body.innerHTML = `<a class="ip-install" href="${chromeIntent()}">Abrir en Chrome para instalar</a>
            <ol class="ip-steps">
                <li>Si ya estás en Chrome, toca <b>⋮</b> (arriba a la derecha).</li>
                <li>Elige <b>Instalar aplicación</b> o <b>Agregar a la pantalla principal</b>.</li>
            </ol>
            <p class="ip-hint">¿Ya la instalaste? Ábrela desde tus apps como <b>Buscador Jurídico</b>.</p>`;
    }

    if (mode === 'android' || mode === 'desktop') {
        if (deferred) { showInstallButton(); return; }
        body.innerHTML = '<p class="ip-hint">Preparando la instalación…</p>';
        waiting.push(showInstallButton);
        // No dialog from this browser (another browser, a custom tab, or already installed).
        setTimeout(() => {
            if (deferred || !page.isConnected || body.querySelector('[data-install], .ip-ok')) return;
            if (mode === 'desktop') {
                body.innerHTML = '<p class="ip-hint">Abre este enlace en tu celular para instalar la app. En la computadora puedes usarla aquí mismo.</p>';
            } else {
                showManual();
            }
        }, 3500);
        return;
    }
    if (mode === 'android-inapp') {
        // WhatsApp's browser cannot install apps: move to Chrome (the button also does it if blocked).
        body.innerHTML = `<a class="ip-install" href="${chromeIntent()}">Abrir en Chrome para instalar</a>
            <p class="ip-hint">WhatsApp no puede instalar apps. Se abrirá Chrome con el botón para instalarla.</p>`;
        setTimeout(() => { if (page.isConnected) location.href = chromeIntent(); }, 400);
        return;
    }
    if (mode === 'ios-inapp') {
        body.innerHTML = `<ol class="ip-steps">
                <li>Toca <b>⋯</b> o el ícono de brújula y elige <b>Abrir en Safari</b>.</li>
                <li>En Safari toca <b>Compartir</b> ${STEP_SHARE}.</li>
                <li>Elige <b>Agregar a pantalla de inicio</b> y luego <b>Agregar</b>.</li>
            </ol>`;
        return;
    }
    body.innerHTML = `<ol class="ip-steps">
            <li>Toca <b>Compartir</b> ${STEP_SHARE} (abajo, al centro).</li>
            <li>Desliza y elige <b>Agregar a pantalla de inicio</b>.</li>
            <li>Toca <b>Agregar</b>.</li>
        </ol>`;
}
