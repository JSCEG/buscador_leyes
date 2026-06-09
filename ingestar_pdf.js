require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const {
    extractLegalStructureFromPdf
} = require('./legal-ingest-pipeline');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Faltan credenciales de Supabase en el archivo .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const markdownOutIndex = args.indexOf('--markdown-out');
    const markdownOut = markdownOutIndex >= 0 ? args[markdownOutIndex + 1] : null;
    const tipoIndex = args.indexOf('--tipo');
    let tipo = tipoIndex >= 0 ? args[tipoIndex + 1] : null;

    const positional = args.filter((arg, index) => {
        if (arg === '--dry-run' || arg === '--markdown-out' || arg === '--tipo') return false;
        if (markdownOutIndex >= 0 && index === markdownOutIndex + 1) return false;
        if (tipoIndex >= 0 && index === tipoIndex + 1) return false;
        return true;
    });
    const [pdfPath, tituloLey, siglasArg] = positional;
    const siglas = siglasArg || null;

    if (!pdfPath || !tituloLey) {
        console.error("Uso: node ingestar_pdf.js <ruta_al_pdf> \"<titulo_de_la_ley>\" [siglas] [--dry-run] [--markdown-out ruta.md] [--tipo tipo]");
        process.exit(1);
    }

    if (!tipo && tituloLey) {
        const t = tituloLey.toLowerCase();
        if (t.startsWith('ley ')) tipo = 'ley';
        else if (t.startsWith('reglamento ')) tipo = 'reglamento';
        else if (t.includes('acuerdo')) tipo = 'acuerdo';
        else if (t.includes('decreto')) tipo = 'decreto';
        else if (t.includes('disposiciones administrativas') || t.includes('dacg')) tipo = 'dacg';
        else if (t.includes('norma oficial') || t.includes('nom-')) tipo = 'nom';
        else tipo = 'otros';
    }

    if (!fs.existsSync(pdfPath)) {
        console.error(`Error: El archivo ${pdfPath} no existe.`);
        process.exit(1);
    }

    console.log(`\nProcesando: ${tituloLey} desde ${pdfPath}...`);

    try {
        console.log("=> Convirtiendo PDF a Markdown...");
        const { markdown, chunks, themes, pdfMeta } = extractLegalStructureFromPdf(pdfPath);

        if (markdownOut) {
            fs.writeFileSync(markdownOut, markdown, 'utf8');
            console.log(`=> Markdown guardado en: ${markdownOut}`);
        }

        console.log(`=> Conversor: ${pdfMeta.converter}; tipo detectado: ${pdfMeta.pdfType || 'n/d'}; páginas: ${pdfMeta.pageCount || 'n/d'}; OCR sugerido en: ${pdfMeta.pagesNeedingOcr.length}`);
        if (pdfMeta.fallbackReason) console.log(`=> Fallback aplicado: ${pdfMeta.fallbackReason}`);
        console.log(`=> Obtenidos ${chunks.length} fragmentos.`);

        if (dryRun) {
            console.log(`=> Modo dry-run: ${themes.length} temas detectados. No se escribirá en Supabase.`);
            return;
        }

        console.log("=> Insertando metadatos de la ley en Supabase...");
        
        let urlOriginal = null;
        if (!dryRun) {
            console.log("=> Subiendo documento original a Storage...");
            const fileName = `${Date.now()}_${path.basename(pdfPath).replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
            const fileData = fs.readFileSync(pdfPath);
            const { error: uploadError } = await supabase.storage
                .from('documentos_legales')
                .upload(fileName, fileData, { upsert: false, contentType: 'application/pdf' });
            
            if (uploadError) throw new Error("Error subiendo PDF: " + uploadError.message);
            
            const { data: publicUrlData } = supabase.storage
                .from('documentos_legales')
                .getPublicUrl(fileName);
            urlOriginal = publicUrlData.publicUrl;
        }

        const { data: leyData, error: leyError } = await supabase
            .from('leyes')
            .insert([{
                titulo: tituloLey,
                siglas,
                tipo,
                temas_clave: themes.length > 0 ? Array.from(new Set(themes.map((theme) => theme.nombre))).slice(0, 10) : null,
                url_original: urlOriginal
            }])
            .select();

        if (leyError) throw leyError;
        
        const leyId = leyData[0].id;
        console.log(`=> Ley registrada con ID: ${leyId}. Procesando subida de fragmentos en lotes...`);
        
        // Push in smaller chunks (100 at a time) to avoid payload limit issues
        const batchSize = 100;
        let totalInserted = 0;
        for (let i = 0; i < chunks.length; i += batchSize) {
             const batch = chunks.slice(i, i + batchSize).map((chunk, index) => ({
                ley_id: leyId,
                identificador: chunk.identificador,
                contenido: chunk.contenido,
                tipo_articulo: chunk.tipo,
                titulo_nombre: chunk.titulo_nombre || null,
                capitulo_nombre: chunk.capitulo_nombre || null,
                seccion_nombre: chunk.seccion_nombre || null,
                orden: i + index
            }));
            const { error: insertError } = await supabase.from('articulos').insert(batch);
            if (insertError) throw insertError;
            totalInserted += batch.length;
            console.log(`   Insertados ${totalInserted}/${chunks.length} artículos...`);
        }

        if (themes.length > 0) {
            console.log("=> Insertando temas estructurales...");
            const themeBatch = themes.map((theme) => ({
                ley_id: leyId,
                nivel: theme.nivel,
                nombre: theme.nombre,
                orden: theme.orden
            }));
            const { error: themeError } = await supabase.from('temas').insert(themeBatch);
            if (themeError) {
                console.warn(`   ⚠️ No se pudieron insertar los temas: ${themeError.message}`);
            }
        }

        console.log("\n✓ Ingesta y subida completada exitosamente.");
    } catch (e) {
        console.error("\n❌ Error durante la ingesta:", e);
    }
}

main();
