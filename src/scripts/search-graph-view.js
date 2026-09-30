/**
 * Relationship map for a search (D3 force layout). Hover lights a node's neighbours,
 * click on an instrument filters the results to it, drag moves nodes, wheel zooms.
 */
import { buildSearchGraph } from '../lib/search-graph.js';
import '../styles/search-graph.css';

const COLORS = {
    leyes: '#9b2247', reglamentos: '#1e5b4f', acuerdos: '#b8375f', dacg: '#2f7a6a',
    convocatorias: '#a57f2c', normas: '#8c6925', otros: '#7a6f63',
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** Returns a destroy function. */
export function renderSearchGraph(host, { query, lawCounts, summaries, activeLaw = 'all', onSelectLaw = () => {} }) {
    const d3 = globalThis.d3;
    const graph = buildSearchGraph({ query, lawCounts, summaries });
    const laws = graph.nodes.filter(node => node.kind === 'law');
    const cites = graph.links.filter(link => link.kind === 'cites').length;
    host.innerHTML = `<div class="sg-head">
            <p class="sg-summary"><strong>${laws.length}</strong> instrumentos en <strong>${graph.nodes.filter(n => n.kind === 'group').length}</strong> colecciones${cites ? ` · <strong>${cites}</strong> relaciones entre ellos` : ''}${graph.hidden ? ` · se muestran los ${laws.length} con más coincidencias` : ''}</p>
            <button type="button" class="sg-reset" data-sg-reset>Reacomodar</button>
        </div>
        <div class="sg-canvas" role="img" aria-label="Mapa de relaciones de «${esc(query)}»: ${laws.length} instrumentos agrupados por colección"></div>
        <p class="sg-hint">Clic en un instrumento: filtra los resultados · Arrastra: mueve · Rueda o pellizco: acerca y aleja</p>`;
    const canvas = host.querySelector('.sg-canvas');
    if (!d3 || !laws.length) {
        canvas.innerHTML = `<p class="sg-empty">${laws.length ? 'El mapa no pudo cargarse.' : 'Sin instrumentos para mostrar.'}</p>`;
        return () => {};
    }

    const width = canvas.clientWidth || 900;
    const height = width < 600 ? Math.round(width * 0.95) : Math.max(420, Math.min(620, Math.round(width * 0.62)));
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const svg = d3.select(canvas).append('svg').attr('viewBox', [-width / 2, -height / 2, width, height]).attr('width', '100%').attr('height', height);
    const zoomLayer = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', event => zoomLayer.attr('transform', event.transform));
    svg.call(zoom);
    // Narrow screens start zoomed out so the whole map fits; pinch brings details back.
    if (width < 600) svg.call(zoom.transform, d3.zoomIdentity.scale(Math.max(0.5, width / 600)));

    const nodes = graph.nodes.map(node => ({ ...node }));
    const links = graph.links.map(link => ({ ...link }));
    // Crowded maps only label the instruments with most matches; the rest show on hover.
    const lawWeights = nodes.filter(n => n.kind === 'law').map(n => n.weight).sort((a, b) => b - a);
    const labelled = width < 600 ? 8 : 22;
    const minorBelow = lawWeights.length > labelled ? lawWeights[labelled - 1] : 0;
    const radius = node => node.kind === 'term' ? 26 : node.kind === 'group' ? 15 : 5 + node.weight * 11;

    // Collection hubs sit on a ring; their instruments orbit them.
    const hubs = nodes.filter(node => node.kind === 'group');
    const ring = Math.min(width, height) * 0.3;
    hubs.forEach((hub, index) => {
        const angle = (index / hubs.length) * Math.PI * 2 - Math.PI / 2;
        hub.hx = Math.cos(angle) * ring; hub.hy = Math.sin(angle) * ring;
        hub.x = hub.hx; hub.y = hub.hy;
    });
    const hubOf = new Map(hubs.map(hub => [hub.group, hub]));
    const term = nodes.find(node => node.kind === 'term');
    term.fx = 0; term.fy = 0;

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(node => node.id)
            .distance(link => link.kind === 'set' ? ring : link.kind === 'member' ? 58 + (1 - (link.target.weight || 0)) * 40 : 90)
            .strength(link => link.kind === 'cites' ? 0.08 : link.kind === 'set' ? 0.9 : 0.5))
        .force('charge', d3.forceManyBody().strength(node => node.kind === 'law' ? -70 : -260))
        .force('collide', d3.forceCollide().radius(node => radius(node) + (node.kind === 'law' ? 16 : 22)))
        .force('x', d3.forceX(node => node.kind === 'group' ? node.hx : node.kind === 'law' ? hubOf.get(node.group)?.hx || 0 : 0).strength(node => node.kind === 'group' ? 0.6 : 0.06))
        .force('y', d3.forceY(node => node.kind === 'group' ? node.hy : node.kind === 'law' ? hubOf.get(node.group)?.hy || 0 : 0).strength(node => node.kind === 'group' ? 0.6 : 0.06));

    const link = zoomLayer.append('g').attr('class', 'sg-links').selectAll('line').data(links).join('line')
        .attr('class', d => `sg-link sg-link-${d.kind}`);
    const node = zoomLayer.append('g').attr('class', 'sg-nodes').selectAll('g').data(nodes).join('g')
        .attr('class', d => `sg-node sg-node-${d.kind}${d.kind === 'law' && d.weight < minorBelow ? ' is-minor' : ''}${d.lawId && String(d.lawId) === String(activeLaw) ? ' is-active' : ''}`)
        .attr('tabindex', d => d.kind === 'law' ? 0 : null)
        .attr('role', d => d.kind === 'law' ? 'button' : null)
        .attr('aria-label', d => d.kind === 'law' ? `${d.title}: ${d.count} coincidencias. Filtrar resultados` : null);
    node.append('circle').attr('r', radius)
        .attr('fill', d => d.kind === 'term' ? '#302b27' : COLORS[d.group] || '#7a6f63')
        .attr('fill-opacity', d => d.kind === 'group' ? 0.18 : 1)
        .attr('stroke', d => d.kind === 'group' ? COLORS[d.group] : '#fff');
    node.append('text').attr('class', 'sg-label')
        .attr('dy', d => d.kind === 'term' ? radius(d) + 17 : radius(d) + 13)
        .text(d => d.kind === 'term' ? `«${d.label.length > 28 ? `${d.label.slice(0, 27)}…` : d.label}»` : d.kind === 'group' ? `${d.label} (${d.count})` : d.label.length > 22 ? `${d.label.slice(0, 21)}…` : d.label);
    node.filter(d => d.kind === 'law').append('title').text(d => `${d.title}\n${d.count} coincidencias`);

    // Neighbours light up; the rest steps back.
    const neighbours = new Map(nodes.map(n => [n.id, new Set([n.id])]));
    links.forEach(l => { neighbours.get(l.source.id || l.source).add(l.target.id || l.target); neighbours.get(l.target.id || l.target).add(l.source.id || l.source); });
    const light = d => {
        const near = d ? neighbours.get(d.id) : null;
        host.classList.toggle('is-focus', Boolean(d));
        node.classed('is-lit', n => Boolean(near?.has(n.id)));
        link.classed('is-lit', l => Boolean(d) && (l.source.id === d.id || l.target.id === d.id));
    };
    node.on('pointerenter', (_, d) => light(d)).on('pointerleave', () => light(null))
        .on('focus', (_, d) => light(d)).on('blur', () => light(null));
    node.filter(d => d.kind === 'law')
        .on('click', (event, d) => { if (!event.defaultPrevented) onSelectLaw(d.lawId); })
        .on('keydown', (event, d) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectLaw(d.lawId); } });
    node.filter(d => d.kind !== 'term').call(d3.drag()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    simulation.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    if (reduced) { simulation.stop(); for (let i = 0; i < 300; i++) simulation.tick(); simulation.on('tick')(); }
    host.querySelector('[data-sg-reset]').addEventListener('click', () => {
        nodes.forEach(n => { if (n.kind === 'law') { n.x = (hubOf.get(n.group)?.hx || 0) + (Math.random() - 0.5) * 40; n.y = (hubOf.get(n.group)?.hy || 0) + (Math.random() - 0.5) * 40; } });
        simulation.alpha(1).restart();
    });
    return () => simulation.stop();
}
