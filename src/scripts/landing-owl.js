/**
 * The owl at the bottom of the landing: first its picture, and the live owl (public/intro/buho-bio.html?modo=portada) only
 * when the section comes near, so it weighs nothing on arrival. It stops drawing while it is out of view. Without an answer
 * in time, without WebGL or when the visitor saves data, the picture stays and «Abrir la guía» still works.
 *
 * It has no menu of its own here: the site's main menu is the menu. Touching a part marks its section in the menu, and
 * pointing at (or tabbing to) a section in the menu flies the owl to that part. A click there goes to the section as always.
 */
import { BUHO_NAV, BUHO_SRC, BUHO_WAIT_MS, darkTheme, savesData } from './site-intro.js';
import { vidrioDelBuho } from '../lib/buho-vidrio.js';

const tema = () => (darkTheme() ? 'oscuro' : 'claro');
const MARK = 'is-senal-buho';
const POINT_MS = 120; // passing over the menu on the way somewhere else does not move the owl
// On the phone, the sections that do not fit in the bottom bar live under «Más».
const inBottomBar = seccion => document.querySelector(`#bottom-nav [data-nav="${BUHO_NAV[seccion]}"]`) || document.querySelector('#bottom-nav [data-more]');
const menuItems = seccion => [document.querySelector(`.bu-riel [data-nav="${seccion}"]`), inBottomBar(seccion)].filter(Boolean);

/** @param {HTMLElement} stage the element that holds the picture and will hold the iframe */
export function mountLandingOwl(stage) {
    let frame = null;
    let waiting = null;
    let themes = null;
    let seen = null;
    let marked = null; // the section the owl is pointing at
    let inView = false;
    let pointing = null;
    const near = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) start();
    }, { rootMargin: '300px 0px' }) : null;

    const tell = data => frame?.contentWindow?.postMessage(data, location.origin);
    const clearMarks = () => document.querySelectorAll(`.${MARK}`).forEach(item => item.classList.remove(MARK));
    const showMark = () => {
        clearMarks();
        if (marked && inView) menuItems(marked).forEach(item => item.classList.add(MARK));
    };
    const pointAt = event => {
        if (event.pointerType && event.pointerType !== 'mouse') return; // on a touch screen a tap already navigates
        const item = event.target.closest?.('.bu-riel [data-nav]');
        clearTimeout(pointing);
        if (!item || !BUHO_NAV[item.dataset.nav] || !inView || !stage.classList.contains('is-on')) return;
        pointing = setTimeout(() => tell({ type: 'buho-elegir', seccion: item.dataset.nav }), POINT_MS);
    };
    const setView = visible => {
        inView = visible;
        showMark();
        tell({ type: 'buho-visible', visible });
    };
    const drop = () => {
        clearTimeout(waiting);
        clearTimeout(pointing);
        marked = null;
        clearMarks();
        document.removeEventListener('pointerover', pointAt);
        document.removeEventListener('focusin', pointAt);
        window.removeEventListener('message', listen);
        themes?.disconnect();
        seen?.disconnect();
        frame?.remove();
        frame = null;
        stage.classList.remove('is-on');
    };
    function listen(event) {
        if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
        const { type, seccion } = event.data || {};
        if (type === 'buho-listo') {
            clearTimeout(waiting);
            stage.classList.add('is-on');
        } else if (type === 'buho-error') {
            drop();
        } else if (type === 'buho-ir') {
            document.getElementById(BUHO_NAV[seccion])?.click();
        } else if (type === 'buho-parte') {
            marked = seccion;
            showMark();
        }
    }
    function start() {
        near?.disconnect();
        if (frame || savesData()) return;
        frame = document.createElement('iframe');
        frame.className = 'lp-owl-frame';
        frame.title = 'Búho biomecánico: tócalo para ver a qué sección lleva cada parte';
        frame.src = `${BUHO_SRC}?tema=${tema()}&vidrio=${vidrioDelBuho()}&modo=portada`;
        frame.setAttribute('allowtransparency', 'true');
        window.addEventListener('message', listen);
        document.addEventListener('pointerover', pointAt);
        document.addEventListener('focusin', pointAt);
        waiting = setTimeout(drop, BUHO_WAIT_MS);
        stage.append(frame);
        // the site's theme can change while the owl is here; out of view it does not draw
        themes = new MutationObserver(() => tell({ type: 'buho-tema', tema: tema() }));
        themes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        seen = new IntersectionObserver(entries => {
            setView(entries[entries.length - 1].isIntersecting);
        }, { threshold: 0.02 });
        seen.observe(stage);
        // lo que se le dijo antes de que cargara se perdió
        frame.addEventListener('load', () => {
            const box = stage.getBoundingClientRect();
            setView(box.bottom > 0 && box.top < innerHeight && box.width > 0);
        }, { once: true });
    }

    near?.observe(stage); // sin forma de saber si está cerca, se queda la imagen

    return {
        destroy() {
            near?.disconnect();
            drop();
        },
    };
}
