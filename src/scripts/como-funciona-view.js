/**
 * "¿Cómo funciona?" (#como-funciona and #como-funciona=<id>): plain-language explainers of energy
 * installations around an interactive isometric figure, linked to the acervo, the CNE trámite
 * guides and the permits map.
 */
import { CONCEPTOS, CONCEPTO, NIVELES, EJES_RECTORES, GLOSARIO_REGULATORIO, HILO_SECTOR, PUENTE_HILO, siguienteConcepto, anteriorConcepto } from '../data/como-funciona.js';
import { tramiteById } from '../data/tramites.js';
import { lawBySiglas } from './cne-shared.js';
import { learnPath, shareUrl } from '../lib/seo-paths.js';
import '../styles/como-funciona.css';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dark = () => document.documentElement.classList.contains('dark-mode');
const figureUrl = id => `/conceptos/${id}${dark() ? '' : '-light'}.html`;
// Card thumbnails: still captures of each figure (scripts/build-concept-thumbs.mjs).
const thumbUrl = id => `/conceptos/miniaturas/${id}${dark() ? '' : '-light'}.webp`;

// Explainers already opened on this device, for the ✓ on the route. Storage may be blocked.
const SEEN_KEY = 'cf-vistos';
function seen() {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}
function markSeen(id) {
    try { const ids = seen(); ids.add(id); localStorage.setItem(SEEN_KEY, JSON.stringify([...ids])); } catch { /* private mode */ }
}
// Lo que falta por sector y nivel.
const SOON = {
    electricidad: {
        2: 'Cómo se equilibra la red: frecuencia y reservas.',
        3: 'Eólica, hidroeléctrica, geotérmica y nuclear.',
    },
};

/**
 * @param {HTMLElement} container
 * @param {() => object[]} catalog acervo summaries (may still be loading)
 * @param {{ id?: string|null, onOpenLaw: (law: object) => void, onRoute: (hash: string) => void }} options
 */
export function renderComoFuncionaView(container, catalog, { id = null, onOpenLaw, onRoute }) {
    let alive = true;
    let activeConcept = null;

    function selectPartUI(n, notifyFrame = false) {
        if (!activeConcept) return;
        const idx = Number(n) - 1;
        const part = activeConcept.partes?.[idx];
        const partCards = container.querySelectorAll('.cf-parts [data-part-n]');
        partCards.forEach(el => {
            const match = Number(el.dataset.partN) === Number(n);
            el.classList.toggle('is-selected', match);
            el.setAttribute('aria-pressed', match ? 'true' : 'false');
        });
        const banner = container.querySelector('#cf-active-part');
        if (banner && !part) {
            banner.hidden = true;
            banner.innerHTML = '';
        } else if (banner) {
            banner.hidden = false;
            banner.innerHTML = `
                <div class="cf-part-banner-head">
                    <span class="cf-num" aria-hidden="true">${idx + 1}</span>
                    <strong>${esc(part.nombre)}</strong>
                    <a class="cf-part-banner-jump" href="#cf-part-card-${idx + 1}">Ver en listado ↓</a>
                </div>
                <p>${esc(part.texto)}</p>`;
        }
        if (notifyFrame) {
            const frame = container.querySelector('iframe[data-concepto]');
            frame?.contentWindow?.postMessage({ type: 'concepto-select-part', n: Number(n) }, location.origin);
        }
    }

    function setFrameFullscreen(on) {
        container.querySelector('iframe[data-concepto]')?.classList.toggle('cf-figura-completa', on);
        document.documentElement.classList.toggle('cf-bloqueo', on);
    }

    const onMessage = event => {
        if (event.origin !== location.origin) return;
        if (event.data?.type === 'concepto-height') {
            const frame = container.querySelector(`iframe[data-concepto="${CSS.escape(event.data.id || '')}"]`)
                || container.querySelector(`iframe[data-figura="${CSS.escape(event.data.id || '')}"]`)
                || container.querySelector('iframe[data-concepto]');
            if (frame && Number.isFinite(event.data.h)) frame.style.height = `${Math.ceil(event.data.h)}px`;
        } else if (event.data?.type === 'concepto-part') {
            selectPartUI(event.data.n, false);
        } else if (event.data?.type === 'concepto-listo') {
            figuraLista();
        } else if (event.data?.type === 'concepto-fullscreen') {
            // Sin pantalla completa del navegador (iPhone), la figura pide que su marco cubra la ventana.
            setFrameFullscreen(Boolean(event.data.on));
        }
    };
    window.addEventListener('message', onMessage);

    // Carga de la figura: se descarga primero con fetch para mostrar el avance real (en el celular las figuras 3D pesan
    // unos 650 KB y tardan); luego el marco la abre desde la caché y la figura avisa «concepto-listo» al dibujar su
    // primer cuadro. Las figuras viejas no avisan: a ellas se les quita el aviso un momento después de cargar.
    const PESO_ESPERADO = 650 * 1024; // el servidor la manda comprimida y sin tamaño: se estima
    let cargaActual = 0;
    let esperaLarga = 0;
    function figuraLista(id = cargaActual) {
        if (id !== cargaActual) return;
        clearTimeout(esperaLarga);
        const capa = container.querySelector('[data-carga]');
        if (!capa) return;
        capa.classList.add('is-lista');
        setTimeout(() => { if (id === cargaActual) capa.hidden = true; }, 450);
    }
    async function cargarFigura(frame, url, alAbrir) {
        const id = ++cargaActual;
        const capa = container.querySelector('[data-carga]');
        const texto = capa?.querySelector('[data-carga-texto]');
        const barra = capa?.querySelector('[data-carga-barra]');
        const pct = capa?.querySelector('[data-carga-pct]');
        const otra = capa?.querySelector('[data-carga-otra]');
        const pintar = (avance, mensaje) => {
            if (!capa || id !== cargaActual) return;
            if (mensaje) texto.textContent = mensaje;
            barra.style.transform = `scaleX(${avance})`;
            pct.textContent = `${Math.round(avance * 100)} %`;
        };
        if (capa) {
            capa.hidden = false;
            capa.classList.remove('is-lista', 'is-armando', 'is-lenta');
            otra.hidden = true;
            otra.onclick = () => cargarFigura(frame, url, alAbrir);
        }
        pintar(0, 'Cargando la máquina 3D');
        try {
            const respuesta = await fetch(url);
            const total = Number(respuesta.headers.get('content-length')) || PESO_ESPERADO;
            const lector = respuesta.body?.getReader();
            let recibido = 0;
            while (lector) {
                const { done, value } = await lector.read();
                if (done || id !== cargaActual) break;
                recibido += value.length;
                pintar(Math.min(0.97, recibido / total));
            }
        } catch { /* sin red o sin streams: el marco la carga por su cuenta */ }
        if (id !== cargaActual) return;
        pintar(1, 'Armando la máquina…');
        capa?.classList.add('is-armando');
        frame.addEventListener('load', () => {
            alAbrir?.();
            setTimeout(() => figuraLista(id), 2500);
        }, { once: true });
        frame.src = url;
        // si después de 25 segundos no está, se ofrece reintentar
        clearTimeout(esperaLarga);
        esperaLarga = setTimeout(() => {
            if (id !== cargaActual || !capa || capa.hidden) return;
            capa.classList.add('is-lenta');
            texto.textContent = 'Está tardando más de lo normal';
            otra.hidden = false;
        }, 25000);
    }

    // Each figure has a light and a dark file: swap it when the site theme changes, keeping the selected part.
    let wasDark = dark();
    const themeWatch = new MutationObserver(() => {
        if (dark() === wasDark) return;
        wasDark = dark();
        container.querySelectorAll('img[data-thumb]').forEach(img => { img.src = thumbUrl(img.dataset.thumb); });
        const frame = container.querySelector('iframe[data-concepto]');
        if (!frame || !activeConcept) return;
        const selected = Number(container.querySelector('.cf-parts [data-part-n].is-selected')?.dataset.partN) || 0;
        cargarFigura(frame, figureUrl(activeConcept.figura), selected ? () => frame.contentWindow?.postMessage({ type: 'concepto-select-part', n: selected }, location.origin) : null);
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const ICONS = {
        electricidad: '<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5h6L9.5 22l9-12h-6.5Z"/></svg>',
        hidrocarburos: '<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5c-3.2 4.3-6.5 8.2-6.5 11.5a6.5 6.5 0 0 0 13 0c0-3.3-3.3-7.2-6.5-11.5Z"/><path d="M12 18.5a4 4 0 0 0 4-4"/></svg>',
        check: '<svg class="cf-icon cf-check-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>',
    };

    // el mercado elegido se recuerda en este navegador
    const MERCADO_KEY = 'cf-mercado';
    let currentSector = (() => { try { return localStorage.getItem(MERCADO_KEY) === 'hidrocarburos' ? 'hidrocarburos' : 'electricidad'; } catch { return 'electricidad'; } })();

    let done = seen();
    function showList() {
        activeConcept = null;
        done = seen();
        const summaries = typeof catalog === 'function' ? catalog() || [] : catalog;
        const activeConcepts = CONCEPTOS.filter(c => c.sector === currentSector);
        const sectorGlosario = GLOSARIO_REGULATORIO.filter(g => g.sector === 'ambos' || g.sector === currentSector);
        const hilo = HILO_SECTOR[currentSector];
        const nextUnseen = activeConcepts.find(c => !done.has(c.id)) || activeConcepts[0];
        const nextStepIdx = activeConcepts.indexOf(nextUnseen) + 1;
        const seenInSector = activeConcepts.filter(c => done.has(c.id)).length;

        const mercado = id => {
            const temas = CONCEPTOS.filter(c => c.sector === id);
            const vistos = temas.filter(c => done.has(c.id)).length;
            return { temas, vistos };
        };
        const MERCADOS = [
            { id: 'electricidad', titulo: 'Mercado eléctrico', frase: 'De la central a tu casa', figura: 'generador' },
            { id: 'hidrocarburos', titulo: 'Mercado de hidrocarburos', frase: 'Del pozo a la gasolinera', figura: 'refinacion' },
        ];
        const soonCards = Object.values(SOON[currentSector] || {});
        container.innerHTML = `
            <section class="cf-view cf-portada" aria-labelledby="cf-title">
                <header class="cf-head">
                    <p class="cf-kicker">Aprende</p>
                    <h1 id="cf-title">¿Cómo funciona?</h1>
                    <p class="cf-intro">Elige un mercado y toca un tema: cada uno es una máquina que puedes mover, abrir y desarmar.</p>
                </header>

                <div class="cf-mercados" role="group" aria-label="Elegir mercado">
                    ${MERCADOS.map(m => {
                        const { temas, vistos } = mercado(m.id);
                        const activo = currentSector === m.id;
                        return `
                        <button type="button" class="cf-mercado${activo ? ' is-active' : ''}" data-sector="${m.id}" aria-pressed="${activo}">
                            <span class="cf-mercado-img"><img data-thumb="${m.figura}" src="${thumbUrl(m.figura)}" alt="" decoding="async"></span>
                            <span class="cf-mercado-txt">
                                <span class="cf-mercado-icon">${ICONS[m.id]}</span>
                                <strong>${m.titulo}</strong>
                                <span>${m.frase}</span>
                                <span class="cf-mercado-meta">${temas.length} temas${vistos ? ` · ${vistos} vistos` : ''}</span>
                            </span>
                        </button>`;
                    }).join('')}
                </div>

                <div class="cf-temas-cab">
                    <h2>${currentSector === 'hidrocarburos' ? 'Mercado de hidrocarburos' : 'Mercado eléctrico'}</h2>
                    ${nextUnseen ? `<a class="cf-seguir" href="#como-funciona=${esc(nextUnseen.id)}">${seenInSector > 0 && seenInSector < activeConcepts.length ? 'Seguir' : 'Empezar'}: ${nextStepIdx}. ${esc(nextUnseen.titulo)} →</a>` : ''}
                </div>
                <div class="cf-progress-bar" role="img" aria-label="${seenInSector} de ${activeConcepts.length} temas vistos">${activeConcepts.map(c => `<span${done.has(c.id) ? ' class="is-done"' : ''}></span>`).join('')}</div>
                <ol class="cf-temas">
                    ${activeConcepts.map((c, i) => `
                    <li><a class="cf-tema${done.has(c.id) ? ' is-done' : ''}" href="#como-funciona=${esc(c.id)}" title="${esc(c.resumen)}">
                        <span class="cf-tema-img"><img data-thumb="${esc(c.figura)}" src="${thumbUrl(c.figura)}" alt="" loading="lazy" decoding="async"></span>
                        <span class="cf-tema-num" aria-hidden="true">${done.has(c.id) ? ICONS.check : i + 1}</span>
                        <strong>${esc(c.titulo)}</strong>
                        <span class="cf-tema-nivel">${esc(NIVELES.find(n => n.id === c.nivel)?.titulo || '')}${done.has(c.id) ? ' · Visto' : ''}</span>
                    </a></li>`).join('')}
                    ${soonCards.map(t => `<li><div class="cf-tema cf-tema-pronto" aria-hidden="true"><strong>Próximamente</strong><span class="cf-tema-nivel">${esc(t)}</span></div></li>`).join('')}
                </ol>

                <div class="cf-mas">
                    <p class="cf-mas-titulo">Para saber más</p>
                    ${hilo ? `<details class="cf-section cf-plegable">
                        <summary><h2>El recorrido en cuatro pasos</h2></summary>
                        <p>${esc(hilo.resumen)}</p>
                        <ol class="cf-thread-stages">
                            ${hilo.etapas.map(etapa => `
                                <li class="cf-thread-stage">
                                    <div class="cf-stage-head"><span class="cf-stage-num">Paso ${esc(etapa.num)}</span><strong>${esc(etapa.titulo)}</strong></div>
                                    <p>${esc(etapa.desc)}</p>
                                    <div class="cf-stage-pills">
                                        ${etapa.ids.map(cid => {
                                            const cObj = CONCEPTO[cid];
                                            if (!cObj) return '';
                                            const visited = done.has(cid);
                                            return `<a class="cf-stage-pill${visited ? ' is-done' : ''}" href="#como-funciona=${esc(cid)}"><span class="cf-pill-num">${visited ? '✓' : activeConcepts.indexOf(cObj) + 1}</span><span>${esc(cObj.titulo)}</span></a>`;
                                        }).join('')}
                                    </div>
                                </li>`).join('')}
                        </ol>
                    </details>` : ''}
                    <details class="cf-section cf-plegable">
                        <summary><h2>Los ejes de la reforma de 2025</h2></summary>
                        <p>Los cinco pilares que rigen al sistema eléctrico y a los hidrocarburos desde las leyes publicadas el 18 de marzo y el 3 de octubre de 2025.</p>
                        <div class="cf-ejes-grid">
                            ${EJES_RECTORES.map(eje => `
                                <article class="cf-eje-card">
                                    <h3>${esc(eje.titulo)}</h3>
                                    <p>${esc(eje.texto)}</p>
                                    <div class="cf-eje-tags">
                                        ${(eje.siglas || []).map(s => {
                                            const law = lawBySiglas(summaries, s);
                                            return law ? `<button type="button" class="cf-chip-law" data-open-siglas="${esc(s)}" title="${esc(law.titulo)}">${esc(s)}</button>` : `<span class="cf-chip-law">${esc(s)}</span>`;
                                        }).join('')}
                                    </div>
                                </article>`).join('')}
                        </div>
                    </details>
                    <details class="cf-section cf-plegable">
                        <summary><h2>Glosario</h2></summary>
                        <div class="cf-glosario-grid">
                            ${sectorGlosario.map(item => {
                                const targetConcept = item.conceptoId ? CONCEPTO[item.conceptoId] : null;
                                const linkLabel = targetConcept?.nivel === 4 ? 'Ver esquema →' : 'Ver la máquina →';
                                return `
                                <article class="cf-glosario-card">
                                    <div class="cf-glosario-head">
                                        <div class="cf-eje-tags">
                                            ${(Array.isArray(item.siglas) ? item.siglas : [item.siglas]).map(s => {
                                                const law = lawBySiglas(summaries, s);
                                                return law ? `<button type="button" class="cf-chip-law" data-open-siglas="${esc(s)}" title="${esc(law.titulo)}">${esc(s)}</button>` : `<span class="cf-chip-law">${esc(s)}</span>`;
                                            }).join('')}
                                        </div>
                                        ${item.conceptoId ? `<a class="cf-glosario-link" href="#como-funciona=${esc(item.conceptoId)}">${linkLabel}</a>` : ''}
                                    </div>
                                    <h3>${esc(item.termino)}</h3>
                                    <p>${esc(item.definicion)}</p>
                                    <span class="cf-glosario-fund">${esc(item.articulos)}</span>
                                </article>`;
                            }).join('')}
                        </div>
                    </details>
                </div>
            </section>`;

        container.querySelectorAll('.cf-mercado').forEach(btn => {
            btn.addEventListener('click', () => {
                currentSector = btn.dataset.sector;
                try { localStorage.setItem(MERCADO_KEY, currentSector); } catch { /* sin almacenamiento */ }
                showList();
            });
        });
        container.querySelectorAll('[data-open-siglas]').forEach(btn => {
            btn.addEventListener('click', () => {
                const law = lawBySiglas(summaries, btn.dataset.openSiglas);
                if (law) onOpenLaw(law);
            });
        });
    }

    function showConcept(concept) {
        activeConcept = concept;
        if (concept.sector) currentSector = concept.sector;
        const summaries = typeof catalog === 'function' ? catalog() || [] : catalog;
        markSeen(concept.id);
        done = seen();
        const sectorConcepts = CONCEPTOS.filter(c => c.sector === concept.sector);
        const stepIndex = sectorConcepts.indexOf(concept) + 1;
        const prev = anteriorConcepto(concept.id);
        const next = siguienteConcepto(concept.id);
        const puente = PUENTE_HILO[concept.id];
        const before = (concept.antes || []).map(id => CONCEPTO[id]).filter(Boolean);
        const laws = (concept.ley?.siglas || []).map(siglas => ({ siglas, law: lawBySiglas(summaries, siglas) }));
        const tramites = concept.tramites.map(tramiteById).filter(Boolean);
        const sectorName = concept.sector === 'hidrocarburos' ? 'Mercado de Hidrocarburos' : 'Mercado Eléctrico';
        const sectorIcon = concept.sector === 'hidrocarburos' ? ICONS.hidrocarburos : ICONS.electricidad;
        const ficha = concept.ley?.ficha;
        const isLevel4 = concept.nivel === 4;
        container.innerHTML = `
            <article class="cf-view cf-concept" aria-labelledby="cf-title">
                <div class="cf-top-nav">
                    <a class="cf-back" href="#como-funciona">← Volver a la ruta de ${sectorName}</a>
                    <nav class="cf-route-bar" aria-label="Progreso en la ruta de ${sectorName}">
                        <div class="cf-route-bar-meta">
                            ${prev ? `<a class="cf-route-arrow cf-route-prev" href="#como-funciona=${esc(prev.id)}" aria-label="Paso anterior: ${esc(prev.titulo)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span>Anterior</span></a>` : '<span class="cf-route-arrow is-vacio" aria-hidden="true"></span>'}
                            <span class="cf-route-where"><span class="cf-route-step-count">Paso ${stepIndex} de ${sectorConcepts.length}</span>${puente?.eslabon ? `<span class="cf-route-eslabon">${esc(puente.eslabon)}</span>` : ''}</span>
                            ${next ? `<a class="cf-route-arrow cf-route-next" href="#como-funciona=${esc(next.id)}" aria-label="Paso siguiente: ${esc(next.titulo)}"><span>Siguiente</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a>` : '<span class="cf-route-arrow is-vacio" aria-hidden="true"></span>'}
                        </div>
                        <ol class="cf-route-dots cf-route-segments">
                            ${sectorConcepts.map((c, idx) => {
                                const n = idx + 1;
                                const isCurrent = c.id === concept.id;
                                const isVisited = done.has(c.id);
                                return `<li><a class="cf-route-dot${isCurrent ? ' is-current' : ''}${isVisited ? ' is-done' : ''}" href="#como-funciona=${esc(c.id)}" title="Paso ${n}: ${esc(c.titulo)}" aria-current="${isCurrent ? 'step' : 'false'}"><span class="cf-dot-num">${n}</span><span class="cf-dot-label">${esc(c.titulo)}</span></a></li>`;
                            }).join('')}
                        </ol>
                    </nav>
                </div>
                <header class="cf-head">
                    <p class="cf-kicker"><span class="cf-kicker-icon">${sectorIcon}</span> ${sectorName} · Nivel ${concept.nivel}: ${esc(NIVELES.find(n => n.id === concept.nivel)?.titulo)}</p>
                    <h1 id="cf-title">${esc(concept.titulo)}</h1>
                    <p class="cf-intro">${esc(concept.resumen)}</p>
                    <button type="button" class="cf-share" data-share><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span></button>
                </header>
                <div class="cf-figure">
                    <iframe data-concepto="${esc(concept.id)}" title="Ilustración interactiva: ${esc(concept.titulo)}" scrolling="no" allow="fullscreen" allowfullscreen></iframe>
                    <div class="cf-carga" data-carga role="status" aria-live="polite">
                        <img class="cf-carga-fondo" data-thumb="${esc(concept.figura)}" src="${thumbUrl(concept.figura)}" alt="">
                        <div class="cf-carga-caja">
                            <span class="cf-carga-giro" aria-hidden="true"></span>
                            <b data-carga-texto>Cargando la máquina 3D</b>
                            <span class="cf-carga-barra" aria-hidden="true"><i data-carga-barra></i></span>
                            <small data-carga-pct>0 %</small>
                            <button type="button" class="cf-carga-otra" data-carga-otra hidden>Reintentar</button>
                        </div>
                    </div>
                </div>
                ${before.length ? `<p class="cf-before">Para entenderlo mejor, antes mira: ${before.map(c => `<a href="#como-funciona=${esc(c.id)}">${esc(c.titulo)}</a>`).join(', ')}.</p>` : ''}
                <div id="cf-active-part" class="cf-part-banner" aria-live="polite" hidden></div>
                <section class="cf-section" aria-labelledby="cf-partes">
                    <div class="cf-parts-header">
                        <h2 id="cf-partes">${concept.partesTitulo ? esc(concept.partesTitulo) : 'Sus partes'}</h2>
                        <span class="cf-parts-hint">Toca una parte para verla en ${isLevel4 ? 'el diagrama' : 'la máquina'}</span>
                    </div>
                    <dl class="cf-parts">${concept.partes.map((p, i) => `<div id="cf-part-card-${i + 1}" data-part-n="${i + 1}" role="button" tabindex="0" aria-pressed="false"><dt><span class="cf-num" aria-hidden="true">${i + 1}</span>${esc(p.nombre)}</dt><dd>${esc(p.texto)}</dd></div>`).join('')}</dl>
                </section>
                ${concept.dato ? `<aside class="cf-fun" aria-label="¿Sabías que…?"><b>¿Sabías que…?</b> ${esc(concept.dato)}</aside>` : ''}
                <section class="cf-section" aria-labelledby="cf-prueba">
                    <h2 id="cf-prueba">Ponte a prueba</h2>
                    <div class="cf-quiz">${concept.preguntas.map((q, i) => `
                        <fieldset class="cf-q" data-q="${i}">
                            <legend>${esc(q.pregunta)}</legend>
                            ${q.opciones.map((o, j) => `<button type="button" class="cf-opt" data-opt="${j}">${esc(o)}</button>`).join('')}
                            <p class="cf-verdict" aria-live="polite"></p>
                        </fieldset>`).join('')}</div>
                </section>
                <div class="cf-mas">
                    <p class="cf-mas-titulo">Para saber más</p>
                    ${concept.definiciones?.length ? `<details class="cf-section cf-plegable">
                    <summary><h2 id="cf-defs">${concept.definiciones.length > 1 ? 'Definiciones' : 'Definición'}</h2></summary>
                    <dl class="cf-defs">${concept.definiciones.map(d => `<div><dt>${esc(d.termino)}${d.unidad ? ` <span class="cf-unit">${esc(d.unidad)}</span>` : ''}</dt><dd>${esc(d.texto)}</dd></div>`).join('')}</dl>
                </details>` : ''}
                <details class="cf-section cf-plegable">
                    <summary><h2 id="cf-claves">En palabras simples</h2></summary>
                    <ol class="cf-steps">${concept.claves.map(text => `<li>${esc(text)}</li>`).join('')}</ol>
                </details>
                ${concept.formulas?.length ? `<details class="cf-section cf-plegable">
                    <summary><h2 id="cf-formulas">${concept.formulas.length > 1 ? 'Las fórmulas' : 'La fórmula'}</h2></summary>
                    <div class="cf-formulas">${concept.formulas.map(f => `<div class="cf-formula">
                        <p class="cf-expr">${esc(f.expresion)}</p>
                        <p class="cf-reading">${esc(f.lectura)}</p>
                        ${f.ejemplo ? `<p class="cf-example"><b>Ejemplo:</b> ${esc(f.ejemplo)}</p>` : ''}
                    </div>`).join('')}</div>
                </details>` : ''}
                ${concept.errores?.length ? `<details class="cf-section cf-plegable">
                    <summary><h2 id="cf-errores">Ideas equivocadas comunes</h2></summary>
                    <ul class="cf-myths">${concept.errores.map(e => `<li><p class="cf-myth"><span aria-hidden="true">✗</span><span class="cf-sr">Idea equivocada: </span>${esc(e.idea)}</p><p class="cf-fact"><span aria-hidden="true">✓</span><span class="cf-sr">En realidad: </span>${esc(e.realidad)}</p></li>`).join('')}</ul>
                </details>` : ''}
                    ${concept.ley ? `<details class="cf-section cf-plegable">
                    <summary><h2 id="cf-ley">Qué dice la ley</h2></summary>
                    ${puente ? `
                    <div class="cf-bridge-box" aria-label="Puente entre realidad física y regulación">
                        <div class="cf-bridge-col">
                            <span class="cf-bridge-tag">Hecho físico y operativo</span>
                            <p>${esc(puente.fisica)}</p>
                        </div>
                        <div class="cf-bridge-arrow" aria-hidden="true">→</div>
                        <div class="cf-bridge-col cf-bridge-col-law">
                            <span class="cf-bridge-tag">Consecuencia regulatoria</span>
                            <p>${esc(puente.regulacion)}</p>
                        </div>
                    </div>` : ''}
                    <p>${esc(concept.ley.texto)}</p>
                    ${ficha ? `
                    <div class="cf-ficha" data-ficha>
                        <div class="cf-ficha-tabs" role="tablist" aria-label="Ficha regulatoria y procedimental">
                            <button type="button" class="cf-ficha-tab is-active" role="tab" aria-selected="true" data-ficha-tab="que">1. El Qué (Concepto Técnico)</button>
                            <button type="button" class="cf-ficha-tab" role="tab" aria-selected="false" data-ficha-tab="como">2. El Cómo (Ruta Regulatoria)</button>
                            <button type="button" class="cf-ficha-tab" role="tab" aria-selected="false" data-ficha-tab="articulos">3. Fundamento Legal Vigente</button>
                        </div>
                        <div class="cf-ficha-panel is-active" role="tabpanel" data-ficha-panel="que">
                            <p>${esc(ficha.elQue)}</p>
                        </div>
                        <div class="cf-ficha-panel" role="tabpanel" data-ficha-panel="como" hidden>
                            <p>${esc(ficha.elComo)}</p>
                        </div>
                        <div class="cf-ficha-panel" role="tabpanel" data-ficha-panel="articulos" hidden>
                            <ul class="cf-art-list">
                                ${(ficha.articulos || []).map(a => {
                                    const lawObj = laws.find(item => item.siglas === a.siglas)?.law || lawBySiglas(summaries, a.siglas);
                                    return `<li class="cf-art-item">
                                        <div class="cf-art-top">
                                            ${lawObj ? `<button type="button" class="cf-chip-law" data-law="${esc(lawObj.id)}">${esc(a.siglas)}</button>` : `<span class="cf-chip-law">${esc(a.siglas)}</span>`}
                                            <strong class="cf-art-ref">${esc(a.refs)}</strong>
                                        </div>
                                        <p class="cf-art-desc">${esc(a.nota)}</p>
                                    </li>`;
                                }).join('')}
                            </ul>
                        </div>
                    </div>` : ''}
                    <div class="cf-links">${laws.map(({ siglas, law }) => (law
                        ? `<button type="button" class="cf-law" data-law="${esc(law.id)}"><b>${esc(law.siglas || siglas)}</b><span>${esc(law.titulo)}</span></button>`
                        : '')).join('')}</div>
                </details>` : ''}
                ${tramites.length || concept.mapa ? `<details class="cf-section cf-plegable">
                    <summary><h2 id="cf-permisos">Permisos y trámites</h2></summary>
                    <div class="cf-links">
                        ${tramites.map(t => `<a class="cf-link" href="#tramite=${esc(t.id)}"><b>Guía de trámite</b><span>${esc(t.title)}</span></a>`).join('')}
                        ${concept.mapa ? `<a class="cf-link" href="${esc(concept.mapa.hash)}"><b>Mapa</b><span>${esc(concept.mapa.texto)}</span></a>` : ''}
                    </div>
                </details>` : ''}
                </div>
                <div class="cf-journey-footer">
                    ${puente?.transicion ? `
                    <div class="cf-transition-box">
                        <span class="cf-transition-kicker">Hilo conductor · ¿Cómo conecta con el siguiente paso?</span>
                        <p>${esc(puente.transicion)}</p>
                    </div>` : ''}
                    <div class="cf-nav-pair">
                        ${prev ? `<a class="cf-prev" href="#como-funciona=${esc(prev.id)}"><span>← Paso ${stepIndex - 1} (Anterior)</span><strong>${esc(prev.titulo)}</strong></a>` : ''}
                        ${next ? `<a class="cf-next" href="#como-funciona=${esc(next.id)}"><span>Siguiente en la ruta (Paso ${stepIndex + 1} de ${sectorConcepts.length})</span><strong>${esc(next.titulo)} →</strong></a>` : `<a class="cf-next" href="#como-funciona"><span>Llegaste al final de la ruta por ahora</span><strong>Ver la ruta completa →</strong></a>`}
                    </div>
                </div>
                <details class="cf-sources cf-plegable">
                    <summary><h2 id="cf-fuentes">Fuentes</h2></summary>
                    <ol class="cf-refs">${concept.fuentes.map(f => {
                        const law = f.acervo ? laws.find(item => item.siglas === f.acervo)?.law : null;
                        const title = f.url ? `<a href="${esc(f.url)}" target="_blank" rel="noopener"><i>${esc(f.titulo)}</i></a>` : `<i>${esc(f.titulo)}</i>`;
                        return `<li>${esc(f.autor)}${f.url ? ` (${esc(f.fecha)}). ${title}${/[?!.]$/.test(f.titulo) ? "" : "."}${f.editorial ? ` ${esc(f.editorial)}.` : ''}` : `. ${title}, ${esc(f.fecha)}.`}${f.consulta ? ` Consultado el ${esc(f.consulta)}.` : ''}${law ? ` <button type="button" class="cf-ref-law" data-law="${esc(law.id)}">Ver en el acervo</button>` : ''}</li>`;
                    }).join('')}</ol>
                    <p class="cf-note">Explicación general con fines informativos; no es texto legal ni sustituye la normativa. ${concept.revisado ? `Revisado el ${esc(concept.revisado)}.` : '<span class="cf-draft">Borrador en revisión.</span>'}</p>
                </details>
            </article>`;
        const marco = container.querySelector('iframe[data-concepto]');
        if (marco) cargarFigura(marco, figureUrl(concept.figura));
        // Share the explainer: the phone's share sheet (WhatsApp…), or copy the link on a computer.
        container.querySelector('[data-share]')?.addEventListener('click', async event => {
            const button = event.currentTarget;
            const url = shareUrl(learnPath(concept.id), `#como-funciona=${concept.id}`, location.origin);
            const text = `¿Cómo funciona? ${concept.titulo}. Míralo en movimiento:`;
            const mobile = matchMedia('(pointer: coarse)').matches;
            if (navigator.share && mobile) {
                try { await navigator.share({ title: `¿Cómo funciona? · ${concept.titulo}`, text, url }); } catch { /* cancelled */ }
                return;
            }
            const label = button.querySelector('span');
            try { await navigator.clipboard.writeText(url); label.textContent = 'Enlace copiado'; } catch { window.prompt('Copia el enlace:', url); }
            setTimeout(() => { if (label.isConnected) label.textContent = 'Compartir'; }, 2200);
        });
        // Interactive parts selection (syncs with 3D iframe).
        container.querySelectorAll('.cf-parts [data-part-n]').forEach(cardEl => {
            const trigger = () => selectPartUI(cardEl.dataset.partN, true);
            cardEl.addEventListener('click', trigger);
            cardEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
            });
        });
        // 3-tab regulatory ficha switcher.
        const fichaBox = container.querySelector('[data-ficha]');
        if (fichaBox) {
            fichaBox.querySelectorAll('[data-ficha-tab]').forEach(tabBtn => {
                tabBtn.addEventListener('click', () => {
                    const target = tabBtn.dataset.fichaTab;
                    fichaBox.querySelectorAll('[data-ficha-tab]').forEach(b => {
                        const active = b.dataset.fichaTab === target;
                        b.classList.toggle('is-active', active);
                        b.setAttribute('aria-selected', active ? 'true' : 'false');
                    });
                    fichaBox.querySelectorAll('[data-ficha-panel]').forEach(p => {
                        const active = p.dataset.fichaPanel === target;
                        p.classList.toggle('is-active', active);
                        p.hidden = !active;
                    });
                });
            });
        }
        container.querySelectorAll('[data-law]').forEach(button => button.addEventListener('click', () => {
            const law = laws.find(item => String(item.law?.id) === button.dataset.law)?.law
                || summaries.find(item => String(item.id) === button.dataset.law);
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
        destroy() { alive = false; setFrameFullscreen(false); window.removeEventListener('message', onMessage); themeWatch.disconnect(); container.replaceChildren(); },
    };
}
