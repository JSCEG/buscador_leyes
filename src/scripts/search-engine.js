import lunr from 'lunr';

let searchIndex;
let allData = [];

export async function initSearch() {
  try {
    console.log('Initializing search...');
    const response = await fetch('/data/manifest.json');
    if (!response.ok) throw new Error('Manifest not found');
    const files = await response.json();

    const promises = files.map(file => fetch(`/data/${file}`).then(res => res.json()));
    const results = await Promise.all(promises);

    allData = results.flatMap(json => {
      return json.articulos.map(art => ({
        ...art,
        ley_origen: json.metadata.ley,
        fecha_publicacion: json.metadata.fecha_publicacion
      }));
    });

    // Simple tokenizer for Spanish (removing accents/lowercase) could be added here
    // For now using default English pipeline which is okay for basic matching but not optimal for stemming

    searchIndex = lunr(function () {
      this.ref('id');
      this.field('texto');
      this.field('titulo_nombre', { boost: 5 });
      this.field('capitulo_nombre', { boost: 3 });
      this.field('articulo_label', { boost: 10 });
      this.field('ley_origen', { boost: 5 });

      allData.forEach(doc => {
        this.add(doc);
      });
    });

    console.log(`Search Index Ready. ${allData.length} articles indexed.`);

    // Dispatch event with stats
    const uniqueLeyes = new Set(allData.map(d => d.ley_origen));
    const summaries = generateSummaries(results);
    const stats = {
      totalLeyes: uniqueLeyes.size,
      totalArticulos: allData.length,
      leyes: Array.from(uniqueLeyes),
      summaries
    };
    window.dispatchEvent(new CustomEvent('search-ready', { detail: stats }));

  } catch (e) {
    console.error('Error initializing search:', e);
  }
}

function generateSummaries(jsonFiles) {
  return jsonFiles.map(json => {
    const meta = json.metadata;
    const chapters = {};
    json.articulos.forEach(a => {
      if (!chapters[a.capitulo_nombre]) chapters[a.capitulo_nombre] = 0;
      chapters[a.capitulo_nombre]++;
    });

    // Sort chapters by article count as a proxy for "relevance/size"
    const sortedChapters = Object.entries(chapters)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    return {
      titulo: meta.ley,
      fecha: meta.fecha_publicacion,
      articulos: meta.total_articulos,
      temas_clave: sortedChapters, // Using biggest chapters as key themes
      id: meta.ley.replace(/\s+/g, '-').toLowerCase(),
      resumen: meta.resumen || "No hay resumen disponible para este documento."
    };
  });
}

export function performSearch(query) {
  if (!searchIndex) return [];

  try {
    // Enhanced Query Processing:
    // 1. If query contains no special chars, add wildcards and fuzzy automatically
    // 2. Otherwise respect user's advanced query syntax

    let processedQuery = query;
    const isSimpleQuery = !/[~*^:+]/.test(query);

    if (isSimpleQuery) {
      // Split by space and add fuzzy/wildcard to each term
      processedQuery = query.split(/\s+/)
        .filter(t => t.length > 2)
        .map(t => `${t}~1 ${t}*`)
        .join(' ');
    }

    let results = searchIndex.search(processedQuery);

    // If no results for fuzzy, try simpler approach or fallback?
    // For now returning whatever Lunr found.

    return results.map(res => {
      const item = allData.find(d => d.id === res.ref);
      return { ...item, score: res.score, matchData: res.matchData };
    });
  } catch (e) {
    console.warn("Search error", e);
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
