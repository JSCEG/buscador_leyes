/** Shared reading preferences for a complete instrument and the article dialog. */
export const READER_PREFERENCES_KEY = 'sener-reader-preferences-v1';
export const DEFAULT_READER_PREFERENCES = Object.freeze({ fontSize: 18, lineHeight: 1.8, surface: 'system' });
export const READER_FONT_SIZE_RANGE = Object.freeze({ min: 14, max: 28 });
export const READER_FONT_SIZE_OPTIONS = Object.freeze([16, 18, 20, 22, 24, 26, 28]);
export const READER_LINE_HEIGHT_OPTIONS = Object.freeze([1.6, 1.8, 2]);
export const READER_SURFACE_OPTIONS = Object.freeze(['system', 'light', 'sepia', 'dark']);

// Private/session-only fallback: a denied or full storage must not disable Aa controls.
let sessionPreferences = { ...DEFAULT_READER_PREFERENCES };
let hasUnsavedSessionPreferences = false;

function getStorage(providedStorage) {
    if (providedStorage !== undefined) return providedStorage;
    try { return globalThis.localStorage; }
    catch { return null; }
}

/** Only supported typography and reader-local surfaces are kept; global theme data is ignored. */
export function normalizeReaderPreferences(input) {
    const value = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    return {
        fontSize: typeof value.fontSize === 'number' && Number.isFinite(value.fontSize)
            ? Math.min(READER_FONT_SIZE_RANGE.max, Math.max(READER_FONT_SIZE_RANGE.min, Math.round(value.fontSize)))
            : DEFAULT_READER_PREFERENCES.fontSize,
        lineHeight: READER_LINE_HEIGHT_OPTIONS.includes(value.lineHeight)
            ? value.lineHeight : DEFAULT_READER_PREFERENCES.lineHeight,
        surface: READER_SURFACE_OPTIONS.includes(value.surface)
            ? value.surface : DEFAULT_READER_PREFERENCES.surface,
    };
}

/** Read persisted preferences. Missing/malformed data reset to defaults; blocked storage uses this session. */
export function loadReaderPreferences(storage) {
    if (hasUnsavedSessionPreferences) return { ...sessionPreferences };
    const target = getStorage(storage);
    if (!target || typeof target.getItem !== 'function') return { ...sessionPreferences };
    let raw;
    try { raw = target.getItem(READER_PREFERENCES_KEY); }
    catch { return { ...sessionPreferences }; }
    let parsed;
    try {
        parsed = typeof raw === 'string' && raw.length <= 1024 ? JSON.parse(raw) : null;
    } catch { parsed = null; }
    sessionPreferences = normalizeReaderPreferences(parsed);
    return { ...sessionPreferences };
}

/** Save complete preferences; return effective values even if storage is unavailable. */
export function saveReaderPreferences(preferences, storage) {
    sessionPreferences = normalizeReaderPreferences(preferences);
    const target = getStorage(storage);
    try {
        if (typeof target?.setItem !== 'function') throw new Error('Storage unavailable');
        target.setItem(READER_PREFERENCES_KEY, JSON.stringify(sessionPreferences));
        hasUnsavedSessionPreferences = false;
    } catch {
        // A later modal must not replace the current preference with stale persisted data.
        hasUnsavedSessionPreferences = true;
    }
    return { ...sessionPreferences };
}

/** Set inheritable reader tokens without changing root rem sizing or the global theme.
 * Reader-only document styles consume these variables and descendants inherit their typography.
 */
export function applyReaderPreferences(root, preferences = loadReaderPreferences()) {
    const effective = normalizeReaderPreferences(preferences);
    if (typeof root?.style?.setProperty === 'function') {
        root.style.setProperty('--reader-font-size', `${effective.fontSize}px`);
        root.style.setProperty('--reader-line-height', String(effective.lineHeight));
    }
    if (root?.dataset) root.dataset.readerSurface = effective.surface;
    return effective;
}
