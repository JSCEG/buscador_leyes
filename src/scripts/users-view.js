/**
 * Registered users panel (#usuarios), for the site owner only.
 *
 * The list comes from public.site_list_users(), a SECURITY DEFINER function that refuses anyone who
 * is not in public.site_owners: hiding the link in the menu is a convenience, the database is the lock.
 */
import { supabase } from '../lib/supabase.js';
import '../styles/users.css';

const DAY = 86400000;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fold = v => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** "hace 3 días", "hoy", "nunca"… relative to `now`. */
export function relativeTime(value, now = Date.now()) {
    if (!value) return 'Nunca';
    const t = new Date(value).getTime();
    if (Number.isNaN(t)) return 'Nunca';
    const diff = Math.max(0, now - t);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(diff / DAY);
    if (days === 1) return 'Ayer';
    if (days < 30) return `Hace ${days} días`;
    const months = Math.floor(days / 30.44);
    if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    const years = Math.floor(days / 365.25);
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

/** Totals for the tiles: registered, confirmed, active in 7 and 30 days (by last activity). */
export function summarizeUsers(rows, now = Date.now()) {
    const activeWithin = days => rows.filter(r => r.ultima_actividad && now - new Date(r.ultima_actividad).getTime() <= days * DAY).length;
    return {
        total: rows.length,
        confirmados: rows.filter(r => r.confirmado).length,
        activos7: activeWithin(7),
        activos30: activeWithin(30),
    };
}

const fullDate = value => (value ? new Date(value).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin registro');
const shortDate = value => (value ? new Date(value).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/**
 * @param {HTMLElement} container
 * @returns {{ destroy: () => void }}
 */
export function renderUsersView(container) {
    let alive = true;
    let rows = [];
    container.innerHTML = `
        <section class="us-view" aria-labelledby="us-title">
            <header class="us-head">
                <p class="us-kicker">Solo visible para tu cuenta</p>
                <h1 id="us-title">Usuarios registrados</h1>
                <p class="us-intro">Quién tiene cuenta en el buscador y cuándo fue la última vez que entró.</p>
            </header>
            <div class="us-tiles" data-tiles></div>
            <div class="us-tools">
                <label class="us-search"><span class="us-sr">Buscar usuario</span>
                    <input type="search" placeholder="Buscar por correo o nombre" autocomplete="off" data-q></label>
                <button type="button" class="us-btn" data-reload>Actualizar</button>
            </div>
            <div data-list><p class="us-muted">Cargando usuarios…</p></div>
            <p class="us-note"><b>Último acceso</b>: última vez que inició sesión. <b>Última actividad</b>: última vez que usó el sitio con su sesión abierta (quien se queda conectado no vuelve a iniciar sesión).</p>
        </section>`;
    const $ = sel => container.querySelector(sel);

    function draw() {
        const now = Date.now();
        const s = summarizeUsers(rows, now);
        $('[data-tiles]').innerHTML = [
            ['Registrados', s.total],
            ['Correo confirmado', s.confirmados],
            ['Activos 7 días', s.activos7],
            ['Activos 30 días', s.activos30],
        ].map(([label, n]) => `<div class="us-tile"><b>${n.toLocaleString('es-MX')}</b><span>${label}</span></div>`).join('');
        const q = fold($('[data-q]').value.trim());
        const list = q ? rows.filter(r => fold(`${r.email} ${r.nombre}`).includes(q)) : rows;
        if (!list.length) { $('[data-list]').innerHTML = `<p class="us-muted">${rows.length ? 'Ningún usuario coincide.' : 'Todavía no hay usuarios registrados.'}</p>`; return; }
        $('[data-list]').innerHTML = `
            <table class="us-table">
                <thead><tr><th scope="col">Usuario</th><th scope="col">Registro</th><th scope="col">Último acceso</th><th scope="col">Última actividad</th><th scope="col">Estado</th></tr></thead>
                <tbody>${list.map(r => {
                    const recent = r.ultima_actividad && now - new Date(r.ultima_actividad).getTime() <= 7 * DAY;
                    return `<tr>
                        <td data-label="Usuario"><strong>${esc(r.nombre || r.email)}</strong>${r.nombre ? `<small>${esc(r.email)}</small>` : ''}</td>
                        <td data-label="Registro">${shortDate(r.registrado)}</td>
                        <td data-label="Último acceso"><span title="${esc(fullDate(r.ultimo_acceso))}">${relativeTime(r.ultimo_acceso, now)}</span><small>${esc(fullDate(r.ultimo_acceso))}</small></td>
                        <td data-label="Última actividad"><span class="${recent ? 'us-recent' : ''}" title="${esc(fullDate(r.ultima_actividad))}">${relativeTime(r.ultima_actividad, now)}</span>${r.sesiones_abiertas ? `<small>${r.sesiones_abiertas} ${r.sesiones_abiertas === 1 ? 'sesión abierta' : 'sesiones abiertas'}</small>` : ''}</td>
                        <td data-label="Estado">${r.confirmado ? '<span class="us-chip is-ok">Confirmado</span>' : '<span class="us-chip">Sin confirmar</span>'}</td>
                    </tr>`;
                }).join('')}</tbody>
            </table>`;
    }

    async function load() {
        $('[data-reload]').disabled = true;
        const { data, error } = await supabase.rpc('site_list_users');
        if (!alive) return;
        $('[data-reload]').disabled = false;
        if (error) {
            const denied = error.code === '42501' || /SITE_OWNER_REQUIRED/.test(error.message || '');
            $('[data-tiles]').innerHTML = '';
            $('[data-list]').innerHTML = `<p class="us-muted">${denied ? 'Esta sección solo está disponible para la cuenta dueña del sitio.' : 'No se pudo cargar la lista. Intenta de nuevo.'}</p>`;
            return;
        }
        rows = data || [];
        draw();
    }

    $('[data-q]').addEventListener('input', () => { if (rows.length) draw(); });
    $('[data-reload]').addEventListener('click', load);
    load();

    return { destroy() { alive = false; container.replaceChildren(); } };
}
