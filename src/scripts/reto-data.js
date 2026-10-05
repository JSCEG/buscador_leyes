/**
 * Data for the Reto Jurídico: the official definitions of the whole acervo (one query) and the
 * articles of the instruments chosen for the passage questions. Cached for the session.
 */
import { supabase } from '../lib/supabase.js';
import { parseDefinitions } from '../lib/definitions.js';

let glossaryPromise = null;

/** Every defined term in the acervo: [{ term, definition, source, lawId, articleId }]. */
export function loadAllDefinitions(summaries = []) {
    glossaryPromise ||= supabase
        .from('articulos')
        .select('id, ley_id, contenido')
        .or('contenido.ilike.%se entiende%por:%,contenido.ilike.%se entenderá%por:%,contenido.ilike.%se considera%por:%')
        .limit(60)
        .then(({ data, error }) => {
            if (error) throw error;
            const entries = [];
            const seen = new Set();
            for (const row of data || []) {
                const terms = parseDefinitions(row.contenido);
                if (terms.size < 3) continue;
                const law = summaries.find(item => String(item.id) === String(row.ley_id));
                const source = law?.siglas || law?.titulo || 'el acervo';
                for (const [term, definition] of terms) {
                    const key = `${term}|${source}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    entries.push({ term, definition, source, lawId: row.ley_id, articleId: row.id });
                }
            }
            return entries;
        })
        .catch(error => { glossaryPromise = null; throw error; });
    return glossaryPromise;
}

const articleCache = new Map();

/** Articles of one instrument, in a stable order (the same for every visitor). */
export function loadArticlesOf(lawId) {
    if (!articleCache.has(lawId)) {
        articleCache.set(lawId, supabase
            .from('articulos')
            .select('id, identificador, contenido')
            .eq('ley_id', lawId)
            .order('id', { ascending: true })
            .limit(400)
            .then(({ data, error }) => {
                if (error) throw error;
                return data || [];
            })
            .catch(error => { articleCache.delete(lawId); throw error; }));
    }
    return articleCache.get(lawId);
}
