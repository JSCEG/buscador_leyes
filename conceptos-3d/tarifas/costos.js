// Lo que cuesta de verdad llevar la energía a una casa o a una tienda, por eslabón, según la CNE: Acuerdo CT/11.SE/8-2025 (DOF, 1 de abril
// de 2026) y las tarifas finales de octubre de 2026 (DOF, 27 de octubre de 2026, oficio F00.06.UE/2658/2026, Anexo II). Pesos sin IVA; el
// suministro es por mes y lo demás por kWh. DB1: casas con hasta 150 kWh al mes; DB2: con más. Además, el subsidio, los usuarios, los
// precios medios y lo que gastan los aparatos, de la CFE y la SHCP.

const TRANS = 0.1801;
const CENACE = 0.0076;
const SCNMEM = 0.0069;
/** Cargos de octubre de 2026 en dos divisiones tarifarias de ejemplo. */
export const DIVISIONES = {
    central: {
        nombre: 'Valle de México Centro', suministro: 54.05,
        DB1: { distribucion: 0.753, energia: 0.766, capacidad: 0.531 },
        DB2: { distribucion: 0.6453, energia: 0.765, capacidad: 0.528 },
        PDBT: { distribucion: 0.6137, energia: 1.669, capacidad: 1.088 },
    },
    noroeste: {
        nombre: 'Noroeste', suministro: 19.78,
        DB1: { distribucion: 0.9007, energia: 0.682, capacidad: 0.443 },
        DB2: { distribucion: 0.7116, energia: 0.682, capacidad: 0.441 },
        PDBT: { distribucion: 0.7753, energia: 1.333, capacidad: 0.951 },
    },
};
/** Los eslabones, en el orden del recibo de la CFE, con su color y la parte de la figura que los hace. */
export const ESLABONES = [
    { id: 'energia', nombre: 'Generación: energía', corto: 'Energía', color: '#f2b233', parte: 'central' },
    { id: 'capacidad', nombre: 'Generación: capacidad', corto: 'Capacidad', color: '#ff8a3c', parte: 'central' },
    { id: 'transmision', nombre: 'Transmisión', corto: 'Trans.', color: '#7e57c2', parte: 'transmision' },
    { id: 'distribucion', nombre: 'Distribución', corto: 'Distribución', color: '#2f7fd1', parte: 'poste' },
    { id: 'cenace', nombre: 'Operación del CENACE', corto: 'CENACE', color: '#8a8f98', parte: 'cenace' },
    { id: 'scnmem', nombre: 'Servicios conexos', corto: 'SC', color: '#b8bcc2', parte: 'cenace' },
    { id: 'suministro', nombre: 'Suministro (la CFE que cobra)', corto: 'Suministro', color: '#9b2247', parte: 'suministro' },
];
/** Los cargos de una categoría en una división: cada eslabón con su precio por kWh, o fijo al mes. */
export function cargos(region, categoria) {
    const d = DIVISIONES[region];
    const c = d[categoria];
    const v = { energia: c.energia, capacidad: c.capacidad, transmision: TRANS, distribucion: c.distribucion, cenace: CENACE, scnmem: SCNMEM };
    return ESLABONES.map(e => (e.id === 'suministro' ? { ...e, fijo: d.suministro } : { ...e, kwh: v[e.id] }));
}
export const porKwhVariable = (region, categoria) => cargos(region, categoria).reduce((s, p) => s + (p.kwh ?? 0), 0);
export const COSTO = { mes: 'octubre de 2026', limiteDB1: 150, cargos, divisiones: DIVISIONES };

/** El recibo de una tienda (PDBT, hasta 25 kW): la CFE integra los mismos eslabones en un cargo fijo y uno por kWh. */
export const NEGOCIO = {
    pdbt: { central: { fijo: 54.05, kwh: 3.565 }, noroeste: { fijo: 19.78, kwh: 3.254 }, mes: 'octubre de 2026' },
    /** Precio medio por kWh en 2025, sin IVA (CFE, Programa de Desarrollo 2026-2030, figura 27). */
    precioMedio2025: [
        ['Casa, bajo consumo', 1.6, 'casa'],
        ['Riego agrícola', 0.83, 'riego'],
        ['Industria en alta tensión', 2.12, 'fabrica'],
        ['Industria en media tensión', 2.75, 'fabrica'],
        ['Promedio nacional', 2.29, 'nacional'],
        ['Comercio', 4.12, 'comercio'],
        ['Alumbrado público', 4.36, 'alumbrado'],
        ['Casa en DAC', 6.38, 'dac'],
    ],
};

/** El subsidio a las tarifas eléctricas y los usuarios. */
export const SUBSIDIO = {
    pef2026: 87768.8, // millones de pesos, PEF 2026, Anexo 20, Ramo 23
    real2024: 81581.4, // Cuenta Pública 2024
    real2025: 84805.5, // CFE, reporte a la BMV, 4.º trimestre de 2025
    enero_junio2026: 52661.3,
    domesticos2025: 44.4, // millones de usuarios domésticos
    bajoConsumo2024: 43667549,
    dac2024: 61550,
    kwhMedio: 149, // kWh al mes por usuario doméstico en 2025: 79,528 GWh ÷ 44.4 millones
    ventas2025: { domestico: 79136, dac: 392 }, // GWh
};

/** Lo que gastan los aparatos, de la tabla de la CFE (boletín CFE-BP-72/23, 15 de junio de 2023), en kWh al mes. */
export const APARATOS = [
    { id: 'refri', nombre: 'Refrigerador', w: 400, uso: '8 h al día de motor', kwhMes: 96 },
    { id: 'tele', nombre: 'Televisión', w: 65, uso: '10 h al día', kwhMes: 19.5 },
    { id: 'lavadora', nombre: 'Lavadora', w: 395, uso: '8 h a la semana', kwhMes: 12.6 },
    { id: 'micro', nombre: 'Horno de microondas', w: 1200, uso: '30 min al día', kwhMes: 18 },
    { id: 'focos', nombre: 'Seis focos LED', w: 60, uso: '4 h al día', kwhMes: 7.2 },
];
/** El clima: un minisplit de 1 tonelada (1,100 W en la tabla de la CFE) y cuánto se usa cada mes, de 0 a 1, en la casa de ejemplo. */
export const CLIMA = { kw: 1.1, nombre: 'Minisplit de 1 tonelada', uso: [0, 0, 0.2, 0.5, 0.8, 1, 1, 1, 0.9, 0.6, 0.2, 0] };
