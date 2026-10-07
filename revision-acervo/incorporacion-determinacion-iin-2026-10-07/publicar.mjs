import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('.', import.meta.url);
const data = JSON.parse(readFileSync(new URL('carga.json', root), 'utf8'));
const map = JSON.parse(readFileSync(new URL('map.json', root), 'utf8'));
const manifestPath = new URL('../../public/reader-sources/manifest.v1.json', root);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const source = data.source;
const articles = data.articulos;
const mapped = map.articles;

if (source.originalUrl !== 'https://www.snieg.mx/Documentos/Normatividad/Vigente/Reglas_Determinacion_Informacion_Interes_Nacional.pdf'
    || !/^snieg-determinacion-iin-2018-[a-f0-9]{12}$/.test(source.id)
    || source.transport !== 'remote-pdf' || source.pdfUrl !== `/api/reader/${source.id}`
    || source.sha256 !== data.auditoria.sha256 || source.pageCount !== 9
    || data.ley.siglas !== 'RDETERMINACION-IIN' || articles.length !== 42
    || Object.keys(mapped).length !== articles.length) {
  throw new Error('No coincide la identidad, fuente, revisión o cobertura del paquete Determinación IIN.');
}
if (manifest.sources[source.id] || articles.some(a => manifest.articles[a.id])) {
  throw new Error('La fuente o algún fragmento Determinación IIN ya existe en el manifiesto.');
}
for (const article of articles) {
  const entry = mapped[article.id];
  const hash = createHash('sha256').update(article.contenido, 'utf8').digest('hex');
  if (!entry || entry.sourceId !== source.id || entry.label !== article.identificador
      || entry.type !== article.tipo_articulo || entry.contentSha256 !== hash
      || !entry.anchors.length || !entry.pageNumbers.length
      || entry.pageNumbers.some(p => !Number.isInteger(p) || p < 1 || p > source.pageCount)) {
    throw new Error(`Mapa incompleto o desfasado para ${article.identificador}.`);
  }
  for (const anchor of entry.anchors) {
    const page = source.pages[anchor.page - 1];
    const [x0, y0, x1, y1] = anchor.bbox;
    if (!page || page.number !== anchor.page
        || ![x0, y0, x1, y1].every(Number.isFinite)
        || !(0 <= x0 && x0 < x1 && x1 <= page.width && 0 <= y0 && y0 < y1 && y1 <= page.height)) {
      throw new Error(`Coordenada fuera de página en ${article.identificador}.`);
    }
  }
}

let raw = readFileSync(manifestPath, 'utf8');
function objectEnd(text, start) {
  let depth=0, quoted=false, escaped=false;
  for (let i=start;i<text.length;i++) {
    const c=text[i];
    if (quoted) { if (escaped) escaped=false; else if (c==='\\') escaped=true; else if (c==='"') quoted=false; }
    else if (c==='"') quoted=true;
    else if (c==='{') depth++;
    else if (c==='}' && --depth===0) return i;
  }
  throw new Error('No se encontró el cierre JSON esperado.');
}
const sourcesKey='"sources":';
const sourcesAt=raw.indexOf(sourcesKey), sourcesOpen=raw.indexOf('{',sourcesAt), sourcesClose=objectEnd(raw,sourcesOpen);
const sourceEntry=`\n    ${JSON.stringify(source.id)}: ${JSON.stringify(source,null,2).replace(/\n/g,'\n    ')}`;
raw=raw.slice(0,sourcesClose)+','+sourceEntry+raw.slice(sourcesClose);
const articlesAt=raw.indexOf('"articles":'), articlesOpen=raw.indexOf('{',articlesAt), articlesClose=objectEnd(raw,articlesOpen);
const additions=articles.map(a=>`\n    ${JSON.stringify(a.id)}: ${JSON.stringify(mapped[a.id],null,2).replace(/\n/g,'\n    ')}`).join(',');
raw=raw.slice(0,articlesClose)+','+additions+'\n  '+raw.slice(articlesClose);
raw=raw.replace(/"revision":\s*(\d+)/,(_,n)=>`"revision": ${Number(n)+1}`);
raw=raw.replace(/("verifiedAt":\s*)"[^"]+"/,(m,p)=>`${p}${JSON.stringify(new Date().toISOString())}`);
const parsed=JSON.parse(raw);
if (Object.keys(parsed.articles).length < articles.length || !parsed.sources[source.id]) throw new Error('Manifiesto final incompleto.');
const nextManifest = new URL('../../public/reader-sources/manifest.v1.next.json', root);
writeFileSync(nextManifest,raw,'utf8');
renameSync(nextManifest,manifestPath);
console.log(`Manifiesto publicado localmente: revisión ${parsed.revision}; ${articles.length} mapas Determinación IIN; fuente ${source.id}.`);
