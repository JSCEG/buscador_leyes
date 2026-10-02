import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
const { parseDefinitions, markTerms, glossaryLaws } = await import('../src/lib/definitions.js');

const LSE = `Para los efectos de esta Ley, se entiende por:
I.  Accesibilidad: Principio que garantiza que no existan obstáculos
que impidan el acceso equitativo;
II.  CENACE: El Centro Nacional de Control de Energía;
III.  Central Eléctrica: Instalaciones y equipos que permiten generar energía eléctrica, y
IV.  Comisión: La Comisión Nacional de Energía.`;

describe('parseDefinitions', () => {
    it('reads each fraction as term and definition', () => {
        const terms = parseDefinitions(LSE);
        expect([...terms.keys()]).toEqual(['Accesibilidad', 'CENACE', 'Central Eléctrica', 'Comisión']);
        expect(terms.get('Accesibilidad')).toBe('Principio que garantiza que no existan obstáculos que impidan el acceso equitativo');
        expect(terms.get('Central Eléctrica')).toBe('Instalaciones y equipos que permiten generar energía eléctrica');
        expect(terms.get('Comisión')).toBe('La Comisión Nacional de Energía');
    });
    it('ignores articles that define nothing', () => {
        expect(parseDefinitions('La Secretaría debe dar seguimiento a los Recursos Prospectivos.').size).toBe(0);
    });
});

describe('markTerms', () => {
    it('marks only the first use of each term, longest first, and plurals', () => {
        const host = document.createElement('div');
        host.innerHTML = '<p>La Comisión revisa las Centrales Eléctricas. La Comisión y el CENACE.</p><a>Comisión</a>';
        const terms = new Map([['Comisión', {}], ['Central Eléctrica', {}], ['CENACE', {}]]);
        expect(markTerms(host, terms)).toBe(2);
        expect([...host.querySelectorAll('.def-term')].map(span => span.textContent)).toEqual(['Comisión', 'CENACE']);
        expect(host.querySelector('a .def-term')).toBeNull();
    });
    it('does not mark a term inside a longer word', () => {
        const host = document.createElement('div');
        host.textContent = 'Las Comisiones Reguladoras';
        expect(markTerms(host, new Map([['Comisión', {}]]))).toBe(0);
    });
});

describe('glossaryLaws', () => {
    it('adds the law of a reglamento', () => {
        const lsh = { id: 2, titulo: 'Ley del Sector Hidrocarburos' };
        const rlsh = { id: 1, titulo: 'Reglamento de la Ley del Sector de Hidrocarburos' };
        expect(glossaryLaws(rlsh, [lsh, rlsh])).toEqual([rlsh, lsh]);
        expect(glossaryLaws(lsh, [lsh, rlsh])).toEqual([lsh]);
    });
});
