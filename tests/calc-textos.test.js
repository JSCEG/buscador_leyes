import { describe, expect, it } from 'vitest';
import { NOTA_PIE, PARA_ENTENDER, SUBTITULO, TITULO } from '../src/lib/calc/textos.js';
import { CUENTAS } from '../src/lib/calc/cuentas.js';
import { ATAJOS } from '../src/lib/calc/pestanas.js';
import { LEYENDA_MERCADO } from '../src/lib/calc/mercado.js';

const todas = Object.values(PARA_ENTENDER).flat();
const textoDe = t => [t.titulo, ...t.parrafos].join(' ');
const tarjeta = id => todas.find(t => t.id === id);
const publicos = [TITULO, SUBTITULO, NOTA_PIE, ...todas.map(textoDe),
  ...Object.values(CUENTAS).flatMap(c => [c.titulo, c.nota ?? '', ...c.campos.map(f => f.etiqueta)]), ...ATAJOS.map(a => a.titulo)].join('\n');

describe('public copy', () => {
  it('has the fixed texts of the spec', () => {
    expect(TITULO).toBe('Calculadora de energía');
    expect(SUBTITULO).toBe('Escribe un número y te decimos cuánto es y qué significa.');
    expect(NOTA_PIE).toBe('Cálculo orientativo. No sirve para medir ni facturar.');
  });
  it('has the cards of the spec in each tab', () => {
    expect(PARA_ENTENDER.electricidad.map(t => t.id)).toEqual(['potencia-energia', 'hora-pico', 'servicios-conexos', 'precio-potencia', 'pml', 'cel', 'permiso']);
    expect(PARA_ENTENDER.petroliferos.map(t => t.id)).toEqual(['barril', 'm-y-mm', 'bep']);
    expect(PARA_ENTENDER['gas-natural'].map(t => t.id)).toEqual(['condicion', 'poder-calorifico', 'mbtu']);
    expect(PARA_ENTENDER['gas-lp'].map(t => t.id)).toEqual(['convencion-054', 'litros-agua', 'vapor']);
    expect(PARA_ENTENDER.otras.map(t => t.id)).toEqual(['kw-h', 'billon', 'kg-cm2', 'm-mm-mega']);
  });
  it.each([/acervo/i, /instrumento/i, /\bDOF\b/, /\berror\b/i, /\bFP\b/])('never says %s', r => expect(publicos).not.toMatch(r));
  // Only the card that explains it may say «billón».
  it('never says billón or trillón', () => expect(publicos.replace(textoDe(tarjeta('billon')), '')).not.toMatch(/bill[oó]n|trill[oó]n/i));
  it('never leaves M alone', () => {
    const sinExplicar = todas.filter(t => !['m-y-mm', 'm-mm-mega'].includes(t.id)).map(textoDe).join(' ');
    expect(sinExplicar).not.toMatch(/(^|\s)M(\s|$)/);
  });
  it.each([['SAEE', 'Sistema de Almacenamiento de Energía Eléctrica'], ['RNT', 'Red Nacional de Transmisión'], ['RGD', 'Redes Generales de Distribución'], ['CEL', 'Certificados de Energías Limpias'], ['PML', 'Precio Marginal Local']])('spells out %s in every card that uses it', (sigla, largo) => {
    const piezas = [...todas.map(x => [x.id, textoDe(x)]), ...Object.values(CUENTAS).map(c => [c.id, `${c.titulo} ${c.nota ?? ''}`])];
    for (const [id, texto] of piezas) if (texto.includes(sigla)) expect(texto, id).toContain(largo);
  });
  it('marks the electricity market rules as pending update', () => {
    for (const id of ['hora-pico', 'servicios-conexos', 'precio-potencia', 'pml', 'cel']) expect(textoDe(tarjeta(id)), id).toContain(LEYENDA_MERCADO);
  });
  it('says the permit card is guidance', () => expect(textoDe(tarjeta('permiso'))).toMatch(/orientación.*no.*asesoría legal/is));
  it('points only to calculations that exist', () => { for (const t of todas) if (t.cuenta) expect(CUENTAS[t.cuenta], t.id).toBeTruthy(); });
});
