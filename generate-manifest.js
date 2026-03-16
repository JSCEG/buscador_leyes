const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public/data');
const outputFile = path.join(dataDir, 'manifest.json');

try {
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file !== 'manifest.json');
  fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));
  console.log('Manifest generated:', files);
} catch (err) {
  console.error('Error generating manifest:', err);
  process.exit(1);
}
