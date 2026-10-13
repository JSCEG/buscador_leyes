/**
 * "¿Cómo funciona?" (#como-funciona and #como-funciona=<id>): plain-language explainers of energy
 * installations around an interactive isometric figure, linked to the acervo, the CNE trámite
 * guides and the permits map.
 */
import { CONCEPTOS, CONCEPTO } from '../data/como-funciona.js';
import { tramiteById } from '../data/tramites.js';
import { lawBySiglas } from './cne-shared.js';
import '../styles/como-funciona.css';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dark = () => document.documentElement.classList.contains('dark-mode');
const figureUrl = id => `/conceptos/${id}${dark() ? '' : '-light'}.html`;

/**
 * @param {HTMLElement} container
 * @param {() => object[]} catalog acervo summaries (may still be loading)
 * @param {{ id?: string|null, onOpenLaw: (law: object) => void, onRoute: (hash: string) => void }} options
 */
export function renderComoFuncionaView(container, catalog, { id = null, onOpenLaw, onRoute }) {
    let alive = true;
    const onMessage = event => {
        if (event.origin !== location.origin || event.data?.type !== 'concepto-height') return;
        const frame = container.querySelector(`iframe[data-concepto="${CSS.escape(event.data.id)}"]`);
        if (frame && Number.isFinite(event.data.h)) frame.style.height = `${Math.ceil(event.data.h)}px`;
    };
    window.addEventListener('message', onMessage);

    function showList() {
        container.innerHTML = `
            <section class="cf-view" aria-labelledby="cf-title">
                <header class="cf-head">
                    <p class="cf-kicker">Explicaciones generales · no son texto legal</p>
                    <h1 id="cf-title">¿Cómo funciona?</h1>
                    <p class="cf-intro">Cómo funcionan las instalaciones del sector energético, con una ilustración que puedes mover, las leyes que las regulan y los permisos que necesitan.</p>
                </header>
                <div class="cf-grid">${CONCEPTOS.map(c => `
                    <a class="cf-card" href="#como-funciona=${esc(c.id)}">
                        <span class="cf-card-sector">${esc(c.sector === 'electricidad' ? 'Electricidad' : c.sector === 'hidrocarburos' ? 'Hidrocarburos' : 'Transición energética')}</span>
                        <strong>${esc(c.titulo)}</strong>
                        <span class="cf-card-text">${esc(c.resumen)}</span>
                        <span class="cf-card-go">Ver cómo funciona →</span>
                    </a>`).join('')}
                    <div class="cf-card cf-soon" aria-hidden="true"><strong>Próximamente</strong><span class="cf-card-text">Gasolinera e hidrógeno verde.</span></div>
                </div>
            </section>`;
    }

    function showConcept(concept) {
        const summaries = typeof catalog === 'function' ? catalog() || [] : catalog;
        const laws = concept.ley.siglas.map(siglas => ({ siglas, law: lawBySiglas(summaries, siglas) }));
        const tramites = concept.tramites.map(tramiteById).filter(Boolean);
        container.innerHTML = `
            <article class="cf-view cf-concept" aria-labelledby="cf-title">
                <a class="cf-back" href="#como-funciona">← Todas las explicaciones</a>
                <header class="cf-head">
                    <p class="cf-kicker">¿Cómo funciona?</p>
                    <h1 id="cf-title">${esc(concept.titulo)}</h1>
                    <p class="cf-intro">${esc(concept.resumen)}</p>
                    <button type="button" class="cf-share" data-share><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span></button>
                </header>
                <div class="cf-figure">
                    <iframe data-concepto="${esc(concept.id)}" src="${figureUrl(concept.figura)}" title="Ilustración interactiva: ${esc(concept.titulo)}" loading="lazy"></iframe>
                </div>
                <section class="cf-section" aria-labelledby="cf-claves">
                    <h2 id="cf-claves">En palabras simples</h2>
                    <ol class="cf-steps">${concept.claves.map(text => `<li>${esc(text)}</li>`).join('')}</ol>
                </section>
                <section class="cf-section" aria-labelledby="cf-partes">
                    <h2 id="cf-partes">Sus partes</h2>
                    <dl class="cf-parts">${concept.partes.map((p, i) => `<div><dt><span class="cf-num" aria-hidden="true">${i + 1}</span>${esc(p.nombre)}</dt><dd>${esc(p.texto)}</dd></div>`).join('')}</dl>
                </section>
                <section class="cf-section" aria-labelledby="cf-ley">
                    <h2 id="cf-ley">Qué dice la ley</h2>
                    <p>${esc(concept.ley.texto)}</p>
                    <div class="cf-links">${laws.map(({ siglas, law }) => (law
                        ? `<button type="button" class="cf-law" data-law="${esc(law.id)}"><b>${esc(law.siglas || siglas)}</b><span>${esc(law.titulo)}</span></button>`
                        : '')).join('')}</div>
                </section>
                ${tramites.length || concept.mapa ? `<section class="cf-section" aria-labelledby="cf-permisos">
                    <h2 id="cf-permisos">Permisos y trámites</h2>
                    <div class="cf-links">
                        ${tramites.map(t => `<a class="cf-link" href="#tramite=${esc(t.id)}"><b>Guía de trámite</b><span>${esc(t.title)}</span></a>`).join('')}
                        ${concept.mapa ? `<a class="cf-link" href="${esc(concept.mapa.hash)}"><b>Mapa</b><span>${esc(concept.mapa.texto)}</span></a>` : ''}
                    </div>
                </section>` : ''}
                <section class="cf-section" aria-labelledby="cf-prueba">
                    <h2 id="cf-prueba">Ponte a prueba</h2>
                    <div class="cf-quiz">${concept.preguntas.map((q, i) => `
                        <fieldset class="cf-q" data-q="${i}">
                            <legend>${esc(q.pregunta)}</legend>
                            ${q.opciones.map((o, j) => `<button type="button" class="cf-opt" data-opt="${j}">${esc(o)}</button>`).join('')}
                            <p class="cf-verdict" aria-live="polite"></p>
                        </fieldset>`).join('')}</div>
                </section>
                <section class="cf-sources" aria-labelledby="cf-fuentes">
                    <h2 id="cf-fuentes">Fuentes</h2>
                    <ol class="cf-refs">${concept.fuentes.map(f => {
                        const law = f.acervo ? laws.find(item => item.siglas === f.acervo)?.law : null;
                        const title = f.url ? `<a href="${esc(f.url)}" target="_blank" rel="noopener"><i>${esc(f.titulo)}</i></a>` : `<i>${esc(f.titulo)}</i>`;
                        return `<li>${esc(f.autor)}${f.url ? ` (${esc(f.fecha)}). ${title}${/[?!.]$/.test(f.titulo) ? "" : "."}` : `. ${title}, ${esc(f.fecha)}.`}${f.consulta ? ` Consultado el ${esc(f.consulta)}.` : ''}${law ? ` <button type="button" class="cf-ref-law" data-law="${esc(law.id)}">Ver en el acervo</button>` : ''}</li>`;
                    }).join('')}</ol>
                    <p class="cf-note">Explicación general con fines informativos; no es texto legal ni sustituye la normativa. ${concept.revisado ? `Revisado el ${esc(concept.revisado)}.` : '<span class="cf-draft">Borrador en revisión.</span>'}</p>
                </section>
            </article>`;
        // Share the explainer: the phone's share sheet (WhatsApp…), or copy the link on a computer.
        container.querySelector('[data-share]')?.addEventListener('click', async event => {
            const button = event.currentTarget;
            const url = `${location.origin}/#como-funciona=${concept.id}`;
            const text = `¿Cómo funciona una ${concept.titulo.toLowerCase()}? Mírala en movimiento:`;
            const mobile = matchMedia('(pointer: coarse)').matches;
            if (navigator.share && mobile) {
                try { await navigator.share({ title: `¿Cómo funciona? · ${concept.titulo}`, text, url }); } catch { /* cancelled */ }
                return;
            }
            const label = button.querySelector('span');
            try { await navigator.clipboard.writeText(url); label.textContent = 'Enlace copiado'; } catch { window.prompt('Copia el enlace:', url); }
            setTimeout(() => { if (label.isConnected) label.textContent = 'Compartir'; }, 2200);
        });
        container.querySelectorAll('[data-law]').forEach(button => button.addEventListener('click', () => {
            const law = laws.find(item => String(item.law?.id) === button.dataset.law)?.law;
            if (law) onOpenLaw(law);
        }));
        container.querySelectorAll('.cf-q').forEach(set => {
            const question = concept.preguntas[Number(set.dataset.q)];
            set.addEventListener('click', event => {
                const option = event.target.closest('.cf-opt');
                if (!option) return;
                const right = Number(option.dataset.opt) === question.correcta;
                set.querySelectorAll('.cf-opt').forEach(b => { b.classList.toggle('is-right', Number(b.dataset.opt) === question.correcta && right); b.classList.toggle('is-wrong', b === option && !right); });
                set.querySelector('.cf-verdict').textContent = right ? '¡Correcto!' : 'Casi. Revisa «En palabras simples» y vuelve a intentar.';
            });
        });
    }

    function show(nextId) {
        if (!alive) return;
        const concept = nextId ? CONCEPTO[nextId] : null;
        if (nextId && !concept) { onRoute('#como-funciona'); showList(); return; }
        if (concept) showConcept(concept); else showList();
    }

    show(id);
    return {
        show,
        destroy() { alive = false; window.removeEventListener('message', onMessage); container.replaceChildren(); },
    };
}
