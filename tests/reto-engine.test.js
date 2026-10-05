import { describe, it, expect } from 'vitest';
import {
    seededRandom, retoNumber, dayKey, termQuestion, passageQuestion, choosePassage, maskPassage, issuerQuestion,
    orderQuestion, buildReto, isCorrect, resultLine, streakFrom, planPassages,
} from '../src/lib/reto-engine.js';

const laws = [
    { id: 'lse', siglas: 'LSE', titulo: 'Ley del Sector Eléctrico', tipo: 'ley', fecha_publicacion: '2025-03-18' },
    { id: 'lsh', siglas: 'LSH', titulo: 'Ley del Sector Hidrocarburos', tipo: 'ley', fecha_publicacion: '2025-03-18' },
    { id: 'lgeo', siglas: 'LGeo', titulo: 'Ley de Geotermia', tipo: 'ley', fecha_publicacion: '2025-03-18' },
    { id: 'lbio', siglas: 'LBio', titulo: 'Ley de Biocombustibles', tipo: 'ley', fecha_publicacion: '2025-03-18' },
    { id: 'rlse', siglas: 'RLSE', titulo: 'Reglamento de la Ley del Sector Eléctrico', tipo: 'reglamento', fecha_publicacion: '2025-10-03' },
    { id: 'pnd', siglas: 'PND', titulo: 'Plan Nacional de Desarrollo 2025-2030', tipo: 'plan', fecha_publicacion: '2025-04-15' },
    { id: 'dacg', siglas: 'DACG-X', titulo: 'Disposiciones administrativas de carácter general para permisos', tipo: 'dacg', fecha_publicacion: '2026-01-20' },
    { id: 'acu', siglas: 'ACU-1', titulo: 'Acuerdo de la Comisión Nacional de Energía por el que se emite la metodología', tipo: 'acuerdo', fecha_publicacion: '2026-09-30' },
];
const glossary = ['Central Eléctrica', 'CENACE', 'Comisión', 'Suministro Eléctrico', 'Usuario Final'].map((term, i) => ({
    term, definition: `Definición oficial número ${i} con suficiente texto para ser una buena pregunta del reto`, source: 'LSE', lawId: 'lse', articleId: `a${i}`,
}));
const rows = [
    { id: 'x1', identificador: 'Artículo 1', contenido: 'La presente Ley del Sector Eléctrico es reglamentaria de los artículos 25, 27 y 28 de la Constitución, de orden público e interés social, y tiene por objeto regular la planeación y el control del Sistema Eléctrico Nacional.' },
    { id: 'x2', identificador: 'Índice', contenido: 'Índice general del instrumento con todos sus títulos y capítulos, que no debe usarse como pasaje del reto porque no dice nada útil.' },
];

describe('seed and dates', () => {
    it('gives the same sequence for the same seed', () => {
        const a = seededRandom('2026-10-04'), b = seededRandom('2026-10-04'), c = seededRandom('2026-10-05');
        const first = [a(), a(), a()];
        expect([b(), b(), b()]).toEqual(first);
        expect([c(), c(), c()]).not.toEqual(first);
    });
    it('numbers the reto from the launch day', () => {
        expect(retoNumber('2026-10-04')).toBe(1);
        expect(retoNumber('2026-11-03')).toBe(31);
        expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
});

describe('questions', () => {
    it('asks for a term with four options and the right answer among them', () => {
        const q = termQuestion(seededRandom('t'), glossary);
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(glossary.find(e => e.definition === q.body).term).toBe(q.options[q.answer]);
    });
    it('picks a real article as passage and hides the instrument name', () => {
        const passage = choosePassage(seededRandom('p'), rows);
        expect(passage.id).toBe('x1');
        expect(maskPassage(passage.text, laws[0])).not.toMatch(/Sector Eléctrico/);
        const q = passageQuestion(seededRandom('p'), laws[0], passage, laws);
        expect(q.options[q.answer]).toBe('Ley del Sector Eléctrico');
        expect(new Set(q.options).size).toBe(4);
        expect(q.link).toEqual({ lawId: 'lse', articleId: 'x1' });
    });
    it('leaves out titles that name their issuer', () => {
        for (let i = 0; i < 20; i++) {
            const q = issuerQuestion(seededRandom(`i${i}`), laws);
            expect(q.body).not.toMatch(/Comisión Nacional de Energía/);
            expect(q.options).toHaveLength(4);
        }
    });
    it('orders four instruments published far enough apart', () => {
        const q = orderQuestion(seededRandom('o'), laws);
        expect(q.options).toHaveLength(4);
        const sortedDates = q.answerOrder.map(i => q.dates[i]);
        expect([...sortedDates].sort()).toEqual(sortedDates);
        expect(isCorrect(q, q.answerOrder)).toBe(true);
        expect(isCorrect(q, [...q.answerOrder].reverse())).toBe(false);
    });
});

describe('daily reto', () => {
    it('builds the same five questions for everyone on a day', () => {
        const plan = planPassages(seededRandom('plan:2026-10-04'), laws, '2026-10-04');
        expect(plan[0].id).toBe('acu');
        const data = { laws, glossary, passages: plan.map(law => ({ law, rows })), seed: '2026-10-04' };
        const a = buildReto(data), b = buildReto(data);
        expect(a.length).toBeGreaterThanOrEqual(4);
        expect(a.map(q => q.body)).toEqual(b.map(q => q.body));
    });
    it('shares and counts streaks', () => {
        expect(resultLine([true, false, true])).toBe('🟩🟥🟩');
        expect(streakFrom(['2026-10-02', '2026-10-03', '2026-10-04'], '2026-10-04')).toBe(3);
        expect(streakFrom(['2026-10-01', '2026-10-03', '2026-10-04'], '2026-10-04')).toBe(2);
        expect(streakFrom([], '2026-10-04')).toBe(0);
    });
});
