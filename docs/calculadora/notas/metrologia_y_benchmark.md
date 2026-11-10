# Base metrológica, equivalencias mexicanas y benchmark de calculadoras energéticas

Corte: 8 de noviembre de 2026. Los números van con punto decimal y espacio en miles, como permite la NOM-008-SE-2021.

Clases usadas en todas las tablas:

- **EXACTO**: la fuente lo imprime como exacto (negritas o nota de NIST, tabla de la NOM).
- **EXACTO-DER**: exacto por aritmética a partir de definiciones exactas. La fuente imprime solo el redondeo, que va en la columna «Redondeo impreso». Las cifras completas las calculé con fracciones en esta corrida; no son una cita.
- **CONV**: valor convenido, pero hay más de una definición en uso.
- **TÍPICO**: depende del combustible, el año o las condiciones.
- **SFV**: sin fuente verificada.

Unidades base: J, W, Pa, K, kg, m³, m³/s, kg/s, m/s, m².

## Sistema: NOM-008, Ley de Infraestructura de la Calidad y CENAM

### Takeaway
La norma vigente es la NOM-008-SE-2021 y canceló a la NOM-008-SCFI-2002. Permite punto o coma decimal y agrupa en tres con espacio, nunca con coma ni punto. No incluye bar, atm, kgf/cm², caloría, Btu ni hp, y prohíbe los términos «billón» y «trillón». Casi todo lo que usa el sector queda fuera del sistema oficial, así que la calculadora debe mostrar siempre el equivalente en unidades oficiales.

### Cited Findings
- **Vigencia.** Publicada en el DOF el 29-12-2023; entra en vigor 180 días naturales después y cancela a la NOM-008-SCFI-2002 — [NOM-008-SE-2021, transitorios](https://sidof.segob.gob.mx/notas/docFuente/5713228). El registro de la Secretaría de Economía la marca vigente con entrada en vigor el 26-06-2024 — [PLATIICA](https://platiica.economia.gob.mx/normalizacion/nom-008-se-2021/). Un resumen comercial da otra fecha, 29-07-2024; el cómputo de 180 días coincide con el registro — [mexicanlaws](https://mexicanlaws.com/scfi/NOM-008-SE-2021.htm).
- **Ley.** El Sistema General de Unidades de Medida es el único oficial y obligatorio; sus unidades y reglas se fijan en NOM elaboradas por la Secretaría con el CENAM — [LIC, art. 97](https://www.diputados.gob.mx/LeyesBiblio/pdf/LICal_010720.pdf).
- **Unidades ajenas.** No se permiten en transacciones comerciales, servicios, documentación, anuncios, publicaciones o capacitación, salvo cinco excepciones: documentos anteriores a la actualización de la unidad, perspectiva histórica, documentos para países con otro sistema, tratados internacionales y autorización de la Secretaría. En este último caso debe darse también la equivalencia en el sistema oficial — [LIC, art. 97](https://www.diputados.gob.mx/LeyesBiblio/pdf/LICal_010720.pdf).
- **Verificación y patrones.** La Secretaría, con el CENAM, verifica el uso del sistema en ámbitos público y privado — [LIC, art. 98](https://www.diputados.gob.mx/LeyesBiblio/pdf/LICal_010720.pdf). El CENAM y los institutos designados conservan los patrones nacionales — [LIC, art. 99 en mley.mx](https://mley.mx/LICal_010720/articulo/99/).
- **Signo decimal.** Coma o punto sobre la línea; si el número es menor que la unidad, va precedido de cero. Los dígitos pueden separarse con espacio en grupos de tres, a ambos lados del signo decimal, y esos grupos no pueden separarse con puntos ni comas — [NOM-008-SE-2021, 6.2](https://sidof.segob.gob.mx/notas/docFuente/5713228).
- **Símbolos.** Sin plural y sin punto final, salvo por ortografía; prefijo pegado al símbolo; no se admiten prefijos compuestos — [NOM-008-SE-2021, 6.3.1 y 6.3.3](https://sidof.segob.gob.mx/notas/docFuente/5713228). Los ejemplos escriben «45 kg» con espacio, pero la norma no enuncia esa regla en un numeral propio (revisé el texto completo) — [NOM-008-SE-2021](https://sidof.segob.gob.mx/notas/docFuente/5713228).
- **Términos prohibidos.** No se permite usar billón, trillón ni sus abreviaciones; tampoco «partes por millón» — [NOM-008-SE-2021, 6.3.1](https://sidof.segob.gob.mx/notas/docFuente/5713228).
- **Prefijos.** La Tabla 8 llega de 10⁻²⁴ a 10²⁴; no trae ronna (R, 10²⁷) ni quetta (Q, 10³⁰) — [NOM-008-SE-2021, Tabla 8](https://sidof.segob.gob.mx/notas/docFuente/5713228), adoptados por la 27.ª CGPM en 2022 — [BIPM, Resolución 3](https://www.bipm.org/en/cgpm-2022/resolution-3).
- **Errata probable.** La versión HTML de la Tabla 8 imprime «Da», «H» y «K» para deca, hecto y kilo, mientras el numeral 6.3.3 dice da, h y k en minúscula — [NOM-008-SE-2021](https://sidof.segob.gob.mx/notas/docFuente/5713228).
- **Unidades aceptadas fuera del SI.** Tabla 7: minuto, hora, día, grado, minuto y segundo de arco, hectárea, litro, tonelada, dalton, unidad astronómica, electronvolt, neper, bel y decibel. Bar, atm, cal, Btu y hp no aparecen — [NOM-008-SE-2021, Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228).
- **La práctica oficial no sigue la regla.** El BNE 2023 escribe «1,000 kilogramos» y «6,427.76», y todavía cita la NOM cancelada — [BNE 2023, anexo B, p. 221](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). La Lista 2025 de CONUEE usa «6 427.76» — [Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf). La Lista 2026 mezcla «6,347.00» y «39 082.50» en la misma tabla — [Lista 2026](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf).
- **Comportamiento del navegador.** Probé `Intl.NumberFormat('es-MX')`: da «1,234,567.891», con coma de miles, contra la NOM. `es-ES` da «1.234.567,891». Es prueba propia en Node, sin fuente externa.
- **Acervo local (`public/data/*.json`).** Busqué en el texto de los 18 archivos: «NOM-008» y «petajoule» tienen 0 coincidencias. La LIC solo se menciona por nombre (por ejemplo `LSH_chunks.json` art. 112 y `RLSH_chunks.json` art. 266). No revisé la tabla `leyes` de Supabase.

### Inferences
- Salida recomendada: punto decimal y espacio delgado en miles. Es legal y es lo que un lector mexicano espera del decimal. Hay que formatear a mano, porque `es-MX` mete comas.
- Entrada: aceptar lo que el público escribe, incluido «1,000», y mostrar en vivo cómo se interpretó. «1,234» y «1.234» son ambiguos.
- La calculadora puede ofrecer unidades ajenas, pero conviene mostrar siempre al lado la unidad oficial. El art. 97 menciona «publicaciones», y mostrar la equivalencia es la salida prudente. Esto no es una opinión jurídica.

### Gaps
- No leí el documento del CENAM «Sistema Inglés de Unidades», que el BNE cita como puente hacia NIST SP 811 — [BNE 2023, p. 222](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). El sitio del CENAM falló por conexión.
- No verifiqué contra la imagen del DOF si «Da, H, K» es errata del original o solo del HTML.
- No sé si la Secretaría autorizó alguna unidad de otro sistema bajo el art. 97, fracción V, para el sector energético.

## Energía

### Takeaway
México usa la caloría IT: el BNE fija 1 cal = 4.1868 J y 1 MWh = 3 600 MJ, y remite a NIST SP 811. El valor exacto del Btu IT es 1 055.055 852 62 J; lo que NIST imprime en su tabla es un redondeo. Solo tep, tec y bep admiten más de un valor, y el bep mexicano cambia cada año.

### Cited Findings

| Unidad | Símbolo | Factor a J (completo) | Redondeo impreso | Clase | Fuente |
|---|---|---|---|---|---|
| joule y múltiplos | J, kJ, MJ, GJ, TJ, PJ, EJ | 1, 10³, 10⁶, 10⁹, 10¹², 10¹⁵, 10¹⁸ | — | EXACTO | [NOM Tabla 8](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| watt-hora | Wh | 3 600 | — | EXACTO-DER (1 h = 3 600 s) | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| kilowatt-hora | kWh | 3 600 000 | 3.6 E+06 | EXACTO | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| MWh, GWh, TWh | MWh, GWh, TWh | 3.6×10⁹, 3.6×10¹², 3.6×10¹⁵ | 1 MWh = 3 600 MJ | EXACTO | [BNE 2023, Cuadro B.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf) |
| caloría IT (usar por defecto) | cal | 4.1868 | 4.1868 E+00 | EXACTO | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) y [BNE, Cuadro B.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf) |
| kcal, Mcal, Gcal (IT) | kcal, Mcal, Gcal | 4 186.8; 4.1868×10⁶; 4.1868×10⁹ | kcal 4.1868 E+03 | EXACTO | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| caloría termoquímica | cal_th | 4.184 | 4.184 E+00 | EXACTO | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| caloría a 15 °C | cal₁₅ | 4.185 80 | 4.185 80 E+00 | no exacto | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| caloría a 20 °C / media | cal₂₀ / cal | 4.181 90 / 4.190 02 | igual | no exacto | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| Btu IT (usar por defecto) | Btu | 1 055.055 852 62 | 1.055 056 E+03 | EXACTO (nota 9) | [NIST SP 811 PDF, nota 9](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| Btu termoquímico | Btu_th | 1 054.350 264 488 9 | 1.054 350 E+03 | EXACTO-DER (de cal_th) | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| Btu a 59 °F / 60 °F / 39 °F / medio | Btu | 1 054.80 / 1 054.68 / 1 059.67 / 1 055.87 | igual | no exacto | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| Btu «ISO» | Btu | 1 055.06 implícito (therm EC ÷ 10⁵) | — | SFV como definición ISO | deducido de [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| millón de Btu | MMBtu | 1 055 055 852.62 (1.055 055 852 62 GJ) | 1 MMBtu = 1.0551 GJ en CER | EXACTO-DER | [NIST nota 9](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf), [CER](https://apps.cer-rec.gc.ca/Conversion/conversion-tables.aspx) |
| therm EC | thm | 105 506 000 | 1.055 06 E+08 | EXACTO | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| therm EE. UU. | thm | 105 480 400 | 1.054 804 E+08 | EXACTO | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| quad (10¹⁵ Btu IT) | quad | 1.055 055 852 62×10¹⁸ | 1.055 056 E+18 | EXACTO-DER | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| tonelada equivalente de petróleo | tep / toe | 41 868 000 000 (41.868 GJ = 10⁷ kcal IT) | 41.868 GJ | CONV | [Manual IEA/Eurostat, anexo 3](https://www.enerclub.es/wp-content/uploads/2013/02/statistics_manual_spanish.pdf) |
| tep en ONU, valor tradicional | TOE | 42 621 600 000 (42.6216 GJ) | 42.6216 TJ por 1 000 TOE | CONV, distinto | [UNSD](https://unstats.un.org/unsd/energy/balance/conversion.htm) |
| tonelada equivalente de carbón | tec / tce | 29 307 600 000 (29.3076 GJ = 7×10⁶ kcal IT) | 29.3076 TJ por 1 000 TCE | CONV | [UNSD](https://unstats.un.org/unsd/energy/balance/conversion.htm) |
| bep EE. UU. (5.8 MMBtu) | boe | 6 119 323 944 (con Btu IT) | 5.8 millones de Btu | CONV | [26 U.S.C. §45K(d)(5)](https://www.law.cornell.edu/uscode/text/26/45K) |
| bep México | bep | 6 347 000 000 en 2026 (cambia cada año; ver equivalencias) | 6 347.00 MJ/bl | TÍPICO | [Lista 2026](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf) |

- **kWh eléctrico y térmico.** El factor es el mismo, 3.6 MJ; lo que cambia es la etiqueta. CONUEE lo llama «equivalente de electricidad en términos secundarios», 3 600 MJ/MWh — [Lista 2026](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf).
- **Relaciones de control (derivadas):** 1 GJ = 0.947 817 120 313 MMBtu = 277.777… kWh; 1 kWh = 3 412.141 633 Btu IT; 1 MWh = 3.412 141 633 MMBtu; 1 tep = 11.63 MWh exactos = 39.683 207 MMBtu. El manual IEA/Eurostat da 1 Mtep = 4.1868×10⁴ TJ = 3.968×10⁷ MBtu = 11 630 GWh — [Manual IEA/Eurostat, anexo 3](https://www.enerclub.es/wp-content/uploads/2013/02/statistics_manual_spanish.pdf). EIA redondea a 1 kWh = 3 412 Btu — [EIA](https://www.eia.gov/energyexplained/units-and-calculators/energy-conversion-calculators.php).
- **Tamaño del error por elegir mal.** cal_th contra cal_IT: −0.067 %. Btu_th contra Btu_IT: −0.067 %. therm EE. UU. contra therm EC: −0.024 %. Son cálculos propios con los valores de la tabla.
- **El bep no es uno.** 1 tep equivale a 6.597 bep México 2026 (41 868 ÷ 6 347) y a 6.842 boe con 5.8 MMBtu (cálculos propios). La cifra de 7.33 bbl/t que circula, con rango de 6.5 a 7.9 según el crudo, solo la vi en un fragmento de búsqueda de una tabla de terceros: queda SFV. La Academia de EE. UU. confirma el control 1 tep = 41.868 GJ = 39.683 MMBtu, sin dar barriles — [NRC 2007, apéndice G](https://www.nationalacademies.org/read/11977/chapter/17).
- **Otro valor en circulación.** Un resultado de búsqueda (no abrí la página) redondea la tep a 42 GJ — [Connaissance des Énergies](https://www.connaissancedesenergies.org/questions-et-reponses-energies/unites-de-lenergie-quest-ce-quune-tep).

### Inferences
- Defaults mexicanos: cal IT, Btu IT, tep 41.868 GJ. Las variantes se ofrecen, pero con selector explícito.
- El bep debe pedir siempre su definición: «México, año X» o «5.8 MMBtu». No debe tener un factor único en la tabla.

### Gaps
- No pude abrir las «Approximate conversion factors» del Energy Institute (403). Sus valores quedan SFV.
- No vi una definición normativa mexicana de Btu; el BNE solo define caloría y MWh. El default de Btu IT es inferencia a partir de su remisión a NIST.
- No encontré una definición legal mexicana de tep o tec.

## Potencia

### Takeaway
Hay varios «caballos» distintos, con 1.4 % de diferencia entre hp mecánico y CV. Solo el hp eléctrico es exacto en la tabla de NIST, pero el mecánico y el métrico son exactos si se derivan de su definición.

### Cited Findings

| Unidad | Símbolo | Factor a W (completo) | Redondeo impreso | Clase | Fuente |
|---|---|---|---|---|---|
| watt y múltiplos | W, kW, MW, GW | 1, 10³, 10⁶, 10⁹ | — | EXACTO | [NOM Tabla 8](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| hp mecánico (550 ft·lbf/s) | hp | 745.699 871 582 270 22 | 7.456 999 E+02 | EXACTO-DER | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| hp métrico (75 kgf·m/s) | CV | 735.498 75 | 7.354 988 E+02 | EXACTO-DER; la definición de 75 kgf·m/s no está en la fila de NIST | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| hp eléctrico | hp_e | 746 | 7.46 E+02 | EXACTO | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| hp de caldera | BHP | 9 809.50 | 9.809 50 E+03 | no exacto | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| hp de agua / hp R. U. | — | 746.043 / 745.70 | igual | no exacto | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| Btu IT por hora | Btu/h | 0.293 071 070 172 22 | 2.930 711 E-01 | EXACTO-DER | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| MMBtu por hora | MMBtu/h | 293 071.070 172 22 | — | EXACTO-DER | derivado de [NIST nota 9](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| kcal IT por hora | kcal/h | 1.163 | NIST no la lista | EXACTO-DER (4 186.8 ÷ 3 600) | derivado de [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| tonelada de refrigeración (12 000 Btu IT/h) | TR | 3 516.852 842 066 67 | 3.516 853 E+03 | EXACTO-DER | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| gigajoule por hora | GJ/h | 277 777.777… (10⁹ ÷ 3 600) | — | EXACTO-DER | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |

### Inferences
- Conviene guardar kW como la unidad oficial y mostrar hp y CV con su nombre completo. En México «caballo» se usa para cosas distintas.
- Los factores periódicos, como 1/3 600 o 5/9, conviene guardarlos como fracción, no como decimal.

### Gaps
- No encontré una norma mexicana que defina CV ni que distinga CV de hp. La equivalencia CV = hp métrico es de uso general, sin fuente normativa mexicana verificada.
- No localicé una fuente oficial para otras unidades de sector, como «kcal/kWh» de consumo térmico específico, aunque son cocientes directos de la tabla.

## Presión

### Takeaway
Bar, atm y kgf/cm² son exactos; psi se deriva exacto. Torr y mmHg difieren en la octava cifra significativa y no deben igualarse. La columna de agua y de mercurio tiene variantes por temperatura. Manométrica y absoluta no son una conversión de factor: se suma la presión atmosférica, que en la Ciudad de México ronda 77 kPa en atmósfera estándar.

### Cited Findings

| Unidad | Símbolo | Factor a Pa (completo) | Redondeo impreso | Clase | Fuente |
|---|---|---|---|---|---|
| pascal y múltiplos | Pa, kPa, MPa | 1, 10³, 10⁶ | — | EXACTO | [NOM Tablas 5 y 8](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| bar / milibar | bar / mbar | 100 000 / 100 | 1.0 E+05 / 1.0 E+02 | EXACTO | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| atmósfera estándar | atm | 101 325 | 1.013 25 E+05 | EXACTO | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| kgf/cm² («kg/cm²» en México), igual a la atmósfera técnica | kgf/cm², at | 98 066.5 | 9.806 65 E+04 | EXACTO | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| libra-fuerza por pulgada cuadrada | psi | 6 894.757 293 168 361 | 6.894 757 E+03 | EXACTO-DER (lbf de nota 23 ÷ in²) | [NIST SP 811 PDF](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| torr | Torr | 133.322 368 421 05… (101 325/760) | 1.333 224 E+02 | EXACTO como fracción. NIST lista torr y atm entre las unidades que no acepta para uso con el SI | [NIST SP 811 PDF, sec. 5.3.2, Tabla 11](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| mmHg convencional | mmHg | 133.322 387 415 | 1.333 224 E+02 | CONV (base ISO 80000-4); cifras completas según [mathjs](https://raw.githubusercontent.com/josdejong/mathjs/develop/src/type/unit/Unit.js) | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| inHg convencional | inHg | 3 386.388 640 341 | 3.386 389 E+03 | CONV (25.4 × mmHg) | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| inHg a 32 °F / 60 °F | inHg | 3 386.38 / 3 376.85 | igual | no exacto | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| inH₂O convencional | inH₂O | 249.088 91 | 2.490 889 E+02 | EXACTO-DER (1 000 kg/m³ × gₙ × 0.0254 m) | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| inH₂O a 39.2 °F / 60 °F | inH₂O | 249.082 / 248.84 | igual | no exacto | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| metro de columna de agua convencional | mH₂O, mca | 9 806.65 | cmH₂O 9.806 65 E+01 | EXACTO | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| metro de agua a 4 °C | mH₂O | 9 806.38 | cmH₂O 9.806 38 E+01 | no exacto | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| pie de agua convencional | ftH₂O | 2 989.066 92 | 2.989 067 E+03 | EXACTO-DER | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |

- **Por qué no dar más cifras en columnas de líquido.** NIST avisa que más dígitos no se justifican, porque esas definiciones ignoran la compresibilidad del mercurio y el cambio de densidad con ITS-90 — [NIST SP 811 PDF, nota 12](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf).
- **Manométrica contra absoluta.** No se debe pegar información a la unidad: NIST escribe V_max = 1000 V y rechaza V = 1000 V_max. Por lo tanto «psig» o «kg/cm² man» son malas formas; la información va en la magnitud — [NIST SP 811 PDF, sec. 7.4](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf).
- **Altitud.** El Servicio Meteorológico de EE. UU. da la altitud de presión en pies: h = (1 − (P/1013.25)^0.190284) × 145 366.45, con P en milibares — [NWS](https://www.weather.gov/media/epz/wxcalc/pressureAltitude.pdf). ISO 2533 es idéntica a la atmósfera ICAO entre −2 y 32 km — [ISO 2533:1975](https://iteh.ai/catalog/standards/iso/02a8e2e4-d0de-4645-8216-79923f05d24e/iso-2533-1975).

Presión estándar por altitud, invirtiendo la fórmula del NWS. Las altitudes son redondeadas y de ejemplo; son atmósfera estándar, no clima real.

| Sitio | Altitud | Presión |
|---|---|---|
| Nivel del mar | 0 m | 101.33 kPa |
| Monterrey | 540 m | 95.00 kPa |
| Guadalajara | 1 566 m | 83.87 kPa |
| Ciudad de México | 2 240 m | 77.15 kPa |
| Toluca | 2 660 m | 73.18 kPa |

### Inferences
- El motor debe tratar manométrica y absoluta igual que la temperatura: transformación afín con un parámetro, p_abs = p_man + p_atm(altitud), con la altitud editable y la atmo estándar marcada como supuesto.
- Una lectura de 5 kgf/cm² manométricos en la Ciudad de México es 567.5 kPa absolutos (490.33 + 77.15), y 591.7 kPa a nivel del mar. Son 4 % de diferencia, y eso cambia los volúmenes de gas.
- 98.07 kPa, la presión «base» de la NOM-001-SECRE-2010, es 1 kgf/cm² redondeado (98.066 5).

### Gaps
- No hallé una fuente mexicana que fije la presión atmosférica por localidad para medición de gas; quedó solo la fórmula de atmósfera estándar.
- No revisé el texto de ISO 2533 ni ICAO Doc 7488, por ser de pago; me apoyo en la fórmula del NWS.

## Temperatura

### Takeaway
La temperatura no se convierte con un factor único: es una transformación afín, y una diferencia de temperatura se convierte distinto que una temperatura. El motor necesita dos unidades lógicas por cada escala.

### Cited Findings

| Conversión | Fórmula | Clase | Fuente |
|---|---|---|---|
| °C a K (temperatura) | T/K = t/°C + 273.15 | EXACTO | [NIST SP 811 PDF](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| °F a °C (temperatura) | t/°C = (t/°F − 32)/1.8 | EXACTO | [NIST SP 811 PDF](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| °F a K (temperatura) | T/K = (t/°F + 459.67)/1.8 | EXACTO | [NIST SP 811 PDF](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| °R a K | T/K = (T/°R)/1.8 | EXACTO-DER | deducido de la fila anterior |
| Intervalo en °C a K | × 1 | EXACTO | [NIST SP 811 PDF](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) y [NOM Tabla 5, nota e](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| Intervalo en °F a °C | × 5/9 (5.555 556 E-01) | EXACTO como fracción | [NIST SP 811 PDF](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |

- La NOM anota que un intervalo tiene el mismo valor numérico en °C y en K; el valor absoluto no — [NOM-008-SE-2021, Tabla 5](https://sidof.segob.gob.mx/notas/docFuente/5713228).

### Inferences
- Un motor de «factor por unidad» convierte mal 20 °C a °F si no maneja el desplazamiento. El modelo de datos debe tener `escala` y `desplazamiento`, no solo `factor`.
- Convertir ΔT entre 20 °C y 30 °C debe dar 18 Δ°F, no 50 °F. La pantalla debe preguntar «¿temperatura o diferencia?» de forma explícita.
- En unidades compuestas como Btu/(lb·°F) solo cabe el intervalo.

### Gaps
- Ninguno que afecte al motor.

## Masa y volumen

### Takeaway
Pie y libra son exactos por definición, así que barril, galón y pie cúbico también lo son, aunque NIST imprima solo 7 cifras. «Ton» sola es ambigua. El BNE redondea sus factores de volumen, y conviene no copiar esos redondeos.

### Cited Findings

| Unidad | Símbolo | Factor a kg o m³ (completo) | Redondeo impreso | Clase | Fuente |
|---|---|---|---|---|---|
| tonelada métrica | t | 1 000 kg | 1.0 E+03 | EXACTO | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| libra avoirdupois | lb | 0.453 592 37 kg | 4.535 924 E-01 | EXACTO (nota 22) | [NIST SP 811 PDF, nota 22](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| tonelada corta (2 000 lb) | short ton | 907.184 74 kg | 9.071 847 E+02 | EXACTO-DER | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| tonelada larga (2 240 lb) | long ton | 1 016.046 908 8 kg | 1.016 047 E+03 | EXACTO-DER | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| kilotonelada, megatonelada | kt, Mt | 10⁶ kg, 10⁹ kg | — | EXACTO-DER | [NOM Tablas 7 y 8](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| litro | L, l | 10⁻³ m³ | — | EXACTO | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| galón EE. UU. | gal | 3.785 411 784×10⁻³ m³ | 3.785 412 E-03; BNE 3.7854 L | EXACTO-DER (231 in³; in³ exacta en nota 13) | [NIST SP 811 PDF, nota 13](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| galón imperial | gal imp | 4.546 09×10⁻³ m³ | 4.546 09 E-03 | EXACTO | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| barril de petróleo (42 gal) | bbl, «bl» | 0.158 987 294 928 m³ | 1.589 873 E-01; BNE 158.9873 L | EXACTO-DER | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| pie cúbico | ft³, pc | 0.028 316 846 592 m³ | 2.831 685 E-02 | EXACTO-DER (0.3048³) | [NIST SP 811 PDF](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| mil pies cúbicos | Mpc, mpc, Mcf | 28.316 846 592 m³ | — | EXACTO-DER | derivado |
| millón de pies cúbicos | MMpc, MMcf | 28 316.846 592 m³ | — | EXACTO-DER | derivado |
| mil millones de pies cúbicos | MMMpc, Bcf | 28 316 846.592 m³ | — | EXACTO-DER | derivado |

- **Relaciones inversas.** 1 m³ = 6.289 810 770 432 bbl = 35.314 666 721 49 ft³ (cálculo propio). El BNE usa 6.2898 bbl y 35.314 67 ft³ — [BNE 2023, Cuadro B.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). El regulador canadiense también usa 6.2898 — [CER](https://apps.cer-rec.gc.ca/Conversion/conversion-tables.aspx).
- **Pie.** Se define como exactamente 0.3048 m desde 1959 — [NIST SP 811 PDF, B.6](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf).
- **El volumen de gas no significa nada sin condiciones.** El regulador canadiense declara el pie cúbico de gas a 14.73 psia y 60 °F, y el metro cúbico a 101.325 kPa y 15 °C — [CER](https://apps.cer-rec.gc.ca/Conversion/conversion-tables.aspx). Con gas ideal, ese pie cúbico ocupa 0.029 20 m³ a 20 °C y 100 kPa, las condiciones del BNE; es 3.1 % más que el factor geométrico (cálculo propio).

### Inferences
- Hay que separar «pie cúbico geométrico» (factor exacto) de «pie cúbico de gas a condiciones X» (puente con corrección P/T). Si se mezclan, el error es de 3 % o más.
- La columna «redondeo impreso» sirve como prueba automática: la tabla propia debe coincidir con NIST en esas cifras.

### Gaps
- No vi el 231 in³ escrito en NIST SP 811. El valor exacto del galón se apoya en la nota 13 (in³ exacta), la coincidencia con las 7 cifras de NIST y el valor de [mathjs](https://raw.githubusercontent.com/josdejong/mathjs/develop/src/type/unit/Unit.js). No consulté NIST Handbook 44.

## Flujo, velocidad y área

### Takeaway
Son compuestos de las tablas anteriores: MMpcd y bpd se derivan exactos del pie y del barril. En velocidad solo el nudo es decimal periódico. El acre tiene dos valores, y NIST solo imprime el de pie topográfico.

### Cited Findings

| Unidad | Símbolo | Factor a la base (completo) | Redondeo impreso | Clase | Fuente |
|---|---|---|---|---|---|
| litro por segundo | L/s | 10⁻³ m³/s | — | EXACTO-DER | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| litro por minuto | L/min | 1/60 000 m³/s | — | EXACTO-DER | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| metro cúbico por hora | m³/h | 1/3 600 m³/s | — | EXACTO-DER | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| galón por minuto | gpm | 6.309 019 64×10⁻⁵ m³/s | 6.309 020 E-05 | EXACTO-DER | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| pie cúbico por minuto | cfm | 4.719 474 432×10⁻⁴ m³/s | 4.719 474 E-04 | EXACTO-DER | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| barril por día | bpd, b/d | 1.840 130 728 33×10⁻⁶ m³/s (0.158 987 294 928 m³/d) | — | EXACTO-DER | derivado de [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| mil barriles por día | Mbd | 1.840 130 728 33×10⁻³ m³/s | — | EXACTO-DER | [BNE «miles de barriles diarios»](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf) |
| millón de pies cúbicos por día | MMpcd | 0.327 741 28 m³/s (28 316.846 592 m³/d) | — | EXACTO-DER, geométrico | derivado |
| tonelada por hora | t/h | 0.277 777… kg/s | — | EXACTO-DER | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| tonelada corta por hora | — | 0.251 995 761 11 kg/s | 2.519 958 E-01 | EXACTO-DER | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| libra por hora | lb/h | 1.259 978 805 56×10⁻⁴ kg/s | — | EXACTO-DER | derivado de [NIST nota 22](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| kilómetro por hora | km/h | 1/3.6 m/s | — | EXACTO-DER | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| milla por hora | mph | 0.447 04 m/s | 4.4704 E-01 | EXACTO | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| nudo | kn | 1 852/3 600 m/s = 0.514 444… | 5.144 444 E-01 | EXACTO como fracción (milla náutica 1 852 m exacta) | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| pie por segundo | ft/s | 0.3048 m/s | — | EXACTO-DER | [NIST SP 811 PDF, B.6](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| hectárea | ha | 10⁴ m² | 1.0 E+04 | EXACTO | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| kilómetro cuadrado | km² | 10⁶ m² | — | EXACTO | [NOM Tabla 8](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| acre internacional | ac | 4 046.856 422 4 m² | NIST no lo imprime | EXACTO-DER (43 560 ft²) | derivado |
| acre con pie topográfico EE. UU. | ac | 4 046.872 609 874 m² | 4.046 873 E+03 | EXACTO-DER | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |

### Inferences
- Los flujos conviene armarlos por composición (volumen ÷ tiempo), no con filas sueltas. Evita errores de copiado y da los inversos gratis.
- MMpcd y bpd cruzan a energía solo con puente (poder calorífico por año y condiciones). No deben ofrecerse en el mismo selector que PJ sin esa pregunta.
- Para proyectos en México el default razonable es acre internacional y ha, y el de pie topográfico queda como opción avanzada.

### Gaps
- No busqué factores de terreno en unidades históricas mexicanas (caballería, fanega), porque no se pidieron.

## Prefijos del sector y trampas de notación

### Takeaway
El BNE publica las dos convenciones lado a lado: M = 10³ en volumen y peso, y M = 10⁶ como prefijo métrico. Esa colisión, más billion/billón y T/t, son las trampas de mayor costo: un error de 1 000 veces no se nota a simple vista.

### Cited Findings

| Se escribe | Puede significar | Valor correcto / cómo tratarlo | Fuente |
|---|---|---|---|
| M en hidrocarburos | Miles (romano) | 10³ | [BNE 2023, Cuadro B.1](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf) |
| M en el SI | Mega | 10⁶ | [BNE 2023, Cuadro B.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf) y [NOM Tabla 8](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| MM | Millones | 10⁶, y como prefijo SI no existe | [BNE 2023, Cuadro B.1](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf); [NOM 6.3.3](https://sidof.segob.gob.mx/notas/docFuente/5713228) prohíbe prefijos compuestos |
| MMM | Miles de millones | 10⁹ | [BNE 2023, Cuadro B.1](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf) |
| MBtu | Mil Btu por la convención romana (uso general, SFV); **millón** de Btu en el manual IEA | Desambiguar siempre; 1 Mtep = 3.968×10⁷ MBtu en IEA implica 10⁶ | [Manual IEA/Eurostat, anexo 3](https://www.enerclub.es/wp-content/uploads/2013/02/statistics_manual_spanish.pdf) |
| MMBtu | Millón de Btu | 10⁶ Btu | [CER](https://apps.cer-rec.gc.ca/Conversion/conversion-tables.aspx) |
| Mcf, Mpc | Mil pies cúbicos | 10³ ft³; no es mega | [BNE 2023, Cuadro B.1](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf) para M = miles; «Mcf» en inglés es uso general, SFV |
| billion (inglés) | 10⁹ | «mil millones» | uso general, SFV en norma; [NOM 6.3.1](https://sidof.segob.gob.mx/notas/docFuente/5713228) prohíbe los términos en español |
| billón (español) | 10¹² | Falso amigo; 1 000 veces mayor que billion | uso general, SFV |
| trillion (inglés) | 10¹² | «billón»; Tcf = 10¹² ft³ | uso general, SFV |
| trillón (español) | 10¹⁸ | Falso amigo; un millón de veces trillion | uso general, SFV |
| Bcf, BCM | 10⁹ ft³, 10⁹ m³ | MMMpc; «B» no es prefijo SI | uso general, SFV |
| T | Tera | 10¹²; TJ, TWh | [NOM Tabla 8](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| t | Tonelada | 10³ kg; kt, Mt | [NOM Tabla 7](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| Tm, TM, «ton» | Tonelada métrica por costumbre; Tm es terametro; ton sola es corta en EE. UU. | Pedir aclaración. mathjs asigna `ton` a la corta | [mathjs](https://raw.githubusercontent.com/josdejong/mathjs/develop/src/type/unit/Unit.js) |
| Mt, MT | Megatonelada; en inglés de comercio «metric ton» | Desambiguar, factor de 10⁶ | uso general, SFV |
| mW, MW | Miliwatt, megawatt | Factor de 10⁹ por una mayúscula | [NOM 6.3.3](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| kW/h | Error por kWh | Potencia ÷ tiempo no es energía; NIST escribe kW·h | [NIST B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) |
| bbl, bl | Barril de petróleo. CONUEE usa «bl». En mathjs **`bbl` es barril de cerveza** (31 gal) | Mapear a 42 gal | [Lista 2026](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf) y [mathjs](https://raw.githubusercontent.com/josdejong/mathjs/develop/src/type/unit/Unit.js) |
| bep, bpce, boe, bpe | Definición variable | Exigir definición y año | [Lista 2026](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf), [§45K](https://www.law.cornell.edu/uscode/text/26/45K) |
| tep, toe, tec, tce | Español e inglés de lo mismo | Alias; ojo con 42.6216 de ONU | [UNSD](https://unstats.un.org/unsd/energy/balance/conversion.htm) |
| kg/cm² | Presión, en realidad kgf/cm² | 98 066.5 Pa; no es masa por área | [NIST B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9) |
| psig, psia | Manométrica, absoluta | Pedir altitud o p_atm | [NIST 7.4](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf) |
| «1,000» y «1.000» | Mil o uno | Mostrar interpretación | [NOM 6.2](https://sidof.segob.gob.mx/notas/docFuente/5713228) |
| PCS, PCN, HHV, LHV | Bruto y neto | Gas 10 %, líquidos y carbón 5 % | [BNE 2023, p. 222](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf) |

### Inferences
- Cada unidad ambigua necesita un símbolo interno sin colisión, por ejemplo `mil_pc` o `mm_pc`, y una etiqueta que muestre el significado en palabras: «MMpcd = millones de pies cúbicos por día».
- Conviene aceptar pegar texto como «5 Bcf» y traducirlo a «5 mil millones de pies cúbicos», avisando de la NOM. Es la mayor ayuda para quien lee reportes en inglés.
- La calculadora no debe imprimir «billón» aunque el usuario lo escriba: debe contestar «10¹² (billón en español; trillion en inglés)» solo como aclaración. La NOM no admite el término.

### Gaps
- No encontré un documento normativo mexicano que trate billion/billón; la equivalencia es uso lingüístico general. La NOM solo prohíbe los términos.
- No revisé si Pemex o la CNE usan otra convención para M y MM. El BNE es la única fuente oficial que vi con la tabla explícita.

## Equivalencias entre energéticos que publica México

### Takeaway
La unidad común es el joule, y el BNE presenta sus balances en petajoules con poder calorífico **neto**. SENER convierte a barriles dividiendo los PJ entre el poder calorífico del crudo de ese año, por lo que el bep mexicano cambió de 6 121.68 a 6 347.06, a 6 427.76 y a 6 347.00 MJ/bl. CONUEE deriva su lista del BNE: la Lista 2025 es idéntica al BNE 2023. La Lista 2026 cita el BNE 2024, que no pude abrir, y redondea valores.

### Cited Findings
- **Unidad común y base.** El BNE usa el joule como unidad común y presenta las estadísticas en poder calorífico neto para comparar con AIE, ONU y OLADE — [BNE 2023, anexo B, pp. 221-222](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). El BNE remite a NIST SP 811 para sus factores — [BNE 2023, p. 222](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf).
- **Bruto y neto.** Para carbón y líquidos, el neto es 5 % menor que el bruto; para gas natural y procesados, 10 % — [BNE 2023, p. 222](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf).
- **Cómo convierte SENER a barriles.** El BNE publica la misma matriz 2022 en PJ y en millones de barriles. Crudo: 3 807.56 PJ y 599.89 MMbpe. Gas: 1 657.94 PJ y 261.21 MMbpe. Ambas razones dan 6.347 PJ/MMbpe, igual al poder calorífico del crudo de 2022 (6 347.06 MJ/bl) — [BNE 2023, Cuadros 5.1, 5.2 y A.1](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). La razón es cálculo propio; el BNE no enuncia la regla en lo que leí.
- **CONUEE usa la misma lógica.** Toma como referencia el crudo promedio de la producción nacional; cada factor es PC ÷ PC del crudo. Revisé 39 082.50/6 347 000 = 0.0062, 6 989/6 347 = 1.1012 y 3 600/6 347 = 0.5672 — [Lista 2026](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf).
- **Serie del crudo (MJ/bl).** 2013: 6 316.29; 2014: 6 311.67; 2015-2020: 6 121.68; 2021-2022: 6 347.06; 2023: 6 427.76 — [BNE 2023, Cuadro A.1](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). 2024: 6 347.00 — [Lista 2026](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf).
- **Múltiplos oficiales de conversión.** 1 000 kg = 1 t; 1 gal = 3.7854 L; 1 bl = 158.9873 L; 42 gal = 1 bl; 1 m³ = 6.2898 bl; 1 m³ = 35.314 67 ft³; 1 cal = 4.1868 J; 1 MWh = 3 600 MJ — [BNE 2023, Cuadro B.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf).
- **Condiciones de referencia del BNE y CONUEE.** Gas seco y gas asociado: 20 °C y 100 kPa — [Lista 2026, notas 2 y 3](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf).
- **La NOM de calidad de gas usa otras.** Condiciones base: 98.07 kPa y 293.15 K. Condiciones estándar: 101.325 kPa y 288.15 K; las propiedades se refieren a estándar, y 1 m³ base = 0.951 37 m³ estándar — [NOM-001-SECRE-2010, 3.7, 3.8 y 4.2](https://dof.gob.mx/normasOficiales/3997/sener/sener.htm). Comprobé la razón: (98.07/101.325)×(288.15/293.15) = 0.951 37.
- **Especificación de la NOM (lectura automática de una tabla aplanada, por verificar).** PCS mínimo 35.30 MJ/m³ en Zona Sur y 37.30 MJ/m³ en el resto desde 2013; máximo 43.60 — [NOM-001-SECRE-2010, Tabla 1](https://dof.gob.mx/normasOficiales/3997/sener/sener.htm).
- **Fundamento en el acervo.** La información de eficiencia energética que publica SENER con apoyo de CONUEE debe incluir la lista de combustibles, sus poderes caloríficos y la referencia a factores en barriles de petróleo crudo equivalente aplicables durante un año — `public/data/RLPTE_chunks.json`, art. 75. Es la única coincidencia de «barriles… equivalente» en todo `public/data`.
- **Otras menciones en el acervo.** Dictámenes que determinan el poder calorífico del gas natural — `public/data/LSH_chunks.json`, art. 119. Calor extraído reportado en joules y energía en MWh — `public/data/RLGeo_chunks.json`, art. 74. Poder calorífico del metano como energía limpia — `public/data/Ley_Sector_Electrico_chunks.json`, art. 3.
- **La lista ya no va al DOF, por lo que vi.** Solo las listas 2014-2016 enlazan a una nota del DOF (30-11-2015) — [RENE](https://www.gob.mx/semarnat/acciones-y-programas/registro-nacional-de-emisiones-rene). La serie histórica indica «publicado en la página de la Conuee» desde 2018 — [serie histórica, copia de terceros](https://studylib.es/doc/9511942/serie-hist-rica-de-la-lista-de-combustibles-y-sus-poderes...). La Lista 2026 es un escaneo firmado el 12-02-2026 — [Lista 2026](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf).

**Tabla de poderes caloríficos netos, por fuente.** La Lista 2026 cita el BNE 2024 y el oficio SPTE.DGPIE.210.005.2026. La Lista 2025 cita el BNE 2023 preliminar y el oficio SPTE.200.031. Fuentes de toda la tabla: [Lista 2026](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf), [Lista 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf), [BNE 2023, Cuadros A.1 y A.2](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). Todos son TÍPICO.

| Combustible | Unidad | Lista 2026 | bep 2026 | Lista 2025 = BNE 2023 | bep 2025 | Nota |
|---|---|---|---|---|---|---|
| Petróleo crudo (referencia) | MJ/bl | 6 347.00 | 1.0000 | 6 427.76 | 1.0000 | **Cambia** |
| Gas natural promedio | kJ/m³ | 39 082.50 | 0.0062 | 39 082.60 | 0.0061 | Redondeo raro |
| Gas natural asociado | kJ/m³ | 40 357 | 0.0064 | 40 356.75 | 0.0063 | Redondeo |
| Gas natural no asociado | kJ/m³ | 37 808 | 0.0060 | 37 808.46 | 0.0059 | Redondeo |
| Gas seco | kJ/m³ | 33 543 | 0.0053 | 33 543.27 | 0.0052 | 20 °C, 100 kPa |
| Gas seco de exportación | kJ/m³ | 33 804 | 0.0053 | 33 803.55 | 0.0053 | Redondeo |
| Gas seco de importación | kJ/m³ | 38 240 | 0.0060 | 38 239.94 | 0.0059 | Ver inferencias |
| Combustóleo | MJ/bl | 6 656 | 1.0487 | 6 656.00 | 1.0355 | |
| Condensados | MJ/bl | 6 989 | 1.1012 | 6 527.62 | 1.0155 | **Cambia** |
| Diésel | MJ/bl | 6 065 | 0.9556 | 6 065.00 | 0.9436 | |
| Etano | MJ/bl | 2 868 | 0.4519 | 2 867.96 | 0.4462 | Redondeo |
| Gas licuado de petróleo | MJ/bl | 4 153 | 0.6543 | 4 152.89 | 0.6461 | Redondeo |
| Gasóleo | MJ/m³ | 42 524 | 6.6999 | 42 524.00 | 6.6157 | Unidad distinta |
| Gasolinas naturales | MJ/bl | 4 781 | 0.7533 | 4 781.00 | 0.7438 | |
| Gasolinas y naftas | MJ/bl | 5 613 | 0.8844 | 5 613.00 | 0.8732 | |
| Lubricantes | MJ/bl | 6 307 | 0.9937 | 6 307.00 | 0.9812 | |
| MTBE | MJ/bl | 4 839 | 0.7624 | 4 839.00 | 0.7528 | |
| Querosenos | MJ/bl | 5 888 | 0.9277 | 5 888.00 | 0.9160 | |
| Azufre | MJ/t | 9 296 | 1.4646 | 9 296.21 | 1.4463 | Redondeo |
| Carbón siderúrgico importado | MJ/t | 28 954 | 4.5618 | 28 954.08 | 4.5045 | Redondeo |
| Carbón siderúrgico nacional | MJ/t | 29 335 | 4.6219 | 29 335.00 | 4.5638 | |
| Carbón térmico importado | MJ/t | 22 543 | 3.5518 | 22 542.50 | 3.5071 | Redondeo |
| Carbón térmico nacional | MJ/t | 19 432 | 3.0616 | 19 431.95 | 3.0231 | Redondeo |
| Coque de carbón | MJ/t | 26 521 | 4.1785 | 26 521.00 | 4.1260 | |
| Coque de petróleo | MJ/t | 34 518 | 5.4385 | 34 518.00 | 5.3701 | |
| Materia prima para negro de humo | MJ/bl | 6 513 | 1.0262 | 6 409.00 | 0.9971 | **Cambia** |
| Biogás | MJ/m³ | 20 | 0.0032 | 19.93 | 0.0031 | Redondeo |
| Bagazo de caña | MJ/t | 7 055 | 1.1115 | 7 055.00 | 1.0976 | |
| Leña | MJ/t | 14 486 | 2.2823 | 14 486.00 | 2.2537 | |
| Asfaltos | MJ/bl | 6 506 | 1.0251 | 6 506.00 | 1.0122 | |
| Gas de alto horno | MJ/m³ | 3 | 0.0005 | 3.45 | 0.0005 | **−13 % por redondeo** |
| Gas de coque | MJ/m³ | 18 | 0.0028 | 18.42 | 0.0029 | −2.3 % por redondeo |
| Electricidad, términos secundarios | MJ/MWh | 3 600 | 0.5672 | 3 600.00 | 0.5601 | Exacto como energía |
| Uranio | MJ/g | no aparece | — | 3 788.67 (solo BNE) | — | 3 287.00 hasta 2020 |

- **Discrepancias BNE contra CONUEE.** Lista 2025 y BNE 2023 coinciden en todas las filas comparables, una por una. La Lista 2026 cambia crudo, condensados y negro de humo, y redondea el resto frente a la Lista 2025. Esa lista cita el BNE 2024, que no pude abrir, así que no afirmo una discrepancia entre ambos: solo que no pude compararlos.
- **Otros países, para contrastar.** EIA usa 5 689 000 Btu/bbl para crudo, 1 036 Btu/ft³ para gas y 3 412 Btu/kWh — [EIA](https://www.eia.gov/energyexplained/units-and-calculators/energy-conversion-calculators.php). CER usa 0.0373 GJ/m³ para gas — [CER](https://apps.cer-rec.gc.ca/Conversion/conversion-tables.aspx). ONU usa 41.868 TJ por cada mil toneladas de crudo como factor estándar, con poder neto — [UNSD](https://unstats.un.org/unsd/energy/balance/conversion.htm).

### Inferences
- **Los factores en bep no se deben copiar.** Con 4 decimales, 0.0053 representa 0.005 285: +0.3 %. Hay que calcular PC ÷ PC del crudo y mostrar el cociente con las cifras que aguante.
- **El bep tiene año.** Reportar «X MMbpe» sin año no es reproducible: entre 2020 y 2023 la referencia subió 5 %. El mismo PJ da menos barriles equivalentes en 2023 que en 2020.
- **Una comparación de tres condiciones:** 1 m³ a 20 °C y 100 kPa contiene 0.970 09 del gas de 1 m³ a 15 °C y 101.325 kPa (gas ideal, cálculo propio). La calculadora debe nombrar siempre las condiciones.
- **Valor plausible.** Gas seco 33.543 MJ/m³ (neto, 20 °C, 100 kPa) equivale a 34.58 neto en estándar y, con la regla del 10 %, a 38.42 MJ/m³ de PCS: cae dentro de la NOM-001 (37.30 a 43.60).
- **Valor dudoso, para marcar sin afirmar error.** Gas seco de importación 38 240 kJ/m³, por el mismo cálculo, implica 43.80 MJ/m³ de PCS, sobre el máximo de 43.60. Además, 38.24 está muy cerca de los 38.60 MJ/m³ que dan los 1 036 Btu/ft³ de EIA, que son base bruta. Puede ser un valor bruto rotulado como neto, o tener otras condiciones. Conviene preguntarlo a SENER antes de usarlo en una comparación.
- **Salto a revisar.** El gas seco baja de 38 128.39 kJ/m³ (2019) a 33 543.27 (2020 en adelante) — [BNE 2023, Cuadro A.1](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). Es −12 % de un año a otro, sin nota explicativa en lo que leí. Una serie histórica en PJ puede tener un quiebre ahí.
- **Vacío de datos abiertos.** Los valores oficiales viven en un PDF escaneado sin capa de texto. Tenerlos en una tabla citada ya es un aporte, incluso sin calculadora.

### Gaps
- **No encontré el BNE 2024**, aunque la Lista 2026 lo cita. Busqué en la web y probé la ruta `base.energia.gob.mx/BNE/` por nombre (404). No confirmo si 6 347.00 es un valor del BNE 2024 o un redondeo de 6 347.06.
- **OLADE:** no pude abrir sus manuales (`biblioteca.olade.org` dio 404 o error de conexión), y no confirmé el valor del bep de OLADE. El BNE sí los cita como referencia — [BNE 2023, nota 107](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). Una búsqueda mencionó 1.387 × 10⁶ kcal; queda SFV.
- **SIE:** la página de inicio de `sie.energia.gob.mx` me devolvió solo el título, sin contenido — [SIE](https://sie.energia.gob.mx/). No verifiqué la serie allí.
- **Energía primaria eléctrica.** La hidroenergía del BNE salta de 96.97 PJ (2020) a 282.18 PJ (2021) — [BNE 2023, Cuadro A](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf). Eso sugiere un cambio de método de conversión a primaria, pero no hallé el método en el anexo. Sin eso, PJ primarios de hidro o nuclear no pueden reproducirse desde MWh.
- **NOM-001-SECRE-2010:** no verifiqué si sigue sin cambios a noviembre de 2026.
- **Factores de Pemex y CNH** para gas a petróleo crudo equivalente: no los revisé. Pueden diferir del método del BNE.

## Emisiones: PCG, factores por combustible y factor del SEN

### Takeaway
México usa oficialmente PCG del Quinto Informe del IPCC (AR5): CH₄ 28 y N₂O 265, por acuerdo en el DOF de 2015. No hallé adopción de AR6. El factor del SEN vigente para reportes es 0.444 tCO₂e/MWh, de 2024, porque el de 2025 seguía en proceso al 29 de mayo de 2026. Los factores por combustible son del acuerdo de septiembre de 2015, que remite a la lista de CONUEE para el poder calorífico.

### Cited Findings
- **PCG obligatorios, Acuerdo DOF 14-08-2015, art. tercero:** CH₄ 28; N₂O 265; carbono negro 900; SF₆ 23 500; NF₃ 16 100 — [Acuerdo de agrupación](http://www.semarnat.gob.mx/sites/default/files/documentos/dof_acuerdo_de_agrupacion.pdf). El RENE lo atribuye al «Quinto Reporte de Evaluación del IPCC» — [RENE](https://www.gob.mx/semarnat/acciones-y-programas/registro-nacional-de-emisiones-rene).
- **Comparación con otros informes:** CH₄ no fósil 25 (AR4), 28 (AR5), 27.0 (AR6); CH₄ fósil 30 (AR5), 29.8 (AR6); N₂O 298, 265, 273 — [GHG Protocol, 2024](https://ghgprotocol.org/sites/default/files/2024-08/Global-Warming-Potential-Values%20%28August%202024%29.pdf).
- **Factores por combustible: Acuerdo DOF 03-09-2015, art. sexto.** Usa el poder calorífico medido o el de la Lista de CONUEE (art. cuarto) — [Acuerdo de particularidades técnicas](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149).

| Combustible (estacionario) | CO₂, t/MJ | CH₄, kg/MJ | N₂O, kg/MJ | Fuente |
|---|---|---|---|---|
| Gas natural (todas las variantes) | 5.61E-05 | 1.00E-06 | 1.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Gas licuado | 6.31E-05 | 1.00E-06 | 1.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Gasolinas y naftas | 6.93E-05 | 3.00E-06 | 6.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Querosenos | 7.19E-05 | 3.00E-06 | 6.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Turbosina | 7.15E-05 | 3.00E-06 | 6.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Diésel | 7.41E-05 | 3.00E-06 | 6.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Combustóleo | 7.74E-05 | 3.00E-06 | 6.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Petróleo crudo | 7.33E-05 | 3.00E-06 | 6.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Coque de petróleo | 9.75E-05 | 3.00E-06 | 6.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Carbón térmico y siderúrgico | 9.46E-05 | 1.00E-06 | 1.50E-06 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Leña | 1.12E-04 | 3.00E-05 | 4.00E-06 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Bagazo de caña | 1.00E-04 | 3.00E-05 | 4.00E-06 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |
| Biogás (metano) | 5.46E-05 | 1.00E-06 | 1.00E-07 | [DOF 03-09-2015](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149) |

- **Fuentes móviles.** El mismo acuerdo trae otros CH₄ y N₂O: por ejemplo gasolina vehicular 2.50E-05 y 8.00E-06 kg/MJ — [DOF 03-09-2015, art. sexto, numeral 1](https://dof.gob.mx/nota_detalle_popup.php?codigo=5406149).
- **Factor del SEN, en tCO₂e/MWh:** 2018: 0.527 ([aviso](https://www.gob.mx/cms/uploads/attachment/file/442910/Aviso_Factor_de_Emisiones_2018.pdf)); 2019: 0.505 ([aviso](https://www.gob.mx/cms/uploads/attachment/file/538473/Factor_emision_electrico_2019.pdf)); 2020: 0.494 ([aviso](https://www.gob.mx/cms/uploads/attachment/file/630693/Aviso_FEE_2020.pdf)); 2021: 0.423 ([aviso](https://www.gob.mx/cms/uploads/attachment/file/706809/aviso_fesen_2021.pdf)); 2022: 0.435 ([aviso](https://www.gob.mx/cms/uploads/attachment/file/807500/aviso_fesen_2022.pdf)); 2023: 0.438 ([aviso](https://www.gob.mx/cms/uploads/attachment/file/896217/aviso_fesen_2023.pdf)); 2024: 0.444 ([aviso del 28-02-2025](https://www.gob.mx/cms/uploads/attachment/file/981194/aviso_fesen_2024.pdf)).
- **2025 pendiente.** El aviso del 29-05-2026 dice que el factor 2025 sigue en proceso a cargo de SENER, y ordena usar 0.444 para la COA 2026 — [aviso SEMARNAT, 29-05-2026](https://www.gob.mx/cms/uploads/attachment/file/1081506/aviso_factor_de_emision_electrico_coa_2026.pdf). No encontré publicación posterior.
- **Trampa de etiqueta.** La página del RENE rotula ese aviso como «2025» aunque da el valor de 2024, y rotula `lista_de_combustibles_2026.pdf` como «2025» — [RENE](https://www.gob.mx/semarnat/acciones-y-programas/registro-nacional-de-emisiones-rene).
- **Quién lo publica: las fuentes no coinciden.** La ley asigna a la CNE elaborarlo y publicarlo cada año, en coordinación con SEMARNAT — `public/data/LPTE_chunks.json`, art. 14, fr. III. SENER coadyuva en la metodología — `public/data/RISENER_chunks.json`, art. 16. La metodología pasa por opinión del Consejo — `public/data/RLPTE_chunks.json`, art. 105, fr. II. El aviso de 2025 dice que lo notificó la CRE — [aviso 2024](https://www.gob.mx/cms/uploads/attachment/file/981194/aviso_fesen_2024.pdf), y el de 2026 lo atribuye a SENER — [aviso 2026](https://www.gob.mx/cms/uploads/attachment/file/1081506/aviso_factor_de_emision_electrico_coa_2026.pdf).
- **Inventario nacional.** El INEGYCEI 1990-2015 reporta con PCG a 100 años del Quinto Informe — [INEGYCEI 1990-2015](https://www4.unfccc.int/sites/SubmissionsStaging/NationalReports/Documents/85321794_Mexico-NC6-BUR2-1-NIR_INEGYCEI%201990%20a%202015%20A.pdf).
- **Ojo con el resumen de un buscador.** Un acuerdo del 26-05-2023 aparecía como cambio de potenciales de calentamiento. Leí el documento y es el A/018/2023 de la CRE, sobre cogeneración eficiente — [Senado, punto de acuerdo](https://infosen.senado.gob.mx/sgsp/gaceta/65/2/2023-08-01-1/assets/documentos/PA_Morena_Sen_Espino_Ssistemas_Cogeneracion.pdf). No es un cambio de PCG.

**Derivados propios con esas tablas, a poder calorífico de la Lista 2026:**

| Combustible | MJ/unidad | kg CO₂/unidad | kg CO₂e/GJ (PCG AR5, estacionario) |
|---|---|---|---|
| Gas seco (m³, 20 °C, 100 kPa) | 33.543 | 1.882 | 56.15 |
| Diésel (L) | 38.148 | 2.827 | 74.34 |
| Gasolina (L) | 35.305 | 2.447 | no calculado |
| Gas LP (L) | 26.122 | 1.648 | no calculado |
| Combustóleo (L) | 41.865 | 3.240 | 77.64 |
| Carbón térmico (GJ) | — | — | 95.03 |
| Electricidad SEN 2024 | 3.6 por kWh | 0.444 por kWh | 123.33 |

### Inferences
- La secuencia oficial es: cantidad, poder calorífico de CONUEE, factor del DOF 2015, PCG AR5 para llegar a tCO₂e. La calculadora puede reproducirla y mostrar cada paso.
- Conviene mostrar también AR6 como comparación, pero sin que sea el default: la norma mexicana que vi sigue en AR5.
- El factor del SEN debe llevar el año del dato y el periodo de reporte al que aplica, porque en 2026 no coinciden.
- 0.444 tCO₂e/MWh considera la generación que entrega energía a la red, según el aviso. Ese aviso se apoya en el art. 3, fr. XLIV de la Ley de la Industria Eléctrica, abrogada por la Ley del Sector Eléctrico (`public/data/Ley_Sector_Electrico_chunks.json`, transitorio segundo). El fundamento citado en el aviso ya es histórico, y conviene aclararlo si se transcribe.

### Gaps
- No revisé la «Calculadora RENE v9.0»; una consultora la menciona sin enlace — [Blacktogreen](https://blacktogreen.com/2026/04/factores-de-emision-de-co2-en-mexico-guia-practica/). Esa misma fuente dice que SEMARNAT actualiza PCG, sin fecha ni documento; no lo pude confirmar.
- No hallé reforma del reglamento del RENE entre 2025 y 2026 ni adopción de AR6. Una búsqueda sin resultado no prueba que no exista.
- No verifiqué que el BTR o el INEGYCEI más reciente sigan en AR5.
- No verifiqué los avisos de 2014 a 2017, listados en la [página del RENE](https://www.gob.mx/semarnat/acciones-y-programas/registro-nacional-de-emisiones-rene).

## Dinero: $/GJ, USD/MMBtu, $/kWh y $/L con tipo de cambio

### Takeaway
La API de Banxico está abierta con un token de generación inmediata; Banxico no indica costo y terceros lo describen como gratuito. El token no debería ir en el navegador: conviene una función en servidor con caché diario. La conversión de precio es exacta para energía y requiere poder calorífico para pasar a litros. El tipo de cambio del usuario debe ser siempre editable.

### Cited Findings
- **Token.** Todas las solicitudes lo requieren; se genera con un captcha, una sola vez, y tiene 64 caracteres. La página no pide correo ni menciona costo — [Banxico, token](https://www.banxico.org.mx/SieAPIRest/service/v1/token). Se envía en el encabezado `Bmx-Token` o en el parámetro `token`; respuesta JSON, JSONP o XML; TLS 1.3 desde el 24-03-2023; soporte CORS desde la versión 1.3.2 — [Banxico, API SIE](https://www.banxico.org.mx/SieAPIRest/service/v1/).
- **Límites.** Dato oportuno: 80 consultas por minuto y 40 000 por día. Histórico: 200 en 5 minutos y 10 000 por día. Si se exceden, el token se bloquea y la respuesta es código 400. Banxico recomienda caché y advierte no consultar en cada carga de página — [Banxico, límites](https://www.banxico.org.mx/SieAPIRest/service/v1/doc/limiteConsultas).
- **FIX.** Promedio de cotizaciones del mercado al mayoreo, para operaciones que liquidan el segundo día hábil bancario. Se da a conocer desde las 12:00 h de cada día hábil y aparece en el DOF un día hábil después. Último visto: 18.6297 para el 6-11-2026 — [Banxico, FIX](https://www.banxico.org.mx/apps/dao-web/4/52/Fix48.html).
- **Series.** SF43718 es el FIX por fecha de determinación, y SF60653 por fecha de liquidación, según una librería de terceros — [xint0/banxico-php](https://packagist.org/packages/xint0/banxico-php). Un paquete de R usa SF43718 como FIX — [bbk](https://m-muecke.github.io/bbk/reference/banxico_data.html).

**Fórmulas. Clase EXACTO-DER en energía. Cálculo propio a partir de las tablas de arriba.**

| De | A | Operación |
|---|---|---|
| USD/MMBtu | USD/GJ | × 0.947 817 120 313 (1 ÷ 1.055 055 852 62) |
| USD/GJ | MXN/GJ | × tipo de cambio |
| MXN/GJ | MXN/kWh | × 0.0036 |
| MXN/kWh | MXN/GJ | × 277.777… |
| MXN/GJ | MXN/L | × (MJ/bl ÷ 158.987 294 928) ÷ 1 000. **Depende del combustible** |
| MXN/GJ | MXN/m³ gas | × MJ/m³ ÷ 1 000. **Depende del gas y las condiciones** |

- **Ejemplo.** 4.00 USD/MMBtu con FIX 18.6297: 74.518 8 MXN/MMBtu = 70.630 2 MXN/GJ = 0.254 27 MXN/kWh térmico. 25 MXN/L de diésel a 6 065 MJ/bl: 655.35 MXN/GJ. Son cálculos propios para probar el motor, no precios reales.

### Inferences
- El precio es el inverso de la energía: MXN/GJ a MXN/MMBtu multiplica, y GJ a MMBtu divide. El motor debe derivar esto del exponente de la unidad compuesta, sin una segunda tabla.
- Arquitectura: el token en una función de Cloudflare o Supabase, un caché con la última serie y un fallback manual. Si la consulta falla, la calculadora sigue funcionando con el dato que escriba la persona. El FIX se muestra con su fecha, y siempre es un valor sugerido, editable.
- Advertencia que la pantalla debe mostrar: un precio por MMBtu de contrato suele estar en base bruta, mientras la lista de CONUEE es neta. Comparar sin ajustar es un error de 10 % en gas y 5 % en líquidos, con la regla del BNE.

### Gaps
- No leí la «Salvedad de uso» de la API, que puede limitar la republicación de datos.
- No verifiqué en documentación oficial de Banxico las claves SF43718 y SF60653; las tengo de terceros.
- No confirmé en una fuente mexicana qué base (bruta o neta) y qué condiciones usan los contratos de gas natural. Le toca a otra línea de esta investigación.
- Banxico no indica expresamente que el token sea gratuito; solo no menciona costo.

## Calculadoras de referencia

### Takeaway
No encontré ninguna calculadora oficial mexicana de unidades energéticas, ni una herramienta de sector en español. Las mejores internacionales resuelven una parte: EIA da fuente y factor anual, CER declara condiciones de referencia, NIST da exactitud, y ninguna reúne todo. El vacío real es: factores oficiales mexicanos por año, con poder neto, condiciones declaradas, notación M/MM, emisiones del RENE y cita en cada número.

### Cited Findings

| Herramienta | Magnitudes | Condiciones de referencia | Fórmula y fuente | UX | Fallas para México | Verificado |
|---|---|---|---|---|---|---|
| [EIA calculators](https://www.eia.gov/energyexplained/units-and-calculators/energy-conversion-calculators.php) | 7 calculadoras: carbón, electricidad, gas, crudo, gasolina, diésel, comida | Factor por año 2026 y por base (producción, consumo), sin P/T explícita | Muestra el factor y enlaza la tabla fuente; no hay fórmula general | Una entrada, varias salidas; botones Calcular y Borrar | Datos de EE. UU.; sin copiar ni enlace compartible; sin presión, potencia ni flujo | Sí, leída |
| [NIST SP 811 B.8 y B.9](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) | Todas las físicas, a 7 cifras | Variantes por temperatura; notas | Marca exactos en negritas; regla de redondeo en B.7 | Tabla, no calculadora | Sin combustibles; sin toe ni boe; la tabla redondea valores exactos | Sí |
| [Unitconverters.net](https://www.unitconverters.net/energy-converter.html) | 60+ unidades de energía; otras magnitudes en otras páginas | Ninguna | Sin fórmula ni fuente | Par de unidades; páginas por par, buenas para buscadores | Btu_th = 1 054.349 999 974 4, distinto del derivado; «fuel oil equivalent @barrel» sin definir; sin tep; ruido atómico | Sí |
| [CER Canadá](https://apps.cer-rec.gc.ca/Conversion/conversion-tables.aspx) | Prefijos, densidad API, volumen, energía, GNL, contenido energético | **Sí:** 101.325 kPa y 15 °C; 14.73 psia y 60 °F | Valores en negritas; sin fuente; aviso de que no sirve para contratos | Tabla con índice; bilingüe | Sin cálculo en esa página (remite a otro conversor sin enlace); datos canadienses | Sí |
| [Kurzy.cz, gas](https://eng.kurzy.cz/calculator/natural-gas-unit-conversion) | Gas: MWh, GJ, m³, MMBtu | No dice bruto o neto ni condiciones | Sin fuente | Conversión con diagrama; 2 decimales | Factor fijo no editable | Sí, parcial |
| [IEA Unit Converter](https://www.iea.org/reports/unit-converter-and-glossary) | Sin verificar | Sin verificar | Sin verificar | Sin verificar | Sin verificar | **No:** 403 con fetch y verificación de seguridad en el navegador |
| [Manual IEA/Eurostat, anexo 3](https://www.enerclub.es/wp-content/uploads/2013/02/statistics_manual_spanish.pdf) | Tabla Mtep, TJ, Gcal, MBtu, GWh | Explica neto y bruto | Define la tep y la cal IT | Tabla de doble entrada en PDF | No es herramienta; «MBtu» = 10⁶ | Sí, copia citada por el BNE |
| Energy Institute (antes BP), Approximate conversion factors | Sin verificar | Sin verificar | Sin verificar | PDF | Sin verificar | **No:** 403 en EI, 404 en copias, y la ruta de BP ya no sirve el PDF |
| OLADE / sieLAC | Sin verificar | Sin verificar | Sin verificar | Sin verificar | Sin verificar | **No:** servidor con 404 o error |
| [SENER BNE](https://www.gob.mx/cms/uploads/attachment/file/977268/Balance_Nacional_de_Energ_a_2023.FINAL06.02.2025.1.pdf) | Factores y PC anuales | 20 °C y 100 kPa | Cita NIST y el SIE | PDF de 257 páginas | No es calculadora; poco accesible | Sí |
| [CONUEE, Lista](https://www.gob.mx/cms/uploads/attachment/file/1071250/lista_de_combustibles_2026.pdf) | PC y bep de 30+ combustibles | 20 °C y 100 kPa en gas | Cita BNE y oficio | Escaneo sin texto | No es calculadora; redondeos; formato mixto | Sí |
| [RENE](https://www.gob.mx/semarnat/acciones-y-programas/registro-nacional-de-emisiones-rene) | Emisiones | No aplica | Enlaza acuerdos y avisos | PDFs y una calculadora en Excel, según terceros | Para reportantes, no para público | Página sí; calculadora no |
| [Calculoseguro.mx](https://calculoseguro.mx/calculadora-ahorro-energia) | Ahorro en recibo eléctrico | No aplica | Porcentajes típicos; dice que no es asesoría | Formulario | No convierte unidades; es de terceros | Solo por resultado de búsqueda |
| [Blog «conversión energía»](https://conversion-calculadora-conversor.blogspot.com/2014/05/conversion-energia-conversor-trabajo.html) | Genérico en español | Sin verificar | Sin verificar | Sin verificar | Único en español que apareció; de 2014 | Solo por resultado de búsqueda |

- **Búsquedas sin resultado.** Busqué calculadoras de SENER, CRE, CENAGAS, CONUEE y CFE, y conversores de sector en español, sin encontrar una oficial; aparecieron sobre todo herramientas en inglés y francés. Esto es ausencia de hallazgo, no prueba de inexistencia.
- **Aviso para quien lea los buscadores.** Hay páginas de baja calidad con errores graves, como 1 MMBtu ≈ 0.001654 m³ contra los ~28 m³ de las otras fuentes — [ejemplo](https://s1.propertyindustryeye.com/civic-talk/mmbtu-to-m3-natural-gas-conversion-1770533329).

### Inferences
**Vacío real que llena una calculadora mexicana:**
1. Factores mexicanos oficiales por año (BNE y CONUEE), en una tabla legible. Hoy están en PDF escaneado.
2. Condiciones de referencia nombradas: 20 °C y 100 kPa; 15 °C y 101.325 kPa; 20 °C y 98.07 kPa.
3. Notación de sector en español: M, MM, MMM, Mbd, MMpcd, «kg/cm²», mca.
4. El bep mexicano, con año, junto a 5.8 MMBtu.
5. Emisiones con la cadena oficial RENE.
6. Cumplimiento visible de la NOM-008.
7. Texto en español claro, con cita al documento de cada factor; la app ya tiene el acervo jurídico para enlazar.

**Funciones que valen la pena:**
- Una entrada y todas las salidas de la magnitud, con la unidad oficial fija al inicio.
- Ida y vuelta sin perder el valor original.
- Etiqueta visible por fila: «exacto por definición» o «típico, año 2024».
- Fuente en un toque, con enlace al documento y al artículo.
- Selector de combustible, año y base (neta o bruta), y de condiciones.
- Copiar el resultado con unidad y formato NOM, y copiar «con fuente».
- Enlace compartible en el hash, siguiendo el patrón de enlaces profundos que ya usa la app.
- Avisos de trampa en contexto: «MM no es mega», «billion ≠ billón».
- Mostrar la fórmula aplicada, paso a paso.
- Tipo de cambio editable, con FIX sugerido y fecha.
- Funcionar sin conexión, porque los factores son estáticos.

**Lo que no vale la pena:** unidades exóticas de energía atómica, calorías de comida, ni una página por par de unidades solo por SEO si no aporta contexto mexicano.

### Gaps
- No pude revisar IEA, Energy Institute, BP ni OLADE como herramientas. Queda como pendiente con un navegador humano, porque sus sitios bloquean a los agentes. No inferir de aquí que sean malas.
- No revisé apps móviles de sector ni herramientas de pago.
- No confirmé si CER tiene una calculadora viva; su página solo la menciona.
- No revisé la calculadora de Excel del RENE.

## Motor: precisión en JavaScript, cifras y librería

### Takeaway
**Recomendación: tabla propia, con `Number` para el cálculo y factores guardados como fracción exacta.** Agregar big.js solo si se quiere una vista de «todas las cifras». Ninguna librería de unidades revisada conoce poder calorífico, año ni condiciones, y varias traen factores redondeados o trampas de alias.

### Cited Findings
**Coma flotante, prueba propia en Python y Node (mismo IEEE 754):** `0.1+0.2` = 0.30000000000000004; `0.07*100` = 7.000000000000001; `123.456*3.6/3.6` = 123.45599999999999; con `toPrecision(12)` vuelve a 123.456. El error relativo es del orden de 10⁻¹⁶, muy por debajo de cualquier cifra que se muestre.

**Regla de redondeo.** El número de cifras convertidas debe corresponder al error de redondeo del valor original: 36 ft × 0.3048 = 10.9728 m se escribe 11.0 m — [NIST SP 811, B.7.2](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf).

| Librería | Qué trae | Problemas para este proyecto | Fuente |
|---|---|---|---|
| mathjs | BTU 1055.05585262, mmHg 133.322387415, torr 101325/760, oilbarrel 0.158987294928, temperatura con desplazamiento | **Sin caloría**; `bbl` es barril de cerveza; hp 745.6998715386 y psi 6894.75729276459 difieren del exacto en 6×10⁻¹¹; sin inH₂O, tep, bep ni therm; `kgf` existe solo como fuerza, así que kgf/cm² hay que componerla; `ton` es corta | [Unit.js](https://raw.githubusercontent.com/josdejong/mathjs/develop/src/type/unit/Unit.js) |
| js-quantities | oilbarrel exacto; lb exacta; therm EE. UU. | btu 1055.056; psi 6894.76 (4×10⁻⁷ de error); mmHg igualado a torr; sin toe, boe, MMBtu, mca; `kilogram-force` solo como fuerza; `celsius` como diferencia en esa tabla | [definitions.js](https://raw.githubusercontent.com/gentooboontoo/js-quantities/master/src/quantities/definitions.js) |
| convert-units | Energía, presión, temperatura, potencia y caudal; unidades a medida | Energía sin Btu ni caloría; presión sin atm ni kgf/cm²; su README dice «4 cifras significativas» en un ejemplo; licencia de estilo MIT | [README](https://raw.githubusercontent.com/convert-units/convert-units/main/README.md) |
| big.js | Decimal de precisión arbitraria, unos 6 KB, MIT, sin dependencias; suma, resta y multiplicación exactas; `div` redondea según `DP` y `RM` | No es de unidades; solo aritmética | [README](https://raw.githubusercontent.com/MikeMcl/big.js/master/README.md) |

### Inferences
**Por qué tabla propia:**
- Lo difícil no es multiplicar; es la procedencia. Cada factor necesita clase, fuente, año y condiciones, y ninguna librería guarda eso.
- Sobrescribir la tabla de una librería para corregirla cuesta más que escribir unas 120 filas, y se conserva la dependencia.
- El proyecto no usa framework; una tabla sin dependencias encaja.

**Modelo de datos sugerido, en tres capas, sin escribir código de producto:**
1. **Unidad lineal:** magnitud, factor a la base como fracción de enteros en texto (por ejemplo «1055.05585262» o «5/9»), clase, fuente, redondeo impreso para pruebas.
2. **Afín:** escala y desplazamiento. Sirve para temperatura y para manométrica contra absoluta, con el parámetro p_atm.
3. **Puente con contexto:** cambia de magnitud y exige datos: poder calorífico (combustible, año, base, condiciones), corrección P/T de gas, densidad, tipo de cambio, factor de emisión. Cada puente guarda su documento y vigencia.

**Compuestos:** armar flujo y precio por exponentes (volumen¹ tiempo⁻¹; dinero¹ energía⁻¹), con filas solo para alias de sector como MMpcd.

**Cifras a mostrar:**
- **EXACTO:** el límite lo pone el dato de entrada. Por defecto 6 cifras significativas, y «todas las cifras» a pedido.
- **TÍPICO:** tope en las cifras del factor. Un PC de la Lista 2026 como 3 o 18 MJ/m³ solo aguanta 1 o 2 cifras; 6 065 MJ/bl, 4.
- **Conversión encadenada:** manda el eslabón de menos cifras, y la pantalla lo dice.
- **Nunca** ceros de relleno que sugieran precisión falsa; la etiqueta debe decir por qué se recortó.

**Precisión:**
- `Number` alcanza: los factores tienen hasta 16 cifras y se muestran menos, y el error acumulado es ínfimo. Conviene redondear solo al mostrar, nunca en pasos intermedios.
- Multiplicar antes de dividir, y guardar 1/3 600 o 5/9 como fracción.
- Tener cuidado al usar `toFixed` para cantidades muy grandes o muy chicas; usar cifras significativas.
- big.js solo si la vista de «todas las cifras» debe ser exacta y sin artefactos. Son 6 KB, y `div` requiere fijar `DP`. Con la fracción guardada, solo se divide al final.

**Pruebas (la app ya usa Vitest):** contra los redondeos de NIST a 7 cifras; ida y vuelta para cada par; 0 °C = 32 °F = 273.15 K, y −40 °C = −40 °F; factor bep calculado contra el factor impreso por CONUEE; casos de trampa, como que `bbl` sea 42 gal y que MMpc no se lea como prefijo SI.

**Formato:** `Intl.NumberFormat('es-MX')` da comas, contra la NOM. Conviene usar `formatToParts` y cambiar el separador de grupo por espacio delgado.

### Gaps
- No comparé el tamaño de los paquetes de mathjs, js-quantities y convert-units; solo tengo el de big.js según su README.
- La licencia y versión vigente de convert-units no quedaron claras en el README.
- En js-quantities puede haber manejo aparte de `tempC`; solo leí `definitions.js`.
- El conteo de «unas 120 filas» es estimación mía, no medición.
