import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const dir = new URL('.', import.meta.url);
const map = JSON.parse(readFileSync(new URL('map.json', dir), 'utf8'));
const pack = JSON.parse(readFileSync(new URL('../incorporacion-convocatorias-2026-09-17/CONV-ESTRATEGICOS-M1-carga.json', dir), 'utf8'));
const audit = JSON.parse(readFileSync(new URL('cotejo.json', dir), 'utf8'));
const path = new URL('../../public/reader-sources/manifest.v1.json', dir);
let raw = readFileSync(path, 'utf8'); const manifest = JSON.parse(raw);
const articles = pack.articulos.filter(a => !a.identificador.toLowerCase().startsWith('nota editorial'));
const expected = new Map(articles.map(a => [a.id,a])); const ids = Object.keys(map.articles);
const sha = '1a28d5fb75ec9451422ff890b18ba71cec4a3cd92b2d4c47b90fde9c6253ed38';
if (pack.ley.id !== '373ce6df-4e78-59d9-aae5-54007a446c59' || map.source.originalUrl !== 'https://sidof.segob.gob.mx/notas/getNewsletter/26-05-2026/Matutina/327526'
    || map.source.id !== `dof-matutina-2026-05-26-${sha.slice(0,12)}` || map.source.sha256 !== sha || map.source.pageCount !== 620
    || articles.length !== 5 || ids.length !== articles.length || ids.some(id => !expected.has(id))
    || audit.fragmentosOficiales !== 5 || audit.paginasImpresasDelInstrumento.join(',') !== '45') throw new Error('El cotejo no cubre los cinco fragmentos oficiales.');
for (const [id,entry] of Object.entries(map.articles)) {
    const article=expected.get(id);
    if (entry.sourceId!==map.source.id || entry.label!==article.identificador || entry.type!==article.tipo_articulo
        || entry.contentSha256!==createHash('sha256').update(article.contenido,'utf8').digest('hex')
        || !entry.anchors.length || entry.pageNumbers.join(',')!=='45') throw new Error(`No coincide ${article.identificador}.`);
    for (const anchor of entry.anchors) {
        const page=map.source.pages.find(p=>p.number===anchor.page); const [x0,y0,x1,y1]=anchor.bbox;
        if (!page || ![x0,y0,x1,y1].every(Number.isFinite) || !(0<=x0&&x0<x1&&x1<=page.width&&0<=y0&&y0<y1&&y1<=page.height)) throw new Error(`Coordenada inválida: ${article.identificador}`);
    }
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b); const old=manifest.sources[map.source.id];
if (old&&!same(old,map.source)) throw new Error('La edición existe con otra huella.');
const previous=Object.fromEntries(Object.entries(manifest.articles).filter(([,e])=>e.sourceId===map.source.id));
if(Object.keys(previous).length&&!same(previous,map.articles))throw new Error('Hay mapas previos diferentes para esta edición.');
for(const [id,e] of Object.entries(map.articles))if(manifest.articles[id]&&!same(manifest.articles[id],e))throw new Error(`El artículo ${id} tiene otro mapa.`);
const sources=old?{}:{[map.source.id]:map.source}; const maps=Object.fromEntries(Object.entries(map.articles).filter(([id])=>!manifest.articles[id]));
if(!Object.keys(sources).length&&!Object.keys(maps).length)console.log('Los cinco mapas ya están publicados.');
else{
 const eol=raw.includes('\r\n')?'\r\n':'\n'; const indent=v=>JSON.stringify(v,null,2).split('\n').map((s,i)=>i?`  ${s}`:s).join(eol);
 if(Object.keys(sources).length){const b=`${eol}  },${eol}  "articles": {`;if(!raw.includes(b))throw new Error('Cierre de fuentes no encontrado.');const rows=Object.entries(sources).map(([id,v])=>`    ${JSON.stringify(id)}: ${indent(v)}`).join(`,${eol}`);raw=raw.replace(b,`,${eol}${rows}${eol}  },${eol}  "articles": {`);}
 if(Object.keys(maps).length){const b=/\r?\n  }\r?\n}\r?\n?$/;if(!b.test(raw))throw new Error('Cierre de mapas no encontrado.');const rows=Object.entries(maps).map(([id,v])=>`    ${JSON.stringify(id)}: ${indent(v)}`).join(`,${eol}`);raw=raw.replace(b,`,${eol}${rows}${eol}  }${eol}}`);}
 raw=raw.replace(`"revision": ${manifest.revision}`,`"revision": ${manifest.revision+1}`).replace(/("verifiedAt":\s*)"[^"]+"/,(_,p)=>`${p}"${new Date().toISOString()}"`);JSON.parse(raw);writeFileSync(path,raw);console.log(`Manifiesto ${manifest.revision} → ${manifest.revision+1}; ${Object.keys(maps).length} mapas agregados.`);
}
