// Fuentes oficiales de los cuatro reglamentos y dos acuerdos; no escribe en BD.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const root=__dirname,dir=path.join(root,'fuentes');fs.mkdirSync(dir,{recursive:true});
const sources=[['RLBio','5769156'],['RLGeo','5769154'],['RLEPECFE','5774837'],['RLEPECFE-erratas','5777392'],['RLEPEPM','5775017'],['DACG-PERMISOS-GA','5770667'],['FORMATOS-SAEE','5788270']];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function plain(html){
 const doc=new JSDOM(html).window.document;doc.querySelectorAll('script,style').forEach(e=>e.remove());
 const blocks=new Set(['P','DIV','TR','LI','UL','OL','H1','H2','H3','H4','H5','H6','SECTION','ARTICLE','BLOCKQUOTE','CENTER','TABLE']);
 const walk=n=>n.nodeType===3?n.textContent:n.nodeType!==1?'':n.tagName==='BR'?'\n':[...n.childNodes].map(walk).join('')+(blocks.has(n.tagName)?'\n':['TD','TH'].includes(n.tagName)?'\t':'');
 return {text:walk(doc.body).replace(/\u00a0/g,' ').split('\n').map(x=>x.replace(/[^\S\t]+/g,' ').trim()).filter(Boolean).join('\n'),tables:doc.querySelectorAll('table').length,images:[...doc.querySelectorAll('img')].map(e=>({src:e.getAttribute('src'),alt:e.getAttribute('alt')}))};
}
async function get(url){let last;for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status);return r;}catch(e){last=e;console.log('Reintento '+(attempt+1)+' '+url+': '+e.message);}}throw last;}
(async()=>{
 const manifest=[];
 for(const [name,code]of sources){
  const file=path.join(dir,name+'.nota.json');
  const note=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):await(await get('https://sidof.segob.gob.mx/dof/sidof/notas/nota/'+code)).json();
  if(note.messageCode!==200||!note.Nota?.cadenaContenido)throw Error('Nota sin contenido '+name);
  const parsed=plain(note.Nota.cadenaContenido);
  for(const [ext,value]of Object.entries({'nota.json':JSON.stringify(note,null,2),html:note.Nota.cadenaContenido,txt:parsed.text}))fs.writeFileSync(path.join(dir,name+'.'+ext),value);
  const item={name,code,url:'https://sidof.segob.gob.mx/notas/docFuente/'+code,sha256:sha(note.Nota.cadenaContenido),fecha:note.Nota.fecha,titulo:note.Nota.titulo,format:'html',tables:parsed.tables,images:parsed.images};
  manifest.push(item);console.log(JSON.stringify({...item,images:parsed.images.length}));
 }
 for(const [name,pdf]of [['RLBio','Reg_LBio'],['RLGeo','Reg_LGeo'],['RLEPECFE','Reg_LEPECFE'],['RLEPEPM','Reg_LEPEPM']]){
  const url='https://www.diputados.gob.mx/LeyesBiblio/regley/'+pdf+'.pdf',file=path.join(dir,name+'.pdf');
  const bytes=fs.existsSync(file)?fs.readFileSync(file):Buffer.from(await(await get(url)).arrayBuffer());
  if(bytes.subarray(0,4).toString()!=='%PDF')throw Error('No es PDF '+name);
  fs.writeFileSync(file,bytes);manifest.find(s=>s.name===name).pdf={url,sha256:sha(bytes),bytes:bytes.length};
  console.log(name+' PDF: '+bytes.length+' bytes');
 }
 fs.writeFileSync(path.join(root,'fuentes.json'),JSON.stringify(manifest,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
