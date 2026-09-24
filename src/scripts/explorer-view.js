import { escapeHtml as esc, searchEntities, getEntityReferences } from '../lib/explorer-model.js';
import { loadExplorerCatalog, canPublishExplorer } from '../lib/explorer-store.js';
import { topicOverview, matchAcervo, topicAcervo, acervoThemes, isThematicLink, normalize, topicGraph } from '../lib/analisis-model.js';
import { getAcervoGroup, ACERVO_GROUPS } from '../lib/acervo-model.js';
import { collectionIcon } from '../lib/collection-icons.js';
import { friendlyCatalog } from '../lib/friendly-text.js';
import { openExplorerEditor } from './explorer-editor.js';
import { onAuthChange } from './auth.js';
import '../styles/explorer.css';

const views = new WeakMap();
const liveStates = new Set();
const types = { concepto: 'Concepto', instrumento: 'Instrumento', autoridad: 'Autoridad' };
const plural = { instrumento: ['instrumento', 'instrumentos'], autoridad: ['autoridad', 'autoridades'], concepto: ['concepto', 'conceptos'] };
const groupLabel = new Map(ACERVO_GROUPS.map(group => [group.id, group.label]));
const icons = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  book: '<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6ZM14 5l5 5"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};
const icon = name => `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.book}</svg>`;
const typeTag = entity => `<span class="nx-type nx-type-${esc(entity.type)}">${esc(types[entity.type] || entity.type)}</span>`;
import { officialUrl as safeUrl } from '../lib/official-url.js';
const dateLabel = value => { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Sin fecha registrada' : new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date); };
const editButton = () => `<button class="nx-button" data-edit-catalog>${icon('edit')}Gestionar contenido</button>`;
const countLabel = (count, singular, pluralForm) => `${count} ${count === 1 ? singular : pluralForm}`;
const excerpt = (value, max = 260) => { const clean = String(value || '').replace(/\s+/g, ' ').trim(); return clean.length > max ? `${clean.slice(0, max).replace(/\s+\S*$/, '')}…` : clean; };
const isNarrow = () => typeof matchMedia === 'function' && matchMedia('(max-width: 899px)').matches;

// The acervo arrives once through the app-wide `search-ready` event; views redraw when it lands.
let acervo = [];
if (typeof window !== 'undefined') {
  window.addEventListener('search-ready', event => {
    acervo = Array.isArray(event.detail?.summaries) ? event.detail.summaries : [];
    for (const state of liveStates) if (state.container.isConnected && state.catalog) draw(state);
  });
}

// Article excerpts are fetched lazily and cached for the session. Failure only hides the preview.
const previewCache = new Map();
async function loadPreviews(ids) {
  const missing = ids.filter(id => !previewCache.has(id));
  if (!missing.length) return;
  missing.forEach(id => previewCache.set(id, null));
  try {
    const { getArticlePreviews } = await import('./search-engine.js');
    const found = await getArticlePreviews(missing);
    for (const [id, preview] of found) previewCache.set(id, preview);
  } catch { missing.forEach(id => previewCache.delete(id)); }
}

async function refreshPermissions(state) {
  const request = (state.permissionRequest || 0) + 1;
  state.permissionRequest = request;
  const allowed = await canPublishExplorer().catch(() => false);
  if (state.permissionRequest !== request) return;
  state.canEdit = import.meta.env.DEV || allowed;
  const holder = state.container.querySelector('[data-editor-control]');
  if (holder && Boolean(holder.firstElementChild) !== state.canEdit) holder.innerHTML = state.canEdit ? editButton() : '';
}

const selectedTopic = state => state.catalog.topics.find(topic => topic.id === state.topicId);
const selectedEntity = state => state.catalog.entities.find(entity => entity.id === state.entityId);

function normalizeSelection(state, route = {}) {
  if (route.topicId !== undefined) state.topicId = route.topicId;
  if (route.entityId !== undefined) state.entityId = route.entityId;
  let topic = selectedTopic(state);
  if (!topic) { topic = state.catalog.topics[0]; state.topicId = topic?.id || ''; }
  if (!selectedEntity(state) || (topic && !topic.entityIds.includes(state.entityId))) state.entityId = topic?.rootEntityId || topic?.entityIds[0] || state.catalog.entities[0]?.id || '';
}

function notifyRoute(state) {
  if (state.preview) return; // Local drafts do not create public deep links.
  document.dispatchEvent(new CustomEvent('analisis:stateChange', { detail: { topicId: state.topicId, entityId: state.entityId } }));
}

const lawButton = law => `<li><button class="nx-law" data-open-law="${esc(law.id)}" title="${esc(law.titulo)}">
  <span class="nx-law-meta"><span class="nx-law-group nx-group-${esc(getAcervoGroup(law))}">${collectionIcon(getAcervoGroup(law), 13)}${esc(groupLabel.get(getAcervoGroup(law)) || 'Instrumento')}</span>${law.siglas ? `<span class="nx-law-sigla">${esc(law.siglas)}</span>` : ''}</span>
  <span class="nx-law-title">${esc(law.titulo)}</span>${icon('open')}</button></li>`;

function referencesMarkup(references, heading = 'Fundamentos') {
  return `<section class="nx-sources" aria-label="${esc(heading)}"><h3>${icon('book')}${esc(heading)}<span class="nx-count">${references.length}</span></h3>${references.length ? `<ul class="nx-source-grid">${references.map(ref => {
    const url = safeUrl(ref.url);
    const action = ref.articleId ? `<button class="nx-link" data-open-article="${esc(ref.articleId)}">Leer artículo ${icon('arrow')}</button>`
      : url ? `<a class="nx-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ${icon('open')}</a>`
      : '<span class="nx-pending">Aún no está enlazada al acervo</span>';
    const quote = ref.quote ? `<blockquote>${esc(excerpt(ref.quote, 320))}</blockquote>` : ref.articleId ? `<p class="nx-preview" data-preview-for="${esc(ref.articleId)}"><span class="nx-skeleton"></span><span class="nx-skeleton"></span></p>` : '';
    return `<li class="nx-source"><strong>${esc(ref.label || 'Referencia documental')}</strong>${quote}${action}</li>`;
  }).join('')}</ul>` : '<p class="nx-muted">Todavía no hay artículos enlazados a esta ficha.</p>'}</section>`;
}

function fillPreviews(state) {
  const slots = [...state.container.querySelectorAll('[data-preview-for]')];
  if (!slots.length) return;
  const paint = () => {
    for (const slot of slots) {
      if (!slot.isConnected || !previewCache.has(slot.dataset.previewFor)) continue;
      const preview = previewCache.get(slot.dataset.previewFor);
      if (preview === null) continue; // still loading
      slot.textContent = preview?.texto ? excerpt(preview.texto) : '';
      slot.removeAttribute('data-preview-for');
      if (!slot.textContent) slot.remove();
    }
  };
  paint();
  const ids = slots.map(slot => slot.dataset.previewFor).filter(Boolean);
  void loadPreviews(ids).then(paint);
}

function relationMarkup(state, relation) {
  const byId = id => state.catalog.entities.find(entity => entity.id === id);
  const source = byId(relation.source), target = byId(relation.target);
  if (!source || !target) return '';
  const other = source.id === state.entityId ? target : source;
  return `<li class="nx-relation"><div class="nx-relation-head"><span class="nx-relation-type">${esc(relation.label || relation.type)}</span>${relation.reviewStatus === 'verificada' ? '<span class="nx-verified">Verificada</span>' : ''}</div>
    <button class="nx-entity-link" data-select-entity="${esc(other.id)}">${typeTag(other)}<span>${esc(other.title)}</span>${icon('arrow')}</button>
    ${relation.description ? `<p>${esc(relation.description)}</p>` : ''}
    ${(relation.references || []).length ? `<details><summary>Fundamento de esta relación</summary>${referencesMarkup(relation.references, 'Evidencia')}</details>` : ''}</li>`;
}

function fichaMarkup(state, overview) {
  const entity = selectedEntity(state);
  if (!entity) return '<p class="nx-empty">Todavía no hay entidades publicadas en esta colección.</p>';
  const isRoot = entity.id === overview.root?.id;
  const references = getEntityReferences(state.catalog, entity.id);
  const typed = state.catalog.relations.filter(relation => !isThematicLink(relation) && (relation.source === entity.id || relation.target === entity.id));
  const laws = isRoot ? topicAcervo(overview.topic, acervo) : matchAcervo(entity, acervo);
  const alsoIn = state.catalog.topics.filter(topic => topic.id !== overview.topic.id && topic.entityIds.includes(entity.id));
  const lawsHeading = isRoot ? `Instrumentos del acervo con el tema «${overview.topic.title}»` : entity.type === 'instrumento' ? 'Consultar en el acervo' : entity.type === 'autoridad' ? 'Leyes que la regulan' : 'Instrumentos del acervo con este tema';
  return `<article class="nx-ficha" aria-labelledby="explorer-entity-title">
    <div class="nx-ficha-top">${typeTag(entity)}${isRoot ? '<span class="nx-muted">Introducción</span>' : `<button class="nx-back-root" data-select-entity="${esc(overview.root?.id || '')}">${esc(overview.topic.title)}</button>`}</div>
    <h2 id="explorer-entity-title" tabindex="-1">${esc(entity.title)}</h2>
    <p class="nx-description">${esc(entity.description)}</p>
    ${entity.aliases?.length ? `<p class="nx-aliases"><span>También se encuentra como</span> ${entity.aliases.map(alias => `<span class="nx-alias">${esc(alias)}</span>`).join('')}</p>` : ''}
    ${laws.length ? `<section class="nx-block"><h3>${esc(lawsHeading)}<span class="nx-count">${laws.length}</span></h3><ul class="nx-laws">${laws.slice(0, 8).map(lawButton).join('')}</ul>${laws.length > 8 ? `<p class="nx-muted">Y ${laws.length - 8} más en el acervo.</p>` : ''}</section>` : ''}
    ${typed.length ? `<section class="nx-block"><h3>Relaciones<span class="nx-count">${typed.length}</span></h3><ul class="nx-relations">${typed.map(relation => relationMarkup(state, relation)).join('')}</ul></section>`
      : isRoot ? '' : '<p class="nx-note">Forma parte de este recorrido.</p>'}
    ${alsoIn.length ? `<p class="nx-also"><span>También en</span>${alsoIn.map(topic => `<button class="nx-alias nx-alias-link" data-select-topic="${esc(topic.id)}" data-entity="${esc(entity.id)}">${esc(topic.title)}</button>`).join('')}</p>` : ''}
    <div id="explorer-foundations" tabindex="-1">${referencesMarkup(references)}</div>
  </article>`;
}

function membersMarkup(state, overview) {
  const rootActive = state.entityId === overview.root?.id;
  return `<nav class="nx-members" aria-label="Contenido del recorrido">
    ${overview.root ? `<button class="nx-member nx-member-root ${rootActive ? 'is-selected' : ''}" data-select-entity="${esc(overview.root.id)}" ${rootActive ? 'aria-current="true"' : ''}><span>Presentación</span>${icon('arrow')}</button>` : ''}
    ${['instrumento', 'autoridad', 'concepto'].filter(type => overview.groups[type].length).map(type => `<div class="nx-member-group"><h3>${esc(plural[type][1][0].toUpperCase() + plural[type][1].slice(1))}<span class="nx-count">${overview.groups[type].length}</span></h3>
      ${overview.groups[type].map(entity => `<button class="nx-member nx-member-${esc(type)} ${entity.id === state.entityId ? 'is-selected' : ''}" data-select-entity="${esc(entity.id)}" ${entity.id === state.entityId ? 'aria-current="true"' : ''}><span>${esc(entity.title)}</span>${icon('arrow')}</button>`).join('')}</div>`).join('')}
  </nav>`;
}

function topicCards(state) {
  return state.catalog.topics.map(topic => {
    const overview = topicOverview(state.catalog, topic.id);
    const counts = ['instrumento', 'autoridad', 'concepto'].filter(type => overview.groups[type].length).map(type => countLabel(overview.groups[type].length, ...plural[type])).join(' · ');
    const active = topic.id === state.topicId;
    return `<li><button class="nx-topic-card ${active ? 'is-selected' : ''}" data-select-topic="${esc(topic.id)}" aria-pressed="${active}">
      <span class="nx-topic-title">${esc(topic.title)}</span>
      <span class="nx-topic-summary">${esc(excerpt(overview.root?.description || topic.summary || '', 120))}</span>
      <span class="nx-topic-counts">${esc(counts || 'Sin entidades')}</span></button></li>`;
  }).join('');
}

function drawSearch(state) {
  const target = state.container.querySelector('[data-explorer-results]');
  const status = state.container.querySelector('[data-result-count]');
  if (!target) return;
  const query = state.query.trim();
  if (!query && !state.type) { target.innerHTML = ''; target.hidden = true; status.textContent = ''; return; }
  const results = searchEntities(state.catalog, query, { type: state.type || undefined });
  const topicOf = entity => state.catalog.topics.find(topic => topic.id === state.topicId && topic.entityIds.includes(entity.id)) || state.catalog.topics.find(topic => topic.entityIds.includes(entity.id));
  target.hidden = false;
  target.innerHTML = results.length ? results.map(entity => `<button class="nx-result" data-select-entity="${esc(entity.id)}" data-topic="${esc(topicOf(entity)?.id || '')}">${typeTag(entity)}<span class="nx-result-title">${esc(entity.title)}</span><span class="nx-muted">${esc(topicOf(entity)?.title || '')}</span></button>`).join('') : '<p class="nx-empty">No hay coincidencias. Prueba otra palabra o cambia el tipo.</p>';
  status.textContent = `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`;
}

// ── Relationship map ────────────────────────────────────────────────────────
// Built on the fly for the selected collection from real catalogue data (see topicGraph).
// Columns: collection → its entities → the laws they cite or that document them.
const GRAPH = { width: 900, top: 34, row: 44, node: 34, root: { x: 0, w: 190 }, entity: { x: 270, w: 290 }, law: { x: 690, w: 210 } };
// Phones drop the collection column: the card above already names it.
const GRAPH_NARROW = { width: 400, top: 30, row: 42, node: 34, root: null, entity: { x: 0, w: 220 }, law: { x: 272, w: 128 } };
const edgeKinds = { member: 'Forma parte del recorrido', fundamento: 'Artículos que lo sustentan', documento: 'Documento en el acervo' };

function graphLayout(graph, G) {
  const pos = new Map();
  const n = graph.entities.length;
  let y = G.top, previousType = null;
  graph.entities.forEach(entity => {
    if (previousType && entity.type !== previousType) y += 12; // breathing room between entity types
    pos.set(entity.id, y); previousType = entity.type; y += G.row;
  });
  const entityBottom = y;
  // Laws sit at the mean height of the entities citing them, then are pushed apart to avoid overlap.
  const desired = graph.laws.map(law => {
    const ys = graph.edges.filter(edge => edge.to === law.id).map(edge => pos.get(edge.from)).filter(Number.isFinite);
    return { law, y: ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : G.top };
  }).sort((a, b) => a.y - b.y);
  let cursor = G.top;
  for (const item of desired) { item.y = Math.max(item.y, cursor); cursor = item.y + G.row; }
  const overflow = cursor - Math.max(entityBottom, cursor);
  desired.forEach(item => pos.set(item.law.id, item.y - Math.max(0, overflow)));
  const height = Math.max(entityBottom, cursor) + 8;
  pos.set('root', n ? (G.top + entityBottom - G.row) / 2 : G.top);
  return { pos, height };
}

function graphMarkup(state) {
  const graph = topicGraph(state.catalog, state.topicId, acervo);
  if (!graph || !graph.entities.length) return '';
  const G = isNarrow() ? GRAPH_NARROW : GRAPH;
  if (!G.root) graph.edges = graph.edges.filter(edge => edge.kind !== 'member');
  const { pos, height } = graphLayout(graph, G);
  const pct = value => `${(value / G.width) * 100}%`;
  const mid = G.node / 2;
  const column = node => node === 'root' ? G.root : node.startsWith('law:') ? G.law : G.entity;
  const entityIndex = new Map(graph.entities.map((entity, index) => [entity.id, index]));
  const lawIndex = new Map(graph.laws.map((law, index) => [law.id, index]));
  const edges = graph.edges.map((edge, index) => {
    const a = column(edge.from), b = column(edge.to);
    const x1 = a.x + a.w, y1 = pos.get(edge.from) + mid, x2 = b.x, y2 = pos.get(edge.to) + mid, cx = (x1 + x2) / 2;
    const d = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    const delay = edge.kind === 'member' ? 200 + (entityIndex.get(edge.to) || 0) * 35 : 650 + index * 12;
    const width = edge.kind === 'fundamento' ? Math.min(1.2 + edge.weight * 0.7, 4) : edge.kind === 'documento' ? 2.2 : 1.2;
    const tip = edge.kind === 'member' ? '' : `${edgeKinds[edge.kind]}${edge.articles?.length ? `: ${edge.articles.join(', ')}` : ''}`;
    return `<g class="nx-edge nx-edge-${edge.kind}" data-from="${esc(edge.from)}" data-to="${esc(edge.to)}" style="--d:${delay}ms;--w:${width}">${tip ? `<title>${esc(tip)}</title>` : ''}<path class="nx-edge-base" pathLength="1" d="${d}"/><path class="nx-edge-flow" d="${d}"/></g>`;
  }).join('');
  const node = (id, col, y, cls, inner, attrs, delay) => `<button class="nx-node ${cls}" data-node="${esc(id)}" ${attrs} style="left:${pct(col.x)};width:${pct(col.w)};top:${y}px;--d:${delay}ms">${inner}</button>`;
  const rootNode = graph.root && G.root ? node('root', G.root, pos.get('root'), 'nx-node-root', `<span>${esc(graph.topic.title)}</span>`, `data-select-entity="${esc(graph.root.id)}" title="Presentación del recorrido"`, 0) : '';
  const entityNodes = graph.entities.map((entity, index) => node(entity.id, G.entity, pos.get(entity.id), `nx-node-entity nx-node-${esc(entity.type)}`, `<i aria-hidden="true"></i><span>${esc(entity.label)}</span>`, `data-select-entity="${esc(entity.id)}" title="${esc(`${types[entity.type]}: ${entity.label}`)}"`, 120 + index * 35)).join('');
  const lawNodes = graph.laws.map(law => node(law.id, G.law, pos.get(law.id), `nx-node-law ${law.lawId ? '' : 'is-external'} ${law.group ? `nx-group-${esc(law.group)}` : ''}`,
    `${law.group ? `<span class="nx-node-ico">${collectionIcon(law.group, 14)}</span>` : ''}<strong>${esc(law.label)}</strong>${law.lawId ? icon('open') : ''}`,
    law.lawId ? `data-open-law="${esc(law.lawId)}" title="${esc(`Abrir ${law.title}`)}"` : `aria-disabled="true" title="${esc(`${law.title}: todavía no está en el acervo`)}"`, 700 + (lawIndex.get(law.id) || 0) * 45)).join('');
  const citations = graph.edges.filter(edge => edge.kind !== 'member').length;
  return `<section class="nx-graph" data-graph aria-label="Mapa de relaciones del recorrido">
    <div class="nx-graph-head"><h3>Mapa del recorrido</h3><span class="nx-muted">${countLabel(graph.entities.length, 'elemento', 'elementos')} · ${countLabel(graph.laws.length, 'documento', 'documentos')} · ${countLabel(citations, 'conexión con fundamento', 'conexiones con fundamento')}</span>
      <button class="nx-link nx-replay" data-replay-graph>Volver a trazar</button></div>
    <div class="nx-graph-scroll" tabindex="0" aria-label="Mapa desplazable horizontalmente"><div class="nx-graph-canvas" style="height:${height}px">
      <div class="nx-graph-cols" aria-hidden="true">${G.root ? `<span style="left:${pct(G.root.x)}">Recorrido</span>` : ''}<span style="left:${pct(G.entity.x)}">Elementos</span><span style="left:${pct(G.law.x)}">Leyes y documentos</span></div>
      <svg class="nx-graph-edges" viewBox="0 0 ${G.width} ${height}" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>
      ${rootNode}${entityNodes}${lawNodes}
    </div></div>
    <ul class="nx-graph-legend" aria-label="Leyenda">${G.root ? '<li><i class="nx-lg-member"></i>Forma parte del recorrido</li>' : ''}<li><i class="nx-lg-fundamento"></i>Artículos que lo sustentan (más grueso = más artículos)</li><li><i class="nx-lg-documento"></i>Documento en el acervo</li><li><i class="nx-lg-external"></i>Aún no está en el acervo</li></ul>
  </section>`;
}

/** Light the paths through a node; everything else steps back. */
function lightGraph(state, nodeId) {
  const graphEl = state.container.querySelector('[data-graph]');
  if (!graphEl) return;
  const focus = nodeId || (state.entityId && state.entityId !== selectedTopic(state)?.rootEntityId ? state.entityId : '');
  graphEl.classList.toggle('is-focus', Boolean(focus));
  const lit = new Set(focus ? [focus] : []);
  graphEl.querySelectorAll('.nx-edge').forEach(edge => {
    const on = Boolean(focus) && (edge.dataset.from === focus || edge.dataset.to === focus || (focus === 'root' && edge.dataset.from === 'root'));
    edge.classList.toggle('is-lit', on);
    if (on) { lit.add(edge.dataset.from); lit.add(edge.dataset.to); }
  });
  // A law lights its citing entities; carry the path back to the collection.
  if (focus?.startsWith('law:')) graphEl.querySelectorAll('.nx-edge-member').forEach(edge => { if (lit.has(edge.dataset.to)) { edge.classList.add('is-lit'); lit.add('root'); } });
  graphEl.querySelectorAll('.nx-node').forEach(node => { node.classList.toggle('is-lit', lit.has(node.dataset.node)); node.classList.toggle('is-selected', node.dataset.node === state.entityId || (node.dataset.node === 'root' && state.entityId === selectedTopic(state)?.rootEntityId)); });
}

function animateGraph(state) {
  const graphEl = state.container.querySelector('[data-graph]');
  if (!graphEl) return;
  graphEl.classList.remove('is-drawn', 'is-settled');
  clearTimeout(state.settleTimer);
  state.settleTimer = setTimeout(() => graphEl.classList.add('is-settled'), 1800);
  void graphEl.offsetWidth; // restart transitions
  const run = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => callback();
  run(() => graphEl.classList.add('is-drawn'));
  lightGraph(state);
  graphEl.onpointerover = event => { graphEl.classList.add('is-settled'); const node = event.target.closest('.nx-node'); if (node) lightGraph(state, node.dataset.node); };
  graphEl.onfocusin = event => { const node = event.target.closest('.nx-node'); if (node) lightGraph(state, node.dataset.node); };
  graphEl.onpointerleave = () => lightGraph(state);
  graphEl.onfocusout = event => { if (!graphEl.contains(event.relatedTarget)) lightGraph(state); };
}

function drawEntity(state, focusHeading = false) {
  const overview = topicOverview(state.catalog, state.topicId);
  const body = state.container.querySelector('.nx-topic-body');
  if (!overview || !body) return drawTopic(state, focusHeading);
  body.innerHTML = `${membersMarkup(state, overview)}<div class="nx-ficha-wrap" data-explorer-detail>${fichaMarkup(state, overview)}</div>`;
  lightGraph(state);
  fillPreviews(state);
  if (focusHeading) {
    const heading = body.querySelector('#explorer-entity-title');
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }
}

function drawTopic(state, focusHeading = false) {
  const overview = topicOverview(state.catalog, state.topicId);
  const target = state.container.querySelector('[data-explorer-topic]');
  if (!target) return;
  if (!overview) { target.innerHTML = '<p class="nx-empty">Todavía no hay recorridos publicados.</p>'; return; }
  target.innerHTML = `<div class="nx-topic-head"><p class="nx-eyebrow">Recorrido</p><p class="nx-topic-name">${esc(overview.topic.title)}</p><span class="nx-muted">${countLabel(overview.members, 'entidad', 'entidades')}${overview.typedRelations.length ? ` · ${countLabel(overview.typedRelations.length, 'relación', 'relaciones')}` : ''}</span></div>
    ${graphMarkup(state)}
    <div class="nx-topic-body">${membersMarkup(state, overview)}<div class="nx-ficha-wrap" data-explorer-detail>${fichaMarkup(state, overview)}</div></div>`;
  state.container.querySelectorAll('[data-select-topic]').forEach(button => {
    const active = button.dataset.selectTopic === state.topicId && !button.dataset.entity;
    if (button.classList.contains('nx-topic-card')) { button.classList.toggle('is-selected', active); button.setAttribute('aria-pressed', String(active)); }
  });
  animateGraph(state);
  fillPreviews(state);
  if (focusHeading) {
    const heading = target.querySelector('#explorer-entity-title');
    heading?.focus({ preventScroll: true });
    if (isNarrow()) heading?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
}

function drawThemes(state) {
  const target = state.container.querySelector('[data-acervo-themes]');
  if (!target) return;
  const all = acervoThemes(acervo);
  if (!acervo.length) { target.innerHTML = '<p class="nx-empty" role="status">Cargando instrumentos del acervo…</p>'; return; }
  const filter = normalize(state.themeQuery);
  const shown = filter ? all.filter(theme => theme.key.includes(filter)) : all;
  const selected = all.find(theme => theme.key === state.themeKey) || null;
  const max = Math.max(...all.map(theme => theme.count), 1);
  target.innerHTML = `<div class="nx-themes-layout"><div><div class="nx-search">${icon('search')}<input id="explorer-theme-search" type="search" placeholder="Filtrar temas" autocomplete="off" value="${esc(state.themeQuery)}" aria-label="Filtrar temas del acervo"></div>
    <p class="nx-muted nx-themes-status" role="status">${countLabel(shown.length, 'tema', 'temas')} en ${countLabel(acervo.length, 'instrumento', 'instrumentos')}</p>
    <ul class="nx-theme-list">${shown.map(theme => `<li><button class="nx-theme ${theme.key === state.themeKey ? 'is-selected' : ''}" data-theme="${esc(theme.key)}" aria-pressed="${theme.key === state.themeKey}"><span class="nx-theme-label">${esc(theme.label)}</span><span class="nx-theme-bar"><span style="width:${(theme.count / max) * 100}%"></span></span><span class="nx-theme-count">${theme.count}</span></button></li>`).join('') || '<li class="nx-empty">Sin temas que coincidan.</li>'}</ul></div>
    <section class="nx-theme-detail" aria-live="polite">${selected ? `<p class="nx-eyebrow">Tema del acervo</p><h2 class="nx-theme-title">${esc(selected.label)}</h2><p class="nx-muted">${countLabel(selected.count, 'instrumento etiquetado', 'instrumentos etiquetados')} con este tema.</p><ul class="nx-laws">${selected.laws.map(lawButton).join('')}</ul>`
      : '<div class="nx-theme-placeholder"><p class="nx-topic-name">Elige un tema</p><p class="nx-muted">Los temas provienen de las etiquetas de cada instrumento del acervo y se actualizan al incorporar nuevos documentos.</p></div>'}</section></div>`;
  const input = target.querySelector('#explorer-theme-search');
  input.addEventListener('input', event => { state.themeQuery = event.target.value; drawThemes(state); const next = state.container.querySelector('#explorer-theme-search'); next.focus(); next.setSelectionRange(next.value.length, next.value.length); });
}

function draw(state) {
  const { container, catalog } = state;
  normalizeSelection(state);
  const themeCount = acervoThemes(acervo).length;
  container.innerHTML = `<div class="nx-explorer">
    <div class="nx-header"><div><p class="nx-eyebrow">Análisis por tema</p><h1>Temas del marco normativo</h1><p class="nx-intro">Explora por tema qué leyes, planes y autoridades intervienen y en qué artículos se apoyan.</p></div>
      <div class="nx-header-aside"><span>Versión ${esc(catalog.revision)}</span><span>Actualizado el ${esc(dateLabel(catalog.updatedAt))}</span><span data-editor-control>${state.canEdit ? editButton() : ''}</span></div></div>
    ${state.preview ? '<div class="nx-notice" role="status"><span><strong>Vista previa de un borrador local.</strong> Estos cambios todavía no están publicados.</span><button class="nx-button" data-return-published>Volver al contenido publicado</button></div>' : ''}
    ${state.warning ? `<details class="nx-notice nx-catalog-notice"><summary>Se muestra la copia incluida del catálogo</summary><p>${esc(state.warning)}</p></details>` : ''}
    <div class="nx-tabs" role="tablist" aria-label="Tipo de análisis">
      <button role="tab" id="nx-tab-routes" aria-controls="nx-panel-routes" aria-selected="${state.tab === 'routes'}" data-tab="routes">Recorridos por tema<span class="nx-count">${catalog.topics.length}</span></button>
      <button role="tab" id="nx-tab-themes" aria-controls="nx-panel-themes" aria-selected="${state.tab === 'themes'}" data-tab="themes">Temas del acervo<span class="nx-count">${themeCount || '…'}</span></button>
    </div>
    <div id="nx-panel-routes" role="tabpanel" aria-labelledby="nx-tab-routes" ${state.tab === 'routes' ? '' : 'hidden'}>
      <div class="nx-finder"><div class="nx-search">${icon('search')}<input id="explorer-search" type="search" placeholder="Buscar concepto, instrumento o autoridad" autocomplete="off" value="${esc(state.query)}" aria-label="Buscar en los recorridos"></div>
        <select id="explorer-type" aria-label="Tipo de entidad"><option value="">Todos los tipos</option>${Object.entries(types).map(([value, label]) => `<option value="${value}" ${state.type === value ? 'selected' : ''}>${label}</option>`).join('')}</select>
        <p class="nx-result-count" data-result-count role="status" aria-live="polite"></p>
        <nav class="nx-results" data-explorer-results aria-label="Resultados de búsqueda" hidden></nav></div>
      <ul class="nx-topic-cards" aria-label="Recorridos disponibles">${topicCards(state)}</ul>
      <section class="nx-topic" data-explorer-topic aria-label="Recorrido seleccionado"></section>
    </div>
    <div id="nx-panel-themes" role="tabpanel" aria-labelledby="nx-tab-themes" data-acervo-themes ${state.tab === 'themes' ? '' : 'hidden'}></div>
    <div class="nx-foot"><span>Estas explicaciones son una guía. Para el alcance legal, revisa siempre el texto oficial.</span><span>${catalog.entities.length} entidades · ${catalog.relations.length} relaciones registradas</span></div>
  </div>`;
  drawSearch(state); drawTopic(state);
  if (state.tab === 'themes') drawThemes(state);
  container.querySelector('#explorer-search').addEventListener('input', event => { state.query = event.target.value; drawSearch(state); });
  container.querySelector('#explorer-type').addEventListener('change', event => { state.type = event.target.value; drawSearch(state); });
  container.onclick = async event => {
    const button = event.target.closest('button, [data-go-sources]');
    if (!button || !container.contains(button)) return;
    if (button.hasAttribute('data-select-entity')) {
      const previousTopic = state.topicId;
      if (button.dataset.topic) state.topicId = button.dataset.topic;
      state.entityId = button.dataset.selectEntity;
      if (button.classList.contains('nx-result')) { state.query = ''; state.type = ''; container.querySelector('#explorer-search').value = ''; container.querySelector('#explorer-type').value = ''; drawSearch(state); }
      normalizeSelection(state);
      if (state.topicId === previousTopic) drawEntity(state, !button.classList.contains('nx-node')); else drawTopic(state, true);
      notifyRoute(state);
    } else if (button.hasAttribute('data-replay-graph')) {
      animateGraph(state);
    } else if (button.hasAttribute('data-select-topic')) {
      state.topicId = button.dataset.selectTopic;
      state.entityId = button.dataset.entity || selectedTopic(state)?.rootEntityId;
      normalizeSelection(state); drawTopic(state, Boolean(button.dataset.entity)); notifyRoute(state);
      if (!button.dataset.entity && isNarrow()) container.querySelector('[data-explorer-topic]')?.scrollIntoView({ block: 'start', behavior: 'auto' });
    } else if (button.hasAttribute('data-tab')) {
      state.tab = button.dataset.tab;
      container.querySelectorAll('[role=tab]').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.tab === state.tab)));
      container.querySelector('#nx-panel-routes').hidden = state.tab !== 'routes';
      container.querySelector('#nx-panel-themes').hidden = state.tab !== 'themes';
      if (state.tab === 'themes') drawThemes(state);
    } else if (button.hasAttribute('data-theme')) {
      state.themeKey = state.themeKey === button.dataset.theme ? '' : button.dataset.theme;
      drawThemes(state);
      if (state.themeKey && isNarrow()) container.querySelector('.nx-theme-detail')?.scrollIntoView({ block: 'start', behavior: 'auto' });
    } else if (button.hasAttribute('data-open-law')) {
      document.dispatchEvent(new CustomEvent('analisis:openLaw', { detail: { id: button.dataset.openLaw } }));
    } else if (button.hasAttribute('data-open-article')) {
      const list = getEntityReferences(state.catalog, state.entityId).map(ref => ref.articleId).filter(Boolean);
      document.dispatchEvent(new CustomEvent('analisis:openArticle', { detail: { id: button.dataset.openArticle, list: [...new Set([...list, button.dataset.openArticle])] } }));
    } else if (button.hasAttribute('data-return-published')) { state.catalog = state.publishedCatalog; state.preview = false; draw(state); notifyRoute(state); }
    else if (button.hasAttribute('data-edit-catalog')) {
      try {
        await openExplorerEditor({ catalog: state.catalog, onPreview: catalog => { state.catalog = catalog; state.preview = true; draw(state); }, onPublished: catalog => { state.catalog = catalog; state.publishedCatalog = catalog; state.preview = false; state.warning = ''; draw(state); notifyRoute(state); } });
      } catch (error) { state.warning = error.message || 'No se pudo abrir el editor.'; draw(state); }
    }
  };
}

export async function renderAnalisisView(container, route = {}) {
  let state = views.get(container);
  if (!state) {
    state = { container, query: '', type: '', tab: 'routes', themeQuery: '', themeKey: '', topicId: '', entityId: '', canEdit: import.meta.env.DEV, preview: false };
    views.set(container, state);
    liveStates.add(state);
    container.innerHTML = '<div class="nx-explorer nx-loading" role="status">Cargando conceptos y relaciones…</div>';
    state.pending = loadExplorerCatalog().then(result => { state.catalog = friendlyCatalog(result.catalog); state.publishedCatalog = state.catalog; state.warning = result.warning || ''; });
    onAuthChange(() => { if (container.isConnected) void refreshPermissions(state); });
  }
  state.requestedRoute = route;
  try { await state.pending; normalizeSelection(state, state.requestedRoute); draw(state); void refreshPermissions(state); }
  catch {
    views.delete(container); liveStates.delete(state);
    container.innerHTML = '<div class="nx-explorer nx-empty" role="alert"><p>No se pudo cargar el explorador.</p><button class="nx-button" data-retry-explorer>Reintentar</button></div>';
    container.querySelector('[data-retry-explorer]').onclick = () => renderAnalisisView(container, route);
  }
}
