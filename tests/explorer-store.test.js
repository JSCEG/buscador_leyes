import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../src/scripts/auth.js', () => ({ isAdmin: () => false }));
const editorStore = vi.hoisted(() => ({ canPublish: vi.fn(), saveDraft: vi.fn(), getDraft: vi.fn() }));
vi.mock('../src/lib/explorer-store.js', async importOriginal => ({
    ...(await importOriginal()),
    canPublishExplorer: editorStore.canPublish,
    saveDraft: editorStore.saveDraft,
    getDraft: editorStore.getDraft,
}));

import { createExplorerStore } from '../src/lib/explorer-store.js';
import { openExplorerEditor } from '../src/scripts/explorer-editor.js';

const fixture = () => ({
    schemaVersion: 1, revision: 1, updatedAt: '2026-09-19T00:00:00.000Z',
    topics: [{ id: 'planeacion', title: 'Planeación', summary: 'Una explicación.', entityIds: ['plan'], rootEntityId: 'plan' }],
    entities: [{ id: 'plan', type: 'instrumento', title: 'Plan', description: 'Explicación del plan.', aliases: [], references: [] }],
    relations: [],
});

describe('Explorer editor with real fields', () => {
    beforeEach(() => {
        document.body.innerHTML = '<button id="editor-trigger">Gestionar</button>';
        editorStore.canPublish.mockResolvedValue(false);
        editorStore.getDraft.mockReturnValue(null);
        editorStore.saveDraft.mockReset();
        HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
        HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
    });

    function fill(dialog, name, value) {
        const field = dialog.querySelector(`[name="${name}"]`);
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    it('adds a concept through form fields and previews only after saving the form', async () => {
        const onPreview = vi.fn();
        const dialog = await openExplorerEditor({ catalog: fixture(), onPreview });
        fill(dialog, 'id', 'eficiencia');
        fill(dialog, 'title', 'Eficiencia energética');
        fill(dialog, 'description', 'Reducir el consumo con el mismo servicio.');
        dialog.querySelector('[data-action="preview"]').click();
        expect(onPreview).not.toHaveBeenCalled();
        expect(dialog.querySelector('.ee-status').textContent).toMatch(/Hay cambios en la ficha/);
        dialog.querySelector('.ee-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        expect(editorStore.saveDraft).toHaveBeenCalled();
        dialog.querySelector('[data-action="preview"]').click();
        expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({ entities: expect.arrayContaining([expect.objectContaining({ id: 'eficiencia', title: 'Eficiencia energética' })]) }));
    });

    it('protects unsaved fields when changing type and Escape; explicit discard restores close/focus', async () => {
        const trigger = document.getElementById('editor-trigger'); trigger.focus();
        const dialog = await openExplorerEditor({ catalog: fixture() });
        fill(dialog, 'title', 'Pendiente');
        const kind = dialog.querySelector('[data-role="kind"]'); kind.value = 'topics'; kind.dispatchEvent(new Event('change', { bubbles: true }));
        expect(kind.value).toBe('entities');
        expect(dialog.querySelector('[name="title"]').value).toBe('Pendiente');
        const escape = new Event('cancel', { cancelable: true }); dialog.dispatchEvent(escape);
        expect(escape.defaultPrevented).toBe(true);
        dialog.querySelector('[data-action="discard-form"]').click();
        dialog.querySelector('[data-action="close"]').click();
        expect(dialog.isConnected).toBe(false);
        expect(document.activeElement).toBe(trigger);
    });

    it('preserves unresolved legacy evidence and renders untrusted labels as text', async () => {
        const catalog = fixture();
        catalog.entities[0].references = [{ label: '<img src=x onerror=alert(1)>', legacyArticleId: 'LPTE_ART999' }];
        const dialog = await openExplorerEditor({ catalog });
        const selector = dialog.querySelector('[data-role="item"]'); selector.value = 'plan'; selector.dispatchEvent(new Event('change', { bubbles: true }));
        expect(dialog.querySelector('img')).toBeNull();
        fill(dialog, 'description', 'Explicación revisada.');
        dialog.querySelector('.ee-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        expect(editorStore.saveDraft.mock.calls[0][0].entities[0].references[0]).toEqual(catalog.entities[0].references[0]);
    });
});

describe('Explorer catalog persistence', () => {
    let client, storage, store, adminCheck, seed, query;
    beforeEach(() => {
        localStorage.clear();
        seed = fixture();
        query = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle: vi.fn(), single: vi.fn(), order: vi.fn(() => query), limit: vi.fn() };
        client = { from: vi.fn(() => query), rpc: vi.fn() };
        storage = localStorage;
        adminCheck = vi.fn(() => true);
        store = createExplorerStore({ client, adminCheck, storage, seed, now: () => '2026-09-19T01:00:00.000Z' });
    });

    it('loads a valid shared publication without applying a local draft', async () => {
        const draft = fixture(); draft.entities[0].title = 'Borrador'; store.saveDraft(draft);
        query.maybeSingle.mockResolvedValue({ data: { catalog: seed, revision: 1 }, error: null });
        const result = await store.loadExplorerCatalog();
        expect(result.source).toBe('supabase');
        expect(result.catalog.entities[0].title).toBe('Plan');
        result.catalog.entities[0].title = 'Mutable';
        expect(seed.entities[0].title).toBe('Plan');
    });

    it('keeps the included catalog and an explicit warning when the table is absent', async () => {
        query.maybeSingle.mockResolvedValue({ data: null, error: { code: 'PGRST205' } });
        const result = await store.loadExplorerCatalog();
        expect(result.source).toBe('bundled');
        expect(result.warning).toMatch(/No se pudo cargar/);
        expect(result.catalog).toEqual(seed);
    });

    it('does not expose a malformed shared publication', async () => {
        query.maybeSingle.mockResolvedValue({ data: { catalog: { ...seed, entities: [] }, revision: 1 }, error: null });
        expect((await store.loadExplorerCatalog()).source).toBe('bundled');
    });

    it('rejects a shared row with an inconsistent revision', async () => {
        query.maybeSingle.mockResolvedValue({ data: { catalog: seed, revision: 2 }, error: null });
        expect((await store.loadExplorerCatalog()).source).toBe('bundled');
    });

    it('saves explicit draft base and never mutates the source catalog', () => {
        store.saveDraft(seed, 1);
        seed.entities[0].title = 'Changed outside';
        expect(store.getDraft()).toMatchObject({ baseRevision: 1, savedAt: '2026-09-19T01:00:00.000Z', catalog: { entities: [{ title: 'Plan' }] } });
        store.clearDraft();
        expect(store.getDraft()).toBeNull();
    });

    it('rejects an unsafe reference before storing or sending it', async () => {
        seed.entities[0].references = [{ label: 'Fuente', url: 'javascript:alert(1)' }];
        expect(() => store.saveDraft(seed)).toThrow(/Catálogo inválido/);
        await expect(store.publishExplorerCatalog(seed, 1)).rejects.toThrow(/Catálogo inválido/);
        expect(client.rpc).not.toHaveBeenCalled();
    });

    it('reports quota failure rather than claiming a draft was saved', () => {
        const blocked = createExplorerStore({ client, adminCheck, seed, storage: { setItem() { throw new Error('QuotaExceeded'); } } });
        expect(() => blocked.saveDraft(seed)).toThrow(/No se pudo guardar/);
    });

    it('does not apply or erase corrupt local drafts', () => {
        localStorage.setItem('sener-explorer-draft-v1', '{invalid');
        expect(() => store.getDraft()).toThrow(/no tiene un formato válido/);
        expect(localStorage.getItem('sener-explorer-draft-v1')).toBe('{invalid');
    });

    it('blocks anonymous publishing before the publish RPC', async () => {
        adminCheck.mockReturnValue(false);
        client.rpc.mockResolvedValue({ data: false, error: null });
        await expect(store.publishExplorerCatalog(seed, 1)).rejects.toThrow(/administradora/);
        expect(client.rpc).toHaveBeenCalledTimes(1);
        expect(client.rpc).toHaveBeenCalledWith('explorer_is_admin');
    });

    it('a frontend admin claim cannot turn a backend permission failure into success', async () => {
        store.saveDraft(seed);
        client.rpc.mockResolvedValue({ data: null, error: { message: 'EXPLORER_ADMIN_REQUIRED' } });
        await expect(store.publishExplorerCatalog(seed, 1)).rejects.toThrow(/no tiene permiso/);
        expect(store.getDraft()).not.toBeNull();
    });

    it('sends the expected revision and preserves the draft on conflicts', async () => {
        store.saveDraft(seed);
        client.rpc.mockResolvedValue({ data: null, error: { message: 'EXPLORER_REVISION_CONFLICT' } });
        await expect(store.publishExplorerCatalog(seed, 1)).rejects.toThrow(/Otra persona publicó/);
        expect(client.rpc).toHaveBeenCalledWith('publish_explorer_catalog', { p_catalog: seed, p_expected_revision: 1 });
        expect(store.getDraft()).not.toBeNull();
    });

    it('does not report shared success when migration is missing or network fails', async () => {
        client.rpc.mockResolvedValueOnce({ error: { code: 'PGRST202' } }).mockRejectedValueOnce(new Error('Offline'));
        await expect(store.publishExplorerCatalog(seed, 1)).rejects.toThrow(/no está habilitada/);
        await expect(store.publishExplorerCatalog(seed, 1)).rejects.toThrow(/No se pudo guardar la publicación/);
    });

    it('requires a valid next-revision response to confirm publishing', async () => {
        client.rpc.mockResolvedValueOnce({ data: seed, error: null }).mockResolvedValueOnce({ data: { ...seed, revision: 2 }, error: null });
        await expect(store.publishExplorerCatalog(seed, 1)).rejects.toThrow(/no confirmó/);
        await expect(store.publishExplorerCatalog(seed, 1)).resolves.toMatchObject({ revision: 2 });
    });

    it('permits app-metadata admins authorized by the server even when old UI auth does not recognize them', async () => {
        adminCheck.mockReturnValue(false);
        client.rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: { ...seed, revision: 2 }, error: null });
        await expect(store.publishExplorerCatalog(seed, 1)).resolves.toMatchObject({ revision: 2 });
    });

    it('does not read editorial history unless the server grants access', async () => {
        client.rpc.mockResolvedValue({ data: false, error: null });
        await expect(store.listExplorerRevisions()).rejects.toThrow(/cuenta de administrador/);
        expect(client.from).not.toHaveBeenCalled();
    });
});
