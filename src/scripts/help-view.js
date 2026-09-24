import { collectionIcon } from '../lib/collection-icons.js';
import '../styles/help.css';

const icon = paths => `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',
    read: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M8 7h8M8 11h6"/>',
    map: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.3 7.2 15.7 11M8.3 16.8 15.7 13"/>',
    bookmark: '<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-3.5L6 21Z"/>',
};

const START = [
    ['acervo', 'all', 'Encuentra una ley o acuerdo', 'En <b>Acervo</b> están todos los documentos por colección. Filtra por tipo, busca por nombre o siglas y abre el que necesites.', 'Ir al acervo'],
    ['buscar', ICONS.search, 'Busca una palabra en todos los textos', 'En <b>Buscar</b> escribe un tema (por ejemplo, <i>interconexión</i>) y verás los artículos donde aparece, con la palabra resaltada.', 'Ir a buscar'],
    ['analisis', ICONS.map, 'Explora por tema', 'En <b>Análisis</b> eliges un tema y ves qué leyes, planes y autoridades intervienen, y en qué artículos se apoyan.', 'Ir a análisis'],
    ['guardados', ICONS.bookmark, 'Guarda y anota', 'Con una cuenta puedes guardar artículos y escribir notas. Los encuentras juntos en <b>Guardados</b>.', ''],
];
const TRICKS = [
    ['"frase exacta"', 'Solo resultados con esas palabras juntas y en ese orden.', '"planeación vinculante"'],
    ['palabra otra', 'Resultados que tienen las dos palabras.', 'permiso generación'],
    ['una or otra', 'Resultados con cualquiera de las dos.', 'solar or eólica'],
    ['palabra -otra', 'Quita los resultados que tengan la segunda.', 'contrato -transmisión'],
];
const SHORTCUTS = [['/', 'Ir al buscador'], ['← →', 'Artículo anterior o siguiente'], ['f', 'Guardar o quitar de guardados'], ['c', 'Copiar el texto del artículo'], ['Esc', 'Cerrar una ventana'], ['?', 'Ver los atajos']];
const FAQ = [
    ['No encuentro una ley. ¿Qué hago?', 'Prueba con sus siglas (por ejemplo, <i>LSE</i>) o con una palabra de su nombre en el Acervo. Si aún no aparece, es probable que todavía no la hayamos cargado; seguimos agregando documentos.'],
    ['¿Qué es una “Guía” dentro de un documento?', 'Es una nota que agregamos para ayudarte a ubicarte: qué versiones existen, qué documentos van juntos o qué abarca la publicación. No es parte del texto oficial.'],
    ['¿El texto es oficial?', 'Los textos vienen de las publicaciones oficiales (principalmente el DOF). Para cualquier uso legal, revisa siempre el documento original con el botón <b>Fuente oficial</b>; en muchos artículos también puedes ver la página del PDF.'],
    ['¿Puedo descargar o imprimir?', 'Sí. Dentro de cada documento, en <b>Más</b>, puedes imprimir o guardar en PDF, exportar los artículos a una hoja de cálculo o abrir la presentación. En Guardados puedes exportar tus artículos con tus notas.'],
    ['¿Necesito una cuenta?', 'No para leer ni buscar. Solo para guardar artículos y escribir notas.'],
];

/** Plain-language guide to the site. Navigation stays with the app through onGo. */
export function renderHelpView(container, { onGo = () => {}, onShortcuts = () => {} } = {}) {
    container.innerHTML = `<section class="hp-view" aria-labelledby="hp-title">
        <header class="hp-head">
            <p class="hp-eyebrow">Ayuda</p>
            <h1 id="hp-title">Cómo usar el buscador</h1>
            <p class="hp-intro">Todo lo necesario para encontrar, leer y guardar la normativa del sector energético, en pocos pasos.</p>
        </header>

        <h2 class="hp-h2">Para empezar</h2>
        <ul class="hp-start">
            ${START.map(([id, glyph, title, text, cta]) => `<li class="hp-card">
                <span class="hp-card-ico">${glyph === 'all' ? collectionIcon('leyes', 22) : icon(glyph)}</span>
                <h3>${title}</h3><p>${text}</p>
                ${cta ? `<button type="button" class="hp-link" data-go="${id}">${cta} →</button>` : ''}
            </li>`).join('')}
        </ul>

        <div class="hp-two">
            <section class="hp-panel" aria-labelledby="hp-tricks">
                <h2 class="hp-h2" id="hp-tricks">Trucos para buscar</h2>
                <table class="hp-table"><thead><tr><th scope="col">Escribe</th><th scope="col">Qué hace</th></tr></thead><tbody>
                    ${TRICKS.map(([syntax, what, example]) => `<tr><td><code>${syntax}</code></td><td>${what}<span class="hp-example">Ej.: <code>${example}</code></span></td></tr>`).join('')}
                </tbody></table>
                <p class="hp-note">Después de buscar, usa los filtros de la izquierda para quedarte con una colección, un documento o un número de artículo.</p>
            </section>
            <section class="hp-panel" aria-labelledby="hp-read">
                <h2 class="hp-h2" id="hp-read">Al leer un documento</h2>
                <ul class="hp-list">
                    <li><b>Índice:</b> en computadora aparece a la izquierda y marca la sección que estás leyendo; en el celular, usa el botón <b>Índice</b>.</li>
                    <li><b>Pestañas:</b> además del texto tienes la línea del tiempo, una presentación y la estructura con sus temas.</li>
                    <li><b>Artículo completo:</b> al abrir un artículo puedes pasar al anterior o al siguiente y ver el PDF original a un lado.</li>
                    <li><b>Ajustes de lectura:</b> cambia el tamaño de letra, el interlineado y el fondo.</li>
                </ul>
                <h3 class="hp-h3">Atajos de teclado</h3>
                <ul class="hp-keys">${SHORTCUTS.map(([key, what]) => `<li><kbd>${key}</kbd><span>${what}</span></li>`).join('')}</ul>
            </section>
        </div>

        <section aria-labelledby="hp-faq">
            <h2 class="hp-h2" id="hp-faq">Preguntas frecuentes</h2>
            <div class="hp-faq">${FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
        </section>
    </section>`;

    container.querySelector('.hp-view').addEventListener('click', event => {
        const go = event.target.closest('[data-go]');
        if (go) onGo(go.dataset.go);
        if (event.target.closest('[data-shortcuts]')) onShortcuts();
    });
}
