/**
 * "Mi cuenta" inside the sign-in modal when a session exists: the reader's details, editable
 * name, and a password change that asks for the current password first.
 */
import { getCurrentUser, onAuthChange, updateDisplayName, updatePassword, verifyCurrentPassword } from './auth.js';

const dateLabel = iso => {
    const d = iso ? new Date(iso) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
};

export function initAccountPanel() {
    const host = document.getElementById('auth-logged-in');
    const email = document.getElementById('auth-user-email');
    if (!host || !email || document.getElementById('account-panel')) return;
    host.classList.add('account-host');
    const caption = host.querySelector('p.text-sm.text-gray-500.mb-1');
    if (caption) caption.textContent = 'Mi cuenta';

    const panel = document.createElement('div');
    panel.id = 'account-panel';
    panel.innerHTML = `
        <details class="ap-section" open>
            <summary>Tus datos</summary>
            <form class="ap-form" data-form="name" novalidate>
                <label class="ap-field">Nombre<input name="name" maxlength="80" autocomplete="name"></label>
                <dl class="ap-facts">
                    <div><dt>Correo</dt><dd data-fact="email"></dd></div>
                    <div><dt>Miembro desde</dt><dd data-fact="since"></dd></div>
                    <div><dt>Último acceso</dt><dd data-fact="last"></dd></div>
                </dl>
                <p class="ap-status" role="status" aria-live="polite"></p>
                <button type="submit" class="ap-btn">Guardar nombre</button>
            </form>
        </details>
        <details class="ap-section">
            <summary>Cambiar contraseña</summary>
            <form class="ap-form" data-form="password" novalidate>
                <label class="ap-field">Contraseña actual<input type="password" name="current" autocomplete="current-password"></label>
                <label class="ap-field">Contraseña nueva<input type="password" name="p1" minlength="8" autocomplete="new-password"></label>
                <label class="ap-field">Repite la nueva<input type="password" name="p2" minlength="8" autocomplete="new-password"></label>
                <p class="ap-status" role="status" aria-live="polite"></p>
                <button type="submit" class="ap-btn">Cambiar contraseña</button>
            </form>
        </details>`;
    email.after(panel);

    const nameForm = panel.querySelector('[data-form="name"]');
    const passForm = panel.querySelector('[data-form="password"]');
    const fill = user => {
        if (!user) return;
        if (document.activeElement !== nameForm.name) nameForm.name.value = user.user_metadata?.full_name || user.user_metadata?.name || '';
        panel.querySelector('[data-fact="email"]').textContent = user.email || '—';
        panel.querySelector('[data-fact="since"]').textContent = dateLabel(user.created_at);
        panel.querySelector('[data-fact="last"]').textContent = dateLabel(user.last_sign_in_at);
    };
    fill(getCurrentUser());
    onAuthChange(fill);

    nameForm.addEventListener('submit', async event => {
        event.preventDefault();
        const status = nameForm.querySelector('.ap-status');
        const value = nameForm.name.value.trim().replace(/\s+/g, ' ');
        if (value.length < 2) { status.textContent = 'Escribe tu nombre.'; nameForm.name.focus(); return; }
        const button = nameForm.querySelector('.ap-btn');
        button.disabled = true; status.textContent = 'Guardando…';
        try {
            await updateDisplayName(value);
            status.textContent = 'Nombre actualizado.';
        } catch {
            status.textContent = 'No se pudo guardar. Intenta de nuevo.';
        } finally { button.disabled = false; }
    });

    passForm.addEventListener('submit', async event => {
        event.preventDefault();
        const status = passForm.querySelector('.ap-status');
        const { current, p1, p2 } = passForm;
        if (!current.value) { status.textContent = 'Escribe tu contraseña actual.'; current.focus(); return; }
        if (p1.value.length < 8) { status.textContent = 'La nueva debe tener al menos 8 caracteres.'; p1.focus(); return; }
        if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p1.value) || !/\d/.test(p1.value)) { status.textContent = 'La nueva debe combinar letras y números.'; p1.focus(); return; }
        if (p1.value !== p2.value) { status.textContent = 'Las contraseñas nuevas no coinciden.'; p2.focus(); return; }
        if (p1.value === current.value) { status.textContent = 'Usa una contraseña distinta a la actual.'; p1.focus(); return; }
        const button = passForm.querySelector('.ap-btn');
        button.disabled = true; status.textContent = 'Verificando…';
        try {
            await verifyCurrentPassword(current.value);
        } catch {
            status.textContent = 'La contraseña actual no es correcta.';
            button.disabled = false; current.select(); return;
        }
        status.textContent = 'Guardando…';
        try {
            await updatePassword(p1.value);
            passForm.reset();
            status.innerHTML = '<strong>Listo.</strong> Tu contraseña se cambió.';
        } catch (error) {
            status.textContent = /same|different/i.test(error.message || '') ? 'Usa una contraseña distinta a la actual.' : 'No se pudo cambiar. Intenta de nuevo.';
        } finally { button.disabled = false; }
    });
    // Stray text never leaks into the panel from a previous session.
    onAuthChange(user => { if (!user) { passForm.reset(); panel.querySelectorAll('.ap-status').forEach(s => { s.textContent = ''; }); } });
}

