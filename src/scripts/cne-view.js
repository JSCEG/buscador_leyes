/**
 * CNE section: permits (#permisos), resolutions (#resoluciones) and panorama (#panorama-cne) of the
 * Comisión Nacional de Energía, as tabs under one header. Each tab is its own module; switching
 * back and forth inside the section keeps the open tab instead of rebuilding it.
 */
import { renderPermitsView } from './permits-view.js';
import { renderResolutionsView } from './resolutions-view.js';
import { renderPanoramaView } from './cne-panorama-view.js';
import { permitsHash } from '../lib/cne-api.js';
import '../styles/permits.css';

const TABS = [
    { id: 'permisos', label: 'Permisos', intro: 'Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula.' },
    { id: 'resoluciones', label: 'Resoluciones', intro: 'Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo.' },
    { id: 'panorama', label: 'Panorama', intro: 'Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente.' },
];

/**
 * @param {HTMLElement} container
 * @param {() => object[]} catalog acervo summaries (read on demand)
 * @param {{ route: { tab: string, permit?: string, resolution?: string }, onOpenLaw: Function, setHash: (hash: string) => void }} options
 */
export function renderCneView(container, catalog, { route = { tab: 'permisos' }, onOpenLaw = () => {}, setHash = () => {} } = {}) {
    let current = null;
    let currentTab = null;

    const root = document.createElement('section');
    root.className = 'pm-view';
    root.setAttribute('aria-labelledby', 'pm-title');
    root.innerHTML = `
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">CNE: permisos y resoluciones</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de la CNE">
                ${TABS.map(tab => `<a role="tab" class="pm-tab" id="pm-tab-${tab.id}" href="${permitsHash({ tab: tab.id })}" data-tab="${tab.id}" aria-controls="pm-tabpanel">${tab.label}</a>`).join('')}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`;
    container.replaceChildren(root);
    const host = root.querySelector('.pm-tabpanel');

    function open(tab, next) {
        current?.destroy();
        currentTab = tab;
        const info = TABS.find(item => item.id === tab) || TABS[0];
        root.querySelector('.pm-intro').textContent = info.intro;
        root.querySelectorAll('.pm-tab').forEach(link => {
            const on = link.dataset.tab === tab;
            link.setAttribute('aria-selected', String(on));
            link.classList.toggle('is-on', on);
        });
        host.setAttribute('aria-labelledby', `pm-tab-${tab}`);
        if (tab === 'resoluciones') {
            current = renderResolutionsView(host, catalog, {
                resolution: next.resolution || null,
                onRoute: number => setHash(permitsHash({ tab, resolution: number })),
            });
        } else if (tab === 'panorama') {
            current = renderPanoramaView(host);
        } else {
            current = renderPermitsView(host, catalog, {
                permit: next.permit || null,
                onOpenLaw,
                onRoute: number => setHash(permitsHash({ tab, permit: number })),
            });
        }
    }

    function go(next = { tab: 'permisos' }) {
        const tab = next.tab || 'permisos';
        if (tab !== currentTab) { open(tab, next); return; }
        if (tab === 'permisos') { if (next.permit) current.openPermit(next.permit); else current.showList(); }
        else if (tab === 'resoluciones') { if (next.resolution) current.openResolution(next.resolution); else current.showList(); }
    }

    go(route);
    return { go, destroy: () => { current?.destroy(); root.remove(); } };
}
