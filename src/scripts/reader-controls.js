import { loadReaderPreferences, saveReaderPreferences, applyReaderPreferences, DEFAULT_READER_PREFERENCES, READER_FONT_SIZE_RANGE } from '../lib/reader-preferences.js';
import '../styles/reader.css';

// ReaderPreferences of the design system: size (A− A+ and slider), line spacing, column width, typeface,
// reader surface and site theme, with a live preview that reads the same variables as the text.
export function readerControlsHtml() {
    const theme = document.documentElement.dataset.theme || 'light';
    const themeOption = (value, label) => `<button type="button" role="radio" class="bj-seg__opt" data-theme-choice="${value}" aria-checked="${value === theme}">${label}</button>`;
    const segOption = (attr, value, label) => `<button type="button" role="radio" class="bj-seg__opt" ${attr}="${value}" aria-checked="false">${label}</button>`;
    const { min, max } = READER_FONT_SIZE_RANGE;
    return `<details class="reader-settings">
        <summary><span aria-hidden="true">Aa</span> <span class="reader-settings-label">Ajustes de lectura</span></summary>
        <div class="reader-settings-panel">
            <p class="reader-settings-preview" aria-hidden="true"><b>Artículo 1.</b> La presente Ley es reglamentaria de los artículos 25, 27 y 28 de la Constitución.</p>
            <div class="reader-settings-size">Tamaño
                <div class="reader-size" role="group" aria-label="Tamaño del texto">
                    <button type="button" data-reader-size="-2" aria-label="Reducir tamaño de letra">A−</button>
                    <output data-reader-size-output aria-live="polite">18 px</output>
                    <button type="button" data-reader-size="2" aria-label="Aumentar tamaño de letra">A+</button>
                </div>
                <input type="range" min="${min}" max="${max}" step="1" value="18" data-reader-size-range aria-label="Tamaño del texto en píxeles">
            </div>
            <label>Interlineado<select data-reader-spacing aria-label="Interlineado"><option value="1.6">Compacto</option><option value="1.8">Normal</option><option value="2">Amplio</option></select></label>
            <div class="reader-settings-theme">Ancho de columna
                <div class="bj-seg" role="radiogroup" aria-label="Ancho de columna">
                    ${segOption('data-reader-measure', 56, 'Estrecho')}${segOption('data-reader-measure', 68, 'Normal')}${segOption('data-reader-measure', 84, 'Amplio')}
                </div>
            </div>
            <div class="reader-settings-theme">Tipografía
                <div class="bj-seg" role="radiogroup" aria-label="Tipografía del texto">
                    ${segOption('data-reader-typeface', 'sans', 'Noto Sans')}${segOption('data-reader-typeface', 'serif', 'Newsreader')}
                </div>
            </div>
            <label>Fondo<select data-reader-surface aria-label="Fondo de lectura"><option value="system">Automático</option><option value="light">Blanco</option><option value="sepia">Sepia</option><option value="dark">Oscuro</option></select></label>
            <div class="reader-settings-theme">Tema del sitio
                <div class="bj-seg" role="radiogroup" aria-label="Tema del sitio">
                    ${themeOption('light', 'Claro')}${themeOption('dark', 'Oscuro')}${themeOption('sepia', 'Sepia')}${themeOption('contraste', 'Contraste')}
                </div>
            </div>
            <button type="button" data-reader-reset>Restablecer</button>
            <p>Se conserva en este navegador, también al abrir otro instrumento.</p>
        </div>
    </details>`;
}

export function initReaderControls(root = document) {
    let preferences = loadReaderPreferences();
    const { min, max } = READER_FONT_SIZE_RANGE;
    const sync = () => {
        applyReaderPreferences(document.documentElement, preferences);
        root.querySelectorAll('[data-reader-size-output]').forEach(el => { el.textContent = `${preferences.fontSize} px`; });
        root.querySelectorAll('[data-reader-size]').forEach(el => { el.disabled = Number(el.dataset.readerSize) < 0 ? preferences.fontSize <= min : preferences.fontSize >= max; });
        root.querySelectorAll('[data-reader-size-range]').forEach(el => { el.value = String(preferences.fontSize); });
        root.querySelectorAll('[data-reader-spacing]').forEach(el => { el.value = String(preferences.lineHeight); });
        root.querySelectorAll('[data-reader-surface]').forEach(el => { el.value = preferences.surface; });
        root.querySelectorAll('[data-reader-measure]').forEach(el => { el.setAttribute('aria-checked', String(Number(el.dataset.readerMeasure) === preferences.measure)); });
        root.querySelectorAll('[data-reader-typeface]').forEach(el => { el.setAttribute('aria-checked', String(el.dataset.readerTypeface === preferences.typeface)); });
    };
    const update = patch => { preferences = saveReaderPreferences({ ...preferences, ...patch }); sync(); };
    const click = e => {
        const button = e.target.closest('[data-reader-size], [data-reader-reset], [data-reader-measure], [data-reader-typeface]');
        if (!button || !root.contains(button)) return;
        if (button.hasAttribute('data-reader-reset')) update({ ...DEFAULT_READER_PREFERENCES });
        else if (button.hasAttribute('data-reader-measure')) update({ measure: Number(button.dataset.readerMeasure) });
        else if (button.hasAttribute('data-reader-typeface')) update({ typeface: button.dataset.readerTypeface });
        else update({ fontSize: preferences.fontSize + Number(button.dataset.readerSize) });
    };
    const change = e => {
        if (e.target.matches('[data-reader-spacing]')) update({ lineHeight: Number(e.target.value) });
        if (e.target.matches('[data-reader-surface]')) update({ surface: e.target.value });
    };
    const input = e => { if (e.target.matches('[data-reader-size-range]')) update({ fontSize: Number(e.target.value) }); };
    root.addEventListener('click', click);
    root.addEventListener('change', change);
    root.addEventListener('input', input);
    sync();
    return { sync, destroy() { root.removeEventListener('click', click); root.removeEventListener('change', change); root.removeEventListener('input', input); } };
}
