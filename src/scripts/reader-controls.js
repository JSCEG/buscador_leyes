import { loadReaderPreferences, saveReaderPreferences, applyReaderPreferences } from '../lib/reader-preferences.js';
import '../styles/reader.css';

export function readerControlsHtml() {
    return `<details class="reader-settings">
        <summary><span aria-hidden="true">Aa</span> Ajustes de lectura</summary>
        <div class="reader-settings-panel">
            <div class="reader-size" role="group" aria-label="Tamaño del texto">
                <button type="button" data-reader-size="-2" aria-label="Reducir tamaño de letra">A−</button>
                <output data-reader-size-output aria-live="polite">18 px</output>
                <button type="button" data-reader-size="2" aria-label="Aumentar tamaño de letra">A+</button>
            </div>
            <label>Interlineado<select data-reader-spacing aria-label="Interlineado"><option value="1.6">Compacto</option><option value="1.8">Normal</option><option value="2">Amplio</option></select></label>
            <label>Fondo<select data-reader-surface aria-label="Fondo de lectura"><option value="system">Automático</option><option value="light">Blanco</option><option value="sepia">Sepia</option><option value="dark">Oscuro</option></select></label>
            <button type="button" data-reader-reset>Restablecer</button>
            <p>Se conserva en este navegador, también al abrir otro instrumento.</p>
        </div>
    </details>`;
}

export function initReaderControls(root = document) {
    let preferences = loadReaderPreferences();
    const sync = () => {
        applyReaderPreferences(document.documentElement, preferences);
        root.querySelectorAll('[data-reader-size-output]').forEach(el => { el.textContent = `${preferences.fontSize} px`; });
        root.querySelectorAll('[data-reader-size]').forEach(el => { el.disabled = Number(el.dataset.readerSize) < 0 ? preferences.fontSize <= 14 : preferences.fontSize >= 28; });
        root.querySelectorAll('[data-reader-spacing]').forEach(el => { el.value = String(preferences.lineHeight); });
        root.querySelectorAll('[data-reader-surface]').forEach(el => { el.value = preferences.surface; });
    };
    const update = patch => { preferences = saveReaderPreferences({ ...preferences, ...patch }); sync(); };
    const click = e => {
        const button = e.target.closest('[data-reader-size], [data-reader-reset]');
        if (!button || !root.contains(button)) return;
        if (button.hasAttribute('data-reader-reset')) update({ fontSize: 18, lineHeight: 1.8, surface: 'system' });
        else update({ fontSize: preferences.fontSize + Number(button.dataset.readerSize) });
    };
    const change = e => {
        if (e.target.matches('[data-reader-spacing]')) update({ lineHeight: Number(e.target.value) });
        if (e.target.matches('[data-reader-surface]')) update({ surface: e.target.value });
    };
    root.addEventListener('click', click);
    root.addEventListener('change', change);
    sync();
    return { sync, destroy() { root.removeEventListener('click', click); root.removeEventListener('change', change); } };
}
