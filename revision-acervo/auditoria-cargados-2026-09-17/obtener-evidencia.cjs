// Auditoría de solo lectura: GET al catálogo público y a sus fuentes oficiales.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
require('dotenv').config({ quiet: true });
const root = __dirname;
const save = (name, value) => fs.writeFileSync(path.join(root,name), typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value,null,2));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
async function get(url, headers={}) {
  const r = await fetch(url,{headers,signal:AbortSignal.timeout(60000)});
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
}
async function exportTable(table,select,order) {
  const base=process.env.VITE_SUPABASE_URL;
  if(new URL(base).hostname!=='carmfqhcfsqbzcwptqfz.supabase.co') throw new Error('Proyecto inesperado');
  const headers={apikey:process.env.VITE_SUPABASE_ANON_KEY,Authorization:`Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,Prefer:'count=exact'};
  const rows=[]; let expected=null;
  for(let offset=0;;offset+=500){
    const url=new URL(`/rest/v1/${table}`,base);
    url.search=new URLSearchParams({select,order,offset:String(offset),limit:'500'});
    const response=await get(url,headers);
    const count=Number(response.headers.get('content-range')?.split('/')[1]);
    if(expected===null)expected=count;
    if(count!==expected)throw new Error(`Cambió el conteo durante la exportación: ${table}`);
    const batch=await response.json();rows.push(...batch);
    if(batch.length<500)break;
  }
  if(rows.length!==expected)throw new Error(`Exportación incompleta: ${table}`);
  save(`supabase-${table}.json`,rows);
  return rows;
}
function plain(html) {
  const doc=new JSDOM(html).window.document;
  doc.querySelectorAll('script,style').forEach(el=>el.remove());
  const blocks=new Set(['P','DIV','TR','LI','UL','OL','H1','H2','H3','H4','H5','H6','SECTION','ARTICLE','BLOCKQUOTE','CENTER','TABLE']);
  const walk=n=>n.nodeType===3?n.textContent:n.nodeType!==1?'':n.tagName==='BR'?'\n':[...n.childNodes].map(walk).join('')+(blocks.has(n.tagName)?'\n':['TD','TH'].includes(n.tagName)?'\t':'');
  return walk(doc.body).replace(/\u00a0/g,' ').split('\n').map(x=>x.replace(/[^\S\t]+/g,' ').trim()).join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
const names=['SAEE','PODECOBI-LIN','DACG-PV','PODECOBI-DEC','LPTE','LSE','LGEC','LGTAIP','RLPTE','RLSH','RLSE','RISENER'];
const known=JSON.parse(fs.readFileSync(path.join(root,'../catalogo-supabase-2026-09-17.json'),'utf8')).instrumentos;
const slug=new Map(known.map((x,i)=>[x.id,names[i]]));
async function source(law) {
  const name=slug.get(law.id)||law.id;
  const folder=path.join(root,'fuentes');fs.mkdirSync(folder,{recursive:true});
  const sourceUrl=new URL(law.url_original);
  if(!['www.diputados.gob.mx','www.dof.gob.mx','dof.gob.mx','sidof.segob.gob.mx'].includes(sourceUrl.hostname))throw new Error('Fuente fuera de los dominios oficiales previstos');
  if(sourceUrl.pathname.toLowerCase().endsWith('.pdf')){
    const bytes=Buffer.from(await(await get(sourceUrl.href)).arrayBuffer());
    if(bytes.subarray(0,4).toString()!=='%PDF')throw new Error('La fuente no devolvió un PDF');
    save(`fuentes/${name}.pdf`,bytes);
    return {name,ley_id:law.id,url:law.url_original,format:'pdf',sha256:sha(bytes),bytes:bytes.length};
  }
  const code=sourceUrl.searchParams.get('codigo')||sourceUrl.pathname.match(/(?:docFuente\/|notas\/)(\d+)/)?.[1];
  if(!code)throw new Error('Sin código DOF');
  const url=`https://sidof.segob.gob.mx/dof/sidof/notas/nota/${code}`;
  const json=await(await get(url)).json();
  if(json.messageCode!==200||!json.Nota?.cadenaContenido)throw new Error('Nota sin texto oficial disponible');
  save(`fuentes/${name}.nota.json`,json);
  save(`fuentes/${name}.html`,json.Nota.cadenaContenido);
  save(`fuentes/${name}.txt`,plain(json.Nota.cadenaContenido));
  return {name,ley_id:law.id,url:law.url_original,api_url:url,format:'html',fecha:json.Nota.fecha,titulo:json.Nota.titulo,sha256:sha(json.Nota.cadenaContenido)};
}
(async()=>{
  const [laws,articles,themes]=await Promise.all([
    exportTable('leyes','*','id.asc'),
    exportTable('articulos','id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden','id.asc'),
    exportTable('temas','*','id.asc')
  ]);
  save('snapshot.json',{fecha:new Date().toISOString(),project:'carmfqhcfsqbzcwptqfz',solo_lectura:true,leyes:laws.length,articulos:articles.length,temas:themes.length,sha_articulos:sha(JSON.stringify(articles))});
  console.log(JSON.stringify({leyes:laws.length,articulos:articles.length,temas:themes.length}));
  const results=[];
  for(let i=0;i<laws.length;i+=3){
    const batch=await Promise.all(laws.slice(i,i+3).map(async law=>{
      try { const r=await source(law);console.log(`${r.name}: fuente descargada`);return r; }
      catch(e){const r={name:slug.get(law.id),ley_id:law.id,url:law.url_original,error:e.message};console.log(`${r.name}: ${r.error}`);return r;}
    }));results.push(...batch);save('fuentes.json',results);
  }
})().catch(e=>{console.error(e.message);process.exitCode=1});
