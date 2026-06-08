const fs = require('fs');
const path = require('path');
const { extractLegalStructureFromText, normalizeLegalText } = require('../legal-ingest-pipeline');

// Mock or override normalizeLegalText to test the new regex
function testNormalizeLegalText(rawText) {
    let text = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/----------------Page \(\d+\) Break----------------/g, '\n')
        .replace(/https:\/\/www\.dof\.gob\.mx[^\s)]+/gi, ' ')
        .replace(/(?:^|\n)\s*\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}\s+DOF[^\n]*/gi, '\n')
        .replace(/(?:^|\n)\s*DIARIO OFICIAL[^\n]*/gi, '\n')
        .replace(/(?:^|\n)\s*DOF - Diario Oficial de la Federación[^\n]*/gi, '\n')
        .replace(/(?:^|\n)\s*\(Edición [^)]+\)\s*/gi, '\n')
        .replace(/(?:^|\n)\s*\d+\/\d+\s*(?=\n|$)/g, '\n')
        .replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ])-\n\s*([A-Za-zÁÉÍÓÚÑáéíóúñ])/g, '$1$2')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n');

    // New ensureHeadingBoundaries logic
    text = text
        .replace(/(^|\s)(\d{1,3})A,\s+(?=[A-ZÁÉÍÓÚÑ])/gmu, '$1\n$2. ')
        .replace(/([.;:\s]|^)\s*(\d{1,3})\.\s+(?=[A-ZÁÉÍÓÚÑ])/gmu, '$1\n$2. ')
        .replace(/(?<!\n)(?<=^|[.;:!?])\s+((?:ART[ÍI]CULO|Artículo)\s+(?:\d+(?:[º°oO])?(?:\s+(?:Bis|Ter|Qu[áa]ter|Quater|Quinquies|Sexies|Septies|Octies|Novies|Decies))?|[ÚU]NICO)(?:\.-|[.:-]))(?=\s+|$)/gu, '\n$1')
        .replace(/([.;:!?])\s+(TRANSITORIOS?)(?=\s|$)/giu, '$1\n$2')
        .replace(/([.;:!?])\s+((?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N)\s+[A-ZÁÉÍÓÚÑIVXLCDM]+)/giu, '$1\n$2');

    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line, index, all) => line || (index > 0 && all[index - 1] !== ''))
        .join('\n')
        .trim();
}

function main() {
    const rawTextPath = path.join(__dirname, 'dof_raw_text.txt');
    if (!fs.existsSync(rawTextPath)) {
        console.error("No se encontró dof_raw_text.txt.");
        return;
    }

    const text = fs.readFileSync(rawTextPath, 'utf8');
    
    // Test normalización
    const normalized = testNormalizeLegalText(text);
    fs.writeFileSync(path.join(__dirname, 'dof_normalized_text.txt'), normalized, 'utf8');
    console.log("Texto normalizado con la nueva regex guardado en dof_normalized_text.txt.");

    // Parsear usando una función modificada de chunkLegalText
    const lines = normalized.split('\n');
    console.log(`Líneas obtenidas en normalización: ${lines.length}`);
    
    const sampleNumberedLines = lines.filter(l => l.trim().match(/^(\d{1,3})\.(?:\s+|$)/));
    console.log(`Líneas que empiezan con número (1-999.): ${sampleNumberedLines.length}`);
    console.log("Muestra de líneas numéricas detectadas:");
    sampleNumberedLines.slice(0, 10).forEach(l => console.log(`  - ${l.substring(0, 80)}`));
}

main();
