import { describe, it, expect } from 'vitest';
import { shouldInvite } from '../src/lib/install-prompt.js';

describe('shouldInvite', () => {
    const base = { visits: 2, isStandalone: false, isTouch: true, isSnoozed: false };
    it('invites touch visitors from their second visit', () => {
        expect(shouldInvite(base)).toBe(true);
        expect(shouldInvite({ ...base, visits: 1 })).toBe(false);
    });
    it('never invites when installed, on desktop or while snoozed', () => {
        expect(shouldInvite({ ...base, isStandalone: true })).toBe(false);
        expect(shouldInvite({ ...base, isTouch: false })).toBe(false);
        expect(shouldInvite({ ...base, isSnoozed: true })).toBe(false);
    });
});
