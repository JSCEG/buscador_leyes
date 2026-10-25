/**
 * Cadena de valor, permisos y formación del precio de la gasolina en México (LSH / RLSH / LIF):
 * Referencia internacional, internación, logística TAR/ducto, estímulo fiscal al IEPS e IVA,
 * y expendio al público en estación de servicio (CNE / ASEA / Profeco).
 * Construido con visual-explainer.
 */
import { themeOf, writeVeFigure } from "./_ve-shared.mjs";

const theme = themeOf();

const body = `
  <header>
    <p class="eyebrow">Cadena Downstream y Formación de Precios · LSH, RLSH y LIF</p>
    <h1>De la molécula al dispensario: cómo el estímulo al <span class="num">IEPS</span> amortigua un litro de gasolina</h1>
    <p class="lead">El precio final suma el costo de la <b>molécula</b>, <b>internación</b>, <b>logística en ductos y TAR</b>, <b>IEPS (con estímulo semanal de Hacienda) + IVA</b> y el <b>margen de la estación</b> permisionada por la <b>CNE</b>.</p>
  </header>

  <section class="kpis" aria-label="Indicadores del mercado de combustibles">
    <div class="kpi">
      <span class="ve-label">Desglose ilustrativo por litro (~$24.00 MXN/L)</span>
      <span class="val">$<span data-count="24.0">24.0</span><span class="unit">MXN / L</span></span>
      <ve-stack unit="$" label="Desglose ilustrativo de 24 pesos por litro entre molécula, flete, logística, impuestos y margen">
        <ve-bar value="11.8" hot>① Molécula</ve-bar>
        <ve-bar value="1.1">② Flete</ve-bar>
        <ve-bar value="1.6">③ TAR/Ducto</ve-bar>
        <ve-bar value="7.3" hot>④ IEPS+IVA</ve-bar>
        <ve-bar value="2.2">⑤ Estación</ve-bar>
      </ve-stack>
    </div>
    <div class="kpi">
      <span class="ve-label">Amortiguador fiscal semanal (SHCP · DOF)</span>
      <span class="val"><span data-count="100">100</span><span class="unit">% tope estímulo</span></span>
      <ve-bars unit="$/L" label="Comparativa de cuota IEPS según nivel de estímulo fiscal">
        <ve-bar value="6.45">Sin estím. (0%)</ve-bar>
        <ve-bar value="3.22" hot>Estím. 50%</ve-bar>
        <ve-bar value="0.65">Estím. 90%</ve-bar>
      </ve-bars>
    </div>
    <div class="kpi">
      <span class="ve-label">Inventarios mínimos de seguridad (RLSH art. 109)</span>
      <span class="val"><span data-count="5">5</span><span class="unit">días gasolina/diésel</span></span>
      <ve-bars unit="días" label="Días de reserva estratégica obligatoria por combustible">
        <ve-bar value="5" hot>Gasolinas</ve-bar>
        <ve-bar value="5" hot>Diésel</ve-bar>
        <ve-bar value="1.5">Turbosina</ve-bar>
      </ve-bars>
    </div>
  </section>

  <figure class="ve-steps" id="gasolina-stepper">
    <div class="ve-controls-bar">
      <div class="ve-chips" role="group" aria-label="Escenario internacional de precios">
        <button type="button" data-scen="mid" aria-pressed="true">Crudo medio ($72 USD · Estímulo 35 %)</button>
        <button type="button" data-scen="high" aria-pressed="false">Crudo alto ($92 USD · Estímulo 85 %)</button>
        <button type="button" data-scen="low" aria-pressed="false">Crudo bajo ($58 USD · Estímulo 0 %)</button>
      </div>
      <span class="meta">Cambia el escenario o haz clic en ①–⑤ para inspeccionar cada eslabón</span>
    </div>

    <div class="frame">
      <svg class="ve-svg" viewBox="0 0 960 440" role="img" aria-label="Cadena de valor de los combustibles en 5 etapas numeradas de izquierda a derecha (1 Costo de referencia internacional, 2 Flete marítimo e internación, 3 Logística interna por ducto y TAR, 4 Carga impositiva IEPS + IVA con estímulo SHCP, 5 Precio en dispensario y margen de estación) y barra apilada dinámica inferior.">
        <!-- Zona superior: Los 5 eslabones de la cadena y su autoridad reguladora -->
        <rect class="ve-zone" x="16" y="14" width="928" height="218" rx="10" data-s="1 2 3 4 5"/>
        <text class="ve-zone-title" x="32" y="34" data-s="1 2 3 4 5">CADENA REGULADA DEL COMBUSTIBLE Y AUTORIDADES COMPETENTES (SENER · CNE · ASEA · SHCP · PROFECO)</text>

        <!-- Flujo continuo animado -->
        <path data-flow="hit" data-every="480" d="M100 130H860"/>

        <!-- Flechas entre los 5 eslabones -->
        <path class="ve-e is-hot" data-s="1 2 3 4 5" d="M188 130H210"/>
        <path class="ve-e is-hot" data-s="2 3 4 5" d="M366 130H388"/>
        <path class="ve-e is-hot" data-s="3 4 5" d="M556 130H578"/>
        <path class="ve-e is-hot" data-s="4 5" d="M746 130H768"/>

        <g class="ve-dots" aria-hidden="true"></g>

        <!-- Eslabón 1: Referencia internacional / Refinación -->
        <g class="ve-n is-key" data-n="1" data-s="1" tabindex="0" role="button" aria-label="1. Costo de referencia internacional de la molécula" transform="translate(32 56)">
          <rect class="sh" width="156" height="150" rx="8"/>
          <text class="ve-kind" x="78" y="20">MOLÉCULA</text>
          <text x="78" y="44">Refinación /</text>
          <text x="78" y="64">Referencia</text>
          <text id="node-val-1" class="sub" x="78" y="92">$11.80 / L</text>
          <text class="sub" x="78" y="116">Costa del Golfo</text>
          <text class="sub" x="78" y="134">SENER art. 76-I</text>
        </g>
        <g class="ve-co" data-n="1" data-s="1" transform="translate(172 72)"><circle r="10"/><text>1</text></g>

        <!-- Eslabón 2: Flete marítimo e internación -->
        <g class="ve-n" data-n="2" data-s="2" tabindex="0" role="button" aria-label="2. Flete marítimo e internación a puertos mexicanos" transform="translate(210 56)">
          <rect class="sh" width="156" height="150" rx="8"/>
          <text class="ve-kind" x="78" y="20">INTERNACIÓN</text>
          <text x="78" y="44">Flete Marítimo</text>
          <text x="78" y="64">y Puerto</text>
          <text id="node-val-2" class="sub" x="78" y="92">+$1.10 / L</text>
          <text class="sub" x="78" y="116">Buquetanque /</text>
          <text class="sub" x="78" y="134">Aduana y SENER</text>
        </g>
        <g class="ve-co" data-n="2" data-s="2" transform="translate(350 72)"><circle r="10"/><text>2</text></g>

        <!-- Eslabón 3: Logística interna (Ducto / TAR / Pipa) -->
        <g class="ve-n is-key" data-n="3" data-s="3" tabindex="0" role="button" aria-label="3. Logística interna por poliducto, TAR y autotanque" transform="translate(388 56)">
          <rect class="sh" width="168" height="150" rx="8"/>
          <text class="ve-kind" x="84" y="20">LOGÍSTICA INTERNA</text>
          <text x="84" y="44">Ducto y TAR</text>
          <text x="84" y="64">(5 días reserva)</text>
          <text id="node-val-3" class="sub" x="84" y="92">+$1.60 / L</text>
          <text class="sub" x="84" y="116">Tarifa CNE ·</text>
          <text class="sub" x="84" y="134">Seguridad ASEA</text>
        </g>
        <g class="ve-co" data-n="3" data-s="3" transform="translate(540 72)"><circle r="10"/><text>3</text></g>

        <!-- Eslabón 4: Carga impositiva (IEPS con estímulo + IVA) -->
        <g class="ve-n is-key" data-n="4" data-s="4" tabindex="0" role="button" aria-label="4. Carga impositiva: IEPS con estímulo contracíclico más IVA" transform="translate(578 56)">
          <rect class="sh" width="168" height="150" rx="8"/>
          <text class="ve-kind" x="84" y="20">IMPUESTOS SHCP</text>
          <text x="84" y="44">IEPS Neto + IVA</text>
          <text id="node-stim" x="84" y="64">(Estímulo 35 %)</text>
          <text id="node-val-4" class="sub" x="84" y="92">+$7.30 / L</text>
          <text class="sub" x="84" y="116">Amortiguador</text>
          <text class="sub" x="84" y="134">semanal en DOF</text>
        </g>
        <g class="ve-co" data-n="4" data-s="4" transform="translate(730 72)"><circle r="10"/><text>4</text></g>

        <!-- Eslabón 5: Precio en dispensario (Estación de servicio) -->
        <g class="ve-n is-key" data-n="5" data-s="5" tabindex="0" role="button" aria-label="5. Precio en dispensario y margen de estación de servicio" transform="translate(768 56)">
          <rect class="sh" width="160" height="150" rx="8"/>
          <text class="ve-kind" x="80" y="20">DISPENSARIO</text>
          <text x="80" y="44">Estación y</text>
          <text x="80" y="64">Precio Final</text>
          <text id="node-val-5" class="sub" x="80" y="92">Margen $2.20</text>
          <text id="node-total" class="sub" x="80" y="116">Total: $24.00/L</text>
          <text class="sub" x="80" y="134">CNE · Profeco</text>
        </g>
        <g class="ve-co" data-n="5" data-s="5" transform="translate(912 72)"><circle r="10"/><text>5</text></g>

        <!-- Zona inferior: Barra de descomposición proporcional en vivo -->
        <rect class="ve-zone" x="16" y="252" width="928" height="172" rx="10" data-s="1 2 3 4 5"/>
        <text class="ve-zone-title" x="32" y="274" data-s="1 2 3 4 5">COMPOSICIÓN PROPORCIONAL DEL LITRO EN BOMBA (EFECTO CONTRACÍCLICO DEL ESTÍMULO AL IEPS)</text>

        <g id="live-stack" transform="translate(56 292)">
          <rect id="seg-1" data-n="1" x="0" y="0" width="416" height="46" rx="4" fill="var(--accent)" opacity="0.88"/>
          <rect id="seg-2" data-n="2" x="416" y="0" width="39" height="46" rx="0" fill="var(--info)" opacity="0.85"/>
          <rect id="seg-3" data-n="3" x="455" y="0" width="56" height="46" rx="0" fill="var(--ok)" opacity="0.88"/>
          <rect id="seg-4" data-n="4" x="511" y="0" width="258" height="46" rx="0" fill="var(--warn)" opacity="0.9"/>
          <rect id="seg-5" data-n="5" x="769" y="0" width="79" height="46" rx="4" fill="var(--border-bright)" opacity="0.85"/>

          <text id="lbl-1" x="208" y="27" fill="#fff" font-size="13" font-weight="700" text-anchor="middle">① Molécula $11.80 (49%)</text>
          <text id="lbl-4" x="640" y="27" fill="#181315" font-size="13" font-weight="700" text-anchor="middle">④ IEPS+IVA $7.30 (30%)</text>

          <text id="sub-23" class="ve-label" x="455" y="68" text-anchor="middle">② Flete $1.10 + ③ Logística TAR $1.60</text>
          <text id="sub-5" class="ve-label" x="808" y="68" text-anchor="middle">⑤ Margen $2.20</text>
        </g>

        <!-- Cota total -->
        <g class="ve-dim is-key" data-s="1 2 3 4 5">
          <path class="ext" d="M56 372V396M904 372V396"/>
          <path class="ln" d="M56 390H904M52 394l8-8M900 394l8-8"/>
          <text id="dim-total-text" x="480" y="384">Precio final estabilizado en estación: ~$24.00 MXN por litro</text>
        </g>
      </svg>
    </div>

    <div id="gas-readout" class="ve-readout" aria-live="polite">
      <b>Escenario crudo medio ($72 USD/bbl):</b> La molécula cuesta <b>$11.80/L</b>; Hacienda aplica un <b>estímulo al IEPS del 35 %</b> para que la carga fiscal sea de <b>$7.30/L</b> y el precio en dispensario se mantenga en <b>~$24.00/L</b>.
    </div>

    <div class="ve-player">
      <ol class="ve-cap">
        <li data-n="1/5"><b>① Costo de referencia internacional (Molécula):</b> Representa cerca de la mitad del precio por litro y sigue la cotización de la gasolina terminada en la Costa del Golfo de EE. UU. y el costo de refinación.</li>
        <li data-n="2/5"><b>② Flete marítimo e internación:</b> Costo de trasladar el combustible en buquetanque o ducto fronterizo hasta los puntos de internación autorizados por la SENER (LSH art. 76 fr. I).</li>
        <li data-n="3/5"><b>③ Logística interna (Ductos y TAR):</b> Transporte por poliducto, almacenamiento en terminales TAR (con 5 días de inventario mínimo obligatorio, RLSH art. 109) y reparto en autotanque con tarifa regulada por la CNE.</li>
        <li data-n="4/5"><b>④ Carga impositiva (IEPS + IVA) con estímulo contracíclico:</b> Cuando el petróleo sube en el mundo, la SHCP incrementa el estímulo semanal al IEPS (cobrando menos impuesto) para amortiguar el precio final.</li>
        <li data-n="5/5"><b>⑤ Precio en dispensario y expendio al público:</b> La estación de servicio opera con permiso de la CNE (LSH art. 80), controles volumétricos contra el mercado ilícito (art. 89), seguridad ASEA y vigilancia de Profeco.</li>
      </ol>
      <button type="button" data-go="-1">← Anterior</button>
      <button type="button" data-play>▶ Paso a paso</button>
      <input type="range" min="0" max="4" value="4" aria-label="Paso de la explicación">
      <button type="button" data-go="1">Siguiente →</button>
    </div>
  </figure>
`;

const live = `
{
  const SCENARIOS = {
    mid: {
      mol: 11.80, flete: 1.10, log: 1.60, tax: 7.30, marg: 2.20, stim: "35 %",
      desc: "<b>Escenario crudo medio ($72 USD/bbl):</b> La molécula cuesta <b>$11.80/L</b>; Hacienda aplica un <b>estímulo al IEPS del 35 %</b> para que la carga fiscal sea de <b>$7.30/L</b> y el precio en dispensario se mantenga en <b>~$24.00/L</b>."
    },
    high: {
      mol: 14.90, flete: 1.20, log: 1.60, tax: 4.30, marg: 2.20, stim: "85 %",
      desc: "<b>Escenario crudo alto ($92 USD/bbl):</b> La molécula sube a <b>$14.90/L</b>, pero Hacienda eleva el <b>estímulo al IEPS al 85 %</b> (reduciendo impuestos a <b>$4.30/L</b>) para evitar un gasolinazo y estabilizar la bomba en <b>~$24.20/L</b>."
    },
    low: {
      mol: 9.60, flete: 1.05, log: 1.60, tax: 9.35, marg: 2.20, stim: "0 %",
      desc: "<b>Escenario crudo bajo ($58 USD/bbl):</b> La molécula baja a <b>$9.60/L</b>; el <b>estímulo al IEPS es de 0 %</b> (se cobra la cuota completa más IVA: <b>$9.35/L</b>) y el precio final se ubica en <b>~$23.80/L</b>."
    }
  };

  const btns = [...document.querySelectorAll("[data-scen]")];
  function applyScenario(key) {
    const s = SCENARIOS[key] || SCENARIOS.mid;
    const total = s.mol + s.flete + s.log + s.tax + s.marg;
    const W = 848;
    const w1 = Math.round((s.mol / total) * W);
    const w2 = Math.round((s.flete / total) * W);
    const w3 = Math.round((s.log / total) * W);
    const w4 = Math.round((s.tax / total) * W);
    const w5 = W - w1 - w2 - w3 - w4;

    const seg1 = document.getElementById("seg-1");
    const seg2 = document.getElementById("seg-2");
    const seg3 = document.getElementById("seg-3");
    const seg4 = document.getElementById("seg-4");
    const seg5 = document.getElementById("seg-5");

    seg1.setAttribute("x", "0"); seg1.setAttribute("width", String(w1));
    seg2.setAttribute("x", String(w1)); seg2.setAttribute("width", String(w2));
    seg3.setAttribute("x", String(w1 + w2)); seg3.setAttribute("width", String(w3));
    seg4.setAttribute("x", String(w1 + w2 + w3)); seg4.setAttribute("width", String(w4));
    seg5.setAttribute("x", String(w1 + w2 + w3 + w4)); seg5.setAttribute("width", String(w5));

    const lbl1 = document.getElementById("lbl-1");
    const lbl4 = document.getElementById("lbl-4");
    lbl1.setAttribute("x", String(Math.round(w1 / 2)));
    lbl1.textContent = "① Molécula $" + s.mol.toFixed(2) + " (" + Math.round((s.mol / total) * 100) + "%)";
    lbl4.setAttribute("x", String(Math.round(w1 + w2 + w3 + w4 / 2)));
    lbl4.textContent = "④ IEPS+IVA $" + s.tax.toFixed(2) + " (" + Math.round((s.tax / total) * 100) + "%)";

    document.getElementById("node-val-1").textContent = "$" + s.mol.toFixed(2) + " / L";
    document.getElementById("node-val-2").textContent = "+$" + s.flete.toFixed(2) + " / L";
    document.getElementById("node-val-3").textContent = "+$" + s.log.toFixed(2) + " / L";
    document.getElementById("node-val-4").textContent = "+$" + s.tax.toFixed(2) + " / L";
    document.getElementById("node-stim").textContent = "(Estímulo " + s.stim + ")";
    document.getElementById("node-total").textContent = "Total: $" + total.toFixed(2) + "/L";
    document.getElementById("dim-total-text").textContent = "Precio final estabilizado en estación: ~$" + total.toFixed(2) + " MXN por litro";
    document.getElementById("gas-readout").innerHTML = s.desc;
  }

  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      applyScenario(b.dataset.scen);
    });
  });
}
`;

writeVeFigure({
  id: "mercado-hidrocarburos",
  title: "Precios, expendio y mercado de combustibles",
  theme,
  register: "blueprint",
  body,
  live,
});
