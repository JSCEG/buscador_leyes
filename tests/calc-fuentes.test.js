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
    expect(FUENTES['lista-2026'].emisor).toBe('SENER');
    expect(FUENTES['acuerdo-rene-2015'].emisor).toBe('Semarnat');
  });
  it('are flagged when pending or out of date', () => {
    const hoy = new Date('2026-11-09T12:00:00Z');
    expect(auditarFuentes(hoy).find(x => x.id === 'lista-2026').problema).toBe('pendiente');
    expect(auditarFuentes(new Date('2028-03-01T12:00:00Z')).every(x => x.problema)).toBe(true);
  });
});

describe('provenance', () => {
  const ids = new Set(readdirSync('public/data').filter(f => f.endsWith('_chunks.json')).flatMap(f => {
    const d = JSON.parse(readFileSync(`public/data/${f}`, 'utf8'));
    return (Array.isArray(d) ? d : d.articulos || d.chunks || []).map(a => a.id);
  }));
  const enlazados = Object.values(PARA_ENTENDER).flat().flatMap(t => t.articulos.map(a => a.id));

  it('links only articles that exist', () => {
    expect(enlazados.length).toBeGreaterThanOrEqual(13);
    for (const id of enlazados) expect(ids.has(id), id).toBe(true);
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
