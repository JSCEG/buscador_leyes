const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom'),crypto=require('node:crypto');
const load=n=>JSON.parse(fs.readFileSync(path.join(__dirname,n),'utf8'));
const p=load('PROGRAMA-CENACE-carga.json'),raw=load('fuentes/bloques.json'),scope=load('SEGMENTACION.json'),map=load('mapa-cenace.json');
const compact=s=>s.replace(/\s/g,'');
let cells=0,tables=0;
for(let i=0;i<scope.rangos.length;i++){
 const r=scope.rangos[i],a=p.articulos[i+1],doc=new JSDOM(a.contenido).window.document;
 for(const block of raw.slice(r.inicio,r.fin))if(!a.contenido.includes(block.html))throw Error('Bloque omitido '+block.id);
 const originalTables=raw.slice(r.inicio,r.fin).filter(b=>b.tipo==='tabla').map(b=>new JSDOM(b.html).window.document.querySelector('table').outerHTML);
 const renderedTables=[...doc.querySelectorAll('table')].map(t=>t.outerHTML);
 for(const t of originalTables)if(!renderedTables.includes(t))throw Error('Tabla alterada '+a.identificador);
 for(const t of originalTables){tables++;cells+=new JSDOM(t).window.document.querySelectorAll('td,th').length;}
 const m=map.articles[a.id];if(crypto.createHash('sha256').update(a.contenido).digest('hex')!==m.contentSha256)throw Error('Huella de mapa diferente');
 const pages=[...new Set(raw.slice(r.inicio,r.fin).map(b=>b.pagina))];if(JSON.stringify(pages)!==JSON.stringify(m.pageNumbers))throw Error('Páginas diferentes');
 for(const anchor of m.anchors){if(anchor.bbox.some(v=>!Number.isFinite(v))||anchor.bbox[0]<0||anchor.bbox[1]<0||anchor.bbox[2]>612||anchor.bbox[3]>792)throw Error('Límite inválido');}
}
if(tables!==20||cells!==429)throw Error('Conteo de tablas distinto');
const full=new JSDOM(p.articulos.slice(1).map(a=>a.contenido).join('\n')).window.document;
const expected=load('COTEJO-CELDAS.json');
// Verify actual HTML cells retain their text and spans, in source order. Editorial
// chart tables are identified by their thead and excluded from the source-cell audit.
const actual=[...full.querySelectorAll('table')].filter(t=>!t.querySelector('thead')).flatMap(t=>[...t.querySelectorAll('td')].map(c=>({texto:compact(c.textContent),colspan:Number(c.getAttribute('colspan')||1),rowspan:Number(c.getAttribute('rowspan')||1)})));
if(JSON.stringify(actual)!==JSON.stringify(expected.map(c=>({texto:compact(c.texto),colspan:c.colspan,rowspan:c.rowspan}))))throw Error('Cotejo de celdas falló');
const result={instrumento:p.ley.siglas,fragmentos:p.articulos.length,apartados_mapeados:Object.keys(map.articles).length,tablas_fuente:tables,celdas_fuente:cells,celdas_y_spans_identicos:true,bloques_integros:true,mapa_coincide:true};
fs.writeFileSync(path.join(__dirname,'COTEJO-FUENTE.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
