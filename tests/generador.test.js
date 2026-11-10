import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { BLOQUE, CODIGO, E_PLENA, EJ, GEN, H2, IF_AIRE, LINEAS, PARTES, SINCRO, VHZ, carga, estadoPlanta, limitesQ, pasoPlanta, perdidas, pose, puntasSueltas, revisar, sincro, sincrona, vacio } from '../conceptos-3d/generador/modelo.js';
import { FUENTES } from '../conceptos-3d/generador/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const LCNE = 'LCNE_chunks.json';

describe('El generador', () => {
    it('sus cifras salen del modelo y coinciden con la placa y las reglas', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo y cable toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('la placa es la de la tesis de la UNAM', () => {
        expect(GEN).toMatchObject({ S: 340.16, V: 20, I: 9650, rpm: 3600, f: 60, polos: 2, campo: 3060, campoMax: 3519, excitacionV: 330, h2: 3.16, agua: 600, fabricante: 'Tecnomasio Italiano', modelo: 'T510162', excitacion: 'Unitrol D', aislamiento: 'F' });
        expect(sincrona()).toBe(3600);
        expect(Math.round(sincrona(60, 56) * 10) / 10).toBe(128.6);
        // el campo de vacío sale de la placa: 3,060 A a plena carga con el factor de potencia de ejemplo
        expect(Math.round(E_PLENA * 100) / 100).toBe(2.48);
        expect(Math.round(IF_AIRE)).toBe(1235);
    });

    it('las reglas son las de la norma CFE G0100-07 y el Código de Red', () => {
        expect(SINCRO.norma).toEqual({ dV: 5, df: 0.067, dA: 10 });
        expect(SINCRO.verificador).toEqual({ dV: 4, df: 0.06, dA: 7 });
        expect(SINCRO.automatico).toEqual({ dV: 3, df: 0.04, dA: 5 });
        expect(VHZ).toEqual({ alarma: 105, pasos: [{ pct: 106, s: 100 }, { pct: 108, s: 30 }, { pct: 116, s: 0.5 }] });
        expect(CODIGO).toMatchObject({ fp: 0.95, qp: 0.33, v: [0.95, 1.05], tipoD: 30 });
        expect(H2).toMatchObject({ calor: 14, conduce: 7, ventilacion: [10, 12], explota: [5, 75] });
    });

    it('cómo nace el voltaje: las cifras de la ficha', () => {
        const v = vacio({});
        expect(v.f).toBe(60);
        expect(Math.round(v.kV * 10) / 10).toBe(20);
        expect(Math.round(vacio({ rpm: 1800 }).f)).toBe(30);
        expect(Math.round(vacio({ rpm: 1800 }).vhz)).toBe(100);
        // sin carga y con todo el campo, 208 %: pasa de los 116 % que disparan en medio segundo
        const max = vacio({ campo: GEN.campoMax });
        expect(Math.round(max.vhz)).toBe(208);
        expect(max.vhz).toBeGreaterThan(VHZ.pasos[2].pct);
        // ω a 60 Hz
        expect(Math.round(v.omega)).toBe(377);
    });

    it('sincronizar: el verificador, la aguja y el golpe de cerrar fuera de fase', () => {
        expect(sincro({ rpmS: 3603, vS: 102, angulo: 3 }).puede).toBe(true);
        expect(sincro({ rpmS: 3597, vS: 102, angulo: 3 }).puede).toBe(false);
        expect(sincro({ rpmS: 3603, vS: 105, angulo: 3 }).puede).toBe(false);
        expect(sincro({ rpmS: 3603, vS: 102, angulo: 8 }).puede).toBe(false);
        expect(Math.round(sincro({ rpmS: 3603, vS: 100, angulo: 120 }).golpe)).toBe(6);
        expect(sincro({ rpmS: 3603, vS: 101, angulo: 2 }).golpe).toBeLessThan(0.2);
        expect(Math.round(sincro({ rpmS: 3603 }).vuelta)).toBe(20);
        // al cerrar, la aguja regresa a cero por el camino corto y guarda el golpe de ese momento
        let s = { ...estadoPlanta(), angulo: 357 };
        s = pasoPlanta(s, { modo: 'sincronizar', cerrar: true, rpmS: 3603, vS: 101 }, 0.016);
        expect(s.cerrado).toBe(true);
        expect(Math.abs(s.angulo)).toBeLessThan(4);
        expect(s.golpeCierre).toBeLessThan(0.3);
        for (let i = 0; i < 100; i++) s = pasoPlanta(s, { modo: 'sincronizar', cerrar: true, rpmS: 3603, vS: 101 }, 0.05);
        expect(Math.abs(s.angulo)).toBeLessThan(0.1);
        // la aguja avanza con la diferencia de frecuencia, sin importar los cuadros
        const corre = (dt, n) => { let x = estadoPlanta(); for (let i = 0; i < n; i++) x = pasoPlanta(x, { modo: 'sincronizar', cerrar: false, rpmS: 3603, vS: 101 }, dt); return x.angulo; };
        expect(corre(0.05, 100)).toBeCloseTo(corre(0.01, 500), 6);
    });

    it('cargar: plena carga, el ángulo del rotor, la reactiva y la curva de capabilidad', () => {
        const n = carga({ P: GEN.S * EJ.fp, campoC: GEN.campo });
        expect(Math.round(n.i * 100)).toBe(100);
        expect(Math.round(n.delta)).toBe(38);
        expect(Math.round(n.P)).toBe(289);
        // con menos campo absorbe reactiva sin perder el paso; con muy poco, lo pierde
        const poco = carga({ P: 250, campoC: 1750 });
        expect(poco.adelanto).toBe(true);
        expect(poco.paso).toBe(true);
        expect(carga({ P: 300, campoC: 900 }).paso).toBe(false);
        // a la potencia de la turbina alcanza el tercio que pide el Código, dando y absorbiendo
        const q = (CODIGO.qp * EJ.turbina) / GEN.S;
        const l = limitesQ(EJ.turbina / GEN.S);
        expect(l.arriba).toBeGreaterThan(q);
        expect(l.abajo).toBeLessThan(-q);
    });

    it('lo que se calienta: con hidrógeno, cerca de 99 %', () => {
        const h = perdidas({ cargaE: 1 });
        const a = perdidas({ cargaE: 1, medio: 'aire' });
        expect(Math.round(h.campo * 100) / 100).toBe(1.01);
        expect(Math.round(h.eficiencia * 10000) / 100).toBe(98.95);
        expect(Math.round(a.eficiencia * 1000) / 10).toBe(98.2);
        expect(a.ventilacion / h.ventilacion).toBe(11);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'voltaje', rpm: 0 }).rpm).toBe(0);
        expect(pose({ modo: 'voltaje', campo: GEN.campoMax }).activo.alarma).toBe(1);
        // el interruptor: abierto sin carga, cerrado con carga
        expect(pose({ modo: 'voltaje' }).cerrado).toBe(false);
        expect(pose({ modo: 'carga' }).cerrado).toBe(true);
        expect(pose({ modo: 'carga' }).flujos.linea).toBeGreaterThan(0);
        expect(pose({ modo: 'carga', P: 300, campoC: 900 }).fueraDePaso).toBe(true);
        // con aire, el hidrógeno no corre
        expect(pose({ modo: 'calor', medio: 'aire' }).flujos.h2).toBe(0);
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
        const paginas = ['generador', 'generador-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.generador.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.generador.fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'LCNE']) expect(acervos).toContain(siglas);
        // la figura anterior, con su foco y su voltímetro, ya no se usa
        const fuente = readFileSync('conceptos-3d/generador/main.js', 'utf8');
        expect(fuente).not.toContain('../comun/estilo.js');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.generador;
        expect(c.figura).toBe('generador');
        expect(c.nivel).toBe(1);
        expect(c.antes).toEqual(['motor']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/generador/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.generador;
        expect(articulo(LSE, 3)).toContain('V. Central Eléctrica: Instalaciones y equipos que, en un sitio determinado, permiten generar energía eléctrica y Productos Asociados');
        expect(articulo(LSE, 19)).toContain('Todas las Centrales Eléctricas con capacidad igual o mayor a 0.7 MW deben contar con permiso de generación vigente');
        expect(articulo(LSE, 19)).toContain('Las Centrales Eléctricas con capacidad menor a 0.7 MW son Generadoras Exentas y no requieren permiso para generar energía eléctrica');
        expect(articulo(LSE, 11)).toContain('I. Otorgar los permisos a los que se refiere esta Ley, con excepción de las autorizaciones de importación y exportación, considerando los criterios de planeación vinculante del Sistema Eléctrico Nacional establecidos por la Secretaría');
        expect(articulo(LSE, 22)).toContain('II. Operar sus Centrales Eléctricas cumpliendo las bases y Reglas del Mercado Eléctrico Mayorista, así como las instrucciones del CENACE');
        expect(articulo(LCNE, 8)).toContain('IV. Otorgar, modificar, terminar y supervisar los permisos de generación y comercialización de energía eléctrica');
        expect(c.ley.siglas).toEqual(['LSE', 'LCNE']);
        // la CNE, la SENER, el CENACE y la CFE se escriben completos la primera vez
        expect(c.ley.texto).toContain('Comisión Nacional de Energía (CNE)');
        expect(c.ley.texto).toContain('Secretaría de Energía (SENER)');
        expect(c.ley.texto).toContain('Centro Nacional de Control de Energía (CENACE)');
        expect(c.resumen).toContain('Comisión Federal de Electricidad (CFE)');
        const texto = JSON.stringify(c);
        expect(texto).not.toContain('SAEE');
        // la figura anterior hablaba de un foco y un voltímetro, y citaba artículos que no corresponden
        expect(texto).not.toContain('Voltímetro');
        expect(texto).not.toContain('Arts. 11, 12, 19, 35 y 36');
    });
});
