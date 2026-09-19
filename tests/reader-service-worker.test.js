// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';

it('does not intercept or cache remote PDFs, including direct navigations', () => {
    const handlers = {};
    const caches = { open: vi.fn(), match: vi.fn() };
    runInNewContext(readFileSync('public/sw.js', 'utf8'), {
        self: { location: new URL('https://app.test/sw.js?v=test'), addEventListener: (name, fn) => { handlers[name] = fn; } },
        URL, URLSearchParams, caches,
    });
    for (const mode of ['navigate', 'cors']) {
        const event = { request: { url: 'https://app.test/api/reader/lcne', method: 'GET', mode }, respondWith: vi.fn() };
        handlers.fetch(event);
        expect(event.respondWith).not.toHaveBeenCalled();
    }
    expect(caches.open).not.toHaveBeenCalled();
    expect(caches.match).not.toHaveBeenCalled();
});
