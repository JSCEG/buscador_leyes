// Emite exclusivamente el SQL cuya huella coincide con el manifiesto revisado.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const name = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'sql-manifest.json'), 'utf8'));
const entry = manifest.find(item => item.name === name);
if (!entry) throw Error('Instrumento desconocido');
const sql = fs.readFileSync(path.join(__dirname, name + '-aplicar.sql'), 'utf8');
if (crypto.createHash('sha256').update(sql).digest('hex') !== entry.sha256) throw Error('El SQL cambió desde la revisión');
if (process.argv[3] === 'meta') process.stdout.write(JSON.stringify({chars: sql.length, sha256: entry.sha256}));
else process.stdout.write(process.argv[3] === undefined ? sql : sql.slice(Number(process.argv[3]), Number(process.argv[3]) + Number(process.argv[4])));
