require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { extractThemesFromText } = require('./legal-ingest-pipeline');

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function backfill() {
    console.log('==> Obteniendo leyes...');
    const { data: leyes, error: leyErr } = await supabase.from('leyes').select('id, titulo');
    if (leyErr) { console.error('Error:', leyErr.message); return; }
    
    for (const ley of leyes) {
        // Check if themes already exist for this law
        const { data: existingThemes } = await supabase.from('temas').select('id').eq('ley_id', ley.id).limit(1);
        if (existingThemes && existingThemes.length > 0) {
            console.log(`   ⏭  "${ley.titulo}" ya tiene temas, saltando.`);
            continue;
        }

        // Fetch all articulo content for this law
        console.log(`   📄 Analizando: "${ley.titulo}"...`);
        const { data: articulos } = await supabase
            .from('articulos')
            .select('contenido')
            .eq('ley_id', ley.id)
            .order('orden', { ascending: true });

        if (!articulos || articulos.length === 0) {
            console.log('      Sin artículos, saltando.');
            continue;
        }

        // Join all article content to scan for structural headings
        const fullText = articulos.map(a => a.contenido).join('\n');
        const themes = extractThemes(fullText);

        if (themes.length === 0) {
            console.log('      No se detectaron temas estructurales.');
            continue;
        }

        // Insert themes
        const batch = themes.map(t => ({
            ley_id: ley.id,
            nivel: t.nivel,
            nombre: t.nombre,
            orden: t.orden
        }));

        const { error: insertErr } = await supabase.from('temas').insert(batch);
        if (insertErr) {
            console.error(`      ❌ Error insertando temas: ${insertErr.message}`);
        } else {
            console.log(`      ✅ ${themes.length} temas insertados (${themes.filter(t=>t.nivel==='titulo').length} títulos, ${themes.filter(t=>t.nivel==='capitulo').length} capítulos, ${themes.filter(t=>t.nivel==='seccion').length} secciones)`);
        }
    }
    console.log('\n✓ Backfill completado.');
}

backfill();
