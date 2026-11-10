import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { AGUANTE, BANDA, BLOQUE, CALOR, DEF, EVENTO2020, FEB2021, GOB, H, LINEAS, PARQUE, PARTES, PASOS, RESERVA, ROCOF_MAX, SEN2024, SISTEMA, UNIDAD, dia, en, estadoOperativo, estadoPlanta, hora, pasoPlanta, pose, puntasSueltas, revisar, simular } from '../conceptos-3d/equilibrio-red/modelo.js';
import { FUENTES } from '../conceptos-3d/equilibrio-red/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';
const r2 = x => Math.round(x * 100) / 100;

describe('Cómo se equilibra la red', () => {
    it('sus cifras salen del modelo y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca una torre, una subestación, un sector o el CENACE en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('las reglas son las del Código de Red de 2021', () => {
        expect(BANDA).toEqual({ min: 59.8, max: 60.2 });
        expect(RESERVA).toMatchObject({ normal: 0.06, emergencia: 0.03, rodante: 0.5, minutos: 10 });
        expect(GOB).toMatchObject({ rango: [0.03, 0.08], banda: 0.03, completo: 30 });
        expect(GOB.R).toBeGreaterThanOrEqual(GOB.rango[0]);
        expect(GOB.R).toBeLessThanOrEqual(GOB.rango[1]);
        expect(ROCOF_MAX).toBe(2.5);
        expect(AGUANTE).toEqual([{ de: 58.8, a: 61.2, min: Infinity }, { de: 58.2, a: 58.8, min: 30 }, { de: 57.0, a: 58.2, min: 15 }]);
        expect(estadoOperativo(0.07)).toBe('normal');
        expect(estadoOperativo(0.045)).toBe('alerta');
        expect(estadoOperativo(0.02)).toBe('emergencia');
        // la inercia promedio está dentro de lo que da el NREL
        expect(H).toBeGreaterThanOrEqual(2);
        expect(H).toBeLessThanOrEqual(7);
    });

    it('se dispara una central de 810 MW: las cifras de la ficha', () => {
        expect(UNIDAD).toBe(810);
        const A = simular({});
        expect(r2(A.rocof)).toBe(0.13);
        expect(r2(A.nadir)).toBe(59.82);
        expect(Math.round(A.tNadir * 10) / 10).toBe(2.5);
        expect(A.nadir).toBeGreaterThan(BANDA.min);
        // las cifras de las fórmulas
        expect(Math.round(A.Sg)).toBe(41690);
        expect(Math.round(A.Ek)).toBe(187605);
        expect(A.RR).toBe(1200);
        expect(Math.round(((0.07 / 60) / GOB.R) * A.Sg)).toBe(973);
        // el CENACE la regresa a 60 Hz en unos 3 minutos
        expect(en(A, 'f', 30)).toBeLessThan(59.95);
        expect(Math.abs(en(A, 'f', 180) - 60)).toBeLessThan(0.005);
        // sin gobernadores, se quedaría cerca de 59.1 Hz
        expect(Math.round(simular({ gobernadores: false, agc: false, tFin: 120 }).fFin * 10) / 10).toBe(59.1);
    });

    it('menos máquinas girando: más rápido y más hondo; las baterías ayudan', () => {
        const alto = simular({ renovable: 0.7 });
        expect(r2(alto.rocof)).toBe(0.38);
        expect(r2(alto.nadir)).toBe(59.46);
        expect(alto.nadir).toBeLessThan(PASOS[0].f);
        const conBat = simular({ renovable: 0.7, bateria: 500 });
        expect(r2(conBat.nadir)).toBe(59.81);
        expect(conBat.nadir).toBeGreaterThan(BANDA.min);
    });

    it('cuando falta mucho: lo que se perdió el 28 de diciembre de 2020', () => {
        expect(EVENTO2020).toMatchObject({ perdida: 9262, demanda: 31789, corte: 8696, fMin: 58.9, pasos: 4 });
        expect(FEB2021.corte).toBe(2016.6);
        expect(PASOS).toHaveLength(4);
        expect(Math.round(PASOS.reduce((s, p) => s + p.pct, 0) * 100)).toBe(26);
        const G = simular({ perdida: EVENTO2020.perdida, demanda: EVENTO2020.demanda, pasos: true, tFin: 120 });
        expect(G.cortes).toHaveLength(4);
        expect(r2(G.nadir)).toBe(58.72);
        expect(Math.round(G.cortado)).toBe(8265);
        expect(G.colapso).toBeNull();
        expect(G.rocof).toBeGreaterThan(ROCOF_MAX);
        expect(simular({ perdida: EVENTO2020.perdida, demanda: EVENTO2020.demanda, pasos: false, tFin: 60 }).colapso).not.toBeNull();
    });

    it('la reserva del día: normal un día normal; alerta y emergencia al caer la tarde de un día de calor', () => {
        const D = dia({});
        expect(D.horas.alerta + D.horas.emergencia).toBe(0);
        expect(D.horaMin).toBeGreaterThan(18);
        expect(D.horaMin).toBeLessThan(22);
        const C = dia({ pico: CALOR.pico, fuera: CALOR.fuera });
        expect(C.horas.emergencia).toBeGreaterThan(0.5);
        expect(C.horas.alerta).toBeGreaterThan(1);
        expect(hora({ hora: 13, pico: CALOR.pico, fuera: CALOR.fuera }).estado).toBe('normal');
        // la acción lleva a la hora más apretada: emergencia, con un corte chico; antes y después, alerta
        expect(hora({ hora: CALOR.hora, pico: CALOR.pico, fuera: CALOR.fuera }).estado).toBe('emergencia');
        expect(hora({ hora: CALOR.hora, pico: CALOR.pico, fuera: CALOR.fuera }).corte).toBeLessThan(500);
        expect(hora({ hora: 17, pico: CALOR.pico, fuera: CALOR.fuera }).estado).toBe('alerta');
        expect(hora({ hora: 20, pico: CALOR.pico, fuera: CALOR.fuera }).estado).toBe('alerta');
        // en emergencia, se corta lo necesario para volver a 3 %
        const e = hora({ hora: 18.6, pico: 50000, fuera: 4000 });
        expect(e.estado).toBe('emergencia');
        expect((e.disponible - (e.demanda - e.corte)) / (e.demanda - e.corte)).toBeCloseTo(RESERVA.emergencia, 6);
        // la capacidad solar y eólica es la de 2024 (CNE)
        expect(SEN2024).toMatchObject({ normal: 96.81, alertas: 285, emergencias: 49, capacidad: 90543 });
        expect(PARQUE.solar).toBe(Math.round((90543 * 8.89) / 100));
    });

    it('el tiempo no depende de los cuadros', () => {
        const corre = (dt, n, modo) => { let s = pasoPlanta(estadoPlanta(), { evento: true, modo }, 0); for (let i = 0; i < n; i++) s = pasoPlanta(s, { evento: true, modo }, dt); return s.ev; };
        expect(Math.abs(corre(0.05, 200, 'disparo') - corre(0.01, 1000, 'disparo'))).toBeLessThan(0.3);
        expect(Math.abs(corre(0.05, 100, 'corte') - corre(0.01, 500, 'corte'))).toBeLessThan(0.1);
        expect(pasoPlanta({ t: 0, ev: 5 }, { evento: false }, 0.1).ev).toBeNull();
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        // la central grande deja de girar al dispararse
        expect(pose({ modo: 'disparo' }).giran.grande).toBe(true);
        expect(pose({ modo: 'disparo', planta: { t: 0, ev: 2 } }).giran.grande).toBe(false);
        expect(pose({ modo: 'disparo', planta: { t: 0, ev: 2 } }).f).toBeLessThan(60);
        // con mucho sol y viento se apagan unidades
        expect(pose({ modo: 'inercia', renovable: 0.7 }).giran.ciclo1).toBe(false);
        // el corte: después de los pasos, los cuatro sectores quedan sin luz
        const corte = pose({ modo: 'corte', planta: { t: 0, ev: 5 } });
        expect(corte.sectores).toEqual([false, false, false, false]);
        expect(corte.apagado).toBe(false);
        // la reserva en emergencia corta un sector por turnos
        const r = pose({ modo: 'reserva', hora: 18.6, pico: 50000, fuera: 4000, t: 0 });
        expect(r.sectores.filter(v => !v)).toHaveLength(1);
        expect(pose({ modo: 'reserva', hora: 12, t: 0 }).sectores.every(Boolean)).toBe(true);
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
        expect(DEF.demanda).toBe(SISTEMA.demanda);
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['equilibrio-red', 'equilibrio-red-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO['equilibrio-red'].fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO['equilibrio-red'].fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'RLSE']) expect(acervos).toContain(siglas);
        expect(acervos).not.toContain('BME');
        // la figura anterior ya no se usa
        expect(readFileSync('conceptos-3d/equilibrio-red/main.js', 'utf8')).not.toContain('crearMaquina');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO['equilibrio-red'];
        expect(c.figura).toBe('equilibrio-red');
        expect(c.nivel).toBe(2);
        expect(c.antes).toEqual(['cd-ca', 'red-transmision']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/equilibrio-red/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO['equilibrio-red'];
        const a3 = articulo(LSE, 3);
        expect(a3).toContain('IX. Confiabilidad: Habilidad y capacidad del Sistema Eléctrico Nacional para satisfacer la demanda de energía eléctrica de las Usuarias Finales bajo condiciones de suficiencia, Seguridad de Despacho');
        expect(a3).toContain('XII. Control Operativo del Sistema Eléctrico Nacional: Actividad estratégica exclusiva del Estado');
        expect(a3).toContain('a) La asignación y despacho con Confiabilidad de las Centrales Eléctricas y de la Demanda Controlable');
        expect(a3).toContain('XLIX. Servicios Conexos: Los servicios vinculados a la operación del Sistema Eléctrico Nacional y que son necesarios para garantizar su Calidad, Confiabilidad, Continuidad y seguridad, entre los que se pueden incluir: la reserva operativa, la reserva rodante, regulación de frecuencia');
        expect(articulo(LSE, 14)).toContain('El Estado ejerce el Control Operativo del Sistema Eléctrico Nacional a través del CENACE');
        expect(articulo(LSE, 15)).toContain('Las instrucciones que el CENACE emite en el ejercicio del Control Operativo del Sistema Eléctrico Nacional son obligatorias');
        const a124 = articulo(LSE, 124);
        expect(a124).toContain('I. Ejercer el Control Operativo del Sistema Eléctrico Nacional');
        expect(a124).toContain('II. Determinar los actos necesarios para mantener la Seguridad de Despacho, Confiabilidad, Calidad y Continuidad');
        expect(a124).toContain('V. Determinar la asignación y el despacho de las Centrales Eléctricas, de la Demanda Controlable, de los Sistemas de Almacenamiento de Energía Eléctrica');
        // el transitorio tercero viene en el mismo pedazo que el art. 188
        const transitorios = lista(LSE).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
        expect(transitorios).toContain('Tercero. La operación del Mercado Eléctrico Mayorista debe realizarse conforme a las Reglas del Mercado, las Disposiciones Administrativas de Carácter General que contienen los criterios de eficiencia, Calidad, Confiabilidad, Continuidad, seguridad y sustentabilidad del Sistema Eléctrico Nacional: Código de Red');
        expect(transitorios).toContain('hasta en tanto no se expidan nuevas disposiciones');
        expect(articulo(RLSE, 14)).toContain('la expedición del protocolo para que el CENACE realice la contratación y adquisición de potencia');
        expect(articulo(RLSE, 14)).toContain('en caso de emergencia');
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE']);
        // el CENACE, la CNE y el SIN se escriben completos la primera vez
        expect(c.resumen).toContain('Centro Nacional de Control de Energía (CENACE)');
        expect(c.ley.texto).toContain('Centro Nacional de Control de Energía (CENACE)');
        expect(c.ley.ficha.elQue).toContain('Comisión Nacional de Energía (CNE)');
        expect(c.claves[0]).toContain('Sistema Interconectado Nacional (SIN)');
        const texto = JSON.stringify(c);
        expect(texto).not.toContain('SAEE');
        // la figura anterior hablaba de un sistema de 10,000 MW
        expect(texto).not.toContain('10,000 MW');
    });
});
