/**
 * Sends every email template, filled with sample data, to one inbox through SendGrid.
 * The key is read from the environment and never stored in the project.
 *
 * PowerShell:
 *   $env:SENDGRID_API_KEY = "SG...."          # your key
 *   $env:MAIL_FROM = "tu_correo@hotmail.com"   # a verified Single Sender in SendGrid
 *   $env:MAIL_TO = "tu_correo@hotmail.com"     # where to receive the tests
 *   npm run correos:prueba
 * Optional: $env:ONLY = "confirmar-registro"   to send just one.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'supabase/templates');
const { SENDGRID_API_KEY: key, MAIL_FROM: from, MAIL_TO: to, ONLY: only } = process.env;
if (!key || !from || !to) {
    console.error('Faltan variables: SENDGRID_API_KEY, MAIL_FROM y MAIL_TO (ver instrucciones al inicio del archivo).');
    process.exit(1);
}

const subjects = JSON.parse(fs.readFileSync(path.join(dir, 'subjects.json'), 'utf8'));
const site = 'https://buscador-leyes-jav.pages.dev';
const samples = {
    '{{ .ConfirmationURL }}': `${site}/#buscar`, '{{ .Email }}': to, '{{ .NewEmail }}': to,
    '{{tipo}}': 'Falta un documento', '{{mensaje_corto}}': 'Correo de prueba del Buscador Jurídico',
    '{{mensaje}}': 'Correo de prueba del Buscador Jurídico. Si lo recibes, el envío funciona.',
    '{{correo}}': to, '{{pagina}}': '/#buscar', '{{fecha}}': new Date().toLocaleString('es-MX'), '{{liga}}': `${site}/#buscar`,
};
const fill = text => Object.entries(samples).reduce((s, [k, v]) => s.split(k).join(v), text);

let failed = 0;
for (const [name, subject] of Object.entries(subjects)) {
    if (only && only !== name) continue;
    const html = fill(fs.readFileSync(path.join(dir, `${name}.html`), 'utf8'));
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: from, name: 'Buscador Jurídico' },
            subject: `[PRUEBA] ${fill(subject)}`,
            content: [{ type: 'text/plain', value: `Prueba de la plantilla ${name}.` }, { type: 'text/html', value: html }],
        }),
    });
    if (res.ok) console.log(`✓ ${name}`);
    else { failed++; console.log(`✗ ${name}: ${res.status} ${await res.text()}`); }
}
process.exit(failed ? 1 : 0);
