/**
 * "¿Olvidaste tu contraseña?" in the sign-in form, and the new-password dialog shown when the
 * reader comes back from the reset email.
 */
import { requestPasswordReset, updatePassword, logout } from './auth.js';
import { openDialog } from './site-dialogs.js';
import { supabase } from '../lib/supabase.js';
import { authReturn } from '../lib/auth-return.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// Frequent misspellings of the big mail domains.
const DOMAIN_TYPOS = {
    'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com',
    'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotamil.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.con': 'outlook.com',
    'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com',
    'energia.gob.mz': 'energia.gob.mx', 'energia.gob.m': 'energia.gob.mx',
};
export function suggestDomain(email) {
    const [user, domain = ''] = email.toLowerCase().split('@');
    const fix = DOMAIN_TYPOS[domain];
    return fix ? `${user}@${fix}` : null;
}

const withTimeout =(promise, ms) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
]);

/** Separate "Recupera tu acceso" dialog: email field, send button, and a way back to sign-in. */
function openForgotDialog(prefill = '') {
    document.getElementById('close-auth-modal')?.click();
    const { wrap, close } = openDialog(`<header><h2 id="sd-title">Recupera tu acceso</h2><button type="button" class="sd-x" data-sd-close aria-label="Cerrar">×</button></header>
        <form class="sd-body sd-form" novalidate>
            <p class="sd-intro">Escribe el correo de tu cuenta y te enviamos un enlace para crear una contraseña nueva.</p>
            <label class="sd-field">Correo de tu cuenta<input type="email" name="correo" autocomplete="email" required placeholder="tucorreo@ejemplo.com" value="${escapeHtml(prefill)}"></label>
            <p class="sd-status" role="status" aria-live="polite"></p>
            <div class="sd-actions"><button type="button" class="sd-secondary" data-back>Volver a iniciar sesión</button><button type="submit" class="sd-primary">Enviar enlace</button></div>
        </form>`, 'sd-title');
    const form = wrap.querySelector('form');
    const input = form.correo;
    const status = wrap.querySelector('.sd-status');
    const send = form.querySelector('.sd-primary');
    let checked = '';
    form.querySelector('[data-back]').addEventListener('click', () => {
        close();
        window.dispatchEvent(new CustomEvent('auth:open', { detail: { tab: 'login' } }));
    });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const email = input.value.trim();
        if (!EMAIL_RE.test(email)) { status.textContent = 'Escribe un correo válido.'; input.focus(); return; }
        const fixed = suggestDomain(email);
        if (fixed && checked !== email) {
            checked = email;
            status.innerHTML = `¿Quisiste decir <button type="button" class="auth-forgot-fix">${escapeHtml(fixed)}</button>? Si tu correo está bien, presiona «Enviar enlace» otra vez.`;
            status.querySelector('.auth-forgot-fix').addEventListener('click', () => { input.value = fixed; status.textContent = ''; input.focus(); });
            return;
        }
        status.textContent = 'Enviando…';
        send.disabled = true;
        try {
            await withTimeout(requestPasswordReset(email), 25000);
            form.innerHTML = `<p><strong>Revisa tu correo.</strong> Pedimos el enlace para <strong>${escapeHtml(email)}</strong>. Solo llega si ese correo tiene una cuenta registrada; por seguridad no confirmamos qué correos están registrados.</p>
                <p class="sd-intro">Si no te llega en unos minutos: revisa Spam, confirma que el correo esté bien escrito o crea tu cuenta en «Registrarse». El enlace vence en 1 hora y sirve una sola vez.</p>
                <div class="sd-actions"><button type="button" class="sd-primary" data-sd-close>Entendido</button></div>`;
            form.querySelector('[data-sd-close]').focus();
        } catch (error) {
            const text = error.message || '';
            status.textContent = /rate|seconds/i.test(text) ? 'Espera un minuto antes de pedir otro correo.'
                : /timeout|504|sending/i.test(text) ? 'El servicio de correo no respondió. Intenta más tarde o escríbenos con «Enviar comentario».'
                    : 'No se pudo enviar el correo. Intenta de nuevo.';
            send.disabled = false;
        }
    });
    requestAnimationFrame(() => input.focus());
}

export function initPasswordRecovery() {
    const form = document.getElementById('auth-form');
    const password = document.getElementById('auth-password');
    if (form && password && !document.getElementById('auth-forgot')) {
        const row = document.createElement('div');
        row.id = 'auth-forgot-row';
        row.innerHTML = '<button type="button" id="auth-forgot" class="auth-forgot">¿Olvidaste tu contraseña?</button>';
        password.closest('div').after(row);
        row.querySelector('#auth-forgot').addEventListener('click', () => openForgotDialog(document.getElementById('auth-email')?.value.trim() || ''));
        // Only the sign-in tab needs it.
        const sync = () => { row.hidden = !document.getElementById('auth-name-group')?.classList.contains('hidden'); };
        new MutationObserver(sync).observe(document.getElementById('auth-name-group') || form, { attributes: true, attributeFilter: ['class'] });
        sync();
    }

    let recoveryShown = false;
    const openNewPassword = () => {
        if (recoveryShown) return;
        recoveryShown = true;
        const { wrap, close } = openDialog(`<header><h2 id="sd-title">Crea tu contraseña nueva</h2><button type="button" class="sd-x" data-sd-close aria-label="Cerrar">×</button></header>
            <form class="sd-body sd-form" novalidate>
                <label class="sd-field">Contraseña nueva<input type="password" name="p1" minlength="8" autocomplete="new-password" required></label>
                <label class="sd-field">Repítela<input type="password" name="p2" minlength="8" autocomplete="new-password" required></label>
                <p class="sd-intro">Usa al menos 8 caracteres.</p>
                <p class="sd-status" role="status" aria-live="polite"></p>
                <p class="sd-intro">Si cierras esta ventana sin guardar, cerraremos la sesión por seguridad.</p>
                <div class="sd-actions"><button type="submit" class="sd-primary">Guardar contraseña</button></div>
            </form>`, 'sd-title', {
            // The reset link signs the reader in only to set a new password: leaving without one signs out.
            onClose: async () => {
                if (saved) return;
                recoveryShown = false;
                history.replaceState(null, '', location.pathname);
                try { await logout(); } catch { /* already signed out */ }
                notice('Sesión cerrada', '<p>No se creó una contraseña nueva, así que cerramos la sesión por seguridad.</p><p class="sd-intro">Si la necesitas, pide otro enlace con «Entrar» → «¿Olvidaste tu contraseña?».</p>');
            },
        });
        let saved = false;
        const f = wrap.querySelector('form');
        const status = wrap.querySelector('.sd-status');
        f.addEventListener('submit', async event => {
            event.preventDefault();
            if (f.p1.value.length < 8) { status.textContent = 'La contraseña debe tener al menos 8 caracteres.'; f.p1.focus(); return; }
            if (f.p1.value !== f.p2.value) { status.textContent = 'Las contraseñas no coinciden.'; f.p2.focus(); return; }
            const button = f.querySelector('.sd-primary');
            button.disabled = true; status.textContent = 'Guardando…';
            try {
                await updatePassword(f.p1.value);
                saved = true;
                f.innerHTML = '<p class="sd-thanks"><strong>Listo.</strong> Tu contraseña se actualizó y ya tienes la sesión iniciada.</p><div class="sd-actions"><button type="button" class="sd-primary" data-sd-close>Continuar</button></div>';
                history.replaceState(null, '', location.pathname);
                setTimeout(() => { if (wrap.isConnected) close(); }, 4000);
            } catch (error) {
                button.disabled = false;
                status.textContent = /same|different/i.test(error.message || '') ? 'Usa una contraseña distinta a la anterior.' : 'No se pudo guardar. Pide otro correo e intenta de nuevo.';
            }
        });
    };
    window.addEventListener('auth:recovery', openNewPassword);
    handleEmailReturn(openNewPassword);
}

const notice = (title, body) => openDialog(`<header><h2 id="sd-title">${title}</h2><button type="button" class="sd-x" data-sd-close aria-label="Cerrar">×</button></header>
    <div class="sd-body">${body}<div class="sd-actions"><button type="button" class="sd-primary" data-sd-close>Continuar</button></div></div>`, 'sd-title');

/**
 * Coming back from an auth email. Supabase has usually finished (and emitted its events) before
 * the app subscribes, so act on what the link said once the session is ready.
 */
async function handleEmailReturn(openNewPassword) {
    const { type, error, errorCode } = authReturn;
    if (!type && !error) return;
    const clean = () => history.replaceState(null, '', location.pathname);
    if (error) {
        clean();
        const expired = /expired|invalid|otp/i.test(`${errorCode} ${error}`);
        notice('El enlace ya no es válido', expired
            ? '<p>Este enlace venció o ya se usó. Los enlaces sirven una sola vez y duran una hora.</p><p class="sd-intro">Si querías cambiar tu contraseña, pide otro con «Entrar» → «¿Olvidaste tu contraseña?». Si querías confirmar tu cuenta, intenta entrar con tu correo y contraseña: quizá ya estaba confirmada.</p>'
            : `<p>No pudimos completar la acción del enlace.</p><p class="sd-intro">${error.replace(/[<>&]/g, '')}</p>`);
        return;
    }
    const { data } = await supabase.auth.getSession();
    clean();
    if (!data.session) {
        notice('El enlace ya no es válido', '<p>No pudimos iniciar tu sesión con este enlace. Puede que haya vencido o que ya se haya usado.</p><p class="sd-intro">Pide otro correo e inténtalo de nuevo.</p>');
        return;
    }
    if (type === 'recovery') openNewPassword();
    else if (type === 'signup' || type === 'invite') notice('¡Tu cuenta está confirmada!', '<p>Bienvenido al Buscador Jurídico. Ya tienes la sesión iniciada: tus guardados, notas y mesas de consulta se conservarán en cualquier equipo.</p>');
    else if (type === 'email_change') notice('Correo actualizado', '<p>Tu nuevo correo quedó confirmado.</p>');
}
