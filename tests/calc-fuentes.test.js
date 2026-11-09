import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FUENTES, auditarFuentes } from '../src/lib/calc/fuentes.js';
import { PARA_ENTENDER } from '../src/lib/calc/textos.js';
import { calcular, normalizarEstado } from '../src/lib/calc/motor.js';
import { ATAJOS, PESTANAS, PRODUCTOS_PETROLIFEROS } from '../src/lib/calc/pestanas.js';
import { CUENTAS, calcularCuenta } from '../src/lib/calc/cuentas.js';

describe('sources', () => {
  it('are complete and start pending', () => {
    for (const f of Object.values(FUENTES)) {
      for (const k of ['titulo', 'emisor', 'url', 'fecha', 'revisado']) expect(f[k], `${f.id}.${k}`).toBeTruthy();
      expect(['humano', 'pendiente']).toContain(f.cotejo);
    }
  });
  it('name the fuel list the way people search for it', () => {
    expect(FUENTES['lista-2026'].titulo).toContain('Lista de combustibles');
    // Signed by CONUEE's Director General on SENER letterhead (user's call, 2026-11-09).
    expect(FUENTES['lista-2026'].emisor).toBe('CONUEE (SENER)');
    expect(FUENTES['acuerdo-rene-2015'].emisor).toBe('Semarnat');
  });
  it('are flagged when pending or out of date', () => {
    const pendiente = { id: 'x', fecha: '2026', revisado: '2026-11-09', cotejo: 'pendiente' };
    expect(auditarFuentes(new Date('2026-11-09T12:00:00Z'), [pendiente])[0].problema).toBe('pendiente');
    expect(auditarFuentes(new Date('2028-03-01T12:00:00Z')).every(x => x.problema === 'vencida')).toBe(true);
  });
  // The user approved all sources on 2026-11-09 (docs/calculadora/fuentes-para-aprobar.md).
  it('are all checked by a person, so the strict audit passes', () => {
    expect(Object.values(FUENTES).every(f => f.cotejo === 'humano' && f.revisado === '2026-11-09')).toBe(true);
    expect(auditarFuentes(new Date('2026-11-09T12:00:00Z')).filter(x => x.problema)).toEqual([]);
  });
  // Read in the Diario Oficial on 2026-11-09: Artículo Único, 13.9 % for 2025 and 2026, published 2026-08-17.
  it('cites the CEL agreement from the Diario Oficial', () => {
    expect(FUENTES['acuerdo-cel-2026']).toMatchObject({ url: 'https://sidof.segob.gob.mx/notas/5796405', fecha: '2026-08-17', emisor: 'SENER' });
    expect(FUENTES['acuerdo-cel-2026'].titulo).not.toMatch(/despacho/i);
  });
  // The user checked the 8 values against the scan on 2026-11-09 (page 1, signed 2026-02-12).
  it('keeps the 2026 fuel list as checked by a person', () => {
    expect(FUENTES['lista-2026']).toMatchObject({ cotejo: 'humano', revisado: '2026-11-09', fecha: '2026-02-12' });
    expect(auditarFuentes(new Date('2026-11-09T12:00:00Z')).find(x => x.id === 'lista-2026').problema).toBeNull();
  });
});

describe('provenance', () => {
  const ids = new Set(readdirSync('public/data').filter(f => f.endsWith('_chunks.json')).flatMap(f => {
    const d = JSON.parse(readFileSync(`public/data/${f}`, 'utf8'));
    return (Array.isArray(d) ? d : d.articulos || d.chunks || []).map(a => a.id);
  }));
  const articulos = Object.values(PARA_ENTENDER).flat().flatMap(t => t.articulos);
  const enlazados = articulos.map(a => a.ref);
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  it('links only articles that exist', () => {
    expect(enlazados.length).toBeGreaterThanOrEqual(13);
    for (const ref of enlazados) expect(ids.has(ref), ref).toBe(true);
  });
  // Supabase keys articles by UUID; the chunk ids of public/data do not open anything (#art-LSE-Art-112 gave 400).
  it('opens each article by its Supabase id', () => {
    for (const a of articulos) expect(a.id, a.ref).toMatch(UUID);
    expect(new Set(articulos.map(a => a.id)).size).toBe(new Set(enlazados).size);
    expect(FUENTES.lse.url).toMatch(/^#art-[0-9a-f-]{36}$/);
  });
  it('does not link articles with known defects', () => {
    expect(enlazados).not.toContain('LSH-Art-027');
    expect(enlazados).not.toContain('RLSH-Art-336');
  });
  it('gives every figure that is not exact a source, a date and a year', () => {
    const casos = [...ATAJOS.map(a => a.ruta), ...PESTANAS.map(p => ({ pestana: p.id })),
      ...PRODUCTOS_PETROLIFEROS.map(p => ({ pestana: 'petroliferos', valor: 10, unidad: 't', producto: p.id })), { pestana: 'gas-lp', valor: 1, unidad: 'kg', base: 'fisica' }];
    for (const caso of casos) {
      const r = calcular(normalizarEstado(caso));
      for (const x of [r.principal, ...r.otras]) {
        if (x.clase === 'exacto') continue;
        expect(FUENTES[x.fuente], x.etiqueta).toBeTruthy();
        expect(FUENTES[x.fuente].fecha).toBeTruthy();
        expect(x.anio, x.etiqueta).toBeTruthy();
      }
    }
  });
  it('gives every line of a small calculation that is not exact a source', () => {
    for (const c of Object.values(CUENTAS)) {
      const v = Object.fromEntries(c.campos.map(f => [f.id, f.porDefecto]));
      for (const l of calcularCuenta(c.id, v).lineas) if (l.clase && l.clase !== 'exacto') expect(FUENTES[l.fuente], `${c.id} ${l.texto}`).toBeTruthy();
    }
  });
});
