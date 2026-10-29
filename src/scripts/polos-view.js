/**
 * Polos de Desarrollo para el Bienestar (#polos, #polo=<id>): what a polo is, the three official
 * figures, the declaratorias in force and a map with each polo, its polygon when the declaratoria
 * prints coordinates, its official milestones and what energy infrastructure lies near it (CNE
 * permits through /api/mapa, transmission lines and gas pipelines from public/mapa/).
 * Only public, official information (DOF, gob.mx). Leaflet loads with the section.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { baseLayers, networkLayers, NETWORKS } from '../lib/map-common.js';
import { infraType } from '../lib/infra-icons.js';
import { techMarkerSVG } from '../lib/tech-markers.js';
import { permitsHash } from '../lib/cne-api.js';
import { FIGURAS, FIGURA, polosHash, stats, poloCenter, permitsNear, hitosOrdenados, poloPinSVG } from '../lib/polos.js';
import '../styles/polos.css';

const MEXICO = [[14.3, -118.4], [32.8, -86.6]];
const RADIUS_KM = 25;
const AREA_ZOOM = 11;
// Permit markets shown as "what is near"; same colours as the permits map.
const NEAR_MARKETS = [
    { key: 'electricidad', label: 'Generación eléctrica', color: '#1E5B4F' },
    { key: 'gas-natural', label: 'Gas natural', color: '#2f6690' },
];
const HITO = { declaratoria: 'Declaratoria', convocatoria: 'Convocatoria', fallo: 'Fallo', cancelacion: 'Cancelación', abrogacion: 'Abrogación', otro: 'Aviso' };

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v, digits = 0) => Number(v).toLocaleString('es-MX', { maximumFractionDigits: digits });
const date = v => {
    const d = v ? new Date(`${v}T12:00:00`) : null;
    return !d || Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};
/** Where a polygon comes from and, when it differs by more than 10 %, its area against the declared one. */
function areaNote(props, polo) {
    const source = props?.figura === 'PODEBI'
        ? 'Polígono trazado con las coordenadas de la declaratoria'
        : 'Polígono de la cartografía de la DGMESNIE (julio de 2026)';
    const drawn = Number(props?.superficie_calculada_ha);
    const declared = Number(polo.superficie_ha);
    const off = drawn > 0 && declared > 0 && Math.abs(drawn - declared) / declared > 0.1;
    return `${source}.${off ? ` El polígono suma ${num(drawn)} ha y la declaratoria indica ${num(declared, 2)} ha.` : ''}`;
}
// Design-system Separator: hairline with the gold diamond.
const SEP = '<div class="pl-sep" aria-hidden="true"><span></span><i></i><span></span></div>';
/** A list item that opens with its subject («PODEBI: …») sets that subject in bold. */
const leadIn = text => {
    const m = String(text ?? '').match(/^([^:]{2,40}):\s([\s\S]*)$/);
    return m ? `<b>${esc(m[1])}:</b> ${esc(m[2])}` : esc(text);
};
const safeUrl = u => (/^https:\/\//i.test(u || '') ? u : '');

async function getJson(url, signal) {
    const response = await fetch(url, { signal, credentials: 'same-origin' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * @param {HTMLElement} container
 * @param {{ id?: string|null, onRoute: (hash: string) => void }} options
 */
export function renderPolosView(container, { id = null, onRoute }) {
    const ctrl = new AbortController();
    const state = { data: null, features: new Map(), selected: null, figura: 'todas', estado: '', permits: {}, nearLayer: null };
    let map = null;
    let nets = null;
    const markers = new Map();
    const $ = sel => container.querySelector(sel);

    container.innerHTML = `<section class="pl-view" aria-busy="true"><div class="pl-loading"><i></i><i></i><i></i></div></section>`;

    Promise.all([
        getJson('/polos/polos.json', ctrl.signal),
        getJson('/polos/poligonos.geojson', ctrl.signal).catch(() => ({ features: [] })),
    ]).then(([data, geo]) => {
        state.data = data;
        (geo.features || []).forEach(f => { if (f.properties?.id) state.features.set(f.properties.id, f); });
        render();
        if (id) select(id, { route: false });
    }).catch(error => {
        if (error.name === 'AbortError') return;
        container.innerHTML = `<section class="pl-view"><p class="pl-error">No se pudo cargar la información de los polos. Intenta de nuevo en un momento.</p></section>`;
    });

    function render() {
        const { data } = state;
        const s = stats(data.polos);
        const max = Math.max(...Object.values(s.porFigura), 1);
        const estados = s.porEstado;
        // The definition reads first; its legal basis ("La figura nació…") follows in smaller type.
        const cut = (data.definicion || '').indexOf(' La figura ');
        const lead = cut > 0 ? data.definicion.slice(0, cut) : data.definicion || '';
        const basis = cut > 0 ? data.definicion.slice(cut + 1) : '';
        container.innerHTML = `
        <section class="pl-view">
            <header class="pl-head">
                <p class="pl-kicker">Plan México · Información oficial</p>
                <h1 class="pl-title">Polos de Desarrollo para el Bienestar</h1>
                <p class="pl-lead">${esc(lead)}</p>
                ${basis ? `<p class="pl-basis">${esc(basis)}</p>` : ''}
                <p class="pl-cut">Corte: ${esc(date(data.corte))} · Fuente: Diario Oficial de la Federación y sitios oficiales del Gobierno de México</p>
                ${SEP}
            </header>

            <div class="pl-kpis">
                <div class="pl-kpi"><p class="pl-kpi-k">Vigentes</p><b>${s.total}</b><span>polos con declaratoria en el DOF</span>${s.abrogadas ? `<small>${s.abrogadas} abrogada</small>` : ''}</div>
                <div class="pl-kpi"><p class="pl-kpi-k">Territorio</p><b>${s.estados}</b><span>estados con al menos un polo</span></div>
                <div class="pl-kpi"><p class="pl-kpi-k">Superficie</p><b>${s.hectareas ? num(s.hectareas) : '—'}<em>ha</em></b><span>declaradas en el DOF</span>${s.conSuperficie < s.total ? `<small>${s.conSuperficie} de ${s.total} polos con dato</small>` : ''}</div>
                <div class="pl-kpi pl-kpi--bars">
                    <p class="pl-kpi-k">Por figura</p>
                    ${FIGURAS.map(f => `<div class="pl-bar"><span class="pl-bar-k">${f.clave}</span><span class="pl-bar-t"><i style="--w:${(s.porFigura[f.clave] / max) * 100}%;--c:var(${f.token})"></i></span><b>${s.porFigura[f.clave]}</b></div>`).join('')}
                </div>
            </div>

            <h2 class="pl-h2">Tres figuras, tres autoridades</h2>
            <div class="pl-figuras">
                ${(data.figuras || []).map(f => `
                <article class="pl-figura" style="--c:var(${FIGURA[f.clave]?.token || '--brand'})">
                    <p class="pl-figura-k">${esc(f.clave)} · ${s.porFigura[f.clave] ?? 0} vigentes</p>
                    <h3>${esc(f.nombre)}</h3>
                    <p>${esc(f.descripcion)}</p>
                    <dl><dt>Declara</dt><dd>${esc(f.autoridad)}</dd>${f.fundamento ? `<dt>Fundamento</dt><dd>${esc(f.fundamento)}</dd>` : ''}</dl>
                </article>`).join('')}
            </div>

            <h2 class="pl-h2">Mapa de los polos</h2>
            <div class="pl-mapbox">
                <aside class="pl-side">
                    <div class="pl-filters">
                        <div class="pl-chips" role="group" aria-label="Figura">
                            <button type="button" data-figura="todas" class="is-on">Todas</button>
                            ${FIGURAS.map(f => `<button type="button" data-figura="${f.clave}" style="--c:${f.color}"><i></i>${f.clave}</button>`).join('')}
                        </div>
                        <label class="pl-sr" for="pl-estado">Estado</label>
                        <select id="pl-estado" class="pl-select"><option value="">Todos los estados</option>${estados.map(([e, n]) => `<option value="${esc(e)}">${esc(e)} (${n})</option>`).join('')}</select>
                    </div>
                    <ol class="pl-list" data-list></ol>
                    <div class="pl-layers">
                        <p class="pl-mini">Capas de infraestructura</p>
                        ${NETWORKS.filter(n => n.key !== 'petroliferos').map(n => `<label><input type="checkbox" data-network="${n.key}"> <span class="pl-swatch" style="--c:${n.swatch}"></span>${esc(n.label)}</label>`).join('')}
                    </div>
                </aside>
                <div class="pl-mapcol">
                    <div class="pl-map" data-map role="region" aria-label="Mapa de polos de desarrollo"></div>
                    <p class="pl-legend">${FIGURAS.map(f => `<span class="pl-legend-pin">${poloPinSVG(f.clave)}${f.clave}</span>`).join('')}<span><i class="is-area"></i>Polígono del polo (al acercar)</span><span>Polo sin polígono: ubicación aproximada en su municipio</span></p>
                </div>
                <article class="pl-detail" data-detail hidden></article>
            </div>

            ${SEP}<h2 class="pl-h2">Polos por estado</h2>
            <ol class="pl-estados">
                ${estados.map(([e, n]) => `<li><button type="button" data-estado="${esc(e)}"><span>${esc(e)}</span><span class="pl-bar-t"><i style="--w:${(n / estados[0][1]) * 100}%"></i></span><b>${n}</b></button></li>`).join('')}
            </ol>

            ${data.incentivos?.length ? `${SEP}<h2 class="pl-h2">Qué ofrece un polo</h2><ul class="pl-bullets">${data.incentivos.map(i => `<li>${leadIn(i)}</li>`).join('')}</ul>` : ''}


            ${SEP}<h2 class="pl-h2">Fuentes oficiales</h2>
            <ul class="pl-bullets pl-fuentes">${(data.fuentes || []).map(f => safeUrl(f.url) ? `<li><a class="pl-link pl-link--external" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titulo)}</a></li>` : `<li>${esc(f.titulo)}</li>`).join('')}</ul>
        </section>`;
        renderList();
        mountMap();
        bind();
    }

    function filtered() {
        return state.data.polos.filter(p => (state.figura === 'todas' || p.figura === state.figura) && (!state.estado || p.estado === state.estado));
    }

    function renderList() {
        const items = filtered().sort((a, b) => (a.estatus === 'abrogada') - (b.estatus === 'abrogada') || a.estado.localeCompare(b.estado, 'es') || a.nombre.localeCompare(b.nombre, 'es'));
        $('[data-list]').innerHTML = items.map(p => `
            <li><button type="button" data-polo="${esc(p.id)}" class="${p.id === state.selected ? 'is-on' : ''} ${p.estatus === 'abrogada' ? 'is-off' : ''}" style="--c:${FIGURA[p.figura]?.color}">
                <i></i><span><b>${esc(p.nombre)}</b><small>${esc(p.figura)} · ${esc(p.estado)}${p.estatus === 'abrogada' ? ' · abrogada' : ''}</small></span>
            </button></li>`).join('') || '<li class="pl-empty">Sin polos con este filtro.</li>';
    }

    function mountMap() {
        map = L.map($('[data-map]'), { zoomControl: true, attributionControl: true, minZoom: 4 }).fitBounds(MEXICO);
        baseLayers(L, map)('mapa');
        nets = networkLayers(L, map);
        map.createPane('polos').style.zIndex = 420;
        state.data.polos.forEach(p => {
            const color = FIGURA[p.figura]?.color || FIGURA.PODEBI.color;
            const feature = state.features.get(p.id);
            const where = poloCenter(p, feature);
            if (!where) return;
            const group = L.featureGroup();
            // The polygon only shows from AREA_ZOOM on: from farther away it is a few pixels under the point.
            const area = feature
                ? L.geoJSON(feature, { pane: 'polos', style: { color, weight: 2, fillColor: color, fillOpacity: 0.22 } })
                    .bindTooltip(`${esc(p.nombre)} · polígono de la declaratoria`, { sticky: true })
                    .on('click', () => select(p.id))
                : null;
            const pin = L.marker(where.latlng, { icon: pinIcon(p, false), riseOnHover: true, keyboard: true, title: p.nombre, alt: `${p.nombre}, ${p.figura}` })
                .bindTooltip(`${esc(p.nombre)} · ${esc(p.figura)}`, { direction: 'top', offset: [0, -40] })
                .addTo(group);
            group.on('click', () => select(p.id));
            group.addTo(map);
            markers.set(p.id, { group, pin, area, where, feature, polo: p });
        });
        map.on('zoomend', paintAreas);
        setTimeout(() => map?.invalidateSize(), 50);
    }

    /** MarkerSet pin of a polo; the tip (x 18, y 42 of the 36 × 46 icon) sits on its location. */
    function pinIcon(p, selected) {
        return L.divIcon({ className: 'pl-pin', html: poloPinSVG(p.figura, { abrogada: p.estatus === 'abrogada', selected }), iconSize: [36, 46], iconAnchor: [18, 42], tooltipAnchor: [0, 0] });
    }

    /** Only the selected polo wears the accent halo, and it rises above its neighbours. */
    function markSelected(pid) {
        markers.forEach((m, id) => {
            m.pin.setIcon(pinIcon(m.polo, id === pid));
            m.pin.setZIndexOffset(id === pid ? 1000 : 0);
        });
    }

    /** Polygons of the visible polos, only when zoomed in enough to read them. */
    function paintAreas() {
        if (!map) return;
        const near = map.getZoom() >= AREA_ZOOM;
        markers.forEach(m => {
            if (!m.area) return;
            if (near && map.hasLayer(m.group)) m.area.addTo(map);
            else map.removeLayer(m.area);
        });
    }

    /** Bounds of a polo: its polygon when it has one, else its point. */
    const boundsOf = m => (m.area ? m.area.getBounds() : m.group.getBounds());

    function applyFilter() {
        const shown = new Set(filtered().map(p => p.id));
        markers.forEach((m, pid) => { if (shown.has(pid)) m.group.addTo(map); else map.removeLayer(m.group); });
        paintAreas();
        renderList();
        const bounds = L.latLngBounds([]);
        shown.forEach(pid => { const m = markers.get(pid); if (m) bounds.extend(boundsOf(m)); });
        if (bounds.isValid() && (state.figura !== 'todas' || state.estado)) map.fitBounds(bounds.pad(0.3), { maxZoom: 10 });
        else if (state.figura === 'todas' && !state.estado) map.fitBounds(MEXICO);
    }

    function bind() {
        container.addEventListener('click', event => {
            const fig = event.target.closest('[data-figura]');
            if (fig) {
                state.figura = fig.dataset.figura;
                container.querySelectorAll('[data-figura]').forEach(b => b.classList.toggle('is-on', b === fig));
                applyFilter();
                return;
            }
            const est = event.target.closest('[data-estado]');
            if (est) {
                state.estado = est.dataset.estado;
                $('#pl-estado').value = state.estado;
                applyFilter();
                $('.pl-mapbox').scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            const polo = event.target.closest('[data-polo]');
            if (polo) { select(polo.dataset.polo); return; }
            if (event.target.closest('[data-close]')) { clearSelection(); return; }
            if (event.target.closest('[data-near]')) loadNear();
        });
        $('#pl-estado').addEventListener('change', event => { state.estado = event.target.value; applyFilter(); });
        container.querySelectorAll('[data-network]').forEach(box => box.addEventListener('change', () => {
            box.disabled = true;
            nets.toggle(box.dataset.network, box.checked, ctrl.signal)
                .catch(() => { box.checked = false; })
                .finally(() => { box.disabled = false; });
        }));
    }

    function clearSelection() {
        state.selected = null;
        markSelected(null);
        clearNear();
        $('[data-detail]').hidden = true;
        renderList();
        onRoute(polosHash(null));
    }

    function select(pid, { route = true } = {}) {
        const polo = state.data?.polos.find(p => p.id === pid);
        if (!polo) return;
        state.selected = pid;
        markSelected(pid);
        clearNear();
        if (route) onRoute(polosHash(pid));
        renderList();
        const m = markers.get(pid);
        // A polo with polygon zooms in far enough to draw it; one without stays at municipal scale.
        // On wide screens the sheet floats over the map's right side: keep the polo clear of it.
        const sheet = window.matchMedia('(max-width: 900px)').matches ? [0, 0] : [380, 0];
        if (m) map.fitBounds(boundsOf(m).pad(m.area ? 0.4 : 0), { maxZoom: m.area ? 15 : 10, paddingBottomRight: sheet });
        const detail = $('[data-detail]');
        detail.hidden = false;
        detail.style.setProperty('--c', FIGURA[polo.figura]?.color);
        const figura = state.data.figuras?.find(f => f.clave === polo.figura);
        const area = m?.feature?.properties;
        detail.innerHTML = `
            <button type="button" class="pl-x" data-close aria-label="Cerrar ficha">×</button>
            <p class="pl-figura-k">${esc(polo.figura)}${polo.estatus === 'abrogada' ? ' · <span class="pl-off">declaratoria abrogada</span>' : ''}</p>
            <h3>${esc(polo.nombre)}</h3>
            <p class="pl-where">${esc((polo.municipios || []).join(', '))}${polo.municipios?.length ? ', ' : ''}${esc(polo.estado)}</p>
            <dl class="pl-dl">
                ${figura ? `<dt>Declara</dt><dd>${esc(figura.autoridad)}</dd>` : ''}
                ${polo.superficie_ha ? `<dt>Superficie</dt><dd>${num(polo.superficie_ha, 2)} ha</dd>` : ''}
                ${polo.vocaciones?.length ? `<dt>Vocaciones</dt><dd>${polo.vocaciones.map(esc).join(' · ')}</dd>` : ''}
                <dt>Ubicación</dt><dd>${m?.feature ? areaNote(area, polo) : 'Aproximada, centro del municipio'}</dd>
            </dl>
            <h4>Trazabilidad oficial</h4>
            <ol class="pl-hitos">${hitosOrdenados(polo).map(h => `
                <li><time>${esc(date(h.fecha))}</time><b>${esc(HITO[h.tipo] || 'Aviso')}</b><span>${safeUrl(h.url) ? `<a href="${esc(h.url)}" target="_blank" rel="noopener">${esc(h.titulo)}</a>` : esc(h.titulo)}</span></li>`).join('') || '<li class="pl-empty">Sin publicaciones registradas.</li>'}</ol>
            <h4>Qué hay cerca <small>(${RADIUS_KM} km)</small></h4>
            <div data-near-box><button type="button" class="pl-btn" data-near>Ver permisos de energía cercanos</button></div>`;
        detail.scrollTop = 0;
        if (window.matchMedia('(max-width: 900px)').matches) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function clearNear() {
        if (state.nearLayer) { map?.removeLayer(state.nearLayer); state.nearLayer = null; }
    }

    async function loadNear() {
        const pid = state.selected;
        const where = markers.get(pid)?.where;
        const box = $('[data-near-box]');
        if (!where || !box) return;
        box.innerHTML = '<p class="pl-mini">Buscando permisos de la CNE alrededor del polo…</p>';
        try {
            const results = await Promise.all(NEAR_MARKETS.map(async m => {
                state.permits[m.key] ||= getJson(`/api/mapa/capa?tipo=${m.key}`, ctrl.signal).then(g => g.features || []);
                const features = await state.permits[m.key];
                return { m, near: permitsNear(features.filter(f => f.properties?.vigente !== false), where.latlng, RADIUS_KM) };
            }));
            if (state.selected !== pid) return;
            clearNear();
            state.nearLayer = L.layerGroup().addTo(map);
            results.forEach(({ m, near }) => near.forEach(({ feature }) => {
                const [lon, lat] = feature.geometry.coordinates;
                const p = feature.properties;
                // Generation permits wear their technology marker (MarkerSet dot); gas keeps a plain dot.
                const tech = m.key === 'electricidad' ? infraType(m.key, p).tech : '';
                (tech
                    ? L.marker([lat, lon], { icon: L.divIcon({ className: 'pl-pin', html: techMarkerSVG(tech, { variant: 'dot', size: 20 }), iconSize: [28, 28], iconAnchor: [14, 14] }) })
                    : L.circleMarker([lat, lon], { radius: 6, color: '#fff', weight: 1.5, fillColor: m.color, fillOpacity: 0.95 }))
                    .bindPopup(`<strong>${esc(p.nombre)}</strong><br><small>${esc(p.numeroPermiso)} · ${esc(p.tecnologia || p.tipoPermiso || m.label)}</small><br><a href="${permitsHash({ permit: p.numeroPermiso })}">Ficha del permiso</a>`)
                    .addTo(state.nearLayer);
            }));
            L.circle(where.latlng, { radius: RADIUS_KM * 1000, color: FIGURA.PODEBI.color, weight: 1, dashArray: '4 4', fill: false, interactive: false }).addTo(state.nearLayer);
            const all = results.flatMap(({ m, near }) => near.map(n => ({ ...n, m }))).sort((a, b) => a.km - b.km);
            box.innerHTML = `
                <ul class="pl-near-counts">${results.map(({ m, near }) => `<li style="--c:${m.color}"><b>${near.length}</b> ${esc(m.label.toLowerCase())}</li>`).join('')}</ul>
                ${all.length ? `<ol class="pl-near">${all.slice(0, 8).map(({ feature, km, m }) => `<li style="--c:${m.color}"><a href="${permitsHash({ permit: feature.properties.numeroPermiso })}">${esc(feature.properties.nombre)}</a><small>${num(km, 1)} km · ${esc(feature.properties.tecnologia || m.label)}</small></li>`).join('')}</ol>` : '<p class="pl-mini">No hay permisos vigentes de generación eléctrica ni de gas natural en este radio.</p>'}
                <p class="pl-mini">Permisos vigentes del registro público de la CNE con ubicación conocida.</p>`;
            map.fitBounds(L.latLng(where.latlng).toBounds(RADIUS_KM * 2200));
        } catch (error) {
            if (error.name !== 'AbortError') box.innerHTML = '<p class="pl-mini">No se pudieron consultar los permisos cercanos. <button type="button" class="pl-link" data-near>Reintentar</button></p>';
        }
    }

    return {
        show(next) {
            if (!state.data) { id = next; return; }
            if (next) select(next, { route: false });
            else if (state.selected) { state.selected = null; markSelected(null); clearNear(); $('[data-detail]').hidden = true; renderList(); }
        },
        destroy() {
            ctrl.abort();
            map?.remove();
            map = null;
        },
    };
}
