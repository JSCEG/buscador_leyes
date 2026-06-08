const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { extractLegalStructureFromText } = require('../legal-ingest-pipeline');

async function main() {
    const htmlPath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\35ebd807-9f99-4637-b13b-f2447270609c\\.system_generated\\steps\\87\\content.md';
    if (!fs.existsSync(htmlPath)) {
        console.error("No se encontró el archivo content.md con el HTML.");
        return;
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Usar JSDOM con CSS desactivado
    const dom = new JSDOM(htmlContent, {
        resources: "usable",
        features: { FetchExternalResources: [], ProcessExternalResources: false }
    });
    const doc = dom.window.document;
    const detailDiv = doc.getElementById('DivDetalleNota');
    if (!detailDiv) {
        console.error("No se encontró DivDetalleNota en el HTML.");
        return;
    }

    // Extraer texto limpio de DivDetalleNota
    const text = detailDiv.textContent || '';
    fs.writeFileSync(path.join(__dirname, 'dof_raw_text.txt'), text, 'utf8');
    console.log("Texto extraído de DivDetalleNota y guardado en dof_raw_text.txt.");

    console.log("\nProcesando con extractLegalStructureFromText...");
    const result = extractLegalStructureFromText(text);
    console.log(`- Fragmentos obtenidos: ${result.chunks.length}`);
    console.log(`- Temas obtenidos: ${result.themes.length}`);
    
    console.log("\nPrimeros 5 fragmentos:");
    result.chunks.slice(0, 5).forEach((chunk, i) => {
        console.log(`\n[${i + 1}] ID: ${chunk.identificador} (${chunk.tipo})`);
        console.log(`Hierarchy: T=${chunk.titulo_nombre}, C=${chunk.capitulo_nombre}, S=${chunk.seccion_nombre}`);
        console.log(`Content: ${chunk.contenido.substring(0, 200)}...`);
    });

    console.log("\nTemas detectados:");
    result.themes.forEach((theme) => {
        console.log(`- [${theme.nivel}] ${theme.nombre} (Orden: ${theme.orden})`);
    });
}

main().catch(console.error);
