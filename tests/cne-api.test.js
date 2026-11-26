import { describe, it, expect } from 'vitest';
import { permitKind, permitsRoute, permitPinId, permitFromPinId, permitsHash } from '../src/lib/cne-api.js';

describe('permitKind', () => {
    it('reads sector and activity from the permit number', () => {
        expect(permitKind('CNE/E/1439/GEN/2015')).toMatchObject({ sector: { id: 'electricidad' }, activity: 'Generación' });
        expect(permitKind('E/124-A/PIE/98').sector.id).toBe('electricidad');
        expect(permitKind('CNE/PL/12345/EXP/ES/2016')).toMatchObject({ sector: { id: 'petroliferos' }, activity: 'Expendio' });
        expect(permitKind('CNE/LP/100/DIS/2020').sector.id).toBe('gaslp');
        expect(permitKind('CNE/G/22/LICUE/2018')).toMatchObject({ sector: { id: 'gasnatural' }, activity: 'Licuefacción' });
    });
    it('treats EXP as export for electricity', () => {
        expect(permitKind('CNE/E/5/EXP/2019').activity).toBe('Exportación');
    });
    it('returns no sector for unknown prefixes', () => {
        expect(permitKind('V/123/2020').sector).toBeNull();
    });
});

describe('permitsRoute', () => {
    it('parses the list and permit hashes', () => {
        expect(permitsRoute('#permisos')).toEqual({ tab: 'permisos' });
        expect(permitsRoute('#permiso=CNE%2FE%2F1439%2FGEN%2F2015')).toEqual({ tab: 'permisos', permit: 'CNE/E/1439/GEN/2015' });
        expect(permitsRoute('#resoluciones')).toEqual({ tab: 'resoluciones' });
        expect(permitsRoute('#resolucion=CNE%2FRES%2F062%2F2026')).toEqual({ tab: 'resoluciones', resolution: 'CNE/RES/062/2026' });
        expect(permitsRoute('#panorama-cne')).toEqual({ tab: 'panorama' });
        expect(permitsRoute('#tramites')).toEqual({ tab: 'tramites' });
        expect(permitsRoute('#mapa-permisos')).toEqual({ tab: 'mapa' });
        expect(permitsRoute('#mapa-permisos?permiso=CNE%2FE%2F1439%2FGEN%2F2015')).toEqual({ tab: 'mapa', mapPermit: 'CNE/E/1439/GEN/2015' });
        expect(permitsRoute('#mapa-permisos?x=1')).toEqual({ tab: 'mapa' });
        expect(permitsRoute('#resoluciones?fecha=2025&tipo=Otorgamiento&x=1')).toEqual({ tab: 'resoluciones', filters: { fecha: '2025', tipo: 'Otorgamiento' } });
        expect(permitsHash({ tab: 'resoluciones', filters: { fecha: '2025', modalidad: 'Gas natural' } })).toBe('#resoluciones?fecha=2025&modalidad=Gas+natural');
        expect(permitsRoute('#tramite=generacion')).toEqual({ tab: 'tramites', tramite: 'generacion' });
        expect(permitsRoute('#cronologia')).toBeNull();
    });
    it('builds the hash back', () => {
        for (const hash of ['#permisos', '#resoluciones', '#panorama-cne', '#tramites', '#mapa-permisos', '#mapa-permisos?permiso=CNE%2FE%2F1439%2FGEN%2F2015', '#tramite=gaslp', '#permiso=CNE%2FE%2F1439%2FGEN%2F2015', '#resolucion=CNE%2FRES%2F062%2F2026']) {
            expect(permitsHash(permitsRoute(hash))).toBe(hash);
        }
    });
});

describe('permits on a desk', () => {
    it('round-trips the pin id', () => {
        expect(permitPinId('CNE/E/1439/GEN/2015')).toBe('cne:CNE/E/1439/GEN/2015');
        expect(permitFromPinId('cne:CNE/E/1439/GEN/2015')).toBe('CNE/E/1439/GEN/2015');
        expect(permitFromPinId('12345')).toBeNull();
    });
});
