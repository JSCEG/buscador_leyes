/**
 * Panorama tab of the CNE section (#panorama-cne): what the regulator has been resolving — totals,
 * resolutions per year, this year by type and by modality, and the latest resolutions. Every figure comes
 * from Azure (/api/permisos/resoluciones-conteo, /resoluciones and /permisos, src/lib/resoluciones-api.js),
 * kept in this browser for half a day. The CNE site is never called live.
 */
import { permitsHash, RESOLUTIONS_URL } from '../lib/cne-api.js';
import { getPermisos } from '../lib/permisos-api.js';
import { buscarResoluciones, conteoResoluciones, fechaLabel } from '../lib/resoluciones-api.js';
import { MODES } from './resolutions-view.js';
import { esc, number, plural, failure as failureFor } from './cne-shared.js';

const STORE_KEY = 'cne-panorama-v2';
const STORE_TTL = 12 * 60 * 60 * 1000;
const YEARS = 12;

function readStore() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
        return saved && Date.now() - saved.at < STORE_TTL ? saved.data : null;
    } catch { return null; }
}
function writeStore(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ at: Date.now(), data })); } catch { /* private mode */ }
}

/** Figures of the panorama: one count for everything, one for this year and one per modality this year. */
export async function collect() {
    const year = new Date().getFullYear();
    const [permits, all, thisYear, ...modes] = await Promise.all([
        getPermisos('permisos', { autoridad: 'CNE', pageSize: 1 }).then(r => Number(r?.total) || 0),
        conteoResoluciones({}),
        conteoResoluciones({ fecha: String(year) }),
        ...MODES.map(modalidad => conteoResoluciones({ fecha: String(year), modalidad }).then(r => r.total)),
    ]);
    const byYear = new Map(all.porAnio.filter(r => r.anio !== null).map(r => [r.anio, r.total]));
    const perYear = Array.from({ length: YEARS }, (_, i) => year - YEARS + 1 + i).map(y => ({ year: y, count: byYear.get(y) || 0 }));
    // Resolutions without a type or a date are counted in the total but have no bar of their own.
    const byType = thisYear.porTipo.filter(r => r.tipo).map(r => ({ label: r.tipo, count: r.total }));
    const byMode = MODES.map((label, i) => ({ label, count: modes[i] }));
    return { year, permits, resolutions: all.total, thisYear: thisYear.total, perYear, byType, byMode, at: Date.now() };
}

export function renderPanoramaView(container) {
    let alive = true;
    const root = document.createElement('div');
    root.className = 'pm-panel pn-view';
    root.innerHTML = `
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro de permisos y <a href="${RESOLUTIONS_URL}" target="_blank" rel="noopener">resoluciones de la CNE</a>, en la copia que se actualiza cada semana. Las cifras se guardan 12 horas en este navegador.</p>`;
    container.replaceChildren(root);
    const status = root.querySelector('.pm-status');
    const body = root.querySelector('.pn-body');

    // Each bar opens the resolutions it counts.
    const bars = (items, unit, filtersOf) => {
        const max = Math.max(1, ...items.map(item => item.count));
        return `<ul class="pn-bars">${items.filter(item => item.count > 0).sort((a, b) => b.count - a.count).map((item, i) => `
            <li><a class="pn-bar-row" href="${permitsHash({ tab: 'resoluciones', filters: filtersOf(item) })}" data-tip="${esc(`${item.label}: ${number(item.count)} ${unit}. Ver cuáles`)}" style="--i:${i}">
                <span class="pn-bar-label">${esc(item.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2, Math.round(item.count / max * 100))}%"></span></span>
                <span class="pn-bar-value">${number(item.count)}<span class="sr-only"> ${unit}</span></span>
            </a></li>`).join('')}</ul>`;
    };

    function draw(data, latest, session) {
        const max = Math.max(1, ...data.perYear.map(item => item.count));
        status.textContent = `Actualizado ${new Date(data.at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`;
        body.innerHTML = `
            <div class="pn-kpis">
                <a class="pn-kpi" href="${permitsHash({ tab: 'permisos' })}"><b>${number(data.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${permitsHash({ tab: 'resoluciones' })}"><b>${number(data.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${number(data.thisYear)}</b><span>resoluciones en ${data.year}</span></div>
                ${session ? `<a class="pn-kpi" href="${permitsHash({ tab: 'resoluciones', filters: { acta: session.acta } })}"><b>${esc(fechaLabel(session.date) || session.acta)}</b><span>última sesión (${esc(session.acta)})${session.count ? `: ${plural(session.count, 'resolución', 'resoluciones')}` : ''}</span></a>` : ''}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${data.perYear.map((item, i) => `
                    <li><a href="${permitsHash({ tab: 'resoluciones', filters: { fecha: String(item.year) } })}" data-tip="${esc(`${item.year}: ${number(item.count)} resoluciones. Ver cuáles`)}" style="--i:${i}">
                        <span class="pn-col-value">${number(item.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2, Math.round(item.count / max * 100))}%"></span>
                        <span class="pn-col-label">${item.year === data.year ? `${item.year}*` : item.year}</span>
                    </a></li>`).join('')}</ol>
                <p class="pm-note">* ${data.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${data.year} por tipo</h3>${bars(data.byType, 'resoluciones', item => ({ fecha: String(data.year), tipo: item.label }))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${data.year} por modalidad</h3>${bars(data.byMode, 'resoluciones', item => ({ fecha: String(data.year), modalidad: item.label }))}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${latest.length ? `<ol class="pn-latest">${latest.map(row => `
                    <li><a href="${permitsHash({ resolution: row.numero })}">
                        <span class="pn-latest-top"><b>${esc(row.numero)}</b><time>${esc(fechaLabel(row.fecha))}</time></span>
                        <span class="pn-latest-type">${esc(row.tipo || '')}${row.modalidad ? ` · ${esc(row.modalidad)}` : ''}</span>
                    </a></li>`).join('')}</ol>` : '<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`;
    }

    (async () => {
        try {
            const latestPromise = buscarResoluciones({}, { pageSize: 8 }).then(r => r.rows).catch(() => []);
            let data = readStore();
            if (!data) { data = await collect(); writeStore(data); }
            const latest = await latestPromise;
            // The latest session: the acta of the newest resolution, and how many it approved.
            const top = latest[0];
            const session = top?.acta
                ? { date: top.fecha, acta: top.acta, count: await conteoResoluciones({ acta: top.acta }).then(r => r.total).catch(() => 0) }
                : null;
            if (alive) draw(data, latest, session);
        } catch {
            if (!alive) return;
            status.textContent = '';
            body.innerHTML = failureFor('las cifras', RESOLUTIONS_URL);
        }
    })();

    return { destroy: () => { alive = false; root.remove(); } };
}
