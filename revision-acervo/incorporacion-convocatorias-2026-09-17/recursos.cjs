const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,dir=path.join(root,'fuentes'),sources=JSON.parse(fs.readFileSync(path.join(root,'fuentes.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function download(url,file,pdf=false){let data;if(fs.existsSync(file))data=fs.readFileSync(file);else{const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('HTTP '+r.status+' '+url);data=Buffer.from(await r.arrayBuffer());}if(pdf&&data.subarray(0,4).toString()!=='%PDF')throw Error('No es PDF');if(!pdf&&data.subarray(1,4).toString()!=='PNG')throw Error('Imagen no PNG');fs.writeFileSync(file,data);return data;}
(async()=>{
 const images=[];
 for(const s of sources)for(const [index,image]of s.images.entries()){
  const url=image.src.replace('sidofqa.segob.gob.mx','sidof.segob.gob.mx'),file=`${s.name}-imagen-${index+1}.png`,b=await download(url,path.join(dir,file));
  const m={name:s.name,original:image.src,url,file,sha256:sha(b),bytes:b.length,width:b.readUInt32BE(16),height:b.readUInt32BE(20)};images.push(m);console.log(JSON.stringify(m));
 }
 fs.writeFileSync(path.join(root,'imagenes.json'),JSON.stringify(images,null,2));
 const pdfs=[];
 for(const s of sources.filter(s=>!s.modificacion||['CONV-GEN-1-M3','CONV-GEN-2-M4','CONV-ESTRATEGICOS-M3'].includes(s.name))){
  const note=JSON.parse(fs.readFileSync(path.join(dir,s.name+'.nota.json'),'utf8')).Nota;
  const edition=note.codEdicion==='VES'?'Vespertina':'Matutina',url=`https://sidof.segob.gob.mx/notas/getNewsletter/${note.fecha}/${edition}/${note.codDiario}`;
  const file=s.name+'-edicion.pdf',b=await download(url,path.join(dir,file),true);pdfs.push({name:s.name,url,file,sha256:sha(b),bytes:b.length,pagina:note.pagina});console.log(s.name+' PDF '+b.length);
 }
 fs.writeFileSync(path.join(root,'ediciones.json'),JSON.stringify(pdfs,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
