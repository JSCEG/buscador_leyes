/**
 * "Mi cuenta" inside the sign-in modal when a session exists: the reader's details, editable
 * name, and a password change that asks for the current password first.
 */
import { getCurrentUser, onAuthChange, updateDisplayName, updatePassword, verifyCurrentPassword } from './auth.js';

const dateLabel = iso => {
    const d = iso ? new Date(iso) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
};

export function initAccountPanel() {
    const host = document.getElementById('auth-logged-in');
    const email = document.getElementById('auth-user-email');
    if (!host || !email || document.getElementById('account-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'account-panel';
    panel.innerHTML = `
        <div class="bu-seg bu-cuenta-tabs" role="tablist" aria-label="Secciones de la cuenta">
            <button type="button" role="tab" id="ap-tab-datos" aria-controls="ap-pane-datos" aria-selected="true" data-ap-tab="datos">Tus datos</button>
            <button type="button" role="tab" id="ap-tab-seguridad" aria-controls="ap-pane-seguridad" aria-selected="false" tabindex="-1" data-ap-tab="seguridad">Seguridad</button>
        </div>
        <form class="bu-cuenta-form bu-cuenta-pane" id="ap-pane-datos" role="tabpanel" aria-labelledby="ap-tab-datos" data-form="name" novalidate>
            <div class="bu-cuenta-field"><label for="ap-name-input">Nombre</label><div class="bu-campo"><input id="ap-name-input" name="name" maxlength="80" autocomplete="name"></div></div>
            <p class="bu-cuenta-status" role="status" aria-live="polite"></p>
            <div class="bu-cuenta-actions"><button type="submit" class="bu-btn bu-btn-primario bu-btn-sm bu-cuenta-btn">Guardar cambios</button></div>
            <dl class="bu-cuenta-facts">
                <div><dt>Miembro desde</dt><dd data-fact="since"></dd></div>
                <div><dt>Último acceso</dt><dd data-fact="last"></dd></div>
            </dl>
        </form>
        <form class="bu-cuenta-form bu-cuenta-pane" id="ap-pane-seguridad" role="tabpanel" aria-labelledby="ap-tab-seguridad" data-form="password" novalidate hidden>
            <div class="bu-cuenta-field"><label for="ap-current">Contraseña actual</label><div class="bu-campo"><input id="ap-current" type="password" name="current" autocomplete="current-password"></div></div>
            <div class="bu-cuenta-field"><label for="ap-p1">Nueva contraseña</label><div class="bu-campo"><input id="ap-p1" type="password" name="p1" minlength="8" autocomplete="new-password"></div><span class="bu-cuenta-hint">Al menos 8 caracteres, con letras y números.</span></div>
            <div class="bu-cuenta-field"><label for="ap-p2">Confirma la nueva contraseña</label><div class="bu-campo"><input id="ap-p2" type="password" name="p2" minlength="8" autocomplete="new-password"></div></div>
            <p class="bu-cuenta-status" role="status" aria-live="polite"></p>
            <div class="bu-cuenta-actions"><button type="submit" class="bu-btn bu-btn-primario bu-btn-sm bu-cuenta-btn">Cambiar contraseña</button></div>
        </form>`;
    const showTab = name => panel.querySelectorAll('[data-ap-tab]').forEach(tab => {
        const on = tab.dataset.apTab === name;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panel.querySelector(`#${tab.getAttribute('aria-controls')}`).hidden = !on;
    });
    panel.addEventListener('click', event => {
        const tab = event.target.closest('[data-ap-tab]');
        if (tab) showTab(tab.dataset.apTab);
    });
    // Below the shortcuts, above the admin tools and the way out.
    (host.querySelector('.bu-cuenta-accesos') || email).after(panel);

    const nameForm = panel.querySelector('[data-form="name"]');
    const passForm = panel.querySelector('[data-form="password"]');
    const fill = user => {
        if (!user) return;
        if (document.activeElement !== nameForm.elements.name) nameForm.elements.name.value = user.user_metadata?.full_name || user.user_metadata?.name || '';
        panel.querySelector('[data-fact="since"]').textContent = dateLabel(user.created_at);
        panel.querySelector('[data-fact="last"]').textContent = dateLabel(user.last_sign_in_at);
    };
    fill(getCurrentUser());
    onAuthChange(fill);

    nameForm.addEventListener('submit', async event => {
        event.preventDefault();
        const status = nameForm.querySelector('.bu-cuenta-status');
        const value = nameForm.elements.name.value.trim().replace(/\s+/g, ' ');
        if (value.length < 2) { status.textContent = 'Escribe tu nombre.'; nameForm.elements.name.focus(); return; }
        const button = nameForm.querySelector('.bu-cuenta-btn');
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
        const status = passForm.querySelector('.bu-cuenta-status');
        const { current, p1, p2 } = passForm;
        if (!current.value) { status.textContent = 'Escribe tu contraseña actual.'; current.focus(); return; }
        if (p1.value.length < 8) { status.textContent = 'La nueva debe tener al menos 8 caracteres.'; p1.focus(); return; }
        if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p1.value) || !/\d/.test(p1.value)) { status.textContent = 'La nueva debe combinar letras y números.'; p1.focus(); return; }
        if (p1.value !== p2.value) { status.textContent = 'Las contraseñas nuevas no coinciden.'; p2.focus(); return; }
        if (p1.value === current.value) { status.textContent = 'Usa una contraseña distinta a la actual.'; p1.focus(); return; }
        const button = passForm.querySelector('.bu-cuenta-btn');
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
    onAuthChange(user => { if (!user) { passForm.reset(); showTab('datos'); panel.querySelectorAll('.bu-cuenta-status').forEach(s => { s.textContent = ''; }); } });
}

