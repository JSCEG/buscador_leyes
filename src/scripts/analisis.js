// ── Análisis de Temas Transversales en Leyes de Energía ───────────────────────

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ICONS = {
    gov: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 21h18M3 10h18M5 21V10m6 11V10m6 11V10M12 3l9 7H3l9-7z"/></svg>`,
    chain: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>`,
    doc: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
    council: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    plan: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>`,
    scope: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
};

// ─── Datos Temáticos ──────────────────────────────────────────────────────────
const TEMAS = [
    {
        id: 'planeacion-vinculante',
        numero: '01',
        titulo: 'Planeación Vinculante',
        subtitulo: 'Instrumento Rector del Estado',
        objetivo: 'La Planeación Vinculante es la obligación legal de que el gobierno, CFE, Pemex y empresas privadas subordinen sus actividades e inversiones a un mismo objetivo: mantener la energía segura, accesible para todos y cada vez más limpia. Para lograrlo, todos deben seguir rigurosamente los mismos Planes creados por la Secretaría de Energía.',
        color: '#9B2247',
        metricas: [
            { valor: '5', label: 'leyes y reglamentos' },
            { valor: '7', label: 'planes principales' },
            { valor: '107+', label: 'menciones obligatorias' },
        ],
        atributos: [
            { nombre: '¿Quién decide?', valor: 'Secretaría de Energía (SENER)', tipo: 'gov' },
            { nombre: 'Naturaleza', valor: 'Obligatorio para todo el sector', tipo: 'chain' },
            { nombre: 'Para el futuro', valor: 'Transición hacia energías limpias', 	tipo: 'doc' },
            { nombre: '¿Quién apoya?', valor: 'Consejo de Planeación y Comités', 	tipo: 'council' },
            { nombre: 'Planes Principales', valor: 'Estrategia Nacional, Programas Sectoriales, CFE, Pemex', tipo: 'plan' },
            { nombre: 'Aplica en...', valor: 'Luz, Gasolinas, Diésel, Geotermia', 	tipo: 'scope' },
        ],
        cadena: [
            {
                nivel: 1,
                rol: 'LA GRAN META DEL PAÍS',
                nodos: [
                    { id: 'estrategia', titulo: 'Estrategia de Transición', descripcion: 'El horizonte a largo plazo para dejar atrás tecnologías contaminantes.', color: '#25D366', articulos: ['LB-Art-011'], refs: 'LB Art. 11 · LPTE' },
                    { id: 'pse', titulo: 'Programa del Sector', descripcion: 'Las metas sexenales derivadas del desarrollo del país.', color: '#9B2247', articulos: ['LCNE-Art-007'], refs: 'LCNE Art. 7' },
                ],
                conector: 'guían a la',
            },
            {
                nivel: 2,
                rol: 'QUIÉN DISEÑA LA RUTA',
                nodos: [
                    { id: 'sener', titulo: 'SENER', descripcion: 'Secretaría de Energía', color: '#9B2247', articulos: ['LPTE-Art-002', 'LSE-Art-012', 'LSH-Art-008'], refs: 'LPTE Art. 2 · LSE Art. 12 · LSH Art. 8' },
                ],
                conector: 'que emite los',
            },
            {
                nivel: 3,
                rol: 'PLANES ESPECIALIZADOS',
                nodos: [
                    { id: 'platease', titulo: 'PLATEASE', descripcion: 'Cómo lograr la transición y la eficiencia en el uso de la energía.', color: '#7a1b38', articulos: ['LPTE-Art-008'], refs: 'LPTE Art. 8' },
                    { id: 'pladese', titulo: 'Plan Eléctrico (PLADESE)', descripcion: 'Dónde instalar nuevas plantas de luz o nuevas torres de transmisión.', color: '#1E5B4F', articulos: ['LSE-Art-012'], refs: 'LSE Art. 12' },
                    { id: 'pladeshi', titulo: 'Plan Petrolero (PLADESHi)', descripcion: 'Decide cómo cuidaremos y extraeremos mejor nuestras reservas de crudo y gas.', color: '#A57F2C', articulos: ['LSH-Art-008'], refs: 'LSH Art. 8' },
                ],
                conector: 'que son vigilados por',
            },
            {
                nivel: 4,
                rol: 'ORGANISMOS DE VIGILANCIA Y APOYO',
                nodos: [
                    { id: 'cne', titulo: 'Comisión N. E.', descripcion: 'Revisa tarifas y da permisos siempre respetando los planes.', color: '#444', articulos: ['RLPTE-Art-004', 'LSH-Art-009'], refs: 'RLPTE Art. 4 · LSH Art. 9' },
                    { id: 'cpe', titulo: 'Consejo de Planeación', descripcion: 'Grupo de expertos que evalúa que la planeación vaya por buen camino.', color: '#555', articulos: ['RLPTE-Art-002', 'LCPE-Art-002'], refs: 'RLPTE Art. 2 · LCPE Art. 2' },
                ],
                conector: 'donde participan los',
            },
            {
                nivel: 5,
                rol: 'OPERADORES DEL DÍA A DÍA',
                nodos: [
                    { id: 'cfe', titulo: 'CFE y su Programa', descripcion: 'CFE diseña su plan de 5 años alineado al Plan Eléctrico Nacional.', color: '#1E5B4F', articulos: ['LCFE-Art-016', 'LPTE-Art-002'], refs: 'Ley de la CFE Art. 16' },
                    { id: 'pemex', titulo: 'Pemex y su Programa', descripcion: 'Pemex alinea su trabajo al Plan Petrolero Nacional.', color: '#A57F2C', articulos: ['LPEMEX-Art-017', 'LSH-Art-009'], refs: 'Ley de Pemex Art. 17' },
                    { id: 'particulares', titulo: 'Empresas Privadas', descripcion: 'Solo operan si cumplen con las metas ordenadas por la SENER.', color: '#666', articulos: ['RLPTE-Art-004'], refs: 'RLPTE Art. 4' },
                ],
                conector: null,
            },
        ],
        articulosClave: [
            {
                id: 'LPTE-Art-002',
                siglas: 'LPTE', color: '#9B2247', label: 'Art. 2', rol: 'Norma Fundamental',
                descripcion: 'Se asegura que el Estado planifique hacia dónde vamos en energía, siendo obligatorio y cuidando de que tengamos soberanía sin descuidar la justicia para la gente común.',
                extracto: '"La Secretaría de Energía está a cargo de la planeación vinculante en el Sector Energético, que incluye, como parte esencial, el desarrollo de las áreas estratégicas para preservar la soberanía, la seguridad, la autosuficiencia y la Justicia Energética de la Nación…"',
            },
            {
                id: 'LPTE-Art-008',
                siglas: 'LPTE', color: '#9B2247', label: 'Art. 8', rol: 'Los Tres Grandes Planes',
                descripcion: 'La ley manda explícitamente a la Secretaría de Energía a escribir tres grandes Planes obligatorios (PLATEASE, PLADESE y PLADESHi).',
                extracto: '"Corresponde a la Secretaría: I. Elaborar y publicar la Estrategia, el Programa Sectorial de Energía, el PLATEASE, el PLADESE, el PLADESHi y coordinar su ejecución, así como vigilar el cumplimiento…"',
            },
            {
                id: 'LB-Art-011',
                siglas: 'Ley', color: '#25D366', label: 'Estrategia', rol: 'La Meta Superior',
                descripcion: 'Muestra que todos los demás planes se rigen por las metas superiores de lograr usar energías que dañen menos nuestro planeta.',
                extracto: '"La Estrategia Nacional de Transición Energética debe de incluir las metas para Producción de Biocombustibles y energías limpias…"',
            },
            {
                id: 'LCFE-Art-016',
                siglas: 'LCFE', color: '#1E5B4F', label: 'Art. 16', rol: 'Programa de la CFE',
                descripcion: 'Manda que la principal empresa de luz de México haga su propio Plan a 5 años, sin contradecir las guías del gobierno.',
                extracto: '"El Programa de Desarrollo de la CFE se debe elaborar y actualizar anualmente, con un horizonte de cinco años... para garantizar el suministro de energía eléctrica al pueblo…"',
            },
            {
                id: 'LPEMEX-Art-017',
                siglas: 'Pemex', color: '#A57F2C', label: 'Art. 17', rol: 'Programa de Pemex',
                descripcion: 'La petrolera estatal debe organizar sus inversiones a cinco y quince años, siguiendo lo que ordene la política energética de la Secretaría.',
                extracto: '"El Programa de Desarrollo de Petróleos Mexicanos se debe elaborar con un horizonte de cinco años... para preservar la soberanía, seguridad, sostenibilidad, autosuficiencia y justicia energética de la Nación…"',
            },
            {
                id: 'RLPTE-Art-004',
                siglas: 'RLPTE', color: '#7a1b38', label: 'Art. 4', rol: 'Actos Administrativos',
                descripcion: 'A nivel práctico, cualquier permiso privado que se quiera dar para vender gasolina o poner una planta eólica, será rechazado si no coincide con los Planes Mayores.',
                extracto: '"La planeación vinculante… debe ser considerada por la Secretaría de Energía y la Comisión Nacional de Energía para el otorgamiento de asignaciones, contratos, permisos, concesiones y autorizaciones…"',
            },
            {
                id: 'LSE-Art-012',
                siglas: 'LSE', color: '#1E5B4F', label: 'Art. 12', rol: 'Sector Eléctrico',
                descripcion: 'A nivel eléctrico, ordena que el Estado sea la fuente del 54% de la luz del país, garantizando seguridad y que mande por encima de intereses privados.',
                extracto: '"La planeación del sector eléctrico tiene carácter vinculante… El Estado debe mantener al menos el cincuenta y cuatro por ciento del promedio de la energía inyectada a la red…"',
            },
            {
                id: 'LSH-Art-008',
                siglas: 'LSH', color: '#A57F2C', label: 'Art. 8', rol: 'Sector Hidrocarburos',
                descripcion: 'Mismo criterio obligatorio, pero para pozos y refinerías. No se hace lo que una empresa quiera, se hace lo que necesite el país.',
                extracto: '"La planeación del sector hidrocarburos tiene carácter vinculante y está a cargo de la Secretaría de Energía, autoridad que debe emitir el Plan de Desarrollo del Sector Hidrocarburos…"',
            },
            {
                id: 'LCNE-Art-007',
                siglas: 'LCNE', color: '#444', label: 'Art. 7', rol: 'Programa Sectorial',
                descripcion: 'Establece que incluso los reguladores están obligados a usar todos sus estudios científicos y económicos apoyando el Programa Sectorial, que es parte del Plan Nacional de Desarrollo de México.',
                extracto: '"Aportar elementos técnicos a la Secretaría para la formulación y seguimiento del Programa Sectorial de Energía y demás instrumentos de política pública en la materia…"',
            },
            {
                id: 'LCPE-Art-002',
                siglas: 'Regla', color: '#555', label: 'Consejo', rol: 'Órgano de Apoyo',
                descripcion: 'Define el Consejo de Planeación Energética como un grupo de especialistas que acompaña constantemente a la Secretaría en el análisis de que se cumplan las metas.',
                extracto: '"El Consejo de Planeación Energética es el órgano colegiado de carácter permanente que apoya a la Secretaría de Energía en la coordinación y seguimiento de la planeación energética nacional…"',
            },
        ],
        menciones: [
            { siglas: 'LSH', nombre: 'Legislación Petrolera', valor: 67, color: '#A57F2C' },
            { siglas: 'LSE', nombre: 'Legislación Eléctrica', valor: 50, color: '#1E5B4F' },
            { siglas: 'RLPTE', nombre: 'Reglamentos Complementarios', valor: 47, color: '#7a1b38' },
            { siglas: 'LPTE', nombre: 'Ley General de Planeación (Pilar)', valor: 27, color: '#9B2247' },
            { siglas: 'LCPE', nombre: 'Normativas de la Comisión/Consejos', valor: 13, color: '#555' },
        ],
    },
];

// ─── Estilos ──────────────────────────────────────────────────────────────────
let _stylesInjected = false;
function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    const s = document.createElement('style');
    s.id = 'analisis-styles';
    s.textContent = `
/* ── Análisis view ── */
.aview-back {
    display: inline-flex; align-items: center; gap: 0.375rem;
    font-size: 0.68rem; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase; color: #9B2247; cursor: pointer;
    background: none; border: none; padding: 0; margin-bottom: 1.5rem;
    transition: opacity 0.2s; font-family: 'Noto Sans', sans-serif;
}
.aview-back:hover { opacity: 0.65; }
.aview-header-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 600;
    color: #1a1a1a; line-height: 1.1; margin-bottom: 0.35rem;
}
.aview-header-sub {
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #9B2247; margin-bottom: 1.25rem;
    font-family: 'Noto Sans', sans-serif;
}
.aview-divider {
    display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem;
}
.aview-divider-line { flex: 1; height: 1px; background: #e5e7eb; }
.aview-divider-dot { width: 4px; height: 4px; border-radius: 9999px; background: #9B2247; opacity: 0.4; }

/* ── Topic card ── */
.atema-card {
    background: #fff; border: 1px solid rgba(0,0,0,0.07);
    border-radius: 1.25rem; overflow: hidden;
    box-shadow: 0 2px 24px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04);
    margin-bottom: 2rem;
}

/* ── Hero ── */
.atema-hero {
    padding: 2rem 2rem 1.75rem; position: relative; overflow: hidden;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    background: linear-gradient(135deg, #fff 60%, #fdf5f7 100%);
}
.atema-hero-bg {
    position: absolute; top: -0.5rem; right: 1rem;
    font-family: 'Cormorant Garamond', serif; font-size: 11rem;
    font-weight: 700; color: #9B2247; opacity: 0.04;
    line-height: 1; user-select: none; pointer-events: none;
}
.atema-num-row {
    display: flex; align-items: center; gap: 0.6rem;
    margin-bottom: 0.6rem;
}
.atema-num-badge {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: white; background: #9B2247;
    padding: 0.2rem 0.6rem; border-radius: 4px;
    font-family: 'Noto Sans', sans-serif;
}
.atema-num-label {
    font-size: 0.65rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: #9B224780;
    font-family: 'Noto Sans', sans-serif;
}
.atema-titulo {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.5rem, 3.5vw, 2.2rem); font-weight: 600;
    color: #1a1a1a; line-height: 1.15; margin-bottom: 0.75rem;
}
.atema-objetivo {
    font-family: 'Noto Sans', sans-serif; font-size: 0.82rem;
    color: #6b7280; line-height: 1.75; max-width: 580px; margin-bottom: 1.5rem;
}
.atema-metricas { display: flex; gap: 2rem; flex-wrap: wrap; }
.atema-metrica { display: flex; flex-direction: column; }
.atema-metrica-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem; font-weight: 600; color: #9B2247; line-height: 1;
}
.atema-metrica-lbl {
    font-size: 0.65rem; color: #9ca3af; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase; margin-top: 0.2rem;
    font-family: 'Noto Sans', sans-serif;
}
.atema-metrica-sep { width: 1px; background: #f0f0ee; align-self: stretch; margin: 0 0.25rem; }

/* ── Attributes ── */
.atema-atributos {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: #f3f4f6;
    border-top: 1px solid #f3f4f6;
}
.atema-attr {
    background: #fff; padding: 0.875rem 1.25rem;
    display: flex; flex-direction: column; gap: 0.3rem;
}
.atema-attr-head {
    display: flex; align-items: center; gap: 0.4rem; color: #9B2247;
}
.atema-attr-nombre {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: #9ca3af;
    font-family: 'Noto Sans', sans-serif;
}
.atema-attr-valor {
    font-size: 0.8rem; font-weight: 500; color: #374151;
    font-family: 'Noto Sans', sans-serif; line-height: 1.4;
}

/* ── Tabs ── */
.atema-tabs {
    display: flex; border-bottom: 1px solid #f3f4f6;
    padding: 0 1.5rem; background: #fafaf9; overflow-x: auto;
}
.atema-tab {
    padding: 0.9rem 1rem; font-size: 0.68rem; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af;
    cursor: pointer; border: none; background: none;
    border-bottom: 2px solid transparent; transition: color 0.2s, border-color 0.2s;
    white-space: nowrap; font-family: 'Noto Sans', sans-serif;
}
.atema-tab:hover { color: #6b7280; }
.atema-tab.active { color: #9B2247; border-bottom-color: #9B2247; }
.atema-tab-content { padding: 2rem; }
.atema-tab-panel.hidden { display: none; }

/* ── Flow diagram ── */
.aflujo {
    display: flex; flex-direction: column; align-items: center;
}
.aflujo-level { width: 100%; display: flex; flex-direction: column; align-items: center; }
.aflujo-rol {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.22em;
    color: #d1d5db; text-transform: uppercase; margin-bottom: 0.7rem;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-nodes { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; width: 100%; }
.aflujo-node {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 0.875rem 1rem; border: 1.5px solid; border-radius: 0.875rem;
    cursor: pointer; transition: transform 0.18s, box-shadow 0.18s;
    min-width: 90px; max-width: 155px; flex: 1; background: white;
}
.aflujo-node:hover { transform: translateY(-3px); }
.aflujo-node.anode-active {
    transform: translateY(-2px);
}
.aflujo-node-title {
    font-family: 'Cormorant Garamond', serif; font-size: 1.05rem;
    font-weight: 600; line-height: 1.1; margin-bottom: 0.25rem;
}
.aflujo-node-sub {
    font-size: 0.6rem; color: #6b7280; line-height: 1.35;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-node-refs {
    margin-top: 0.4rem; font-size: 0.56rem; font-weight: 600;
    letter-spacing: 0.04em; padding: 0.18rem 0.45rem; border-radius: 4px;
    opacity: 0.75; font-family: 'Noto Sans', sans-serif;
}
.aflujo-connector {
    display: flex; flex-direction: column; align-items: center; padding: 0.15rem 0;
}
.aflujo-conn-line { width: 1.5px; height: 16px; background: linear-gradient(to bottom, #e5e7eb, #9B224740); }
.aflujo-conn-badge {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: #9B2247; background: #9B22470d;
    border: 1px solid #9B224722; border-radius: 999px; padding: 0.15rem 0.65rem;
    margin: 0.2rem 0; font-family: 'Noto Sans', sans-serif;
}
.aflujo-conn-line2 { width: 1.5px; height: 10px; background: linear-gradient(to bottom, #9B224740, #e5e7eb); }
.aflujo-conn-arrow { font-size: 0.65rem; color: #d1d5db; line-height: 1; }

/* ── Node article panel ── */
.aflujo-panel {
    margin-top: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.875rem;
    overflow: hidden; width: 100%;
    animation: apanelIn 0.22s cubic-bezier(0.4,0,0.2,1);
}
@keyframes apanelIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}
.aflujo-panel-hdr {
    padding: 0.7rem 1rem; background: #fafaf9;
    border-bottom: 1px solid #f3f4f6;
    display: flex; align-items: center; justify-content: space-between;
}
.aflujo-panel-hdr-title {
    font-size: 0.66rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: #6b7280;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-close {
    font-size: 0.7rem; color: #9ca3af; cursor: pointer;
    background: none; border: none; padding: 0.1rem 0.35rem;
    border-radius: 4px; transition: color 0.15s; font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-close:hover { color: #9B2247; }
.aflujo-panel-art {
    padding: 0.875rem 1rem; border-bottom: 1px solid #f9f9f8;
    display: flex; flex-direction: column; gap: 0.25rem;
}
.aflujo-panel-art:last-child { border-bottom: none; }
.aflujo-panel-art-row {
    display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
}
.aflujo-pbadge {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em;
    padding: 0.15rem 0.45rem; border-radius: 4px; color: white;
}
.aflujo-panel-art-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.95rem; font-weight: 600; color: #374151;
}
.aflujo-panel-art-rol {
    margin-left: auto; font-size: 0.58rem; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-art-desc {
    font-size: 0.74rem; color: #6b7280; line-height: 1.55;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-art-btn {
    margin-top: 0.25rem; font-size: 0.64rem; font-weight: 600;
    color: #9B2247; background: none; border: 1px solid #9B224730;
    border-radius: 6px; padding: 0.22rem 0.65rem; cursor: pointer;
    align-self: flex-start; transition: all 0.15s; letter-spacing: 0.06em;
    font-family: 'Noto Sans', sans-serif;
}
.aflujo-panel-art-btn:hover { background: #9B224712; border-color: #9B224660; }

/* ── Article cards ── */
.aarts-grid { display: flex; flex-direction: column; gap: 1rem; }
.aart-card {
    border: 1px solid #e9eaeb; border-radius: 0.875rem;
    overflow: hidden; transition: box-shadow 0.2s;
}
.aart-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.07); }
.aart-head {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.875rem 1rem; background: #fafaf9;
    border-bottom: 1px solid #f3f4f6; flex-wrap: wrap;
}
.aart-badge {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.12em;
    padding: 0.2rem 0.55rem; border-radius: 5px; color: white;
}
.aart-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem; font-weight: 600; color: #1a1a1a;
}
.aart-rol {
    margin-left: auto; font-size: 0.58rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af;
    font-family: 'Noto Sans', sans-serif;
}
.aart-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.aart-desc { font-size: 0.8rem; color: #374151; line-height: 1.65; font-family: 'Noto Sans', sans-serif; }
.aart-extracto {
    font-family: 'Merriweather', serif; font-size: 0.75rem; color: #6b7280;
    line-height: 1.75; border-left: 2.5px solid; padding-left: 0.875rem;
    margin: 0; font-style: italic;
}
.aart-btn {
    align-self: flex-start; font-size: 0.66rem; font-weight: 600;
    padding: 0.33rem 0.875rem; border-radius: 6px; cursor: pointer;
    transition: all 0.15s; border: 1px solid; background: transparent;
    letter-spacing: 0.06em; font-family: 'Noto Sans', sans-serif;
}
.aart-btn:hover { opacity: 0.8; }

/* ── Bar chart ── */
.achart-intro {
    font-size: 0.78rem; color: #6b7280; margin-bottom: 1rem;
    font-family: 'Noto Sans', sans-serif; line-height: 1.6;
}
.achart { display: flex; flex-direction: column; gap: 0.875rem; }
.achart-row { display: flex; align-items: center; gap: 0.75rem; }
.achart-siglas {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em;
    color: #374151; width: 44px; flex-shrink: 0; text-align: right;
    font-family: 'Noto Sans', sans-serif;
}
.achart-bar-wrap {
    flex: 1; height: 28px; background: #f3f4f6; border-radius: 6px; overflow: hidden;
}
.achart-bar {
    height: 100%; border-radius: 6px; width: 0%;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex; align-items: center; padding-left: 0.65rem;
}
.achart-bar-label {
    font-size: 0.6rem; font-weight: 600; color: rgba(255,255,255,0.9);
    white-space: nowrap; overflow: hidden; font-family: 'Noto Sans', sans-serif;
}
.achart-val {
    font-size: 0.7rem; font-weight: 700; color: #374151;
    width: 28px; flex-shrink: 0; font-family: 'Noto Sans', sans-serif;
}
.achart-sub {
    font-size: 0.62rem; color: #9ca3af;
    margin-left: 44px; margin-top: -0.5rem;
    font-family: 'Noto Sans', sans-serif;
}
.achart-note {
    margin-top: 0.75rem; padding: 0.75rem 1rem;
    background: #fafaf9; border: 1px solid #f3f4f6; border-radius: 0.5rem;
    font-size: 0.7rem; color: #9ca3af; font-family: 'Noto Sans', sans-serif;
    line-height: 1.5;
}

/* ── Dark mode ── */
.dark-mode .atema-card { background: #1e1e1e; border-color: #2d2d2d; }
.dark-mode .atema-hero { background: linear-gradient(135deg, #1e1e1e 60%, #241018 100%); }
.dark-mode .atema-titulo { color: #f5f5f5; }
.dark-mode .atema-objetivo { color: #a3a3a3; }
.dark-mode .atema-attr { background: #1e1e1e; }
.dark-mode .atema-atributos { background: #2d2d2d; }
.dark-mode .atema-attr-valor { color: #d4d4d4; }
.dark-mode .atema-tabs { background: #1a1a1a; border-color: #2d2d2d; }
.dark-mode .atema-tab { color: #555; }
.dark-mode .atema-tab:hover { color: #737373; }
.dark-mode .atema-tab-content { background: #1e1e1e; }
.dark-mode .atema-metrica-lbl { color: #555; }
.dark-mode .aflujo-node { background: #252525; }
.dark-mode .aflujo-node-title { color: #f0f0f0; }
.dark-mode .aflujo-node-sub { color: #737373; }
.dark-mode .aflujo-rol { color: #444; }
.dark-mode .aflujo-panel { border-color: #2d2d2d; }
.dark-mode .aflujo-panel-hdr { background: #1a1a1a; border-color: #2d2d2d; }
.dark-mode .aflujo-panel-art { border-color: #252525; }
.dark-mode .aflujo-panel-art-label { color: #d4d4d4; }
.dark-mode .aflujo-panel-art-desc { color: #737373; }
.dark-mode .aart-card { border-color: #2d2d2d; }
.dark-mode .aart-head { background: #1a1a1a; border-color: #2d2d2d; }
.dark-mode .aart-label { color: #f5f5f5; }
.dark-mode .aart-body { background: #1e1e1e; }
.dark-mode .aart-desc { color: #d4d4d4; }
.dark-mode .aart-extracto { color: #737373; }
.dark-mode .achart-bar-wrap { background: #2d2d2d; }
.dark-mode .achart-siglas { color: #d4d4d4; }
.dark-mode .achart-val { color: #d4d4d4; }
.dark-mode .achart-intro { color: #737373; }
.dark-mode .achart-sub { color: #555; }
.dark-mode .achart-note { background: #1a1a1a; border-color: #2d2d2d; color: #555; }
.dark-mode .aview-header-title { color: #f5f5f5; }
.dark-mode .aview-divider-line { background: #2d2d2d; }

@media (max-width: 640px) {
    .atema-hero { padding: 1.5rem 1.25rem 1.25rem; }
    .atema-tab-content { padding: 1.25rem; }
    .atema-atributos { grid-template-columns: repeat(2, 1fr); }
    .aflujo-node { min-width: 80px; padding: 0.65rem 0.75rem; }
    .aflujo-node-title { font-size: 0.9rem; }
    .atema-metricas { gap: 1.25rem; }
}
@media (max-width: 400px) {
    .atema-atributos { grid-template-columns: 1fr; }
}
    `;
    document.head.appendChild(s);
}

// ─── Render functions ─────────────────────────────────────────────────────────
function renderHero(tema) {
    const seps = tema.metricas.map((m, i) => i === tema.metricas.length - 1
        ? `<div class="atema-metrica"><div class="atema-metrica-val">${m.valor}</div><div class="atema-metrica-lbl">${m.label}</div></div>`
        : `<div class="atema-metrica"><div class="atema-metrica-val">${m.valor}</div><div class="atema-metrica-lbl">${m.label}</div></div><div class="atema-metrica-sep"></div>`
    ).join('');
    return `
        <div class="atema-hero">
            <div class="atema-hero-bg" aria-hidden="true">§</div>
            <div class="atema-num-row">
                <span class="atema-num-badge">Tema ${tema.numero}</span>
                <span class="atema-num-label">${tema.subtitulo}</span>
            </div>
            <h2 class="atema-titulo">${tema.titulo}</h2>
            <p class="atema-objetivo">${tema.objetivo}</p>
            <div class="atema-metricas">${seps}</div>
        </div>`;
}

function renderAtributos(tema) {
    return `
        <div class="atema-atributos">
            ${tema.atributos.map(a => `
                <div class="atema-attr">
                    <div class="atema-attr-head">
                        <span style="color:${tema.color}">${ICONS[a.tipo] || ICONS.gov}</span>
                        <span class="atema-attr-nombre">${a.nombre}</span>
                    </div>
                    <div class="atema-attr-valor">${a.valor}</div>
                </div>`).join('')}
        </div>`;
}

function renderTabBar(tema) {
    return `
        <div class="atema-tabs">
            <button class="atema-tab active" data-target="tab-cadena-${tema.id}">Cadena de Vinculación</button>
            <button class="atema-tab" data-target="tab-articulos-${tema.id}">Artículos Clave</button>
            <button class="atema-tab" data-target="tab-menciones-${tema.id}">Menciones por Ley</button>
        </div>`;
}

function renderNodo(nodo) {
    return `
        <div class="aflujo-node" data-node-id="${nodo.id}" data-articles="${nodo.articulos.join(',')}"
            style="border-color:${nodo.color}45">
            <div class="aflujo-node-title" style="color:${nodo.color}">${nodo.titulo}</div>
            <div class="aflujo-node-sub">${nodo.descripcion}</div>
            <div class="aflujo-node-refs" style="background:${nodo.color}14;color:${nodo.color}">${nodo.refs}</div>
        </div>`;
}

function renderFlujoDiagrama(tema) {
    const rows = tema.cadena.map(nivel => `
        <div class="aflujo-level">
            <div class="aflujo-rol">${nivel.rol}</div>
            <div class="aflujo-nodes">${nivel.nodos.map(renderNodo).join('')}</div>
        </div>
        ${nivel.conector ? `
        <div class="aflujo-connector">
            <div class="aflujo-conn-line"></div>
            <div class="aflujo-conn-badge">${nivel.conector}</div>
            <div class="aflujo-conn-line2"></div>
            <div class="aflujo-conn-arrow">▾</div>
        </div>` : ''}
    `).join('');
    return `
        <div class="aflujo" id="flujo-${tema.id}">${rows}
            <div id="flujo-panel-${tema.id}" class="aflujo-panel hidden"></div>
        </div>
        <p style="margin-top:1.25rem;font-size:0.66rem;color:#9ca3af;text-align:center;font-family:'Noto Sans',sans-serif;">
            Haz clic en cualquier nodo para ver los artículos que fundamentan esa relación
        </p>`;
}

function renderArticulosClave(tema) {
    return `
        <div class="aarts-grid">
            ${tema.articulosClave.map(art => `
                <div class="aart-card">
                    <div class="aart-head">
                        <span class="aart-badge" style="background:${art.color}">${art.siglas}</span>
                        <span class="aart-label">${art.label}</span>
                        <span class="aart-rol">${art.rol}</span>
                    </div>
                    <div class="aart-body">
                        <p class="aart-desc">${art.descripcion}</p>
                        <blockquote class="aart-extracto" style="border-color:${art.color}50">${art.extracto}</blockquote>
                        <button class="aart-btn" data-open-article="${art.id}"
                            style="color:${art.color};border-color:${art.color}35">
                            Ver artículo completo →
                        </button>
                    </div>
                </div>`).join('')}
        </div>`;
}

function renderMenciones(tema) {
    const max = Math.max(...tema.menciones.map(m => m.valor));
    return `
        <p class="achart-intro">
            Artículos con términos relacionados a <em>planeación vinculante</em>, <em>planeación</em>
            y <em>vinculante</em> en cada instrumento normativo. Refleja la densidad regulatoria del concepto.
        </p>
        <div class="achart" id="chart-${tema.id}">
            ${tema.menciones.map(m => `
                <div>
                    <div class="achart-row">
                        <div class="achart-siglas">${m.siglas}</div>
                        <div class="achart-bar-wrap">
                            <div class="achart-bar" data-target="${Math.round(m.valor / max * 100)}"
                                style="background:${m.color}">
                                <span class="achart-bar-label">${m.nombre}</span>
                            </div>
                        </div>
                        <div class="achart-val">${m.valor}</div>
                    </div>
                    <div class="achart-sub">${m.nombre}</div>
                </div>`).join('')}
        </div>
        <div class="achart-note">
            * Conteo de artículos que contienen al menos un término del campo semántico de planeación vinculante.
            No equivale al número de veces que aparece la frase exacta en el texto.
        </div>`;
}

function renderTemaCard(tema) {
    return `
        <div class="atema-card" id="tema-${tema.id}">
            ${renderHero(tema)}
            ${renderAtributos(tema)}
            ${renderTabBar(tema)}
            <div class="atema-tab-content">
                <div id="tab-cadena-${tema.id}" class="atema-tab-panel">
                    ${renderFlujoDiagrama(tema)}
                </div>
                <div id="tab-articulos-${tema.id}" class="atema-tab-panel hidden">
                    ${renderArticulosClave(tema)}
                </div>
                <div id="tab-menciones-${tema.id}" class="atema-tab-panel hidden">
                    ${renderMenciones(tema)}
                </div>
            </div>
        </div>`;
}

// ─── Panel de artículos del nodo ──────────────────────────────────────────────
function showNodePanel(container, tema, nodo) {
    const panel = container.querySelector(`#flujo-panel-${tema.id}`);
    if (!panel) return;

    const artMap = {};
    tema.articulosClave.forEach(a => { artMap[a.id] = a; });
    const articles = nodo.articulos.map(id => artMap[id]).filter(Boolean);

    // Toggle si es el mismo nodo
    if (panel.dataset.activeNode === nodo.id && !panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
        panel.dataset.activeNode = '';
        container.querySelectorAll('.aflujo-node').forEach(n => {
            n.classList.remove('anode-active');
            n.style.boxShadow = '';
        });
        return;
    }

    // Marcar nodo activo
    container.querySelectorAll('.aflujo-node').forEach(n => {
        n.classList.remove('anode-active');
        n.style.boxShadow = '';
    });
    const nodeEl = container.querySelector(`[data-node-id="${nodo.id}"]`);
    if (nodeEl) {
        nodeEl.classList.add('anode-active');
        nodeEl.style.boxShadow = `0 6px 22px ${nodo.color}30`;
    }
    panel.dataset.activeNode = nodo.id;

    if (articles.length === 0) {
        panel.innerHTML = `<div style="padding:1rem;text-align:center;font-size:0.75rem;color:#9ca3af">Sin artículos específicos para este nodo.</div>`;
        panel.classList.remove('hidden');
        return;
    }

    panel.innerHTML = `
        <div class="aflujo-panel-hdr">
            <span class="aflujo-panel-hdr-title">Artículos relacionados · ${nodo.titulo}</span>
            <button class="aflujo-panel-close" data-close-panel="${tema.id}">✕ cerrar</button>
        </div>
        <div>
            ${articles.map(art => `
                <div class="aflujo-panel-art">
                    <div class="aflujo-panel-art-row">
                        <span class="aflujo-pbadge" style="background:${art.color}">${art.siglas}</span>
                        <span class="aflujo-panel-art-label">${art.label}</span>
                        <span class="aflujo-panel-art-rol">${art.rol}</span>
                    </div>
                    <p class="aflujo-panel-art-desc">${art.descripcion}</p>
                    <button class="aflujo-panel-art-btn" data-open-article="${art.id}">
                        Ver artículo completo →
                    </button>
                </div>`).join('')}
        </div>`;

    panel.classList.remove('hidden');
    setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);

    // Botón cerrar
    panel.querySelector(`[data-close-panel="${tema.id}"]`)?.addEventListener('click', () => {
        panel.classList.add('hidden');
        panel.dataset.activeNode = '';
        container.querySelectorAll('.aflujo-node').forEach(n => {
            n.classList.remove('anode-active');
            n.style.boxShadow = '';
        });
    });

    // Botones artículo en el panel
    attachArticleButtons(panel, tema);
}

// ─── Helpers de eventos ───────────────────────────────────────────────────────
function attachArticleButtons(root, tema) {
    root.querySelectorAll('[data-open-article]').forEach(btn => {
        btn.addEventListener('click', () => {
            const list = tema.articulosClave.map(a => a.id);
            document.dispatchEvent(new CustomEvent('analisis:openArticle', {
                detail: { id: btn.dataset.openArticle, list },
            }));
        });
    });
}

function animateBars(container) {
    container.querySelectorAll('.achart-bar').forEach(bar => {
        const target = bar.dataset.target;
        if (target) setTimeout(() => { bar.style.width = target + '%'; }, 60);
    });
}

function setupTemaEvents(container, tema) {
    // Tab switching
    container.querySelectorAll('.atema-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.atema-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.target;
            container.querySelectorAll('.atema-tab-panel').forEach(p => {
                p.classList.toggle('hidden', p.id !== target);
            });
            if (target?.includes('menciones')) animateBars(container);
        });
    });

    // Flow diagram node clicks
    container.querySelectorAll('.aflujo-node').forEach(nodeEl => {
        nodeEl.addEventListener('click', () => {
            const nodeId = nodeEl.dataset.nodeId;
            const nivel = tema.cadena.find(n => n.nodos.some(nd => nd.id === nodeId));
            const nodo = nivel?.nodos.find(nd => nd.id === nodeId);
            if (nodo) showNodePanel(container, tema, nodo);
        });
    });

    // Article buttons in "Artículos Clave" tab
    attachArticleButtons(container, tema);

    // IntersectionObserver for auto-animating bars when scrolled into view
    const chartEl = container.querySelector(`#chart-${tema.id}`);
    if (chartEl && 'IntersectionObserver' in window) {
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { animateBars(container); obs.disconnect(); }
        }, { threshold: 0.2 });
        obs.observe(chartEl);
    }
}

// ─── Export principal ─────────────────────────────────────────────────────────
export function renderAnalisisView(container) {
    injectStyles();

    container.innerHTML = `
        <div style="max-width:720px;margin:0 auto;padding-bottom:3rem">
            <button class="aview-back" id="analisis-back-btn">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Inicio
            </button>
            <h1 class="aview-header-title">
                Análisis de <em style="color:#9B2247;font-style:italic">Temas Transversales</em>
            </h1>
            <p class="aview-header-sub">Marco Legal Energético · SENER · México</p>
            <div class="aview-divider">
                <div class="aview-divider-line"></div>
                <div class="aview-divider-dot"></div>
                <div class="aview-divider-line"></div>
            </div>
            ${TEMAS.map(renderTemaCard).join('')}
        </div>`;

    container.querySelector('#analisis-back-btn')?.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('analisis:goHome'));
    });

    TEMAS.forEach(tema => setupTemaEvents(container, tema));
}
