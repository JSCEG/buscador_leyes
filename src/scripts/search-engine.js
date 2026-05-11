import { supabase } from '../lib/supabase.js';

function mapRowToLocalItem(row) {
    return {
        id: row.id,
        ley_origen: row.leyes?.titulo || 'Desconocida',
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

export async function initSearch() {
    try {
        console.log('[Search] Conectando a Supabase...');
        const { data: leyesData, error } = await supabase
            .from('leyes')
            .select('id, titulo, fecha_publicacion, temas_clave, url_original, articulos(count)');

        if (error) throw error;

        const totalArticulos = leyesData.reduce((acc, l) => acc + (l.articulos[0]?.count || 0), 0);
        const uniqueLeyes = leyesData.map(l => l.titulo);

        const summaries = leyesData.map(l => ({
            titulo: l.titulo,
            fecha: l.fecha_publicacion || 'N/D',
            articulos: l.articulos[0]?.count || 0,
            temas_clave: l.temas_clave || [],
            id: l.id,
            resumen: l.titulo,
            url_original: l.url_original || null
        }));

        window.dispatchEvent(new CustomEvent('search-ready', {
            detail: {
                totalLeyes: uniqueLeyes.length,
                totalArticulos,
                leyes: uniqueLeyes,
                summaries
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
        // Usamos % al inicio por si acaso hay espacios o caracteres invisibles, 
        // aunque lo ideal es que coincida con el inicio.
        if (filters.type === 'ley') q = q.ilike('leyes.titulo', 'ley%');
        if (filters.type === 'reglamento') q = q.ilike('leyes.titulo', 'reglamento%');
        if (filters.type === 'otros') q = q.not('leyes.titulo', 'ilike', 'ley%').not('leyes.titulo', 'ilike', 'reglamento%');
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
                .select('id, identificador, contenido, tipo_articulo, titulo_nombre, capitulo_nombre, ley_id, leyes!inner ( titulo, fecha_publicacion, url_original )', { count: 'exact' }),
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
                .select('id, identificador, contenido, tipo_articulo, titulo_nombre, capitulo_nombre, ley_id, leyes!inner ( titulo, fecha_publicacion, url_original )', { count: 'exact' }),
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
                .select('id, identificador, contenido, tipo_articulo, titulo_nombre, capitulo_nombre, ley_id, leyes!inner ( titulo, fecha_publicacion, url_original )', { count: 'exact' }),
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
            .select('id, titulo, fecha_publicacion, temas_clave, url_original, articulos(count)')
            .eq('titulo', lawName)
            .single();

        if (error || !data) return null;
        return {
            id: data.id,
            titulo: data.titulo,
            fecha_publicacion: data.fecha_publicacion,
            temas_clave: data.temas_clave || [],
            url_original: data.url_original || null,
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
