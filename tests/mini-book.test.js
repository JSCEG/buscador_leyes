import { describe, expect, it } from 'vitest';
import { miniBookLabel } from '../src/lib/mini-book.js';

describe('label on the small book', () => {
    it('shows a short acronym whole', () => {
        expect(miniBookLabel('LSE')).toEqual({ text: 'LSE', size: 'l' });
        expect(miniBookLabel('PROSENER')).toEqual({ text: 'PROSENER', size: 's' });
        expect(miniBookLabel('LEPEPM')).toEqual({ text: 'LEPEPM', size: 's' });
    });
    it('uses the first word of a long one, never a word cut in half', () => {
        expect(miniBookLabel('FORMATOS-BIOCOMBUSTIBLES').text).toBe('FORMATOS');
        expect(miniBookLabel('ACUERDO-CNE-16/04/2026-DACG-SAE').text).toBe('ACUERDO');
        expect(miniBookLabel('NOM-EM-009-ASEA-2026')).toEqual({ text: 'NOM', size: 'l' });
    });
    it('leaves room for the collection icon when nothing fits', () => {
        expect(miniBookLabel('BIOCOMBUSTIBLES')).toEqual({ text: '', size: '' });
        expect(miniBookLabel('')).toEqual({ text: '', size: '' });
        expect(miniBookLabel(null)).toEqual({ text: '', size: '' });
    });
});
