import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const transitorio = (archivo, n) => lista(archivo).filter(a => String(a.transitorio_num) === String(n)).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const c = CONCEPTO['planeacion-desarrollo-mixto'];
const texto = JSON.stringify(c);

describe('Planeación vinculante y desarrollo mixto', () => {
    it('lo que cita está en la Ley del Sector Eléctrico', () => {
        expect(articulo(LSE, 1)).toContain('III. Reconocer la prevalencia del Estado en las actividades del sector eléctrico');
        expect(articulo(LSE, 12)).toContain('VI. Garantizar la no prevalencia de los particulares sobre el Estado');
        expect(articulo(LSE, 12)).toContain('El Estado debe mantener al menos el cincuenta y cuatro por ciento del promedio de la energía inyectada a la red, en un año calendario');
        expect(articulo(LSE, 12)).toContain('programas de planeación vinculante, entre otras cosas, para la instalación y retiro de las Centrales Eléctricas');
        expect(articulo(LSE, 10)).toContain('XIII. Desarrollar los programas vinculantes para la instalación y retiro de Centrales Eléctricas');
        expect(articulo(LSE, 36)).toContain('pueden desarrollarse por el Estado, por particulares o mediante esquemas para desarrollo mixto');
        expect(articulo(LSE, 39)).toContain('II. Debe prever que el Estado no aporta capital para el desarrollo del proyecto');
        expect(articulo(LSE, 40)).toContain('de al menos el cincuenta y cuatro por ciento');
        expect(articulo(LSE, 3)).toContain('XIX. Distribuidora: Empresa Pública del Estado');
        expect(articulo(LSE, 3)).toContain('LXIII. Transportista: Empresa Pública del Estado');
        expect(transitorio(LSE, 6)).toContain('puedan solicitar la migración a las figuras de la presente Ley');
        expect(articulo('RLSE_chunks.json', 71)).toContain('debe llevar a cabo el procedimiento para la selección de las personas particulares');
        expect(articulo('LEPE_CFE_chunks.json', 8)).toContain('evitar el lucro en la provisión del servicio');
    });

    it('no dice lo que la ley no dice', () => {
        // el 54 % lo mantiene el Estado; no hay un 46 % en la ley ni lo «garantiza» la CFE
        expect(c.ley.ficha.elQue).not.toContain('CFE garantiza');
        expect(c.ley.ficha.elQue).not.toContain('46 %');
        expect(texto).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        expect(texto).not.toContain('arts. 1, 6 y 36');
        expect(texto).not.toContain('Ya no existe interconexión libre');
        expect(c.ley.ficha.elComo).toContain('28 de enero de 2026');
    });

    it('sus partes son las de la figura, en el mismo orden', () => {
        const fuente = readFileSync('conceptos-3d/desarrollo-mixto-sen/main.js', 'utf8');
        const enFigura = [...fuente.matchAll(/\{ n: \d+, nombre: '([^']+)'/g)].map(m => m[1]);
        expect(enFigura).toEqual(c.partes.map(p => p.nombre));
        expect(fuente).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        for (const n of ['desarrollo-mixto-sen', 'desarrollo-mixto-sen-light']) expect(readFileSync(`public/conceptos/${n}.html`, 'utf8')).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
    });
});
