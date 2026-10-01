/**
 * "¿Olvidaste tu contraseña?" in the sign-in form, and the new-password dialog shown when the
 * reader comes back from the reset email.
 */
import { requestPasswordReset, updatePassword } from './auth.js';
import { openDialog } from './site-dialogs.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initPasswordRecovery() {
    const form = document.getElementById('auth-form');
    const password = document.getElementById('auth-password');
    if (form && password && !document.getElementById('auth-forgot')) {
        const row = document.createElement('div');
        row.id = 'auth-forgot-row';
        row.innerHTML = '<button type="button" id="auth-forgot" class="auth-forgot">¿Olvidaste tu contraseña?</button><p class="auth-forgot-msg" role="status" aria-live="polite"></p>';
        password.closest('div').after(row);
        const msg = row.querySelector('.auth-forgot-msg');
        row.querySelector('#auth-forgot').addEventListener('click', async () => {
            const email = document.getElementById('auth-email')?.value.trim() || '';
            if (!EMAIL_RE.test(email)) {
                msg.textContent = 'Escribe arriba tu correo y vuelve a dar clic aquí.';
                document.getElementById('auth-email')?.focus();
                return;
            }
            msg.textContent = 'Enviando…';
            try {
                await requestPasswordReset(email);
                msg.textContent = `Si ${email} tiene cuenta, te enviamos un correo para crear una contraseña nueva. Revisa también Spam.`;
            } catch (error) {
                msg.textContent = /rate|seconds/i.test(error.message || '') ? 'Espera un minuto antes de pedir otro correo.' : 'No se pudo enviar el correo. Intenta de nuevo.';
            }
        });
        // Only the sign-in tab needs it.
        const sync = () => { row.hidden = !document.getElementById('auth-name-group')?.classList.contains('hidden'); };
        new MutationObserver(sync).observe(document.getElementById('auth-name-group') || form, { attributes: true, attributeFilter: ['class'] });
        sync();
    }

    window.addEventListener('auth:recovery', () => {
        const { wrap, close } = openDialog(`<header><h2 id="sd-title">Crea tu contraseña nueva</h2><button type="button" class="sd-x" data-sd-close aria-label="Cerrar">×</button></header>
            <form class="sd-body sd-form" novalidate>
                <label class="sd-field">Contraseña nueva<input type="password" name="p1" minlength="8" autocomplete="new-password" required></label>
                <label class="sd-field">Repítela<input type="password" name="p2" minlength="8" autocomplete="new-password" required></label>
                <p class="sd-intro">Usa al menos 8 caracteres.</p>
                <p class="sd-status" role="status" aria-live="polite"></p>
                <div class="sd-actions"><button type="submit" class="sd-primary">Guardar contraseña</button></div>
            </form>`, 'sd-title');
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
                f.innerHTML = '<p class="sd-thanks"><strong>Listo.</strong> Tu contraseña se actualizó y ya tienes la sesión iniciada.</p><div class="sd-actions"><button type="button" class="sd-primary" data-sd-close>Continuar</button></div>';
                history.replaceState(null, '', location.pathname);
                setTimeout(() => { if (wrap.isConnected) close(); }, 4000);
            } catch (error) {
                button.disabled = false;
                status.textContent = /same|different/i.test(error.message || '') ? 'Usa una contraseña distinta a la anterior.' : 'No se pudo guardar. Pide otro correo e intenta de nuevo.';
            }
        });
    });
}
