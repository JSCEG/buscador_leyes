// Prototipo aislado: copia de publicaciones ya cotejadas, sin conexión a Supabase.
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'revision-acervo/incorporacion-autoconsumo-2026-09-18');
const names = {
  'AUTOCONSUMO-0.7-20': 'Autoconsumo interconectado de 0.7 a 20 MW',
  'FORMATO-AUTOCONSUMO': 'Formato de solicitud de permiso de autoconsumo',
  'VENTANILLA-AUTOCONSUMO': 'Ventanilla Única de Autoconsumo',
};
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clean(html) {
  if (!/<(?:div|p|table)\b/i.test(html)) return html.split(/\n\n+/).map(p => `<p>${escape(p.replace(/^###? /gm, ''))}</p>`).join('');
  const document = new JSDOM(`<body>${html}</body>`).window.document;
  const allowed = new Set(['DIV','P','BR','STRONG','B','EM','I','U','SPAN','TABLE','TBODY','THEAD','TFOOT','TR','TH','TD','UL','OL','LI','SUB','SUP','H2','H3','H4']);
  for (const el of [...document.body.querySelectorAll('*')].reverse()) {
    if (!allowed.has(el.tagName)) { el.replaceWith(...el.childNodes); continue; }
    for (const attr of [...el.attributes]) if (!['colspan','rowspan'].includes(attr.name)) el.removeAttribute(attr.name);
  }
  return document.body.innerHTML;
}
const instruments = Object.keys(names).map(siglas => {
  const data = JSON.parse(fs.readFileSync(path.join(source, `${siglas}-carga.json`), 'utf8'));
  return { ...data.ley, nombre: names[siglas], fragmentos: data.articulos.length,
    entidad: siglas === 'VENTANILLA-AUTOCONSUMO' ? 'Secretaría de Energía' : 'Comisión Nacional de Energía',
    articulos: data.articulos.map(a => ({id: a.id, orden: a.orden, identificador: a.identificador, html: clean(a.contenido)})),
    seleccion: siglas === 'FORMATO-AUTOCONSUMO' ? 3 : siglas === 'VENTANILLA-AUTOCONSUMO' ? 3 : 2,
  };
});
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'revision-acervo/inventario-radar-2026-09-17/catalogo-actual.json')));
const lse = catalog.instrumentos.find(l => l.siglas === 'LSE');
const articles = JSON.parse(fs.readFileSync(path.join(source,'despues-verificado/articulos.json'))).filter(a=>a.ley_id === lse.id).sort((a,b)=>a.orden-b.orden).slice(0,3);
instruments.push({...lse,nombre: lse.titulo, entidad: 'Congreso de la Unión', seleccion: 1, articulos: articles.map(a=>({id:a.id,orden:a.orden,identificador:a.identificador,html:clean(a.contenido)}))});
fs.writeFileSync(path.join(__dirname,'fixture.json'), JSON.stringify({corte:'2026-09-18',instrumentos:instruments},null,2)+'\n');
console.log(`Fixture generado: ${instruments.length} instrumentos, sin escrituras a la base de datos.`);
