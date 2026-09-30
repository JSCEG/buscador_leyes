/**
 * Builds the branded email templates (table layout, inline styles, works in Outlook/Gmail).
 * Output: supabase/templates/*.html  (paste each into Supabase → Authentication → Email Templates)
 *         supabase/templates/preview.html (all of them, with sample data, to review in a browser)
 * Run: node scripts/build-email-templates.mjs [https://tu-dominio]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.argv[2] || 'https://buscador-leyes-jav.pages.dev').replace(/\/$/, '');
const out = path.join(root, 'supabase/templates');
fs.mkdirSync(out, { recursive: true });

const F = "'Noto Sans',Arial,Helvetica,sans-serif";
const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px"><tr><td bgcolor="#9B2247" style="border-radius:999px">
  <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${F};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${label}</a></td></tr></table>`;

function layout({ preheader, eyebrow, title, body, action, note }) {
    return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#F4F1EC">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F1EC"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
    <tr><td style="padding:0 4px 14px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td><img src="${SITE}/img/logo_gob.png" alt="Gobierno de México" height="34" style="height:34px;border:0;display:inline-block;vertical-align:middle">
            <img src="${SITE}/img/logo_sener.png" alt="Secretaría de Energía" height="36" style="height:36px;border:0;display:inline-block;vertical-align:middle;margin-left:14px"></td>
      </tr></table></td></tr>
    <tr><td bgcolor="#9B2247" style="height:6px;line-height:6px;font-size:0;border-radius:14px 14px 0 0;background:linear-gradient(90deg,#9B2247 0%,#9B2247 60%,#A57F2C 60%,#A57F2C 100%)">&nbsp;</td></tr>
    <tr><td bgcolor="#ffffff" style="padding:34px 36px 30px;border-radius:0 0 14px 14px;font-family:${F};color:#302B27">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9B2247">${eyebrow}</p>
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#302B27">${title}</h1>
      <div style="font-size:15.5px;line-height:1.65;color:#4A453F">${body}</div>
      ${action || ''}
      ${note ? `<p style="margin:22px 0 0;padding:14px 16px;border-radius:10px;background:#FAF8F5;font-size:13px;line-height:1.55;color:#6A655E">${note}</p>` : ''}
    </td></tr>
    <tr><td style="padding:20px 8px 6px;font-family:${F};font-size:12px;line-height:1.6;color:#8A847C;text-align:center">
      Buscador Jurídico · Secretaría de Energía · Gobierno de México<br>
      <a href="${SITE}" style="color:#9B2247;text-decoration:none">${SITE.replace(/^https?:\/\//, '')}</a><br>
      Herramienta de consulta y apoyo. El texto con validez jurídica es el publicado en el Diario Oficial de la Federación.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

const fallback = url => `<p style="margin:14px 0 0;font-size:12.5px;color:#8A847C">Si el botón no funciona, copia y pega esta liga en tu navegador:<br><span style="word-break:break-all;color:#6A655E">${url}</span></p>`;

// Supabase variables: {{ .ConfirmationURL }}, {{ .Email }}, {{ .NewEmail }}
const TEMPLATES = {
    'confirmar-registro': {
        subject: 'Confirma tu cuenta del Buscador Jurídico',
        html: layout({
            preheader: 'Un clic para activar tu cuenta y guardar artículos, notas y mesas de consulta.',
            eyebrow: 'Bienvenida', title: 'Confirma tu cuenta',
            body: '<p style="margin:0 0 12px">Gracias por registrarte en el Buscador Jurídico del sector energético.</p><p style="margin:0">Con tu cuenta podrás guardar artículos, escribir notas y conservar tus mesas de consulta en cualquier equipo.</p>',
            action: button('{{ .ConfirmationURL }}', 'Confirmar mi cuenta') + fallback('{{ .ConfirmationURL }}'),
            note: 'Si no creaste esta cuenta, ignora este correo; no se activará nada.',
        }),
    },
    'restablecer-contrasena': {
        subject: 'Restablece tu contraseña del Buscador Jurídico',
        html: layout({
            preheader: 'Crea una contraseña nueva para tu cuenta.',
            eyebrow: 'Seguridad de tu cuenta', title: 'Restablece tu contraseña',
            body: '<p style="margin:0">Recibimos una solicitud para cambiar la contraseña de la cuenta <strong>{{ .Email }}</strong>. Usa el botón para crear una nueva.</p>',
            action: button('{{ .ConfirmationURL }}', 'Crear contraseña nueva') + fallback('{{ .ConfirmationURL }}'),
            note: 'Si no lo solicitaste, ignora este correo: tu contraseña actual sigue funcionando. La liga vence en una hora.',
        }),
    },
    'enlace-acceso': {
        subject: 'Tu enlace para entrar al Buscador Jurídico',
        html: layout({
            preheader: 'Entra con un clic, sin contraseña.',
            eyebrow: 'Acceso', title: 'Entra al Buscador Jurídico',
            body: '<p style="margin:0">Usa este enlace para iniciar sesión con <strong>{{ .Email }}</strong>.</p>',
            action: button('{{ .ConfirmationURL }}', 'Entrar') + fallback('{{ .ConfirmationURL }}'),
            note: 'El enlace funciona una sola vez y vence en una hora. Si no lo pediste, ignora este correo.',
        }),
    },
    'cambio-correo': {
        subject: 'Confirma tu nuevo correo en el Buscador Jurídico',
        html: layout({
            preheader: 'Confirma el cambio de correo de tu cuenta.',
            eyebrow: 'Seguridad de tu cuenta', title: 'Confirma tu nuevo correo',
            body: '<p style="margin:0">Pediste cambiar el correo de tu cuenta de <strong>{{ .Email }}</strong> a <strong>{{ .NewEmail }}</strong>.</p>',
            action: button('{{ .ConfirmationURL }}', 'Confirmar el cambio') + fallback('{{ .ConfirmationURL }}'),
            note: 'Si no reconoces este cambio, no hagas clic y cambia tu contraseña.',
        }),
    },
    // Sent by the notificar-comentario function; {{campo}} is filled there.
    'nuevo-comentario': {
        subject: 'Nuevo comentario en el Buscador Jurídico: {{tipo}}',
        html: layout({
            preheader: '{{tipo}} · {{mensaje_corto}}',
            eyebrow: 'Comentario recibido', title: '{{tipo}}',
            body: `<p style="margin:0 0 14px;padding:14px 16px;border-left:4px solid #9B2247;background:#FBF4F6;border-radius:0 10px 10px 0;white-space:pre-line">{{mensaje}}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:13.5px;color:#4A453F">
                <tr><td style="padding:3px 14px 3px 0;color:#8A847C">Correo</td><td>{{correo}}</td></tr>
                <tr><td style="padding:3px 14px 3px 0;color:#8A847C">Página</td><td>{{pagina}}</td></tr>
                <tr><td style="padding:3px 14px 3px 0;color:#8A847C">Fecha</td><td>{{fecha}}</td></tr></table>`,
            action: button('{{liga}}', 'Abrir la página'),
            note: 'Marca el comentario como atendido en Supabase (tabla comentarios, columna atendido).',
        }),
    },
};

const samples = {
    '{{ .ConfirmationURL }}': `${SITE}/#confirmar-ejemplo`, '{{ .Email }}': 'persona@sener.gob.mx', '{{ .NewEmail }}': 'nuevo@sener.gob.mx',
    '{{tipo}}': 'Falta un documento', '{{mensaje_corto}}': 'Falta el Reglamento de la Ley de…', '{{mensaje}}': 'Falta el Reglamento de la Ley de Planeación y Transición Energética publicado el 3 de octubre.',
    '{{correo}}': 'persona@sener.gob.mx', '{{pagina}}': '/#buscar', '{{fecha}}': '30 sep 2026, 13:05', '{{liga}}': `${SITE}/#buscar`,
};
const fill = html => Object.entries(samples).reduce((s, [k, v]) => s.split(k).join(v), html);

const index = [];
for (const [name, t] of Object.entries(TEMPLATES)) {
    fs.writeFileSync(path.join(out, `${name}.html`), t.html);
    index.push(`<section style="margin:0 0 40px"><h2 style="font:600 14px Arial;color:#555">${name}.html · Asunto: «${t.subject.replace(/\{\{tipo\}\}/, 'Falta un documento')}»</h2><iframe title="${name}" srcdoc="${fill(t.html).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" style="width:100%;height:760px;border:1px solid #ddd;border-radius:8px;background:#fff"></iframe></section>`);
}
fs.writeFileSync(path.join(out, 'subjects.json'), JSON.stringify(Object.fromEntries(Object.entries(TEMPLATES).map(([k, t]) => [k, t.subject])), null, 2));
fs.writeFileSync(path.join(out, 'preview.html'), `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Vista previa de correos</title></head><body style="max-width:760px;margin:30px auto;font-family:Arial;padding:0 12px"><h1 style="font:700 22px Arial">Vista previa de correos · Buscador Jurídico</h1>${index.join('')}</body></html>`);
console.log('wrote', Object.keys(TEMPLATES).length, 'templates + preview for', SITE);
