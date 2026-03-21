const fs = require('fs');
const path = require('path');

const dataDir = path.join('c:', 'Users', 'User', 'Documents', '65.-Buscador de Leyes Energía', 'public', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

const regexVinculante = /planeaci[óo]n.*vinculante|vinculante.*planeaci[óo]n/i;
const regexPND = /plan\s+nacional\s+de\s+desarrollo/i;

const results = {
  vinculante: [],
  pnd: []
};

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
  else continue;
  
  let siglas = data.metadata ? data.metadata.siglas : null;
  if (!siglas) {
      if (file.includes('Biocombustibles')) siglas = 'LB';
      else if (file.includes('Geotermia')) siglas = 'LG';
      else if (file.includes('Electric')) siglas = 'LSE';
      else if (file.includes('Hidrocar')) siglas = 'LSH';
      else if (file.includes('CFE')) siglas = 'LCFE';
      else if (file.includes('Pemex')) siglas = 'LPEMEX';
      else if (file.includes('Reglamento')) siglas = 'R-' + file.split(' ')[1];
      else siglas = file.replace('.json', '');
  }

  articulos.forEach(chunk => {
    const text = chunk.texto || chunk.content || chunk.text || JSON.stringify(chunk);
    
    if (regexVinculante.test(text)) {
      results.vinculante.push({
        ley: siglas,
        articulo: chunk.articulo_label || chunk.id || 'N/A',
        texto: text.replace(/\n/g, ' ')
      });
    }
    
    if (regexPND.test(text)) {
      results.pnd.push({
        ley: siglas,
        articulo: chunk.articulo_label || chunk.id || 'N/A',
        texto: text.replace(/\n/g, ' ')
      });
    }
  });
}

let mdReport = "# Extracción Profunda: Planeación Vinculante y PND\n\n";

mdReport += `## 1. Planeación Vinculante (${results.vinculante.length} menciones)\n\n`;
const vinculantePorLey = {};
results.vinculante.forEach(r => {
  if (!vinculantePorLey[r.ley]) vinculantePorLey[r.ley] = [];
  vinculantePorLey[r.ley].push(r);
});
Object.keys(vinculantePorLey).forEach(ley => {
  mdReport += `### Ley/Reglamento: ${ley} (${vinculantePorLey[ley].length})\n`;
  vinculantePorLey[ley].forEach(r => {
    mdReport += `- **${r.articulo}**: ${r.texto}\n\n`;
  });
});

mdReport += `\n---\n\n## 2. Plan Nacional de Desarrollo (${results.pnd.length} menciones)\n\n`;
const pndPorLey = {};
results.pnd.forEach(r => {
  if (!pndPorLey[r.ley]) pndPorLey[r.ley] = [];
  pndPorLey[r.ley].push(r);
});
Object.keys(pndPorLey).forEach(ley => {
  mdReport += `### Ley/Reglamento: ${ley} (${pndPorLey[ley].length})\n`;
  pndPorLey[ley].forEach(r => {
    mdReport += `- **${r.articulo}**: ${r.texto}\n\n`;
  });
});

fs.writeFileSync('c:\\Users\\User\\Documents\\65.-Buscador de Leyes Energía\\tmp_vinculante_profundo.md', mdReport);
console.log("Reporte generado en tmp_vinculante_profundo.md con " + results.vinculante.length + " menciones de vinculante y " + results.pnd.length + " del PND.");
