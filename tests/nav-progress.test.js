import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { progressState, startProgress, withProgress } from '../src/lib/nav-progress.js';

describe('navigation progress bar', () => {
    beforeEach(() => { vi.useFakeTimers(); document.body.innerHTML = '<main id="main-container"></main>'; });
    afterEach(() => { vi.runAllTimers(); vi.useRealTimers(); });

    it('does not flash for instant answers', async () => {
        await withProgress(Promise.resolve('ok'));
        vi.advanceTimersByTime(500);
        expect(document.getElementById('nav-progress')?.classList.contains('np-active') ?? false).toBe(false);
        expect(progressState().active).toBe(0);
    });

    it('shows while slow work is pending and marks the page busy', async () => {
        let resolve;
        const pending = withProgress(new Promise(r => { resolve = r; }));
        expect(document.documentElement.classList.contains('is-loading')).toBe(true);
        expect(document.getElementById('main-container').getAttribute('aria-busy')).toBe('true');
        vi.advanceTimersByTime(150);
        expect(progressState().visible).toBe(true);
        vi.advanceTimersByTime(400);
        const pill = document.getElementById('nav-progress-pill');
        expect(pill.classList.contains('np-active')).toBe(true);
        expect(pill.getAttribute('role')).toBe('status');
        resolve('done');
        await expect(pending).resolves.toBe('done');
        expect(document.documentElement.classList.contains('is-loading')).toBe(false);
        expect(document.getElementById('main-container').hasAttribute('aria-busy')).toBe(false);
        expect(pill.classList.contains('np-active')).toBe(false);
        vi.advanceTimersByTime(500);
        expect(progressState().visible).toBe(false);
    });

    it('stays up until the last overlapping wait ends and survives errors', async () => {
        const endA = startProgress();
        const endB = startProgress();
        vi.advanceTimersByTime(150);
        endA(); endA();
        expect(progressState()).toEqual({ active: 1, visible: true });
        endB();
        expect(progressState().active).toBe(0);
        await expect(withProgress(() => Promise.reject(new Error('red')))).rejects.toThrow('red');
        expect(progressState().active).toBe(0);
    });
});
