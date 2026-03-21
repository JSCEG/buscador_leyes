const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public', 'data');

function normalizeStr(str) {
    if(!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const temas = {
    "Transición y Sustentabilidad": ["transicion energetica", "energia limpia", "energias limpias", "desarrollo sustentable", "cambio climatico", "reduccion de emisiones", "sustentabilidad"],
    "Soberanía y Seguridad Energética": ["soberania", "seguridad energetica", "autosuficiencia", "confiabilidad", "continuidad"],
    "Justicia y Utilidad Pública": ["justicia energetica", "utilidad publica", "interes general", "pueblo de mexico", "desarrollo nacional"]
};

const results = {};

for (const p of Object.keys(temas)) {
    results[p] = { count: 0, byFile: {} };
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');

files.forEach(file => {
    for (const p of Object.keys(temas)) {
        results[p].byFile[file] = [];
    }

    const filePath = path.join(dataDir, file);
    try {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Handle different possible JSON structures (we saw one with .articulos array)
        let articulosArray = [];
        if (Array.isArray(jsonData)) {
             articulosArray = jsonData;
        } else if (jsonData && Array.isArray(jsonData.articulos)) {
             articulosArray = jsonData.articulos;
        }

        articulosArray.forEach(chunk => {
            const content = chunk.texto || chunk.content || chunk.text || "";
            const artLabel = chunk.articulo_label || (chunk.metadata ? chunk.metadata.art : null) || chunk.id || "N/A";

            if(!content) return;
            const textNorm = normalizeStr(content);
            
            for (const [temaName, keywords] of Object.entries(temas)) {
                const matches = keywords.filter(k => textNorm.includes(k));
                if (matches.length > 0) {
                    results[temaName].count++;
                    results[temaName].byFile[file].push({
                        art: artLabel,
                        terms: matches,
                        extracto: content.substring(0, 150).replace(/\n/g, ' ') + "..."
                    });
                }
            }
        });
    } catch (e) {
        console.error(`Error leyendo ${file}:`, e.message);
    }
});

let mdReport = `# Análisis de Candidatos a Tema Transversal 03\n\n`;

for (const [temaName, data] of Object.entries(results)) {
    mdReport += `## ${temaName} - Total: ${data.count} menciones\n\n`;
    for (const [file, menciones] of Object.entries(data.byFile)) {
        if(menciones.length > 0) {
            mdReport += `- **${file}**: ${menciones.length} menciones\n`;
        }
    }
    mdReport += `\n### Ejemplos en ${temaName}:\n`;
    
    let examples = [];
    for(const l of Object.keys(data.byFile)) {
        if(data.byFile[l].length > 0) examples.push({ file: l, data: data.byFile[l][0] });
    }
    examples.slice(0, 5).forEach(m => {
         mdReport += `> **${m.file} (Art. ${m.data.art})**: "${m.data.extracto}" (Términos: ${m.data.terms.join(',')})\n\n`;
    });
    mdReport += `---\n\n`;
}

fs.writeFileSync(path.join(__dirname, 'tmp_evaluacion_temas.md'), mdReport);
console.log(`Evaluación de temas lista en tmp_evaluacion_temas.md`);
