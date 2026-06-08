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
});
