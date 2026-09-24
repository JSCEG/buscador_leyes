import { describe, expect, it } from 'vitest';
import { officialUrl } from '../src/lib/official-url.js';

describe('official source links', () => {
    it('moves DOF links to the host its certificate covers and drops the widget hash', () => {
        expect(officialUrl('https://www.dof.gob.mx/nota_detalle.php?codigo=5769157&fecha=03/10/2025#gsc.tab=0'))
            .toBe('https://dof.gob.mx/nota_detalle.php?codigo=5769157&fecha=03/10/2025');
        expect(officialUrl('http://www.dof.gob.mx/nota_detalle.php?codigo=1')).toBe('https://dof.gob.mx/nota_detalle.php?codigo=1');
    });

    it('keeps other official hosts as they are', () => {
        expect(officialUrl('https://www.diputados.gob.mx/LeyesBiblio/pdf/LSE.pdf')).toBe('https://www.diputados.gob.mx/LeyesBiblio/pdf/LSE.pdf');
        expect(officialUrl('https://sidof.segob.gob.mx/notas/docFuente/5785045')).toBe('https://sidof.segob.gob.mx/notas/docFuente/5785045');
    });

    it('rejects unsafe or malformed values', () => {
        expect(officialUrl('javascript:alert(1)')).toBe('');
        expect(officialUrl('https://user:pw@dof.gob.mx/')).toBe('');
        expect(officialUrl('nota_detalle.php')).toBe('');
        expect(officialUrl(null)).toBe('');
    });
});
