/**
 * Panorama tab of the CNE section (#panorama-cne): what the regulator has been resolving — totals,
 * resolutions per year, this year by type and by modality, and the latest resolutions. Every
 * figure is a count the CNE registry returns for a filter (one row per request, a few at a time),
 * kept in this browser for half a day so the registry is not asked again on every visit.
 */
import { countResolutions, searchResolutions, searchPermits, permitsHash, RESOLUTIONS_URL } from '../lib/cne-api.js';
import { esc, number, plural, dateLabel, failure as failureFor } from './cne-shared.js';

const STORE_KEY = 'cne-panorama-v1';
const STORE_TTL = 12 * 60 * 60 * 1000;
const YEARS = 12;
const TYPES = ['Otorgamiento de permiso', 'Modificación de permiso', 'Terminación de permiso', 'Transferencia de permiso', 'Visitas de verificación', 'Sanción', 'Regulación', 'Varios'];
const MODES = [
    { label: 'Electricidad', filter: 'Electricidad' },
    { label: 'Petrolíferos', filter: 'Petrolíferos' },
    { label: 'Gas licuado de petróleo', filter: 'Gas licuado' },
    { label: 'Gas natural', filter: 'Gas natural' },
    { label: 'Hidrocarburos', filter: 'Hidrocarburos' },
    { label: 'Otros', filter: 'Otros' },
];

/** Runs async jobs a few at a time. */
async function inBatches(jobs, size = 3) {
    const results = [];
    for (let i = 0; i < jobs.length; i += size) results.push(...await Promise.all(jobs.slice(i, i + size).map(job => job())));
    return results;
}

function readStore() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
        return saved && Date.now() - saved.at < STORE_TTL ? saved.data : null;
    } catch { return null; }
}
function writeStore(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ at: Date.now(), data })); } catch { /* private mode */ }
}

async function collect() {
    const now = new Date();
    const year = now.getFullYear();
    const years = Array.from({ length: YEARS }, (_, i) => year - YEARS + 1 + i);
    const [permits, resolutions, ...rest] = await inBatches([
        () => searchPermits({ length: 1 }).then(r => r.total),
        () => countResolutions({}),
        ...years.map(y => () => countResolutions({ fecha: String(y) })),
        ...TYPES.map(type => () => countResolutions({ fecha: String(year), tipo: type })),
        ...MODES.map(mode => () => countResolutions({ fecha: String(year), modalidad: mode.filter })),
    ]);
    const perYear = years.map((y, i) => ({ year: y, count: rest[i] }));
    const byType = TYPES.map((type, i) => ({ label: type, count: rest[years.length + i] }));
    const byMode = MODES.map((mode, i) => ({ label: mode.label, count: rest[years.length + TYPES.length + i] }));
    return { year, permits, resolutions, thisYear: perYear.at(-1).count, perYear, byType, byMode, at: Date.now() };
}

export function renderPanoramaView(container) {
    let alive = true;
    const root = document.createElement('div');
    root.className = 'pm-panel pn-view';
    root.innerHTML = `
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${RESOLUTIONS_URL}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`;
    container.replaceChildren(root);
    const status = root.querySelector('.pm-status');
    const body = root.querySelector('.pn-body');

    const bars = (items, unit) => {
        const max = Math.max(1, ...items.map(item => item.count));
        return `<ul class="pn-bars">${items.filter(item => item.count > 0).sort((a, b) => b.count - a.count).map(item => `
            <li><span class="pn-bar-label">${esc(item.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2, Math.round(item.count / max * 100))}%"></span></span>
                <span class="pn-bar-value">${number(item.count)}<span class="sr-only"> ${unit}</span></span></li>`).join('')}</ul>`;
    };

    function draw(data, latest, session) {
        const max = Math.max(1, ...data.perYear.map(item => item.count));
        status.textContent = `Actualizado ${new Date(data.at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`;
        body.innerHTML = `
            <div class="pn-kpis">
                <a class="pn-kpi" href="${permitsHash({ tab: 'permisos' })}"><b>${number(data.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${permitsHash({ tab: 'resoluciones' })}"><b>${number(data.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${number(data.thisYear)}</b><span>resoluciones en ${data.year}</span></div>
                ${session ? `<a class="pn-kpi" href="${permitsHash({ tab: 'resoluciones' })}"><b>${esc(dateLabel(session.date))}</b><span>última sesión (${esc(session.acta)})${session.count ? `: ${plural(session.count, 'resolución', 'resoluciones')}` : ''}</span></a>` : ''}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${data.perYear.map(item => `
                    <li title="${item.year}: ${number(item.count)} resoluciones">
                        <span class="pn-col-value">${number(item.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2, Math.round(item.count / max * 100))}%"></span>
                        <span class="pn-col-label">${item.year === data.year ? `${item.year}*` : item.year}</span>
                    </li>`).join('')}</ol>
                <p class="pm-note">* ${data.year} va en curso.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${data.year} por tipo</h3>${bars(data.byType, 'resoluciones')}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${data.year} por modalidad</h3>${bars(data.byMode, 'resoluciones')}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${latest.length ? `<ol class="pn-latest">${latest.map(row => `
                    <li><a href="${permitsHash({ resolution: row.NumeroResolucion })}">
                        <span class="pn-latest-top"><b>${esc(row.NumeroResolucion)}</b><time>${esc(dateLabel(row.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${esc(row.TipoResolucion || '')}${row.ModalidadResolucion ? ` · ${esc(row.ModalidadResolucion)}` : ''}</span>
                        <span class="pn-latest-text">${esc(row.Proemio || '')}</span>
                    </a></li>`).join('')}</ol>` : '<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`;
    }

    (async () => {
        try {
            const latestPromise = searchResolutions({}, { length: 8 }).then(r => r.rows).catch(() => []);
            let data = readStore();
            if (!data) { data = await collect(); writeStore(data); }
            const latest = await latestPromise;
            // The latest session: the acta of the newest resolution, and how many it approved.
            const top = latest[0];
            const session = top?.NumeroActa
                ? { date: top.FechaResolucion, acta: top.NumeroActa, count: await countResolutions({ acta: top.NumeroActa }).catch(() => 0) }
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
