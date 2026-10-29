/**
 * Trámites tab of the CNE section (#tramites, #tramite=<id>): a guide per kind of permit built only
 * from what the acervo and the CNE publish — the instruments that govern it, its official forms and
 * calls, the articles that mention it (searched live) and recent CNE resolutions of that kind.
 */
import { TRAMITES, tramiteById } from '../data/tramites.js';
import { searchResolutions, permitsHash } from '../lib/cne-api.js';
import { searchArticles } from './search-engine.js';
import { esc, number, dateLabel, lawBySiglas } from './cne-shared.js';

const SECTOR_LABEL = { electricidad: 'Electricidad', petroliferos: 'Petrolíferos', gaslp: 'Gas LP', gasnatural: 'Gas natural', otro: 'Otras energías' };
const svg = path => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
const SECTOR_ICON = {
    electricidad: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    petroliferos: svg('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'),
    gaslp: svg('<rect x="7" y="6" width="10" height="15" rx="3"/><path d="M10 6V3h4v3"/>'),
    gasnatural: svg('<path d="M12 22c4 0 7-3 7-7 0-5-5-7-4-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-3 4-3 8 0 4 3 7 7 7z"/>'),
    otro: svg('<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/>'),
};
const CHECK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
const GROUPS = [
    { key: 'base', title: 'Normativa base', note: 'Leyes y reglamentos del sector.' },
    { key: 'rules', title: 'Disposiciones y requisitos específicos', note: 'Disposiciones administrativas y acuerdos que regulan este trámite.' },
    { key: 'forms', title: 'Formatos oficiales', note: 'Formatos publicados para presentar la solicitud.' },
    { key: 'calls', title: 'Convocatorias', note: 'Convocatorias y sus modificaciones, de la más reciente a la más antigua.' },
];

export function renderTramitesView(container, catalog = [], { tramite = null, onOpenLaw = () => {}, onRoute = () => {} } = {}) {
    let alive = true;
    const summaries = () => (typeof catalog === 'function' ? catalog() || [] : catalog);
    const lawsOf = list => list.map(siglas => lawBySiglas(summaries(), siglas)).filter(Boolean);

    const root = document.createElement('div');
    root.className = 'pm-panel tr-view';
    container.replaceChildren(root);

    function drawIndex() {
        const sectors = [...new Set(TRAMITES.map(item => item.sector))];
        root.innerHTML = `
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${sectors.map(sector => `
                <section class="tr-sector" aria-labelledby="tr-sector-${sector}">
                    <h3 id="tr-sector-${sector}" class="tr-sector-title">${esc(SECTOR_LABEL[sector] || sector)}</h3>
                    <ul class="pm-list">${TRAMITES.filter(item => item.sector === sector).map(item => {
                        const count = lawsOf([...item.base, ...item.rules, ...item.forms, ...item.calls]).length;
                        const forms = lawsOf(item.forms).length;
                        const calls = lawsOf(item.calls).length;
                        return `<li><a class="tr-card" href="${permitsHash({ tramite: item.id })}" data-sector="${item.sector}">
                            <span class="tr-card-head"><span class="tr-card-icon" aria-hidden="true">${SECTOR_ICON[item.sector] || SECTOR_ICON.otro}</span><span class="tr-card-kicker">Guía de trámite</span></span>
                            <span class="tr-card-title">${esc(item.title)}</span>
                            <span class="tr-card-stats"><span class="tr-card-count"><b>${number(count)}</b> instrumentos</span>${forms ? `<span class="tr-card-flag">${CHECK}Formatos</span>` : ''}${calls ? `<span class="tr-card-flag">${CHECK}Convocatoria</span>` : ''}</span>
                            <span class="tr-card-foot">Ver guía <span aria-hidden="true">→</span></span>
                        </a></li>`;
                    }).join('')}</ul>
                </section>`).join('')}`;
    }

    function lawButton(law) {
        return `<button type="button" class="pm-law" data-law="${esc(law.id)}"><b>${esc(law.siglas || '')}</b><span>${esc(law.titulo)}</span></button>`;
    }

    function drawGuide(item) {
        const groups = GROUPS.map(group => {
            let laws = lawsOf(item[group.key]);
            if (group.key === 'calls') laws = laws.sort((a, b) => String(b.fecha_publicacion || '').localeCompare(String(a.fecha_publicacion || '')));
            return { ...group, laws };
        }).filter(group => group.laws.length);
        root.innerHTML = `
            <article class="pm-detail" data-sector="${item.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${permitsHash({ tab: 'tramites' })}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${esc(SECTOR_LABEL[item.sector] || '')}</span></div>
                    <h2 id="tr-title">${esc(item.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${groups.map(group => `
                    <section class="pm-section" aria-labelledby="tr-${group.key}">
                        <h3 id="tr-${group.key}">${esc(group.title)}</h3>
                        <p class="pm-note">${esc(group.note)}</p>
                        <div class="pm-laws">${group.laws.map(lawButton).join('')}</div>
                    </section>`).join('')}
                <section class="pm-section" aria-labelledby="tr-articles">
                    <h3 id="tr-articles">Artículos clave</h3>
                    <p class="pm-note">Artículos y numerales del acervo que tratan este trámite, por relevancia.</p>
                    <div class="tr-articles"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>
                ${item.resolutions ? `<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>` : ''}
            </article>`;

        root.querySelector('.pm-share').addEventListener('click', event => {
            const url = `${location.origin}${location.pathname}${permitsHash({ tramite: item.id })}`;
            navigator.clipboard?.writeText(url).then(() => { event.target.textContent = 'Enlace copiado'; }, () => {});
        });

        const lawIds = lawsOf(item.articles.in).map(law => law.id);
        const articlesHost = root.querySelector('.tr-articles');
        searchArticles(item.articles.query, { lawIds, limit: 24 }).then(({ data }) => {
            if (!alive || !articlesHost.isConnected) return;
            // Front matter says little about the procedure; keep relevance order but at most 3 per instrument.
            const perLaw = new Map();
            const rows = (data || [])
                .filter(row => row.id && !/^(índice|indice|preámbulo|preambulo)/i.test(String(row.articulo_label || '')))
                .filter(row => {
                    const used = perLaw.get(row.ley_id) || 0;
                    perLaw.set(row.ley_id, used + 1);
                    return used < 3;
                })
                .slice(0, 8);
            articlesHost.innerHTML = rows.length ? `<ol class="tr-article-list">${rows.map(row => `
                <li><button type="button" class="tr-article" data-article="${esc(row.id)}">
                    <span class="tr-article-top"><b>${esc(row.siglas_ley || summaries().find(law => String(law.id) === String(row.ley_id))?.siglas || '')}</b> ${esc(row.articulo_label || '')}</span>
                    <span class="tr-article-text">${esc(String(row.fragmento || row.texto || '').replace(/\[\[\[|\]\]\]/g, '').slice(0, 260))}</span>
                </button></li>`).join('')}</ol>`
                : '<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>';
            articlesHost.dataset.ids = JSON.stringify(rows.map(row => row.id));
        }).catch(() => { if (articlesHost.isConnected) articlesHost.innerHTML = '<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>'; });

        const resHost = root.querySelector('.tr-res');
        if (resHost) {
            searchResolutions(item.resolutions, { length: 6 }).then(({ rows, total }) => {
                if (!alive || !resHost.isConnected) return;
                resHost.innerHTML = rows.length ? `
                    <ol class="pn-latest">${rows.map(row => `
                        <li><a href="${permitsHash({ resolution: row.NumeroResolucion })}">
                            <span class="pn-latest-top"><b>${esc(row.NumeroResolucion)}</b><time>${esc(dateLabel(row.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${esc(row.TipoResolucion || '')}${row.ModalidadResolucion ? ` · ${esc(row.ModalidadResolucion)}` : ''}</span>
                            <span class="pn-latest-text">${esc(row.Proemio || '')}</span>
                        </a></li>`).join('')}</ol>
                    <p class="pm-note tr-res-total">${number(total)} resoluciones de este tipo en el registro de la CNE.</p>`
                    : '<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>';
            }).catch(() => { if (resHost.isConnected) resHost.innerHTML = '<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>'; });
        }
    }

    root.addEventListener('click', event => {
        const lawButtonEl = event.target.closest('[data-law]');
        if (lawButtonEl) {
            const law = summaries().find(entry => String(entry.id) === lawButtonEl.dataset.law);
            if (law) onOpenLaw(law);
            return;
        }
        const article = event.target.closest('[data-article]');
        if (article) {
            let list = [];
            try { list = JSON.parse(article.closest('.tr-articles')?.dataset.ids || '[]'); } catch { /* single */ }
            document.dispatchEvent(new CustomEvent('analisis:openArticle', { detail: { id: article.dataset.article, list: list.length ? list : [article.dataset.article] } }));
        }
    });

    function show(id) {
        const item = id && tramiteById(id);
        if (item) drawGuide(item); else drawIndex();
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    show(tramite);
    return {
        openTramite: id => show(id),
        showList: () => show(null),
        destroy: () => { alive = false; root.remove(); },
        onRoute,
    };
}
