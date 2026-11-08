// Lo que usan todas las plantas con física: cuentas chicas e iconos. Sin three.js ni DOM.
export const D2R = Math.PI / 180;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const clamp01 = x => clamp(x, 0, 1);
export const lerp = (a, b, k) => a + (b - a) * k;
export const sale = x => 1 - (1 - clamp01(x)) ** 3;
export const suave = x => { const k = clamp01(x); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; };
export const fract = x => x - Math.floor(x);
export const azar = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
export const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
export const ICONO_TOCAR = '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10"/><path d="M12 9.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.4 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16"/>';
export const ICONOS = {
    izq: '<path d="M4 12a8 8 0 1 1 2.5 5.8"/><path d="M4 18v-5h5"/>',
    der: '<path d="M20 12a8 8 0 1 0-2.5 5.8"/><path d="M20 18v-5h-5"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    menos: '<path d="M5 12h14"/>',
    luna: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/>',
    pausa: '<path d="M8 5v14M16 5v14"/>',
    seguir: '<path d="M7 4.5v15l12-7.5Z"/>',
    abrir: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    cerrar: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
};
export const svgIcono = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
