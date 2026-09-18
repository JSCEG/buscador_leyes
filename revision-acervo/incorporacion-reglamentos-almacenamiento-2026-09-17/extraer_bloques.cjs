// Extrae párrafos y tablas completos. Conserva texto, celdas combinadas y casillas.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');const root=__dirname;
const boxes=JSON.parse(fs.readFileSync(path.join(root,'casillas-verificadas.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const compact=s=>s.replace(/[\s□]/g,'');
const blockTags=new Set(['DIV','P','TABLE','H1','H2','H3','H4','H5','H6','UL','OL','LI','CENTER']);
for(const name of ['DACG-PERMISOS-GA','FORMATOS-SAEE']){
 const raw=fs.readFileSync(path.join(root,'fuentes',name+'.html'),'utf8'),doc=new JSDOM(raw).window.document;
 if(doc.querySelector('script'))throw Error('Revisar contenido ejecutable antes de extraer');
 doc.querySelectorAll('style').forEach(s=>s.remove());
 let replaced=0;
 for(const img of doc.querySelectorAll('img')){if(!boxes.find(x=>x.instrumento===name&&x.original===img.getAttribute('src')))throw Error('Imagen no cotejada');img.replaceWith(doc.createTextNode('□'));replaced++;}
 const safe=n=>{
  if(n.nodeType===3)return esc(n.textContent.replace(/\u00a0/g,' '));if(n.nodeType!==1)return '';
  const tag=n.tagName.toLowerCase(),body=[...n.childNodes].map(safe).join('');
  if(tag==='br')return '<br>';
  const allowed=new Set(['table','thead','tbody','tfoot','tr','td','th','p','div','b','strong','i','em','sup','sub','ul','ol','li']);
  if(!allowed.has(tag))return body;
  const attrs=['td','th'].includes(tag)?['colspan','rowspan'].filter(k=>/^\d+$/.test(n.getAttribute(k)||'')).map(k=>` ${k}="${n.getAttribute(k)}"`).join(''):'';
  return `<${tag}${attrs}>${body}</${tag}>`;
 };
 const plain=n=>n.nodeType===3?n.textContent:n.nodeType!==1?'':n.tagName==='BR'?'\n':[...n.childNodes].map(plain).join('')+(['DIV','P','TR'].includes(n.tagName)?'\n':['TD','TH'].includes(n.tagName)?'\t':'');
 const blocks=[];
 const add=(kind,nodes)=>{const text=nodes.map(plain).join('').replace(/\u00a0/g,' ').split('\n').map(s=>s.replace(/[^\S\t]+/g,' ').trim()).filter(Boolean).join('\n');if(!text)return;blocks.push({id:blocks.length,tipo:kind,texto:text,html:kind==='tabla'?nodes.map(safe).join(''):null});};
 const visit=n=>{
  if(n.nodeType!==1)return;
  if(n.tagName==='TABLE'){add('tabla',[n]);return;}
  if(![...n.children].some(c=>blockTags.has(c.tagName))){add('parrafo',[n]);return;}
  let inline=[];const flush=()=>{if(inline.length)add('parrafo',inline);inline=[];};
  for(const c of n.childNodes){if(c.nodeType===1&&blockTags.has(c.tagName)){flush();visit(c);}else inline.push(c);}flush();
 };
 visit(doc.body);
 if(compact(blocks.map(b=>b.texto).join(''))!==compact(doc.body.textContent))throw Error('Pérdida o duplicación de texto '+name);
 const result={instrumento:name,sha256:crypto.createHash('sha256').update(raw).digest('hex'),tablas:blocks.filter(b=>b.tipo==='tabla').length,casillas:replaced,bloques:blocks,cotejo_textual_sin_perdida:true};
 if(result.tablas!==doc.querySelectorAll('table').length)throw Error('Tabla perdida');
 fs.writeFileSync(path.join(root,'fuentes',name+'.bloques.json'),JSON.stringify(result,null,2));
 const style='body{font:16px/1.5 system-ui;max-width:1050px;margin:30px auto;padding:20px}table{border-collapse:collapse;width:100%;margin:15px 0}td,th{border:1px solid #999;padding:8px;vertical-align:top}p{margin:5px 0}';
 fs.writeFileSync(path.join(root,name+'-fuente-vista.html'),`<!doctype html><html lang="es"><meta charset="utf-8"><title>${name}: fuente con tablas</title><style>${style}</style><body><h1>${name}</h1><p>Transcripción de la fuente oficial: texto y tablas completos; casillas vacías cotejadas y representadas como □.</p>${safe(doc.body)}</body></html>`);
 console.log(JSON.stringify({name,bloques:blocks.length,tablas:result.tablas,casillas:replaced,marcadores:blocks.filter(b=>/^CNE_|^Anexo|^Capítulo|^Transitorios$|^TRANSITORIOS$|^Único|^ÚNICO|^PRIMERO|^SEGUNDO|^ACUERDO|^Instrucciones/.test(b.texto)).map(b=>({id:b.id,tipo:b.tipo,texto:b.texto.slice(0,160)}))}));
}
