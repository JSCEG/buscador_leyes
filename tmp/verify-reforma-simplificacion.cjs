const fs = require('node:fs'); const crypto = require('node:crypto');
const db = JSON.parse(fs.readFileSync('tmp/db-check-reforma-simplificacion.json','utf8').replace(/^\\uFEFF/,''));
const pack = JSON.parse(fs.readFileSync('revision-acervo/incorporacion-complementos-2026-09-19/REFORMA-SIMPLIFICACION-carga.json','utf8').replace(/^\\uFEFF/,''));
const articles = pack.articulos.slice().sort((a,b)=>a.orden-b.orden);
if (db.length !== 30 || articles.length !== 30) throw new Error('Conteo inesperado');
for (let i=0;i<db.length;i++) { const digest=crypto.createHash('md5').update(articles[i].contenido,'utf8').digest('hex'); if(db[i].id!==articles[i].id||db[i].md5!==digest) throw new Error('Diferencia Supabase/incorporación en fila '+i); }
fs.writeFileSync('revision-acervo/sincronizacion-reforma-simplificacion-2026-10-06/articulos-verificados.json',JSON.stringify({ley:pack.ley,articulos:articles},null,2)+'\n');
console.log('Cotejo contra Supabase: 30/30 IDs y textos idénticos; archivo de verificación generado.');


