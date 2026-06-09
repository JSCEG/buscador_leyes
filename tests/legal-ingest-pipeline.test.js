import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const {
    extractLegalStructureFromMarkdown,
    extractLegalStructureFromText
} = require('../legal-ingest-pipeline.js');

describe('legal ingest pipeline', () => {
    test('does not split lowercase article references from the preamble', () => {
        const markdown = `
## DECRETO

CLAUDIA SHEINBAUM, en ejercicio de la facultad que me confiere el artículo 89, fracción I,
y con fundamento en los artículos 14, 17 y 33, expido lo siguiente.

**Artículo 1.-** El presente Reglamento tiene por objeto...
`;

        const { chunks } = extractLegalStructureFromMarkdown(markdown);

        expect(chunks).toHaveLength(2);
        expect(chunks[0].identificador).toBe('Preámbulo/Considerandos');
        expect(chunks[0].contenido).toContain('artículo 89');
        expect(chunks[1].identificador).toBe('Artículo 1.-');
    });

    test('splits embedded article headings when pdf markdown glues them to previous content', () => {
        const markdown = `
**Artículo 10.** El Consejo tiene las siguientes atribuciones:
**I.** Emitir opinión previa; **II.** Elaborar su programa anual; **X.** Las demás que le confiera expresamente la Secretaría. **Artículo 11.** El Consejo se integra en términos de la Ley.
`;

        const { chunks } = extractLegalStructureFromMarkdown(markdown);

        expect(chunks.map((chunk) => chunk.identificador)).toEqual([
            'Artículo 10.',
            'Artículo 11.'
        ]);
        expect(chunks[0].contenido).toContain('Las demás que le confiera expresamente la Secretaría.');
        expect(chunks[1].contenido).toContain('El Consejo se integra');
    });

    test('extracts themes from multiline structural headings', () => {
        const text = `
ARTÍCULO ÚNICO. Se expide el Reglamento.
TÍTULO PRIMERO
DE LAS DISPOSICIONES GENERALES
Capítulo Único
Del Consejo
Artículo 1. Este Reglamento...
`;

        const { themes } = extractLegalStructureFromText(text);

        expect(themes).toEqual([
            expect.objectContaining({ nivel: 'titulo', nombre: 'DE LAS DISPOSICIONES GENERALES' }),
            expect.objectContaining({ nivel: 'capitulo', nombre: 'Del Consejo' })
        ]);
    });

    test('creates transitory chunks after the transitorios marker', () => {
        const text = `
Artículo 1. Texto principal.
TRANSITORIOS
PRIMERO. El presente Decreto entrará en vigor.
SEGUNDO. Se derogan las disposiciones contrarias.
`;

        const { chunks } = extractLegalStructureFromText(text);

        expect(chunks.map((chunk) => chunk.identificador)).toEqual([
            'Artículo 1.',
            'Transitorio PRIMERO.',
            'Transitorio SEGUNDO.'
        ]);
    });

    test('chunks decreto with ordinal article headings (Artículo Primero, Segundo...)', () => {
        const text = `
DECRETO por el que se otorgan estímulos fiscales.

CONSIDERANDO
Que, en términos del artículo 25, primer párrafo, corresponde al Estado la rectoría del desarrollo nacional.

DECRETO
Artículo Primero. Se otorgan estímulos fiscales a los contribuyentes que realicen actividades económicas.
Artículo Segundo. Los contribuyentes deben cumplir con los siguientes requisitos:
I. Estar al corriente en el cumplimiento de sus obligaciones fiscales.
Artículo Tercero. Los contribuyentes podrán efectuar la deducción inmediata del 100%.
TRANSITORIOS
PRIMERO. El presente decreto entra en vigor el día de su publicación.
SEGUNDO. El Comité deberá emitir lineamientos en un plazo no mayor a 30 días.
TERCERO. Las erogaciones deben cubrirse con cargo al presupuesto aprobado.
`;

        const { chunks } = extractLegalStructureFromText(text);

        expect(chunks.map((c) => c.identificador)).toEqual([
            'Preámbulo/Considerandos',
            'Artículo Primero.',
            'Artículo Segundo.',
            'Artículo Tercero.',
            'Transitorio PRIMERO.',
            'Transitorio SEGUNDO.',
            'Transitorio TERCERO.'
        ]);
        expect(chunks[0].contenido).toContain('artículo 25');
        expect(chunks[1].contenido).toContain('estímulos fiscales');
        expect(chunks[2].tipo).toBe('ordinario');
        expect(chunks[4].tipo).toBe('transitorio');
    });

    test('chunks decreto with compound ordinals (Artículo Décimo Primero, Décimo Tercero...)', () => {
        const text = `
Artículo Décimo. Para el establecimiento se crea un Comité Intersecretarial.
Artículo Décimo Primero. Se entenderá por desarrolladores a las personas morales.
Artículo Décimo Segundo. Las entidades federativas podrán crear vehículos.
Artículo Décimo Tercero. El Servicio de Administración Tributaria debe emitir reglas.
TRANSITORIOS
PRIMERO. El presente decreto entra en vigor.
`;

        const { chunks } = extractLegalStructureFromText(text);

        expect(chunks.map((c) => c.identificador)).toEqual([
            'Artículo Décimo.',
            'Artículo Décimo Primero.',
            'Artículo Décimo Segundo.',
            'Artículo Décimo Tercero.',
            'Transitorio PRIMERO.'
        ]);
    });

    test('does not split inline references to ordinal articles (e.g. "el artículo Tercero de este decreto")', () => {
        const text = `
Artículo Primero. Se otorgan estímulos conforme al artículo Tercero de este decreto y al artículo Cuarto.
Artículo Segundo. Para los efectos de los artículos Tercero y Cuarto de este decreto los contribuyentes deben cumplir lo siguiente.
Artículo Tercero. Los contribuyentes podrán efectuar la deducción del 100%.
Artículo Cuarto. Se otorga una deducción adicional del 25%.
`;

        const { chunks } = extractLegalStructureFromText(text);

        // Solo 4 chunks de artículo, sin falsos positivos de referencias inline
        expect(chunks.map((c) => c.identificador)).toEqual([
            'Artículo Primero.',
            'Artículo Segundo.',
            'Artículo Tercero.',
            'Artículo Cuarto.'
        ]);
        expect(chunks[0].contenido).toContain('artículo Tercero de este decreto');
        expect(chunks[1].contenido).toContain('artículos Tercero y Cuarto');
    });

    test('chunks decimal section numbers like 1.1., 1.2., etc.', () => {
        const text = `
Artículo Único. La Comisión emite las Disposiciones para quedar como sigue:
Capítulo I. Disposiciones Generales
1.1. Objetivo. Las presentes disposiciones tienen por objeto...
1.2. Alcance. Las presentes disposiciones son...
2.1. Los SAEE pueden integrarse...
`;

        const { chunks } = extractLegalStructureFromText(text);

        expect(chunks.map((chunk) => chunk.identificador)).toEqual([
            'Artículo Único.',
            '1.1.',
            '1.2.',
            '2.1.'
        ]);
        expect(chunks[1].contenido).toBe('Objetivo. Las presentes disposiciones tienen por objeto...');
    });
});
