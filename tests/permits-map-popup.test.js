import { describe, expect, it, vi } from 'vitest';
import { popupCounts, registryCounts } from '../src/lib/permit-popup.js';
import { KV_CLASSES, pinIcon, pinSize, sectorCluster } from '../src/lib/map-common.js';

describe('permit window', () => {
  it('shows resolutions, agreements, letters and annexes', () => {
    document.body.innerHTML = popupCounts({ ResolucionesAsociadas: 4, AcuerdosAsociados: 1, OficiosAsociados: 0, AnexosAsociados: 12 });
    expect([...document.querySelectorAll('dt')].map(dt => dt.textContent)).toEqual(['Resoluciones', 'Acuerdos', 'Oficios', 'Anexos']);
    expect(document.querySelectorAll('dd')[3].textContent).toBe('12');
  });
  it('the popup survives a slow or failed registry', async () => {
    const fetchPermit = vi.fn(async () => { throw new Error('caído'); });
    const ask = registryCounts(fetchPermit);
    await expect(ask('E/1/GEN/2020')).resolves.toBeNull();
    expect(popupCounts(await ask('E/1/GEN/2020'))).toBe('');
    expect(fetchPermit).toHaveBeenCalledTimes(1);
  });
  it('shows nothing without counts', () => { expect(popupCounts({})).toBe(''); expect(popupCounts(null)).toBe(''); });
});

describe('map standard', () => {
  const L = { divIcon: options => ({ options }), markerClusterGroup: options => options };
  it('uses the Búho voltage standard', () => {
    expect(KV_CLASSES.map(c => c.label)).toEqual(['400 kV', '230 kV', '161 kV', '138 kV', '115 kV', '85 kV', '69 kV', '35 kV o menor']);
  });
  it('sizes pins by capacity', () => { expect(pinSize(10)).toBe(22); expect(pinSize(30)).toBe(26); expect(pinSize(300)).toBe(30); expect(pinSize(undefined)).toBe(22); });
  it('marks a selected pin and keeps the cache by state', () => {
    const cache = new Map();
    const plain = pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 26 });
    const selected = pinIcon(L, cache, 'electricidad', 'solar', '', 'eo', { size: 26, selected: true });
    expect(selected.options.className).toContain('is-sel');
    expect(plain.options.className).not.toContain('is-sel');
    expect(plain.options.iconAnchor[1]).toBe(plain.options.iconSize[1]);
  });
  it('draws a cluster as a ring of its real mix with the total inside', () => {
    const group = sectorCluster(L, ['electricidad'], { toneOf: marker => marker.options.tone });
    const icon = group.iconCreateFunction({ getChildCount: () => 3, getAllChildMarkers: () => [{ options: { tone: 'var(--tec-eo)' } }, { options: { tone: 'var(--tec-eo)' } }, { options: { tone: 'var(--tec-fv)' } }] });
    expect(icon.options.html).toContain('var(--tec-eo)');
    expect(icon.options.html).toContain('var(--tec-fv)');
    expect(icon.options.html).toContain('>3<');
  });
});
