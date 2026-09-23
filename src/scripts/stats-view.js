import { computeStats } from '../lib/stats-model.js';
import { collectionIcon } from '../lib/collection-icons.js';
import '../styles/stats.css';

const mounted = new WeakMap();
const number = value => new Intl.NumberFormat('es-MX').format(value);
const percent = (part, whole) => whole ? `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format((part / whole) * 100)} %` : '0 %';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const color = groupId => `var(--st-c-${groupId})`;
const formatDay = (day, style = 'medium') => day ? new Intl.DateTimeFormat('es-MX', { dateStyle: style, timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`)) : '—';
const shortName = law => law.siglas || law.titulo;
const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

function kpi(label, value, note, accent) {
    return `<div class="st-kpi" style="--st-accent:${accent}">
        <p class="st-kpi-label">${label}</p>
        <p class="st-kpi-value">${value}</p>
        <p class="st-kpi-note">${note}</p>
    </div>`;
}

function composition(stats) {
    const segments = key => stats.groups.map(group => `<span class="st-seg" style="flex-grow:${group[key]};background:${color(group.id)}"
        data-tip="${escape(`${group.label}: ${number(group[key])} (${percent(group[key], key === 'count' ? stats.total : stats.totalFragments)})`)}"></span>`).join('');
    return `<section class="st-card st-span-2" aria-labelledby="st-comp">
        <div class="st-card-head"><h2 id="st-comp">Composición del acervo</h2><p>Proporción por colección, en instrumentos y en fragmentos de texto.</p></div>
        <div class="st-stack-block"><p class="st-stack-label">Instrumentos</p><div class="st-stack" role="img" aria-label="Instrumentos por colección">${segments('count')}</div></div>
        <div class="st-stack-block"><p class="st-stack-label">Fragmentos</p><div class="st-stack" role="img" aria-label="Fragmentos por colección">${segments('fragments')}</div></div>
        <ul class="st-legend">
            ${stats.groups.map(group => `<li><button type="button" class="st-legend-item" data-group="${group.id}" title="Ver ${escape(group.label)} en el acervo">
                <span class="st-icon" style="color:${color(group.id)}">${collectionIcon(group.id, 16)}</span>
                <span class="st-legend-name">${escape(group.label)}</span>
                <span class="st-legend-num">${number(group.count)}</span>
                <span class="st-legend-pct">${percent(group.count, stats.total)}</span>
                <span class="st-legend-frag">${number(group.fragments)} frag.</span>
            </button></li>`).join('')}
        </ul>
    </section>`;
}

function timeline(stats) {
    const quarters = stats.quarters;
    if (!quarters.length) return '';
    const width = 640, height = 220, top = 16, bottom = 28, left = 28, right = 8;
    const max = Math.max(...quarters.map(q => q.total), 1);
    const step = Math.ceil(max / 4);
    const yMax = step * 4;
    const plotH = height - top - bottom;
    const band = (width - left - right) / quarters.length;
    const barW = Math.min(36, band * 0.62);
    const y = value => top + plotH - (value / yMax) * plotH;
    const grid = [0, 1, 2, 3, 4].map(i => `<g><line x1="${left}" x2="${width - right}" y1="${y(i * step)}" y2="${y(i * step)}" class="st-grid${i ? '' : ' st-base'}"/><text x="${left - 6}" y="${y(i * step) + 4}" class="st-axis" text-anchor="end">${i * step}</text></g>`).join('');
    const bars = quarters.map((quarter, index) => {
        const x = left + index * band + (band - barW) / 2;
        let acc = 0;
        const parts = stats.groups.filter(group => quarter.byGroup[group.id]).map(group => {
            const value = quarter.byGroup[group.id];
            const y1 = y(acc + value), h = y(acc) - y1;
            acc += value;
            return `<rect x="${x}" y="${y1}" width="${barW}" height="${Math.max(0, h - 2)}" rx="2" fill="${color(group.id)}"/>`;
        }).join('');
        const [year, q] = quarter.key.split('-');
        const detail = stats.groups.filter(group => quarter.byGroup[group.id]).map(group => `${group.label}: ${quarter.byGroup[group.id]}`).join(' · ');
        const label = q === 'T1' || index === 0 ? `<text x="${x + barW / 2}" y="${height - 4}" class="st-axis st-axis-year" text-anchor="middle">${year}</text>` : '';
        return `<g class="st-col" data-tip="${escape(`${q} ${year} — ${quarter.total} publicados${detail ? `\n${detail}` : ''}`)}">
            <rect class="st-hit" x="${left + index * band}" y="${top}" width="${band}" height="${plotH}"/>
            ${parts}
            <text x="${x + barW / 2}" y="${height - 16}" class="st-axis" text-anchor="middle">${q}</text>${label}
            ${quarter.total ? `<text x="${x + barW / 2}" y="${y(quarter.total) - 5}" class="st-col-total" text-anchor="middle">${quarter.total}</text>` : ''}
        </g>`;
    }).join('');
    return `<section class="st-card st-span-2" aria-labelledby="st-time">
        <div class="st-card-head"><h2 id="st-time">Publicaciones por trimestre</h2><p>Fecha de publicación oficial de cada instrumento, apilada por colección.</p></div>
        <div class="st-chart-scroll"><svg class="st-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Instrumentos publicados por trimestre">${grid}${bars}</svg></div>
    </section>`;
}

function barList(id, title, subtitle, items) {
    const max = Math.max(...items.map(item => item.value), 1);
    return `<section class="st-card" aria-labelledby="${id}">
        <div class="st-card-head"><h2 id="${id}">${title}</h2><p>${subtitle}</p></div>
        <ol class="st-bars">
            ${items.map(item => {
                const tag = item.lawId ? 'button' : 'div';
                return `<li><${tag} ${item.lawId ? `type="button" data-law-id="${escape(item.lawId)}"` : ''} class="st-bar-row" title="${escape(item.title)}">
                    <span class="st-bar-name">${escape(item.label)}</span>
                    <span class="st-bar-track"><span class="st-bar-fill" style="--w:${(item.value / max) * 100}%;background:${item.color}"></span></span>
                    <span class="st-bar-val">${number(item.value)}</span>
                </${tag}></li>`;
            }).join('')}
        </ol>
    </section>`;
}

function tableShell(stats) {
    return `<section class="st-card st-span-2 st-table-card" aria-labelledby="st-table">
        <div class="st-card-head st-table-head">
            <div><h2 id="st-table">Todos los instrumentos</h2><p class="st-table-status" role="status" aria-live="polite"></p></div>
            <div class="st-table-tools">
                <label class="st-field"><span>Buscar</span><input type="search" class="st-search" placeholder="Título o siglas" autocomplete="off" maxlength="200"></label>
                <label class="st-field"><span>Colección</span><select class="st-filter"><option value="all">Todas</option>${stats.groups.map(group => `<option value="${group.id}">${escape(group.label)}</option>`).join('')}</select></label>
            </div>
        </div>
        <div class="st-table-wrap"><table class="st-table">
            <thead><tr>
                <th scope="col"><button type="button" data-sort="name">Instrumento</button></th>
                <th scope="col"><button type="button" data-sort="group">Colección</button></th>
                <th scope="col"><button type="button" data-sort="day">Publicación</button></th>
                <th scope="col" class="st-num"><button type="button" data-sort="fragments">Fragmentos</button></th>
            </tr></thead>
            <tbody></tbody>
        </table></div>
    </section>`;
}

/** Statistics dashboard. Navigation stays with the app via onOpenLaw/onOpenGroup. */
export function renderStatsView(container, summaries, { onOpenLaw = () => {}, onOpenGroup = () => {}, today } = {}) {
    if (!container) throw new Error('Falta el contenedor de estadísticas.');
    mounted.get(container)?.destroy();
    const stats = computeStats(summaries, { today });
    const groupLabel = new Map(stats.groups.map(group => [group.id, group.label]));
    const lead = stats.groups[0] ? [...stats.groups].sort((a, b) => b.count - a.count)[0] : null;

    const root = document.createElement('section');
    root.className = 'st-dashboard';
    root.setAttribute('aria-labelledby', 'st-title');
    root.innerHTML = `
        <div class="st-header">
            <div>
                <p class="st-eyebrow">Panorama del acervo</p>
                <h1 id="st-title">Estadísticas</h1>
                <p class="st-intro">Qué contiene el acervo regulatorio, cómo se distribuye y cuándo se publicó.</p>
            </div>
            <p class="st-updated">Publicación más reciente<br><strong>${formatDay(stats.latestDay, 'long')}</strong></p>
        </div>
        <div class="st-kpis">
            ${kpi('Instrumentos', number(stats.total), `${stats.groups.length} colecciones`, 'var(--st-c-leyes)')}
            ${kpi('Fragmentos de texto', number(stats.totalFragments), `${number(stats.averageFragments)} en promedio por instrumento`, 'var(--st-c-reglamentos)')}
            ${kpi('Publicados en 12 meses', number(stats.recent), `${percent(stats.recent, stats.total)} del acervo`, 'var(--st-c-acuerdos)')}
            ${kpi('Colección mayor', lead ? escape(lead.label) : '—', lead ? `${number(lead.count)} instrumentos` : '', 'var(--st-c-dacg)')}
        </div>
        <div class="st-grid-layout">
            ${composition(stats)}
            ${timeline(stats)}
            ${barList('st-top', 'Instrumentos más extensos', 'Por número de fragmentos. Selecciona uno para abrirlo.', stats.top.map(row => ({
                label: shortName(row.law), title: row.law.titulo, value: row.fragments, color: color(row.group), lawId: String(row.law.id),
            })))}
            ${barList('st-topics', 'Temas más frecuentes', 'Número de instrumentos que incluyen cada tema clave.', stats.topics.map(topic => ({
                label: topic.label, title: topic.label, value: topic.count, color: 'var(--st-c-topic)',
            })))}
            ${tableShell(stats)}
        </div>
        <div class="st-tip" role="tooltip" hidden></div>`;
    container.replaceChildren(root);

    const lawById = new Map(stats.rows.map(row => [String(row.law.id), row.law]));
    const tbody = root.querySelector('tbody');
    const status = root.querySelector('.st-table-status');
    const search = root.querySelector('.st-search');
    const filter = root.querySelector('.st-filter');
    const table = { query: '', group: 'all', sort: 'fragments', dir: -1 };
    const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const sorters = {
        name: (a, b) => collator.compare(a.law.titulo, b.law.titulo),
        group: (a, b) => collator.compare(groupLabel.get(a.group), groupLabel.get(b.group)),
        day: (a, b) => (a.day || '').localeCompare(b.day || ''),
        fragments: (a, b) => a.fragments - b.fragments,
    };

    function renderTable() {
        const terms = normalize(table.query).split(/\s+/).filter(Boolean);
        const rows = stats.rows
            .filter(row => table.group === 'all' || row.group === table.group)
            .filter(row => terms.every(term => normalize(`${row.law.titulo} ${row.law.siglas || ''}`).includes(term)))
            .sort((a, b) => sorters[table.sort](a, b) * table.dir || collator.compare(a.law.titulo, b.law.titulo));
        tbody.innerHTML = rows.map(row => `<tr data-law-id="${escape(row.law.id)}" tabindex="0">
            <td><span class="st-td-sigla">${escape(row.law.siglas || '')}</span><span class="st-td-title">${escape(row.law.titulo)}</span></td>
            <td><span class="st-chip"><span class="st-icon" style="color:${color(row.group)}">${collectionIcon(row.group, 15)}</span>${escape(groupLabel.get(row.group))}</span></td>
            <td class="st-nowrap">${formatDay(row.day)}</td>
            <td class="st-num">${number(row.fragments)}</td>
        </tr>`).join('') || '<tr><td colspan="4" class="st-empty">Sin instrumentos que coincidan.</td></tr>';
        status.textContent = `${number(rows.length)} de ${number(stats.total)} instrumentos`;
        root.querySelectorAll('th button').forEach(button => {
            const active = button.dataset.sort === table.sort;
            button.closest('th').setAttribute('aria-sort', active ? (table.dir > 0 ? 'ascending' : 'descending') : 'none');
        });
    }

    const tip = root.querySelector('.st-tip');
    const onOver = event => {
        const target = event.target.closest('[data-tip]');
        if (!target) { tip.hidden = true; return; }
        tip.textContent = target.dataset.tip;
        tip.hidden = false;
        const box = root.getBoundingClientRect();
        const x = Math.min(event.clientX - box.left + 14, box.width - tip.offsetWidth - 4);
        tip.style.transform = `translate(${Math.max(4, x)}px, ${event.clientY - box.top + 14}px)`;
    };
    const onLeave = () => { tip.hidden = true; };
    const openRow = target => {
        const law = lawById.get(target.dataset.lawId);
        if (law) onOpenLaw(law);
    };
    const onClick = event => {
        const sort = event.target.closest('th button');
        if (sort) {
            table.dir = table.sort === sort.dataset.sort ? -table.dir : (sort.dataset.sort === 'name' || sort.dataset.sort === 'group' ? 1 : -1);
            table.sort = sort.dataset.sort;
            return renderTable();
        }
        const group = event.target.closest('[data-group]');
        if (group) return onOpenGroup(group.dataset.group);
        const law = event.target.closest('[data-law-id]');
        if (law) openRow(law);
    };
    const onKey = event => {
        const row = event.target.closest('tr[data-law-id]');
        if (row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openRow(row); }
    };
    const onInput = () => { table.query = search.value; table.group = filter.value; renderTable(); };

    root.addEventListener('pointermove', onOver);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    search.addEventListener('input', onInput);
    filter.addEventListener('change', onInput);
    renderTable();
    const scroller = root.querySelector('.st-chart-scroll');
    if (scroller) scroller.scrollLeft = scroller.scrollWidth; // narrow screens open on the latest quarters
    requestAnimationFrame?.(() => root.classList.add('is-ready'));

    const view = {
        destroy() {
            root.removeEventListener('pointermove', onOver);
            root.removeEventListener('pointerleave', onLeave);
            root.removeEventListener('click', onClick);
            root.removeEventListener('keydown', onKey);
            mounted.delete(container);
        },
    };
    mounted.set(container, view);
    return view;
}
