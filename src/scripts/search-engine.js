import { supabase } from '../lib/supabase.js';

function mapRowToLocalItem(row) {
    return {
        id: row.id,
        ley_id: row.ley_id || null,
        ley_origen: row.leyes?.titulo || 'Desconocida',
        siglas_ley: row.leyes?.siglas || null,
        fecha_publicacion: row.leyes?.fecha_publicacion || null,
        articulo_label: row.identificador,
        tipo_articulo: row.tipo_articulo || 'ordinario',
        titulo_nombre: row.titulo_nombre || '',
        capitulo_nombre: row.capitulo_nombre || '',
        texto: row.contenido,
        url_original: row.leyes?.url_original || null,
        score: row.score || 1
    };
}

// Relaciones entre instrumentos: qué ley fue modificada/reformada/abrogada por cuál.
// Tolerante a que la tabla aún no exista en el proyecto Supabase.
export async function getLeyRelaciones() {
    try {
        const { data, error } = await supabase
            .from('ley_relaciones')
            .select('id, ley_afectada_id, ley_nueva_id, tipo, fecha');
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.warn('[Search] ley_relaciones no disponible:', e.message);
        return [];
    }
}

export async function initSearch() {
    try {
        console.log('[Search] Conectando a Supabase...');
        const [{ data: leyesData, error }, relaciones] = await Promise.all([
            supabase
                .from('leyes')
                .select('id, titulo, siglas, fecha_publicacion, fecha_ultima_reforma, temas_clave, url_original, tipo, articulos(count)'),
            getLeyRelaciones()
        ]);

        if (error) throw error;

        const totalArticulos = leyesData.reduce((acc, l) => acc + (l.articulos[0]?.count || 0), 0);
        const uniqueLeyes = leyesData.map(l => l.titulo);

        const summaries = leyesData.map(l => ({
            id: l.id,
            titulo: l.titulo,
            siglas: l.siglas || null,
            fecha_publicacion: l.fecha_publicacion,
            fecha_ultima_reforma: l.fecha_ultima_reforma,
            articulos: l.articulos[0]?.count || 0,
            temas_clave: l.temas_clave || [],
            resumen: l.titulo,
            url_original: l.url_original || null,
            tipo: l.tipo || null
        }));

        window.dispatchEvent(new CustomEvent('search-ready', {
            detail: {
                totalLeyes: uniqueLeyes.length,
                totalArticulos,
                leyes: uniqueLeyes,
                summaries,
                relaciones
            }
        }));
        console.log('[Search] Conectado a Supabase y metadatos listos.');
    } catch (e) {
        console.error('[Search] Error inicializando Supabase:', e);
    }
}

// Helper: aplica filtros de ley/tipo/articulo a cualquier query base
function applyFilters(q, filters) {
    if (!filters) return q;
    
    if (filters.law && filters.law !== 'all') {
        q = q.eq('leyes.titulo', filters.law);
    }
    if (filters.type && filters.type !== 'all') {
        q = q.eq('leyes.tipo', filters.type);
    }
    if (filters.artNum) {
        q = q.ilike('identificador', '%' + filters.artNum + '%');
    }
    return q;
}

export async function performSearch(query, page = 1, limit = 20, filters = {}) {
    if (!query || query.trim().length < 3) return { data: [], total: 0 };

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const queryTrim = query.trim();

    // 1) Tiered Search Attempt
    try {
        // A) Intentar coincidencia de frase exacta primero (más relevante)
        let qPhrase = applyFilters(
            supabase.from('articulos')
                .select('id, identificador, contenido, tipo_articulo, titulo_nombre, capitulo_nombre, ley_id, leyes!inner ( titulo, siglas, fecha_publicacion, url_original )', { count: 'exact' }),
            filters
        ).textSearch('fts', queryTrim, { config: 'spanish', type: 'phrase' });
        
        const { data: dataP, error: errorP, count: countP } = await qPhrase.range(from, to);
        
        if (!errorP && (countP > 0 || (dataP && dataP.length > 0))) {
            const total = (countP !== null && countP !== undefined) ? countP : dataP.length;
            console.log('[Search] Coincidencia de frase exacta: ' + total + ' resultados');
            return { 
                data: dataP.map((row, i) => Object.assign({}, mapRowToLocalItem(row), { score: 1000 - i })), 
                total: total 
            };
        }

        // B) Fallback a WebSearch (soporta operadores implícitos y es más flexible que FTS puro)
        let qWeb = applyFilters(
            supabase.from('articulos')
                .select('id, identificador, contenido, tipo_articulo, titulo_nombre, capitulo_nombre, ley_id, leyes!inner ( titulo, siglas, fecha_publicacion, url_original )', { count: 'exact' }),
            filters
        ).textSearch('fts', queryTrim, { config: 'spanish', type: 'websearch' });
        
        const { data: dataW, error: errorW, count: countW } = await qWeb.range(from, to);

        if (!errorW && (countW > 0 || (dataW && dataW.length > 0))) {
            const total = (countW !== null && countW !== undefined) ? countW : dataW.length;
            console.log('[Search] Coincidencia WebSearch: ' + total + ' resultados');
            return { 
                data: dataW.map((row, i) => Object.assign({}, mapRowToLocalItem(row), { score: 500 - i })), 
                total: total 
            };
        }

        if (errorP || errorW) console.warn('[Search] Errores en FTS, usando fallback ilike');
    } catch (e) {
        console.warn('[Search] Excepción en búsqueda optimizada:', e.message);
    }

    // 2) Fallback: ilike sobre contenido (siempre funciona)
    try {
        const words = queryTrim.split(/\s+/);
        let q = applyFilters(
            supabase.from('articulos')
                .select('id, identificador, contenido, tipo_articulo, titulo_nombre, capitulo_nombre, ley_id, leyes!inner ( titulo, siglas, fecha_publicacion, url_original )', { count: 'exact' }),
            filters
        );
        // Aplica un ilike por cada palabra (AND implicito)
        for (const word of words) {
            if (word.length > 2) q = q.ilike('contenido', '%' + word + '%');
        }
        const { data, error, count } = await q.range(from, to);
        if (error) throw error;
        console.log('[Search] ilike fallback: ' + count + ' resultados');
        return { data: (data || []).map(function(row, i) { return Object.assign({}, mapRowToLocalItem(row), { score: 100 - i }); }), total: count || 0 };
    } catch (e) {
        console.error('[Search] Error en busqueda:', e.message);
        return { data: [], total: 0 };
    }
}

export async function getSearchCountsByLaw(query, filters = {}) {
    if (!query || query.trim().length < 3) return [];
    try {
        const queryTrim = query.trim();
        
        // REPLICAR LOGICA POR NIVELES PARA EL CONTEO
        async function getCounts(type) {
            let q = applyFilters(
                supabase.from('articulos').select('ley_id, leyes!inner ( titulo )'),
                filters
            );
            
            if (type === 'phrase') q = q.textSearch('fts', queryTrim, { config: 'spanish', type: 'phrase' });
            else if (type === 'websearch') q = q.textSearch('fts', queryTrim, { config: 'spanish', type: 'websearch' });
            else {
                for (const word of queryTrim.split(/\s+/)) {
                    if (word.length > 2) q = q.ilike('contenido', '%' + word + '%');
                }
            }
            
            const { data, error } = await q;
            if (error) throw error;
            return data;
        }

        let data = [];
        // Intentar niveles en orden
        data = await getCounts('phrase');
        if (data.length === 0) data = await getCounts('websearch');
        if (data.length === 0) data = await getCounts('ilike');

        if (!data || data.length === 0) return [];

        // Count by ley
        const counts = {};
        for (const row of data) {
            const titulo = row.leyes?.titulo || 'Desconocida';
            counts[titulo] = (counts[titulo] || 0) + 1;
        }
        return Object.entries(counts)
            .map(function([ley, count]) { return { ley: ley, count: count }; })
            .sort(function(a, b) { return b.count - a.count; });
    } catch (e) {
        console.error('[Search] Error contando por ley:', e);
        return [];
    }
}

export async function getArticleById(id) {
    if (!id) return null;
    try {
        const { data, error } = await supabase
            .from('articulos')
            .select('id, identificador, contenido, tipo_articulo, titulo_nombre, capitulo_nombre, leyes ( titulo, fecha_publicacion )')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return mapRowToLocalItem(data);
    } catch (e) {
        console.error('[Search] Error obteniendo articulo:', e);
        return null;
    }
}

export async function getArticlesByLaw(lawName) {
    if (!lawName) return [];
    try {
        const { data: lawData } = await supabase
            .from('leyes')
            .select('id')
            .eq('titulo', lawName)
            .single();

        if (!lawData) return [];

        const { data, error } = await supabase
            .from('articulos')
            .select('id, identificador, contenido, tipo_articulo, titulo_nombre, capitulo_nombre, leyes ( titulo, fecha_publicacion )')
            .eq('ley_id', lawData.id)
            .order('orden', { ascending: true });

        if (error) throw error;
        return (data || []).map(mapRowToLocalItem);
    } catch (e) {
        console.error('[Search] Error obteniendo articulos de ley:', e);
        return [];
    }
}

export async function getLawMetadata(lawName) {
    if (!lawName) return null;
    try {
        const { data, error } = await supabase
            .from('leyes')
            .select('id, titulo, siglas, fecha_publicacion, fecha_ultima_reforma, url_original, temas_clave, articulos(count)')
            .eq('titulo', lawName)
            .single();

        if (error || !data) return null;
        return {
            id: data.id,
            titulo: data.titulo,
            siglas: data.siglas || null,
            fecha_publicacion: data.fecha_publicacion,
            fecha_ultima_reforma: data.fecha_ultima_reforma || null,
            url_original: data.url_original || null,
            temas_clave: data.temas_clave || [],
            total_articulos: data.articulos[0]?.count || 0
        };
    } catch (e) {
        console.error('[Search] Error obteniendo metadatos de ley:', e);
        return null;
    }
}

export async function getLawTemas(lawId) {
    if (!lawId) return [];
    try {
        const { data, error } = await supabase
            .from('temas')
            .select('nivel, nombre, orden')
            .eq('ley_id', lawId)
            .order('orden', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('[Search] Error obteniendo temas:', e);
        return [];
    }
}

export async function getThemesByLawName(lawName) {
    if (!lawName) return [];
    try {
        const { data: lawData } = await supabase
            .from('leyes')
            .select('id')
            .eq('titulo', lawName)
            .single();

        if (!lawData) return [];

        const { data, error } = await supabase
            .from('temas')
            .select('nivel, nombre, orden')
            .eq('ley_id', lawData.id)
            .order('orden', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('[Search] Error obteniendo temas por ley:', e);
        return [];
    }
}

export async function getAllLeyesAdmin() {
    try {
        const { data, error } = await supabase
            .from('leyes')
            .select('*')
            .order('titulo', { ascending: true });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('[Search] Error obteniendo todas las leyes:', e);
        return [];
    }
}

export async function updateLaw(id, payload) {
    try {
        const { data, error } = await supabase
            .from('leyes')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('[Search] Error actualizando ley:', e);
        throw e;
    }
}

export async function deleteLaw(id) {
    try {
        // Al ser una tabla con FKs, hay que tener cuidado. 
        // Si no hay ON DELETE CASCADE en la DB, fallará si tiene artículos.
        const { error } = await supabase
            .from('leyes')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error('[Search] Error eliminando ley:', e);
        throw e;
    }
}

/**
 * Actualiza el contenido de un artículo específico en la base de datos.
 * @param {string} id - UUID del artículo.
 * @param {Object} payload - Objeto con los campos a actualizar (ej. { texto: 'nuevo contenido' }).
 */
export async function updateArticle(id, payload) {
    try {
        const { data, error } = await supabase
            .from('articulos')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (e) {
        console.error('[Search] Error actualizando artículo:', e);
        throw e;
    }
}
