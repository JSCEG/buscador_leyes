import { describe, expect, it } from 'vitest';
import { friendlyLabel, friendlyText } from '../src/lib/friendly-text.js';
import { relatedDocumentLabel } from '../src/lib/related-document.js';

describe('friendly wording for stored notes', () => {
    it('renames note labels and headings without touching other text', () => {
        expect(friendlyLabel('Nota editorial · documentos relacionados')).toBe('Guía · documentos relacionados');
        expect(friendlyLabel('Artículo 5')).toBe('Artículo 5');
        const text = '### Nota editorial · Planeación del sector\n\nSe conserva la publicación del DOF. Esta nota es información editorial del buscador y no forma parte del texto oficial.';
        expect(friendlyText(text)).toBe('### Guía · Planeación del sector\n\nSe conserva la publicación del DOF. Esta guía la agregamos para ayudarte a ubicar el documento; no es parte del texto oficial.');
        expect(friendlyText('<h3>Nota editorial · alcance</h3><p>Esta nota pertenece al buscador, no al texto oficial.</p>')).toBe('<h3>Guía · alcance</h3><p>Esta guía la agregamos nosotros; no es parte del texto oficial.</p>');
    });

    it('keeps guides inside their instrument whichever wording the data uses', () => {
        for (const label of ['Nota editorial · versiones relacionadas', 'Guía · versiones relacionadas']) {
            expect(relatedDocumentLabel({ tipo_articulo: 'complementario', articulo_label: label })).toBeNull();
        }
    });
});
