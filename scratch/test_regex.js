
const text = `
LEY GENERAL DE ECONOMÍA CIRCULAR
TÍTULO PRIMERO
DISPOSICIONES GENERALES
CAPÍTULO I
DEL OBJETO Y ÁMBITO DE APLICACIÓN
ARTÍCULO 1. La presente Ley es de orden público...
CAPÍTULO 2
OTRAS DISPOSICIONES
ARTÍCULO 2. Blah blah...
TÍTULO 2
SISTEMA NACIONAL
Capítulo Único
De la integración
ARTÍCULO 3. El Sistema...
`;

function extractThemes(text) {
    const themes = [];
    let orden = 0;
    // Current regex
    const tituloRegex = /(?:^|\n)\s*(?:T[ÍI]TULO|T[íi]tulo)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO)|(?:[IVXLCDM]+))\b[.\-–—]*\s*(?:[\n\r]+\s*)?(.{0,120})/g;
    const capituloRegex = /(?:^|\n)\s*(?:CAP[ÍI]TULO|Cap[íi]tulo)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO|[ÚU]NICO)|(?:[IVXLCDM]+))\b[.\-–—]*\s*(?:[\n\r]+\s*)?(.{0,120})/g;

    console.log("--- Testing Original Regex ---");
    let m;
    while ((m = tituloRegex.exec(text)) !== null) {
        console.log("Match Titulo:", m[0].trim(), "| Name:", m[1]);
    }
    while ((m = capituloRegex.exec(text)) !== null) {
        console.log("Match Capitulo:", m[0].trim(), "| Name:", m[1]);
    }

    // Improved regex
    const tituloRegexNew = /(?:^|\n)\s*(?:T[ÍI]TULO|T[íi]tulo)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO)|(?:[IVXLCDM]+)|\d+)\b[.\-–—]*\s*(?:[\n\r]+\s*)?(.{0,120})/gi;
    const capituloRegexNew = /(?:^|\n)\s*(?:CAP[ÍI]TULO|Cap[íi]tulo)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO|[ÚU]NICO)|(?:[IVXLCDM]+)|\d+)\b[.\-–—]*\s*(?:[\n\r]+\s*)?(.{0,120})/gi;

    console.log("\n--- Testing New Regex ---");
    while ((m = tituloRegexNew.exec(text)) !== null) {
        console.log("Match Titulo (New):", m[0].trim(), "| Name:", m[1]);
    }
    while ((m = capituloRegexNew.exec(text)) !== null) {
        console.log("Match Capitulo (New):", m[0].trim(), "| Name:", m[1]);
    }
}

extractThemes(text);
