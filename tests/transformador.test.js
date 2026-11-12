import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { A, AEREAS, BANCO, BLOQUE, BORNES, CONEXION, DIF, FASE, I0, IN, LINEAS, NORMA, P0, PARTES, PRUEBA, REMATE, ZBASE, auto, carga, energizar, estadoPlanta, falla, fallaConZ, flujoEn, parteNucleo, pasoPlanta, pose, puntasSueltas, relacion, revisar } from '../conceptos-3d/transformador/modelo.js';
import { cablesSueltos, colgar } from '../conceptos-3d/planta-comun/lineas.js';
import { FUENTES } from '../conceptos-3d/transformador/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';
const r1 = x => Math.round(x * 10) / 10;

describe('El transformador', () => {
    it('sus cifras salen del modelo y coinciden con la tesis y las normas', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo y cable toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('cada fase cuelga entre pórticos, marcos e interruptor, y llega a la boquilla de su unidad', () => {
        expect(cablesSueltos(LINEAS, BORNES, REMATE)).toEqual([]);
        expect(Object.keys(AEREAS).sort()).toEqual(['altaA', 'altaB', 'altaC', 'bajaA', 'bajaB', 'bajaC']);
        for (const [id, apoyos] of Object.entries(AEREAS)) {
            const linea = LINEAS.find(l => l.id === id);
            expect(linea.oculto).toBe(true);
            expect(linea.apoyos).toBe(apoyos);
            expect(linea.fases).toBe(1);
            // un solo conductor por unidad, que cuelga por debajo de la recta entre apoyos
            const p = colgar(apoyos);
            const largos = apoyos.slice(1).map((a, i) => Math.hypot(a.p[0] - apoyos[i].p[0], a.p[2] - apoyos[i].p[2]));
            expect(Math.max(...largos)).toBeLessThan(4.5);
            expect(p[8][1]).toBeLessThan((p[0][1] + p[16][1]) / 2);
        }
        for (const f of ['A', 'B', 'C']) {
            expect(AEREAS[`alta${f}`].at(-1).p).toBe(BORNES[`at${f}`]);
            expect(AEREAS[`baja${f}`][0].p).toBe(BORNES[`bt${f}`]);
            expect(AEREAS[`alta${f}`].some(a => a.p === BORNES[`entra${f}`])).toBe(true);
        }
    });

    it('el banco es el de la tesis de la UNAM', () => {
        expect(BANCO).toMatchObject({ sub: 'Santa Cruz', nombre: 'AT42', unidad: 'AT421C', unidades: 3, Su: 110, S: 330, alta: 400, baja: 230, z: 0.1111, posicion: 17 });
        expect(PRUEBA).toEqual({ kV: 10, mA: 18.672, W: 95.425 });
        expect(Math.round(A * 1000) / 1000).toBe(1.739);
        expect(Math.round(IN.alta)).toBe(476);
        expect(Math.round(IN.baja)).toBe(828);
        expect(Math.round(FASE.alta)).toBe(231);
        // la base bien hecha: 400² ÷ 330 (la tesis usa 161.6 Ω, que mezcla una fase y las tres)
        expect(r1(ZBASE)).toBe(484.8);
        expect(r1(BANCO.z * ZBASE)).toBe(53.9);
        expect(Math.round(P0)).toBe(153);
        expect(Math.round(I0 * IN.alta * 100) / 100).toBe(0.43);
    });

    it('las reglas son las de las normas CFE K0000-06 y G0100-07 y de Rodríguez Pozueta', () => {
        expect(NORMA).toMatchObject({ zTol: 0.1, falla: { s: 2, cobre: 250 }, xr: 14, asimetria: 2.55, pruebas: [90, 100, 110], subida: { promedio: 55, caliente: 65, ambiente: 40 } });
        expect(NORMA.diseno).toEqual([{ kV: 245, kA: 40, MVA: 17000 }, { kV: 420, kA: 40, MVA: 30000 }]);
        expect(NORMA.cambiador).toEqual({ banda: 10, pasos: [[16, 0.625], [10, 1]] });
        expect(DIF).toEqual({ h2: 12, h2Grupo: 15, h5: 35, sinRestriccion: 16 });
        expect(CONEXION).toEqual({ doble: 2, remanente: 0.5, veces: [5, 8] });
    });

    it('el voltaje: la relación y el flujo, como dice la ficha', () => {
        expect(relacion({}).kVb).toBe(230);
        expect(Math.round(relacion({ v: 110 }).veces)).toBe(5);
        expect(Math.round(relacion({ v: 120 }).veces)).toBe(47);
        expect(relacion({ v: 120 }).satura).toBe(true);
        expect(Math.round(relacion({ v: 100, f: 57 }).vhz)).toBe(105);
        expect(Math.round(relacion({ v: 95, f: 57 }).vhz)).toBe(100);
    });

    it('el autotransformador: lo que pasa por el núcleo y por el cobre', () => {
        const a = auto({ s: 1 });
        expect(Math.round(a.comun)).toBe(352);
        expect(r1(a.parte * 100)).toBe(42.5);
        expect(Math.round(a.nucleo)).toBe(140);
        expect(Math.round(a.kVserie)).toBe(98);
        expect(parteNucleo(2)).toBe(0.5);
        expect(parteNucleo(1)).toBe(0);
    });

    it('con carga: la caída, las pérdidas y la eficiencia', () => {
        const at = carga({ s: 1, ang: 25.84 });
        expect(r1(at.caida)).toBe(5.8);
        expect(at.pasos).toBe(10);
        const f1 = carga({ s: 1, ang: 0 });
        expect(Math.round(f1.eficiencia * 10000) / 100).toBe(99.8);
        expect(carga({ s: 1, ang: -25.84 }).caida).toBeLessThan(0);
        expect(Math.round(f1.mejor * 100)).toBe(55);
        expect(carga({ s: 0.8 }).ventiladores).toBe(true);
        expect(carga({ s: 0.5 }).ventiladores).toBe(false);
    });

    it('al energizarlo: el golpe, la segunda armónica y la diferencial', () => {
        const peor = energizar({ alfa: 0, rem: 0.5 });
        expect(r1(peor.phiMax)).toBe(2.5);
        expect(r1(peor.pico)).toBe(5.2);
        expect(Math.round(peor.pct2)).toBe(30);
        expect(peor.bloquea).toBe(true);
        expect(peor.dispara).toBe(false);
        expect(energizar({ alfa: 0, rem: 0.5, restriccion: false }).dispara).toBe(true);
        // en el pico del voltaje y sin flujo guardado, no hay golpe; con flujo guardado, el mejor momento cambia
        expect(energizar({ alfa: 90, rem: 0 }).sinTransitorio).toBe(true);
        expect(energizar({ alfa: 120, rem: 0.5 }).sinTransitorio).toBe(true);
        expect(flujoEn(0, 0, 0.5)).toBeCloseTo(0.5, 9);
        // al cerrar corre el tiempo; sin bloqueo dispara; si cambia el momento, vuelve a energizar
        let s = estadoPlanta();
        const m = { modo: 'energizar', cerrar: true, alfa: 0, rem: 0.5, restriccion: false };
        for (let i = 0; i < 30; i++) s = pasoPlanta(s, m, 0.05);
        expect(s.cerrado).toBe(true);
        expect(s.disparo).toBe(true);
        s = pasoPlanta(s, { ...m, restriccion: true, alfa: 90 }, 0.05);
        expect(s.tc).toBeLessThan(0.01);
        expect(s.disparo).toBe(false);
    });

    it('una falla: la corriente, el primer pico, la fuerza y quién dispara', () => {
        const f = falla({});
        expect(r1(f.kA)).toBe(6.8);
        expect(r1(f.i)).toBe(8.2);
        expect(r1(f.pico)).toBe(17.3);
        expect(Math.round(f.fuerza)).toBe(67);
        expect(r1(f.kAsinRed)).toBe(7.5);
        expect(f.dispara).toBe(false);
        expect(falla({ dentro: true }).dispara).toBe(true);
        expect(fallaConZ(0.05)).toBeGreaterThan(f.kA * 2);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'relacion', v: 125 }).activo.satura).toBe(1);
        expect(pose({ modo: 'relacion', v: 100 }).activo.satura).toBe(0);
        expect(pose({ modo: 'auto', s: 1 }).flujos.cobre).toBeGreaterThan(pose({ modo: 'auto', s: 0.2 }).flujos.cobre);
        expect(pose({ modo: 'carga', s: 1 }).ventiladores).toBe(1);
        // al energizar, el interruptor está abierto hasta cerrarlo
        expect(pose({ modo: 'energizar' }).cerrado).toBe(false);
        expect(pose({ modo: 'energizar' }).flujos.altaA).toBe(0);
        // una falla adentro abre los interruptores
        expect(pose({ modo: 'falla', falla: true, dentro: true, planta: { ...estadoPlanta(), falla: 1 } }).cerrado).toBe(false);
        expect(pose({ modo: 'falla', falla: true, dentro: false, planta: { ...estadoPlanta(), falla: 1 } }).cerrado).toBe(true);
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
        const paginas = ['transformador', 'transformador-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.transformador.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https:\/\//);
            expect(f.para).toBeTruthy();
            expect(f.fecha).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.transformador.fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'RLSE']) expect(acervos).toContain(siglas);
        // la figura anterior, con dos bobinas y un núcleo, ya no se usa
        const fuente = readFileSync('conceptos-3d/transformador/main.js', 'utf8');
        expect(fuente).not.toContain('../comun/');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.transformador;
        expect(c.figura).toBe('transformador');
        expect(c.nivel).toBe(2);
        expect(c.antes).toEqual(['cd-ca', 'generador']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/transformador/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.transformador;
        const a3 = articulo(LSE, 3);
        expect(a3).toContain('XX. Empresa Pública del Estado: Comisión Federal de Electricidad');
        expect(a3).toContain('XL. Red Eléctrica: Sistema integrado por líneas, subestaciones y equipos de transformación, compensación');
        expect(a3).toContain('XLI. Red Nacional de Transmisión: Sistema integrado por el conjunto de las Redes Eléctricas que se utilizan para transportar energía eléctrica a las Redes Generales de Distribución y a grandes usuarios');
        expect(a3).toContain('LXIII. Transportista: Empresa Pública del Estado que presta el Servicio Público de Transmisión de Energía Eléctrica');
        expect(articulo(LSE, 44)).toContain('operan sus redes conforme a las instrucciones del CENACE');
        expect(articulo(LSE, 44)).toContain('Para el mantenimiento de la Red Nacional de Transmisión');
        expect(articulo(LSE, 57)).toContain('El Servicio Público de Transmisión y Distribución de Energía Eléctrica es un área estratégica exclusiva del Estado');
        expect(articulo(RLSE, 2)).toContain('II. Alta Tensión: Los niveles de tensión de la Red Eléctrica mayores a 35 kilovolt');
        expect(articulo(RLSE, 2)).toContain('V. Baja Tensión: Los niveles de tensión de la Red Eléctrica iguales o menores a un kilovolt');
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE']);
        expect(c.ley.texto).toContain('Red Nacional de Transmisión (RNT)');
        expect(c.ley.texto).toContain('Centro Nacional de Control de Energía (CENACE)');
        expect(c.resumen).toContain('Comisión Federal de Electricidad (CFE)');
        const texto = JSON.stringify(c);
        expect(texto).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        // la ficha anterior citaba artículos que no corresponden a un transformador
        expect(texto).not.toContain('Arts. 13, 45, 46, 50, 57 y 160');
    });
});
