const fs = require('fs');
const path = require('path');

const dataDir = path.join('c:', 'Users', 'User', 'Documents', '65.-Buscador de Leyes Energía', 'public', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_chunks.json'));

const regex = /instrumentos? de planeaci[óo]n/i;
const planesRegex = /(Programa Sectorial de Energía|Estrategia Nacional de Transición Energética|Plan de Desarrollo del|PLATEASE|PLADESE|PLADESHi|Programa de Desarrollo de)/ig;

const results = [];

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
    if (regex.test(text) || planesRegex.test(text)) {
      results.push({
        ley: data.metadata ? data.metadata.siglas || file : file,
        articulo: chunk.articulo_label || chunk.id || 'N/A',
        texto: text.replace(/\n/g, ' ').trim()
      });
    }
  });
}

const outFile = 'c:\\Users\\User\\Documents\\65.-Buscador de Leyes Energía\\tmp_instrumentos.md';
let md = "# Instrumentos de Planeación Encontrados\n\n";
results.forEach(r => {
  md += `**[${r.ley}] ${r.articulo}**: ${r.texto}\n\n`;
});

fs.writeFileSync(outFile, md);
console.log(`Encontradas ${results.length} menciones. Resultados en tmp_instrumentos.md`);
