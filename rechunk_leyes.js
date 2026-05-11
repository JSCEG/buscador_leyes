/**
 * Re-Chunk Script: recompone leyes ya cargadas con el pipeline legal compartido.
 *
 * Uso: node rechunk_leyes.js
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

async function rechunk() {
    console.log('==> Obteniendo leyes...\n');
    const { data: leyes, error: leyErr } = await supabase.from('leyes').select('id, titulo');
    if (leyErr) {
        console.error('Error:', leyErr.message);
        return;
    }

    for (const ley of leyes) {
        console.log(`━━━ ${ley.titulo} ━━━`);

        const { data: articulos, error: artErr } = await supabase
            .from('articulos')
            .select('contenido, identificador')
            .eq('ley_id', ley.id)
            .order('orden', { ascending: true });

        if (artErr) {
            console.error(`   ❌ Error leyendo artículos: ${artErr.message}`);
            continue;
        }

        if (!articulos || articulos.length === 0) {
            console.log('   ⏭  Sin artículos, saltando.');
            continue;
        }

        const fullText = rebuildTextFromChunks(articulos);
        console.log(`   📄 Texto reconstruido: ${fullText.length} caracteres, ${articulos.length} fragmentos originales`);

        const { chunks: newChunks, themes } = extractLegalStructureFromText(fullText);
        console.log(`   🔄 Re-chunking: ${newChunks.length} fragmentos nuevos`);

        const oldPreambulo = articulos.find((articulo) => articulo.identificador === 'Preámbulo/Considerandos');
        const newPreambulo = newChunks.find((chunk) => chunk.identificador === 'Preámbulo/Considerandos');
        if (oldPreambulo && newPreambulo) {
            const oldLen = oldPreambulo.contenido.length;
            const newLen = newPreambulo.contenido.length;
            if (newLen > oldLen + 50) {
                console.log(`   ✅ Preámbulo corregido: ${oldLen} → ${newLen} caracteres (+${newLen - oldLen})`);
            }
        }

        if (newChunks.length === 0) {
            console.log('   ⚠️  Sin chunks generados, saltando (no se borran datos).');
            continue;
        }

        const { error: delErr } = await supabase.from('articulos').delete().eq('ley_id', ley.id);
        if (delErr) {
            console.error(`   ❌ Error borrando artículos viejos: ${delErr.message}`);
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
                console.error(`   ❌ Error insertando batch: ${insertErr.message}`);
                break;
            }
            totalInserted += batch.length;
        }
        console.log(`   📦 ${totalInserted} artículos insertados`);

        await supabase.from('temas').delete().eq('ley_id', ley.id);
        if (themes.length > 0) {
            const themesBatch = themes.map((theme) => ({
                ley_id: ley.id,
                nivel: theme.nivel,
                nombre: theme.nombre,
                orden: theme.orden
            }));
            const { error: temasErr } = await supabase.from('temas').insert(themesBatch);
            if (temasErr) {
                console.warn(`   ⚠️  Temas no insertados: ${temasErr.message}`);
            } else {
                console.log(`   📋 ${themes.length} temas insertados (${themes.filter((theme) => theme.nivel === 'titulo').length}T, ${themes.filter((theme) => theme.nivel === 'capitulo').length}C, ${themes.filter((theme) => theme.nivel === 'seccion').length}S)`);
            }
        }

        console.log('');
    }

    console.log('✅ Re-chunking completado para todas las leyes.');
}

rechunk();
