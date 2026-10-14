const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs');
require('dotenv').config({ quiet: true });
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
(async () => {
  const { data, error } = await client.from('articulos')
    .select('id,ley_id,identificador,contenido,tipo_articulo,orden,titulo_nombre,capitulo_nombre,seccion_nombre')
    .eq('ley_id', '6c8a912f-6ebb-5638-8d95-b53e5c4b596c').order('orden');
  if (error) throw error;
  const pack = { ley: { id: '6c8a912f-6ebb-5638-8d95-b53e5c4b596c', title: 'Decreto por el que se reforman, adicionan y derogan diversas disposiciones de la Constitución Política de los Estados Unidos Mexicanos, en materia de simplificación orgánica', source: 'https://sidof.segob.gob.mx/notas/docFuente/5745905' }, articulos: data };
  fs.writeFileSync('revision-acervo/sincronizacion-reforma-simplificacion-2026-10-06/articulos-verificados.json', JSON.stringify(pack, null, 2) + '\n');
  console.log(`Supabase: ${data.length} fragmentos; ${data.filter(row => row.tipo_articulo === 'complementario').length} editoriales.`);
})().catch(error => { console.error(error.message); process.exit(1); });
