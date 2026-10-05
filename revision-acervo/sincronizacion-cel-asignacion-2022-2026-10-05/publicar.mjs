import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';
const dir=new URL('.',import.meta.url),map=JSON.parse(readFileSync(new URL('map.json',dir),'utf8'));
const pack=JSON.parse(readFileSync(new URL('articulos-verificados.json',dir),'utf8'));
const audit=JSON.parse(readFileSync(new URL('cotejo.json',dir),'utf8'));
const path=new URL('../../public/reader-sources/manifest.v1.json',dir);let raw=readFileSync(path,'utf8');
const manifest=JSON.parse(raw),articles=pack.articulos,expected=new Map(articles.map(article=>[article.id,article]));
const sha='fd0f00ae1f140ae00bca0e33184f51904b2522221f7d27e82219a9b952c942e8';
const official='https://sidof.segob.gob.mx/notas/getNewsletter/08-04-2024/Matutina/312601';
if(pack.ley.id!=='15fcb1e0-8cd8-5215-9be6-727be3002b3b'||map.source.originalUrl!==official||map.source.id!==`dof-matutina-2024-04-08-${sha.slice(0,12)}`||map.source.sha256!==sha||map.source.pageCount!==202||articles.length!==9||Object.keys(map.articles).length!==9||Object.keys(map.articles).some(id=>!expected.has(id))||audit.paginasImpresasDelInstrumento.join(',')!=='139,144')throw new Error('El cotejo no cubre los nueve fragmentos oficiales.');
for(const[id,entry]of Object.entries(map.articles)){
 const article=expected.get(id);
 if(entry.sourceId!==map.source.id||entry.label!==article.identificador||entry.type!==article.tipo_articulo||entry.contentSha256!==createHash('sha256').update(article.contenido,'utf8').digest('hex')||!entry.anchors.length||entry.pageNumbers.some(number=>number<139||number>144))throw new Error(`Cotejo incompleto: ${article.identificador}`);
 for(const anchor of entry.anchors){const page=map.source.pages.find(value=>value.number===anchor.page),[x0,y0,x1,y1]=anchor.bbox;if(!page||![x0,y0,x1,y1].every(Number.isFinite)||!(0<=x0&&x0<x1&&x1<=page.width&&0<=y0&&y0<y1&&y1<=page.height))throw new Error(`Coordenada inválida: ${article.identificador}`);}
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),old=manifest.sources[map.source.id];
if(old&&!same(old,map.source))throw new Error('La edición ya está registrada con otra huella.');
const prior=Object.fromEntries(Object.entries(manifest.articles).filter(([,entry])=>entry.sourceId===map.source.id));
if(Object.keys(prior).length&&!same(prior,map.articles))throw new Error('Existe un mapa parcial diferente.');
for(const[id,entry]of Object.entries(map.articles))if(manifest.articles[id]&&!same(manifest.articles[id],entry))throw new Error(`Mapa distinto para ${id}.`);
const sources=old?{}:{[map.source.id]:map.source};
const newMaps=Object.fromEntries(Object.entries(map.articles).filter(([id])=>!manifest.articles[id]));
if(!Object.keys(sources).length&&!Object.keys(newMaps).length)console.log('Los nueve mapas ya están publicados.');
else{
 const eol=raw.includes('\r\n')?'\r\n':'\n';
 const indent=value=>JSON.stringify(value,null,2).split('\n').map((line,index)=>index?`  ${line}`:line).join(eol);
 if(Object.keys(sources).length){const boundary=`${eol}  },${eol}  "articles": {`;if(!raw.includes(boundary))throw new Error('Cierre de sources no encontrado.');const rows=Object.entries(sources).map(([id,value])=>`    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);raw=raw.replace(boundary,`,${eol}${rows}${eol}  },${eol}  "articles": {`);}
 if(Object.keys(newMaps).length){const boundary=/\r?\n  }\r?\n}\r?\n?$/;if(!boundary.test(raw))throw new Error('Cierre de articles no encontrado.');const rows=Object.entries(newMaps).map(([id,value])=>`    ${JSON.stringify(id)}: ${indent(value)}`).join(`,${eol}`);raw=raw.replace(boundary,`,${eol}${rows}${eol}  }${eol}}`);}
 raw=raw.replace(`"revision": ${manifest.revision}`,`"revision": ${manifest.revision+1}`).replace(/("verifiedAt":\s*)"[^"]+"/,(_,prefix)=>`${prefix}"${new Date().toISOString()}"`);JSON.parse(raw);writeFileSync(path,raw);console.log(`Manifiesto ${manifest.revision} → ${manifest.revision+1}; ${Object.keys(newMaps).length} mapas agregados.`);
}
