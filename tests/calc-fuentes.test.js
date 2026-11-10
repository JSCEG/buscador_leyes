import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FUENTES, FUENTES_SECCION, auditarFuentes, fechaFuente } from '../src/lib/calc/fuentes.js';
import { PARA_ENTENDER } from '../src/lib/calc/textos.js';
import { calcular, normalizarEstado } from '../src/lib/calc/motor.js';
import { ATAJOS, MAGNITUDES, PESTANAS, PRODUCTOS_PETROLIFEROS, unidadesValidas } from '../src/lib/calc/pestanas.js';
import { CUENTAS, calcularCuenta, cuentasDe } from '../src/lib/calc/cuentas.js';

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
  // Web pages without a publication date carry the day they were consulted, and say so.
  it('says when a date is the day a web page was consulted', () => {
    const web = ['global-solar-atlas', 'gpsa', 'vcf', 'nist-webbook', 'nws-altitud', 'eia-gas', 'pemex-crudos'];
    for (const x of Object.values(FUENTES)) expect(Boolean(x.consultado), x.id).toBe(web.includes(x.id));
    expect(fechaFuente(FUENTES.gpsa)).toBe('consultado el 2026-11-08');
    expect(fechaFuente(FUENTES['cne-precios-lp'])).toBe('2026-11-08');
    expect(fechaFuente(FUENTES['lista-2026'])).toBe('2026-02-12');
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

// Every source a tab cites: its figures with any unit, product, base or adjustment, its small
// calculations and its «Para entender» cards.
function citadas(pestana) {
  const ids = new Set();
  const tab = PESTANAS.find(p => p.id === pestana);
  const ajustes = [{}, { t: 30 }, { d: 0.82 }, { m: 'propano' }, { c: 'base' }, { pc: 40 }, { k: 'inferior' }, { pm: 'man', a: 2240 }, { dt: true }];
  for (const producto of tab.productos.length ? tab.productos : [undefined]) {
    for (const magnitud of pestana === 'otras' ? MAGNITUDES : [undefined]) {
      for (const base of ['oficial', 'fisica']) for (const a of ajustes) for (const unidad of unidadesValidas({ pestana, magnitud, producto })) {
        const r = calcular(normalizarEstado({ pestana, producto, magnitud, base, unidad, valor: 10, ajustes: a, horas: 8 }));
        for (const f of r.ok ? r.fuentes : []) ids.add(f.id);
      }
    }
  }
  const cuentas = [...cuentasDe(pestana), ...(PARA_ENTENDER[pestana] ?? []).filter(t => t.cuenta).map(t => CUENTAS[t.cuenta])];
  const prueba = f => f.porDefecto ?? (f.tipo === 'fecha' ? '2026-07-15' : f.tipo === 'hora' ? '20:00' : 1);
  for (const c of cuentas) {
    const r = calcularCuenta(c.id, Object.fromEntries(c.campos.map(f => [f.id, prueba(f)])));
    for (const l of r.lineas ?? []) if (l.fuente) ids.add(l.fuente);
  }
  for (const t of PARA_ENTENDER[pestana] ?? []) if (t.fuente) ids.add(t.fuente);
  return ids;
}

describe('sources of each section', () => {
  it('list every source the tab cites, once, with what it backs there', () => {
    for (const p of PESTANAS) {
      const lista = FUENTES_SECCION[p.id];
      const ids = lista.map(x => x.id);
      expect(new Set(ids).size, p.id).toBe(ids.length);
      for (const x of lista) {
        expect(FUENTES[x.id], `${p.id} ${x.id}`).toBeTruthy();
        expect(x.respalda, `${p.id} ${x.id}`).toMatch(/^[A-ZÁÉÍÓÚ].*[^.]$/);
      }
      for (const id of citadas(p.id)) expect(ids, `${p.id} cita ${id}`).toContain(id);
    }
  });
  it('give every source of the calculator a section', () => {
    const listadas = new Set(Object.values(FUENTES_SECCION).flat().map(x => x.id));
    for (const id of Object.keys(FUENTES)) expect(listadas.has(id), id).toBe(true);
  });
});
