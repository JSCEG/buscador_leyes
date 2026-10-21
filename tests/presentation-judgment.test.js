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
        const map = [...target.querySelectorAll('.lp-normative-kpis, .lp-normative-flow')].map(node => node.textContent).join(' ');
        expect(map).not.toMatch(/Títulos|Capítulos|Secciones|Nivel superior|ordenamiento/);
        expect(map).toMatch(/19\s*Apartados/);
        expect(map).toMatch(/3\s*Resolutivos/);
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
        expect(all).not.toMatch(/Títulos/);
        expect(all).toContain('Resolutivos');
    });

    it('labels resolutivos as RES. when they fall within the outline limits', async () => {
        // Short ruling: a resolutivo inside the first eight rows (web shows nine, PowerPoint eight).
        const short = [
            { id: 'r1', articulo_label: 'I. COMPETENCIA', tipo_articulo: 'apartado', texto: 'Competencia.' },
            { id: 'r2', articulo_label: 'VII. EFECTOS', tipo_articulo: 'apartado', texto: 'Efectos.' },
            { id: 'r3', articulo_label: 'Resolutivo PRIMERO', tipo_articulo: 'apartado', texto: 'Es procedente.' },
        ];
        const target = document.createElement('div');
        document.body.append(target);
        renderLawPresentationEmbed(target, ruling, short, []);
        const rows = [...target.querySelectorAll('.lp-structure-outline .lp-mini-row')].map(row => `${row.querySelector('span').textContent} ${row.querySelector('strong').textContent}`);
        expect(rows).toEqual(['APART. I. COMPETENCIA', 'APART. VII. EFECTOS', 'RES. Resolutivo PRIMERO']);
        target.remove();
        texts.length = 0;
        await generateLawPresentation(ruling, short, []);
        const exported = texts.join('\n');
        expect(exported).toMatch(/RES\./);
        expect(exported).toMatch(/APART\./);
    });

    it('keeps articles and chapters for laws', async () => {
        texts.length = 0;
        await generateLawPresentation(law, lawArticles, []);
        expect(texts.join('\n')).toMatch(/\bARTÍCULOS\b/);
        expect(texts.join('\n')).toContain('Capítulos');
    });
});
