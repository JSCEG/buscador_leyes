/**
 * FIX Script: recompone leyes dañadas reutilizando el pipeline legal compartido.
 *
 * Uso: node fix_rechunk.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const {
    extractLegalStructureFromText,
    rebuildTextFromChunks
} = require('./legal-ingest-pipeline');

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fix() {
    console.log('==> Restaurando leyes...\n');
    const { data: leyes, error: leyErr } = await supabase.from('leyes').select('id, titulo');
    if (leyErr) {
        console.error('Error:', leyErr.message);
        return;
    }

    for (const ley of leyes) {
        console.log(`━━━ ${ley.titulo} ━━━`);

        const { data: articulos } = await supabase
            .from('articulos')
            .select('contenido, identificador, tipo_articulo')
            .eq('ley_id', ley.id)
            .order('orden', { ascending: true });

        if (!articulos || articulos.length === 0) {
            console.log('   ⏭  Sin artículos, saltando.');
            continue;
        }

        console.log(`   📄 ${articulos.length} fragmentos actuales`);

        const fullText = rebuildTextFromChunks(articulos);
        const { chunks: newChunks, themes } = extractLegalStructureFromText(fullText);
        console.log(`   🔄 Re-chunking: ${newChunks.length} fragmentos`);

        await supabase.from('temas').delete().eq('ley_id', ley.id);
        if (themes.length > 0) {
            const themesBatch = themes.map((theme) => ({
                ley_id: ley.id,
                nivel: theme.nivel,
                nombre: theme.nombre,
                orden: theme.orden
            }));
            await supabase.from('temas').insert(themesBatch);
        }

        if (newChunks.length <= articulos.length) {
            console.log(`   ✅ Ya tiene ${articulos.length} fragmentos, no necesita restauración.`);
            continue;
        }

        const { error: delErr } = await supabase.from('articulos').delete().eq('ley_id', ley.id);
        if (delErr) {
            console.error(`   ❌ Error borrando: ${delErr.message}`);
            continue;
        }

        const batchSize = 100;
        let totalInserted = 0;
        for (let i = 0; i < newChunks.length; i += batchSize) {
            const batch = newChunks.slice(i, i + batchSize).map((chunk, index) => ({
                ley_id: ley.id,
                identificador: chunk.identificador,
                contenido: chunk.contenido,
                tipo_articulo: chunk.tipo,
                orden: i + index
            }));
            const { error: insertErr } = await supabase.from('articulos').insert(batch);
            if (insertErr) {
                console.error(`   ❌ Error insertando: ${insertErr.message}`);
                break;
            }
            totalInserted += batch.length;
        }

        console.log(`   📦 Restaurado: ${articulos.length} → ${totalInserted} fragmentos`);
        console.log(`   📋 ${themes.length} temas recalculados`);
        console.log('');
    }

    console.log('\n✅ Restauración completada.');
}

fix();
