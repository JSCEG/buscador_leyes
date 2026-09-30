// Emails the admins when someone sends a comment (Database Webhook: INSERT on public.comentarios).
// Secrets (Supabase → Edge Functions → Secrets):
//   SENDGRID_API_KEY   SendGrid key with "Mail Send" permission
//   MAIL_FROM          sender on the authenticated domain, e.g. avisos@tudominio.mx
//   NOTIFY_TO          comma-separated recipients
//   WEBHOOK_SECRET     shared secret; the webhook sends it in the x-webhook-secret header
//   SITE_URL           public URL of the buscador
// Test without the webhook: POST {"prueba": true} with the same header.
import { HTML, SUBJECT } from './template.ts';

const TYPES: Record<string, string> = { error: 'Algo no funciona o hay un error', documento: 'Falta un documento', sugerencia: 'Sugerencia' };
const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));

Deno.serve(async req => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const secret = Deno.env.get('WEBHOOK_SECRET');
    if (!secret || req.headers.get('x-webhook-secret') !== secret) return new Response('Unauthorized', { status: 401 });

    const body = await req.json().catch(() => ({}));
    const row = body.prueba
        ? { tipo: 'documento', mensaje: 'Correo de prueba del Buscador Jurídico. Si lo recibes, la configuración funciona.', correo: null, pagina: '/#buscar', created_at: new Date().toISOString() }
        : body.record;
    if (!row?.mensaje) return new Response('No record', { status: 400 });

    const site = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '');
    const tipo = TYPES[row.tipo] || 'Comentario';
    const fecha = new Date(row.created_at || Date.now()).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'medium', timeStyle: 'short' });
    const values: Record<string, string> = {
        '{{tipo}}': esc(tipo),
        '{{mensaje}}': esc(row.mensaje),
        '{{mensaje_corto}}': esc(String(row.mensaje).slice(0, 90)),
        '{{correo}}': esc(row.correo || 'No lo dejó'),
        '{{pagina}}': esc(row.pagina || '—'),
        '{{fecha}}': esc(fecha),
        '{{liga}}': esc(`${site}${String(row.pagina || '/').startsWith('/') ? row.pagina || '/' : '/'}`),
    };
    const fill = (text: string) => Object.entries(values).reduce((s, [k, v]) => s.split(k).join(v), text);

    const to = (Deno.env.get('NOTIFY_TO') || '').split(',').map(s => s.trim()).filter(Boolean).map(email => ({ email }));
    const payload = {
        personalizations: [{ to }],
        from: { email: Deno.env.get('MAIL_FROM'), name: 'Buscador Jurídico' },
        ...(row.correo ? { reply_to: { email: row.correo } } : {}),
        subject: fill(SUBJECT).replace(/&amp;/g, '&'),
        content: [{ type: 'text/plain', value: `${tipo}\n\n${row.mensaje}\n\nCorreo: ${row.correo || 'No lo dejó'}\nPágina: ${row.pagina || '—'}\nFecha: ${fecha}` },
                  { type: 'text/html', value: fill(HTML) }],
    };
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) return new Response(`SendGrid ${res.status}: ${await res.text()}`, { status: 502 });
    return new Response('sent', { status: 200 });
});
