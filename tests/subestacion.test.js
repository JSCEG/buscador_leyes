import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { APARTARRAYOS, BLOQUE, CABLE, CAMBIADOR, CAPACITOR, DEF, FP, INTERRUPTOR, LIMITE, LINEAS, PARTES, PASOS, RECIERRE, RELE, REPARTO, SCC, SUB, TC, TIERRA, TRAFO, amperes, bloqueo, calcular, dia, envejece, estadoPlanta, fallaEn, maniobra, maxManiobra, mvaDe, pasoPlanta, pose, puntasSueltas, revisar, secuencia, tRele, tapIdeal, tension } from '../conceptos-3d/subestacion/modelo.js';
import { FUENTES } from '../conceptos-3d/subestacion/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';
// El cambiador, solo, hasta quedarse quieto.
const asentar = (P, dt = 0.05, segundos = 200) => {
    let s = estadoPlanta();
    s.tap = 0;
    const m = { modo: 'voltaje', P, km: DEF.km, cap: true, auto: true };
    for (let t = 0; t < segundos; t += dt) s = pasoPlanta(s, m, dt);
    return s;
};

describe('Subestación eléctrica', () => {
    it('sus cifras salen del modelo y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('del lado de 13.8 kV pasa 8.3 veces más corriente', () => {
        expect(amperes(20, SUB.alta) / amperes(20, SUB.media)).toBeCloseTo(SUB.media / SUB.alta, 9);
        expect(Math.round(amperes(20, SUB.alta))).toBe(100);
        expect(Math.round(amperes(20, SUB.media))).toBe(837);
        expect(Math.round((SUB.alta / SUB.media) * 10) / 10).toBe(8.3);
        // los capacitores le quitan corriente al transformador
        expect(mvaDe(15, true)).toBeLessThan(mvaDe(15, false));
    });

    it('el transformador se calienta con la carga, y sin ventiladores se gasta más', () => {
        expect(envejece(LIMITE.referencia)).toBe(1);
        expect(envejece(LIMITE.referencia + 6)).toBeCloseTo(2, 9);
        expect(envejece(110)).toBeCloseTo(4, 9);
        const con = dia({ pico: 15, Tmax: 30, vent: true });
        const sin = dia({ pico: 15, Tmax: 30, vent: false });
        expect(Math.round(con.max.caliente)).toBe(89);
        expect(Math.round(sin.max.caliente)).toBe(118);
        expect(Math.round(con.vida)).toBe(3);
        expect(Math.round(sin.vida)).toBe(47);
        expect(Math.round(sin.vida / con.vida)).toBe(16);
        expect(dia({ pico: 15, Tmax: 40, vent: false }).max.caliente).toBeGreaterThan(sin.max.caliente);
        expect(dia({ pico: 20, Tmax: 30, vent: true }).max.caliente).toBeGreaterThan(con.max.caliente);
        expect(TRAFO.etapas).toEqual([12, 16, 20]);
    });

    it('el cambiador corrige el voltaje, hasta donde le alcanza', () => {
        const o = { P: 15, km: DEF.km, cap: true };
        expect(Math.round(tension({ ...o, tap: 0 }).pf * 100)).toBe(89);
        const s15 = asentar(15);
        expect(s15.tap).toBe(10);
        expect(Math.round(tension({ ...o, tap: s15.tap }).pf * 100)).toBe(96);
        const s22 = asentar(22);
        expect(Math.round(tension({ ...o, P: 22, tap: s22.tap }).pf * 100)).toBe(94);
        expect(Math.abs(tension({ ...o, tap: tapIdeal(o) }).pb - CAMBIADOR.consigna)).toBeLessThan(CAMBIADOR.paso);
        expect(CAMBIADOR.pasos * 2 + 1).toBe(33);
        expect(CAMBIADOR.pasos * CAMBIADOR.paso).toBeCloseTo(0.1, 9);
        // un circuito más largo pierde más
        expect(tension({ ...o, km: 20 }).pf).toBeLessThan(tension(o).pf);
        // el factor de potencia, con y sin capacitores
        expect(Math.round(tension({ ...o, cap: false }).fp * 100) / 100).toBe(0.9);
        expect(Math.round(tension({ ...o, tap: tapIdeal(o) }).fp * 100) / 100).toBe(0.93);
        expect(FP).toBe(0.9);
    });

    it('la caída del ejemplo de la ficha es la del modelo', () => {
        const s = asentar(15);
        const v = tension({ P: 15, km: 10, cap: true, tap: s.tap });
        const P1 = 15 * REPARTO[0];
        expect(P1).toBeCloseTo(4.8, 9);
        expect(Math.round(P1 * Math.tan(Math.acos(FP)) * 10) / 10).toBe(2.3);
        expect(Math.round(CABLE.R * 10 * 100) / 100).toBe(2.05);
        expect(Math.round(CABLE.X * 10 * 100) / 100).toBe(3.77);
        expect(Math.round(v.Vb * 10) / 10).toBe(13.9);
        expect(Math.round(v.caida * 100) / 100).toBe(0.67);
        expect(Math.round((v.caida / SUB.media) * 100)).toBe(5);
    });

    it('la falla, el relevador y el recierre', () => {
        expect(Math.round(SCC)).toBe(2000);
        expect(Math.round(fallaEn(0) * 10) / 10).toBe(5.2);
        expect(Math.round(fallaEn(4) * 10) / 10).toBe(2.5);
        expect(Math.round(fallaEn(4) * 100) * 10).toBe(2520);
        expect(Math.round(tRele(fallaEn(4) * 1000) * 100) / 100).toBe(0.48);
        expect(RELE).toEqual({ k: 13.5, a: 1, arranque: 480, tms: 0.15 });
        // entre más lejos, menos corriente y más espera
        expect(fallaEn(20)).toBeLessThan(fallaEn(4));
        expect(tRele(fallaEn(20) * 1000)).toBeGreaterThan(tRele(fallaEn(4) * 1000));
        expect(tRele(RELE.arranque)).toBe(Infinity);
        const pasa = secuencia({ d: 4, tipo: 'pasajera' });
        expect(pasa.abre).toBeGreaterThan(0.5);
        expect(pasa.abre).toBeLessThan(0.6);
        expect(pasa.sinLuz).toBe(RECIERRE.esperas[0]);
        expect(pasa.tramos.at(-1).estado).toBe('normal');
        const sigue = secuencia({ d: 4, tipo: 'permanente' });
        expect(sigue.tramos.filter(t => t.estado === 'falla')).toHaveLength(RECIERRE.esperas.length + 1);
        expect(sigue.tramos.at(-1).estado).toBe('bloqueado');
        expect(INTERRUPTOR.alta.ms).toBe(50);
    });

    it('el mantenimiento: el interruptor 1 lleva a los dos, si cabe', () => {
        expect(Math.round(maxManiobra() * 10) / 10).toBe(19.4);
        expect(maniobra({ P: 15, paso: 3 }).Ibr1).toBeCloseTo(maniobra({ P: 15 }).I1 + maniobra({ P: 15 }).I2, 9);
        expect(maniobra({ P: 15, paso: 3 }).Ibr2).toBe(0);
        expect(maniobra({ P: 15, paso: 2 }).Ibr2).toBeGreaterThan(0);
        expect(bloqueo(2, 3, 15)).toBeNull();
        expect(bloqueo(2, 3, 22)).toContain(`${TC} A`);
        expect(PASOS).toHaveLength(6);
        expect(PASOS.at(-1).boton).toBeNull();
    });

    it('las cifras de Coatepec son las de la tesis', () => {
        expect(SUB).toMatchObject({ nombre: 'Coatepec', alta: 115, media: 13.8, lineas: 2, circuitos: 4 });
        expect(CAPACITOR.unidad * CAPACITOR.unidades).toBeCloseTo(CAPACITOR.mvar, 9);
        expect(TIERRA.metros).toBe(1051);
        expect(TIERRA.ohm).toBe(0.4886);
        expect(Math.round((APARTARRAYOS.aguantaAqui / APARTARRAYOS.frente - 1) * 100)).toBe(71);
        expect(TC).toBe(600);
    });

    it('el tiempo no depende de los cuadros', () => {
        expect(asentar(22, 0.25).tap).toBe(asentar(22, 0.05).tap);
        const m = { modo: 'falla', falla: true, d: 4, tipo: 'pasajera' };
        let lento = estadoPlanta();
        for (let i = 0; i < 16; i++) lento = pasoPlanta(lento, m, 0.25);
        let rapido = estadoPlanta();
        for (let i = 0; i < 80; i++) rapido = pasoPlanta(rapido, m, 0.05);
        expect(lento.t).toBeCloseTo(rapido.t, 6);
        // el primer paso solo arranca la falla
        expect(Math.abs(lento.ev - rapido.ev)).toBeLessThanOrEqual(0.25);
        const mm = { modo: 'maniobra', paso: 3 };
        let a = estadoPlanta();
        for (let i = 0; i < 40; i++) a = pasoPlanta(a, mm, 0.25);
        let b = estadoPlanta();
        for (let i = 0; i < 200; i++) b = pasoPlanta(b, mm, 0.05);
        expect(a.anim).toBeCloseTo(3, 6);
        expect(b.anim).toBeCloseTo(3, 6);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'carga', vent: false }).etapa).toBe(0);
        expect(pose({ modo: 'voltaje', cap: false }).int.cap).toBe(0);
        expect(pose({ modo: 'voltaje', cap: true }).int.cap).toBe(1);
        // la falla: chispa mientras dura, el interruptor abre, y la luz vuelve
        const S = secuencia({ d: 4, tipo: 'pasajera' });
        const en = t => pose({ modo: 'falla', d: 4, tipo: 'pasajera', planta: { ...estadoPlanta(), ev: t } });
        expect(en(0.1).chispa).toBe(1);
        expect(en(S.abre + 0.5).int.a1).toBe(0);
        expect(en(S.abre + 0.5).luz1).toBe(0);
        expect(en(S.fin + 1).luz1).toBe(1);
        expect(en(S.fin + 1).rama).toBe(1);
        // el mantenimiento, paso a paso
        const p = anim => pose({ modo: 'maniobra', planta: { ...estadoPlanta(), paso: Math.ceil(anim), anim } });
        expect(p(3).int.a2).toBe(0);
        expect(p(5).tierra).toBe(1);
        expect(p(5).flujos.a2).toBe(0);
        expect(p(5).flujos.paso).toBeGreaterThan(0);
        expect(calcular({ modo: 'maniobra', P: 15 }).maxMW).toBeCloseTo(maxManiobra(), 9);
    });

    it('sus puntos clave caben en el bloque', () => {
        expect(PARTES).toHaveLength(14);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[0]).toBeGreaterThanOrEqual(BLOQUE.x[0]);
            expect(p.ancla[0]).toBeLessThanOrEqual(BLOQUE.x[1]);
            expect(p.ancla[2]).toBeGreaterThanOrEqual(BLOQUE.z[0]);
            expect(p.ancla[2]).toBeLessThanOrEqual(BLOQUE.z[1]);
        }
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['subestacion', 'subestacion-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.subestacion.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.subestacion.fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'RLSE']) expect(acervos).toContain(siglas);
        expect(acervos).not.toContain('BME');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.subestacion;
        expect(c.figura).toBe('subestacion');
        expect(c.nivel).toBe(2);
        expect(c.antes).toEqual(['transformador']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/subestacion/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.subestacion;
        const a3 = articulo(LSE, 3);
        expect(a3).toContain('XIX. Distribuidora: Empresa Pública del Estado que presta el Servicio Público de Distribución de Energía Eléctrica');
        expect(a3).toContain('XX. Empresa Pública del Estado: Comisión Federal de Electricidad');
        expect(a3).toContain('XL. Red Eléctrica: Sistema integrado por líneas, subestaciones y equipos de transformación, compensación');
        expect(a3).toContain('XLI. Red Nacional de Transmisión: Sistema integrado por el conjunto de las Redes Eléctricas que se utilizan para transportar energía eléctrica a las Redes Generales de Distribución y a grandes usuarios');
        expect(a3).toContain('XLII. Redes Generales de Distribución: Redes Eléctricas que se utilizan para distribuir energía eléctrica al público en general');
        expect(a3).toContain('LXIII. Transportista: Empresa Pública del Estado que presta el Servicio Público de Transmisión de Energía Eléctrica');
        expect(articulo(LSE, 44)).toContain('operan sus redes conforme a las instrucciones del CENACE');
        expect(articulo(LSE, 44)).toContain('Para el mantenimiento de la Red Nacional de Transmisión');
        expect(articulo(LSE, 46)).toContain('las demás disposiciones que al efecto emite la CNE');
        expect(articulo(LSE, 57)).toContain('es un área estratégica exclusiva del Estado');
        expect(articulo(LSE, 57)).toContain('Están sujetos a servidumbre legal los predios necesarios');
        expect(articulo(RLSE, 2)).toContain('II. Alta Tensión: Los niveles de tensión de la Red Eléctrica mayores a 35 kilovolt');
        expect(articulo(RLSE, 2)).toContain('V. Baja Tensión: Los niveles de tensión de la Red Eléctrica iguales o menores a un kilovolt');
        expect(articulo(RLSE, 93)).toContain('I. Tensión');
        expect(articulo(RLSE, 93)).toContain('III. Interrupciones del Suministro Eléctrico');
        expect(articulo(RLSE, 93)).toContain('la CNE debe definir el valor aceptable de dichos parámetros');
        expect(articulo(RLSE, 149)).toContain('que excedan las tolerancias permisibles en el nivel de tensión');
        expect(articulo(RLSE, 149)).toContain('está obligada a reparar dichas instalaciones, equipos o aparatos, o a indemnizarla');
        // lo que no está en el acervo se avisa, y va en las fuentes con su liga
        const cr = c.ley.ficha.articulos.find(x => x.siglas === 'Código de Red');
        expect(cr.nota).toContain('No está en el acervo');
        expect(c.fuentes.some(f => f.titulo.includes('Código de Red') && f.url)).toBe(true);
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE']);
        // la RNT y las RGD se escriben completas la primera vez
        expect(c.ley.ficha.elQue).toContain('Red Nacional de Transmisión (RNT)');
        expect(c.ley.ficha.elQue).toContain('Redes Generales de Distribución (RGD)');
        expect(JSON.stringify(c)).not.toContain('SAEE');
    });
});
