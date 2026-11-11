import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO, EJES_RECTORES, GLOSARIO_REGULATORIO } from '../src/data/como-funciona.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const transitorio = (archivo, n) => lista(archivo).filter(a => a.transitorio_num === n).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const termino = t => GLOSARIO_REGULATORIO.find(g => g.termino === t);

describe('El glosario regulatorio y los ejes rectores de Aprende', () => {
    it('cada término lleva a un tema que existe', () => {
        for (const g of GLOSARIO_REGULATORIO) expect(CONCEPTO[g.conceptoId], g.termino).toBeTruthy();
    });

    it('lo que dicen de la CFE, PEMEX y la CNE está en sus leyes', () => {
        expect(articulo('LEPE_CFE_chunks.json', 2)).toContain('sectorizada a la Secretaría de Energía');
        expect(articulo('LEPE_CFE_chunks.json', 4)).toContain('no constituyen monopolios');
        expect(articulo('LEPE_CFE_chunks.json', 8)).toContain('X. Procurar al pueblo de los Estados Unidos Mexicanos de la electricidad al menor precio posible y evitar el lucro en la provisión del servicio');
        expect(articulo('LEPE_PEMEX_chunks.json', 3)).toContain('para preservar la soberanía, seguridad, sostenibilidad, autosuficiencia y justicia energética de la Nación');
        expect(articulo('LCNE_chunks.json', 2)).toContain('cuenta con independencia técnica, operativa, de gestión y de decisión');
        expect(articulo('LCNE_chunks.json', 16)).toContain('órgano administrativo desconcentrado');
        expect(articulo('LCNE_chunks.json', 9)).toContain('comercialización y expendio al público de petrolíferos');
        expect(articulo('LPTE_chunks.json', 21)).toContain('I. La Estrategia; II. Programa Sectorial de Energía; III. El PLATEASE; IV. El PLADESE, y V. El PLADESHi');
        expect(articulo(LSE, 11)).toContain('considerando los criterios de planeación vinculante del Sistema Eléctrico Nacional establecidos por la Secretaría');
    });

    it('lo que dicen de los esquemas mixtos, el despacho, el Código de Red y el almacenamiento está en la ley', () => {
        expect(articulo(LSE, 12)).toContain('al menos el cincuenta y cuatro por ciento del promedio de la energía inyectada a la red');
        expect(articulo(LSE, 39)).toContain('II. Debe prever que el Estado no aporta capital para el desarrollo del proyecto; III. La totalidad de la producción de energía y Productos Asociados es exclusiva para la Empresa Pública del Estado');
        expect(articulo('RLSE_chunks.json', 85)).toContain('al menos el cincuenta y cuatro por ciento del capital social común o figura similar o equiparable, del vehículo jurídico o financiero');
        expect(articulo('LSH_chunks.json', 24)).toContain('Petróleos Mexicanos mantiene el derecho exclusivo sobre la Asignación');
        expect(articulo(LSE, 117)).toContain('independientemente de la propiedad o representación de las Centrales Eléctricas');
        expect(transitorio(LSE, 3) + articulo(LSE, 188)).toContain('Código de Red, y demás disposiciones aplicables vigentes al momento de la publicación de esta Ley y hasta en tanto no se expidan nuevas');
        expect(articulo(LSE, 11)).toContain('XLVIII. Expedir y supervisar la regulación necesaria para asegurar la eficiencia, Accesibilidad, Calidad, Confiabilidad');
        expect(articulo(LSE, 3)).toContain('L. Sistema de Almacenamiento de Energía Eléctrica: Conjunto de componentes');
        expect(articulo('LSH_chunks.json', 5)).toContain('I. Agencia: Agencia Nacional de Seguridad Industrial y de Protección al Medio Ambiente del Sector Hidrocarburos');
        expect(articulo(LSE, 3)).toContain('XXVIII. Justicia Energética: Acciones o Estrategias encaminadas a reducir la Pobreza Energética');
    });

    it('no repiten lo que la ley no dice', () => {
        const todo = JSON.stringify(GLOSARIO_REGULATORIO) + JSON.stringify(EJES_RECTORES);
        expect(todo).not.toContain('SAEE');
        expect(todo).not.toContain('RENAGAS');
        expect(todo).not.toContain('46 %');
        expect(todo).not.toContain('1.8 Mbd');
        expect(todo).not.toContain('Art. 80 LSH');
        expect(todo).not.toContain('Arts. 45, 46 y 124 LSE');
        expect(termino('Despacho Económico con Restricciones de Seguridad').definicion).not.toContain('prevalencia');
        expect(termino('Sistema de Almacenamiento de Energía (SAE)')).toBeTruthy();
    });
});
