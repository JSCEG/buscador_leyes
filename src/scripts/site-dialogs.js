/**
 * Footer dialogs: send a comment (stored in Supabase `comentarios`), terms of use and privacy.
 */
import { supabase } from '../lib/supabase.js';
import '../styles/site-dialogs.css';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const LEGAL_NOTE = 'Esta herramienta es de consulta y apoyo. El texto con validez jurídica es el publicado en el Diario Oficial de la Federación o en la fuente oficial de cada instrumento.';

const PAGES = {
    terminos: {
        title: 'Términos de uso',
        body: `<p>${esc(LEGAL_NOTE)}</p>
            <p>Los textos, resúmenes, relaciones entre instrumentos y el mapa de términos se ofrecen como guía para ubicar la normativa; no sustituyen la lectura del documento oficial ni constituyen asesoría jurídica.</p>
            <p>Cada instrumento incluye la liga a su fuente oficial. Si encuentras una diferencia entre el texto mostrado y el oficial, prevalece el oficial; te agradecemos avisarnos con «Enviar comentario».</p>`,
    },
    privacidad: {
        title: 'Privacidad',
        body: `<p>Puedes consultar el buscador sin crear una cuenta.</p>
            <p>Si inicias sesión, guardamos tus artículos guardados, notas y mesas de consulta para que los tengas en cualquier equipo. Solo tú puedes verlos.</p>
            <p>Tus búsquedas recientes, preferencias de lectura y mesas sin sesión se guardan únicamente en este navegador.</p>
            <p>Si nos envías un comentario, guardamos el mensaje, la página desde la que lo enviaste y, si lo escribes, tu correo para responderte.</p>`,
    },
};

export function openDialog(html, labelledby) {
    document.getElementById('site-dialog')?.remove();
    const returnFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.id = 'site-dialog';
    wrap.innerHTML = `<div class="sd-panel" role="dialog" aria-modal="true" aria-labelledby="${labelledby}">${html}</div>`;
    document.body.append(wrap);
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey, true); returnFocus?.focus?.({ preventScroll: true }); };
    const onKey = event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    wrap.addEventListener('click', event => { if (event.target === wrap || event.target.closest('[data-sd-close]')) close(); });
    requestAnimationFrame(() => wrap.querySelector('input, textarea, select, [data-sd-close]')?.focus());
    return { wrap, close };
}

export function openLegalPage(key) {
    const page = PAGES[key];
    if (!page) return;
    openDialog(`<header><h2 id="sd-title">${esc(page.title)}</h2><button type="button" class="sd-x" data-sd-close aria-label="Cerrar">×</button></header><div class="sd-body">${page.body}</div>`, 'sd-title');
}

export function openFeedback({ context = '' } = {}) {
    const { wrap, close } = openDialog(`<header><h2 id="sd-title">Enviar comentario</h2><button type="button" class="sd-x" data-sd-close aria-label="Cerrar">×</button></header>
        <form class="sd-body sd-form" novalidate>
            <p class="sd-intro">Cuéntanos qué encontraste o qué necesitas. Lo revisamos para mejorar el buscador.</p>
            <fieldset><legend>Tipo</legend>
                <label><input type="radio" name="tipo" value="error" checked> Algo no funciona o hay un error</label>
                <label><input type="radio" name="tipo" value="documento"> Falta un documento</label>
                <label><input type="radio" name="tipo" value="sugerencia"> Sugerencia</label>
            </fieldset>
            <label class="sd-field">Mensaje<textarea name="mensaje" rows="4" maxlength="2000" required placeholder="Describe el caso; si es un documento, incluye su nombre o liga."></textarea></label>
            <label class="sd-field">Tu correo (opcional, para responderte)<input type="email" name="correo" maxlength="160" autocomplete="email"></label>
            <p class="sd-status" role="status" aria-live="polite"></p>
            <div class="sd-actions"><button type="button" class="sd-secondary" data-sd-close>Cancelar</button><button type="submit" class="sd-primary">Enviar</button></div>
        </form>`, 'sd-title');
    const form = wrap.querySelector('form');
    const status = wrap.querySelector('.sd-status');
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const mensaje = form.mensaje.value.trim();
        const correo = form.correo.value.trim();
        if (mensaje.length < 5) { status.textContent = 'Escribe un mensaje un poco más largo.'; form.mensaje.focus(); return; }
        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { status.textContent = 'Revisa el correo o déjalo vacío.'; form.correo.focus(); return; }
        const button = form.querySelector('.sd-primary');
        button.disabled = true; status.textContent = 'Enviando…';
        const { error } = await supabase.from('comentarios').insert({
            tipo: form.tipo.value, mensaje, correo: correo || null,
            pagina: `${location.pathname}${location.hash}`.slice(0, 500), contexto: String(context).slice(0, 300) || null,
        });
        if (error) { button.disabled = false; status.textContent = 'No se pudo enviar. Intenta de nuevo en un momento.'; return; }
        form.innerHTML = '<p class="sd-thanks"><strong>¡Gracias!</strong> Recibimos tu comentario.</p><div class="sd-actions"><button type="button" class="sd-primary" data-sd-close>Cerrar</button></div>';
        form.querySelector('[data-sd-close]').focus();
        setTimeout(() => { if (wrap.isConnected) close(); }, 4000);
    });
}
