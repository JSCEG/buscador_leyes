// Descarga exclusivamente fuentes oficiales; no escribe en Supabase.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const root=__dirname;fs.mkdirSync(path.join(root,'fuentes'),{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function plain(html){
 const doc=new JSDOM(html).window.document;doc.querySelectorAll('script,style').forEach(e=>e.remove());
 const blocks=new Set(['P','DIV','TR','LI','UL','OL','H1','H2','H3','H4','H5','H6','SECTION','ARTICLE','BLOCKQUOTE','CENTER','TABLE']);
 const walk=n=>n.nodeType===3?n.textContent:n.nodeType!==1?'':n.tagName==='BR'?'\n':[...n.childNodes].map(walk).join('')+(blocks.has(n.tagName)?'\n':['TD','TH'].includes(n.tagName)?'\t':'');
 return walk(doc.body).replace(/\u00a0/g,' ').split('\n').map(x=>x.replace(/[^\S\t]+/g,' ').trim()).join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(url+': HTTP '+r.status);return r;}
(async()=>{
 const sources=[];
 for(const name of ['LCNE','LSH','LEPECFE','LEPEPM','LBio','LGeo']){
  const url=`https://www.diputados.gob.mx/LeyesBiblio/pdf/${name}.pdf`;
  const bytes=Buffer.from(await(await get(url)).arrayBuffer());if(bytes.subarray(0,4).toString()!=='%PDF')throw Error('No es PDF');
  fs.writeFileSync(path.join(root,'fuentes',name+'.pdf'),bytes);
  sources.push({name,url,sha256:sha(bytes),bytes:bytes.length,format:'pdf'});console.log(name+': '+bytes.length+' bytes');
 }
 const url='https://sidof.segob.gob.mx/notas/docFuente/5756757';
 const note=await(await get('https://sidof.segob.gob.mx/dof/sidof/notas/nota/5756757')).json();
 if(note.messageCode!==200||!note.Nota?.cadenaContenido)throw Error('Nota sin contenido');
 for(const [ext,value]of Object.entries({'nota.json':JSON.stringify(note,null,2),html:note.Nota.cadenaContenido,txt:plain(note.Nota.cadenaContenido)}))fs.writeFileSync(path.join(root,'fuentes','RICNE.'+ext),value);
 sources.push({name:'RICNE',url,sha256:sha(note.Nota.cadenaContenido),fecha:note.Nota.fecha,titulo:note.Nota.titulo,format:'html'});
 fs.writeFileSync(path.join(root,'fuentes.json'),JSON.stringify(sources,null,2));console.log('RICNE: '+note.Nota.fecha);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
