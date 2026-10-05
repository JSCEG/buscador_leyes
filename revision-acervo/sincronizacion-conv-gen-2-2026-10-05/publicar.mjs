import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const dir=new URL('.',import.meta.url);
const map=JSON.parse(readFileSync(new URL('map.json',dir),'utf8'));
const pack=JSON.parse(readFileSync(new URL('../incorporacion-convocatorias-2026-09-17/CONV-GEN-2-carga.json',dir),'utf8'));
const audit=JSON.parse(readFileSync(new URL('cotejo.json',dir),'utf8'));
const path=new URL('../../public/reader-sources/manifest.v1.json',dir);let raw=readFileSync(path,'utf8');const manifest=JSON.parse(raw);
const official=pack.articulos.filter(a=>!a.identificador.toLowerCase().startsWith('nota editorial')&&a.identificador.toLowerCase()!=='índice de la publicación');
const expected=new Map(official.map(a=>[a.id,a]));const ids=Object.keys(map.articles);const sha='f441289bcfc269955d8f63020cb1c25e8cd3bdfa9b65eefd6061a7481bce7a2f';
if(pack.ley.id!=='2dde9c74-5c23-507b-a0ae-5d3b4722d927'||map.source.originalUrl!=='https://sidof.segob.gob.mx/notas/getNewsletter/11-05-2026/Vespertina/327245'
 ||map.source.id!==`dof-vespertina-2026-05-11-${sha.slice(0,12)}`||map.source.pageCount!==30||map.source.sha256!==sha
 ||official.length!==34||ids.length!==34||ids.some(id=>!expected.has(id))||audit.fragmentosOficiales!==34||audit.paginasImpresasDelInstrumento.join(',')!=='2,19')throw new Error('El mapa no cubre los 34 fragmentos oficiales de la convocatoria.');
for(const [id,e] of Object.entries(map.articles)){
 const a=expected.get(id);if(e.sourceId!==map.source.id||e.label!==a.identificador||e.type!==a.tipo_articulo||e.contentSha256!==createHash('sha256').update(a.contenido,'utf8').digest('hex')||!e.anchors.length||!e.pageNumbers.length||e.pageNumbers.some(n=>n<2||n>19))throw new Error(`Cotejo incompleto: ${a.identificador}`);
 for(const x of e.anchors){const p=map.source.pages.find(v=>v.number===x.page);const [x0,y0,x1,y1]=x.bbox;if(!p||![x0,y0,x1,y1].every(Number.isFinite)||!(0<=x0&&x0<x1&&x1<=p.width&&0<=y0&&y0<y1&&y1<=p.height))throw new Error(`Ancla inválida: ${a.identificador}`);}
}
const graphic=expected.get('ea2bd382-b972-5048-83ad-9bd14989b7d5');if(!map.articles[graphic.id].anchors.some(a=>a.kind==='graphic'&&a.page===19))throw new Error('No se incluyó el gráfico oficial del numeral 14.4.');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);const old=manifest.sources[map.source.id];if(old&&!same(old,map.source))throw new Error('La edición ya existe con otra huella.');
const prior=Object.fromEntries(Object.entries(manifest.articles).filter(([,a])=>a.sourceId===map.source.id));if(Object.keys(prior).length&&!same(prior,map.articles))throw new Error('Ya existe un mapa parcial distinto.');
for(const [id,a] of Object.entries(map.articles))if(manifest.articles[id]&&!same(manifest.articles[id],a))throw new Error(`Mapa distinto para ${id}.`);
const sources=old?{}:{[map.source.id]:map.source};const articles=Object.fromEntries(Object.entries(map.articles).filter(([id])=>!manifest.articles[id]));
if(!Object.keys(sources).length&&!Object.keys(articles).length)console.log('Los 34 mapas ya están publicados.');else{
 const eol=raw.includes('\r\n')?'\r\n':'\n';const indent=v=>JSON.stringify(v,null,2).split('\n').map((s,i)=>i?`  ${s}`:s).join(eol);
 if(Object.keys(sources).length){const b=`${eol}  },${eol}  "articles": {`;if(!raw.includes(b))throw new Error('No se encontró el cierre de sources.');const rows=Object.entries(sources).map(([id,v])=>`    ${JSON.stringify(id)}: ${indent(v)}`).join(`,${eol}`);raw=raw.replace(b,`,${eol}${rows}${eol}  },${eol}  "articles": {`);}
 if(Object.keys(articles).length){const b=/\r?\n  }\r?\n}\r?\n?$/;if(!b.test(raw))throw new Error('No se encontró el cierre de articles.');const rows=Object.entries(articles).map(([id,v])=>`    ${JSON.stringify(id)}: ${indent(v)}`).join(`,${eol}`);raw=raw.replace(b,`,${eol}${rows}${eol}  }${eol}}`);}
 raw=raw.replace(`"revision": ${manifest.revision}`,`"revision": ${manifest.revision+1}`).replace(/("verifiedAt":\s*)"[^"]+"/,(_,p)=>`${p}"${new Date().toISOString()}"`);JSON.parse(raw);writeFileSync(path,raw);console.log(`Manifiesto ${manifest.revision} → ${manifest.revision+1}; ${Object.keys(articles).length} mapas agregados.`);
}
