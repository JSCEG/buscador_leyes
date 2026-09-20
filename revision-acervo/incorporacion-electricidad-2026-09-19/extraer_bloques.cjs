// Texto, tablas completas y recursos gráficos cotejados. No ejecuta HTML externo.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const root=__dirname,sources=JSON.parse(fs.readFileSync(path.join(root,'fuentes.json'),'utf8')),images=JSON.parse(fs.readFileSync(path.join(root,'imagenes.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const compact=s=>s.replace(/\s/g,'');
const boxHashes=new Set(['8f680d6af6b67ecaecc537e014655a6e4c22a8640dcf3f31b86eb1e5c6f89c9c']);
const blockTags=new Set(['DIV','P','TABLE','H1','H2','H3','H4','H5','H6','UL','OL','LI','CENTER']);
for(const s of sources){
 const raw=fs.readFileSync(path.join(root,'fuentes',s.name+'.html'),'utf8');if(crypto.createHash('sha256').update(raw).digest('hex')!==s.sha256)throw Error('Fuente cambió');
 const doc=new JSDOM(raw).window.document;if(doc.querySelector('script'))throw Error('Contenido ejecutable');doc.querySelectorAll('style,title').forEach(e=>e.remove());
 let boxes=0,graphics=0;
 for(const img of doc.querySelectorAll('img')){
  const m=images.find(m=>m.name===s.name&&m.original===img.getAttribute('src'));if(!m)throw Error('Imagen no revisada');
  if(boxHashes.has(m.sha256)){img.replaceWith(doc.createTextNode('□'));boxes++;}
  else{img.setAttribute('src',m.url);img.setAttribute('alt',img.getAttribute('alt')||'Figura de la publicación oficial');graphics++;}
 }
 const safe=n=>{
  if(n.nodeType===3)return esc(n.textContent.replace(/\u00a0/g,' '));if(n.nodeType!==1)return '';
  const tag=n.tagName.toLowerCase();if(tag==='br')return '<br>';if(tag==='img')return `<img src="${esc(n.getAttribute('src'))}" alt="${esc(n.getAttribute('alt'))}">`;
  const body=[...n.childNodes].map(safe).join(''),allowed=new Set(['table','thead','tbody','tfoot','tr','td','th','p','div','b','strong','i','em','sup','sub','ul','ol','li']);
  if(!allowed.has(tag))return body;
  const attrs=['td','th'].includes(tag)?['colspan','rowspan'].filter(k=>/^\d+$/.test(n.getAttribute(k)||'')).map(k=>` ${k}="${n.getAttribute(k)}"`).join(''):'';
  return `<${tag}${attrs}>${body}</${tag}>`;
 };
 const plain=n=>n.nodeType===3?n.textContent:n.nodeType!==1?'':n.tagName==='BR'?'\n':[...n.childNodes].map(plain).join('')+(['DIV','P','TR'].includes(n.tagName)?'\n':['TD','TH'].includes(n.tagName)?'\t':'');
 const blocks=[];
 const add=(kind,nodes)=>{const text=nodes.map(plain).join('').replace(/\u00a0/g,' ').split('\n').map(x=>x.replace(/[^\S\t]+/g,' ').trim()).filter(Boolean).join('\n');const html=nodes.map(safe).join('');if(!text&&!html.includes('<img ')&&!html.includes('<table>'))return;blocks.push({id:blocks.length,tipo:kind,texto:text,html});};
 const blockSelector=[...blockTags].join(',');
 const visit=n=>{if(n.nodeType!==1)return;if(n.tagName==='TABLE'){add('tabla',[n]);return;}if(!n.querySelector(blockSelector)){add('parrafo',[n]);return;}let inline=[];const flush=()=>{if(inline.length)add('parrafo',inline);inline=[];};for(const c of n.childNodes){if(c.nodeType===1&&(blockTags.has(c.tagName)||c.querySelector(blockSelector))){flush();visit(c);}else inline.push(c);}flush();};
 visit(doc.body);
 if(compact(blocks.map(b=>b.texto).join(''))!==compact(doc.body.textContent))throw Error('Pérdida de texto');
 const combined=new JSDOM(blocks.map(b=>b.html).join('\n')).window.document;
 if(combined.querySelectorAll('table').length!==s.tables||combined.querySelectorAll('img').length!==graphics)throw Error('Recurso perdido '+JSON.stringify({name:s.name,tablas_origen:s.tables,tablas_resultado:combined.querySelectorAll('table').length,imagenes_origen:graphics,imagenes_resultado:combined.querySelectorAll('img').length}));
 const result={instrumento:s.name,sha256:s.sha256,tablas:s.tables,casillas:boxes,graficos:graphics,bloques:blocks,cotejo_textual_sin_perdida:true};
 fs.writeFileSync(path.join(root,'fuentes',s.name+'.bloques.json'),JSON.stringify(result,null,2));
 fs.writeFileSync(path.join(root,s.name+'-fuente-vista.html'),`<!doctype html><html lang="es"><meta charset="utf-8"><title>${esc(s.name)}</title><style>body{font:16px/1.5 system-ui;max-width:1150px;margin:30px auto;padding:20px}table{border-collapse:collapse;width:100%;margin:15px 0}td,th{border:1px solid #999;padding:8px;vertical-align:top}img{max-width:100%;height:auto}p{margin:7px 0}</style><body>${safe(doc.body)}</body></html>`);
 const outline=blocks.map(b=>`${b.id}\t${b.tipo}\t${b.texto.replace(/\n/g,' ↵ ').slice(0,b.tipo==='tabla'?200:500)}${b.html.includes('<img ')?' [IMAGEN]':''}`).join('\n');
 fs.writeFileSync(path.join(root,'fuentes',s.name+'.indice-bloques.txt'),outline);
 console.log(JSON.stringify({name:s.name,bloques:blocks.length,tablas:s.tables,casillas:boxes,graficos:graphics}));
}
