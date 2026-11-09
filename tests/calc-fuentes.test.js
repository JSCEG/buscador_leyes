import { describe, expect, it } from 'vitest';
import { FUENTES, auditarFuentes } from '../src/lib/calc/fuentes.js';

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
