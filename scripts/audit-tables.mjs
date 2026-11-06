/**
 * Proves the table presentation never changes official content: for every article with a table it
 * compares words and cell count before and after sanitizeArticleHtml.
 * Run: node scripts/audit-tables.mjs            reads the articles from Supabase (needs .env)
 *      node scripts/audit-tables.mjs --local    reads public/data/*.json
 */
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
for (const name of ['document', 'DOMParser', 'HTMLElement', 'Node']) globalThis[name] = window[name];
const { sanitizeArticleHtml } = await import('../src/lib/article-html.js');

const PAGE = 500;
const TIMEOUT_MS = 20000;
const words = html => { const box = document.createElement('div'); box.innerHTML = html; return { text: box.textContent.replace(/\s+/g, ' ').trim(), cells: box.querySelectorAll('td, th').length }; };

async function fromSupabase() {
    const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter(line => line.includes('=')).map(line => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
    const rows = [];
    for (let from = 0; ; from += PAGE) {
        const url = `${env.VITE_SUPABASE_URL}/rest/v1/articulos?select=id,contenido&contenido=ilike.*%3Ctable*&order=id&limit=${PAGE}&offset=${from}`;
        const response = await fetch(url, { headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!response.ok) throw new Error(`Supabase respondió ${response.status}`);
        const page = await response.json();
        rows.push(...page);
        if (page.length < PAGE) return rows;
    }
}

function fromLocal() {
    const rows = [];
    for (const file of readdirSync('public/data').filter(name => name.endsWith('.json') && name !== 'manifest.json')) {
        const data = JSON.parse(readFileSync(`public/data/${file}`, 'utf8'));
        for (const article of data.articulos || []) if (/<table/i.test(article.texto || '')) rows.push({ id: article.id, contenido: article.texto });
    }
    return rows;
}

const local = process.argv.includes('--local');
const rows = local ? fromLocal() : await fromSupabase().catch(error => {
    console.error(`No se pudo leer Supabase: ${error.message}. La auditoría NO se hizo.`);
    process.exit(2);
});
const bad = rows.filter(row => {
    const before = words(row.contenido);
    const after = words(sanitizeArticleHtml(row.contenido));
    return before.text !== after.text || before.cells !== after.cells;
});
console.log(`${rows.length} artículos con tabla (${local ? 'local' : 'Supabase'}), ${bad.length} con diferencias.`);
bad.slice(0, 20).forEach(row => console.log(' ', row.id));
process.exit(bad.length ? 1 : 0);
