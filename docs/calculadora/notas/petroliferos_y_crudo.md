# Crudo y petrolíferos en México: unidades, densidades, poderes caloríficos y ajustes (vigente a noviembre de 2026)

Convenciones de estas notas. **EXACTO** = por definición. **TÍPICO** = depende del producto y su calidad. **OFICIAL-MX** = publicado por autoridad mexicana. "Cálculo propio" = aritmética hecha para estas notas a partir de la fuente citada; no es un valor publicado. Las cifras con "sin fuente verificada" son supuestos de trabajo y no deben ir al catálogo como dato oficial.

## Tabla maestra por producto

### Takeaway
México publica un solo valor oficial de energía por producto, la Lista de combustibles CONUEE (última localizada: 2025, con datos del BNE 2023), siempre en poder calorífico **neto**; no publica densidad oficial de gasolina ni diésel, y no separa Magna de Premium. Esos valores "netos" quedan entre 4 % y 8 % por encima de lo que da el cálculo físico con IPCC. Uso por defecto la Lista para MJ/bl y bep, e IPCC más densidad para MJ/kg, mostrando siempre las dos.

### Cited Findings

**Tabla 1. Valores por producto.** Las columnas MJ/L, °API y PCS son cálculo propio a partir de la fuente indicada.

| Producto | Densidad kg/L y tipo | °API (cálculo) | PCI oficial MX, Lista 2025 (MJ/bl → MJ/L) | PCS regla BNE, Lista/0.95 (MJ/L) | PCI físico IPCC 2006 (MJ/kg, IC 95 %) | CO2 RENE (tCO2/TJ; IC IPCC) | bep Lista 2025 |
|---|---|---|---|---|---|---|---|
| Petróleo crudo, promedio de producción | Sin dato oficial, varía por mezcla | n/a | 6,427.76 → 40.43 | 42.56 | 42.3 (40.1–44.8) | 73.3 (71.1–75.5) | 1.0000 /bl |
| Gasolina regular y premium (Lista: "Gasolinas y naftas") | 0.700–0.770 a 20/4 °C, HDS Pemex. TÍPICO. NOM-016 solo exige "informar" | 70.6–52.3 | 5,613 → 35.30 | 37.16 | 44.3 (42.5–44.8) | 69.3 (67.5–73.0) | 0.8732 /bl |
| Turbosina (Lista: "Querosenos") | 0.7720–0.8370 a 20 °C, o 0.775–0.840 a 15 °C. OFICIAL-MX, límite de norma | 51.8–37.6 | 5,888 → 37.03 | 38.98 | Jet: 44.1 (42.0–45.0). Mínimo NOM-016: 42.8 | Turbosina 71.5 (69.7–74.4). Querosenos 71.9 | 0.9160 /bl |
| Diésel automotriz | NOM-016 solo "informar". 0.84 es supuesto de cálculo, **sin fuente verificada** | ~37 | 6,065 → 38.15 | 40.16 | 43.0 (41.4–43.3) | 74.1 (72.6–74.8) | 0.9436 /bl |
| Gasóleo | NOM-016 solo "informar" | n/d | 42,524 **MJ/m³** → 42.52 (ver Trampas) | 44.76 | Gas/diésel: 43.0 | 74.1 | 6.6157 /m³ |
| Combustóleo pesado | 0.9941 HDS Pemex. TÍPICO. IFO-180: máximo 0.9877 a 20/4 °C | 10.8 | 6,656 → 41.87 | 44.07 | 40.4 (39.8–41.7). Mínimo Tabla 9: 40 | 77.4 (75.5–78.8) | 1.0355 /bl |
| Coque de petróleo | Sólido, se mide en masa | n/a | 34,518 **MJ/t** = 34.52 MJ/kg | 36.33 MJ/kg | 32.5 (29.7–41.9) | 97.5 (82.9–115.0) | 5.3701 /t |

Fuentes de la Tabla 1:
- Poder calorífico neto y factor bep: [Lista de combustibles 2025, CONUEE/SENER](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf), fechada el 12 de febrero de 2025, basada en poderes caloríficos del BNE 2023 preliminar; deja sin efectos la lista 2024.
- Los mismos valores aparecen en la columna 2023 del Cuadro A.1 del [Balance Nacional de Energía 2023](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf).
- Regla neto/bruto: el BNE indica que para líquidos el neto es 5 % menor que el bruto, y que presenta todo en neto para comparar con AIE, ONU y OLADE ([BNE 2023, Anexo Metodológico](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)).
- Densidades y mínimos de norma: Tablas 5, 7, 8, 9 y 11 de la [NOM-016-CRE-2016](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf).
- Gasolina: HDS Pemex [Magna](https://www.pemex.com/comercializacion/productos/HDS/refinados/HDSS-107%20Pemex%20Magna.pdf) y [Premium](https://www.pemex.com/comercializacion/productos/HDS/refinados/HDSS-105%20Pemex%20Premium.pdf).
- Combustóleo: [HDS Pemex combustóleo pesado](https://www.pemex.com/comercializacion/productos/HDS/refinados/HDS%20SAC%20Combust%C3%B3leo%20pesado%20v2.pdf) da densidad 0.9941, poder calorífico de 40 MJ/kg mínimo y hasta 4 % de azufre en masa.
- IPCC: Tablas 1.2 y 1.4 de las [Directrices IPCC 2006, Vol. 2, Cap. 1](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_1_Ch1_Introduction.pdf).
- Factor CO2: Artículo Sexto, numeral 2 del [Acuerdo RENE, DOF 3-sep-2015](https://dof.gob.mx/nota_detalle.php?codigo=5406149&fecha=03%2F09%2F2015).

**Tabla 2. Crudos mexicanos.** Densidad, kg/bl y PCS son cálculo propio con la fórmula API y agua a 999.016 kg/m³. No hay poder calorífico oficial por tipo de crudo.

| Crudo | °API y azufre: ficha actual Pemex | °API y azufre: BNE 2023 (nominal) | SG 60/60 con el valor por defecto | kg/bl | bl/t | PCS fórmula EIA (MJ/bl) | PCI IPCC 42.3 MJ/kg (MJ/bl) |
|---|---|---|---|---|---|---|---|
| Altamira | Sin ficha localizada | 16.5°, 5.50 % | 0.9561 (16.5°) | 151.9 | 6.59 | 6,652 | 6,430 |
| Maya | 21–22°, 3.4–3.8 % | 22°, 3.30 % | 0.9248 (21.5°) | 146.9 | 6.81 | 6,510 | 6,220 |
| Zapoteco | 29–29.9°, 2.513 % (prensa, no Pemex) | No aparece | 0.8789 (29.5°) | 139.6 | 7.16 | 6,288 | 5,911 |
| Istmo | 32–33°, 1.8 % | 33.6°, 1.30 % | 0.8628 (32.5°) | 137.0 | 7.30 | 6,207 | 5,803 |
| Olmeca | 38–39°, 0.73–0.95 % | 39.3°, 0.80 % | 0.8324 (38.5°) | 132.2 | 7.56 | 6,047 | 5,598 |

Fuentes de la Tabla 2:
- [Ficha Pemex de Istmo](https://www.pemex.com/comercializacion/productos/Paginas/petroleo/crudo-istmo.aspx), [ficha Pemex de Olmeca](https://www.pemex.com/comercializacion/productos/Paginas/petroleo/crudo-olmeca.aspx) y [HDS Pemex de Maya](https://www.pemex.com/comercializacion/productos/HDS/petroleo/HDS_Crudo_Maya.pdf).
- Variedades de exportación: [BNE 2023, Anexo Metodológico](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf).
- Zapoteco: [Energy Magazine, 2024](https://energymagazine.mx/2024/04/pemex-aumenta-9-4-exportaciones-de-crudo-zapoteco), sin documento Pemex citado.
- Los valores 33.6° y 39.3° ya estaban en el [glosario Pemex de 2006](https://ebdi.pemex.com/bdi/docs/Diccio_marzo2006-4.pdf).
- Fórmula de poder calorífico bruto a partir de SG: [EIA, Monthly Energy Review, documentación del Apéndice A](https://www.eia.gov/totalenergy/data/monthly/pdf/mer_a_doc.pdf).
- Clases por densidad: extrapesado >1.00 g/cm³; pesado 1.00–0.92 (10–22.3°); mediano 0.92–0.87 (22.3–31.1°); ligero 0.87–0.83 (31.1–39°) ([BNE 2023, Cuadro B.3](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)).

**Tabla 3. Serie histórica de PCI oficial, para fijar el año en el catálogo (TÍPICO, cambia cada año).** Extraída de la [Serie histórica 2016-2025 de CONUEE](https://www.gob.mx/cms/uploads/attachment/file/995835/Serie_hist_rica_de_la_lista_de_combustibles_y_sus_poderes_calor_ficos_2016-2025.pdf); el PDF desalinea filas y columnas, así que verifiqué el orden contra las listas [2021](https://www.gob.mx/cms/uploads/attachment/file/619062/Lista_Combustibles_2021_26feb2021.pdf) y [2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf).

| Producto | 2016 | 2017 | 2018–19 | 2020 | 2021–22 | 2023–24 | 2025 |
|---|---|---|---|---|---|---|---|
| Crudo (MJ/bl) | 6,312 | 6,122 | 6,122 | 6,122 | 6,122 | 6,347 | 6,427.8 |
| Gasolinas y naftas (MJ/bl) | 5,134 | 5,176 | 5,365 | 5,593 | 5,269 | 5,613 | 5,613 |
| Querosenos (MJ/bl) | 5,530 | 5,881 | 5,912 | 6,071 | 5,752 | 5,888 | 5,888 |
| Diésel (MJ/bl) | 5,620 | 6,294 | 6,037 | 6,060 | 5,990 | 6,065 | 6,065 |
| Combustóleo (MJ/bl) | 6,296 | 6,531 | 6,565 | 6,397 | 6,477 | 6,656 | 6,656 |
| Coque de petróleo (MJ/t) | 31,758 | 32,658 | 32,658 | 32,658 | 32,658 | 34,518 | 34,518 |

Otras referencias:
- La conversión a joules de la Lista usa 1 J = 0.2388458966275 cal ([Serie histórica CONUEE, nota 2](https://www.gob.mx/cms/uploads/attachment/file/995835/Serie_hist_rica_de_la_lista_de_combustibles_y_sus_poderes_calor_ficos_2016-2025.pdf)).
- El poder calorífico del crudo cambia cada año según la calidad del crudo ([BNE 2023](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)).
- La obligación de publicar la lista con factores a barriles de petróleo crudo equivalente, aplicables durante un año, está en el Reglamento de la Ley de Planeación y Transición Energética, Art. 75. **Lo vi en el acervo**: `public/data/RLPTE_chunks.json`, id `RLPTE-Art-075`.
- Comparación estadounidense, también en bruto (HHV): diésel 5.770 MMBtu/bl, gasolina sin oxigenar 5.222, turbosina 5.670, residual 6.287, según [EIA, Apéndice A, MER septiembre 2026](https://www.eia.gov/totalenergy/data/monthly/pdf/mer_a_doc.pdf). La [página de unidades de EIA](https://www.eia.gov/energyexplained/units-and-calculators/british-thermal-units.php) da 120,214 Btu/gal para gasolina y 137,381 para diésel, sin aclarar si es bruto o neto.

### Inferences
- **Equivalencias derivadas de la Lista 2025 (cálculo propio):**

| Producto | MJ/L | kcal/L | Mcal/bl | Btu/gal | MMBtu/bl |
|---|---|---|---|---|---|
| Crudo promedio | 40.43 | 9,656 | 1,535 | 145,056 | 6.092 |
| Gasolinas y naftas | 35.30 | 8,432 | 1,341 | 126,669 | 5.320 |
| Querosenos | 37.03 | 8,846 | 1,406 | 132,875 | 5.581 |
| Diésel | 38.15 | 9,111 | 1,449 | 136,869 | 5.749 |
| Combustóleo | 41.87 | 9,999 | 1,590 | 150,206 | 6.309 |

- **Los valores "netos" mexicanos se parecen a los brutos de EUA (inferencia propia, no lo dice ninguna autoridad).** En MJ/bl, Lista frente a HHV de EIA: diésel 6,065 vs 6,088; residual 6,656 vs 6,633; turbosina 5,888 vs 5,982; gasolina 5,613 vs 5,510.
- **Contra el cálculo físico, IPCC por densidad:** gasolina 35.30 vs 32.56 MJ/L (+8.4 %, a 0.735 kg/L); turbosina 37.03 vs 35.48 (+4.4 %, a 0.8045 kg/L); diésel 38.15 vs 36.12 (+5.6 %, a 0.84 kg/L); combustóleo 41.87 vs 40.16 (+4.2 %, a 0.9941 kg/L). Para que 35.30 MJ/L cuadre con 44.3 MJ/kg, la gasolina tendría que pesar 0.797 kg/L, fuera del rango 0.700–0.770 de la HDS.
- **Decisión por defecto:**
  - Energía por volumen y bep: **Lista CONUEE**, porque es el valor con base reglamentaria, es el que usa el BNE y permite reproducir cifras oficiales.
  - Energía por masa y comprobación física: **IPCC 2006 por densidad**, rotulado como "referencia física".
  - Tipo de crudo: **ficha actual de Pemex** (punto medio del rango) con el nominal del BNE como alterno, porque los nominales del BNE repiten cifras de 2006 y Pemex es quien vende el producto.
- **PCS:** no recomiendo mostrar Lista/0.95 como PCS real. Daría diésel 40.16 MJ/L cuando EIA reporta 38.29 MJ/L en bruto. Mejor ofrecer el PCS de EIA para el modo "referencia EUA" y aclarar que México no publica PCS por producto.

### Gaps
- **Lista 2026:** no la localicé en gob.mx ni en el DOF. La vigencia de la Lista 2025 a noviembre de 2026 queda sin confirmar.
- **BNE 2024:** el [BNE 2024 revisado](https://www.gob.mx/cms/uploads/attachment/file/1047704/Balance_Nacional_de_Energ_a_2024R.pdf) (96 páginas) no trae un cuadro de poderes caloríficos netos en su capa de texto. No revisé si está como imagen.
- **Densidad oficial de gasolina y diésel:** no hallé un valor promedio oficial. Las HDS recientes de Pemex para diésel lo marcan como no disponible ([HDS SAC-12](https://www.pemex.com/comercializacion/productos/HDS/refinados/HDS-Diesel.pdf)). La versión antigua dice 0.87–0.95 ([HDS v6](https://www.pemex.com/comercializacion/productos/hds/refinados/hds-pemex-diesel-esp-v6.pdf)), que parece demasiado alto y trae la unidad mal escrita.
- **Magna y Premium:** no hallé poder calorífico oficial separado.
- **Densidad a granel del coque:** sin fuente oficial mexicana.
- **Zapoteco:** no encontré ficha o HDS de Pemex; el dato viene de prensa especializada.
- **Altamira:** la API figura en el BNE, pero no localicé ficha vigente de Pemex.

## Volumen y notación: barril, galón, Mbd, MMb y la confusión con M de mega

### Takeaway
En el sector, **M = miles y MM = millones**, y el propio BNE lo escribe junto a M = mega = 10⁶ de los prefijos métricos. 1 Mbd son 1,000 barriles diarios, no un millón. Hay tres valores de barril en documentos oficiales: uso 158.987294928 L como canónico y documento 158.9873 y 158.99 como variantes redondeadas.

### Cited Findings
- **Barril.** NIST da 1 barril de petróleo = 42 galones de EUA = 158.9873 L, y marca como no exacto el valor impreso porque está redondeado ([NIST SP 811, Apéndice B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8)).
- **Variantes oficiales mexicanas:**
  - 158.99 L a 15.56 °C, con referencia al Art. 3, fr. I de la LISH ([Lineamientos Técnicos de Medición, CNH, Art. 3, fr. VI](https://sidof.segob.gob.mx/notas/docFuente/5409741)).
  - 158.9873 L a 15.5556 °C (60 °F), en el mismo documento, Art. 13 ([Lineamientos CNH](https://sidof.segob.gob.mx/notas/docFuente/5409741)).
  - 158.9873 L, 42 galones = 1 barril, 1 galón = 3.7854 L, 1 m³ = 6.2898 barriles ([BNE 2023, Cuadro B.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)).
- **Múltiplos del sector:** el Cuadro B.1 del BNE define para volumen y peso M = miles = 10³, MM = millones = 10⁶, MMM = miles de millones = 10⁹. El Cuadro B.2 lista aparte los prefijos métricos con M = Mega = 10⁶ y k = kilo = 10³ ([BNE 2023](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)).
- **Pemex** define thousand barrels per day como Mbd, million barrels of oil equivalent como MMboe, million cubic feet per day como MMcfd y thousand tons como **Mt** ([Pemex, reporte de resultados en 6-K, 2014](https://www.sec.gov/Archives/edgar/data/932782/000119312514208544/d729367d6k.htm)).
- **El BNE** usa "Mbd" con la nota "miles de barriles diarios" y reporta en "millones de barriles de petróleo equivalente" ([BNE 2023](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)).
- **La AIE** escribe sus volúmenes como kb/d y mb/d, por ejemplo un alza de 760 kb/d hasta 108 mb/d de oferta mundial ([IEA, Oil Market Report](https://iea.blob.core.windows.net/assets/7a568f37-ed86-48bc-ae93-40c6ebbd7311/-14OCT2025_OilMarketReport.pdf); leído en extracto de búsqueda, no en el PDF).
- **Acervo:** no vi definición de barril. La búsqueda de "158.9", "15.56" y "condiciones de referencia" en los JSON de `public/data` no dio resultados, y no hay archivo de la LISH. Las únicas menciones a barriles están en `RLPTE_chunks.json` (`RLPTE-Art-075`).

### Inferences
- **Factores de catálogo (cálculo propio):**
  - EXACTO: 1 gal EUA = 231 in³ = 3.785411784 L.
  - EXACTO: 1 bl = 42 gal = 158.987294928 L, y 1 m³ = 6.28981077 bl (recíproco).
  - EXACTO: 1 bl/d = 42/1440 gpm = 0.0291667 gpm.
  - 1 bl/d = 0.110408 L/min = 0.00662447 m³/h.
- **Tabla de lectura propuesta para el catálogo:**

| Sigla | En México significa | Ejemplo | Nota |
|---|---|---|---|
| Mbd, MBD, Mb/d | miles de barriles diarios | 340 Mbd = 340,000 bl/d | Fuente: Pemex y BNE |
| MMbd | millones de barriles diarios | 1.6 MMbd = 1,600 Mbd | Múltiplo MM del BNE |
| MMb | millones de barriles | | Múltiplo MM del BNE |
| kbd, kb/d | miles de barriles diarios, usado por AIE | 760 kb/d = 760 Mbd | k es prefijo SI |
| mb/d | millones de barriles diarios, usado por AIE (ver Gaps) | 108 mb/d = 108,000 Mbd | **m minúscula** |
| Mt en Pemex | miles de toneladas | | Choca con Mt = millones de toneladas |

- **Regla de la interfaz:** nunca mostrar "M" sola. Escribir "miles de barriles diarios (Mbd)".
- **Diferencia entre barriles oficiales:** 158.99 frente a 158.987294928 es +0.0017 %; irrelevante para el público, pero un test exacto fallaría. Usar el canónico y citar los otros.

### Gaps
- No encontré un documento oficial mexicano que defina "kbd" o "Mb/d"; son formas de uso común.
- La definición formal de mb/d y kb/d en el glosario de la AIE no quedó verificada: su página de unidades negó el acceso (403) y solo vi el uso en informes.
- No leí la LISH vigente directamente. La definición de barril la tomo de la cita en los Lineamientos CNH y falta confirmar que el Art. 3, fr. I siga igual tras la reforma de 2025.

## Fórmula API ↔ densidad y temperatura de referencia

### Takeaway
La fórmula API usa la gravedad específica a 60/60 °F, pero México usa **tres referencias según el contexto**: 15.56 °C para crudo, **20 °C para petrolíferos** en controles volumétricos fiscales, y 20/4 °C para la gravedad específica de la NOM-016. La NOM-016-CRE-2016 sigue vigente, ahora a cargo de SENER por conducto de la CNE; no hallé norma sucesora.

### Cited Findings
- **Fórmula:** densidad relativa = 141.5 / (131.5 + °API), referida a agua pura a 15.56 °C, con 999.016 kg/m³ fijados por API ([Lineamientos CNH, Art. 3 fr. XIV y Art. 13](https://sidof.segob.gob.mx/notas/docFuente/5409741)). La [modificación de 2020](https://sidof.segob.gob.mx/notas/docFuente/5611982) mantiene esa temperatura de referencia. El BNE da la forma inversa, Gravedad API = 141.5/GE a 60 °F − 131.5 ([BNE 2023, nota 114](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)).
- **Condiciones de referencia fiscales vigentes:** hidrocarburos a 15.56 °C (60 °F) y 101.325 kPa; petrolíferos a **20 °C (293.15 K)** y 101.325 kPa ([Anexo 21 de la RMF 2026, apartado 21.5.1, fr. I, inciso d), DOF 13-ene-2026](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf)).
- **Antecedente de numeración:** hasta 2025 el mismo texto estaba en el [Anexo 30 de la RMF](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2025/rmf/compiladas/Compilado_Primera_Modificacion_Anexo_30_RMF2025-03112025.pdf). En 2026, el [Anexo 30](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_30_RMF2026-13012026.pdf) es el de domicilios de unidades administrativas del SAT.
- **NOM-016-CRE-2016, por producto** ([texto DOF 29-ago-2016](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf)):
  - Tabla 5, gasolinas: gravedad específica a 20/4 °C, "informar".
  - Tabla 7, diésel: gravedad específica a 20/4 °C, "informar".
  - Tabla 8, turbosina Jet A1 y Jet A: densidad a 20 °C de 0.7720 a 0.8370 kg/L, sustituible por densidad a 15 °C de 0.775 a 0.840 kg/L. °API "informar". Poder calorífico 42.8 MJ/kg mínimo.
  - Tabla 9, diésel industrial, gasóleo doméstico y combustóleo: gravedad específica a 20/4 °C, "informar".
  - Tabla 10, gasavión: gravedad 20/4 °C y densidad a 15 °C, "informar".
  - Tabla 11, IFO-180: gravedad específica máxima 0.9877 a 20/4 °C.
  - Tabla 13, gas LP: densidad relativa a 15.6 °C.
- **Vigencia:** el Transitorio Vigésimo Tercero de la LSH aplica desde el 1 de enero de 2026 "en tanto no se modifique" la NOM-016 o se emita sustituta, y asigna a SENER la calidad de autoridad normalizadora, ejercida por conducto de la CNE. **Lo vi en el acervo**: `public/data/LSH_chunks.json`, id `LSH-Trans-22`; el mismo texto también aparece bajo `LSH-Art-027`. El Reglamento lo repite en su Transitorio Vigésimo Noveno: `RLSH_chunks.json`, id `RLSH-Trans-22`, y también bajo `RLSH-Art-336`.
- **Novedad reciente:** SENER publicó el 28 de octubre de 2026 lineamientos para organismos de evaluación de la conformidad de las NOM de calidad, en vigor el 29 de octubre. Las aprobaciones de la CRE o la CNE siguen válidas y el registro de laboratorios extranjeros ya no se limita a la NOM-016 ([Cuatrecasas](https://www.cuatrecasas.com/es/latam/publico/art/sener-lineamientos-evaluacion-calidad-petroliferos)).
- **Grados API en la regulación:** el Reglamento pide informar calidad, azufre y grados API de los hidrocarburos de un área de Asignación. **Lo vi en el acervo**: `RLSH_chunks.json`, id `RLSH-Art-042`; el texto también aparece en `RLSH-Art-336`.

### Inferences
- **Ejemplos resueltos (cálculo propio):**
  - Maya 22° → SG = 141.5 / 153.5 = 0.9218; ρ = 0.9218 × 999.016 = 920.9 kg/m³; 146.4 kg/bl; 6.83 bl/t.
  - SG 0.85 → API = 141.5/0.85 − 131.5 = 35.0°.
- **Error por mezclar referencias:** si un diésel con ρ60°F = 840 kg/m³ tiene SG 60/60 = 0.8408, su API es 36.8°. Su SG 20/4 sería 0.8368; meterla directo en la fórmula da 37.6°, un error de 0.8°.
- **Paso entre referencias:** usar la corrección de la siguiente sección. Valores aproximados de ρ a 20 °C: gasolina 735 → 730.9 kg/m³; diésel 840 → 836.8; Maya 921 → 918.0.
- **Catálogo:** guardar densidad con su temperatura; nunca una densidad sin referencia.

### Gaps
- No hallé una NOM publicada que sustituya a la NOM-016. Tampoco revisé cada edición del DOF de 2026, así que queda como "no localizada", no como "no existe".
- Tampoco revisé el texto consolidado de las modificaciones a la NOM-016 (etanol, por ejemplo). Las Tablas citadas son del texto original de 2016.
- No confirmé si el valor de referencia del Anexo 21 se reproduce en otra disposición de la CNE para el Expendio.

## Corrección volumétrica por temperatura (VCF) y si México la exige

### Takeaway
Sí se exige para medir con fines fiscales y regulatorios: el Anexo 21 obliga a cuantificar a condiciones de referencia y cita API MPMS 11.1. En cambio, en la bomba de gasolinera el litro se vende a la temperatura de despacho y no encontré compensación en la NOM-005. Para una calculadora pública basta 1 − β(T − T_ref) con β según densidad: error menor a 0.06 % entre 0 y 45 °C frente a la fórmula API.

### Cited Findings
- **Formulación API MPMS 11.1:2004**, según [Wikipedia, Volume correction factor](https://en.wikipedia.org/wiki/Volume_correction_factor), fuente secundaria porque el estándar es de pago:
  - VCF = exp{−α·ΔT·[1 + 0.8·α·(ΔT + δT)]}, con ΔT en °F; δT = 0 a 60 °F.
  - α60 = K0/ρ² + K1/ρ + K2, con ρ en kg/m³ a 60 °F.
- **Constantes publicadas ahí.** El grupo depende de la densidad, no del nombre del producto; un diésel puede caer en cualquiera de los dos primeros grupos de refinados. Las etiquetas de producto son aproximadas y mías.

| Grupo | °API | K0 | K1 | K2 |
|---|---|---|---|---|
| Crudo | −10 a 100 | 341.0957 | 0 | 0 |
| Refinados pesados: combustóleo y diésel más denso | −10 a 37.1 | 103.8720 | 0.2701 | 0 |
| Refinados medios: turbosina y diésel ligero | 37.1 a 48 | 330.3010 | 0 | 0 |
| Refinados: zona de transición | 48 a 52 | 1489.0670 | 0 | −0.00186840 |
| Refinados ligeros: gasolinas | 52 a 100 | 192.4571 | 0.2438 | 0 |

- **Referencias técnicas mexicanas:**
  - El Anexo 21 RMF 2026 cita API MPMS 11.1 para corrección de volumen, y API MPMS 11.2.4 para GNL y GLP (Tablas 23E, 24E, 53E, 54E, 59E, 60E) ([Anexo 21, apartado 21.7](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf)).
  - Los Lineamientos CNH, Anexo 1, usan API MPMS 12.1, Tabla 6A para el factor por temperatura y Tabla 5A para la API a 60 °F; el Art. 8 remite al Capítulo 11 ([Lineamientos CNH](https://sidof.segob.gob.mx/notas/docFuente/5409741)).
  - La [modificación de 2020](https://sidof.segob.gob.mx/notas/docFuente/5611982) agrega API MPMS 12.2.2.
- **Regulación aplicable que lista el Anexo 21:** Lineamientos CNH (DOF 29-sep-2015, con modificaciones hasta el 27-nov-2023) y las Disposiciones de medición de la CRE para transporte por ducto (DOF 17-dic-2015) y almacenamiento (DOF 11-ene-2016), en todos los casos "o las que las sustituyan" ([Anexo 21, 21.5.1, fr. I, inciso a)](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf)). Los sistemas de medición de gasolineras remiten a NOM-005-SCFI-2017 y NOM-185-SCFI-2017 (mismo Anexo).
- **Alarma de balance:** el Anexo 21 registra como inconsistencia una diferencia de más de 0.5 % en líquidos y 1 % en gases en el volumen final del periodo ([Anexo 21](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf)).
- **Base legal en el acervo:**
  - La LSH obliga a contar con equipos y programas para controles volumétricos, y a dictámenes que determinen tipo de hidrocarburo o petrolífero, poder calorífico del gas natural y octanaje de la gasolina. **Lo vi en** `LSH_chunks.json`, id `LSH-Art-119`, fr. XXII.
  - La entrega de información sobre controles volumétricos, medición y calidad: `LSH-Art-076` y `LSH-Art-089`; `RLSH_chunks.json`, `RLSH-Art-199`, `RLSH-Art-200` y `RLSH-Art-202`.
- **NOM-005-SCFI-2017 (despachadores):** error máximo tolerado de 10 mL + 2 mL/L en aprobación de modelo y verificación inicial; 20 mL + 4 mL/L en verificación periódica; aplica a volúmenes de 20 L o más ([NOM-005-SCFI-2017, numeral 5.1.1, DOF 10-oct-2018](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-005-SCFI-2017.pdf)). La temperatura aparece en la tabla de prueba para corregir la medida volumétrica a la temperatura de trabajo; no hay condición de referencia para el litro vendido (mismo documento).
- **NOM-185-SCFI-2017:** regula software y sistemas electrónicos de medición y despacho, vigente desde el 5-mar-2019 ([ficha mley.mx](https://mley.mx/normas/nom-185-scfi-2017/)).

### Inferences
- **Ejemplos resueltos (cálculo propio con las constantes anteriores; no sustituyen a las tablas oficiales):**
  - **Gasolina, 20,000 L a 35 °C, llevados a 20 °C.** ρ60 = 735 kg/m³. α = 192.4571/735² + 0.2438/735 = 0.00068796/°F. VCF(35 °C) = 0.97576; VCF(20 °C) = 0.99449; razón = 0.98117. Resultado: 19,623 L, es decir 377 L menos (1.9 %).
  - **Maya 22°, 10,000 bl a 35 °C, llevados a 60 °F.** α = 341.0957/920.9² = 0.00040219/°F; VCF = 0.98587. Resultado: 9,859 bl, 141 bl menos.
  - **Diésel, 40,000 L a 30 °C, llevados a 20 °C.** ρ60 = 840 kg/m³ (36.8 °API, primer grupo de refinados). α = 103.8720/840² + 0.2701/840 = 0.00046876/°F; razón = 0.99149. Resultado: 39,660 L.
- **Coeficientes β por °C que salen de la fórmula (TÍPICO, cálculo propio):** gasolina 0.00124 (rango 0.00115–0.00133 para 700–770 kg/m³); turbosina 0.00092 (0.00084–0.00110); diésel 0.00084 (0.00082–0.00088); combustóleo 0.00069 (0.00067–0.00072); Maya 0.00072; Istmo 0.00083; Olmeca 0.00089.
- **Fórmula simplificada para la calculadora:** V_ref = V_obs × [1 − β(T − T_ref)], con β = 1.8 × α60 según densidad.
- **Margen de error frente a la fórmula API (cálculo propio):**

| Método | Rango de temperatura | Error máximo |
|---|---|---|
| β calculada para la densidad del producto | 0 a 45 °C | ≤0.055 % (gasolina 0.055; diésel 0.026; crudos ≤0.029) |
| β fija, gasolina 0.00122, 700–770 kg/m³ | 0 a 50 °C | 0.44 % |
| β fija, turbosina 0.00095, 775–840 kg/m³ | 0 a 50 °C | 0.52 % |
| β fija, diésel 0.00083, 820–860 kg/m³ | 0 a 50 °C | 0.20 % |
| β fija, combustóleo 0.00066, 950–1000 kg/m³ | 0 a 50 °C | 0.21 % |
| β fija, crudo 0.00078, 820–960 kg/m³ | 0 a 50 °C | 0.50 % |

- **Recomendación:** implementar la fórmula exp con la tabla de constantes, y usar la lineal solo como explicación. La interfaz debe decir que es orientativa y que no sustituye la medición regulada ni las tablas de pago. La versión de 2004 agrega ajustes pequeños que no incluí, como la escala ITS-90 y la iteración de densidad.
- **Por qué importa:** 15 °C de diferencia en gasolina son 1.9 %, casi cuatro veces el umbral de alarma de 0.5 % del Anexo 21; por eso un balance sin corregir daría falsas alarmas.
- **En la bomba:** con EMT periódico de 100 mL en 20 L (0.5 %), una variación de 10 °C mueve 244 mL (1.2 %) en gasolina. No es error del instrumento, sino dilatación; la gente lo confunde con litros incompletos.

### Gaps
- El estándar API MPMS 11.1 y ASTM D1250 son de pago: no verifiqué constantes ni tablas contra el original. Falta contrastar con al menos un valor de las tablas 6B y 54B.
- La tabla para base 20 °C (de memoria, Tabla 60B en ASTM D1250) no quedó verificada, y no sé si alguna norma mexicana la nombra.
- No leí las Disposiciones de medición de la CRE (2015 y 2016), solo su cita en el Anexo 21; su temperatura base y su estado bajo la CNE quedan sin verificar.
- No hallé "Lineamientos de Medición de la CNE" que sustituyan a los de la CNH; el Anexo 21 los sigue citando en enero de 2026.
- No queda claro si el inciso d) de 21.5.1 obliga a compensar en el dispensario o solo en recepción y tanque: el Anexo remite a NOM-005 para los despachadores.

## Equivalencias de energía: bep/bpce y tep/toe

### Takeaway
En México, 1 bep **no es fijo**: es el barril de crudo promedio de la producción nacional del año, 6,427.76 MJ en la Lista 2025 y 6,122 MJ hasta 2022. La tep es una convención: 41.868 GJ = 10⁷ kcal. El BNE no reporta en tep. La calculadora debe guardar el bep con su año.

### Cited Findings
- El bep de referencia corresponde al barril de crudo promedio de la producción nacional; 6,427.76 MJ/bl con factor 1.0000 ([Lista 2025, nota 1](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf)).
- Valores anteriores: 6,312 (2016), 6,122 (2017–2022), 6,347 (2023–2024) ([Serie histórica CONUEE](https://www.gob.mx/cms/uploads/attachment/file/995835/Serie_hist_rica_de_la_lista_de_combustibles_y_sus_poderes_calor_ficos_2016-2025.pdf)).
- El Energy Institute usa 41.868 PJ por millón de toneladas para pasar petróleo a energía, según [Our World in Data, citando la Statistical Review 2026](https://ourworldindata.org/grapher/oil-production-by-region?tab=chart).
- Una [copia de terceros del apéndice EI](https://www.docsity.com/en/docs/approximate-conversion-factors-1/8922951/) da 7.33 barriles por tonelada de crudo, y redondea la tep a 42 GJ. Fuente débil; verificar.
- 1 cal = 4.1868 J ([BNE 2023, Cuadro B.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)), exacto para la caloría IT ([NIST](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8)).
- EIA usó 5.800 MMBtu/bl para su producción de crudo hasta 2014 y después calcula por API ([EIA, Apéndice A](https://www.eia.gov/totalenergy/data/monthly/pdf/mer_a_doc.pdf)).

### Inferences
- **Cálculo propio:**
  - 1 tep = 41.868 GJ = 39.68 MMBtu = 6.5136 bep México 2025.
  - 1 bep México 2025 = 6.42776 GJ = 6.092 MMBtu = 1,535 Mcal.
  - El bep de 2017–2022 equivale a 5.802 MMBtu, casi igual al 5.800 de EIA.
- **Comparación:** 7.33 bl/t da 5,712 MJ/bl implícitos, frente a 6,428 MJ/bl de México. Un 12.5 % de diferencia entre "bep" según quien lo use.
- **Cambio de año:** 100 bep de 2022 son 612,168 MJ y 100 bep de 2025 son 642,776 MJ (+5.0 %). Comparar series en bep sin decir el año es un error.
- **Ejemplo:** 100 Mbd de gasolina = 100,000 bl/d × 5,613 MJ = 561.3 TJ/d = 87,320 bep/d = 204.9 PJ/año.

### Gaps
- No pude verificar la definición de tep en la AIE (su página negó acceso), ni la tabla oficial de la Statistical Review 2026.
- No verifiqué un factor oficial de bep usado por la AIE o EI.
- El factor de gas a bep que usa Pemex para reservas (recuerdo 5.201 mil pies cúbicos por barril) no apareció en las búsquedas, así que no lo uso; corresponde al tema de gas natural.
- La búsqueda de "tep" y "tonelada equivalente" en el texto del BNE 2023 no dio resultados; esto apoya pero no demuestra que nunca se use en México.

## Volúmenes prácticos: autotanques, buques, carrotanques e inventarios

### Takeaway
La única cifra oficial firme es la política de almacenamiento: mínimo de **5 días para gasolina y diésel, y 1.5 para turbosina** (reportado como vigente en marzo de 2026). Para autotanques solo hay rangos de 2019; para buques y carrotanques no hallé fuente oficial, así que deben ir como "ejemplo editable".

### Cited Findings
- **Inventario mínimo:** la modificación de 2019 fijó 5 días de gasolina y diésel desde 2020 y hasta 2025, frente a 13 días previstos para 2025 en la versión anterior, y 1.5 días de turbosina en ciertas condiciones; SENER debe revisar la política cada 5 años ([White & Case, texto en español](https://www.whitecase.com/sites/default/files/2019-12/amendment-public-policies-regarding-minimum-storage-oil-products-spanish.pdf); [Acuerdo en SIDOF](https://sidof.segob.gob.mx/notas/docFuente/5581171)).
- **Situación en 2026:** Expansión reporta en marzo de 2026 el mismo mínimo de 5 días y 1.5 de turbosina ([Expansión](https://expansion.mx/empresas/2026/03/23/mexico-tiene-hasta-5-dias-reservas-de-combustibles-otros-paises-cuentan-con-90)).
- **Autotanques:** la SHCP indicó en 2019 que la flota anterior iba de 20,000 a 40,000 L y las unidades compradas de 30,000 a 60,000 L ([comunicado SHCP, copia en Lopez-Dóriga](https://lopezdoriga.com/wp-content/uploads/2019/04/cpm-shcp-adquisicion-autotanques-29abr19.pdf)).

### Inferences
- **Cálculo propio:** 20,000 L = 125.8 bl; 30,000 L = 188.7 bl; 60,000 L = 377.4 bl.
- **Fórmula de inventario:** volumen = días × demanda diaria. Ejemplo ilustrativo con demanda inventada de 700 Mbd: 5 días = 3.5 MMb = 556,455 m³. La calculadora debe pedir la demanda al usuario.
- **Catálogo:** autotanque de 30,000 L como "ejemplo editable, rango oficial 2019".

### Gaps
- Sin fuente oficial verificada para capacidad de buquetanque y carrotanque. Vi una nota de Forbes México que atribuye a SENER 200,000–300,000 barriles por buque, pero no pude rastrearla a un documento oficial.
- La política fijaba metas hasta 2025: no confirmé si SENER la modificó o prorrogó en 2026; solo tengo la nota de prensa.
- Los límites de peso y dimensiones en la NOM-012-SCT no quedaron revisados.

## Precio: $/L, $/bl, USD/bl, $/GJ e IEPS

### Takeaway
La conversión es aritmética y no necesita fuente, salvo el poder calorífico elegido. El IEPS sigue vigente como cuota por litro y tiene dos capas: la cuota anual del DOF y el estímulo semanal que cambia lo que se paga. Hay un XML público en vivo de precios por estación, heredado de la CRE.

### Cited Findings
- **Cuotas IEPS 2026** (Acuerdo 179/2025, DOF 22-dic-2025): Magna (menos de 91 octanos) 6.7001 $/L; Premium 5.6579 $/L; diésel 7.3634 $/L. Componente estatal: 59.13, 72.16 y 49.08 centavos ([El Contribuyente](https://www.elcontribuyente.mx/2025/12/actualizacion-del-ieps-para-2026-cuotas-factores-y-efectos-fiscales/)).
- **Estímulo semanal:** para el 17–23 de octubre de 2026, Premium pagaba 1.9128 $/L con 3.7451 $/L de estímulo, y el diésel pagaba cero porque el estímulo cubría los 7.3634 $/L ([Tiempo](https://www.tiempo.com.mx/local/ieps-gasolinas-diesel-17-de-octubre-2026/)).
- **Datos abiertos:** consulté el 8-nov-2026 `https://publicacionexterna.azurewebsites.net/publicaciones/prices` y responde un XML con `<place place_id>` y `<gas_price type="regular|premium|diesel">` ([endpoint público](https://publicacionexterna.azurewebsites.net/publicaciones/prices)). La CRE anunció datos de precios por permisionario en la plataforma de Datos Abiertos ([Energy Magazine](https://energymagazine.mx/?p=32755)).

### Inferences
- **Fórmulas (cálculo propio, precio y tipo de cambio ilustrativos):**
  - $/bl = $/L × 158.987294928. Ejemplo: 23 $/L = 3,656.71 $/bl.
  - USD/bl = ($/bl) / (MXN/USD). A 18.5: 197.66 USD/bl.
  - $/GJ = ($/L) / (MJ/L) × 1000. Ejemplo: 23 / 35.305 × 1000 = 651.5 $/GJ con Lista; 706.4 $/GJ con IPCC a 0.735 kg/L.
  - IEPS en $/bl: Magna 1,065.23; Premium 899.53; diésel 1,170.69.
- **El estímulo cuadra:** 1.9128 + 3.7451 = 5.6579, la cuota de Premium. Conviene distinguir "cuota" de "cuota después de estímulo".
- **Recomendación:** no mostrar precio al día. Si se quiere una referencia opcional, el XML es la opción más directa, con la advertencia de que es un endpoint heredado, sin documentación que yo haya hallado, y sin fecha en el fragmento revisado.

### Gaps
- Leí las cuotas en prensa especializada, no en el DOF directamente; verificar el Acuerdo 179/2025 y los acuerdos semanales antes de citarlos.
- No encontré cuota vigente de noviembre de 2026.
- No confirmé si la CNE sustituirá el endpoint ni si el XML seguirá publicándose; tampoco leí el campo de fecha ni el catálogo de estaciones.
- La API de tipo de cambio de Banxico no se revisó en esta investigación.

## Emisiones por combustible

### Takeaway
Los factores oficiales vigentes que localicé son los del Acuerdo RENE (DOF 3-sep-2015), que coinciden con los valores por defecto de IPCC 2006 para CO2. Son factores sobre energía neta: multiplicarlos por la Lista da de 4 % a 8 % más que hacerlo con energía física. Uso Lista × RENE por defecto porque es la vía del propio Acuerdo, y muestro IPCC como contraste.

### Cited Findings
- **Factores del Artículo Sexto, numeral 2, fuentes fijas** (CO2 en t/MJ; CH4 y N2O en kg/MJ): gasolinas y naftas 6.93E-05; diésel 7.41E-05; combustóleo 7.74E-05; querosenos 7.19E-05; turbosina 7.15E-05; coque de petróleo 9.75E-05; crudo 7.33E-05; CH4 3.0E-06 y N2O 6.0E-07 en todos ([Acuerdo RENE, DOF 3-sep-2015](https://dof.gob.mx/nota_detalle.php?codigo=5406149&fecha=03%2F09%2F2015)). Gasóleo 7.41E-05 según la [transcripción de ANIQ](https://aniq.org.mx/eventos/2017/CursoCOAFAMSA/docs/Abril%204/herramientas/E%20factores%20emisi%C3%B3n%20y%20calentamiento%20RENE.pdf).
- **Fuentes móviles, numeral 1:** gasolina vehicular CH4 2.5E-05 y N2O 8.0E-06; diésel vehicular CH4 3.9E-06 y N2O 3.9E-06; combustóleo marítimo CH4 7.0E-06 y N2O 2.0E-06 ([Acuerdo RENE](https://dof.gob.mx/nota_detalle.php?codigo=5406149&fecha=03%2F09%2F2015)).
- **Poder calorífico a usar:** el Artículo Cuarto remite al medido en el combustible o al que determine la CONUEE; el Acuerdo no trae tabla propia ([Acuerdo RENE](https://dof.gob.mx/nota_detalle.php?codigo=5406149&fecha=03%2F09%2F2015)).
- **Potenciales de calentamiento:** N2O 265 y CH4 28, en la [transcripción de ANIQ del Acuerdo de potenciales](https://aniq.org.mx/eventos/2017/CursoCOAFAMSA/docs/Abril%204/herramientas/E%20factores%20emisi%C3%B3n%20y%20calentamiento%20RENE.pdf). El valor de CH4 lo leí en una tabla mal alineada: verificar en el DOF.
- **IPCC 2006 Tabla 1.4** (kg CO2/TJ, con IC 95 %): gasolina 69,300 (67,500–73,000); jet 71,500 (69,700–74,400); otros querosenos 71,900; gas/diésel 74,100 (72,600–74,800); residual 77,400 (75,500–78,800); coque 97,500 (82,900–115,000); crudo 73,300 (71,100–75,500) ([IPCC 2006](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_1_Ch1_Introduction.pdf)).
- **Inventario nacional:** toma factores propios para diésel y combustóleo de un informe del INECC de 2014 ([Consideraciones metodológicas del INEGyCEI 2015](https://www.snieg.mx/DocAcervoINN/documentacion/inf_nvo_acervo/snigma/Inv_Nal_Gas_Comp_Efect_Inver/Consideraciones_metodologicasINEGyCEI_2015.pdf)).

### Inferences
- **Factores por unidad (cálculo propio):**

| Combustible | tCO2e/TJ fijo | tCO2e/TJ móvil | kg CO2/L, Lista × RENE | kg CO2/L, IPCC por densidad |
|---|---|---|---|---|
| Gasolina | 69.54 | 72.12 | 2.447 | 2.256 (2.149–2.364) |
| Turbosina | 71.74 | n/d | 2.648 | 2.537 (2.434–2.639) |
| Diésel | 74.34 | 75.24 | 2.827 | 2.676 (2.613–2.740), densidad supuesta |
| Combustóleo | 77.64 | 78.13 marítimo | 3.240 | 3.109 |
| Crudo promedio | 73.54 | n/d | 2.963 | Maya 2.858; Istmo 2.675; Olmeca 2.581 |
| Coque | 97.74 | n/d | 3.366 t/t (Lista) | 3.169 t/t (IPCC) |

- **Ejemplo:** 1 L de diésel, 38.148 MJ × 74.1 g/MJ = 2.827 kg CO2. Más CH4 y N2O de fuente móvil: 38.148 MJ × 75.24 g/MJ = 2.870 kg CO2e.
- **Comparar peras con peras:** el factor de IPCC viene emparejado con su propio poder calorífico. Combinarlo con la Lista es legal según el Artículo Cuarto, pero si la Lista resulta estar cerca del bruto, sobrestima. Por eso muestro las dos.

### Gaps
- Una [guía secundaria de 2026](https://certificatuenergia.com/registro-nacional-de-emisiones-rene/) menciona un aviso de SEMARNAT del 29 de mayo de 2026 como fuente de factores. No lo encontré; podría ser el factor del sistema eléctrico. No confirmé si hay reforma del Acuerdo de 2015.
- No leí el DOF del Acuerdo de potenciales (14-ago-2015), solo una transcripción.
- No extraje los factores nacionales del INECC 2014 por combustible.

## Velocidades y flujo en ductos

### Takeaway
bpd ↔ m³/h ↔ L/min ↔ gpm son factores exactos. La velocidad por diámetro es aritmética simple y sí tiene sentido en una calculadora pública. Darcy–Weisbach sirve como orden de magnitud solo en flujo turbulento y con diámetro interior, viscosidad y rugosidad explícitas.

### Cited Findings
- **Fórmula de fricción explícita:** Swamee–Jain, f = 0.25 / [log₁₀(ε/(3.7D) + 5.74/Re^0.9)]², válida para 5,000 ≤ Re ≤ 10⁸ y 10⁻⁶ ≤ ε/D ≤ 0.05; la zona de transición entre Re 2,300 y 4,000 es muy incierta ([Wikipedia, Darcy friction factor formulae](https://en.wikipedia.org/wiki/Darcy_friction_factor_formulae)).
- **Viscosidades mexicanas:** diésel 1.9 a 4.1 mm²/s a 40 °C ([NOM-016, Tabla 7](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf)); combustóleo pesado 636 a 1166 cSt a 50 °C ([HDS Pemex](https://www.pemex.com/comercializacion/productos/HDS/refinados/HDS%20SAC%20Combust%C3%B3leo%20pesado%20v2.pdf)).

### Inferences
- **Fórmulas (cálculo propio):**
  - m³/h = bpd × 0.00662447; L/min = bpd × 0.110408; gpm = bpd × 0.0291667.
  - v = 4Q / (πD²), con D interior.
  - Re = vD/ν.
  - Δp = f (L/D) ρ v²/2.
- **Ejemplo:** 100 Mbd = 662.45 m³/h = 11,041 L/min = 2,917 gpm.
- **Resultados con D interior y rugosidad de 0.045 mm supuestos (sin fuente oficial):**

| Caso | D (m) | Q (m³/h) | v (m/s) | Re | f | Δp (bar/km) |
|---|---|---|---|---|---|---|
| 30 Mbd diésel, 8" | 0.2027 | 198.7 | 1.71 | 115,586 | 0.0187 | 1.13 |
| 100 Mbd diésel, 12" | 0.3048 | 662.4 | 2.52 | 256,226 | 0.0162 | 1.42 |
| 100 Mbd gasolina, 12" | 0.3048 | 662.4 | 2.52 | 1,281,128 | 0.0139 | 1.07 |
| 100 Mbd diésel, 16" | 0.3937 | 662.4 | 1.51 | 198,368 | 0.0165 | 0.40 |
| 340 Mbd crudo ligero, 24", ν 20 mm²/s | 0.5906 | 2,252.3 | 2.28 | 67,439 | 0.0198 | 0.79 |

- **Viscosidades usadas:** diésel 3 mm²/s, dentro del rango de norma; gasolina 0.6 mm²/s y crudo 20 mm²/s son supuestos sin fuente verificada.
- **Recomendación:** incluir velocidad siempre. Incluir Δp como opción avanzada, con avisos: no sirve para combustóleo sin calentar, donde el flujo sería laminar (Re ~1,500 a 900 mm²/s en 24"), y no incluye perfil del terreno, válvulas ni bombas.

### Gaps
- Sin fuente oficial mexicana para velocidad recomendada en ductos, rugosidad o diámetro interior por cédula; no incluyo un "rango recomendado".
- Las Disposiciones CRE de transporte por ducto no se leyeron.

## Trampas

### Takeaway
Los errores más probables en esta calculadora: leer M como mega, ignorar la temperatura de referencia, creer que el "neto" mexicano es comparable con el neto IPCC, y tratar el bep como unidad fija.

### Cited Findings
- **M no es mega.** Mbd son miles, y en Pemex "Mt" son miles de toneladas ([Pemex 6-K](https://www.sec.gov/Archives/edgar/data/932782/000119312514208544/d729367d6k.htm); [BNE 2023, Cuadros B.1 y B.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)).
- **Dos temperaturas fiscales en un mismo inciso:** 15.56 °C para hidrocarburos, 20 °C para petrolíferos ([Anexo 21 RMF 2026](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf)).
- **Cambió la numeración:** "Anexo 30" es controles volumétricos hasta 2025 ([RMF 2025](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2025/rmf/compiladas/Compilado_Primera_Modificacion_Anexo_30_RMF2025-03112025.pdf)). En 2026 es [Anexo 21](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf), y el [Anexo 30 de 2026](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_30_RMF2026-13012026.pdf) es otro tema.
- **Gasóleo en otra unidad:** 42,524 MJ/m³, mientras los demás líquidos van en MJ/bl ([Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf)).
- **Coque en toneladas** en la [Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf), mientras EIA usa una convención de 5 barriles por tonelada corta ([EIA, Apéndice A](https://www.eia.gov/totalenergy/data/monthly/pdf/mer_a_doc.pdf)).
- **La Lista cambia y salta:** gasolinas y naftas pasó de 5,134 a 5,613 MJ/bl entre 2016 y 2023, con 5,593 en 2020 y 5,269 en 2021 ([Serie histórica](https://www.gob.mx/cms/uploads/attachment/file/995835/Serie_hist_rica_de_la_lista_de_combustibles_y_sus_poderes_calor_ficos_2016-2025.pdf)).
- **Año de la lista ≠ año del dato:** Lista 2021 cita BNE 2019 ([Lista 2021](https://www.gob.mx/cms/uploads/attachment/file/619062/Lista_Combustibles_2021_26feb2021.pdf)); Lista 2025 cita BNE 2023 preliminar ([Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf)).
- **Fundamento desactualizado:** la Lista 2025 se fundamenta en la Ley de Transición Energética y su Reglamento ([Lista 2025, p. 3](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf)). La base actual que vi en el acervo es `RLPTE-Art-075`.
- **Gas vs líquidos:** los volúmenes de gas seco de la Lista están a 20 °C y 100 kPa ([Lista 2025, notas](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf)); el [Anexo 21](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf) usa 101.325 kPa en todos sus casos, así que esas condiciones no coinciden.
- **Hojas de seguridad poco útiles para densidad:** la HDS unificada de gasolinas da 0.65–0.87 a 15.5/15.5 °C, mucho más amplio que el 0.700–0.770 a 20/4 °C de las hojas por producto ([HDS Gasolinas TRI-7](https://www.pemex.com/comercializacion/productos/HDS/refinados/HDS%20SAC%20Gasolinas%20%28Premium%20y%20Magna%29%20TRI-7.pdf)).
- **Zapoteco mal etiquetado:** la prensa lo llama súper ligero con 29–29.9 °API ([Energy Magazine](https://energymagazine.mx/2024/04/pemex-aumenta-9-4-exportaciones-de-crudo-zapoteco)), pero esa densidad cae en "mediano" en el [Cuadro B.3 del BNE](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf).
- **GLP no usa estas fórmulas:** el Anexo 21 remite a tablas propias de API MPMS 11.2.4 ([Anexo 21](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_21_RMF2026-13012026.pdf)).
- **Redondeos del BNE:** 1 gal = 3.7854 L y 1 m³ = 6.2898 bl ([BNE 2023, Cuadro B.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf)). Encadenarlos no reproduce los exactos.

### Inferences
- **SG 20/4 no es SG 60/60:** meter la cifra de la NOM-016 en la fórmula API da hasta 0.8° de error (ver sección de API).
- **Gasóleo, valor sospechoso:** 42.52 MJ/L supera al combustóleo (41.87) y al diésel (38.15). Parece un valor por kilogramo rotulado por metro cúbico (42.5 MJ/kg es normal para un gasóleo). Lo mostraría con aviso, sin corregirlo, hasta que SENER lo aclare. Es una hipótesis mía.
- **Lista/0.95 no es un PCS real:** ver la tabla maestra. Si el neto ya está cerca del bruto, dividir entre 0.95 lo infla.
- **Magna y Premium no se distinguen** en energía oficial: no presentar diferencias entre ellas con la Lista.
- **Densidad de norma no es promedio:** el rango 0.7720–0.8370 de turbosina es un límite de calidad, no un valor representativo; el punto medio 0.8045 es solo un supuesto.
- **Cuota IEPS ≠ IEPS pagado:** el estímulo semanal puede dejarlo en cero.
- **Dilatación ≠ fraude:** ver el ejemplo de 10 °C frente al EMT de NOM-005.
- **Acervo, aviso de datos:** el texto del Transitorio Vigésimo Tercero de la LSH aparece también con id `LSH-Art-027`, y el Vigésimo Noveno del RLSH también con `RLSH-Art-336`. Si la app cita artículos, puede atribuir un transitorio a un artículo equivocado. Conviene revisarlo por separado.

### Gaps
- Falta una opinión técnica o aclaración oficial de SENER sobre por qué sus "netos" quedan por encima del cálculo físico; solo tengo mi comparación. Antes de publicar esa afirmación en el sitio convendría preguntarle a la Subsecretaría de Planeación y Transición Energética, que firmó el oficio base de la Lista 2025.
