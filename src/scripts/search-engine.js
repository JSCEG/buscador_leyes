import lunr from 'lunr';
import lunrStemmerSupport from 'lunr-languages/lunr.stemmer.support.js';
import lunrEs from 'lunr-languages/lunr.es.js';

// Registrar el plugin de español en la instancia de lunr
lunrStemmerSupport(lunr);
lunrEs(lunr);

let searchIndex;
let allData = [];

// ── Hash de versión del manifest ───────────────────────────────────────────
/**
 * Hash djb2 rápido para generar una clave de versión del manifest.
 * Si los archivos de datos cambian (agregar/quitar leyes), el hash cambia
 * y el caché en localStorage queda inválido automáticamente.
 */
function computeManifestHash(fileList) {
  const str = JSON.stringify(fileList);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

// ── LocalStorage cache ─────────────────────────────────────────────────────
const CACHE_PREFIX = 'bl-cache-v';

function getCacheKey(hash) {
  return `${CACHE_PREFIX}${hash}`;
}

/** Limpia entradas de caché antiguas de versiones previas */
function purgeOldCache(currentKey) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX) && k !== currentKey) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

/**
 * Guarda índice + datos en localStorage.
 * Si hay QuotaExceededError, intenta guardar solo el índice.
 * Si falla de nuevo, omite el caché silenciosamente.
 */
function saveToCache(hash, index, data) {
  const key = getCacheKey(hash);
  purgeOldCache(key);

  const serializedIndex = JSON.stringify(index);

  // Intento 1: guardar índice + datos completos
  try {
    const payload = JSON.stringify({ v: 2, index: serializedIndex, data });
    localStorage.setItem(key, payload);
    console.log(`[Cache] Guardado índice + datos (${(payload.length / 1024).toFixed(0)} KB)`);
    return;
  } catch (e) {
    if (e.name !== 'QuotaExceededError') {
      console.warn('[Cache] Error inesperado al guardar:', e.message);
      return;
    }
  }

  // Intento 2: guardar solo el índice (datos se recargan desde red)
  try {
    const payload = JSON.stringify({ v: 2, index: serializedIndex });
    localStorage.setItem(key, payload);
    console.log(`[Cache] Guardado solo índice (${(payload.length / 1024).toFixed(0)} KB) — quota insuficiente para datos`);
  } catch (e) {
    console.warn('[Cache] No se pudo guardar en localStorage (quota excedida):', e.message);
  }
}

/**
 * Carga caché desde localStorage.
 * Retorna:
 *   { index, data }   → caché completo (sin necesidad de red)
 *   { index }         → solo índice (datos deben cargarse desde red)
 *   null              → sin caché válido
 */
function loadFromCache(hash) {
  try {
    const raw = localStorage.getItem(getCacheKey(hash));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 2 || !parsed.index) return null;

    const index = lunr.Index.load(JSON.parse(parsed.index));
    const data = parsed.data || null;
    return { index, data };
  } catch (e) {
    console.warn('[Cache] Error al cargar caché, se descartará:', e.message);
    return null;
  }
}

// ── Construcción del índice Lunr ───────────────────────────────────────────
function buildIndex(docs) {
  return lunr(function () {
    this.use(lunr.es);
    this.ref('id');
    this.field('texto');
    this.field('titulo_nombre', { boost: 5 });
    this.field('capitulo_nombre', { boost: 3 });
    this.field('articulo_label', { boost: 10 });
    this.field('ley_origen', { boost: 5 });
    docs.forEach(doc => this.add(doc));
  });
}

/** Aplana los JSON de leyes a un array plano de artículos */
function flattenJsons(jsonFiles) {
  return jsonFiles.flatMap(json =>
    json.articulos.map(art => ({
      ...art,
      ley_origen: json.metadata.ley,
      fecha_publicacion: json.metadata.fecha_publicacion
    }))
  );
}

// ── Generación de summaries (sin cambios) ──────────────────────────────────
function generateSummaries(jsonFiles) {
  return jsonFiles.map(json => {
    const meta = json.metadata;
    const chapters = {};
    json.articulos.forEach(a => {
      if (!chapters[a.capitulo_nombre]) chapters[a.capitulo_nombre] = 0;
      chapters[a.capitulo_nombre]++;
    });

    const sortedChapters = Object.entries(chapters)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    return {
      titulo: meta.ley,
      fecha: meta.fecha_publicacion,
      articulos: meta.total_articulos,
      temas_clave: sortedChapters,
      id: meta.ley.replace(/\s+/g, '-').toLowerCase(),
      resumen: meta.resumen || 'No hay resumen disponible para este documento.'
    };
  });
}

/** Despacha el evento search-ready con estadísticas actuales */
function dispatchReady(jsonFiles) {
  const uniqueLeyes = new Set(allData.map(d => d.ley_origen));
  const summaries = generateSummaries(jsonFiles);
  window.dispatchEvent(new CustomEvent('search-ready', {
    detail: {
      totalLeyes: uniqueLeyes.size,
      totalArticulos: allData.length,
      leyes: Array.from(uniqueLeyes),
      summaries
    }
  }));
}

// ── Fetch de un archivo JSON de ley ────────────────────────────────────────
function fetchLaw(filename) {
  return fetch(`/data/${filename}`).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status} para ${filename}`);
    return r.json();
  });
}

// ── Inicialización principal ───────────────────────────────────────────────
export async function initSearch() {
  try {
    console.log('[Search] Iniciando...');

    // 1. Cargar manifest (pequeño, ~400 bytes)
    const manifestRes = await fetch('/data/manifest.json');
    if (!manifestRes.ok) throw new Error('Manifest no encontrado');
    const files = await manifestRes.json();
    const manifestHash = computeManifestHash(files);

    // 2. Intentar usar caché de localStorage
    const cached = loadFromCache(manifestHash);

    if (cached && cached.data) {
      // ── Ruta rápida: caché completo (índice + datos) ───────────────────
      console.log('[Search] ✓ Caché completo encontrado — sin necesidad de red');
      searchIndex = cached.index;
      allData = cached.data;

      // Reconstruir summaries desde allData (agrupar por ley)
      const lawGroups = {};
      allData.forEach(art => {
        if (!lawGroups[art.ley_origen]) lawGroups[art.ley_origen] = { metadata: { ley: art.ley_origen, fecha_publicacion: art.fecha_publicacion, total_articulos: 0, resumen: '' }, articulos: [] };
        lawGroups[art.ley_origen].articulos.push(art);
        lawGroups[art.ley_origen].metadata.total_articulos++;
      });
      dispatchReady(Object.values(lawGroups));
      return;
    }

    if (cached && !cached.data) {
      // ── Ruta semi-rápida: solo índice cacheado, cargar datos en fondo ──
      console.log('[Search] ✓ Índice encontrado en caché — cargando datos en background');
      searchIndex = cached.index;
      // allData sigue vacío; se llenará cuando lleguen los JSON
      // Lanzar carga completa en background (sin await)
      Promise.all(files.map(fetchLaw)).then(jsonFiles => {
        allData = flattenJsons(jsonFiles);
        searchIndex = buildIndex(allData); // Reconstruir para sincronizar con datos
        dispatchReady(jsonFiles);
        saveToCache(manifestHash, searchIndex, allData);
        console.log(`[Search] ✓ Datos cargados tras caché parcial: ${allData.length} artículos`);
      }).catch(e => console.error('[Search] Error cargando datos background:', e));

      // No despachamos search-ready aquí porque allData está vacío.
      // El evento se despacha cuando llegan los datos.
      return;
    }

    // 3. Sin caché: carga lazy por lotes
    // ─ Primer lote: primeros BATCH_SIZE archivos (más pequeños del manifest)
    const BATCH_SIZE = 5;
    const firstBatch = files.slice(0, BATCH_SIZE);
    const restBatch = files.slice(BATCH_SIZE);

    console.log(`[Search] Cargando primer lote (${firstBatch.length} leyes)...`);
    const firstJsons = await Promise.all(firstBatch.map(fetchLaw));
    allData = flattenJsons(firstJsons);
    searchIndex = buildIndex(allData);
    dispatchReady(firstJsons);
    console.log(`[Search] ✓ Primer lote listo: ${allData.length} artículos indexados`);

    // ─ Segundo lote: resto de archivos en background
    if (restBatch.length > 0) {
      console.log(`[Search] Cargando lote secundario (${restBatch.length} leyes) en background...`);
      Promise.all(restBatch.map(fetchLaw)).then(restJsons => {
        const allJsons = [...firstJsons, ...restJsons];
        allData = flattenJsons(allJsons);
        searchIndex = buildIndex(allData);
        dispatchReady(allJsons);
        console.log(`[Search] ✓ Índice completo: ${allData.length} artículos`);

        // Guardar en caché para la siguiente carga
        saveToCache(manifestHash, searchIndex, allData);
      }).catch(e => console.error('[Search] Error en lote secundario:', e));
    } else {
      // Solo había un lote; guardar caché de todos modos
      saveToCache(manifestHash, searchIndex, allData);
    }

  } catch (e) {
    console.error('[Search] Error en inicialización:', e);
  }
}

// ── API pública (sin cambios respecto a versión anterior) ──────────────────
export function performSearch(query) {
  if (!searchIndex) return [];

  try {
    let processedQuery = query;
    const isSimpleQuery = !/[~*^:+]/.test(query);

    if (isSimpleQuery) {
      processedQuery = query.split(/\s+/)
        .filter(t => t.length > 2 || /^\d+°?$/.test(t))
        .map(t => `${t}~1 ${t}*`)
        .join(' ');
    }

    const results = searchIndex.search(processedQuery);
    return results.map(res => {
      const item = allData.find(d => d.id === res.ref);
      return { ...item, score: res.score, matchData: res.matchData };
    }).filter(r => r.id); // Filtrar items aún no cargados
  } catch (e) {
    console.warn('[Search] Error en búsqueda:', e);
    return [];
  }
}

export function getArticleById(id) {
  return allData.find(d => d.id === id);
}

export function getArticlesByLaw(lawName) {
  return allData.filter(d => d.ley_origen === lawName);
}

export function getAllData() {
  return allData;
}
