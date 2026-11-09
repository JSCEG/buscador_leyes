/**
 * Lists every source of the energy calculator with its date, last review and check status.
 * Run: node scripts/audit-calc-fuentes.mjs            prints the list
 *      node scripts/audit-calc-fuentes.mjs --strict   also exits 1 when any source is pending or
 *                                                     its review is older than 14 months
 * Not part of npm test: the passage of time must not break the tests. Review every February.
 */
const { auditarFuentes } = await import('../src/lib/calc/fuentes.js');

const strict = process.argv.includes('--strict');
const filas = auditarFuentes(new Date());
const ancho = Math.max(...filas.map(f => f.id.length));
for (const f of filas) {
    console.log(`${f.id.padEnd(ancho)}  fecha ${String(f.fecha).padEnd(10)}  revisado ${f.revisado}  cotejo ${f.cotejo.padEnd(9)}  ${f.problema ?? 'ok'}`);
}
const malas = filas.filter(f => f.problema);
console.log(`\n${filas.length} fuentes, ${malas.length} con problema.`);
if (strict && malas.length) process.exit(1);
