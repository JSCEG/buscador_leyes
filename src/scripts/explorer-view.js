import { escapeHtml as esc, searchEntities, getNeighborhood, getEntityReferences } from '../lib/explorer-model.js';
import { loadExplorerCatalog, canPublishExplorer } from '../lib/explorer-store.js';
import { openExplorerEditor } from './explorer-editor.js';
import { onAuthChange } from './auth.js';
import '../styles/explorer.css';

const views = new WeakMap();
const types = { concepto: 'Concepto', instrumento: 'Instrumento', autoridad: 'Autoridad' };
const icons = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  network: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="m10.5 8-4 8m7-8 4 8"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  book: '<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6ZM14 5l5 5"/>',
};
const icon = name => `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.book}</svg>`;
const typeTag = entity => `<span class="nx-type nx-type-${entity.type}">${esc(types[entity.type] || entity.type)}</span>`;
const safeUrl = url => { try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; } };
const dateLabel = value => { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Sin fecha registrada' : new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date); };
const editButton = () => `<button class="nx-button" data-edit-catalog>${icon('edit')}Gestionar contenido</button>`;
const countLabel = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

async function refreshPermissions(state) {
  const request = (state.permissionRequest || 0) + 1;
  state.permissionRequest = request;
  const allowed = await canPublishExplorer().catch(() => false);
  if (state.permissionRequest !== request) return;
  state.canEdit = import.meta.env.DEV || allowed;
  const holder = state.container.querySelector('[data-editor-control]');
  if (holder && Boolean(holder.firstElementChild) !== state.canEdit) holder.innerHTML = state.canEdit ? editButton() : '';
}

function selectedTopic(state) { return state.catalog.topics.find(topic => topic.id === state.topicId); }
function selectedEntity(state) { return state.catalog.entities.find(entity => entity.id === state.entityId); }

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

function drawResults(state) {
  const results = searchEntities(state.catalog, state.query, { topicId: state.topicId, type: state.type || undefined });
  const target = state.container.querySelector('[data-explorer-results]');
  if (!target) return;
  target.innerHTML = results.length ? results.map(entity => `<button class="nx-result ${entity.id === state.entityId ? 'is-selected' : ''}" data-select-entity="${esc(entity.id)}" ${entity.id === state.entityId ? 'aria-current="true"' : ''}>${typeTag(entity)}<span class="nx-result-title">${esc(entity.title)}</span>${icon('arrow')}</button>`).join('') : '<p class="nx-empty">No hay coincidencias. Prueba otra palabra o cambia el filtro.</p>';
  state.container.querySelector('[data-result-count]').textContent = `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`;
}

function referencesMarkup(references, heading = 'Fundamentos y fuentes') {
  return `<section class="nx-sources" aria-label="${esc(heading)}"><h3>${icon('book')}${esc(heading)}</h3>${references.length ? `<ul>${references.map(ref => {
    const url = safeUrl(ref.url);
    return `<li><div><strong>${esc(ref.label || 'Referencia documental')}</strong>${ref.quote ? `<blockquote>${esc(ref.quote)}</blockquote>` : ''}</div>${ref.articleId ? `<button class="nx-link" data-open-article="${esc(ref.articleId)}">Ver artículo ${icon('arrow')}</button>` : url ? `<a class="nx-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ${icon('arrow')}</a>` : '<span class="nx-muted">Referencia por vincular al acervo</span>'}</li>`;
  }).join('')}</ul>` : '<p class="nx-muted">Esta ficha todavía no tiene referencias documentales vinculadas.</p>'}</section>`;
}

function relationshipMarkup(state, relation) {
  const source = state.catalog.entities.find(entity => entity.id === relation.source);
  const target = state.catalog.entities.find(entity => entity.id === relation.target);
  if (!source || !target) return '';
  const other = source.id === state.entityId ? target : source;
  const isDirect = relation.source === state.entityId || relation.target === state.entityId;
  return `<li class="nx-relation"><div class="nx-relation-heading"><span class="nx-muted">${esc(relation.label || relation.type)}</span><span class="nx-review">${relation.reviewStatus === 'verificada' ? 'Relación verificada' : 'Relación editorial'}</span></div>
    <button class="nx-entity-link" data-select-entity="${esc(other.id)}">${esc(isDirect ? other.title : `${source.title} / ${target.title}`)}${icon('arrow')}</button>
    ${relation.description ? `<p>${esc(relation.description)}</p>` : ''}
    <details><summary>Consultar fundamento</summary>${referencesMarkup(relation.references || [], 'Evidencia de esta relación')}</details></li>`;
}

// The map renders actual edges, including cross-links and cycles. Its layout is visual,
// not a legal hierarchy; the equivalent list exposes every relation and its evidence.
function graphMarkup(state, neighborhood) {
  const center = selectedEntity(state);
  const others = neighborhood.entities.filter(entity => entity.id !== center.id);
  const shown = [center, ...others.slice(0, 12)];
  const width = 800, nodeWidth = 224, nodeHeight = 86;
  const positions = new Map([[center.id, { x: 288, y: 18 }]]);
  shown.slice(1).forEach((entity, index) => positions.set(entity.id, { x: 16 + (index % 3) * 272, y: 164 + Math.floor(index / 3) * 132 }));
  const height = Math.max(300, 164 + Math.ceil(others.slice(0, 12).length / 3) * 132);
  const edges = neighborhood.relations.filter(relation => positions.has(relation.source) && positions.has(relation.target));
  const paths = edges.map(relation => {
    const from = positions.get(relation.source), to = positions.get(relation.target);
    const downward = to.y > from.y, sameRow = to.y === from.y;
    const x1 = from.x + nodeWidth / 2, y1 = from.y + (downward || sameRow ? nodeHeight : 0), x2 = to.x + nodeWidth / 2, y2 = to.y + (downward ? 0 : nodeHeight);
    return `<path d="M${x1},${y1} C${x1},${y1 + (downward || sameRow ? 30 : -30)} ${x2},${y2 + (downward ? -30 : 30)} ${x2},${y2}" class="${relation.reviewStatus === 'verificada' ? 'nx-edge-verified' : ''}"/>`;
  }).join('');
  return `<p class="nx-map-help">Selecciona una entidad para explorar sus relaciones. Las conexiones editoriales no representan una jerarquía normativa.</p>
    <div class="nx-map-scroll" role="region" aria-label="Mapa de relaciones, desplazable horizontalmente" tabindex="0"><div class="nx-map" style="--map-height:${height}px">
    <svg class="nx-edges" aria-hidden="true" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${paths}</svg>
    ${shown.map(entity => { const position = positions.get(entity.id); return `<button class="nx-map-node ${entity.id === center.id ? 'is-center' : ''}" data-select-entity="${esc(entity.id)}" style="left:${position.x / width * 100}%;top:${position.y}px;width:${nodeWidth / width * 100}%" title="${esc(entity.title)}" ${entity.id === center.id ? 'aria-current="true"' : ''}>${typeTag(entity)}<span>${esc(entity.title)}</span></button>`; }).join('')}
    </div></div><div class="nx-map-footer"><span>${countLabel(shown.length, 'entidad', 'entidades')} · ${countLabel(edges.length, 'conexión visible', 'conexiones visibles')}</span><button class="nx-link" data-view="list">Ver todas las relaciones ${icon('list')}</button></div>${others.length > 12 ? '<p class="nx-muted">El mapa muestra una selección para mantenerlo legible. La lista incluye todas las relaciones del alcance elegido.</p>' : ''}`;
}

function drawDetail(state, focusHeading = false) {
  const entity = selectedEntity(state), topic = selectedTopic(state);
  const detail = state.container.querySelector('[data-explorer-detail]');
  if (!entity) { detail.innerHTML = '<p class="nx-empty">Todavía no hay entidades publicadas en esta colección.</p>'; return; }
  const neighborhood = getNeighborhood(state.catalog, entity.id, { depth: state.depth, topicId: state.topicId });
  const references = getEntityReferences(state.catalog, entity.id);
  const directCount = state.catalog.relations.filter(relation => (relation.source === entity.id || relation.target === entity.id) && topic?.entityIds.includes(relation.source) && topic?.entityIds.includes(relation.target)).length;
  detail.innerHTML = `<article class="nx-entity"><div class="nx-entity-top">${typeTag(entity)}<span class="nx-muted">${esc(topic?.title || 'Marco normativo')}</span></div>
    <h2 id="explorer-entity-title" tabindex="-1">${esc(entity.title)}</h2><p class="nx-description">${esc(entity.description)}</p>
    ${entity.aliases?.length ? `<p class="nx-aliases"><span>También se encuentra como</span> ${entity.aliases.map(alias => `<span class="nx-alias">${esc(alias)}</span>`).join('')}</p>` : ''}
    <div class="nx-entity-meta"><span>${countLabel(directCount, 'relación directa', 'relaciones directas')}</span><span>${countLabel(references.length, 'referencia', 'referencias')}</span><a href="#explorer-foundations" data-go-sources>Consultar fundamentos ${icon('arrow')}</a></div>
    <div class="nx-section-head"><h3>Explorar relaciones</h3><div class="nx-view-switch" role="group" aria-label="Vista de relaciones"><button data-view="map" aria-pressed="${state.view === 'map'}">${icon('network')}Mapa</button><button data-view="list" aria-pressed="${state.view === 'list'}">${icon('list')}Lista</button></div></div>
    <div class="nx-scope"><label for="explorer-depth">Alcance</label><select id="explorer-depth"><option value="1" ${state.depth === 1 ? 'selected' : ''}>Relaciones directas</option><option value="2" ${state.depth === 2 ? 'selected' : ''}>Hasta dos conexiones</option></select><span class="nx-muted">${countLabel(neighborhood.relations.length, 'relación', 'relaciones')} en esta colección</span></div>
    <div data-relation-view>${neighborhood.relations.length ? state.view === 'map' ? graphMarkup(state, neighborhood) : `<ul class="nx-relations">${neighborhood.relations.map(relation => relationshipMarkup(state, relation)).join('')}</ul>` : '<p class="nx-empty">No hay relaciones registradas para esta entidad en la colección seleccionada.</p>'}</div>
    <div id="explorer-foundations" tabindex="-1">${referencesMarkup(references)}</div>
    <p class="nx-editorial-note">Las explicaciones son contenido editorial de apoyo. Consulta el fundamento y el documento original para conocer su alcance.</p></article>`;
  detail.querySelector('#explorer-depth')?.addEventListener('change', event => { state.depth = Number(event.target.value); drawDetail(state); state.container.querySelector('#explorer-depth')?.focus(); });
  if (focusHeading) detail.querySelector('h2')?.focus({ preventScroll: true });
}

function draw(state) {
  const { container, catalog } = state;
  normalizeSelection(state);
  container.innerHTML = `<div class="nx-explorer"><header class="nx-header"><div><button class="nx-back" data-go-home>${icon('back')}Inicio</button><p class="nx-eyebrow">Temas transversales</p><h1>Explorador del marco normativo</h1><p>Conoce los conceptos, sus instrumentos y el fundamento que los relaciona.</p></div><div class="nx-header-aside"><span>Contenido editorial · revisión ${catalog.revision}</span><span>Actualizado el ${esc(dateLabel(catalog.updatedAt))}</span><span data-editor-control>${state.canEdit ? editButton() : ''}</span></div></header>
    ${state.preview ? '<div class="nx-notice" role="status"><span><strong>Vista previa de un borrador local.</strong> Estos cambios todavía no están publicados.</span><button class="nx-button" data-return-published>Volver al contenido publicado</button></div>' : ''}
    ${state.warning ? `<details class="nx-notice nx-catalog-notice"><summary>Se muestra la copia incluida del catálogo</summary><p>${esc(state.warning)}</p></details>` : ''}
    <div class="nx-collection"><label for="explorer-topic">Colección temática</label><select id="explorer-topic">${catalog.topics.map(topic => `<option value="${esc(topic.id)}" ${topic.id === state.topicId ? 'selected' : ''}>${esc(topic.title)}</option>`).join('')}</select><span>${catalog.topics.length} colecciones disponibles</span></div>
    <div class="nx-workspace"><aside class="nx-sidebar"><details class="nx-discovery" ${typeof matchMedia !== 'function' || matchMedia('(min-width: 900px)').matches ? 'open' : ''}><summary>${icon('search')}Buscar conceptos e instrumentos</summary><div class="nx-discovery-body"><label class="nx-label" for="explorer-search">Buscar en esta colección</label><div class="nx-search">${icon('search')}<input id="explorer-search" type="search" placeholder="Nombre o palabra clave" autocomplete="off" value="${esc(state.query)}"></div><label class="nx-label" for="explorer-type">Tipo de entidad</label><select id="explorer-type"><option value="">Todos los tipos</option>${Object.entries(types).map(([value, label]) => `<option value="${value}" ${state.type === value ? 'selected' : ''}>${label}</option>`).join('')}</select><p class="nx-result-count" data-result-count role="status" aria-live="polite"></p><nav data-explorer-results aria-label="Entidades de la colección"></nav></div></details></aside><section class="nx-detail" data-explorer-detail aria-label="Ficha y relaciones"></section></div>
    <footer class="nx-footer"><span>Contenido conectado al acervo jurídico</span><span>${catalog.entities.length} entidades · ${catalog.relations.length} relaciones registradas</span></footer></div>`;
  drawResults(state); drawDetail(state);
  container.querySelector('#explorer-search').addEventListener('input', event => { state.query = event.target.value; drawResults(state); });
  container.querySelector('#explorer-type').addEventListener('change', event => { state.type = event.target.value; drawResults(state); });
  container.querySelector('#explorer-topic').addEventListener('change', event => { state.topicId = event.target.value; state.entityId = selectedTopic(state)?.rootEntityId; state.query = ''; state.type = ''; draw(state); notifyRoute(state); container.querySelector('#explorer-topic')?.focus(); });
  container.onclick = async event => {
    const button = event.target.closest('button, [data-go-sources]');
    if (!button || !container.contains(button)) return;
    if (button.hasAttribute('data-select-entity')) {
      state.entityId = button.dataset.selectEntity; drawResults(state); drawDetail(state, true); notifyRoute(state);
      if (typeof matchMedia === 'function' && matchMedia('(max-width: 899px)').matches) {
        container.querySelector('.nx-discovery').open = false;
        container.querySelector('#explorer-entity-title')?.scrollIntoView({ block: 'start', behavior: 'auto' });
      }
    } else if (button.hasAttribute('data-view')) {
      state.view = button.dataset.view; drawDetail(state); container.querySelector(`[data-view="${state.view}"]`)?.focus();
    } else if (button.hasAttribute('data-open-article')) {
      const list = getEntityReferences(state.catalog, state.entityId).map(ref => ref.articleId).filter(Boolean);
      document.dispatchEvent(new CustomEvent('analisis:openArticle', { detail: { id: button.dataset.openArticle, list: [...new Set([...list, button.dataset.openArticle])] } }));
    } else if (button.hasAttribute('data-go-home')) document.dispatchEvent(new CustomEvent('analisis:goHome'));
    else if (button.hasAttribute('data-go-sources')) { event.preventDefault(); container.querySelector('#explorer-foundations')?.focus(); }
    else if (button.hasAttribute('data-return-published')) { state.catalog = state.publishedCatalog; state.preview = false; draw(state); notifyRoute(state); }
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
    state = { container, query: '', type: '', depth: 1, view: typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches ? 'list' : 'map', topicId: '', entityId: '', canEdit: import.meta.env.DEV, preview: false };
    views.set(container, state);
    container.innerHTML = '<div class="nx-explorer nx-loading" role="status">Cargando conceptos y relaciones…</div>';
    state.pending = loadExplorerCatalog().then(result => { state.catalog = result.catalog; state.publishedCatalog = result.catalog; state.warning = result.warning || ''; });
    onAuthChange(() => { if (container.isConnected) void refreshPermissions(state); });
  }
  state.requestedRoute = route;
  try { await state.pending; normalizeSelection(state, state.requestedRoute); draw(state); void refreshPermissions(state); }
  catch {
    views.delete(container);
    container.innerHTML = '<div class="nx-explorer nx-empty" role="alert"><p>No se pudo cargar el explorador.</p><button class="nx-button" data-retry-explorer>Reintentar</button></div>';
    container.querySelector('[data-retry-explorer]').onclick = () => renderAnalisisView(container, route);
  }
}
