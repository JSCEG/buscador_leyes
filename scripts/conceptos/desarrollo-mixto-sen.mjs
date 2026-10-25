/**
 * Arquitectura del Sistema Eléctrico Nacional (Reforma 2025): Planeación vinculante (PLADESE),
 * prevalencia estatal >= 54 %, Esquemas de Desarrollo Mixto (PLP e Inversión Mixta), baterías SAEE
 * y exclusividad estatal en RNT/RGD. Construido con visual-explainer.
 */
import { themeOf, writeVeFigure } from "./_ve-shared.mjs";

const theme = themeOf();

const body = `
  <header>
    <p class="eyebrow">Arquitectura Legal y Operativa · LSE y RLSE (2025)</p>
    <h1>El Estado mantiene al menos el <span class="num">54&nbsp;%</span> de la inyección anual a la red</h1>
    <p class="lead">La <b>Planeación Vinculante de SENER (PLADESE)</b> ordena qué centrales se construyen, la <b>CNE</b> otorga los permisos (≥&nbsp;0.7&nbsp;MW) y <b>CFE</b> se asocia con particulares mediante <b>Esquemas de Desarrollo Mixto</b>.</p>
  </header>

  <section class="kpis" aria-label="Indicadores clave del modelo eléctrico 2025">
    <div class="kpi">
      <span class="ve-label">Inyección anual a la red (LSE arts. 1 y 36)</span>
      <span class="val"><span data-count="54">54</span><span class="unit">% mín. Estado</span></span>
      <ve-waffle value="54" note="≤ 46 % privados" label="Al menos 54 de cada 100 MWh inyectados al SEN corresponden al Estado y hasta 46 a particulares"></ve-waffle>
    </div>
    <div class="kpi">
      <span class="ve-label">Participación estatal por modalidad (LSE arts. 38–40)</span>
      <span class="val"><span data-count="54">54</span><span class="unit">% capital CFE</span></span>
      <ve-bars unit="%" label="Porcentaje de participación o compra de CFE por esquema">
        <ve-bar value="100">CFE propia</ve-bar>
        <ve-bar value="54" hot>Inv. Mixta</ve-bar>
        <ve-bar value="100">Compra PLP</ve-bar>
        <ve-bar value="46">Tope priv.</ve-bar>
      </ve-bars>
    </div>
    <div class="kpi">
      <span class="ve-label">Umbrales de permiso ante CNE (LSE arts. 19 y 30)</span>
      <span class="val"><span data-count="0.7">0.7</span><span class="unit">MW permiso</span></span>
      <ve-bars unit="MW" label="Umbrales regulatorios de generación y autoconsumo">
        <ve-bar value="0.7" hot>Exento &lt;</ve-bar>
        <ve-bar value="20">Simplif. ≤</ve-bar>
      </ve-bars>
    </div>
  </section>

  <figure class="ve-steps" id="sen-stepper">
    <div class="ve-controls-bar" role="group" aria-label="Filtrar régimen del SEN">
      <div class="ve-chips">
        <button type="button" data-mode="all" aria-pressed="true">Vista integral SEN</button>
        <button type="button" data-mode="cfe" aria-pressed="false" data-ref="cfe">② CFE ≥ 54 %</button>
        <button type="button" data-mode="mixto" aria-pressed="false" data-ref="mixto">③ Desarrollo Mixto</button>
        <button type="button" data-mode="priv" aria-pressed="false" data-ref="priv">④ Privados ≤ 46 %</button>
        <button type="button" data-mode="saee" aria-pressed="false" data-ref="saee">⑤ Baterías SAEE</button>
      </div>
      <span class="meta">Haz clic en cualquier bloque numerado ①–⑥ para ver su detalle</span>
    </div>

    <div class="frame">
      <svg class="ve-svg" viewBox="0 0 960 500" role="img" aria-label="Arquitectura del Sistema Eléctrico Nacional 2025: Rectoría SENER y CNE arriba, cuatro bloques de generación y almacenamiento al centro (CFE >= 54%, Desarrollo Mixto, Privados <= 46%, Baterías SAEE) y la Red Nacional de Transmisión y Distribución exclusiva del Estado abajo.">
        <!-- Zonas de jurisdicción con margen amplio -->
        <rect class="ve-zone" x="16" y="12" width="928" height="104" rx="10" data-s="1 2 3 4 5"/>
        <text class="ve-zone-title" x="32" y="31" data-s="1 2 3 4 5">NIVEL 1 · RECTORÍA, PLANEACIÓN VINCULANTE Y REGULACIÓN (LPTE · LSE · LCNE)</text>

        <rect class="ve-zone" x="16" y="160" width="928" height="182" rx="10" data-s="2 3 4 5"/>
        <text class="ve-zone-title" x="32" y="180" data-s="2 3 4 5">NIVEL 2 · GENERACIÓN Y ALMACENAMIENTO SUJETOS AL PLADESE (BALANCE ANUAL ≥ 54 % ESTADO / ≤ 46 % PRIVADOS)</text>

        <rect class="ve-zone" x="16" y="384" width="928" height="102" rx="10" data-s="1 2 3 4 5"/>
        <text class="ve-zone-title" x="32" y="403" data-s="1 2 3 4 5">NIVEL 3 · ÁREA ESTRATÉGICA EXCLUSIVA DEL ESTADO (ARTS. 27 Y 28 CPEUM · ART. 57 LSE)</text>

        <!-- Rutas invisibles para puntos de flujo animados -->
        <path data-flow="hit" data-every="480" d="M135 250V444H480"/>
        <path data-flow="hit" data-every="620" d="M370 250V444H480"/>
        <path data-flow="miss" data-every="980" d="M608 250V444H480"/>
        <path data-flow="hit" data-every="850" d="M830 250V444H480"/>

        <!-- Flechas de gobernanza (Nivel 1 -> Nivel 2, canal y=104 a y=194) -->
        <path class="ve-e is-hot" data-s="1" data-ref="gob" d="M306 73H356"/>
        <text class="ve-el" data-s="1" x="331" y="64">PLADESE</text>

        <path class="ve-e is-hot" data-s="1" data-ref="gob" d="M616 73H666"/>
        <text class="ve-el" data-s="1" x="641" y="64">Reglas</text>

        <path class="ve-e is-async" data-s="1 3" data-ref="gob mixto" d="M168 104V194"/>
        <text class="ve-el r" data-s="1 3" x="176" y="142">Convoca</text>

        <path class="ve-e is-async" data-s="1 3 4" data-ref="gob mixto priv" d="M486 104V194"/>
        <text class="ve-el r" data-s="1 3 4" x="494" y="142">Permisos ≥0.7 MW</text>

        <path class="ve-e is-async" data-s="2 5" data-ref="gob cfe saee" d="M796 104V194"/>
        <text class="ve-el r" data-s="2 5" x="804" y="142">Despacho 60 Hz</text>

        <!-- Flechas de inyección a la Red Nacional (Nivel 2 -> Nivel 3, canal y=296 a y=414) -->
        <path class="ve-e is-hot" data-s="2 5" data-ref="cfe" d="M135 296V414"/>
        <text class="ve-el r" data-s="2 5" x="143" y="366">Base y firme</text>

        <path class="ve-e is-hot" data-s="3 5" data-ref="mixto" d="M370 296V414"/>
        <text class="ve-el r" data-s="3 5" x="378" y="366">PLP + Inv. Mixta</text>

        <path class="ve-e" data-s="4 5" data-ref="priv" d="M608 296V414"/>
        <text class="ve-el r" data-s="4 5" x="616" y="366">MEM ≤ 46 %</text>

        <path class="ve-e is-hot" data-s="4 5" data-ref="saee" d="M830 296V414"/>
        <text class="ve-el r" data-s="4 5" x="838" y="366">Potencia y red</text>

        <g class="ve-dots" aria-hidden="true"></g>

        <!-- Nodos Nivel 1: SENER, CNE, CENACE -->
        <g class="ve-n is-key" data-n="1" data-s="1" data-ref="gob" tabindex="0" role="button" aria-label="1. SENER: Planeación vinculante PLADESE" transform="translate(34 42)">
          <rect class="sh" width="272" height="62" rx="8"/>
          <text class="ve-kind" x="136" y="18">RECTORÍA · LPTE ART. 21</text>
          <text x="136" y="36">SENER (PLADESE)</text>
          <text class="sub" x="136" y="52">Planeación vinculante</text>
        </g>
        <g class="ve-co" data-n="1" data-s="1" transform="translate(290 58)"><circle r="10"/><text>1</text></g>

        <g class="ve-n is-key" data-n="1" data-s="1" data-ref="gob" tabindex="0" role="button" aria-label="1. CNE: Permisos de generación y tarifas" transform="translate(356 42)">
          <rect class="sh" width="260" height="62" rx="8"/>
          <text class="ve-kind" x="130" y="18">ÓRGANO REGULADOR</text>
          <text x="130" y="36">CNE (LCNE art. 7)</text>
          <text class="sub" x="130" y="52">Permisos y tarifas</text>
        </g>

        <g class="ve-n" data-s="1 2 5" data-ref="gob" transform="translate(666 42)">
          <rect class="sh" width="260" height="62" rx="8"/>
          <text class="ve-kind" x="130" y="18">OPERADOR INDEPENDIENTE</text>
          <text x="130" y="36">CENACE (LSE art. 111)</text>
          <text class="sub" x="130" y="52">Control operativo y MEM</text>
        </g>

        <!-- Nodos Nivel 2: CFE, Desarrollo Mixto, Privados, SAEE -->
        <g class="ve-n is-key" data-n="2" data-s="2" data-ref="cfe" tabindex="0" role="button" aria-label="2. Generación estatal CFE >= 54%" transform="translate(32 194)">
          <rect class="sh" width="206" height="102" rx="8"/>
          <text class="ve-kind" x="103" y="20">EMPRESA PÚBLICA</text>
          <text x="103" y="42">CFE Generación</text>
          <text class="sub" x="103" y="64">Mínimo ≥ 54 % inyección</text>
          <text class="sub" x="103" y="83">LSE arts. 1, 6 y 36</text>
        </g>
        <g class="ve-co" data-n="2" data-s="2" transform="translate(222 210)"><circle r="10"/><text>2</text></g>

        <g class="ve-n is-key" data-n="3" data-s="3" data-ref="mixto" tabindex="0" role="button" aria-label="3. Esquemas de Desarrollo Mixto" transform="translate(258 194)">
          <rect class="sh" width="226" height="102" rx="8"/>
          <text class="ve-kind" x="113" y="20">CFE + PRIVADO</text>
          <text x="113" y="42">Desarrollo Mixto</text>
          <text class="sub" x="113" y="64">• PLP: venta 100 % a CFE</text>
          <text class="sub" x="113" y="83">• Inv. Mixta: CFE ≥ 54 %</text>
        </g>
        <g class="ve-co" data-n="3" data-s="3" transform="translate(468 210)"><circle r="10"/><text>3</text></g>

        <g class="ve-n" data-n="4" data-s="4" data-ref="priv" tabindex="0" role="button" aria-label="4. Generación privada <= 46%" transform="translate(504 194)">
          <rect class="sh" width="206" height="102" rx="8"/>
          <text class="ve-kind" x="103" y="20">PARTICIPANTES MEM</text>
          <text x="103" y="42">Privados y Autoconsumo</text>
          <text class="sub" x="103" y="64">Hasta ≤ 46 % en red</text>
          <text class="sub" x="103" y="83">Migración de legados</text>
        </g>
        <g class="ve-co" data-n="4" data-s="4" transform="translate(694 210)"><circle r="10"/><text>4</text></g>

        <g class="ve-n is-new" data-n="5" data-s="4 5" data-ref="saee" tabindex="0" role="button" aria-label="5. Almacenamiento en baterías SAEE" transform="translate(730 194)">
          <rect class="sh" width="198" height="102" rx="8"/>
          <text class="ve-kind" x="99" y="20">NUEVA FIGURA · ART. 82</text>
          <text x="99" y="42">Baterías (SAEE)</text>
          <text class="sub" x="99" y="64">Firmeza a renovables</text>
          <text class="sub" x="99" y="83">Servicios conexos 60 Hz</text>
        </g>
        <g class="ve-co" data-n="5" data-s="4 5" transform="translate(912 210)"><circle r="10"/><text>5</text></g>

        <!-- Cotas de proporción (Dimension rails) -->
        <g class="ve-dim is-key" data-s="2 3 5">
          <path class="ext" d="M32 302V328M484 302V328"/>
          <path class="ln" d="M32 322H484M28 326l8-8M480 326l8-8"/>
          <text x="258" y="316">Prevalencia Estatal ≥ 54 % (CFE + Desarrollo Mixto)</text>
        </g>
        <g class="ve-dim" data-s="4 5">
          <path class="ext" d="M504 302V328M710 302V328"/>
          <path class="ln" d="M504 322H710M500 326l8-8M706 326l8-8"/>
          <text x="607" y="316">Privados ≤ 46 %</text>
        </g>

        <!-- Nodo Nivel 3: RNT y RGD exclusivas del Estado -->
        <g class="ve-n is-key" data-n="6" data-s="1 2 3 4 5" data-ref="cfe gob" tabindex="0" role="button" aria-label="6. RNT y RGD Exclusivas del Estado" transform="translate(32 414)">
          <rect class="sh" width="896" height="58" rx="8"/>
          <text class="ve-kind" x="448" y="18">RED NACIONAL DE TRANSMISIÓN (RNT) Y REDES GENERALES DE DISTRIBUCIÓN (RGD)</text>
          <text x="448" y="40">Exclusivas del Estado (CFE) · Acceso abierto sujeto a factibilidad → Suministro Básico y Usuarios Calificados</text>
        </g>
        <g class="ve-co" data-n="6" data-s="1 2 3 4 5" transform="translate(912 430)"><circle r="10"/><text>6</text></g>
      </svg>
    </div>

    <div class="ve-player">
      <ol class="ve-cap">
        <li data-n="1/5"><b>① Planeación Vinculante (PLADESE):</b> La SENER determina las necesidades de capacidad del SEN (LPTE art. 21; LSE art. 12) y la CNE otorga los permisos de generación para centrales ≥ 0.7 MW (LSE art. 19).</li>
        <li data-n="2/5"><b>② Prevalencia Estatal (CFE ≥ 54 %):</b> La CFE, como Empresa Pública del Estado, debe mantener al menos el 54 % del promedio de la energía inyectada a la red en un año calendario (LSE arts. 1, 6 y 36).</li>
        <li data-n="3/5"><b>③ Esquemas de Desarrollo Mixto:</b> Para expandir capacidad con inversión privada, la LSE (arts. 38–40) crea dos vías alineadas al PLADESE: <b>Producción de Largo Plazo (PLP)</b> y <b>Inversión Mixta (CFE ≥ 54 % capital)</b>.</li>
        <li data-n="4/5"><b>④ Participación Privada (≤ 46 %) y ⑤ Baterías (SAEE):</b> Los particulares participan en el MEM, en autoconsumo o migrando permisos legados, complementados por Sistemas de Almacenamiento (SAEE, arts. 82–85).</li>
        <li data-n="5/5"><b>⑥ Redes Exclusivas (RNT/RGD) y Justicia Energética:</b> Toda la energía fluye por la Red Nacional de Transmisión y Distribución operada en exclusiva por el Estado (LSE art. 57) hacia hogares e industrias.</li>
      </ol>
      <button type="button" data-go="-1">← Anterior</button>
      <button type="button" data-play>▶ Paso a paso</button>
      <input type="range" min="0" max="4" value="4" aria-label="Paso de la explicación">
      <button type="button" data-go="1">Siguiente →</button>
    </div>
  </figure>

  <section aria-labelledby="sen-cases-title">
    <div class="sec-head">
      <p class="ve-label caps">Comparativa de figuras (LSE arts. 19, 30 y 38–40)</p>
      <h2 id="sen-cases-title">Las 4 vías para generar electricidad bajo la Ley del Sector Eléctrico</h2>
    </div>
    <div class="cases">
      <article class="case" data-st="ok" data-n="2" data-ref="cfe" tabindex="0" role="button">
        <span class="chip ok">② 100 % Estatal</span>
        <h3>Generación propia CFE</h3>
        <svg class="ve-mini" viewBox="0 0 260 76" role="img" aria-label="CFE financia, opera e inyecta directo al SEN">
          <path class="ve-e is-st" d="M116 38H144"/>
          <g class="ve-n is-st" transform="translate(6 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">CFE</text><text class="sub" x="55" y="41">100 % pública</text></g>
          <g class="ve-n" transform="translate(144 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">Red SEN</text><text class="sub" x="55" y="41">Suministro</text></g>
        </svg>
        <p class="ve-label">Inversión presupuestaria de la Empresa Pública del Estado para sostener el piso del 54 %.</p>
      </article>

      <article class="case" data-st="ok" data-n="3" data-ref="mixto" tabindex="0" role="button">
        <span class="chip ok">③ Desarrollo Mixto · Art. 39</span>
        <h3>Producción de Largo Plazo (PLP)</h3>
        <svg class="ve-mini" viewBox="0 0 260 76" role="img" aria-label="Privado construye y vende 100% a CFE">
          <path class="ve-e is-st" d="M116 38H144"/>
          <g class="ve-n" transform="translate(6 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">Privado</text><text class="sub" x="55" y="41">Financia 100 %</text></g>
          <g class="ve-n is-st" transform="translate(144 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">CFE compra</text><text class="sub" x="55" y="41">100 % energía</text></g>
        </svg>
        <p class="ve-label">Sin inversión presupuestaria de CFE; venta exclusiva del 100 % de energía y productos a CFE (RLSE art. 68).</p>
      </article>

      <article class="case" data-st="warn" data-n="3" data-ref="mixto" tabindex="0" role="button">
        <span class="chip warn">③ Desarrollo Mixto · Art. 40</span>
        <h3>Inversión Mixta (CFE ≥ 54 %)</h3>
        <svg class="ve-mini" viewBox="0 0 260 76" role="img" aria-label="Sociedad vehículo con CFE al menos 54% y privado hasta 46%">
          <path class="ve-e is-st" d="M116 38H144"/>
          <g class="ve-n is-st" transform="translate(6 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">CFE ≥ 54 %</text><text class="sub" x="55" y="41">Sociedad Mixta</text></g>
          <g class="ve-n" transform="translate(144 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">Socio ≤ 46 %</text><text class="sub" x="55" y="41">Capital / Tecnol.</text></g>
        </svg>
        <p class="ve-label">CFE aporta activos, permisos o capital conservando ≥ 54 % del capital común o gobierno corporativo (RLSE art. 86).</p>
      </article>

      <article class="case" data-st="warn" data-n="4" data-ref="priv" tabindex="0" role="button">
        <span class="chip warn">④ Participación Privada</span>
        <h3>MEM y Autoconsumo (≤ 46 %)</h3>
        <svg class="ve-mini" viewBox="0 0 260 76" role="img" aria-label="Permisionario CNE vende en el MEM o autoconsume">
          <path class="ve-e is-st" d="M116 38H144"/>
          <g class="ve-n" transform="translate(6 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">Permiso CNE</text><text class="sub" x="55" y="41">≥ 0.7 MW</text></g>
          <g class="ve-n is-st" transform="translate(144 12)"><rect class="sh" width="110" height="52" rx="6"/><text x="55" y="24">MEM / Sitio</text><text class="sub" x="55" y="41">Sujeto a cupo</text></g>
        </svg>
        <p class="ve-label">Generación para el MEM alineada al PLADESE, o Autoconsumo (exento &lt; 0.7 MW; trámite simplificado 0.7–20 MW).</p>
      </article>
    </div>
  </section>
`;

const live = `
{
  const chips = [...document.querySelectorAll(".ve-chips [data-mode]")];
  const mapPart = { cfe: 2, mixto: 3, priv: 4, saee: 5 };
  chips.forEach((btn) => {
    btn.addEventListener("click", () => {
      chips.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      const mode = btn.dataset.mode;
      const svg = document.querySelector(".ve-steps svg");
      const allRef = [...document.querySelectorAll("[data-ref]")];
      if (mode === "all") {
        svg?.classList.remove("has-lit");
        allRef.forEach((el) => el.classList.remove("is-lit"));
      } else {
        svg?.classList.add("has-lit");
        allRef.forEach((el) => {
          const refs = (el.dataset.ref || "").split(" ");
          el.classList.toggle("is-lit", refs.includes(mode));
        });
        if (mapPart[mode] && parent !== window) {
          parent.postMessage({ type: "concepto-part", id: "desarrollo-mixto-sen", figura: "desarrollo-mixto-sen", n: mapPart[mode] }, location.origin);
        }
      }
    });
  });
}
`;

writeVeFigure({
  id: "desarrollo-mixto-sen",
  title: "Planeación vinculante, regla 54/46 y Desarrollo Mixto",
  theme,
  register: "blueprint",
  body,
  live,
});
