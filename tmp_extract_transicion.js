const fs = require('fs');
const path = require('path');

const chunksDir = path.join(__dirname, 'chunks');
const leyes = [
    { dir: 'bio', prefijo: 'LB', nombre: 'Ley de Biocombustibles' },
    { dir: 'cfepemex', prefijo: 'LCFE-LPEMEX', nombre: 'Leyes CFE y PEMEX' },
    { dir: 'geo', prefijo: 'LG', nombre: 'Ley de Geotermia' },
    { dir: 'hidro', prefijo: 'LSH', nombre: 'Ley de Hidrocarburos' },
    { dir: 'lse', prefijo: 'LSE', nombre: 'Ley de la Industria Eléctrica' },
    { dir: 'planeacion_transicion', prefijo: 'LPTE', nombre: 'Ley de Planeación y Transición' },
    { dir: 'reglamentos', prefijo: 'Reglamentos', nombre: 'Varios Reglamentos' },
];

const results = [];

// Búsqueda de términos clave para el nuevo hilo conductor
const terminosBusqueda = ["Transición Energética", "Energía Limpia", "Energías Limpias", "Sustentabilidad", "Emisiones"];

leyes.forEach(ley => {
    const dirPath = path.join(chunksDir, ley.dir);
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
        
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                data.forEach(chunk => {
                    const textContent = chunk.content.toLowerCase();
                    const matches = terminosBusqueda.filter(termino => textContent.includes(termino.toLowerCase()));
                    
                    if (matches.length > 0) {
                        results.push({
                            ley: ley.nombre,
                            archivo: file,
                            art: chunk.metadata.art,
                            terminos: matches,
                            extracto: chunk.content
                        });
                    }
                });
            } catch (e) {
                console.error(`Error leyendo ${file}`);
            }
        });
    }
});

// Guardar resultados en un reporte de markdown estructurado
let mdReport = `# Análisis Transversal: ${terminosBusqueda.join(', ')}\n\n`;
mdReport += `Total de menciones encontradas: ${results.length}\n\n`;

const byLey = {};
results.forEach(r => {
    if (!byLey[r.ley]) byLey[r.ley] = [];
    byLey[r.ley].push(r);
});

for (const [ley, menciones] of Object.entries(byLey)) {
    mdReport += `## ${ley} (${menciones.length} menciones)\n\n`;
    menciones.forEach(m => {
        mdReport += `### ${m.archivo} - **Artículo ${m.art}**\n`;
        mdReport += `- **Términos encontrados:** ${m.terminos.join(', ')}\n`;
        mdReport += `> "${m.extracto.replace(/\n/g, ' ')}"\n\n`;
    });
}

fs.writeFileSync(path.join(__dirname, 'tmp_transicion_profundo.md'), mdReport);
console.log(`Reporte listo: ${results.length} coincidencias guardadas en tmp_transicion_profundo.md`);
