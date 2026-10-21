import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const texts = vi.hoisted(() => []);
vi.mock('pptxgenjs', () => ({
    default: class {
        constructor() { this.ShapeType = {}; }
        addSlide() {
            return { addText: value => texts.push(Array.isArray(value) ? value.map(part => part.text).join('') : String(value)), addShape() {}, addImage() {}, addTable(rows) { rows.flat().forEach(cell => texts.push(String(cell?.text ?? cell))); }, background: null };
        }
        async writeFile() {}
    },
}));
vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
import { generateLawPresentation, renderLawPresentationEmbed } from '../src/scripts/law-presentation.js';
import { friendlyLabel } from '../src/lib/friendly-text.js';

const data = JSON.parse(readFileSync('revision-acervo/incorporacion-scjn-137-2026-10-21/carga.json'));
const ruling = { ...data.ley, articulos: data.articulos.length };
const apartados = data.articulos.map(a => ({ ...a, articulo_label: friendlyLabel(a.identificador), texto: a.contenido }));
const law = { id: 'lse', tipo: 'ley', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', fecha_publicacion: '2025-03-18' };
const lawArticles = [1, 2, 3].map(n => ({ id: `a${n}`, articulo_label: `Artículo ${n}`, tipo_articulo: 'ordinario', capitulo_nombre: 'Capítulo I', texto: `Texto del artículo ${n}.` }));

describe('presentation of a ruling', () => {
    it('presents apartados and resolutivos, never articles or chapters, on the web', () => {
        const target = document.createElement('div');
        document.body.append(target);
        renderLawPresentationEmbed(target, ruling, apartados, []);
        const shells = [...target.querySelectorAll('.lp-slide')].map(slide => slide.textContent);
        const text = target.textContent;
        expect(text).toContain('APARTADOS CLAVE');
        expect(text).not.toMatch(/ARTÍCULOS CLAVE|Artículos clave/);
        expect(text).not.toMatch(/\bCAP\./);
        expect(text).toMatch(/APART\./);
        expect(shells.length).toBeGreaterThan(0);
        target.remove();
    });

    it('labels the exported PowerPoint counts and outline with the ruling nouns', async () => {
        texts.length = 0;
        await generateLawPresentation(ruling, apartados, []);
        const all = texts.join('\n');
        expect(all).toContain('APARTADOS');
        expect(all).not.toMatch(/\bARTÍCULOS\b/);
        expect(all).not.toMatch(/\bCAP\./);
    });

    it('keeps articles and chapters for laws', async () => {
        texts.length = 0;
        await generateLawPresentation(law, lawArticles, []);
        expect(texts.join('\n')).toMatch(/\bARTÍCULOS\b/);
    });
});
