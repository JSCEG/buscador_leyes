const fs = require('fs');
const path = require('path');

const dataDir = path.join('c:', 'Users', 'User', 'Documents', '65.-Buscador de Leyes Energía', 'public', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_chunks.json'));

const temas = [
  { id: 'Consejo de Planeación', regex: /consejo\s+de\s+planeaci[óo]n/i },
  { id: 'Planeación Vinculante', regex: /planeaci[óo]n\s+vinculante/i },
  { id: 'Comités', regex: /comit[ée]s?\b/i },
  { id: 'Sustentabilidad / Transición', regex: /(sustentabilidad|desarrollo sustentable|transici[óo]n energ[ée]tica)/i },
  { id: 'Sistema de Información', regex: /sistema\s+(nacional\s+)?de\s+informaci[óo]n/i },
  { id: 'Impacto Social / Ambiental', regex: /impacto\s+(social|ambiental)/i },
  { id: 'Soberanía / Seguridad', regex: /soberan[íi]a|seguridad (energ[ée]tica|alimentaria)/i }
];

const results = {};
temas.forEach(t => results[t.id] = []);

for (const file of files) {
  const filepath = path.join(dataDir, file);
  const content = fs.readFileSync(filepath, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch(e) { continue; }
  
  let articulos = [];
  if (Array.isArray(data)) articulos = data;
  else if (data.articulos && Array.isArray(data.articulos)) articulos = data.articulos;
  
  articulos.forEach(chunk => {
    const text = chunk.texto || chunk.content || chunk.text || JSON.stringify(chunk);
    temas.forEach(tema => {
      if (tema.regex.test(text)) {
        results[tema.id].push({
          ley: data.metadata ? data.metadata.siglas || file.replace('_chunks.json', '') : file.replace('_chunks.json', ''),
          articulo: chunk.articulo_label || chunk.id || 'N/A',
          textoCorto: text.replace(/\n/g, ' ').substring(0, 400) + '...'
        });
      }
    });
  });
}

// Generar un reporte en Markdown
let mdReport = "# Temas Transversales en Leyes del Sector Energía\n\n";

temas.forEach(tema => {
  mdReport += `## ${tema.id}\n`;
  mdReport += `Total de menciones: **${results[tema.id].length}**\n\n`;
  
  // Agrupar por ley
  const porLey = {};
  results[tema.id].forEach(r => {
    if (!porLey[r.ley]) porLey[r.ley] = [];
    porLey[r.ley].push(r);
  });
  
  Object.keys(porLey).forEach(ley => {
    mdReport += `### ${ley} (${porLey[ley].length} menciones)\n`;
    porLey[ley].slice(0, 3).forEach(r => {
      mdReport += `- **${r.articulo}**: "${r.textoCorto}"...\n\n`;
    });
    if (porLey[ley].length > 3) mdReport += `*(Y ${porLey[ley].length - 3} menciones más...)*\n\n`;
  });
});

fs.writeFileSync('c:\\Users\\User\\Documents\\65.-Buscador de Leyes Energía\\analisis_temas_transversales.md', mdReport);
console.log("Reporte generado con éxito.");

// Resumen estadístico
console.log("\n=== RESUMEN ===");
temas.forEach(tema => {
  console.log(`Tema: ${tema.id} -> ${results[tema.id].length} menciones`);
});
