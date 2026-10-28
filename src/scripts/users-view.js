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
const initials = (name, email) => {
    const words = String(name || email || '').replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
    return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2)).toUpperCase();
};
const time = value => (value ? new Date(value).getTime() : 0);
/** Sort keys of the UsersTable columns. */
const SORTS = {
    usuario: r => fold(r.nombre || r.email),
    registro: r => time(r.registrado),
    acceso: r => time(r.ultimo_acceso),
    actividad: r => time(r.ultima_actividad),
    estado: r => (r.confirmado ? 1 : 0),
};
const SORT_ICON = '<svg class="bj-icon" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9 4-4 4 4M8 15l4 4 4-4"/></svg>';
const shortDate = value => (value ? new Date(value).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/**
 * @param {HTMLElement} container
 * @returns {{ destroy: () => void }}
 */
export function renderUsersView(container) {
    let alive = true;
    let rows = [];
    let sort = { key: 'actividad', dir: -1 };
    container.innerHTML = `
        <section class="us-view" aria-labelledby="us-title">
            <header class="us-head">
                <p class="us-kicker">Administración · solo tu cuenta</p>
                <h1 id="us-title">Usuarios registrados</h1>
                <p class="us-intro">Quién tiene cuenta en el buscador y cuándo fue la última vez que entró.</p>
            </header>
            <div class="us-tiles" data-tiles></div>
            <div class="us-tools">
                <label class="us-search"><span class="us-sr">Buscar usuario</span>
                    <input type="search" placeholder="Buscar por correo o nombre" autocomplete="off" data-q></label>
                <button type="button" class="bj-btn bj-btn--secondary us-btn" data-reload><svg class="bj-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>Actualizar</button>
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
        ].map(([label, n]) => `<div class="us-tile"><span>${label}</span><b>${n.toLocaleString('es-MX')}</b></div>`).join('');
        const q = fold($('[data-q]').value.trim());
        const key = SORTS[sort.key];
        const list = (q ? rows.filter(r => fold(`${r.email} ${r.nombre}`).includes(q)) : rows.slice())
            .sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * sort.dir);
        const th = (id, label) => `<th scope="col"${sort.key === id ? ` aria-sort="${sort.dir > 0 ? 'ascending' : 'descending'}"` : ''}><button type="button" data-sort="${id}">${label}${SORT_ICON}</button></th>`;
        if (!list.length) { $('[data-list]').innerHTML = `<p class="us-muted">${rows.length ? 'Ningún usuario coincide.' : 'Todavía no hay usuarios registrados.'}</p>`; return; }
        $('[data-list]').innerHTML = `
            <div class="us-table-wrap"><table class="us-table">
                <caption>${list.length.toLocaleString('es-MX')} ${list.length === 1 ? 'usuario' : 'usuarios'}</caption>
                <thead><tr>${th('usuario', 'Persona')}${th('registro', 'Registro')}${th('acceso', 'Último acceso')}${th('actividad', 'Última actividad')}${th('estado', 'Estado')}</tr></thead>
                <tbody>${list.map(r => {
                    const recent = r.ultima_actividad && now - new Date(r.ultima_actividad).getTime() <= 7 * DAY;
                    return `<tr>
                        <td data-label="Persona"><span class="us-person"><span class="bj-avatar us-avatar" aria-hidden="true">${esc(initials(r.nombre, r.email))}</span><span><strong>${esc(r.nombre || r.email)}</strong>${r.nombre ? `<small>${esc(r.email)}</small>` : ''}</span></span></td>
                        <td data-label="Registro">${shortDate(r.registrado)}</td>
                        <td data-label="Último acceso"><span title="${esc(fullDate(r.ultimo_acceso))}">${relativeTime(r.ultimo_acceso, now)}</span><small>${esc(fullDate(r.ultimo_acceso))}</small></td>
                        <td data-label="Última actividad"><span class="${recent ? 'us-recent' : ''}" title="${esc(fullDate(r.ultima_actividad))}">${relativeTime(r.ultima_actividad, now)}</span>${r.sesiones_abiertas ? `<small>${r.sesiones_abiertas} ${r.sesiones_abiertas === 1 ? 'sesión abierta' : 'sesiones abiertas'}</small>` : ''}</td>
                        <td data-label="Estado">${r.confirmado ? '<span class="bj-badge bj-badge--success"><span class="bj-badge__dot"></span>Confirmada</span>' : '<span class="bj-badge bj-badge--warning"><span class="bj-badge__dot"></span>Pendiente</span>'}</td>
                    </tr>`;
                }).join('')}</tbody>
            </table></div>`;
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
    $('[data-list]').addEventListener('click', event => {
        const id = event.target.closest('[data-sort]')?.dataset.sort;
        if (!id) return;
        sort = { key: id, dir: sort.key === id ? -sort.dir : (id === 'usuario' || id === 'estado' ? 1 : -1) };
        draw();
        $(`[data-sort="${id}"]`)?.focus();
    });
    $('[data-reload]').addEventListener('click', load);
    load();

    return { destroy() { alive = false; container.replaceChildren(); } };
}
