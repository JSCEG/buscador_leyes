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

const activeWithin = (row, days, now) => Boolean(row.ultima_actividad) && now - new Date(row.ultima_actividad).getTime() <= days * DAY;

/** Totals for the tiles: registered, confirmed, active in 7 and 30 days (by last activity). */
export function summarizeUsers(rows, now = Date.now()) {
    return {
        total: rows.length,
        confirmados: rows.filter(r => r.confirmado).length,
        activos7: rows.filter(r => activeWithin(r, 7, now)).length,
        activos30: rows.filter(r => activeWithin(r, 30, now)).length,
    };
}

/** Each tile is also the filter for the list below it. */
export const USER_FILTERS = Object.freeze({
    todos: () => true,
    confirmados: row => Boolean(row.confirmado),
    activos7: (row, now) => activeWithin(row, 7, now),
    activos30: (row, now) => activeWithin(row, 30, now),
});

const fullDate = value => (value ? new Date(value).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin registro');
const initials = (name, email) => {
    const words = String(name || email || '').replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
    return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2)).toUpperCase();
};
const time = value => (value ? new Date(value).getTime() : 0);
/** Sort keys of the columns. */
const SORTS = {
    usuario: r => fold(r.nombre || r.email),
    registro: r => time(r.registrado),
    acceso: r => time(r.ultimo_acceso),
    actividad: r => time(r.ultima_actividad),
    estado: r => (r.confirmado ? 1 : 0),
};
const SORT_ICON = '<svg class="bu-i us-sort" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9 4-4 4 4M8 15l4 4 4-4"/></svg>';
const SEARCH_ICON = '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>';
const RELOAD_ICON = '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>';
const shortDate = value => (value ? new Date(value).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const TILES = [['todos', 'Registrados', 'total'], ['confirmados', 'Correo confirmado', 'confirmados'], ['activos7', 'Activos 7 días', 'activos7'], ['activos30', 'Activos 30 días', 'activos30']];

/**
 * @param {HTMLElement} container
 * @returns {{ destroy: () => void }}
 */
export function renderUsersView(container) {
    let alive = true;
    let rows = [];
    let filter = 'todos';
    let sort = { key: 'actividad', dir: -1 };
    container.innerHTML = `
        <section class="us-view" aria-labelledby="us-title">
            <header class="us-head">
                <div>
                    <p class="us-kicker">Solo tu cuenta</p>
                    <h1 id="us-title">Usuarios</h1>
                    <p class="us-intro">Quién tiene cuenta en el buscador y cuándo fue la última vez que entró.</p>
                </div>
                <button type="button" class="bu-btn bu-btn-contorno bu-btn-sm" data-reload>${RELOAD_ICON}Actualizar</button>
            </header>
            <div class="us-tiles" data-tiles role="group" aria-label="Filtrar usuarios"></div>
            <label class="bu-campo us-search">${SEARCH_ICON}<span class="us-sr">Buscar usuario</span>
                <input type="search" placeholder="Buscar por correo o nombre" autocomplete="off" data-q></label>
            <div data-list><p class="us-muted">Cargando usuarios…</p></div>
            <p class="us-note"><b>Último acceso</b>: última vez que inició sesión. <b>Última actividad</b>: última vez que usó el sitio con su sesión abierta (quien se queda conectado no vuelve a iniciar sesión).</p>
        </section>`;
    const $ = sel => container.querySelector(sel);

    function draw() {
        const now = Date.now();
        const s = summarizeUsers(rows, now);
        $('[data-tiles]').innerHTML = TILES.map(([id, label, key]) => `<button type="button" class="us-tile bu-cristal" data-filter="${id}" aria-pressed="${filter === id}"><span>${label}</span><b>${s[key].toLocaleString('es-MX')}</b></button>`).join('');
        const q = fold($('[data-q]').value.trim());
        const key = SORTS[sort.key];
        const list = rows.filter(r => USER_FILTERS[filter](r, now) && (!q || fold(`${r.email} ${r.nombre}`).includes(q)))
            .sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * sort.dir);
        const th = (id, label) => `<th scope="col"${sort.key === id ? ` aria-sort="${sort.dir > 0 ? 'ascending' : 'descending'}"` : ''}><button type="button" data-sort="${id}">${label}${SORT_ICON}</button></th>`;
        if (!list.length) { $('[data-list]').innerHTML = `<p class="us-muted">${rows.length ? 'Ningún usuario coincide.' : 'Todavía no hay usuarios registrados.'}</p>`; return; }
        $('[data-list]').innerHTML = `
            <div class="us-table-wrap bu-cristal"><table class="us-table">
                <caption>${list.length.toLocaleString('es-MX')} ${list.length === 1 ? 'usuario' : 'usuarios'}</caption>
                <thead><tr>${th('usuario', 'Persona')}${th('registro', 'Registro')}${th('acceso', 'Último acceso')}${th('actividad', 'Última actividad')}${th('estado', 'Estado')}</tr></thead>
                <tbody>${list.map(r => {
                    const recent = activeWithin(r, 7, now);
                    return `<tr>
                        <td data-label="Persona"><span class="us-person"><span class="us-avatar" aria-hidden="true">${esc(initials(r.nombre, r.email))}</span><span class="us-who"><strong>${esc(r.nombre || r.email)}</strong>${r.nombre ? `<small>${esc(r.email)}</small>` : ''}</span></span></td>
                        <td data-label="Registro">${shortDate(r.registrado)}</td>
                        <td data-label="Último acceso"><span title="${esc(fullDate(r.ultimo_acceso))}">${relativeTime(r.ultimo_acceso, now)}</span><small>${esc(fullDate(r.ultimo_acceso))}</small></td>
                        <td data-label="Última actividad"><span class="${recent ? 'us-recent' : ''}" title="${esc(fullDate(r.ultima_actividad))}">${relativeTime(r.ultima_actividad, now)}</span>${r.sesiones_abiertas ? `<small>${r.sesiones_abiertas} ${r.sesiones_abiertas === 1 ? 'sesión abierta' : 'sesiones abiertas'}</small>` : ''}</td>
                        <td data-label="Estado">${r.confirmado ? '<span class="bu-insignia bu-insignia-ok">Confirmada</span>' : '<span class="bu-insignia">Pendiente</span>'}</td>
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
    $('[data-tiles]').addEventListener('click', event => {
        const id = event.target.closest('[data-filter]')?.dataset.filter;
        if (!id) return;
        filter = id;
        draw();
        $(`[data-filter="${id}"]`)?.focus();
    });
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
