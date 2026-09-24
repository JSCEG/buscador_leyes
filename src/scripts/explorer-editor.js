import { validateCatalog, escapeHtml } from '../lib/explorer-model.js';
import { saveDraft, getDraft, clearDraft, publishExplorerCatalog, canPublishExplorer, listExplorerRevisions, getExplorerRevision } from '../lib/explorer-store.js';
import { isAdmin } from './auth.js';
import '../styles/explorer-editor.css';

const clone = value => JSON.parse(JSON.stringify(value));
const e = escapeHtml;
const kinds = { entities: 'Entidades', relations: 'Relaciones', topics: 'Temas' };
const option = (value, title, current) => `<option value="${e(value)}" ${value === current ? 'selected' : ''}>${e(title)}</option>`;
const input = (name, label, value = '', extra = '') => `<label>${label}<input name="${name}" value="${e(value)}" ${extra}></label>`;
const textarea = (name, label, value = '', extra = '') => `<label>${label}<textarea name="${name}" rows="3" ${extra}>${e(value)}</textarea></label>`;

/** Un editor del catálogo, separado de la vista pública y sin publicación implícita. */
export async function openExplorerEditor({ catalog, onPreview = () => {}, onPublished = () => {} }) {
    const authorized = await canPublishExplorer();
    if (!import.meta.env.DEV && !isAdmin() && !authorized) throw new Error('El editor requiere acceso de administrador.');
    const existing = document.querySelector('.explorer-editor');
    if (existing) { existing.focus(); return existing; }

    let working = clone(catalog);
    let baseRevision = catalog.revision;
    let kind = 'entities';
    let selectedId = '';
    let busy = false;
    let formDirty = false;
    const disabledBeforePublish = new Map();
    const trigger = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'explorer-editor';
    dialog.setAttribute('aria-labelledby', 'explorer-editor-title');
    dialog.innerHTML = `
      <header><div><p class="ee-eyebrow">Administrar contenido</p><h2 id="explorer-editor-title">Explorador del marco normativo</h2></div><button type="button" data-action="close" aria-label="Cerrar editor">×</button></header>
      <div class="ee-body">
        <p>Agrega conceptos, instrumentos y relaciones con su fundamento. Guarda cada ficha antes de cambiar de selección. El borrador y la vista previa son locales hasta publicar.</p>
        <div class="ee-status" role="status" aria-live="polite"></div>
        <div class="ee-draft"></div>
        <div class="ee-toolbar"><label>Gestionar<select data-role="kind">${Object.entries(kinds).map(([key, label]) => option(key, label, kind)).join('')}</select></label><label>Ficha<select data-role="item"></select></label><button type="button" data-action="new">Nueva ficha</button></div>
        <form class="ee-form"></form>
        <details class="ee-exchange"><summary>Importar, exportar e historial</summary><div class="ee-toolbar"><label class="ee-file">Importar catálogo JSON<input type="file" accept=".json,application/json" data-role="import"></label><button type="button" data-action="export">Exportar borrador JSON</button><button type="button" data-action="history">Consultar historial</button></div><div class="ee-history"></div></details>
      </div>
      <footer><div class="ee-footer-actions"><button type="button" data-action="save">Guardar borrador local</button><button type="button" data-action="preview">Ver vista previa</button></div><div class="ee-publish"><label><input type="checkbox" data-role="reviewed"> Revisé las explicaciones, relaciones y fuentes.</label><button type="button" data-action="publish" ${authorized ? '' : 'disabled'}>Publicar revisión compartida</button><small>${authorized ? `La publicación comprobará que la revisión ${e(baseRevision)} sigue vigente.` : 'Publicación deshabilitada: inicia sesión con una cuenta que pueda publicar.'}</small></div></footer>`;

    const status = (message, error = false) => {
        const target = dialog.querySelector('.ee-status');
        target.textContent = message;
        target.classList.toggle('ee-error', error);
    };
    const showErrors = candidate => {
        const validation = validateCatalog(candidate);
        if (!validation.valid) { status(validation.errors.join(' · '), true); return false; }
        return true;
    };
    const markChanged = () => {
        working.updatedAt = new Date().toISOString();
        dialog.querySelector('[data-role="reviewed"]').checked = false;
    };
    const hasPendingFields = () => {
        if (!formDirty) return false;
        status('Hay cambios en la ficha que todavía no están en el borrador. Guarda la ficha o pulsa «Descartar cambios de esta ficha» antes de continuar.', true);
        return true;
    };
    const setPublishing = value => {
        busy = value;
        if (value) {
            for (const control of dialog.querySelectorAll('button,input,select,textarea')) {
                disabledBeforePublish.set(control, control.disabled);
                control.disabled = true;
            }
        } else {
            for (const [control, disabled] of disabledBeforePublish) control.disabled = disabled;
            disabledBeforePublish.clear();
        }
    };

    function referenceFields(reference = {}) {
        return `<fieldset class="ee-reference"><legend>Fuente</legend><input type="hidden" name="ref-legacy" value="${e(reference.legacyArticleId || '')}">${input('ref-label', 'Descripción de la fuente', reference.label, 'required maxlength="240"')}${input('ref-article', 'ID del fragmento en el acervo (opcional si hay URL)', reference.articleId)}${input('ref-url', 'URL oficial (opcional si hay fragmento)', reference.url, 'type="url" placeholder="https://…"')}${textarea('ref-quote', 'Cita o evidencia (opcional)', reference.quote)}${reference.legacyArticleId && !reference.articleId && !reference.url ? '<p>Referencia heredada pendiente de vincular con el acervo o una fuente oficial.</p>' : ''}<button type="button" data-action="remove-reference">Quitar fuente</button></fieldset>`;
    }

    function renderReferences(item) {
        return `<fieldset class="ee-references"><legend>Fundamento y fuentes</legend><p>Usa el ID de un fragmento del acervo o una URL oficial. Una relación verificada necesita evidencia.</p><div data-role="references">${(item.references || []).map(referenceFields).join('')}</div><button type="button" data-action="add-reference">Agregar fuente</button></fieldset>`;
    }

    function entityOptions(current = '', candidates = working.entities) {
        return `<option value="">Seleccionar…</option>${candidates.map(entity => option(entity.id, entity.title, current)).join('')}`;
    }

    function renderForm() {
        const item = working[kind].find(record => record.id === selectedId) || {};
        const id = input('id', 'Identificador estable', item.id, `${item.id ? 'readonly' : 'pattern="[a-z0-9][a-z0-9_\\-]*"'} required maxlength="100" placeholder="p-ej-planeacion-regional"`);
        let fields;
        if (kind === 'entities') {
            fields = `${id}<label>Tipo<select name="type">${['concepto', 'instrumento', 'autoridad'].map(type => option(type, type, item.type)).join('')}</select></label>${input('title', 'Nombre', item.title, 'required maxlength="240"')}${textarea('description', 'Explicación', item.description, 'required')}${input('aliases', 'Palabras clave o alias (separados por coma)', (item.aliases || []).join(', '))}${renderReferences(item)}`;
        } else if (kind === 'relations') {
            fields = `${id}<label>Entidad de origen<select name="source" required>${entityOptions(item.source)}</select></label><label>Entidad de destino<select name="target" required>${entityOptions(item.target)}</select></label>${input('type', 'Tipo de relación', item.type || 'relacionado-con', 'required pattern="[a-z0-9][a-z0-9_\\-]*" maxlength="100" placeholder="p-ej-desarrolla"')}${input('label', 'Etiqueta visible', item.label, 'required maxlength="240"')}${textarea('description', 'Explicación de la relación', item.description, 'required')}<label>Estado de revisión<select name="reviewStatus">${option('editorial', 'Explicación propia', item.reviewStatus)}${option('verificada', 'Verificada con fundamento', item.reviewStatus)}</select></label>${renderReferences(item)}`;
        } else {
            fields = `${id}${input('title', 'Nombre del tema', item.title, 'required maxlength="240"')}${textarea('summary', 'Introducción', item.summary, 'required')}<fieldset class="ee-members"><legend>Entidades incluidas</legend>${working.entities.map(entity => `<label><input type="checkbox" name="entityIds" value="${e(entity.id)}" ${(item.entityIds || []).includes(entity.id) ? 'checked' : ''}>${e(entity.title)}</label>`).join('')}</fieldset><label>Entidad inicial del recorrido<select name="rootEntityId" required>${entityOptions(item.rootEntityId, working.entities.filter(entity => (item.entityIds || []).includes(entity.id)))}</select></label>`;
        }
        dialog.querySelector('.ee-form').innerHTML = `${fields}<div class="ee-form-actions"><button type="submit">Guardar ficha en borrador</button><button type="button" data-action="discard-form">Descartar cambios de esta ficha</button>${item.id ? '<button type="button" data-action="delete">Eliminar ficha del borrador</button>' : ''}</div>`;
        formDirty = false;
    }

    function refresh() {
        const selector = dialog.querySelector('[data-role="item"]');
        const entityTitles = new Map();
        working.entities.forEach(entity => entityTitles.set(entity.title, (entityTitles.get(entity.title) || 0) + 1));
        const entityLabel = entity => entityTitles.get(entity.title) > 1
            ? `${entity.title} · ${entity.type} (${entity.id})`
            : entity.title;
        const entityById = new Map(working.entities.map(entity => [entity.id, entity]));
        const relatedLabel = id => entityById.has(id) ? entityLabel(entityById.get(id)) : id;
        const labels = working[kind].map(item => kind === 'relations'
            ? `${relatedLabel(item.source)} — ${item.label} — ${relatedLabel(item.target)}`
            : kind === 'entities' ? entityLabel(item) : item.title || item.id);
        const counts = new Map();
        labels.forEach(label => counts.set(label, (counts.get(label) || 0) + 1));
        selector.innerHTML = `<option value="">Nueva ficha…</option>${working[kind].map((item, index) => option(item.id, counts.get(labels[index]) > 1 ? `${labels[index]} (${item.id})` : labels[index], selectedId)).join('')}`;
        renderForm();
    }

    function persist() {
        if (!showErrors(working)) return false;
        saveDraft(working, baseRevision);
        return true;
    }

    function showDraft() {
        const target = dialog.querySelector('.ee-draft');
        try {
            const draft = getDraft();
            target.innerHTML = draft ? `<p>Hay un borrador guardado en este navegador (base ${e(draft.baseRevision)}). Cargarlo no sustituye la publicación compartida.</p><button type="button" data-action="load-draft">Cargar borrador guardado</button><button type="button" data-action="discard-draft">Descartar copia local</button>` : '';
        } catch (error) { status(error.message, true); }
    }

    dialog.querySelector('[data-role="kind"]').addEventListener('change', event => {
        if (hasPendingFields()) { event.target.value = kind; return; }
        kind = event.target.value; selectedId = ''; refresh();
    });
    dialog.querySelector('[data-role="item"]').addEventListener('change', event => {
        if (hasPendingFields()) { event.target.value = selectedId; return; }
        selectedId = event.target.value; renderForm();
    });
    dialog.querySelector('.ee-form').addEventListener('input', () => { formDirty = true; });
    dialog.querySelector('.ee-form').addEventListener('change', event => {
        formDirty = true;
        if (event.target.name === 'entityIds') {
            const selected = [...dialog.querySelectorAll('[name="entityIds"]:checked')].map(field => field.value);
            const root = dialog.querySelector('[name="rootEntityId"]');
            root.innerHTML = entityOptions(root.value, working.entities.filter(entity => selected.includes(entity.id)));
        }
    });
    dialog.querySelector('.ee-form').addEventListener('submit', event => {
        event.preventDefault();
        const form = event.target;
        const values = new FormData(form);
        const value = key => String(values.get(key) || '').trim();
        const original = working[kind].find(item => item.id === selectedId);
        const record = { ...original, id: value('id') };
        if (kind === 'entities') Object.assign(record, { type: value('type'), title: value('title'), description: value('description'), aliases: value('aliases').split(',').map(alias => alias.trim()).filter(Boolean) });
        if (kind === 'relations') Object.assign(record, { source: value('source'), target: value('target'), type: value('type'), label: value('label'), description: value('description'), reviewStatus: value('reviewStatus') });
        if (kind === 'topics') Object.assign(record, { title: value('title'), summary: value('summary'), entityIds: values.getAll('entityIds'), rootEntityId: value('rootEntityId') });
        else record.references = [...form.querySelectorAll('.ee-reference')].map(fieldset => {
            const get = name => fieldset.querySelector(`[name="${name}"]`).value.trim();
            const ref = { label: get('ref-label') };
            if (get('ref-article')) ref.articleId = get('ref-article');
            if (get('ref-legacy')) ref.legacyArticleId = get('ref-legacy');
            if (get('ref-url')) ref.url = get('ref-url');
            if (get('ref-quote')) ref.quote = get('ref-quote');
            return ref;
        });
        if (!original && working[kind].some(item => item.id === record.id)) return status('Ya existe una ficha con ese identificador. Elige otro.', true);
        const candidate = clone(working);
        candidate[kind] = original ? candidate[kind].map(item => item.id === selectedId ? record : item) : [...candidate[kind], record];
        if (!showErrors(candidate)) return;
        working = candidate;
        markChanged();
        formDirty = false;
        selectedId = record.id;
        try { persist(); refresh(); showDraft(); status('Ficha guardada en el borrador local. Puedes revisar la vista previa antes de publicar.'); }
        catch (error) { refresh(); status(error.message, true); }
    });

    dialog.querySelector('[data-role="import"]').addEventListener('change', async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (hasPendingFields()) { event.target.value = ''; return; }
        try {
            if (file.size > 2 * 1024 * 1024) throw new Error('El archivo supera el límite de 2 MB.');
            const candidate = JSON.parse(await file.text());
            if (!showErrors(candidate)) return;
            // Una revisión importada no reemplaza el token de concurrencia de la sesión.
            working = clone(candidate);
            working.revision = baseRevision;
            markChanged(); selectedId = '';
            persist(); refresh(); showDraft();
            status('Catálogo importado como borrador local. Revisa las fuentes y la vista previa antes de publicar.');
        } catch (error) { status(error instanceof SyntaxError ? 'El archivo no contiene JSON válido.' : error.message, true); }
        finally { event.target.value = ''; }
    });

    dialog.addEventListener('click', async event => {
        const button = event.target.closest('button[data-action]');
        if (!button || busy) return;
        const action = button.dataset.action;
        if (!['discard-form', 'add-reference', 'remove-reference'].includes(action) && hasPendingFields()) return;
        try {
            if (action === 'close') dialog.close();
            if (action === 'discard-form') { renderForm(); status('Se descartaron los campos pendientes de esta ficha. El borrador guardado no cambió.'); }
            if (action === 'new') { selectedId = ''; refresh(); dialog.querySelector('[name="id"]').focus(); }
            if (action === 'add-reference') { dialog.querySelector('[data-role="references"]').insertAdjacentHTML('beforeend', referenceFields()); formDirty = true; }
            if (action === 'remove-reference') { button.closest('.ee-reference').remove(); formDirty = true; }
            if (action === 'save' && persist()) { showDraft(); status('Borrador guardado sólo en este navegador.'); }
            if (action === 'preview' && persist()) { dialog.close(); onPreview(clone(working)); }
            if (action === 'load-draft') {
                const draft = getDraft();
                if (!draft) return status('Ya no hay un borrador local.');
                working = clone(draft.catalog); baseRevision = draft.baseRevision;
                selectedId = ''; refresh();
                status(`Borrador cargado con base en la revisión ${baseRevision}. Si alguien publicó después, el servidor impedirá sobrescribir esa revisión.`);
            }
            if (action === 'discard-draft') { clearDraft(); showDraft(); status('Se descartó la copia guardada en este navegador. Las fichas abiertas permanecen disponibles para exportar.'); }
            if (action === 'delete') {
                const candidate = clone(working);
                candidate[kind] = candidate[kind].filter(item => item.id !== selectedId);
                if (!showErrors(candidate)) return;
                working = candidate; markChanged(); selectedId = '';
                persist(); refresh(); showDraft(); status('Ficha eliminada del borrador local. La publicación compartida no cambió.');
            }
            if (action === 'export') {
                const link = document.createElement('a');
                const url = URL.createObjectURL(new Blob([JSON.stringify(working, null, 2)], { type: 'application/json' }));
                link.href = url; link.download = `explorador-borrador-r${baseRevision}.json`; link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                status('Se exportó el catálogo del borrador.');
            }
            if (action === 'publish') {
                if (!dialog.querySelector('[data-role="reviewed"]').checked) return status('Marca la revisión de explicaciones, relaciones y fuentes antes de publicar.', true);
                if (!persist()) return;
                setPublishing(true); status('Publicando y comprobando la revisión vigente…');
                const published = await publishExplorerCatalog(working, baseRevision);
                working = clone(published); baseRevision = published.revision;
                try { clearDraft(); } catch { /* La revisión ya fue confirmada por el servidor. */ }
                dialog.close(); onPublished(published);
            }
            if (action === 'history') {
                const revisions = await listExplorerRevisions();
                dialog.querySelector('.ee-history').innerHTML = revisions.length ? `<p>Recuperar una revisión crea un borrador. Publicarla generará otra revisión y conservará el historial.</p><ul>${revisions.map(revision => `<li>Revisión ${e(revision.revision)} · ${e(new Date(revision.published_at).toLocaleString('es-MX'))} <button type="button" data-action="restore" data-revision="${e(revision.revision)}">Recuperar como borrador</button></li>`).join('')}</ul>` : '<p>Aún no hay publicaciones compartidas.</p>';
            }
            if (action === 'restore') {
                const revision = await getExplorerRevision(Number(button.dataset.revision));
                working = clone(revision); working.revision = baseRevision;
                markChanged(); selectedId = ''; persist(); refresh(); showDraft();
                status('Revisión recuperada como borrador local. Puedes comparar y revisar antes de publicar.');
            }
        } catch (error) { status(error.message, true); }
        finally { if (action === 'publish') setPublishing(false); }
    });

    dialog.addEventListener('cancel', event => { if (busy || hasPendingFields()) event.preventDefault(); });
    dialog.addEventListener('close', () => { dialog.remove(); if (trigger?.isConnected) trigger.focus(); });
    document.body.append(dialog);
    refresh(); showDraft(); dialog.showModal();
    dialog.querySelector('[data-action="close"]').focus();
    return dialog;
}
