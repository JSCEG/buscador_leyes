import { beforeEach, describe, expect, it, vi } from 'vitest';

function memoryStorage(initial) {
    const values = new Map(initial === undefined ? [] : [['sener-reader-preferences-v1', initial]]);
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
    };
}

let reader;
beforeEach(async () => {
    vi.resetModules();
    reader = await import('../src/lib/reader-preferences.js');
    document.body.innerHTML = '';
});

describe('reading preference persistence', () => {
    it('restores the shared settings after the module is loaded again, without storing theme data', async () => {
        const storage = memoryStorage();
        expect(reader.loadReaderPreferences(storage)).toEqual({ fontSize: 18, lineHeight: 1.8, surface: 'system' });
        const value = reader.saveReaderPreferences({ fontSize: 24, lineHeight: 2, theme: 'dark' }, storage);
        expect(value).toEqual({ fontSize: 24, lineHeight: 2, surface: 'system' });
        expect(JSON.parse(storage.getItem(reader.READER_PREFERENCES_KEY))).toEqual(value);
        vi.resetModules();
        const reloaded = await import('../src/lib/reader-preferences.js');
        expect(reloaded.loadReaderPreferences(storage)).toEqual(value);
    });

    it('clamps finite sizes and rejects arbitrary line heights or CSS strings', () => {
        expect(reader.normalizeReaderPreferences({ fontSize: 1000, lineHeight: 1.6, surface: 'system' })).toEqual({ fontSize: 28, lineHeight: 1.6, surface: 'system' });
        expect(reader.normalizeReaderPreferences({ fontSize: -5, lineHeight: 0 })).toEqual({ fontSize: 14, lineHeight: 1.8, surface: 'system' });
        expect(reader.normalizeReaderPreferences({ fontSize: 21.8, lineHeight: 1.8, surface: 'system' })).toEqual({ fontSize: 22, lineHeight: 1.8, surface: 'system' });
        for (const fontSize of [NaN, Infinity, -Infinity, '24px', '24', 'var(--attack)']) {
            expect(reader.normalizeReaderPreferences({ fontSize, lineHeight: '2' })).toEqual({ fontSize: 18, lineHeight: 1.8, surface: 'system' });
        }
    });

    it.each(['broken json', 'null', '[]', '42', '"large"', '{"fontSize":null,"lineHeight":100}', ' '.repeat(1100)])('uses defaults for malformed persisted data: %.35s', raw => {
        expect(reader.loadReaderPreferences(memoryStorage(raw))).toEqual({ fontSize: 18, lineHeight: 1.8, surface: 'system' });
    });

    it('retains valid fields while normalizing a partially corrupt stored pair', () => {
        expect(reader.loadReaderPreferences(memoryStorage('{"fontSize":26,"lineHeight":"bad"}'))).toEqual({ fontSize: 26, lineHeight: 1.8, surface: 'system' });
        expect(reader.loadReaderPreferences(memoryStorage('{"fontSize":-100,"lineHeight":2}'))).toEqual({ fontSize: 14, lineHeight: 2, surface: 'system' });
    });

    it('keeps controls working for this session when storage is denied or its getter is unavailable', () => {
        const blocked = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceededError'); } };
        expect(reader.loadReaderPreferences(blocked)).toEqual({ fontSize: 18, lineHeight: 1.8, surface: 'system' });
        expect(reader.saveReaderPreferences({ fontSize: 22, lineHeight: 1.6, surface: 'system' }, blocked)).toEqual({ fontSize: 22, lineHeight: 1.6, surface: 'system' });
        expect(reader.loadReaderPreferences(blocked)).toEqual({ fontSize: 22, lineHeight: 1.6, surface: 'system' });
        const localStorageGetter = vi.spyOn(globalThis, 'localStorage', 'get').mockImplementation(() => { throw new Error('SecurityError'); });
        try {
            expect(reader.loadReaderPreferences()).toEqual({ fontSize: 22, lineHeight: 1.6, surface: 'system' });
            expect(() => reader.saveReaderPreferences({ fontSize: 20, lineHeight: 2, surface: 'system' })).not.toThrow();
            expect(reader.loadReaderPreferences()).toEqual({ fontSize: 20, lineHeight: 2, surface: 'system' });
        } finally { localStorageGetter.mockRestore(); }
    });

    it('returns independent values so consumers cannot accidentally mutate the saved session pair', () => {
        const returned = reader.saveReaderPreferences({ fontSize: 20, lineHeight: 2, surface: 'system' }, null);
        returned.fontSize = 100;
        expect(reader.loadReaderPreferences(null)).toEqual({ fontSize: 20, lineHeight: 2, surface: 'system' });
        expect(reader.DEFAULT_READER_PREFERENCES).toEqual({ fontSize: 18, lineHeight: 1.8, surface: 'system' });
    });

    it('does not reload stale preferences when quota prevents writes but reads still work', () => {
        const storage = memoryStorage('{"fontSize":16,"lineHeight":1.6,"surface":"light"}');
        storage.setItem = () => { throw new Error('QuotaExceededError'); };
        expect(reader.loadReaderPreferences(storage).fontSize).toBe(16);
        const changed = { fontSize: 24, lineHeight: 2, surface: 'sepia' };
        reader.saveReaderPreferences(changed, storage);
        expect(reader.loadReaderPreferences(storage)).toEqual(changed);
        const recovered = memoryStorage();
        reader.saveReaderPreferences(changed, recovered);
        expect(JSON.parse(recovered.getItem(reader.READER_PREFERENCES_KEY))).toEqual(changed);
    });
});

describe('reader content roots', () => {
    it.each(['system', 'light', 'sepia', 'dark'])('persists and applies the %s surface only to the requested reader', surface => {
        const storage = memoryStorage();
        const root = document.createElement('article');
        const unrelated = document.createElement('aside');
        const beforeBody = document.body.className;
        const beforeHtml = document.documentElement.className;
        reader.saveReaderPreferences({ fontSize: 20, lineHeight: 1.8, surface }, storage);
        const loaded = reader.loadReaderPreferences(storage);
        expect(loaded.surface).toBe(surface);
        reader.applyReaderPreferences(root, loaded);
        expect(root.dataset.readerSurface).toBe(surface);
        expect(unrelated.hasAttribute('data-reader-surface')).toBe(false);
        expect(document.body.className).toBe(beforeBody);
        expect(document.documentElement.className).toBe(beforeHtml);
        reader.applyReaderPreferences(root, { ...loaded, surface: 'url(javascript:attack)' });
        expect(root.dataset.readerSurface).toBe('system');
    });

    it('applies the same inherited size and spacing to an instrument and an article without changing the global theme', () => {
        document.body.className = 'bg-sepia';
        document.documentElement.classList.add('dark-mode');
        const fullReader = document.createElement('section');
        const articleDialog = document.createElement('article');
        document.body.append(fullReader, articleDialog);
        for (const root of [fullReader, articleDialog]) {
            expect(reader.applyReaderPreferences(root, { fontSize: 24, lineHeight: 2, surface: 'system' })).toEqual({ fontSize: 24, lineHeight: 2, surface: 'system' });
            expect(root.style.getPropertyValue('--reader-font-size')).toBe('24px');
            expect(root.style.getPropertyValue('--reader-line-height')).toBe('2');
            expect(root.style.fontSize).toBe('');
            expect(root.style.lineHeight).toBe('');
        }
        expect(document.body.className).toBe('bg-sepia');
        expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
        expect(document.body.style.getPropertyValue('--reader-font-size')).toBe('');
        document.documentElement.classList.remove('dark-mode');
    });

    it('normalizes applied values and allows a temporarily absent reader root', () => {
        const root = document.createElement('div');
        reader.applyReaderPreferences(root, { fontSize: Infinity, lineHeight: 'url(attack)' });
        expect(root.style.getPropertyValue('--reader-font-size')).toBe('18px');
        expect(root.style.getPropertyValue('--reader-line-height')).toBe('1.8');
        expect(reader.applyReaderPreferences(null, { fontSize: 20, lineHeight: 1.6, surface: 'system' })).toEqual({ fontSize: 20, lineHeight: 1.6, surface: 'system' });
    });
});
