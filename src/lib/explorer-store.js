import { supabase } from './supabase.js';
import { isAdmin } from '../scripts/auth.js';
import bundledCatalog from '../data/explorer-catalog.json';
import { validateCatalog } from './explorer-model.js';

const DRAFT_KEY = 'sener-explorer-draft-v1';
const MAX_BYTES = 2 * 1024 * 1024;
const copy = value => JSON.parse(JSON.stringify(value));

function assertValid(catalog) {
    const result = validateCatalog(catalog);
    if (!result.valid) throw new Error(`Catálogo inválido: ${result.errors.join(' · ')}`);
    if (new TextEncoder().encode(JSON.stringify(catalog)).length > MAX_BYTES) {
        throw new Error('El catálogo supera el límite de 2 MB.');
    }
}

function persistenceError(error) {
    const message = String(error?.message || 'El servidor no respondió.');
    if (message.includes('EXPLORER_REVISION_CONFLICT')) {
        return new Error('Otra persona publicó una revisión más reciente. Recarga el catálogo publicado y revisa tus cambios antes de publicar. Tu borrador sigue guardado.');
    }
    if (message.includes('EXPLORER_ADMIN_REQUIRED') || error?.code === '42501') {
        return new Error('La cuenta no tiene permiso de publicación en el servidor. El borrador permanece local.');
    }
    if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(error?.code)) {
        return new Error('La publicación compartida todavía no está habilitada en Supabase. Puedes guardar y exportar el borrador local.');
    }
    return new Error('No se pudo guardar la publicación en Supabase. Comprueba la conexión y vuelve a intentarlo. El borrador permanece local.');
}

// La fábrica permite probar fallos de red, permisos y almacenamiento sin escribir en Supabase.
export function createExplorerStore({ client, adminCheck, storage, seed, now = () => new Date().toISOString() }) {
    function getStorage() {
        try {
            const target = typeof storage === 'function' ? storage() : storage;
            if (!target) throw new Error('unavailable');
            return target;
        } catch {
            throw new Error('El navegador no permite guardar borradores locales. Exporta el JSON para conservar tus cambios.');
        }
    }

    async function loadExplorerCatalog() {
        try {
            const { data, error } = await client.from('explorer_catalog').select('catalog, revision').eq('id', 'main').maybeSingle();
            if (error) throw error;
            if (!data?.catalog) return { catalog: copy(seed), source: 'bundled', warning: 'Todavía no hay una revisión compartida; se muestra el catálogo incluido en la aplicación.' };
            assertValid(data.catalog);
            if (data.catalog.revision !== data.revision) throw new Error('La revisión publicada no coincide con su registro.');
            return { catalog: copy(data.catalog), source: 'supabase' };
        } catch {
            return { catalog: copy(seed), source: 'bundled', warning: 'No se pudo cargar el catálogo compartido. Se muestra la versión incluida en la aplicación; los borradores locales no se publican automáticamente.' };
        }
    }

    function saveDraft(catalog, baseRevision = catalog.revision) {
        assertValid(catalog);
        if (!Number.isInteger(baseRevision) || baseRevision < 1) throw new Error('La revisión base del borrador no es válida.');
        const draft = { catalog: copy(catalog), baseRevision, savedAt: now() };
        try { getStorage().setItem(DRAFT_KEY, JSON.stringify(draft)); }
        catch { throw new Error('No se pudo guardar el borrador en este navegador. Exporta el JSON para conservar tus cambios.'); }
        return draft;
    }

    function getDraft() {
        const raw = getStorage().getItem(DRAFT_KEY);
        if (!raw) return null;
        try {
            const draft = JSON.parse(raw);
            assertValid(draft.catalog);
            if (!Number.isInteger(draft.baseRevision) || draft.baseRevision < 1) throw new Error('invalid revision');
            return draft;
        } catch {
            throw new Error('El borrador guardado no tiene un formato válido. No se ha aplicado al catálogo publicado.');
        }
    }

    function clearDraft() { getStorage().removeItem(DRAFT_KEY); }

    async function canPublishExplorer() {
        try {
            const { data, error } = await client.rpc('explorer_is_admin');
            return !error && data === true;
        } catch { return false; }
    }

    async function publishExplorerCatalog(catalog, expectedRevision) {
        assertValid(catalog);
        if (!Number.isInteger(expectedRevision) || expectedRevision < 1) throw new Error('La revisión base de publicación no es válida.');
        // isAdmin mantiene el contrato de la app. El servidor decide los permisos reales;
        // user_metadata no concede privilegios en la función SQL.
        if (!adminCheck() && !(await canPublishExplorer())) throw new Error('Inicia sesión con una cuenta administradora para publicar.');
        let result;
        try {
            result = await client.rpc('publish_explorer_catalog', { p_catalog: catalog, p_expected_revision: expectedRevision });
        } catch (error) { throw persistenceError(error); }
        if (result.error) throw persistenceError(result.error);
        const published = result.data;
        assertValid(published);
        if (published.revision !== expectedRevision + 1) throw new Error('El servidor no confirmó la revisión esperada. Recarga el catálogo antes de volver a publicar; conserva tu borrador.');
        // No borrar automáticamente: una respuesta perdida no debe destruir el trabajo local.
        return copy(published);
    }

    async function listExplorerRevisions() {
        if (!(await canPublishExplorer())) throw new Error('El historial editorial requiere una cuenta administradora autorizada.');
        let result;
        try {
            result = await client.from('explorer_revisions').select('revision, published_at').order('revision', { ascending: false }).limit(30);
        } catch (error) { throw persistenceError(error); }
        if (result.error) throw persistenceError(result.error);
        return result.data || [];
    }

    async function getExplorerRevision(revision) {
        if (!(await canPublishExplorer())) throw new Error('La revisión requiere una cuenta administradora autorizada.');
        const { data, error } = await client.from('explorer_revisions').select('catalog').eq('revision', revision).single();
        if (error) throw persistenceError(error);
        assertValid(data?.catalog);
        return copy(data.catalog);
    }

    return { loadExplorerCatalog, saveDraft, getDraft, clearDraft, canPublishExplorer, publishExplorerCatalog, listExplorerRevisions, getExplorerRevision };
}

const defaultStore = createExplorerStore({ client: supabase, adminCheck: isAdmin, storage: () => globalThis.localStorage, seed: bundledCatalog });
export const loadExplorerCatalog = (...args) => defaultStore.loadExplorerCatalog(...args);
export const saveDraft = (...args) => defaultStore.saveDraft(...args);
export const getDraft = (...args) => defaultStore.getDraft(...args);
export const clearDraft = (...args) => defaultStore.clearDraft(...args);
export const canPublishExplorer = (...args) => defaultStore.canPublishExplorer(...args);
export const publishExplorerCatalog = (...args) => defaultStore.publishExplorerCatalog(...args);
export const listExplorerRevisions = (...args) => defaultStore.listExplorerRevisions(...args);
export const getExplorerRevision = (...args) => defaultStore.getExplorerRevision(...args);
