# Electricidad: unidades técnicas y conversiones para la calculadora (México, vigente a noviembre de 2026)

> **Cómo leer estas notas**
> - **EXACTO**: por definición o por aritmética. **TÍPICO**: depende de supuestos, que van declarados. **NORMA**: valor que fija un instrumento jurídico.
> - **fdp** = factor de potencia. "Factor de planta" va siempre con todas sus letras, porque las dos magnitudes se abrevian "FP" en muchos textos (ver Trampas).
> - Fecha de consulta de todas las fuentes web: 2026-11-08. Los cálculos de los ejemplos se corrieron con un script; son cálculo propio, no cifras publicadas.
> - **Procedencia local.** `public/data/*.json` es lo que revisé del acervo: ahí están LSE, RLSE, LPTE, RLPTE, LCNE, LEPE-CFE y `BME_chunks.json` (Bases del Mercado 2015, archivo heredado). **No están en `public/data`** el Código de Red, el PLADESE, las Disposiciones de almacenamiento ni las convocatorias. Estos últimos los leí de copias del DOF en `revision-acervo/.../fuentes/`, y cito su nota del DOF. No consulté la tabla `leyes` de Supabase, así que no afirmo nada sobre lo cargado ahí.
> - **Marco.** Vigente: LSE (DOF 18/03/2025), RLSE, CNE. **Heredado** de la LIE y la CRE, marcado como tal: Código de Red (RES/550/2021, de la CRE, sigue vigente por transitorio), A/025/2023 (acceso a redes), Bases del Mercado 2015, tarifas de 2000 y COPAR 2012.
> - Dato suelto: `RLSE_chunks.json` trae `fecha_publicacion: 2025-01-01`, que no parece la real (el texto tiene pie de impresión "6/10/25"). No uso esa fecha.

---

## 1. Potencia vs. energía: W a TW, Wh a TWh y joules. ¿Cuál es la confusión común?

### Takeaway
La potencia (MW) es qué tan fuerte sale la electricidad en un momento; la energía (MWh) es cuánta salió en total. Energía = potencia × tiempo, y 1 kWh = 3.6 MJ exactos.

**Frase para público general:** "Los MW dicen qué tan fuerte sale la electricidad en un momento; los MWh dicen cuánta salió en total. Es como la velocidad del coche (km/h) y los kilómetros recorridos (km)."

### Cited Findings

| Magnitud | Símbolo | Factor o fórmula | Tipo | Supuestos | Fuente |
|---|---|---|---|---|---|
| Potencia | kW, MW, GW, TW | 1 kW = 10³ W; 1 MW = 10⁶ W; 1 GW = 10⁹ W; 1 TW = 10¹² W | EXACTO | Prefijos SI | Definición SI; sin fuente releída en esta sesión |
| Energía | kWh → J | 1 kWh = 3,600,000 J = 3.6 MJ | EXACTO | Ninguno | [NIST SP 811, ap. B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) (marca el factor como exacto) |
| Energía | MWh → GJ | 1 MWh = 3.6 GJ | EXACTO | Aritmética sobre el factor anterior | Ídem |
| Energía | GWh → TJ | 1 GWh = 3.6 TJ | EXACTO | Ídem | Ídem |
| Energía | TWh → PJ | 1 TWh = 3.6 PJ | EXACTO | Ídem | Ídem |
| Energía | TJ → MWh | 1 TJ = 1000/3.6 = 277.78 MWh | EXACTO (decimal periódico) | Guardar la fracción, no el redondeo | Ídem |
| Energía | PJ → GWh | 1 PJ = 277.78 GWh | EXACTO (decimal periódico) | Ídem | Ídem |
| Energía | kWh → Btu | 1 kWh ≈ 3,412 Btu | TÍPICO (convención) | Btu "International Table"; hay otras definiciones de Btu | [EIA, FAQ](https://www.eia.gov/tools/faqs/faq.php?id=107&t=3); [NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) da 1 Btu_IT = 1.055056 kJ, sin marca de exacto |
| Potencia | hp eléctrico → W | 1 hp = 746 W | EXACTO | Solo el hp eléctrico | [NIST, ap. B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| Relación | E = P × t | MWh = MW × h | EXACTO | P constante en el intervalo; si varía, se integra | Consecuencia de la definición |

Definiciones oficiales mexicanas:
- **Capacidad Instalada**: la cantidad de potencia que tiene una central, un SAE o un recurso de demanda controlable; también se llama capacidad de placa — `public/data/RLSE_chunks.json`, id `RLSE-Art-002`, fracción VII.
- **Generación**: la cantidad real de energía producida en un período, que depende de demanda, operación y disponibilidad — [PLADESE, sección 2.2.2, DOF 17/10/2025](https://sidof.segob.gob.mx/notas/docFuente/5770297).
- La capacidad del SEN cerró 2024 en 90,543 MW (tabla 2.1) y la generación neta inyectada fue 352,305 GWh (tabla 2.2) — [PLADESE](https://sidof.segob.gob.mx/notas/docFuente/5770297). Ambas cifras excluyen generación distribuida (nota al pie 1 y texto de 2.2.2).

### Inferences
**Ejemplos resueltos (cálculo propio):**
- Una central de 100 MW a plena potencia durante 8 h: 100 × 8 = **800 MWh** = 800 × 3.6 GJ = **2.88 TJ**.
- 1 TWh = **3.6 PJ**. 500 PJ = 500 × 277.78 GWh = **138.9 TWh**.
- Potencia media del SEN en 2024: 352,305 GWh ÷ 8,784 h = **40,108 MW**, frente a 90,543 MW instalados (44.3%). Sirve para mostrar en una línea por qué capacidad y energía no se suman ni se comparan directo.

### Gaps
- No leí NOM-008-SCFI (Sistema General de Unidades de Medida), que sería la referencia mexicana de símbolos y prefijos. Sin fuente verificada.
- NIST solo publica el Btu_IT redondeado en la página que leí; la nota al pie con el valor exacto no estaba disponible. Para el catálogo conviene guardar 1.055056 kJ/Btu y decir que es convención.

---

## 2. Potencia aparente, activa y reactiva. ¿Qué factor de potencia mínimo exige México?

### Takeaway
Desde el 8 de abril de 2026 el Código de Red exige a los Centros de Carga en alta tensión, y en media tensión con 1 MW o más, un fdp de **0.97 en atraso a 1.0**, al menos el 95% del tiempo de cada mes. En la factura, el umbral heredado es otro: **90%**, con recargo o bonificación por fórmula.

### Cited Findings

**Fórmulas**

| Magnitud | Símbolo | Fórmula | Tipo | Supuestos | Fuente |
|---|---|---|---|---|---|
| Triángulo de potencias | S, P, Q | S² = P² + Q² | EXACTO | Onda senoidal | [Electricity Forum](https://electricityforum.com/iep/power-quality/three-phase-power-calculation) (secundaria) |
| Factor de potencia | fdp | fdp = P / S = cos φ | EXACTO | Sin armónicos; con armónicos, cos φ deja de ser igual a P/S | [Electrical4U](https://www.electrical4u.com/power-in-ac-circuit/) (secundaria) |
| Monofásico | S | S = V × I; P = V × I × fdp | EXACTO | V e I eficaces | [Electrical4U](https://www.electrical4u.com/power-in-ac-circuit/) (secundaria) |
| Trifásico | S | S = √3 × V_LL × I | EXACTO | Carga balanceada; V entre fases, I de línea | [Electricity Forum](https://electricityforum.com/iep/power-quality/three-phase-power-calculation) (secundaria) |
| Trifásico | P | P = √3 × V_LL × I × fdp | EXACTO | Ídem | Ídem |
| Trifásico | Q | Q = √3 × V_LL × I × sen φ | EXACTO | Ídem | Ídem |
| Corriente | I | I [A] = S [MVA] × 1000 / (√3 × V [kV]) | EXACTO | Ídem | Se despeja de lo anterior |
| Compensación | Qc | Qc = P × (tan φ₁ − tan φ₂) | EXACTO | Corregir de fdp₁ a fdp₂ con P constante | Se despeja de lo anterior |

**Lo que exige México**

| Quién | Valor | Medición y cumplimiento | Vigencia | Fuente |
|---|---|---|---|---|
| Centros de Carga en alta tensión, y en media tensión con demanda contratada ≥ 1 MW | **0.95 en atraso a 1.0** | Cinco-minutal, en el Punto de Conexión, ≥ 95% del tiempo del mes | Hasta el 8 de abril de 2026 | [Código de Red, RES/550/2021, DOF 31/12/2021](https://sidof.segob.gob.mx/notas/5639920), Manual de Conexión, numeral 2.4 (texto leído en el [.doc del SIDOF](https://sidof.segob.gob.mx/notas/getDoc/5639920)). Heredado CRE |
| Los mismos | **0.97 en atraso a 1.0** | Cinco-minutal, ≥ 95% del tiempo del mes | **Desde el 8 de abril de 2026** | Ídem |
| Media tensión ≥ 1 MW | Transitorio de hasta 2 años desde la publicación | Ya venció, según la fecha de publicación | | Ídem |
| Centros de Carga en baja tensión | No son objeto del Manual | | | Ídem, numeral II de Alcance |
| Centrales síncronas tipo B | Capacidad de ±0.95 (atraso y adelanto) en el Punto de Interconexión | | | Código de Red, Manual de Interconexión, 3.2.1 |
| Centrales asíncronas tipo B, C y D (categoría donde suelen caer solar y eólica; la definición no la releí) | Capacidad de ±0.95 en el Punto de Interconexión | | | Código de Red, Manual de Interconexión, 3.5.1 |
| Distribuidor (circuitos) | ≥ 0.95 en atraso o adelanto, promedio mensual, intervalo de 10 min; en ≥ 80% de los circuitos con medidor digital de cada División | | | [A/025/2023, DOF 23/01/2024](https://sidof.segob.gob.mx/notas/5714880), numeral 19.3.3. Heredado CRE. Copia local: `revision-acervo/incorporacion-electricidad-2026-09-19/fuentes/DACG-ACCESO-REDES-pdf-texto.txt` |

**Vigencia del Código de Red.** La LSE lo mantiene aplicable hasta que se expidan nuevas disposiciones (`public/data/Ley_Sector_Electrico_chunks.json`, id `LSE-Trans-03`), y las Disposiciones de almacenamiento de la CNE de abril de 2026 siguen remitiendo a la versión del 31/12/2021 "o aquel que las modifique" ([DOF 16/04/2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5785045), definición VI). No encontré un Código de Red nuevo de la CNE.

**Factura (heredado, 2000)**

| Concepto | Fórmula | Tipo | Fuente |
|---|---|---|---|
| Recargo, fdp < 90% | % = 3/5 × ((90/fdp) − 1) × 100 | NORMA | [Acuerdo SHCP, 27/10/2000, numeral 3](https://sidof.segob.gob.mx/notas/docFuente/2062903) |
| Bonificación, fdp ≥ 90% | % = 1/4 × (1 − (90/fdp)) × 100 | NORMA | Ídem |
| Redondeo y topes | Un decimal; recargo máximo 120%, bonificación máxima 2.5% | NORMA | Ídem |

- La misma fórmula se sigue usando en explicaciones recientes: [Enerlogix](https://enerlogix-web.pages.dev/en/blog/factor-potencia-penalizacion-cfe) (secundaria) da 3.5% a fdp 0.85 y 7.5% a fdp 0.80.
- El RLSE trata el factor de potencia como dato de medición y de ajuste en la facturación: `public/data/RLSE_chunks.json`, ids `RLSE-Art-103` y `RLSE-Art-104`. La LSE no contiene "factor de potencia". Las Bases de 2015 lo listan como requisito técnico (`BME_chunks.json`, id `BME-3-3-11`, heredado).

### Inferences
**Ejemplos resueltos (cálculo propio):**
- **Triángulo.** S = 100 MVA con fdp 0.90: P = **90 MW**; Q = √(100² − 90²) = **43.59 MVAr**.
- **Corriente en alta tensión.** 100 MVA a 230 kV: I = 100,000 / (1.732 × 230) = **251 A**.
- **Monofásico.** 10 kW a 127 V con fdp 0.90: I = 10,000 / (127 × 0.90) = **87.5 A**.
- **Trifásico.** 500 kW a 480 V con fdp 0.90: S = **555.6 kVA**; I = 500,000 / (1.732 × 480 × 0.90) = **668 A**.
- **Compensación para cumplir el Código de Red.** 1,000 kW de fdp 0.80 a 0.97: Qc = 1,000 × (0.7500 − 0.2506) = **499 kVAr**. A 0.95 bastaban 421 kVAr: el cambio de abril de 2026 pide 18.5% más de compensación en este caso.
- **Factura.** fdp 85%: recargo **3.5%**. fdp 80%: recargo **7.5%**. fdp 95%: bonificación **1.3%**. fdp 100%: bonificación **2.5%**.
- **Central.** 100 MW que deban inyectar con fdp 0.95: S = 105.3 MVA y Q = **32.9 MVAr**. Por eso un inversor no se dimensiona solo en MW.

La calculadora debería mostrar los dos umbrales (Código de Red y factura) como cosas distintas: uno se exige como condición técnica y otro cambia el recibo.

### Gaps
- No pude confirmar qué tarifas vigentes (GDMTH, DIST, etc.) conservan la fórmula de 2000, ni encontré el texto de A/058/2017 o de una metodología de la CNE que la repita. Marcarla "heredada, por confirmar con CFE".
- La tabla 1.1.A del Manual de Conexión no se extrajo con cifras; el alcance de arriba viene de los párrafos de texto.
- Solo leí 3.2.1 (síncronas tipo B) y 3.5.1 (asíncronas). Falta el requisito de síncronas tipo C y D.
- Las fuentes de las fórmulas son secundarias; no consulté un texto universitario ni IEEE.

---

## 3. Fotovoltaica: MWp, MWdc, MWac, relación DC/AC, STC, HSP, degradación. ¿Cómo declaran capacidad los permisos en México?

### Takeaway
Los permisos de México piden **las dos capacidades, AC y DC**, y la referencia para el perfil de generación es AC. Se pasa de MWac a MWdc con la relación DC/AC (típica 1.2 a 1.34), y de MWdc a MWh/año con el rendimiento del sitio, que en los diez sitios revisados va de unos **1,580 a 1,950 kWh/kWp**.

### Cited Findings

**Definiciones y fórmulas**

| Magnitud | Símbolo | Factor o fórmula | Tipo | Supuestos | Fuente |
|---|---|---|---|---|---|
| Condiciones estándar de prueba | STC | 1000 W/m², 25 °C de celda, espectro AM1.5 | EXACTO (definición) | Condiciones de laboratorio; en campo el módulo rinde menos | [PVWatts v5, NREL](https://webarchive.library.unt.edu/web/20170124203116/http://www.nrel.gov/docs/fy14osti/62641.pdf) (irradiancia y temperatura); [Tigo](https://www.tigoenergy.com/term/standard-test-conditions) y [EEPower](https://eepower.com/technical-articles/understanding-pv-system-standards-ratings-and-test-conditions/) (AM1.5, secundarias) |
| Potencia pico | MWp = MWdc | Suma de la potencia de placa de los módulos en STC | EXACTO (equivalencia) | Es lado DC | [EEPower](https://eepower.com/technical-articles/understanding-pv-system-standards-ratings-and-test-conditions/) (secundaria) |
| Relación DC/AC | ILR | ILR = MWdc / MWac | EXACTO (definición) | | [NREL ATB 2024](https://atb.nlr.gov/electricity/2024/utility-scale_pv) |
| Conversión | MWdc, MWac | MWdc = MWac × ILR. Ejemplo oficial de ATB: 100 MWdc = 74.6 MWac con ILR 1.34 | EXACTO, dado el ILR | ATB enuncia la relación de forma inconsistente en dos lugares; su ejemplo numérico es el que vale | [NREL ATB 2024](https://atb.nlr.gov/electricity/2024/utility-scale_pv) |
| Relación DC/AC usual | ILR | 1.34 (ATB); mediana 1.3 (LBNL, datos de 2016) | TÍPICO | Estados Unidos, escala de red. No hallé dato mexicano | [ATB](https://atb.nlr.gov/electricity/2024/utility-scale_pv); [Solar Power World sobre LBNL](https://www.solarpowerworldonline.com/?p=77552) |
| Horas solar pico | HSP | HSP [h/día] = irradiación diaria [kWh/m²/día] ÷ 1 kW/m² | EXACTO (definición) | La cifra depende del plano: horizontal (GHI) o inclinado (GTI) | [SABES, metodología](https://sabes.edu.mx/revista-electronica/24/docs/3_metodologia-para-la-estimacion-del-potencial-energetico-solar-caso-de-estudio-motul-yucatan.pdf) |
| Rendimiento específico | PVOUT | kWh/kWp al año, sobre potencia DC | TÍPICO | Por sitio; promedio de largo plazo | [Global Solar Atlas](https://globalsolaratlas.info) (Banco Mundial, Solargis) |
| Energía anual | E | E [MWh] = MWdc × PVOUT [MWh/MWp] = MWdc × HSP × 365 × PR | TÍPICO | PR = pérdidas totales | Fórmula de definición; PR calculado abajo |
| Pérdidas del sistema | | 14% por defecto en PVWatts; 14.1% de pérdidas DC en ATB | TÍPICO | Suciedad, sombras, cableado, etc. Sin temperatura | [PVWatts v5](https://webarchive.library.unt.edu/web/20170124203116/http://www.nrel.gov/docs/fy14osti/62641.pdf); [ATB](https://atb.nlr.gov/electricity/2024/utility-scale_pv) |
| Eficiencia del inversor | | 96% (ATB 2021) | TÍPICO | | [ATB](https://atb.nlr.gov/electricity/2024/utility-scale_pv) |
| Degradación anual | d | 0.5%/año mediana (Jordan y Kurtz); 0.7%/año base en ATB | TÍPICO | Silicio cristalino; la media publicada es mayor (0.8 a 0.9%) | [Jordan y Kurtz](https://zendy.io/title/10.1002/pip.1182); [compendio 2016](https://zendy.io/title/10.1002/pip.2744); [ATB](https://atb.nlr.gov/electricity/2024/utility-scale_pv) |
| Energía en el año n | E_n | E_n = E_1 × (1 − d)^(n−1) | TÍPICO | Degradación geométrica constante | Fórmula de cálculo |
| Factor de planta FV | | Base AC: 21.4 a 34.0% (ATB, por recurso); mediana 24% AC, rango 7 a 35% (muestra LBNL, edición 2024) | TÍPICO | Estados Unidos. Sube con el ILR, porque el denominador es AC | [ATB](https://atb.nlr.gov/electricity/2024/utility-scale_pv); [LBNL, resultado de búsqueda](https://emp.lbl.gov/news/berkeley-labs-latest-utility-scale-solar-report-analyzes-record-deployment-2023) (no pude abrir la página) |

**Recurso solar por zona de México.** Datos del [Global Solar Atlas](https://globalsolaratlas.info) consultados en su API (`https://api.globalsolaratlas.info/data/lta?loc=lat,lon`). PVOUT, GHI y GTI son los publicados; las columnas HSP, PR y factor de planta son cálculo propio.

| Sitio (lat, lon) | PVOUT kWh/kWp·año | GHI kWh/m²·año | GTI óptimo kWh/m²·año | HSP horizontal | HSP inclinado | PR implícito | Factor de planta DC | Factor de planta AC con ILR 1.3 |
|---|---|---|---|---|---|---|---|---|
| Chihuahua (28.64, −106.09) | 1,952 | 2,222 | 2,501 | 6.09 | 6.85 | 0.78 | 22.3% | 29.0% |
| Mexicali (32.62, −115.45) | 1,936 | 2,192 | 2,516 | 6.01 | 6.89 | 0.77 | 22.1% | 28.7% |
| La Paz, BCS (24.14, −110.31) | 1,920 | 2,264 | 2,460 | 6.20 | 6.74 | 0.78 | 21.9% | 28.5% |
| Hermosillo (29.07, −110.95) | 1,908 | 2,212 | 2,488 | 6.06 | 6.82 | 0.77 | 21.8% | 28.3% |
| Guadalajara (20.67, −103.35) | 1,887 | 2,241 | 2,404 | 6.14 | 6.59 | 0.79 | 21.5% | 28.0% |
| Ciudad de México (19.43, −99.13) | 1,814 | 2,134 | 2,271 | 5.85 | 6.22 | 0.80 | 20.7% | 26.9% |
| Juchitán, Oax. (16.43, −95.02) | 1,810 | 2,202 | 2,317 | 6.03 | 6.35 | 0.78 | 20.7% | 26.9% |
| Mérida (20.97, −89.62) | 1,702 | 2,059 | 2,180 | 5.64 | 5.97 | 0.78 | 19.4% | 25.3% |
| Monterrey (25.67, −100.31) | 1,619 | 1,913 | 2,061 | 5.24 | 5.65 | 0.79 | 18.5% | 24.0% |
| Villahermosa (17.99, −92.93) | 1,582 | 1,945 | 2,014 | 5.33 | 5.52 | 0.79 | 18.1% | 23.5% |

Otras referencias de recurso, de calidad menor:
- Promedio nacional de unos 5.5 kWh/m²/día: [Energía Estratégica](https://www.energiaestrategica.com/mexico-alcanza-los-50-parques-fotovoltaicos-operativos-de-gran-escala-suman-4549-mw-de-potencia-solar-instalada/); unos 5 kWh/m²/día: [CleanTechnica, 2010](https://cleantechnica.com/2010/12/09/mexico-a-solar-energy-gold-mine/?amp=1). Las dos son secundarias y difieren.
- Hasta 5.89 kWh/m²/día en el centro del país según un estudio arbitrado: [Applied Sciences, 2022](https://doaj.org/article/83427d3d8d734c309aaa9a8c52f54e7e).

**Datos oficiales mexicanos de producción**
- Generación distribuida FV en 2024: 4,423 MW acumulados y 6,777 GWh (estimados) — [PLADESE, sección de GD](https://sidof.segob.gob.mx/notas/docFuente/5770297).
- Centrales solares FV de red en 2024: 7,961 MW más 92 MW de híbrido FV con baterías, y 18,640 GWh — [PLADESE, tablas 2.1 y 2.2](https://sidof.segob.gob.mx/notas/docFuente/5770297).

**Cómo se declara la capacidad en México**

| Instrumento | Qué pide | Fuente |
|---|---|---|
| Disposiciones de permisos de generación y almacenamiento (CNE) | Capacidad instalada "correspondiente a corriente alterna y corriente directa, cuando sea necesario". Formato: "Capacidad instalada (Corriente Alterna)" y "(Corriente Directa) (para proyectos fotovoltaicos)", ambas en MW | [DOF 23/10/2025, nota 5770667](https://sidof.segob.gob.mx/notas/5770667); copia local `revision-acervo/incorporacion-reglamentos-almacenamiento-2026-09-17/fuentes/DACG-PERMISOS-GA.txt` |
| Permiso de autoconsumo de 0.7 a 20 MW (CNE) | Capacidad de la central indicando AC y DC, cuando sea necesario, y generación anual estimada | [DOF 06/08/2025, nota 5764827](https://sidof.segob.gob.mx/notas/5764827); copia local `.../AUTOCONSUMO-0.7-20.txt` |
| Ventanilla Única de Autoconsumo (SENER) | Capacidad en AC (MW) y en DC (MW) para centrales FV, más capacidad contratada en interconexión. El perfil horario de producción se pide "con base a la capacidad instalada en corriente alterna" | [DOF 08/05/2026, nota 5786923](https://sidof.segob.gob.mx/notas/5786923); copia local `.../VENTANILLA-AUTOCONSUMO.txt` |
| Formatos de almacenamiento (CNE) | Mismos dos campos para proyectos FV asociados | [DOF 22/05/2026, nota 5788270](https://sidof.segob.gob.mx/notas/docFuente/5788270); copia local `.../FORMATOS-SAEE.txt` |
| RLSE | Capacidad Instalada = capacidad de placa, sin decir AC o DC; el umbral de 0.7 MW del art. 19 de la LSE se mide con esa Capacidad Instalada; para GD remite a disposiciones | `public/data/RLSE_chunks.json`, ids `RLSE-Art-002` (VII), `RLSE-Art-018`, `RLSE-Art-047` |
| Almacenamiento (CNE) | Potencia en MW y Capacidad de Almacenamiento en MWh, ambas "indicada en corriente alterna" | [DOF 16/04/2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5785045), definiciones III y XIX |

### Inferences
**Ejemplo resuelto (cálculo propio): 100 MWac en Hermosillo con ILR 1.3**
1. MWdc = 100 × 1.3 = **130 MWdc (130 MWp)**.
2. Energía año 1 = 130 MW × 1,908 MWh/MW = **248,040 MWh/año**. Por HSP da lo mismo: 130 × 6.82 × 365 × 0.767 ≈ 248,000.
3. Factor de planta AC = 248,040 / (100 × 8,760) = **28.3%**. Factor de planta DC = 248,040 / (130 × 8,760) = **21.8%**. La misma central, dos cifras.
4. Con degradación de 0.5%/año: año 10 = 248,040 × 0.995⁹ = **237,100 MWh**; año 25 = 248,040 × 0.995²⁴ = **219,900 MWh**.
5. En Monterrey, mismo diseño: 130 × 1,619 = **210,500 MWh/año**, factor de planta AC **24.0%**. Elegir el sitio mueve el resultado 15%.

**Lecturas de los datos:**
- La tabla 2.1 del PLADESE no dice si la capacidad solar es AC o DC. El rendimiento de 2024 es de unos 2,315 MWh/MW, por encima de cualquier PVOUT de la tabla de arriba (máximo 1,952 MWh/MWp). Eso apunta a capacidad en **AC**, con ILR de 1.2 o más, pero no lo prueba: los seguidores solares también suben el rendimiento y el PVOUT de la tabla parece ser de estructura fija. Es inferencia, no dato publicado.
- La GD-FV rinde 1,532 kWh/kW (factor de planta 17.4%) en cifras oficiales. Queda abajo del PVOUT porque la capacidad es la acumulada al cierre, mientras que parte se conectó durante el año, y porque los techos no están en ángulo óptimo. No debe usarse como dato de diseño.
- PR de 0.77 a 0.80 en la tabla es consistente con 14% de pérdidas y 96% de inversor (0.86 × 0.96 = 0.83) más la pérdida por temperatura.
- El recorte (clipping) con ILR alto no está en estos cálculos: si la calculadora permite ILR mayores a 1.3, debe avisar que el resultado queda sobrestimado.

### Gaps
- **No encontré una tabla oficial mexicana de HSP por estado** (ni de INEEL, CONUEE ni SENER). Los datos de arriba son del Banco Mundial.
- No hay dato oficial mexicano de ILR ni de degradación. Sin fuente verificada.
- No sé si el PVOUT del Global Solar Atlas incluye recorte por inversor ni qué configuración de ILR asume. Tampoco confirmé en una fuente que sea de estructura fija; y no tengo factor verificado de ganancia por seguidor a uno o dos ejes, aunque la [Ventanilla de Autoconsumo](https://sidof.segob.gob.mx/notas/5786923) pide el perfil distinguiendo sin seguidor y con seguidor.
- La mediana de ILR de la edición 2025 de LBNL no se pudo leer (PDF de más de 10 MB y página con 403). El 1.3 es de 2016; un resumen de terceros habla de DC "40% mayor" que AC en 2023, sin confirmar.
- Generación distribuida: no leí las disposiciones vigentes de GD, así que **no sé si el límite de 0.7 MW se mide en AC o DC**. El RLSE remite a disposiciones (`RLSE-Art-047`).
- PVWatts: el valor por defecto de DC/AC no aparece en lo que leí. Terceros citan 1.1 y 1.2.

---

## 4. Factor de planta: fórmula y valores típicos por tecnología en México

### Takeaway
Factor de planta = energía generada ÷ (capacidad × horas del periodo). El PLADESE **no publica una tabla de factor de planta**: se puede calcular con sus tablas 2.1 y 2.2. El ciclo combinado va cerca de 67%, la nuclear 85%, la eólica 30 a 34%, la solar 26 a 29%, la hidro 19 a 32%.

### Cited Findings
**Fórmula:** factor de planta = E [MWh] ÷ (P [MW] × h). EXACTO como definición; el resultado es TÍPICO y depende de cómo se midan energía (bruta o neta) y capacidad (placa, neta, AC o DC).

**Valores.** "Diseño" son los del [COPAR 2012, cuadro 1.7, CFE](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (heredado; parámetros de referencia para proyectos). "Observado" es **cálculo propio** con [PLADESE, tablas 2.1 y 2.2, DOF 17/10/2025](https://sidof.segob.gob.mx/notas/docFuente/5770297): generación neta inyectada ÷ (capacidad instalada al cierre × horas del año; 8,784 h en 2024).

| Tecnología | Diseño COPAR 2012 | Observado 2022 | Observado 2023 | Observado 2024 | MWh/MW 2024 | Nota |
|---|---|---|---|---|---|---|
| Nuclear | 0.90 | 74.8% | 85.5% | 84.8% | 7,449 | |
| Ciclo combinado | 0.80 | 65.8% | 66.7% | 67.9% | 5,966 | |
| Combustión interna | 0.65 | 28.8% | 56.7% | 61.1% | 5,365 | Salto de 2022 a 2023 sin explicación en el texto: cautela |
| Geotermia | 0.85 | 51.6% | 48.7% | 41.7% | 3,664 | Muy por debajo de diseño y a la baja |
| Turbogás | 0.125 | 31.3% | 36.2% | 34.6% | 3,040 | Se usa mucho más que su referencia de diseño |
| Eólica | 0.35 (clase 6), 0.40 (clase 7) | 33.5% | 33.5% | 30.3% | 2,661 | COPAR da un rango de 20 a 43% |
| Térmica convencional | 0.75 (350 MW), 0.65 (160 y 80 MW) | 20.1% | 30.7% | 28.4% | 2,498 | |
| Carboeléctrica | 0.80 | 29.7% | 29.7% | 27.0% | 2,374 | |
| Solar FV, con híbrido | 0.25 | 28.5% | 27.8% | 26.4% | 2,315 | Capacidad presumiblemente AC (ver sección 3). Sin híbrido, 2024 da 26.7% |
| Hidroeléctrica | 0.16 (375 MW), 0.25 (45 MW), 0.85 (8.6 MW) | 32.2% | 18.7% | 21.5% | 1,887 | Depende de la lluvia y del uso de embalses |
| Cogeneración eficiente | Sin dato | 6.8% | 20.3% | 19.4% | 1,706 | Tabla: generación **inyectada**; lo autoconsumido no cuenta |
| Bioenergía | Sin dato | 17.3% | 14.0% | 15.7% | 1,377 | |
| **Todo el SEN** | | 43.8% | 44.4% | 44.3% | 3,891 | Sin generación distribuida |

Otros datos:
- La palabra aparece poco en la norma: "factor de planta" no se encuentra en LSE, RLSE, LCNE, LPTE ni RLPTE (`public/data/*.json`), y el PLADESE solo menciona que las renovables tienen "factor de capacidad más bajo" (sección de sensibilidad).
- Referencia internacional: ATB base AC, 21.4 a 34.0% para FV — [NREL ATB 2024](https://atb.nlr.gov/electricity/2024/utility-scale_pv). Baterías: 16.7% un sistema de 4 h y 8.3% uno de 2 h, con un ciclo por día — [NREL ATB](https://atb.nlr.gov/electricity/2024/utility-scale_battery_storage).

### Inferences
**Ejemplos resueltos (cálculo propio):**
- Eólica de 100 MW con factor de planta 33%: 100 × 0.33 × 8,760 = **289,080 MWh/año**.
- Ciclo combinado, SEN 2024: 212,819,000 MWh ÷ (35,669 MW × 8,784 h) = **67.9%**.

Para la calculadora conviene ofrecer como valor por defecto el observado (promedio de 2022 a 2024) y mostrar el de diseño como referencia, porque difieren mucho en turbogás, geotermia y carbón. Son cifras de un sistema en despacho, no el potencial de cada central.

### Gaps
- No encontré factor de planta oficial por tecnología en un documento vigente. No pude revisar PRODESEN 2024-2038 completo (solo [un resumen de Iniciativa Climática](https://iniciativaclimatica.org/wp-content/uploads/2024/09/PRODESEN.pdf)), el Reporte de Avance de Energías Limpias, ni el Plan de Fortalecimiento y Expansión del SEN.
- COPAR 2012 es la edición que pude abrir, y en un repositorio de terceros. Debe haber ediciones posteriores de CFE.
- Las tablas usan capacidad al cierre de año, no promedio: en tecnologías que crecen (solar, eólica) el factor queda algo subestimado.

---

## 5. Horas por año, capacidad bruta vs. neta, usos propios y pérdidas técnicas

### Takeaway
Un año son 8,760 h, o 8,784 h si es bisiesto (2024, 2028). Las pérdidas totales del SEN en 2024 fueron **12.3% del consumo neto** (43,387 GWh), técnicas y no técnicas juntas, y el PLADESE no da en su texto la separación nacional entre transmisión y distribución.

### Cited Findings

| Magnitud | Símbolo | Factor | Tipo | Supuestos | Fuente |
|---|---|---|---|---|---|
| Horas por año normal | h | 365 × 24 = 8,760 | EXACTO | | Aritmética |
| Horas por año bisiesto | h | 366 × 24 = 8,784 | EXACTO | Bisiestos: 2024, 2028 | Aritmética |
| Capacidad neta | MW neta | MW neta = MW bruta × (1 − usos propios) | TÍPICO | Por tecnología | [COPAR 2012, cuadro 1.7](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (heredado) |
| Pérdidas totales | | 12.3% del consumo neto en 2024; 12.2% en 2023 | Dato | Base = consumo neto, no consumo final | [PLADESE, 2.1.2](https://sidof.segob.gob.mx/notas/docFuente/5770297) |
| Pérdidas totales, GWh | | SEN 43,387; SIN 41,901 (2024) | Dato | | [PLADESE, tabla A1.2](https://sidof.segob.gob.mx/notas/docFuente/5770297) |
| Pronóstico | | 11.7% en 2025; 8% o menos a partir de 2030 | Meta | "de la energía eléctrica neta del sistema" | [PLADESE, sección 3, figura 3.10](https://sidof.segob.gob.mx/notas/docFuente/5770297). [IMCO](https://imco.org.mx/wp-content/uploads/2025/12/El-sector-electrico-ante-el-nuevo-panorama-regulatorio-2025-2039.pdf) cita 7.9% para 2039 |
| Peso de las técnicas | | De 39.2% (Noreste) a 92.3% (Mulegé) del total de pérdidas, según región | Dato | Las no técnicas: de 7.7% a 60.8% | [PLADESE, 2.1.2](https://sidof.segob.gob.mx/notas/docFuente/5770297) |

Pérdidas por región en 2024 (GWh): Central 7,955; Oriental 8,490; Occidental 7,958; Noroeste 3,113; Norte 4,678; Noreste 8,130; Peninsular 1,578; Baja California 1,230; Baja California Sur 246; Mulegé 9 — [PLADESE, tabla A1.2](https://sidof.segob.gob.mx/notas/docFuente/5770297). En el PLADESE, pérdidas técnicas son la energía que se vuelve calor en conductores y transformadores (efecto Joule); no técnicas, la que se toma sin que el medidor la registre, por uso ilícito, fallas de medición o errores administrativos (2.1.2).

**Consumos.** 2024: consumo final 304,011 GWh; consumo bruto 359,807 GWh, que suma ventas, balance de comercio exterior, pérdidas y usos propios de distribución, transmisión y generación de la CFE — [PLADESE, 2.1.1 y 2.1.4](https://sidof.segob.gob.mx/notas/docFuente/5770297). Balance importación menos exportación en 2024: −349 GWh (tabla A1.3). Según el resumen de PRODESEN 2024-2038, el consumo neto es el consumo final más las pérdidas — [Iniciativa Climática](https://iniciativaclimatica.org/wp-content/uploads/2024/09/PRODESEN.pdf).

**Bruta vs. neta y usos propios, por tecnología** — [COPAR 2012, cuadro 1.7](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (heredado, valores de referencia):

| Tecnología | Ejemplo bruta → neta (MW) | Usos propios |
|---|---|---|
| Térmica convencional | 350.0 → 332.2 | 5.1 a 6.9% |
| Turbogás | 262.7 → 256.6 | 1.6 a 3.2% |
| Ciclo combinado | 851.6 → 825.7 | 3.0 a 3.6% |
| Combustión interna | 44.0 → 42.3 | 3.9 a 9.1% |
| Carboeléctrica | 350.0 → 331.1 | 4.1 a 5.4% |
| Nuclear | 1,400 → 1,351 | 3.5% |
| Geotermia | 27.0 → 25.0 | 6.1 a 7.3% |
| Hidroeléctrica | 375.0 → 373.1 | 0.5 a 1.5% |
| Eólica | 1.5 → 1.5 | 0.1% |
| Solar FV | 60.0 → 59.9 | 0.1% |

**Norma:** el RLSE define Capacidad Instalada como capacidad de placa (`RLSE-Art-002`, VII), mientras que el Código de Red usa "Capacidad Instalada Neta" para el umbral de 0.5 MW de interconexión — [Código de Red, DOF 31/12/2021](https://sidof.segob.gob.mx/notas/5639920). Las Bases de 2015 separan los usos propios de una central del abasto aislado (`BME_chunks.json`, id `BME-2-1-1`, heredado).

### Inferences
**Ejemplos resueltos (cálculo propio):**
- Para entregar 100 MWh a un usuario con pérdidas de 12.3% del neto: 100 ÷ (1 − 0.123) = **114.0 MWh** en la red.
- Las mismas pérdidas sobre consumo final: 43,387 ÷ 304,011 = **14.3%**. Misma energía perdida, otra base.
- Central de 851.6 MW brutos con 3.0% de usos propios: neta de **826 MW**.

**Lecturas de los datos:**
- 359,807 − 304,011 − 43,387 = 12,409 GWh, que serían usos propios más el balance de comercio exterior. Con ±349 GWh de balance, los usos propios implícitos andan cerca de **3.4 a 3.5% del consumo bruto**. No es cifra publicada.
- Con la definición de neto de arriba, 43,387 ÷ (304,011 + 43,387) = 12.5%, no 12.3%. Con 12.3%, el neto implícito es unos 352,740 GWh, muy parecido a la generación inyectada. La base exacta del PLADESE no queda clara, y la calculadora debe decir "cerca de 12%".
- Las pérdidas técnicas de la calculadora **no** deberían usar el 12.3% como pérdida física: incluye usos ilícitos y errores de medición.

### Gaps
- La figura 2.4 del PLADESE (pérdidas por región y por tipo) es imagen y no la leí, por lo que **no tengo la cifra nacional de pérdidas técnicas ni la separación entre transmisión y distribución**. En Noreste, "39.2% técnicas" es un porcentaje del total regional, no de la energía.
- No encontré una definición literal de consumo neto en el PLADESE, solo en el resumen de PRODESEN.

---

## 6. Eficiencia térmica y heat rate: kJ/kWh, Btu/kWh, poder calorífico superior e inferior

### Takeaway
Eficiencia = 3,600 ÷ heat rate en kJ/kWh, o 3,412 ÷ heat rate en Btu/kWh. El ciclo combinado va de 45 a 52% según la fuente y la base; la eficiencia con poder calorífico inferior sale cerca de **10% más alta en gas** que con el superior, aunque la central sea la misma.

### Cited Findings

| Magnitud | Símbolo | Factor o fórmula | Tipo | Supuestos | Fuente |
|---|---|---|---|---|---|
| Eficiencia, en kJ | η | η = 3,600 / HR [kJ/kWh] | EXACTO | 1 kWh = 3,600 kJ | [NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9); comprobado con COPAR: 3,600 / 7,139 = 50.43% |
| Eficiencia, en Btu | η | η = 3,412 / HR [Btu/kWh] | TÍPICO (convención Btu) | | [EIA, FAQ](https://www.eia.gov/tools/faqs/faq.php?id=107&t=3) (7,500 Btu/kWh = 45%; 10,500 = 33%) |
| Conversión de heat rate | HR | 1 Btu/kWh = 1.055056 kJ/kWh; 1 kJ/kWh = 0.94782 Btu/kWh | TÍPICO (convención Btu) | Btu_IT | [NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| Superior vs. inferior | PCS, PCI | η_PCI = η_PCS × (PCS / PCI) | EXACTO, dado el combustible | Mismo combustible y misma energía eléctrica | [COPAR 2012, ej. 3.1](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf): diésel 45,329 y 42,557 kJ/kg → 31.2% y 33.2% |
| Diferencia PCS-PCI | | Gas natural: PCI 9 a 10% menor. Carbón y petróleo: 5 a 6% menor | TÍPICO | Varía con la composición del combustible | [OCDE](https://oecd.org/en/data/indicators/primary-energy-supply.html); [ONU, taller](https://unstats.un.org/unsd/energy/Workshops/mexico2008/Presentations/Session%206%20-%20Introduction.pdf) |
| Heat rate bruto vs. neto | | Neto siempre mayor; depende de usos propios | TÍPICO | | [COPAR 2012](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf); [EIA](https://www.eia.gov/tools/faqs/faq.php?id=107&t=3) define la generación neta como la entregada a la línea, descontados los equipos propios |

**Valores típicos**

COPAR dice en su capítulo de combustibles que usa el poder calorífico superior; no comprobé que todo el cuadro 1.7 lo siga, y sus eficiencias de ciclo combinado parecen altas para esa base. Las de EIA son de Estados Unidos, a plena carga y ponderadas por capacidad neta de verano; no son promedio de operación anual.

| Tecnología | COPAR 2012 México: η neta y HR neto (kJ/kWh) | EIA 2025 EE.UU. (Btu/kWh) | EIA convertido: kJ/kWh y η (cálculo propio) |
|---|---|---|---|
| Ciclo combinado, gas | 45.0 a 52.1%; 7,997 a 6,916 | 7,535 | 7,950; 45.3% |
| Turbogás industrial, gas | 29.0 a 35.3%; 12,425 a 10,194 | 10,975 | 11,579; 31.1% |
| Turbogás aeroderivada, gas | 36.3 a 38.0%; 9,932 a 9,487 | | |
| Combustión interna | 34.4 a 42.6%; 10,472 a 8,460 | 8,853 (gas); 10,484 (petróleo) | 9,340 y 38.5%; 11,061 y 32.5% |
| Térmica convencional, vapor | 34.2 a 39.2%; 10,537 a 9,192 | 10,293 (gas); 10,319 (petróleo) | 10,860 y 33.1%; 10,887 y 33.1% |
| Carboeléctrica | 37.7 a 41.0%; 9,550 a 8,784 | 10,040 | 10,593; 34.0% |
| Nuclear | 33.5%; 10,732 | 10,443 | 11,018; 32.7% |
| Geotermia | 17.2 a 17.6%; 20,949 a 20,427 | | |

Fuentes: [COPAR 2012, cuadro 1.7](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (heredado); [EIA, Electric Power Annual, tabla 8.2](https://www.eia.gov/electricity/annual/html/epa_08_02.html).

### Inferences
**Ejemplos resueltos (cálculo propio):**
- HR = 7,139 kJ/kWh → η = 3,600 / 7,139 = **50.4%**.
- EIA, ciclo combinado: 7,535 Btu/kWh × 1.055056 = **7,950 kJ/kWh** → η = 3,412 / 7,535 = **45.3%**. Si esa cifra está en base superior, en base inferior con gas (PCI = 0.90 × PCS) daría 45.3 / 0.90 = **50.3%**.
- Combustible de una central de 100 MW con HR de 7,139 kJ/kWh, durante 1 hora: 100,000 kWh × 7,139 kJ/kWh = **713.9 GJ**.

En la calculadora, el selector PCS/PCI debe estar a la vista: sin él, dos cifras correctas de la misma central parecen contradecirse. Las fichas de fabricante suelen dar PCI (COPAR lo menciona).

### Gaps
- La página de EIA que leí no declara la base PCS. La suposición de arriba es convención de esa agencia, no verificada aquí.
- No encontré heat rate oficial mexicano vigente. PLADESE no trae régimen térmico. COPAR 2012 es lo único que abrí; el Balance Nacional de Energía no lo revisé.
- Geotermia: la eficiencia térmica sale baja por construcción, porque el recurso es de baja temperatura. No debe compararse como si fuera combustible.

---

## 7. Almacenamiento: MW vs. MWh, duración, DoD, eficiencia, Ah y C-rate. ¿Existe un requisito mexicano para solar y eólica?

### Takeaway
La potencia (MW) dice qué tan rápido entrega; la energía (MWh) cuánto dura. El requisito de **30% de la capacidad y al menos 3 horas sí existe en texto oficial, pero como condición de la Segunda Convocatoria de SENER** (DOF 11/05/2026), no como obligación general en la LSE, el RLSE ni las Disposiciones de almacenamiento de la CNE. La prensa lo presenta como regla para todas las plantas solares y eólicas.

### Cited Findings

**Definiciones y fórmulas**

| Magnitud | Símbolo | Factor o fórmula | Tipo | Supuestos | Fuente |
|---|---|---|---|---|---|
| Potencia del SAE | MW | Potencia activa en MW, en corriente alterna (seis decimales) | NORMA | Definición XIX | [Disposiciones CNE, DOF 16/04/2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5785045) |
| Capacidad de Almacenamiento | MWh | Energía que puede almacenarse para entregarse, en corriente alterna (seis decimales) | NORMA | Definición III | Ídem |
| Energía Disponible | MWh | La máxima extraíble según el estado de carga actual (SOC), en AC | NORMA | Definición XIII | Ídem |
| Profundidad de descarga | DoD | Máxima energía extraíble entre SOC máximo y mínimo, en % de la Capacidad de Almacenamiento | NORMA | Definición XII. Ojo: el % va sobre esa Capacidad | Ídem |
| Degradación | | Disminución de la Capacidad por ciclos y tiempo | NORMA | Definición VIII | Ídem |
| Duración | h | h = MWh / MW | EXACTO | A potencia nominal constante | [ATB baterías](https://atb.nlr.gov/electricity/2024/utility-scale_battery_storage) usa esta relación para pasar de $/kWh a $/kW |
| C-rate | C | C = MW / MWh = 1 / h | EXACTO (definición) | | Definición usual. Sin fuente verificada en esta sesión |
| Eficiencia ida y vuelta | RTE | RTE = energía entregada / energía de carga | EXACTO (definición) | | [EIA](https://www.eia.gov/todayinenergy/detail.php?id=46756) |
| RTE usual | | Baterías 82% y bombeo 79% (EE.UU., 2019); 85% baterías (ATB 2024) | TÍPICO | Promedio de flota contra supuesto de modelo | [EIA](https://www.eia.gov/todayinenergy/detail.php?id=46756); [ATB](https://atb.nlr.gov/electricity/2024/utility-scale_battery_storage) |
| Energía de batería | Wh | Wh = V × Ah | EXACTO | Tensión nominal; la energía real varía con la descarga | Fórmula de definición. Sin fuente verificada en esta sesión |
| Duración usual | | 2 a 10 h modeladas; 4 h por defecto en ATB | TÍPICO | Estados Unidos | [ATB](https://atb.nlr.gov/electricity/2024/utility-scale_battery_storage) |

**¿Dónde está el requisito?**

| Instrumento | Qué dice | Fuente |
|---|---|---|
| LSE | Define el SAE (art. 3, fracc. L) y regula su integración. Sin porcentaje ni horas | `public/data/Ley_Sector_Electrico_chunks.json`, ids `LSE-Art-003`, `LSE-Art-050` |
| RLSE | Permiso de almacenamiento para sistemas no asociados de 0.7 MW o más; los que son parte de una central con permiso no lo requieren. Sin porcentaje ni horas | `public/data/RLSE_chunks.json`, id `RLSE-Art-193`; búsqueda de "30%" y equivalentes: 0 resultados |
| Disposiciones de almacenamiento, CNE (sustituyen a A/113/2024 de la CRE) | Sin porcentaje exigido. **Numeral 2.13.10: con 3 horas o más, el SAE puede acreditar Potencia** en el mercado de balance. Es condición para un producto, no obligación de instalar | [DOF 16/04/2026, nota 5785045](https://dof.gob.mx/nota_detalle_popup.php?codigo=5785045); [resumen GT Law](https://www.gtlaw.com/ar/insights/2026/5/disposiciones-sistemas-de-almacenamiento) |
| Disposiciones de planeación vinculante, SENER | Mencionan almacenamiento para servicios conexos y para inercia. Sin porcentaje | [DOF 17/10/2025](https://www.dof.gob.mx/nota_detalle.php?codigo=5770298&fecha=17/10/2025); copia local `.../DACG-PV.txt` |
| Primera convocatoria, SENER | El CENACE debe calcular el porcentaje de almacenamiento aplicable a centrales intermitentes. Sin cifra fija | [DOF 17/10/2025, nota 5770299](https://sidof.segob.gob.mx/notas/5770299); copia local `.../CONV-GEN-1.txt` |
| **Segunda Convocatoria, SENER** | **Numeral 1.2.1, II, iv: SAE de "al menos un 30% de la capacidad de la Central Eléctrica" con duración de "al menos, tres horas"**, más las funciones técnicas del numeral 14.4. Dirigida a proyectos nuevos de 0.7 MW o más, renovables. Excluye GD, autoconsumo, cogeneración y esquemas mixtos | [DOF 11/05/2026, nota 5787117](https://sidof.segob.gob.mx/notas/5787117); copia local `revision-acervo/incorporacion-convocatorias-2026-09-17/fuentes/CONV-GEN-2.txt`. Sus modificaciones M1 a M4 no contienen esos términos |
| Convocatoria de Proyectos Estratégicos, SENER | Referencia, no límite: 935 MW de SAE no asociado con 3 horas (BC 140, BCS 50, Norte 245, Noroeste 160, Oriental 180, Occidental 20, Peninsular 140). No exige un porcentaje a la generación | [DOF 15/05/2026, nota 5787666](https://sidof.segob.gob.mx/notas/5787666), numeral 18.2; [copia](https://factorenergetico.mx/wp-content/uploads/2026/05/convocatoria-de-generacion-y-almacenamiento.pdf). Registro ampliado a marzo de 2027: [pv magazine México](http://www.pv-magazine-mexico.com/2026/10/30/la-sener-amplia-hasta-marzo-de-2027-el-registro-para-935-mw-de-almacenamiento-con-baterias/) |
| PLADESE | Modelación: las adiciones de eólica y solar de 2031 a 2039 "en promedio" llevan asociado 30% de capacidad de SAE con baterías. Es resultado de planeación, no regla | [PLADESE, sección 3, junto a la tabla 3.6, DOF 17/10/2025](https://sidof.segob.gob.mx/notas/docFuente/5770297) |
| Permisos, CNE | Búsqueda de "30%" y equivalentes: 0 resultados | Copia local `.../DACG-PERMISOS-GA.txt` |

**Modalidades y límite de inyección.** Las Disposiciones de la CNE distinguen SAE asociado a central, asociado a centro de carga, de autoconsumo, integrado a la RNT o RGD, y no asociado. Los asociados a centrales son solo para renovables con permiso en el mercado, y su inyección no puede rebasar la capacidad del contrato de interconexión — [GT Law, 2026](https://www.gtlaw.com/ar/insights/2026/5/disposiciones-sistemas-de-almacenamiento) (secundaria). Para la calculadora: sumar MW de planta y de SAE no da la capacidad en el punto de conexión.

**Lo que dice la prensa (discrepancia).** [pv magazine](https://www.pv-magazine.com/2025/10/30/mexico-sets-regional-benchmark-with-new-battery-storage-rules/) dice que aplica a todas las plantas solares y eólicas, anunciado en marzo de 2025, sin citar instrumento; [IEEFA](https://ieefa.org/resources/un-reajuste-de-las-politicas-podria-expandir-significativamente-la-generacion-de-energia) lo presenta igual; [Energía Estratégica](https://www.energiaestrategica.com/es/notes/mas-de-6-gw-en-juego-en-mexico-sener-busca-adjudicarlos-este-ano-mientras-la-cfe-lanza-proyecto-de-hidrogeno-verde) lo sitúa en los procesos de asignación, que es lo que coincide con el texto del DOF.

### Inferences
**Ejemplos resueltos (cálculo propio):**
- **Requisito.** Central solar de 100 MW: 30% = **30 MW** durante 3 h = **90 MWh**. Es decir, 0.9 MWh por cada MW de la central.
- **C-rate.** 30 MW / 90 MWh = **0.33 C**.
- **Eficiencia.** Con RTE de 85%, entregar 90 MWh cuesta 90 / 0.85 = **105.9 MWh** de carga.
- **Referencia de la convocatoria.** 935 MW × 3 h = **2,805 MWh**.
- **Batería pequeña.** 48 V × 200 Ah = **9.6 kWh**. Con DoD de 90%: **8.64 kWh** útiles. Descarga a 100 A = **0.5 C**: 4.8 kW durante 2 h.

**Base de la capacidad.** La convocatoria no aclara si el 30% se mide sobre capacidad AC o DC. Como la norma de almacenamiento pide MW en AC, y el perfil se pide en AC, lo razonable para la calculadora es **AC, marcado como supuesto**. El numeral habla de la Central Eléctrica renovable en general, sin limitarlo a solar y eólica.

**Texto sugerido para público:** "Hoy una convocatoria de SENER pide baterías de 30% de la capacidad y 3 horas. No es una regla de la ley para todas las plantas."

### Gaps
- No revisé todas las modificaciones de las convocatorias ni el resultado de la primera línea por línea. El dato "0 resultados" solo cubre las formas buscadas ("30%", "30 por ciento", "treinta por ciento", "3 horas", "tres horas").
- Las Disposiciones de planeación vinculante aplicables a **almacenamiento** que SENER debía emitir (mencionadas en la Convocatoria Estratégica) no las vi. Si ya salieron, podrían traer una regla más amplia.
- No hallé fuente para DoD típica ni para vida en ciclos en México. Sin fuente verificada.
- No aclaré si el 30% debe cumplirse en el Punto de Interconexión o en la placa del SAE.

---

## 8. Eólica: velocidad del viento, altura, factor de planta, v³, Betz y área barrida

### Takeaway
La potencia del viento crece con el **cubo** de la velocidad: 10% más de viento da 33% más de potencia. Ningún rotor abierto capta más de 16/27 (59.3%), y los modernos andan en 0.4 a 0.5. En México el factor de planta observado es de 30 a 34%.

### Cited Findings

| Magnitud | Símbolo | Factor o fórmula | Tipo | Supuestos | Fuente |
|---|---|---|---|---|---|
| Velocidad | m/s → km/h | 1 m/s = 3.6 km/h | EXACTO | | Aritmética |
| Velocidad | nudo → m/s | 1 nudo = 1852/3600 = 0.514444 m/s; 1 nudo = 1.852 km/h | EXACTO | 1 milla náutica = 1852 m exactos | [NIST, ap. B](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| Velocidad | mph → m/s | 1 mph = 0.44704 m/s | EXACTO | Milla internacional | Definición usual. Sin fuente verificada en esta sesión |
| Potencia del viento | P | P = ½ × ρ × A × v³ × Cp | EXACTO (física) | Flujo uniforme; sin límite de potencia nominal | [COPAR 2012, sección eólica](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (heredado); [Wikipedia, Ley de Betz](https://en.wikipedia.org/wiki/Betz%27s_law) |
| Área barrida | A | A = π × D² / 4 | EXACTO | Rotor horizontal | Geometría |
| Límite de Betz | Cp máx | 16/27 = 0.593 | EXACTO (teórico) | Disco ideal abierto | [COPAR 2012](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (0.593); [Wikipedia](https://en.wikipedia.org/wiki/Betz%27s_law) (16/27) |
| Cp real | Cp | 0.4 a 0.5 en aerogeneradores modernos | TÍPICO | Punto de operación | [COPAR 2012](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (heredado) |
| Densidad del aire | ρ | 1.225 kg/m³ a nivel del mar y 15 °C | TÍPICO | **Sin fuente verificada en esta sesión** (valor estándar). COPAR confirma que la potencia baja con la temperatura y la altura del sitio | [COPAR 2012](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (dependencia) |
| Perfil vertical | v₂ | v₂ = v₁ × (h₂/h₁)^α; α cerca de 0.14 en terreno abierto | TÍPICO | **α sin fuente verificada en esta sesión**; varía mucho por sitio | |
| Factor de planta | | 20 a 43% (rango); 0.35 clase 6 y 0.40 clase 7 | TÍPICO | Según sitio y fabricante | [COPAR 2012](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (heredado) |
| Factor de planta observado en México | | 33.5%, 33.5% y 30.3% (2022, 2023, 2024) | Cálculo propio | Generación inyectada entre capacidad instalada | [PLADESE, tablas 2.1 y 2.2](https://sidof.segob.gob.mx/notas/docFuente/5770297) |
| Distancias entre turbinas | | 3 a 5 diámetros entre turbinas; 5 a 9 entre filas | TÍPICO | | [COPAR 2012](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) (heredado) |

### Inferences
**Ejemplos resueltos (cálculo propio):**
- **Rotor.** D = 150 m: A = π × 150² / 4 = **17,671 m²**.
- **Potencia.** A 8 m/s y ρ = 1.225: potencia del viento = ½ × 1.225 × 17,671 × 8³ = **5.54 MW**. Con Betz: **3.28 MW**. Con Cp = 0.45: **2.49 MW**.
- **Sensibilidad.** De 7 a 8 m/s (+14%), la potencia sube (8/7)³ = **+49%**. +10% de velocidad = **+33%**.
- **Altura.** De 80 a 120 m con α = 0.14: v × (120/80)^0.14 = v × 1.058. Potencia: **+18.6%**.
- **Conversión.** 15 nudos = 15 × 0.514444 = **7.72 m/s** = 27.8 km/h.

La calculadora no debe usar la velocidad media en la fórmula del cubo para estimar energía anual, porque el promedio de los cubos es mayor que el cubo del promedio; y debe topar el resultado en la potencia nominal de la máquina. Sin eso, el cálculo engaña.

### Gaps
- Faltó fuente primaria para ρ, α y distribución de vientos (IEC 61400, NREL). Sin fuente verificada.
- No busqué velocidades de viento oficiales por zona de México (Atlas del INEEL, Global Wind Atlas).
- Las clases de viento en COPAR 2012 no se definen en lo que leí.

---

## 9. Hidroeléctrica: P = ρ g Q H η, altura, GWh y embalses

### Takeaway
Con caudal en m³/s y altura en m, la potencia en kW es 9.81 × Q × H × η. Cada metro cúbico que cae 100 m rinde cerca de 0.24 kWh con 88% de eficiencia.

### Cited Findings

| Magnitud | Símbolo | Factor o fórmula | Tipo | Supuestos | Fuente |
|---|---|---|---|---|---|
| Potencia hidráulica | P | P [W] = η × γ × Q × H, con γ = ρ × g = 9,810 N/m³ | EXACTO (física) | Q en m³/s; H neta en m; η = turbina × generador | [Idaho National Lab, HydroGenerate](https://idaholabresearch.github.io/HydroGenerate/Theory_1_Hydropower.html) |
| Unidades de EE.UU. | | HP teóricos = Q [pies³/s] × H [pies] / 8.8 | TÍPICO | Referencia para datos en pies | [Bureau of Reclamation, folleto](https://webarchive.library.unt.edu/web/20090513120550/http:/www.usbr.gov/power/edu/pamphlet.pdf) |
| Gravedad | g | g = 9.80665 m/s² | EXACTO | Valor estándar | [NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| Densidad del agua | ρ | 1,000 kg/m³ | TÍPICO | Agua dulce, temperatura ambiente; implícito en γ de INL | [INL](https://idaholabresearch.github.io/HydroGenerate/Theory_1_Hydropower.html) |
| Energía | E | E [GWh/año] = P [MW] × factor de planta × 8.76 | EXACTO, dado el factor | | Sección 4 |
| Energía por volumen | kWh/m³ | kWh/m³ = H × η / 367.1 | EXACTO, dados H y η | Con ρ = 1,000 y g = 9.80665 (3.6×10⁶ / 9,806.65 = 367.1) | Cálculo propio sobre las anteriores |
| Factor de planta en México | | 32.2%, 18.7%, 21.5% (2022, 2023, 2024). COPAR: 0.16 (375 MW), 0.25 (45 MW), 0.85 (8.6 MW, mini) | TÍPICO | Varía con la lluvia y con el papel de punta | [PLADESE](https://sidof.segob.gob.mx/notas/docFuente/5770297) (cálculo propio); [COPAR 2012](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf) |
| Generación histórica | | De 20,609 GWh (2023) a 38,875 GWh (2014), con cerca de 12,600 MW desde 2014 | Dato | | [PLADESE, tablas 2.1 y 2.2](https://sidof.segob.gob.mx/notas/docFuente/5770297) |

### Inferences
**Ejemplos resueltos (cálculo propio):**
- **Potencia.** Q = 100 m³/s, H = 100 m, η = 0.88: P = 1,000 × 9.80665 × 100 × 100 × 0.88 = **86.3 MW**.
- **Energía anual.** Con factor de planta de 21.5%: 86.3 × 0.215 × 8,760 = **162,500 MWh = 162.5 GWh**.
- **Embalse.** 1 millón de m³ a 100 m con η = 0.88: 1,000,000 × 100 × 0.88 / 367.1 = **239.7 MWh**.

Hay que dejar claro que H es la altura neta, no la de la cortina, y que Q es el caudal turbinado, no el del río.

### Gaps
- No encontré una fuente con eficiencia global típica; INL remite a curvas por tipo de turbina y la búsqueda no confirmó el 90%. El 0.88 del ejemplo es un supuesto. Sin fuente verificada.
- No busqué fichas de embalses mexicanos (volumen útil, altura de las centrales de CFE).

---

## 10. Tensión y red: niveles de México, 60 Hz, caída de tensión, capacidad de líneas y HVDC

### Takeaway
En México, baja tensión es ≤ 1 kV; alta tensión, más de 35 kV; y la Red Nacional de Transmisión (RNT) empieza en 69 kV. La operación normal es ±5% de la tensión nominal. La capacidad de una línea no se expresa en MW/km: es menor mientras más larga la línea.

### Cited Findings

**Clasificación**

| Concepto | Rango | Tipo | Fuente |
|---|---|---|---|
| Baja Tensión | ≤ 1 kV | NORMA | `public/data/RLSE_chunks.json`, id `RLSE-Art-002`, fracc. V; PLADESE 2.3 |
| Alta Tensión | > 35 kV | NORMA | `RLSE-Art-002`, fracc. II |
| Media tensión, RGD | > 1 kV y < 69 kV | Definición de plan | [PLADESE, 2.3](https://sidof.segob.gob.mx/notas/docFuente/5770297). El art. 2 del RLSE no trae definición de Media Tensión |
| RNT | ≥ 69 kV | Definición de plan | [PLADESE, 2.3](https://sidof.segob.gob.mx/notas/docFuente/5770297) |

**Niveles y líneas** — Longitud en 2024, [PLADESE, tabla 2.3](https://sidof.segob.gob.mx/notas/docFuente/5770297); 34.5, 23 y 13.8 kV con el tope por circuito del [Código de Red](https://sidof.segob.gob.mx/notas/5639920):

| Tensión (kV) | Clase | km de línea en 2024 | Nota |
|---|---|---|---|
| 400 | RNT | 26,451 | |
| 230 | RNT | 29,749 | |
| 161 | RNT | 520 | |
| 138 | RNT | 1,603 | |
| 115 | RNT | 48,717 | |
| 85 | RNT | 1,764 | |
| 69 | RNT | 2,335 | |
| 34.5 | Media (RGD) | | Demanda máxima por circuito: 10 MW |
| 23 | Media (RGD) | | Demanda máxima por circuito: 7.5 MW |
| 13.8 | Media (RGD) | | Demanda máxima por circuito: 4.5 MW |

- Los proyectos instruidos en 2024 usan justo 400, 230, 161, 138, 115, 85, 69, 34.5 y 13.8 kV — [PLADESE, sección 4](https://sidof.segob.gob.mx/notas/docFuente/5770297).
- Baja tensión de utilización: 120, 127, 120/240, 208Y/120, 220Y/127, 240, 480Y/277, 480, 600Y/347 y 600 V; remite a NMX-J-098-ANCE — [NOM-001-SEDE-2012, art. 110-4, DOF 29/11/2012](https://sidof.segob.gob.mx/notas/docFuente/5280607).

**Tolerancias y frecuencia**

| Concepto | Valor | Tipo | Fuente |
|---|---|---|---|
| Tensión permanente, estado normal | 95% a 105% de la nominal | NORMA | [Código de Red](https://sidof.segob.gob.mx/notas/5639920), Manual de Conexión, tabla 2.1.A, notas 1 a 3; Criterio SEA-9 |
| Tensión temporal, hasta 20 min | 90% a 110% | NORMA | Ídem, tabla 2.1.B, notas 1 a 3 |
| Frecuencia, modo de control primario | 59.8 a 60.2 Hz en SIN, Baja California y BCS; 59.7 a 60.3 Hz en Mulegé | NORMA | Ídem, Manual de Interconexión, requisitos de control primario. Para operación, Criterio SEA-14 da 59.7 a 60.3 Hz (Mulegé) y 59.8 a 60.2 Hz (BC y BCS) |
| Variación que puede causar una carga | ≤ 0.1 Hz | NORMA | Ídem, Manual de Conexión, 2.2 b |
| Frecuencia que debe soportar la carga (versión 2016, ya abrogada) | Permanente 59.0 a 61.0 Hz; 30 min 58.0 a 62.5 Hz | Heredado | [Manual 2016, DOF 08/04/2016](https://www.amuvie.mx/nube2/repository/biblioteca/Manualregulatorioconexioncentrosdecarga.pdf), tabla 3.2.1.A |

**Caída de tensión y capacidad**

| Magnitud | Fórmula o valor | Tipo | Supuestos | Fuente |
|---|---|---|---|---|
| Caída, instalación del usuario | 3% en el circuito derivado; 5% combinada con el alimentador | NORMA (nota, recomendación) | Hasta la salida más lejana | [NOM-001-SEDE-2012, art. 210-19, nota 4](https://sidof.segob.gob.mx/notas/docFuente/5280607) |
| Caída en línea trifásica | ΔV ≈ √3 × I × (R cos φ + X sen φ) × L | TÍPICO (aproximación) | Línea corta y balanceada; R y X en Ω/km | **Sin fuente verificada en esta sesión**; fórmula usual de ingeniería |
| Capacidad térmica | P = √3 × V × I × fdp | EXACTO | I = ampacidad del conductor | [Electricity Forum](https://electricityforum.com/iep/power-quality/three-phase-power-calculation) (secundaria) |
| Carga natural de la línea | SIL [MW] = V² [kV] / Zc [Ω] | EXACTO (fórmula) | Línea sin pérdidas | [Univ. de Utah, ECE 3600](https://my.ece.utah.edu/~ece3600/Notes_TransmissionLines.pdf); [memorando, ND Legislature](https://www.ndlegis.gov/sites/default/files/resource/committee-memorandum/surge-impedance-loading.pdf) |
| SIL usual | 230 kV: 135 a 150 MW; 345 kV: 325 a 425 MW; 500 kV: 850 a 1,075 MW | TÍPICO | Líneas aéreas; varía con el haz de conductores | [Univ. de Utah](https://my.ece.utah.edu/~ece3600/ECE3600_Week13_F20.pdf) y secundarias; 400 kV no aparece |
| Curva de St. Clair | Capacidad práctica por distancia | TÍPICO | Publicada en 1953, referencia aceptada para cargabilidad | [Scribd, St. Clair AEP](https://www.scribd.com/document/479693079/StClairAEP-pdf) (secundaria) |
| Pérdidas HVDC vs. AC | HVDC 3 a 5% por 1,000 km; convertidoras 0.4 a 1% por terminal; AC 8 a 15% por 1,000 km | TÍPICO | **Fuente de baja calidad**, hoja interactiva, sin primaria | [hawksinleo](https://hawksinleo.github.io/sunpal-interactive-reports/hvdc-vs-ac-transmission-comparison) |
| HVDC en México | PLADESE no menciona HVDC en su texto. Las Bases de 2015 citan enlaces internacionales "en corriente directa o alterna" | | Búsqueda de "HVDC" y "corriente directa" | [PLADESE](https://sidof.segob.gob.mx/notas/docFuente/5770297); `BME_chunks.json`, id `BME-2-1-28` (heredado) |

### Inferences
**Ejemplos resueltos (cálculo propio):**
- **Caída.** Línea de 13.8 kV, 50 A, 2 km, R = 0.3 y X = 0.4 Ω/km, fdp 0.9 (sen φ = 0.436): ΔV = 1.732 × 50 × (0.27 + 0.174) × 2 = **77 V = 0.56%**. R y X son supuestos.
- **Capacidad por corriente.** 230 kV y 1,000 A con fdp 1: P = 1.732 × 230 × 1,000 / 1,000 = **398 MW**.
- **Carga natural a 400 kV.** Con Zc = 300 Ω (supuesto; las fuentes dan cerca de 285 Ω a 500 kV y 367 Ω a 230 kV): 400² / 300 = **533 MW**. Con 280 a 320 Ω: 500 a 571 MW.
- **HVDC bipolar.** ±500 kV y 3,000 MW: I = 3,000 / (2 × 500) = **3 kA**.

**Lecturas de los datos:**
- Las fronteras del RLSE (35 kV) y del PLADESE (69 kV) no chocan con los niveles reales: entre 35 y 69 kV no hay ninguno en uso. Para la calculadora: BT ≤ 1 kV; MT 13.8, 23 y 34.5 kV; AT 69 kV en adelante.
- "MW/km" no es una medida de capacidad. Lo que sirve es un rango por nivel de tensión y un aviso de que en líneas largas manda la estabilidad, no el calor. Este punto es inferencia a partir de la lógica de la curva de St. Clair.

### Gaps
- La **frase "frecuencia nominal 60 Hz" no la encontré literal** en lo que leí del Código de Red; los rangos están centrados en 60 Hz. Falta confirmar la tabla 2.2.A vigente, porque las cifras de esa tabla no se extrajeron del .doc.
- No hallé capacidad oficial en MW por línea o enlace en texto del PLADESE (la figura 2.1 es imagen).
- No leí CFE L0000-02 ni NMX-J-098-ANCE, que serían la referencia de tensiones normalizadas.
- Fórmula de caída de tensión y α de viento: sin fuente verificada.
- No conseguí fuente primaria de pérdidas de HVDC (CIGRÉ, Hitachi, IEA).

---

## 11. Órdenes de magnitud: ¿1 MW abastece a cuántos hogares en México?

### Takeaway
El usuario residencial promedio consume unos **1,885 kWh al año (157 kWh al mes)**, con datos del PLADESE. Con eso, 1 MW de solar cubre la energía anual de unos **1,100 a 1,200 usuarios**, y 1 MW de ciclo combinado, de unos 2,800 a 3,200. Es equivalencia anual, no cobertura hora por hora.

### Cited Findings
- Consumo final 2024: 304,011 GWh; 49 millones de usuarios; el sector residencial es 89.2% de los usuarios y 27.1% del consumo — [PLADESE, 2.1.1](https://sidof.segob.gob.mx/notas/docFuente/5770297).
- Empresa mediana y gran industria: 60.6% del consumo con 0.9% de los usuarios — ídem.
- Consumo por habitante por región (todo el consumo, no solo hogar): de 1,680 a 4,604 kWh/habitante — [PLADESE, sección de regiones](https://sidof.segob.gob.mx/notas/docFuente/5770297).
- Referencia cruzada: 1,725 a 1,866 kWh/hogar electrificado al año en un compendio de [SEMARNAT](https://apps1.semarnat.gob.mx:8443/dgeia/compendio_2021/archivos/02_energia/d2_energia06_16.pdf). El año de cada columna no quedó claro en lo que leí.
- Los tramos de tarifa doméstica básica e intermedia (hasta 75 y de 76 a 140 kWh/mes) son cifras de 2024 de [Luz Noticias](https://www.luznoticias.mx/2024-02-08/mexico/cfe-esta-sera-la-nueva-tarifa-por-kilowatt-tras-los-aumentos-en-el-recibo-de-luz/194810) (secundaria). Solo sirven como contexto.

### Inferences
**Cálculo base (propio):** 304,011 GWh × 27.1% = 82,387 GWh residenciales. 49 millones × 89.2% = 43.7 millones de usuarios. 82,387 GWh ÷ 43.7 millones = **1,885 kWh/usuario·año = 157 kWh/mes**. Eso equivale a **215 W** de potencia media por usuario.

Usuarios residenciales cubiertos, en energía anual, por 1 MW (cálculo propio con factores observados en 2024 y 8,760 h):

| Tecnología | Factor de planta | MWh/año por MW | Usuarios sin pérdidas | Usuarios con 12.3% de pérdidas |
|---|---|---|---|---|
| Hidroeléctrica | 21.5% | 1,883 | 999 | 876 |
| Solar FV | 26.4% | 2,313 | 1,227 | 1,076 |
| Eólica | 30.3% | 2,654 | 1,408 | 1,235 |
| Turbogás | 34.6% | 3,031 | 1,608 | 1,410 |
| Geotermia | 41.7% | 3,653 | 1,938 | 1,700 |
| Ciclo combinado | 67.9% | 5,948 | 3,156 | 2,767 |
| Nuclear | 84.8% | 7,428 | 3,941 | 3,456 |

**Ejemplo resuelto.** 1 MW solar × 0.264 × 8,760 h = 2,313 MWh/año. Con pérdidas: 2,313 × (1 − 0.123) = 2,028 MWh. Dividido entre 1.885 MWh/usuario: **1,076 usuarios**.

**Tres avisos para la calculadora:**
1. Usuario no es hogar exacto: es un contrato.
2. Es equivalencia de energía anual. Una central solar no da luz de noche sin baterías.
3. El consumo promedio de **todos** los usuarios es 6,204 kWh/año, porque la industria pesa mucho. Si alguien pregunta "1 MW para una ciudad", el número baja a menos de un tercio.

### Gaps
- No encontré una cifra oficial publicada de "consumo por hogar" de 2024 de CFE o SENER; la de arriba se deriva de datos oficiales.
- El consumo de Baja California, Sonora o Sinaloa, con aire acondicionado, es mucho mayor que el promedio. No tengo el dato de hogar por región.

---

## 12. ¿Qué ajustes cambian el resultado?

### Takeaway
Las variables que más mueven el resultado son el factor de planta (y su base, AC o DC), la base de las pérdidas, y PCS contra PCI. Cada una debe verse y poder cambiarse en la calculadora.

### Cited Findings
Cada valor viene de las secciones anteriores, donde va con su fuente.

| Ajuste | Dónde pesa | Efecto, con número | Valor por defecto sugerido |
|---|---|---|---|
| Año bisiesto | Toda energía anual | 8,784/8,760 = +0.27% | 8,760; bisiesto solo para datos reales de 2024 y 2028 |
| Base AC o DC | Solar | Misma central: 28.3% en AC y 21.8% en DC | AC, como piden los permisos |
| ILR | Solar | 1.2 a 1.34 mueve la energía en proporción, hasta que recorta | 1.3 (TÍPICO, EE.UU.) |
| Sitio (PVOUT) | Solar | 1,582 a 1,952 kWh/kWp: 23% | Selección por zona |
| Seguidor solar | Solar | Sube la energía; sin factor verificado | Opción aparte, marcada como supuesto |
| Degradación | Solar | 0.5%/año: −11.3% al año 25; 0.7%/año: −15.5% | 0.5% |
| Factor de planta | Toda tecnología | Hidro entre 18.7 y 32.2% según el año; turbogás 12.5% de diseño contra 35% observado | Promedio 2022-2024 observado |
| Capacidad bruta o neta | Térmicas | Usos propios de 3 a 9% | Neta, para energía entregada |
| Base de pérdidas | Red | 12.3% del neto contra 14.3% del final | Declarar la base |
| Técnicas o totales | Red | 12.3% incluye usos ilícitos; hay regiones con 60.8% de pérdidas no técnicas | Mostrar "totales" y avisar |
| PCS o PCI | Heat rate | Gas: cerca de 10% en la eficiencia. Diésel: 31.2% contra 33.2% | Selector visible |
| Heat rate bruto o neto | Térmicas | 6,922 contra 7,139 kJ/kWh en un mismo ciclo combinado | Neto |
| fdp | kVA ↔ kW | 100 MVA son 90 MW a 0.90 y 97 MW a 0.97 | 0.97 en Código de Red; 0.90 para factura |
| Fase (mono, tri) | Corriente | Factor √3 = 1.732 | Selector visible |
| Tensión de línea o de fase | Corriente | 220 V y 127 V en el mismo sistema: otro factor de √3 | Pedir tensión entre fases en trifásico |
| RTE | Baterías | 82 a 85%: 90 MWh piden 106 a 110 MWh de carga | 85% |
| DoD | Baterías | 90%: 9.6 kWh quedan en 8.64 kWh | Solo para baterías pequeñas en DC; la CNE pide MWh en AC |
| Densidad del aire | Eólica | A 1,500 m, unos 16% menos (cálculo propio con atmósfera exponencial) | Corregir por altitud |
| Altura de buje | Eólica | De 80 a 120 m con α = 0.14: +18.6% de potencia | Pedir altura |
| Eficiencia hidráulica | Hidro | Proporcional | 0.88, marcado como supuesto |

### Inferences
Para el catálogo: toda salida de la calculadora debería decir "con estos supuestos" y listar los valores usados, igual que lo piden las notas. Es la forma más barata de evitar que dos cálculos correctos parezcan contradecirse.

### Gaps
- Ningún valor por defecto de esta tabla es oficial, salvo los marcados como norma en secciones anteriores. Son sugerencia.

---

## 13. Trampas: errores comunes

### Takeaway
La mayoría de los errores vienen de mezclar potencia con energía, AC con DC, y de leer una cifra sin su base. Dos siglas engañan seguido: **FP** (factor de potencia y factor de planta) y **capacidad neta** (sin usos propios, o adiciones menos retiros).

### Cited Findings
1. **MW contra MWh.** Capacidad y energía no se comparan directo: 90,543 MW y 352,305 GWh en 2024 ([PLADESE](https://sidof.segob.gob.mx/notas/docFuente/5770297)). "MW/h" y "kW/h" no son lo mismo que MWh y kWh, y como energía son un error.
2. **FP con dos significados.** Factor de potencia (0.97) y factor de planta (28%) tienen la misma sigla en muchos textos. En la app, escribirlos completos.
3. **MWp contra MWac.** Una planta "de 130 MWp" y una "de 100 MWac" pueden ser la misma. Los permisos piden las dos ([DOF 23/10/2025](https://sidof.segob.gob.mx/notas/5770667)); la prensa suele dar una sola sin decir cuál.
4. **El factor de planta solar depende de la base.** 28.3% en AC y 21.8% en DC para la misma central (sección 3). ATB declara base AC ([NREL](https://atb.nlr.gov/electricity/2024/utility-scale_pv)).
5. **HSP no es horas de sol.** Es energía normalizada a 1 kW/m². Y cambia según el plano: Hermosillo tiene 6.06 en horizontal y 6.82 en inclinado ([Global Solar Atlas](https://globalsolaratlas.info)).
6. **kWh/kWp contra kWh/m².** PVOUT es por potencia instalada; GHI y GTI son por área. Hermosillo: 1,908 contra 2,212 ([Global Solar Atlas](https://globalsolaratlas.info)). No se pueden multiplicar entre sí como si fueran lo mismo.
7. **Factor de potencia: 0.95 ya venció.** Muchas guías siguen citando 0.95; desde el 8 de abril de 2026 es 0.97 ([Código de Red](https://sidof.segob.gob.mx/notas/5639920)).
8. **95% del tiempo, no 97%.** La versión de 2016 pedía 97% del tiempo junto con 0.97 ([Manual 2016](https://www.amuvie.mx/nube2/repository/biblioteca/Manualregulatorioconexioncentrosdecarga.pdf)); la de 2021 pide 95% del tiempo con 0.97 ([Código de Red](https://sidof.segob.gob.mx/notas/5639920)). El porcentaje del tiempo y el valor del fdp son cosas distintas.
9. **El 0.97 del Código de Red y el 90% de la factura** son reglas distintas. Se puede cumplir una y fallar la otra ([Acuerdo de 2000](https://sidof.segob.gob.mx/notas/docFuente/2062903)).
10. **El 30% de almacenamiento está en MW, no en MWh.** Central de 100 MW: 30 MW × 3 h = 90 MWh. Y es condición de una convocatoria, no ley general ([DOF 11/05/2026](https://sidof.segob.gob.mx/notas/5787117)).
11. **Pérdidas con su base.** 12.3% es sobre consumo neto; sobre el final da 14.3% ([PLADESE, 2.1.2 y A1.2](https://sidof.segob.gob.mx/notas/docFuente/5770297)). Incluye pérdidas no técnicas: no todo es física.
12. **Generación del PLADESE sin generación distribuida.** Las tablas 2.1 y 2.2 no incluyen los 4,449.79 MW de GD ni sus 6,777 GWh FV ([PLADESE](https://sidof.segob.gob.mx/notas/docFuente/5770297)). Al sumar la solar total, hay que agregarla aparte.
13. **"Usos propios" tiene dos sentidos.** Consumo interno de una central (COPAR) y figura de permiso heredada, "usos propios continuos" (`LSE-Trans-06`; [PLADESE, tabla 2.1](https://sidof.segob.gob.mx/notas/docFuente/5770297)).
14. **"Capacidad neta" tiene dos sentidos.** Sin usos propios ([COPAR](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf)), o adiciones menos retiros, que es como parece usarse en la sensibilidad del [PLADESE](https://sidof.segob.gob.mx/notas/docFuente/5770297) ("capacidad neta de generación de 88,453 MW").
15. **Alta tensión no es lo mismo que RNT.** Alta tensión es > 35 kV (`RLSE-Art-002`); la RNT empieza en 69 kV ([PLADESE](https://sidof.segob.gob.mx/notas/docFuente/5770297)).
16. **SAE y SAEE son lo mismo.** PLADESE dice SAE; la CNE dice SAEE ([DOF 16/04/2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5785045)).
17. **El límite de 0.7 MW se mide con Capacidad Instalada** (`RLSE-Art-018`, `LSE-Art-019`); el Código de Red, en cambio, habla de 0.5 MW de Capacidad Instalada Neta para interconexión. Son umbrales de cosas distintas. Autoconsumo de 0.7 a 20 MW: trámite simplificado (`LSE-Art-030`).
18. **Eficiencias con distinta base.** PCS contra PCI: 31.2% y 33.2% para el mismo equipo ([COPAR, ej. 3.1](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf)).
19. **Heat rate no es eficiencia de combustible nueva.** Más kJ/kWh es peor. Y bruto y neto difieren: 6,922 contra 7,139 kJ/kWh ([COPAR](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf)).
20. **Betz no es la eficiencia de una turbina.** 59.3% es el techo teórico; los reales van en 0.4 a 0.5 ([COPAR](https://ewsdata.rightsindevelopment.org/files/documents/05/IADB-ME-G1005_0SXE4Uh.pdf)).
21. **2024 fue bisiesto.** Calcular su factor de planta con 8,760 h da una cifra 0.27% más alta.
22. **COPAR de 2012 no es el sistema actual.** Solar FV 0.25 (hoy observado 26 a 29%), turbogás 0.125 (hoy 31 a 36%), geotermia 0.85 (hoy 42 a 52%).

### Inferences
- **Línea de neutro y √3.** Usar 127 V en una fórmula trifásica, o 220 V en una monofásica de fase a neutro, equivoca el resultado por √3 = 1.73. Si el campo de la calculadora dice solo "tensión", el error es casi seguro.
- **La corriente de una central solar se calcula con MVA, no con MW.** A fdp 0.95, 100 MW son 105.3 MVA.
- **Aritmética con 277.78.** Redondear 1 TJ = 278 MWh en cadena acumula error; guardar 1000/3.6.
- **"Hogares abastecidos" en prensa** suele no decir qué consumo por hogar ni qué factor de planta usa. Comparar solo si los declara.

### Gaps
- Falta una revisión de cómo reporta CFE y la prensa mexicana los proyectos solares (MWp o MWac). No hice muestreo de casos concretos.
