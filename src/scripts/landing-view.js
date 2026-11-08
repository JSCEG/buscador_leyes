/**
 * Landing: connects the first screen that index.html already painted and draws the gallery below it. It asks nothing
 * of Supabase: the figures come from `search-ready`, the polos from a static file when their section comes near, and
 * the owl's 3D only downloads if someone presses «Abrir la guía» (data-abrir-buho, site-intro.js).
 */
import { catalogFigures, figuresLine, mexicoPoint, recentDocuments, typeBars } from '../lib/landing-model.js';
import { groupAcervo, selectAcervo } from '../lib/acervo-model.js';
import { coverHTML } from '../lib/law-cover.js';
import { MEXICO_STATES, MEXICO_VIEWBOX } from '../lib/mexico-map.js';
import { stats, vigentes } from '../lib/polos.js';
import { typeTile } from '../lib/permit-type.js';
import { TECH_MARKERS } from '../lib/tech-markers.js';
import { savedFigures } from './site-intro.js';
import '../styles/landing.css';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const EXAMPLES = ['interconexión', 'Ley del Sector Eléctrico', 'artículo 12'];
const COVERS_SHOWN = 4;
const TECHS = ['fv', 'eo', 'hid', 'cc', 'geo', 'alm'];
const THUMBS = [['eolica', 'Eólica'], ['fotovoltaica', 'Fotovoltaica'], ['ciclo-combinado', 'Ciclo combinado']];

const mapSvg = (dots = '') => `<svg class="lp-map" viewBox="${MEXICO_VIEWBOX}" aria-hidden="true"><g>${MEXICO_STATES.map(state => `<path d="${state.d}"/>`).join('')}</g><g data-map-dots>${dots}</g></svg>`;

const defaultFetchPolos = () => fetch('/polos/polos.json', { credentials: 'same-origin' }).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}).then(data => data.polos || []);

const section = ({ id, title, text, nav, action, show }) => `<section class="lp-sec" data-sec="${id}">
    <div class="lp-sec-text">
        <h3>${title}</h3>
        <p>${text}</p>
        <a class="lp-link" href="#${id}" data-landing-go="${nav}">${action} <span aria-hidden="true">→</span></a>
    </div>
    <div class="lp-sec-show">${show}</div>
</section>`;

const galleryHTML = () => `<h2 class="lp-gal-title">Lo que encuentras aquí</h2>
${section({ id: 'buscar', nav: 'nav-inicio', title: 'Buscar', text: 'Escribe una palabra y ve cada artículo donde aparece.', action: 'Ir a Buscar',
        show: `<p class="lp-show-note">Prueba con:</p><div class="lp-chips">${EXAMPLES.map(query => `<button type="button" class="lp-chip" data-query="${esc(query)}">${esc(query)}</button>`).join('')}</div>` })}
${section({ id: 'acervo', nav: 'nav-leyes', title: 'Acervo', text: 'Todos los documentos, por tipo y dependencia. Por artículo o como libro.', action: 'Ir al Acervo',
        show: '<div class="lp-covers" data-landing-covers></div><a class="lp-link lp-shelf" href="#estante">Ver el estante 3D</a>' })}
${section({ id: 'cronologia', nav: 'nav-cronologia', title: 'Cronología', text: 'Qué se publicó y cuándo, en una sola línea.', action: 'Ir a Cronología',
        show: '<ol class="lp-line" data-landing-line></ol>' })}
${section({ id: 'permisos', nav: 'nav-permisos', title: 'Permisos', text: 'Quién tiene permiso de energía y dónde, en el mapa.', action: 'Ir a Permisos',
        show: `${mapSvg()}<ul class="lp-techs">${TECHS.map(tech => `<li>${typeTile({ tech })}<span>${esc(TECH_MARKERS[tech].name)}</span></li>`).join('')}</ul>` })}
${section({ id: 'polos', nav: 'nav-polos', title: 'Polos', text: 'Los polos de desarrollo: dónde están y cómo van.', action: 'Ir a Polos',
        show: `${mapSvg()}<p class="lp-show-note" data-polos-count></p>` })}
${section({ id: 'como-funciona', nav: 'nav-como-funciona', title: 'Aprende', text: 'Cómo funciona una central, en figuras que giras y desarmas.', action: 'Ir a Aprende',
        show: `<ul class="lp-thumbs">${THUMBS.map(([id, name]) => `<li>
            <img class="lp-if-claro" src="/conceptos/miniaturas/${id}-light.webp" alt="" loading="lazy" decoding="async">
            <img class="lp-if-oscuro" src="/conceptos/miniaturas/${id}.webp" alt="" loading="lazy" decoding="async">
            <span>${name}</span></li>`).join('')}</ul>` })}
<section class="lp-owl">
    <img class="lp-if-claro" src="/img/intro-buho-claro.webp" alt="" width="842" height="842" loading="lazy" decoding="async">
    <img class="lp-if-oscuro" src="/img/intro-buho-oscuro.webp" alt="" width="842" height="842" loading="lazy" decoding="async">
    <div>
        <h3>¿Primera vez? El búho te enseña el sitio.</h3>
        <button type="button" class="bu-btn bu-btn-primario" data-abrir-buho>Abrir la guía</button>
    </div>
</section>`;

/**
 * @param {HTMLElement} host #landing-view, with the first screen from index.html
 * @param {{ summaries?: object[], onSearch?: Function, onLegal?: Function, onFeedback?: Function, onOpenDesk?: Function, fetchPolos?: Function }} options
 */
export function renderLandingView(host, { summaries = null, onSearch = () => {}, onLegal = () => {}, onFeedback = () => {}, onOpenDesk = () => document.getElementById('desk-toggle')?.click(), fetchPolos = defaultFetchPolos } = {}) {
    const listeners = new AbortController();
    const { signal } = listeners;
    const card = host.querySelector('[data-landing-card]');
    const bars = host.querySelector('[data-landing-bars]');
    const figures = host.querySelector('[data-landing-figures]');
    const gallery = host.querySelector('[data-landing-gallery]');
    const form = host.querySelector('#landing-search');
    const field = form.querySelector('input');
    const books = [...host.querySelectorAll('[data-landing-books] a')].map(link => ({ link, href: link.getAttribute('href') }));
    let destroyed = false;
    let polosAsked = false;
    let observer = null;

    gallery.innerHTML = galleryHTML();

    function showFigures(data) {
        const [number, ...rest] = figuresLine(data).split(' ');
        figures.innerHTML = `<strong>${esc(number)}</strong> <span>${esc(rest.join(' '))}</span>`;
    }

    function drawCovers(list) {
        const place = gallery.querySelector('[data-landing-covers]');
        // the newest of each collection, so the row shows that there is more than laws
        const newest = groupAcervo(selectAcervo(list, { sort: 'date-newest' })).filter(group => group.items.length).map(group => group.items[0]);
        place.innerHTML = newest.slice(0, COVERS_SHOWN).map(law => `<a href="#ficha-${encodeURIComponent(law.id)}" aria-label="${esc(law.titulo)}">${coverHTML(law)}</a>`).join('');
    }

    function drawLine(list) {
        gallery.querySelector('[data-landing-line]').innerHTML = recentDocuments(list).map(item => `<li><a href="#ficha-${encodeURIComponent(item.id)}"><time>${esc(item.date)}</time><span>${esc(item.name)}</span></a></li>`).join('');
    }

    function setCatalog(list) {
        if (destroyed) return;
        const present = new Set(list.map(law => String(law.id)));
        books.forEach(({ link, href }) => link.setAttribute('href', present.has(href.slice('#ficha-'.length)) ? href : '#acervo'));
        bars.innerHTML = typeBars(list).map(bar => `<li><a class="lp-bar" data-category="${esc(bar.id)}" href="#acervo?grupo=${esc(bar.id)}" style="--w:${(bar.share * 100).toFixed(1)}%"><span>${esc(bar.label)}</span><b>${bar.count}</b><i></i></a></li>`).join('');
        card.dataset.state = 'ready';
        showFigures(catalogFigures(list));
        drawCovers(list);
        drawLine(list);
    }

    function setFailed() {
        if (destroyed) return;
        card.dataset.state = 'failed';
        figures.textContent = '';
    }

    function loadPolos(place) {
        if (polosAsked) return;
        polosAsked = true;
        Promise.resolve().then(fetchPolos).then(polos => {
            if (destroyed) return;
            const { total, estados } = stats(polos);
            if (!total) return;
            place.querySelector('[data-polos-count]').textContent = `${total} polos en ${estados} estados`;
            place.querySelector('[data-map-dots]').innerHTML = vigentes(polos).map(polo => mexicoPoint(polo.lat, polo.lng)).filter(Boolean)
                .map(([x, y]) => `<circle class="lp-map-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>`).join('');
        }).catch(() => {});
    }

    const sections = [...gallery.querySelectorAll('.lp-sec, .lp-owl')];
    if (typeof IntersectionObserver === 'function') {
        const nearby = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            if (entry.target.dataset.sec === 'polos') loadPolos(entry.target);
            nearby.unobserve(entry.target);
        }), { rootMargin: '0px 0px 15% 0px' });
        sections.forEach(element => nearby.observe(element));
        observer = nearby;
    } else {
        sections.forEach(element => element.classList.add('is-in'));
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        event.stopPropagation(); // the boot script of index.html is only for before the app starts
        const query = field.value.trim();
        if (query) onSearch(query);
    }, { signal });

    host.addEventListener('click', event => {
        const example = event.target.closest('[data-query]');
        if (example) { onSearch(example.dataset.query); return; }
        if (event.target.closest('[data-landing-desk]')) { onOpenDesk(); return; }
        const legal = event.target.closest('[data-legal]');
        if (legal) { event.preventDefault(); onLegal(legal.dataset.legal); return; }
        if (event.target.closest('[data-feedback]')) { onFeedback(); return; }
        const go = event.target.closest('[data-landing-go]');
        if (!go) return;
        event.preventDefault();
        document.getElementById(go.dataset.landingGo)?.click();
    }, { signal });

    const saved = savedFigures();
    if (saved) showFigures({ documentos: saved.leyes, articulos: saved.articulos });
    if (summaries) setCatalog(summaries);

    return {
        setCatalog,
        setFailed,
        /** Runs what was searched before the app started (index.html kept it), once. */
        runPendingSearch() {
            const pending = window.__landingQuery;
            delete window.__landingQuery;
            if (pending) onSearch(pending);
        },
        destroy() {
            destroyed = true;
            listeners.abort();
            observer?.disconnect();
            gallery.innerHTML = '';
            field.value = '';
        },
    };
}
