// Metadatos de fuentes recuperadas para revisión; las fallidas se registran aparte.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const dir=path.join(__dirname,'fuentes');fs.mkdirSync(dir,{recursive:true});
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'config.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function get(url){let error;for(let i=0;i<3;i++){try{const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status);return r;}catch(e){error=e;}}throw error;}
(async()=>{
 const manifest=[];
 for(const c of config){
  const file=path.join(dir,c.name+'.nota.json');
  const note=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):await(await get('https://sidof.segob.gob.mx/dof/sidof/notas/nota/'+c.code)).json();
  if(note.messageCode!==200||!note.Nota?.cadenaContenido)throw Error('Fuente incompleta '+c.name);
  fs.writeFileSync(file,JSON.stringify(note,null,2));
  const html=note.Nota.cadenaContenido,doc=new JSDOM(html).window.document;doc.querySelectorAll('script,style').forEach(e=>e.remove());
  const text=[...doc.body.querySelectorAll('div,p,tr')].filter(e=>!e.querySelector('div,p,tr')).map(e=>e.textContent.replace(/\s+/g,' ').trim()).filter(Boolean).join('\n');
  fs.writeFileSync(path.join(dir,c.name+'.html'),html);fs.writeFileSync(path.join(dir,c.name+'.txt'),text);
  const m={...c,url:'https://sidof.segob.gob.mx/notas/docFuente/'+c.code,sha256:sha(html),fecha:note.Nota.fecha,titulo:note.Nota.titulo,codDiario:note.Nota.codDiario,pagina:note.Nota.pagina,tables:doc.querySelectorAll('table').length,images:[...doc.querySelectorAll('img')].map(e=>({src:e.getAttribute('src'),alt:e.getAttribute('alt')}))};
  if(note.contenido_url)m.url=note.contenido_url;
  if(note.observacion)m.observacion=note.observacion;
  manifest.push(m);console.log(JSON.stringify({...m,images:m.images.length}));
 }
 fs.writeFileSync(path.join(__dirname,'fuentes.json'),JSON.stringify(manifest,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
