const fs = require('fs');

function extractArticles(text) {
    // Limpieza inicial: quitamos separadores de página extraños de pdf2json
    let cleanText = text.replace(/----------------Page \(\d+\) Break----------------/g, '');
    // Limpiamos la cabecera repetitiva que suele aparecer en el DOF
    cleanText = cleanText.replace(/Viernes \d+ de \w+ de \d+.*DIARIO OFICIAL.*\(Edición \w+\)/gi, '');
    cleanText = cleanText.replace(/.*DOF - Diario Oficial de la Federación.*/g, '');
    cleanText = cleanText.replace(/https:\/\/www\.dof\.gob\.mx.*/g, '');
    
    // Unir palabras cortadas con guión al final de la línea
    cleanText = cleanText.replace(/(\w+)-\n\s*(\w+)/g, "$1$2");
    
    // RegEx principal para identificar el inicio de un artículo.
    // Soporta: "Artículo 1.", "Artículo 1.-", "ARTÍCULO ÚNICO", "Artículo 1o.", "Art. 1"
    const articleRegex = /(ART[ÍI]CULO\s+(?:\d+[oOaA]?\b|[ÚU]NICO\b)[^\n]*|TRANSITORIOS[^\n]*)/gi;
    
    // Partir el texto
    const parts = cleanText.split(articleRegex);
    
    const chunks = [];
    // parts[0] suele ser el preámbulo / Considerandos
    if (parts[0] && parts[0].trim().length > 0) {
        chunks.push({ identificador: "Preámbulo/Considerandos", contenido: parts[0].trim().replace(/\s+/g, ' ') });
    }
    
    for (let i = 1; i < parts.length; i += 2) {
        const title = parts[i].trim();
        let content = parts[i + 1] ? parts[i + 1].trim() : "";
        content = content.replace(/\s+/g, ' '); // normalizar espacios
        
        chunks.push({
            identificador: title,
            contenido: content.length > 500 ? content.substring(0, 500) + '... [CORTADO]' : content
        });
    }
    
    return chunks;
}

const textSener = fs.readFileSync('tmp_sener.txt', 'utf-8');
const chunksSener = extractArticles(textSener);
fs.writeFileSync('chunks_sener.json', JSON.stringify(chunksSener, null, 2));
console.log(`Extraidos ${chunksSener.length} chunks de SENER.`);

const textLpte = fs.readFileSync('tmp_lpte.txt', 'utf-8');
const chunksLpte = extractArticles(textLpte);
fs.writeFileSync('chunks_lpte.json', JSON.stringify(chunksLpte, null, 2));
console.log(`Extraidos ${chunksLpte.length} chunks de LPTE.`);
