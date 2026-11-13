import { afterEach, expect, it, vi } from 'vitest';
import { observeAcervoFetch, acervoHealth } from '../src/lib/service-availability.js';
import { initMaintenance } from '../src/lib/maintenance.js';

const base = 'https://example.supabase.co';
afterEach(() => vi.useRealTimers());

it('confirms server failures and slow reads while leaving auth, missing records and cancelled requests alone', async () => {
    vi.useFakeTimers();
    const suspect = vi.fn();
    const request = async (path, status) => observeAcervoFetch(async () => new Response(null, { status }), suspect)(base + path);
    await request('/auth/v1/user', 503);
    await request('/rest/v1/leyes', 404);
    expect(suspect).not.toHaveBeenCalled();
    await request('/rest/v1/leyes', 503);
    let finish;
    const read = observeAcervoFetch(() => new Promise(resolve => { finish = resolve; }), suspect, 10);
    const slow = read(base + '/rest/v1/articulos');
    await vi.advanceTimersByTimeAsync(10);
    finish(new Response()); await slow;
    const controller = new AbortController(); controller.abort();
    const abort = observeAcervoFetch(async () => { throw new DOMException('Aborted', 'AbortError'); }, suspect);
    await expect(abort(base + '/rest/v1/articulos', { signal: controller.signal })).rejects.toThrow();
    expect(suspect).toHaveBeenCalledTimes(2);
});

it('distinguishes authentication and query-specific errors from an unavailable catalogue', async () => {
    for (const [status, expected] of [[401, 'unknown'], [400, 'unknown'], [503, 'down'], [200, 'up']]) {
        expect(await acervoHealth(base, 'public-key', async () => new Response('[]', { status }))).toBe(expected);
    }
});

it('keeps the article address, coalesces checks and returns there once the service recovers', async () => {
    vi.useFakeTimers(); location.hash = '#art-example';
    document.body.innerHTML = '<dialog id="service-maintenance"><button></button><p role="status"></p></dialog>';
    const dialog = document.querySelector('dialog');
    dialog.showModal = () => { dialog.open = true; };
    const probe = vi.fn().mockResolvedValueOnce('down').mockResolvedValueOnce('up');
    const resume = vi.fn();
    initMaintenance({ probe, resume });
    window.dispatchEvent(new Event('acervo:check-service'));
    window.dispatchEvent(new Event('acervo:check-service'));
    await vi.advanceTimersByTimeAsync(0);
    expect(dialog.open).toBe(true);
    expect(probe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30000);
    expect(resume).toHaveBeenCalledTimes(1);
    expect(location.hash).toBe('#art-example');
});
