import { describe, expect, it } from 'vitest';
import { coverHTML } from '../src/lib/law-cover.js';
import { existsSync } from 'node:fs';
import { ISSUER_LOGOS, issuerMark } from '../src/lib/issuer-logos.js';
import { ISSUERS } from '../src/lib/issuer.js';

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
  it('registers only authorities that exist, with a file that is in the project', () => {
    const known = new Set(ISSUERS.map(issuer => issuer.id));
    for (const [id, path] of Object.entries(ISSUER_LOGOS)) {
      expect(known.has(id), id).toBe(true);
      expect(existsSync(`public${path}`), path).toBe(true);
    }
  });
  it('shows the SENER file on its documents', () => {
    const sener = { titulo: 'Acuerdo de la Secretaría de Energía', siglas: 'SENER-X', tipo: 'acuerdo' };
    expect(coverHTML(sener)).toContain('<img src="/img/instituciones/sener.png" alt="Secretaría de Energía"');
  });
  it('shows nothing rather than guess when the document does not say', () => {
    const unknown = { titulo: 'Documento sin autoridad', siglas: 'X', tipo: 'otros' };
    expect(issuerMark(unknown)).toBeNull();
    expect(coverHTML(unknown)).not.toContain('sh-cover-issuer');
  });
});
