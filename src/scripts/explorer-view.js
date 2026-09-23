import { escapeHtml as esc, searchEntities, getEntityReferences } from '../lib/explorer-model.js';
import { loadExplorerCatalog, canPublishExplorer } from '../lib/explorer-store.js';
import { topicOverview, matchAcervo, topicAcervo, acervoThemes, isThematicLink, normalize } from '../lib/analisis-model.js';
import { getAcervoGroup, ACERVO_GROUPS } from '../lib/acervo-model.js';
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
const safeUrl = url => { try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; } };
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
  <span class="nx-law-meta"><span class="nx-law-group nx-group-${esc(getAcervoGroup(law))}">${esc(groupLabel.get(getAcervoGroup(law)) || 'Instrumento')}</span>${law.siglas ? `<span class="nx-law-sigla">${esc(law.siglas)}</span>` : ''}</span>
  <span class="nx-law-title">${esc(law.titulo)}</span>${icon('open')}</button></li>`;

function referencesMarkup(references, heading = 'Fundamentos') {
  return `<section class="nx-sources" aria-label="${esc(heading)}"><h3>${icon('book')}${esc(heading)}<span class="nx-count">${references.length}</span></h3>${references.length ? `<ul class="nx-source-grid">${references.map(ref => {
    const url = safeUrl(ref.url);
    const action = ref.articleId ? `<button class="nx-link" data-open-article="${esc(ref.articleId)}">Leer artículo ${icon('arrow')}</button>`
      : url ? `<a class="nx-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ${icon('open')}</a>`
      : '<span class="nx-pending">Referencia por vincular al acervo</span>';
    const quote = ref.quote ? `<blockquote>${esc(excerpt(ref.quote, 320))}</blockquote>` : ref.articleId ? `<p class="nx-preview" data-preview-for="${esc(ref.articleId)}"><span class="nx-skeleton"></span><span class="nx-skeleton"></span></p>` : '';
    return `<li class="nx-source"><strong>${esc(ref.label || 'Referencia documental')}</strong>${quote}${action}</li>`;
  }).join('')}</ul>` : '<p class="nx-muted">Esta ficha todavía no tiene referencias documentales vinculadas.</p>'}</section>`;
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
  const lawsHeading = isRoot ? `Instrumentos del acervo con el tema «${overview.topic.title}»` : entity.type === 'instrumento' ? 'Consultar en el acervo' : entity.type === 'autoridad' ? 'Normativa que la organiza' : 'Instrumentos del acervo con este tema';
  return `<article class="nx-ficha" aria-labelledby="explorer-entity-title">
    <div class="nx-ficha-top">${typeTag(entity)}${isRoot ? '<span class="nx-muted">Presentación del recorrido</span>' : `<button class="nx-back-root" data-select-entity="${esc(overview.root?.id || '')}">${esc(overview.topic.title)}</button>`}</div>
    <h2 id="explorer-entity-title" tabindex="-1">${esc(entity.title)}</h2>
    <p class="nx-description">${esc(entity.description)}</p>
    ${entity.aliases?.length ? `<p class="nx-aliases"><span>También se encuentra como</span> ${entity.aliases.map(alias => `<span class="nx-alias">${esc(alias)}</span>`).join('')}</p>` : ''}
    ${laws.length ? `<section class="nx-block"><h3>${esc(lawsHeading)}<span class="nx-count">${laws.length}</span></h3><ul class="nx-laws">${laws.slice(0, 8).map(lawButton).join('')}</ul>${laws.length > 8 ? `<p class="nx-muted">Y ${laws.length - 8} más en el acervo.</p>` : ''}</section>` : ''}
    ${typed.length ? `<section class="nx-block"><h3>Relaciones<span class="nx-count">${typed.length}</span></h3><ul class="nx-relations">${typed.map(relation => relationMarkup(state, relation)).join('')}</ul></section>`
      : isRoot ? '' : '<p class="nx-note">No hay relaciones registradas con otras entidades; aparece aquí como parte del recorrido.</p>'}
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

function drawTopic(state, focusHeading = false) {
  const overview = topicOverview(state.catalog, state.topicId);
  const target = state.container.querySelector('[data-explorer-topic]');
  if (!target) return;
  if (!overview) { target.innerHTML = '<p class="nx-empty">Todavía no hay recorridos publicados.</p>'; return; }
  target.innerHTML = `<div class="nx-topic-head"><p class="nx-eyebrow">Recorrido</p><p class="nx-topic-name">${esc(overview.topic.title)}</p><span class="nx-muted">${countLabel(overview.members, 'entidad', 'entidades')}${overview.typedRelations.length ? ` · ${countLabel(overview.typedRelations.length, 'relación', 'relaciones')}` : ''}</span></div>
    <div class="nx-topic-body">${membersMarkup(state, overview)}<div class="nx-ficha-wrap" data-explorer-detail>${fichaMarkup(state, overview)}</div></div>`;
  state.container.querySelectorAll('[data-select-topic]').forEach(button => {
    const active = button.dataset.selectTopic === state.topicId && !button.dataset.entity;
    if (button.classList.contains('nx-topic-card')) { button.classList.toggle('is-selected', active); button.setAttribute('aria-pressed', String(active)); }
  });
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
    <div class="nx-header"><div><p class="nx-eyebrow">Análisis transversal</p><h1>Temas del marco normativo</h1><p class="nx-intro">Recorridos que conectan conceptos, instrumentos y autoridades con su fundamento, y el índice temático del acervo.</p></div>
      <div class="nx-header-aside"><span>Contenido editorial · revisión ${esc(catalog.revision)}</span><span>Actualizado el ${esc(dateLabel(catalog.updatedAt))}</span><span data-editor-control>${state.canEdit ? editButton() : ''}</span></div></div>
    ${state.preview ? '<div class="nx-notice" role="status"><span><strong>Vista previa de un borrador local.</strong> Estos cambios todavía no están publicados.</span><button class="nx-button" data-return-published>Volver al contenido publicado</button></div>' : ''}
    ${state.warning ? `<details class="nx-notice nx-catalog-notice"><summary>Se muestra la copia incluida del catálogo</summary><p>${esc(state.warning)}</p></details>` : ''}
    <div class="nx-tabs" role="tablist" aria-label="Tipo de análisis">
      <button role="tab" id="nx-tab-routes" aria-controls="nx-panel-routes" aria-selected="${state.tab === 'routes'}" data-tab="routes">Recorridos editoriales<span class="nx-count">${catalog.topics.length}</span></button>
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
    <div class="nx-foot"><span>Las explicaciones son contenido editorial de apoyo. Consulta el fundamento y el documento original para conocer su alcance.</span><span>${catalog.entities.length} entidades · ${catalog.relations.length} relaciones registradas</span></div>
  </div>`;
  drawSearch(state); drawTopic(state);
  if (state.tab === 'themes') drawThemes(state);
  container.querySelector('#explorer-search').addEventListener('input', event => { state.query = event.target.value; drawSearch(state); });
  container.querySelector('#explorer-type').addEventListener('change', event => { state.type = event.target.value; drawSearch(state); });
  container.onclick = async event => {
    const button = event.target.closest('button, [data-go-sources]');
    if (!button || !container.contains(button)) return;
    if (button.hasAttribute('data-select-entity')) {
      if (button.dataset.topic) state.topicId = button.dataset.topic;
      state.entityId = button.dataset.selectEntity;
      if (button.classList.contains('nx-result')) { state.query = ''; state.type = ''; container.querySelector('#explorer-search').value = ''; container.querySelector('#explorer-type').value = ''; drawSearch(state); }
      normalizeSelection(state); drawTopic(state, true); notifyRoute(state);
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
    state.pending = loadExplorerCatalog().then(result => { state.catalog = result.catalog; state.publishedCatalog = result.catalog; state.warning = result.warning || ''; });
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
