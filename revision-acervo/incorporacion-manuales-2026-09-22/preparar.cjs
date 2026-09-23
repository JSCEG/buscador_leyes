const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const root=__dirname,read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),save=(f,v)=>fs.writeFileSync(path.join(root,f),JSON.stringify(v,null,2));
const sources=read('fuentes.json'),images=read('imagenes.json');
const uid=s=>{const h=crypto.createHash('sha256').update(s).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
for(const source of sources){
const name=source.name,raw=read('fuentes/'+name+'.bloques.json'),b=raw.bloques;
if(b.length!==(name==='MOG-SENER'?2623:948)||!raw.cotejo_textual_sin_perdida||!images.filter(i=>i.name===name).every(i=>i.verificada))throw Error('Fuente incompleta');
const starts=new Map(),add=(i,label,kind='ordinario')=>starts.set(i,{label:label||b[i].texto.replace(/\n/g,' '),kind});
if(name==='MOG-SENER'){
add(0,'Portada y acta de autorización','preambulo');add(7,'Índice','anexo');
for(const i of [24,30,32,38,63,912,955,1019,1021])add(i);
for(let i=1022;i<2619;i++)if(/^8\.[1-6]\. |^\d{3}\. /.test(b[i].texto)&&b[i].texto.length<230)add(i);
add(2619,'9. Disposiciones transitorias','transitorio');
}else{
add(0,'Preámbulo y considerandos del acuerdo','preambulo');add(12,'Primero · Expedición del manual');add(14,'Portada e índice del manual','anexo');
for(const i of [52,55,57,59,61,72,335,363,365])add(i);
for(let i=366;i<945;i++)if(b[i+1]?.texto==='OBJETIVO:')add(i);
add(945,'Transitorio Único','transitorio');add(947,'Firma del acuerdo','anexo');
}
const lid=uid(name+'/ley'),bounds=[...starts.keys()].sort((a,c)=>a-c);
const articles=bounds.map((start,orden)=>{const end=bounds[orden+1]??b.length,{label,kind}=starts.get(start);return {id:uid(name+'/'+start),ley_id:lid,identificador:label,contenido:b.slice(start,end).map(x=>x.html).join('\n'),tipo_articulo:kind,orden,titulo_nombre:source.pieza,capitulo_nombre:label,seccion_nombre:null};});
const output=new JSDOM(articles.map(a=>a.contenido).join('')).window.document;
const input=new JSDOM(fs.readFileSync(path.join(root,'fuentes/'+name+'.html'),'utf8')).window.document;input.querySelectorAll('style,title').forEach(e=>e.remove());
const compact=s=>s.replace(/\s/g,'');
if(compact(input.body.textContent)!==compact(output.body.textContent)||output.querySelectorAll('img').length!==1||output.querySelectorAll('table').length!==0)throw Error('Pérdida de contenido');
const [day,month,year]=source.fecha.split('-');
const ley={id:lid,titulo:source.titulo.trim().replace(/\.$/,''),siglas:name,fecha_publicacion:`${year}-${month}-${day}`,fecha_ultima_reforma:null,vigente:null,temas_clave:['Organización institucional',source.pieza,'Funciones y atribuciones'],url_original:source.url,tipo:'manual'};
const temas=[{nivel:'titulo',nombre:source.pieza,orden:0},...articles.map((a,i)=>({nivel:'capitulo',nombre:a.identificador,orden:i+1}))];
const p={ley,articulos:articles,temas};save(name+'-carga.json',p);
save(name+'-COTEJO.json',{id:lid,sha256:raw.sha256,bloques:b.length,fragmentos:articles.length,temas:temas.length,tablas:0,imagenes:1,texto_completo:true,organigrama_verificado:true,alcance:'Cotejo íntegro contra HTML oficial; sin sincronización PDF.'});
let sql=fs.readFileSync(path.join(root,'../incorporacion-pnd-2026-09-22/PND-aplicar.sql'),'utf8');
sql=sql.replace(/\$payload\$[\s\S]*?\$payload\$/,()=>'$payload$'+JSON.stringify(p)+'$payload$').replaceAll('2c8c7e74-a842-5e50-8d07-2558480ee262',lid).replace("siglas='PND'",`siglas='${name}'`).replace('PND ya existe','Manual ya existe');
fs.writeFileSync(path.join(root,name+'-aplicar.sql'),sql);
console.log(JSON.stringify({name,id:lid,fragmentos:articles.length,temas:temas.length,chars:sql.length}));
}
