import { describe, expect, it } from 'vitest';
import { coverHTML } from '../src/lib/law-cover.js';
import { issuerMark } from '../src/lib/issuer-logos.js';

const cne = { titulo: 'Acuerdo de la Comisión Nacional de Energía por el que se emiten las DACG', siglas: 'DACG-X', tipo: 'dacg' };

describe('issuer on the cover', () => {
  it('names the authority that issued the document, read from the document itself', () => {
    expect(issuerMark(cne)).toEqual({ id: 'cne', short: 'CNE', label: 'Comisión Nacional de Energía', logo: null });
    expect(coverHTML(cne)).toContain('CNE');
    expect(coverHTML(cne)).toContain('sh-cover-issuer');
  });
  it('shows the official file when there is one', () => {
    const logos = { cne: '/img/instituciones/cne.svg' };
    expect(issuerMark(cne, logos).logo).toBe('/img/instituciones/cne.svg');
    expect(coverHTML(cne, logos)).toContain('<img src="/img/instituciones/cne.svg" alt="Comisión Nacional de Energía"');
  });
  it('shows nothing rather than guess when the document does not say', () => {
    const unknown = { titulo: 'Documento sin autoridad', siglas: 'X', tipo: 'otros' };
    expect(issuerMark(unknown)).toBeNull();
    expect(coverHTML(unknown)).not.toContain('sh-cover-issuer');
  });
});
