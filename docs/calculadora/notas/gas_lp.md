# Gas LP en México: unidades, densidad, composición y ajustes para una calculadora energética pública

Corte: 8 de noviembre de 2026. Marco: Ley del Sector Hidrocarburos (LSH, 2025) y Comisión Nacional de Energía (CNE). "Cálculo propio" significa aritmética hecha para estas notas sobre la fuente que se liga; se puede repetir. Etiquetas: EXACTO (por definición o por regla de publicación) y TÍPICO (depende de mezcla, temperatura o supuesto).

## Tabla maestra: kg, L, energía, vapor, presión, emisiones

### Takeaway
La base recomendada es: 0.54 kg/L (implícito en toda la tabla de la CNE), 26.12 MJ/L (CONUEE 2025) y 63.1 tCO2/TJ (Acuerdo DOF 2015). Son los valores oficiales, pero no cuadran físicamente entre sí: encadenados dan 48.4 MJ/kg, más que el poder calorífico inferior del propano puro (46.3 MJ/kg). La calculadora debe avisarlo y ofrecer el valor físico como alternativa.

### Cited Findings

**A. Masa y volumen de líquido**

| Conversión | Factor | Tipo | Supuestos y rango | Fuente |
|---|---|---|---|---|
| $/L desde $/kg | × 0.54 | EXACTO como regla de publicación | Las 2,470 filas de la semana 8-14 nov 2026 dan razón L/kg entre 0.5397 y 0.5403, solo redondeo. La CNE no escribe el factor ni la temperatura | Cálculo propio sobre [CNE, precios máximos 8-14 nov 2026](https://www.gob.mx/cms/uploads/attachment/file/1115181/PRECIOS_MAXIMOS_VIGENTES_DEL_8_al_14_de_noviembre_DE_2026.pdf) |
| 1 L → kg | 0.54 kg/L | TÍPICO (convención) | Densidad relativa 0.504 a 0.540 a 15.6 °C en ZMVM, Puebla, Toluca, Querétaro y Monterrey; en el resto solo se informa | [NOM-016-CRE-2016, Tabla 13](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf) |
| 1 kg → L | 1.8519 L/kg | TÍPICO | Inverso de 0.54 | Cálculo propio |
| Densidad física del líquido | 0.50 a 0.58 kg/L | TÍPICO | A 20 °C, según la proporción propano/butano | [IEA-AMF](https://iea-amf.org/content/fuel_information/lpg/fuel_properties) |
| 1 t → L | 1,851.9 L/t | TÍPICO | A 0.54 kg/L | Cálculo propio |
| 1 bl → L | 158.987 L | EXACTO | 1 barril = 0.158987 m³ | [ANP Brasil, tabla de conversión](https://www.gov.br/anp/pt-br/centrais-de-conteudo/publicacoes/anuario-estatistico/arquivos-anuario-estatistico-2022/outras-pecas-documentais/fatores-conversao-2022.pdf) |
| 1 bl → kg | 85.85 kg/bl | TÍPICO | A 0.54 kg/L | Cálculo propio |
| 1 t → bl | 11.65 bl/t | TÍPICO | Rango internacional 11.00 a 11.80 bl/t | Cálculo propio; rango en [JODI](https://www.jodidata.org/_resources/files/events/joint-apec-jodi-training-workshop-on-oil-and-gas-statistics/04.-conversion-factors-volume-to-mass-and-vice-versa.pdf) |

**B. Energía**

| Conversión | Valor | Tipo | Supuestos | Fuente |
|---|---|---|---|---|
| Poder calorífico neto oficial vigente | 4,152.89 MJ/bl; 0.6461 bep/bl | TÍPICO | Viene del Balance Nacional de Energía 2023 preliminar. La lista 2025 abroga la de 2024 | [CONUEE, Lista de combustibles 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf) |
| Lo mismo por litro (por defecto) | 26.12 MJ/L = 7.256 kWh = 6.239 Mcal = 24,758 Btu | TÍPICO | 4,152.89 ÷ 158.987 | Cálculo propio sobre CONUEE |
| Valor oficial anterior | 4,124 MJ/bl; 25.94 MJ/L | TÍPICO | Hoja de factores 2015; difiere +0.7 % de CONUEE | [Semarnat, Factores de emisión 2015](https://www.gob.mx/cms/uploads/attachment/file/235891/FACTORES_DE_EMISION_2015.pdf) |
| Por kg encadenando lo oficial | 48.37 MJ/kg = 13.44 kWh = 11.55 Mcal = 45,848 Btu | TÍPICO, no físico | 26.12 ÷ 0.54. Rebasa el rango físico de PCI | Cálculo propio |
| PCI físico, mezcla 60/40 | 46.07 MJ/kg = 12.80 kWh = 11.00 Mcal = 43,666 Btu; 24.76 MJ/L | TÍPICO | % vol líquido, n-butano, 15.56 °C. Rango: propano 46.34, n-butano 45.72 MJ/kg | Cálculo propio con ΔcH° de [propano](https://webbook.nist.gov/cgi/cbook.cgi?ID=C74986&Mask=1) (-2219.2 kJ/mol) y [n-butano](https://webbook.nist.gov/cgi/cbook.cgi?ID=C106978&Mask=1) (-2877.5 kJ/mol), restando 44.0 kJ/mol H₂O |
| PCS físico, mezcla 60/40 | 49.97 MJ/kg = 13.88 kWh = 11.94 Mcal = 47,362 Btu; 26.86 MJ/L | TÍPICO | Rango: propano 50.33, n-butano 49.51 MJ/kg | Mismo cálculo |
| Rango internacional | PCI 44 a 46 MJ/kg; 23 a 26 MJ/L; PCS 48 a 50 MJ/kg | TÍPICO | Varía con la mezcla | [IEA-AMF](https://iea-amf.org/content/fuel_information/lpg/fuel_properties) |
| PCS del vapor | 93.1 MJ/m³ | TÍPICO | Valor usado por la norma de calefactores | [NOM-012-SESH-2010](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/012sesh2010.pdf) |
| PCS del propano en vapor | 22,390.6 kcal/m³ (93.74 MJ/m³) | TÍPICO | La NOM imprime 0,9365 MJ, que no cuadra con sus propias kcal y BTU | [NOM-004-SEDG-2004](https://www.gob.mx/cms/uploads/attachment/file/138730/NOM-004-SEDG-2004.pdf) |
| PCI del gas de prueba | 90 ± 2 MJ/m³ | TÍPICO | Alternativa a propano de 95 % molar mínimo | [NOM-003-ENER-2021, 8.4.3](https://dof.gob.mx/normasOficiales/8724/sener11_C/sener11_C.html) |
| 1 MWh → MJ | 3,600 MJ | EXACTO | | [CONUEE 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf) |
| 1 Btu → kJ | 1.055056 kJ | EXACTO | | [Semarnat 2015](https://www.gob.mx/cms/uploads/attachment/file/235891/FACTORES_DE_EMISION_2015.pdf) |

**C. Vapor (15.56 °C)**

| Concepto | Propano | 80/20 | 70/30 | 60/40 | n-butano | Tipo |
|---|---|---|---|---|---|---|
| Líquido, kg/L | 0.5067 | 0.5221 | 0.5298 | 0.5375 | 0.5836 | TÍPICO |
| Vapor a 101.325 kPa, kg/m³ | 1.895 | 2.009 | 2.069 | 2.130 | 2.539 | TÍPICO |
| Vapor a 101.325 kPa, m³/kg | 0.528 | 0.498 | 0.483 | 0.470 | 0.394 | TÍPICO |
| L de vapor por L de líquido, nivel del mar | 267 | 260 | 256 | 252 | 230 | TÍPICO |
| L de vapor por L de líquido, a 78 kPa | 349 | 339 | 334 | 330 | 301 | TÍPICO |

Base: densidades de [propano](https://webbook.nist.gov/cgi/fluid.cgi?TLow=288.71&THigh=289.71&TInc=1&Digits=5&ID=C74986&Action=Load&Type=SatP&TUnit=K&PUnit=kPa&DUnit=kg%2Fm3&HUnit=kJ%2Fkg&WUnit=m%2Fs&VisUnit=uPa*s&STUnit=N%2Fm&RefState=DEF) y [n-butano](https://webbook.nist.gov/cgi/fluid.cgi?TLow=288.71&THigh=289.71&TInc=1&Digits=5&ID=C106978&Action=Load&Type=SatP&TUnit=K&PUnit=kPa&DUnit=kg%2Fm3&HUnit=kJ%2Fkg&WUnit=m%2Fs&VisUnit=uPa*s&STUnit=N%2Fm&RefState=DEF) saturados, y vapor a 78 y 101.325 kPa de [propano](https://webbook.nist.gov/cgi/fluid.cgi?T=288.71&PLow=78&PHigh=101.325&PInc=23.325&Digits=5&ID=C74986&Action=Load&Type=IsoTherm&TUnit=K&PUnit=kPa&DUnit=kg%2Fm3&HUnit=kJ%2Fkg&WUnit=m%2Fs&VisUnit=uPa*s&STUnit=N%2Fm&RefState=DEF) y [n-butano](https://webbook.nist.gov/cgi/fluid.cgi?T=288.71&PLow=78&PHigh=101.325&PInc=23.325&Digits=5&ID=C106978&Action=Load&Type=IsoTherm&TUnit=K&PUnit=kPa&DUnit=kg%2Fm3&HUnit=kJ%2Fkg&WUnit=m%2Fs&VisUnit=uPa*s&STUnit=N%2Fm&RefState=DEF), NIST. Las mezclas son cálculo propio con volúmenes aditivos. La densidad relativa oficial del propano en la norma de instalaciones es [1.52 con aire = 1](https://www.gob.mx/cms/uploads/attachment/file/138730/NOM-004-SEDG-2004.pdf).

**D. Presión (detalle por temperatura en la sección de presión)**

| Concepto | kPa | mbar | in H₂O | gf/cm² | Tipo | Fuente |
|---|---|---|---|---|---|---|
| Servicio en baja presión, sin medidor | 2.737 | 27.4 | 11.0 | 27.9 | TÍPICO (nominal normativo) | [NOM-004-SEDG-2004, 3.20](https://www.gob.mx/cms/uploads/attachment/file/138730/NOM-004-SEDG-2004.pdf) |
| Servicio en baja presión, con medidor | 2.86 | 28.6 | 11.5 | 29.2 | TÍPICO (nominal normativo) | Misma |
| Regulador de baja presión | 2.75 ± 0.29 | 27.5 | 11.0 | 28.04 | TÍPICO (nominal normativo) | [NOM-015-SESH-2013, 5.12](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/015sesh2013.pdf) |
| Gas de prueba Gas LP | 2.74 | 27.4 | 11.0 | 27.94 | TÍPICO (nominal normativo) | [NOM-003-ENER-2021, Tabla 3](https://dof.gob.mx/normasOficiales/8724/sener11_C/sener11_C.html) |

Las columnas mbar e in H₂O son conversión aritmética, cálculo propio.

**E. Emisiones**

| Concepto | Valor | Tipo | Fuente |
|---|---|---|---|
| CO₂ por energía | 63.1 tCO₂/TJ | TÍPICO (oficial) | [Acuerdo DOF 3-sep-2015, Tablas 1 y 2](https://dof.gob.mx/nota_detalle.php?codigo=5406149&fecha=03%2F09%2F2015) |
| CO₂ por litro, cadena por defecto | 1.648 kgCO₂/L | TÍPICO | 63.1 × 26.12 MJ/L, cálculo propio |
| CO₂ por litro, hoja oficial | 1.637 kgCO₂/L | TÍPICO | [Semarnat 2015](https://www.gob.mx/cms/uploads/attachment/file/235891/FACTORES_DE_EMISION_2015.pdf) |
| CO₂ por kg, cadena por defecto | 3.052 kgCO₂/kg | TÍPICO | 1.648 ÷ 0.54, cálculo propio |
| CO₂ por kg, tabla oficial | 2.985 tCO₂/t | TÍPICO (oficial) | [Acuerdo DOF 2015, numeral 16, hierro y acero](https://dof.gob.mx/nota_detalle.php?codigo=5406149&fecha=03%2F09%2F2015) |

### Inferences
- Una sola cadena evita incoherencias: la calculadora guarda litros, pasa a kg con 0.54, a energía con 26.12 MJ/L y a CO₂ con 63.1 g/MJ. El modo físico (46.07 MJ/kg y 24.76 MJ/L) va como opción, con su etiqueta.
- La diferencia entre el camino oficial y el físico es de 5.5 % en energía. Para el público pesa menos que el error de temperatura y mezcla, pero se debe declarar.

### Gaps
- No hallé ningún documento mexicano que publique el poder calorífico superior oficial por kg o por litro. CONUEE solo da neto y solo por barril.
- No abrí el Balance Nacional de Energía: el valor llega por la cita de CONUEE al oficio SPTE.200.031 de SENER, del 27 de enero de 2025. Tampoco encontré una lista de CONUEE de 2026, así que la de 2025 es la última que pude verificar.

## ¿Qué factor kg ↔ L usa México y dónde está escrito?

### Takeaway
México usa 0.54 kg/L de hecho, pero no lo encontré escrito en los acuerdos de precios que pude leer. Se comprueba en la tabla semanal de la CNE y coincide con el tope superior de la NOM-016 a 15.6 °C.

### Cited Findings
- En los precios de la semana del 8 al 14 de noviembre de 2026 hay 220 regiones, 32 entidades y 2,470 filas por municipio, con precio por kg y por litro, ambos con IVA. La razón L/kg es 0.54 en todas (0.5397 a 0.5403 por redondeo). Cálculo propio sobre [el PDF de la CNE](https://www.gob.mx/cms/uploads/attachment/file/1115181/PRECIOS_MAXIMOS_VIGENTES_DEL_8_al_14_de_noviembre_DE_2026.pdf).
- Ejemplos de esa semana, en $/kg y $/L: Ciudad de México 20.80 y 11.23; Guadalajara 20.97 y 11.33; Monterrey 20.99 y 11.34; Puebla 20.52 y 11.08; Tijuana 20.89 y 11.28. Mínimo 18.34 y 9.90 (Tamaulipas, región 192); máximo 25.19 y 13.60 (Baja California Sur, región 6). Media simple por municipio 21.08 y 11.38 — [CNE](https://www.gob.mx/cms/uploads/attachment/file/1115181/PRECIOS_MAXIMOS_VIGENTES_DEL_8_al_14_de_noviembre_DE_2026.pdf).
- El Acuerdo A/023/2022 fija el precio en pesos por kilogramo o por litro según corresponda, y no menciona factor, densidad ni 0.54 — [DOF 28-jul-2022](https://dof.gob.mx/nota_detalle.php?codigo=5659533&fecha=28%2F07%2F2022).
- El Acuerdo A/024/2021 tampoco menciona el factor ni la densidad; sus datos históricos están en pesos por kilogramo — [DOF 29-jul-2021](https://dof.gob.mx/nota_detalle.php?codigo=5625307&amp=&fecha=29%2F07%2F2021).
- Profeco reporta por costumbre el cilindro en $/kg y el estacionario en $/L: 19.57 $/kg y 10.57 $/L como promedios nacionales al 5 de agosto de 2026 — [Profeco, Quién es Quién, 10-ago-2026](https://combustibles.profeco.gob.mx/qqpgas/2026/QQPGASLP_081026.pdf).
- Sitios privados usan 0.54 sin citar documento oficial: uno lo presenta como densidad cercana y dice que coincide con la razón de precios de la CNE — [GasLPHoy](https://gaslphoy.com/guias/litro-de-gas-lp-en-kilogramos/).
- El acervo local no trae el factor. En `public/data` solo hay definición y marco, no números: Gas Licuado de Petróleo en `LSH_chunks.json`, id `LSH-Art-005`, fracción XXII, y como petrolífero en la fracción XXXVII; venta y compra entre permisionarios en `LSH-Art-083`; obligación de respetar precios máximos en `LSH-Art-119`, fracción XI, y de cantidad, medición y calidad en sus fracciones III y IV; y el propano usado como combustible se considera Gas LP en `RLSH_chunks.json`, id `RLSH-Art-095`. Los términos "litro" y "kilogramo" no aparecen en LSH, RLSH, LCNE, LPTE ni RLPTE. (Visto en los JSON; no consulté la tabla `leyes` de Supabase.)

### Inferences
- A 15.56 °C, 0.54 corresponde a la mezcla más pesada que permite la norma (60 % propano y 40 % butanos da 0.5375 kg/L con n-butano). Cualquier mezcla con más propano pesa menos por litro, así que 0.54 tiende a sobrestimar la masa real entregada.
- Conviene etiquetarlo en el catálogo como "convención de precios, TÍPICO", no como densidad medida.

### Gaps
- No encontré el documento que fije 0.54 en DOF, CNE, CRE ni Profeco. Un sitio de calculadoras lo atribuye a Pemex a 15.56 °C, sin documento localizable: sin fuente verificada. La temperatura de referencia del 0.54 tampoco está declarada por la CNE.
- No revisé los decretos de precios anteriores a 2021, donde podría estar el origen del factor.

## Composición, especificación y propiedades por temperatura

### Takeaway
La NOM-016-CRE-2016 sigue siendo la referencia: mínimo 60 % vol de propano y máximo 40 % vol de butanos en todo el país. Lo único que cambia por región es la presión de vapor mínima, el rango de densidad y las olefinas. La Tabla 13 no tiene temporadas. No hallé composición real publicada por región.

### Cited Findings
- [Tabla 13 de la NOM-016-CRE-2016](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf):

| Propiedad | Resto del país | ZMVM, Puebla, Toluca, Querétaro y Monterrey |
|---|---|---|
| Presión de vapor sobre la atmósfera a 37.8 °C | 688 a 1379 kPa (100 a 200 lb/pulg²) | 896 a 1379 kPa (130 a 200 lb/pulg²) |
| Temperatura máxima al 95 % destilado | 2.0 °C | 2.0 °C |
| Etano, máximo | 2.50 % vol | 2.50 % vol |
| Propano, mínimo | 60.00 % vol | 60.00 % vol |
| n-butano + iso-butano, máximo | 40.00 % vol | 40.00 % vol |
| Pentano y más pesados, máximo | 2.00 % vol | 2.00 % vol |
| Olefinas totales | informar | 2 máximo |
| Densidad relativa a 15.6 °C | informar | 0.504 a 0.540 |
| Azufre total, máximo | 140 ppm en peso | 140 ppm en peso |

- El GLP importado por el ducto Hobbs-Méndez puede traer hasta 5 % vol de etano si no rebasa 1379 kPa a 37.8 °C. El GLP debe odorizarse — [NOM-016-CRE-2016](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf).
- Distribuidores y expendios deben controlar la densidad relativa a 15.56 °C; almacenistas y transportistas, además, la presión de vapor y el agua libre — [NOM-016, Tabla A.7](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf).
- La norma sigue aplicando en tanto no se modifique o sustituya, según transitorios: `LSH_chunks.json`, id `LSH-Trans-22`, y `RLSH_chunks.json`, id `RLSH-Trans-22`. El mismo texto del transitorio de la LSH también aparece bajo el id `LSH-Art-027`, probable defecto de troceado.
- Una ficha basada en PLATIICA la da como vigente: publicada el 29 de agosto de 2016, en vigor desde el 28 de octubre de 2016, expedida por el Acuerdo A/035/2016 de la CRE, sin sucesora mencionada — [mley.mx](https://mley.mx/normas/nom-016-cre-2016/index.html.md). Es valor heredado de la CRE, hoy a cargo de la CNE. Una búsqueda de un proyecto 2026 para sustituirla no arrojó resultado.
- Una guía comercial reporta 70 % de propano en la ZMVM y en % mol, lo que no coincide con la tabla oficial — [Baltur](https://baltur.com.mx/es/documentacion/articulos/combustibles/gas-lp).
- En 1999 Pemex Gas planeaba subir poco a poco el contenido de propano en la formulación — [NOM-011-SEDG-1999, Considerando Tercero](https://dof.gob.mx/nota_detalle_popup.php?codigo=2051734).
- La información fiscal de controles volumétricos pide reportar % de propano y % de butano, normalizados a 100 % — [Anexo 30 RMF 2024](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2024/rmf/anexos/Anexo_30_RMF2024-22012024.pdf).
- Densidad del líquido saturado en kg/L: valores de NIST para [propano](https://webbook.nist.gov/cgi/fluid.cgi?TLow=253.15&THigh=323.15&TInc=10&Digits=5&ID=C74986&Action=Load&Type=SatP&TUnit=K&PUnit=kPa&DUnit=kg%2Fm3&HUnit=kJ%2Fkg&WUnit=m%2Fs&VisUnit=uPa*s&STUnit=N%2Fm&RefState=DEF), [n-butano](https://webbook.nist.gov/cgi/fluid.cgi?TLow=253.15&THigh=323.15&TInc=10&Digits=5&ID=C106978&Action=Load&Type=SatP&TUnit=K&PUnit=kPa&DUnit=kg%2Fm3&HUnit=kJ%2Fkg&WUnit=m%2Fs&VisUnit=uPa*s&STUnit=N%2Fm&RefState=DEF) e [isobutano](https://webbook.nist.gov/cgi/fluid.cgi?TLow=253.15&THigh=323.15&TInc=10&Digits=5&ID=C75285&Action=Load&Type=SatP&TUnit=K&PUnit=kPa&DUnit=kg%2Fm3&HUnit=kJ%2Fkg&WUnit=m%2Fs&VisUnit=uPa*s&STUnit=N%2Fm&RefState=DEF). Las columnas de mezcla son cálculo propio, con % vol a 15.56 °C tratado como aditivo, usando n-butano. La fila de 15.56 °C para isobutano es interpolación propia.

| °C | Propano | n-butano | Isobutano | 60/40 | 70/30 | 80/20 |
|---|---|---|---|---|---|---|
| -20 | 0.5545 | 0.6217 | 0.6029 | 0.5814 | 0.5746 | 0.5679 |
| -10 | 0.5418 | 0.6114 | 0.5919 | 0.5696 | 0.5627 | 0.5557 |
| 0 | 0.5286 | 0.6007 | 0.5806 | 0.5574 | 0.5502 | 0.5430 |
| 10 | 0.5147 | 0.5898 | 0.5689 | 0.5448 | 0.5373 | 0.5298 |
| 15.56 | 0.5067 | 0.5836 | 0.5622 | 0.5375 | 0.5298 | 0.5221 |
| 20 | 0.5001 | 0.5786 | 0.5569 | 0.5315 | 0.5236 | 0.5158 |
| 30 | 0.4844 | 0.5670 | 0.5443 | 0.5174 | 0.5092 | 0.5009 |
| 40 | 0.4675 | 0.5549 | 0.5312 | 0.5024 | 0.4937 | 0.4850 |
| 50 | 0.4489 | 0.5423 | 0.5174 | 0.4863 | 0.4769 | 0.4676 |

### Inferences
- El mínimo de 896 kPa a 37.8 °C en la ZMVM y las otras cuatro ciudades obliga en la práctica a más propano que el 60 % legal. Con n-butano y ley de Raoult, 60/40 da 849 kPa, 65/35 da 895 kPa y 70/30 da 941 kPa, de modo que el umbral queda cerca de 65 % vol. Con isobutano el umbral baja. Es estimación propia.
- Por eso una mezcla 70/30 a 80/20 (0.53 a 0.52 kg/L a 15.56 °C) es un supuesto razonable para esas ciudades, no 60/40. Sin dato medido queda como TÍPICO.
- El mito de los litros de vapor "1:270" corresponde a propano casi puro (NIST da 267). Para la mezcla legal más pesada es 1:252.

### Gaps
- No encontré la composición real por región ni por temporada, ni una hoja técnica vigente de Pemex. La calidad medida en los dictámenes de controles volumétricos no es pública en lo que busqué.
- No leí los acuerdos posteriores que modificaron la NOM-016; una fuente reporta [mejoras aprobadas en 2017](https://basham.com.mx/mejoras-a-la-norma-oficial-mexicana-nom-016-cre-2016/). No sé si tocan la Tabla 13. La versión aquí citada es la del DOF del 29 de agosto de 2016.

## Dilatación, llenado, corrección volumétrica y medición

### Takeaway
La norma de medición de Gas LP es la NOM-259-SE-2022, no la NOM-185 ni la NOM-005-SCFI. Tolera ±1.0 % en verificación, permite vender por litro o por kg y no exige compensar temperatura. La dilatación mueve cerca de 0.26 a 0.31 % por °C, así que la temperatura pesa más que la tolerancia del medidor.

### Cited Findings
- [NOM-259-SE-2022, Sistemas para medición y despacho de Gas L.P.](http://diariooficial.gob.mx/nota_detalle.php?codigo=5731801&fecha=28%2F06%2F2024): aplica a fase líquida en autotanques y estaciones con fin específico y multimodales. Clase de exactitud 1.0; error máximo tolerado 0.6 % en aprobación de modelo y 1.0 % en inspección inicial, periódica, extraordinaria y verificación; división mínima 0.1 L o 0.1 kg; inspección periódica anual.
- La misma norma dice que los sistemas podrán contar con corrección por temperatura y presión, no que deban. El Apéndice B (informativo) remite a API MPMS 11.2.4 para el factor de temperatura, y sus fórmulas están como imagen — [NOM-259, 6.9 y Apéndice B](http://diariooficial.gob.mx/nota_detalle.php?codigo=5731801&fecha=28%2F06%2F2024).
- Entra en vigor 548 días naturales tras su publicación del 28 de junio de 2024, y los propietarios tienen hasta doce meses para sustituir sistemas — [NOM-259, transitorios](http://diariooficial.gob.mx/nota_detalle.php?codigo=5731801&fecha=28%2F06%2F2024). La ficha oficial la lista como vigente — [PLATIICA](https://platiica.economia.gob.mx/normalizacion/nom-259-se-2022/). Profeco atiende la verificación de medidores en estaciones con fin específico y autotanques — [Profeco, calibración](https://calibracion.profeco.gob.mx/).
- La NOM-005-SCFI-2017 cubre gasolina y otros combustibles líquidos con gasto máximo de 250 L/min — [PLATIICA](https://platiica.economia.gob.mx/normalizacion/nom-005-scfi-2017/). La NOM-185-SCFI-2017 cubre el software y los sistemas electrónicos de esos mismos despachadores; su ficha no menciona Gas LP — [PLATIICA](https://platiica.economia.gob.mx/normalizacion/nom-185-scfi-2017/).
- Cilindros, por peso: el contenido neto de Gas LP se verifica solo en recipientes listos para venta, pesando y restando la tara marcada. No hay tolerancia especial para Gas LP, así que aplica la Tabla 1: 150 g de 10,000 a 15,000 g y 1.0 % de 15,000 a 50,000 g — [NOM-002-SCFI-2011, Apéndice C y Tabla 1](https://dof.gob.mx/normasOficiales/4828/seeco/seeco.htm).
- Temperatura de referencia, según quién mida: densidad a [15.6 °C en NOM-016](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf); condiciones estándar de [15.6 °C y 101.3 kPa en NOM-004](https://www.gob.mx/cms/uploads/attachment/file/138730/NOM-004-SEDG-2004.pdf); petrolíferos a [20 °C y 101.325 kPa en el Anexo 30 fiscal](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2024/rmf/anexos/Anexo_30_RMF2024-22012024.pdf).
- API MPMS 11.2.4 es el estándar de volumen para NGL y LPG, con tablas 23E/24E a 60 °F, 53E/54E a 15 °C y 59E/60E a 20 °C; densidad relativa 0.35 a 0.688 y presión de saturación. Edición vigente 2019, reafirmada en 2024 — [BSI](https://knowledge.bsigroup.com/products/temperature-correction-for-the-volume-of-ngl-and-lpg-tables-23e-24e-53e-54e-59e-60e); [GlobalSpec](https://standards.globalspec.com/std/13327202/api-mpms-11-2-4).
- Llenado en tanques no transportables: el Tipo B (100 a 5,000 L de agua, usados en casas y estaciones) lleva indicador de máximo llenado al 85 %; el Tipo C (vehículos, hasta 300 L) tiene 85 % máximo; el Tipo A (más de 5,000 L) y el Tipo D (autotanques) llevan dos válvulas, 85 % y 90 % — [NOM-009-SESH-2011, 5.2.8.2](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/009sesh2011.pdf).
- Las fuentes de consumo difieren: Protección Civil CDMX dice no llenar más de 80 % — [guía](https://www.proteccioncivil.cdmx.gob.mx/storage/app/uploads/public/61f/184/ab0/61f184ab0bb26681477942.pdf); notas de prensa atribuyen a Profeco el 85 % — [ADN40, 2024](https://www.adn40.mx/mexico/2024-10-16/conviene-mas-cargar-gas-lp-por-litros-o-por-pesos-esto-dice-profeco/); [El Siglo de Torreón, 2016](https://www.elsiglodetorreon.com.mx/noticia/2016/profeco-refuerza-verificacion-en-gaseras.html). Por defecto usaría 85 %, por ser el valor de la NOM para el tanque doméstico; 80 % es el dato prudente de seguridad.
- Factor de corrección al cambiar de temperatura, ρ(T)/ρ(15.56 °C), cálculo propio con NIST:

| °C | Propano | Mezcla 60/40 |
|---|---|---|
| 0 | 1.0432 | 1.0372 |
| 10 | 1.0159 | 1.0136 |
| 20 | 0.9869 | 0.9889 |
| 30 | 0.9560 | 0.9627 |
| 40 | 0.9226 | 0.9349 |
| 50 | 0.8859 | 0.9047 |

### Inferences
- Vender por litro sin compensar transfiere el riesgo de temperatura al comprador. 100 L de 60/40 a 30 °C son 51.7 kg, no los 54 kg de la convención (-4.2 %); de 80/20 a 30 °C son 50.1 kg (-7.2 %). Eso es 4 a 7 veces la tolerancia de ±1 % del medidor.
- El límite de 85 % tiene base física: propano al 85 % a 15.56 °C llega a 95.9 % de volumen a 50 °C; al 90 % llegaría a 101.6 %, es decir, tanque lleno de líquido. Con 60/40 las cifras son 93.9 % y 99.5 %.
- Con doce meses de plazo desde el 28 de diciembre de 2025, la sustitución de sistemas vence alrededor del 28 de diciembre de 2026. Cálculo propio, sin aviso oficial leído.
- Para la calculadora bastan: temperatura por defecto 15.56 °C, control opcional de temperatura y la tabla de arriba. No hace falta implementar API 11.2.4 para uso público.

### Gaps
- No pude leer las fórmulas del Apéndice B de la NOM-259 (son imágenes en la versión consultada). Tampoco la temperatura base oficial de venta, que en el texto legible no se fija.
- No confirmé en fuente si ASTM D1250 excluye expresamente al LPG. Solo consta que la NOM-259 cita API MPMS 11.2.4 y que ese estándar sí está hecho para LPG. Por eso recomiendo no citar D1250 para Gas LP.
- El Anexo 30 consultado es el de la RMF 2024; no revisé la edición 2026 ni sus tablas de incertidumbre.

## Presentaciones y consumos

### Takeaway
Los cilindros se venden en kg y su capacidad la fija la NOM-213-SCFI-2018 en litros de agua. Los tanques se nombran en litros de agua y cargan 85 % de eso en gas. No hallé un consumo doméstico oficial en kg/mes; el orden de magnitud estimado es de 10 a 30 kg/mes.

### Cited Findings
- [NOM-213-SCFI-2018, 5.2 y Tabla 3](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-213-SCFI-2018.pdf), que cancela a la NOM-008-SESH/SCFI-2010. Regla general: capacidad = kg × 2.4, con relación de llenado de 42 % máximo. Las columnas de gas son cálculo propio a 0.54 kg/L. La tolerancia de contenido es de [NOM-002-SCFI-2011](https://dof.gob.mx/normasOficiales/4828/seeco/seeco.htm).

| Cilindro, kg | Litros de agua | Tara, kg (±3 %) | Peso bruto, kg | L de gas a 0.54 | % de volumen ocupado | Energía CONUEE, MJ | Tolerancia de contenido |
|---|---|---|---|---|---|---|---|
| 10 | 23 a 24 | 12.3 | 22.3 | 18.5 | 77 a 81 | 484 | 150 g |
| 20 | 45 a 48 | 19.4 | 39.4 | 37.0 | 77 a 82 | 967 | 200 g |
| 30 | 68 a 73 | 26.6 | 56.6 | 55.6 | 76 a 82 | 1,451 | 300 g |
| 45 | 102 a 108 | 33.8 | 78.8 | 83.3 | 77 a 82 | 2,177 | 450 g |

- Un recipiente portátil debe tener peso bruto de hasta 25 kg, y por eso solo el de 10 kg entra en esa clase de tamaño común — [NOM-213, 5.3](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-213-SCFI-2018.pdf). El Reglamento de la LSH distingue recipiente portátil y recipiente transportable sujeto a presión: `RLSH_chunks.json`, id `RLSH-Art-003`, fracciones XXXVII y XXXIX.
- Clases de tanques: Tipo B1 de 100 a 1,000 L de agua; Tipo B2 de más de 1,000 a 5,000 L; Tipo A de más de 5,000 a 455,000 L; Tipo C para motores, hasta 300 L; Tipo D para autotanques, remolques y semirremolques, hasta 55,000 L — [NOM-009-SESH-2011](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/009sesh2011.pdf).
- En vehículos, el total no debe rebasar 450 L a 100 % de capacidad de agua; hay límites de 220 L por tanque en chasis y 150 L dentro del habitáculo — [NOM-005-SESH-2010](https://dof.gob.mx/normasOficiales/4219/sener2a/sener2a.htm).
- Carga real, cálculo propio a 0.54 kg/L sobre tamaños de ejemplo:

| Tanque, L de agua | Gas al 80 % | Gas al 85 % (por defecto) | Gas al 90 % |
|---|---|---|---|
| 120 | 96 L; 51.8 kg | 102 L; 55.1 kg | 108 L; 58.3 kg |
| 180 | 144 L; 77.8 kg | 153 L; 82.6 kg | 162 L; 87.5 kg |
| 300 | 240 L; 129.6 kg | 255 L; 137.7 kg | 270 L; 145.8 kg |
| 500 | 400 L; 216.0 kg | 425 L; 229.5 kg | 450 L; 243.0 kg |
| 1,000 | 800 L; 432.0 kg | 850 L; 459.0 kg | 900 L; 486.0 kg |
| 5,000 | 4,000 L; 2,160 kg | 4,250 L; 2,295 kg | 4,500 L; 2,430 kg |
| 55,000 (autotanque máximo) | 44,000 L; 23.8 t | 46,750 L; 25.2 t | 49,500 L; 26.7 t |

- Consumos típicos de aparatos en baja presión a nivel del mar (propano): quemador de estufa 1,609.88 kcal/h (0.0719 m³/h, 1.87 kW); calentador de almacenamiento de hasta 100 L, 6,211.15 kcal/h (0.2774 m³/h, 7.2 kW); calentador de paso sencillo 24,849.08 kcal/h (1.1098 m³/h, 28.9 kW) — [NOM-004-SEDG-2004, Tabla 2](https://www.gob.mx/cms/uploads/attachment/file/138730/NOM-004-SEDG-2004.pdf). La tabla se extrajo desordenada del PDF; reacomodé los valores comprobando que kcal/h ÷ 22,390.6 dé los m³/h de cada renglón. Los kW son cálculo propio.
- Carburación: un taxista de CDMX reporta 8 km/L aproximados y 23 L por 170 a 180 km, a 10.56 $/L — [Expansión, 30-jul-2026](https://expansion.mx/empresas/2026/07/30/conviene-convertir-auto-a-gas-lp). Renault compara 6 L/100 km en gasolina con 7 L/100 km en GLP — [Renault España](https://www.renault.es/preguntas-frecuentes/glp-otras-motorizaciones/se-consume-mas-con-glp.html).
- Hogares: 80 % cocinaba con Gas LP según Encevi 2018 — [Energía a Debate](https://energiaadebate.com/cae-consumo-de-gas-lp-y-gas-natural-en-mexico). El Gas LP aporta 35 % de la energía residencial, unos 280 PJ, según un estudio con Encevi 2018 — [CONAHCYT](https://conahcyt.mx/wp-content/uploads/pronaces/micrositios/energia_y_cambio_climatico/energia/cuadernos_tematicos/Cuaderno_Tematico_I_Pronaces_ECC_ISBN_final.pdf). Una nota de 2018 da 1.9 L por hogar al día, dicho en la rueda de prensa de dos empresas privadas — [Energía a Debate](https://energiaadebate.com/?p=4282).

### Inferences
- Rango estimado de consumo doméstico, con supuesto de 28 millones de hogares usuarios (supuesto mío, no verificado): 11 a 15 kg/mes con 121 a 164 mbd residenciales; 18 kg/mes con 280 PJ y 46.07 MJ/kg; 31 kg/mes con 1.9 L/día. Un cilindro de 20 kg duraría entre 3 y 8 semanas. Marcar como TÍPICO, baja confianza.
- Carburación: la física da 1.24 a 1.35 L de Gas LP por cada L de gasolina a igual eficiencia (Semarnat 32.22/25.94; CONUEE 35.30/26.12). Un auto de 8 L/100 km en gasolina daría 9.9 a 10.8 L/100 km. El taxi de la nota, a 12.5 a 13 L/100 km, queda arriba, razonable para tráfico urbano y vehículo grande.

### Gaps
- Consumo doméstico en kg/mes: sin fuente oficial verificada. Tablas de Encevi no consultadas directamente.
- L/100 km de carburación: sin fuente oficial mexicana. No hallé dato de CONUEE ni Sedema.
- No verifiqué los tamaños comerciales de tanques; los de la tabla son ejemplos de cálculo.

## Mercado: barriles, demanda y precios máximos

### Takeaway
La CNE publica el precio máximo cada sábado en PDF, con archivo desde 2021 y sin formato abierto a la vista. Desde enero de 2026 ya no cubre bodegas ni estaciones de servicio, solo distribución. La demanda nacional es del orden de 260 a 300 mbd; las cifras de Pemex (unos 144 mbd) no son la demanda nacional.

### Cited Findings
- La página de la CNE lista PDFs semanales con vigencia indicada, desde 2021 hasta el 8-14 de noviembre de 2026; no ofrece CSV ni Excel — [CNE](https://www.gob.mx/cne/articulos/precios-maximos-de-gas-lp-399035).
- La regla de publicación está en el A/023/2022: 220 regiones (los mercados relevantes del dictamen de COFECE), publicación electrónica cada sábado y vigencia desde el domingo siguiente — [DOF 28-jul-2022](https://dof.gob.mx/nota_detalle.php?codigo=5659533&fecha=28%2F07%2F2022). El anterior A/024/2021 usaba 145 regiones — [DOF 29-jul-2021](https://dof.gob.mx/nota_detalle.php?codigo=5625307&amp=&fecha=29%2F07%2F2021).
- Profeco confirma las 220 regiones de la CNE — [Quién es Quién](https://combustibles.profeco.gob.mx/qqpgas/2026/QQPGASLP_081026.pdf); una nota de prensa de 2026 todavía dice 145 — [UnoTV](https://www.unotv.com/negocios/subio-o-bajo-estos-son-los-precios-del-gas-lp-del-25-al-31-de-octubre-de-2026/). Usar 220: es lo que muestra el PDF de la CNE.
- El 20 de enero de 2026, por sentencias de amparo, la CNE dejó insubsistente la parte del A/023/2022 sobre comercialización y expendio en bodegas, estaciones con fin específico y estaciones multimodales — [DOF 5778484, reproducción](https://sdv.com.mx/dof/5778484/). Sigue regulada la distribución — [Milenio](https://www.milenio.com/negocios/cne-elimina-regulacion-de-precio-maximo-en-gas-lp). Otro medio lo presentó como liberación general de precios — [Expansión](https://expansion.mx/empresas/2026/01/20/adios-al-tope-liberan-precios-de-gas-lp-de-tope-maximo). Daría por bueno lo primero: lo dice el acuerdo y la CNE sigue publicando tablas semanales.
- Base legal en el acervo local: a la CNE le corresponde regular y supervisar la distribución, comercialización y expendio de petrolíferos, opinar sobre la expansión de la distribución de Gas LP y recopilar información de precios, descuentos y volúmenes (`LSH_chunks.json`, id `LSH-Art-116`, fracciones I b), II y V). Los permisionarios deben respetar los precios o tarifas máximas que se establezcan (`LSH-Art-119`, fracción XI). El artículo sobre contraprestaciones, precios y tarifas exceptúa a la distribución y al expendio de Gas LP de un criterio sobre impuestos (`LSH-Art-117`).
- Pemex en 2025: ventas 143.7 mbd e importaciones 84.6 mbd, 58.9 % de lo vendido, con datos SIE de SENER — [Dinero en Imagen](https://www.dineroenimagen.com/economia/mexico-depende-exterior-casi-60-del-gas-lp-de-pemex-es-importado). Febrero de 2025: producción 90.1, importación 91.1 y ventas 153.2 mbd — [Energy Magazine](https://energymagazine.mx/2025/04/pemex-produce-e-importa-casi-el-mismo-volumen-de-gas-lp-en-febrero/).
- Prospectiva del Gas LP 2023-2037 de SENER: la demanda total baja 3.7 %; la residencial llega a 166.4 mbd en 2037, 64.1 % del total. Otros sectores: servicios 15.8 %, industria 14.1 %, autotransporte 7.2 %, agropecuario 1.4 % — [Energía a Debate](https://energiaadebate.com/aun-con-un-descenso-en-la-demanda-la-sener-preve-aumento-de-la-oferta-de-gas-lp). Esos porcentajes suman 102.6 %, posible error de la nota o de redondeo.
- Consumo residencial de 164 mbd en 2021 y 121 mbd en 2022, según SENER — [Energía a Debate](https://energiaadebate.com/cae-consumo-de-gas-lp-y-gas-natural-en-mexico). En 2016, demanda de unos 300 mbd — [El Financiero](https://www.elfinanciero.com.mx/economia/empresarios-de-gas-lp-no-transfirieron-la-baja-en-los-precios-sener/).

### Inferences
- Demanda implícita: 166.4 ÷ 0.641 = 260 mbd en 2037 y unos 270 mbd en 2023 (al sumar 3.7 %). Orden de magnitud a 270 mbd: 42.9 millones de L/día; 23.2 kt/día; 8.46 Mt/año; 409 PJ/año con CONUEE. Estimación derivada de una nota de prensa, no serie oficial.
- La serie residencial de 2021-2022 (121 a 164) y la proyección de 2037 (166) no empalman del todo; probablemente usan bases distintas. No las mezclaría en una misma gráfica.
- Para el catálogo: el PDF de la CNE se puede leer por máquina con extracción de tablas (se extrajeron las 2,470 filas). Conviene guardar semana, región, entidad, municipio, $/kg y $/L, y mostrar la fecha de vigencia.

### Gaps
- Sin serie oficial 2024-2026 de demanda nacional: no consulté el SIE directamente ni hallé reporte de mercado de la CNE. Falta la parte de importadores privados.
- No confirmé si el precio máximo publicado distingue modalidad: la página habla de región y modalidad, pero la tabla del 8-14 de noviembre solo trae $/kg y $/L.
- No hallé un archivo abierto oficial (CSV o datos abiertos) para esta serie.
- El texto del acuerdo de enero de 2026 se leyó en una reproducción (sdv.com.mx), no en dof.gob.mx.

## Presión, regulación y altitud

### Takeaway
Las NOM mexicanas fijan cerca de 2.74 kPa (11 in H₂O) para aparatos domésticos de Gas LP. En Ciudad de México la presión atmosférica cae alrededor de 23 %, y un quemador sin ajustar pierde cerca de 12 % de potencia; no hallé un factor oficial mexicano por altitud.

### Cited Findings
- Presión de vapor manométrica a nivel del mar. Base: [NIST propano](https://webbook.nist.gov/cgi/fluid.cgi?TLow=253.15&THigh=323.15&TInc=10&Digits=5&ID=C74986&Action=Load&Type=SatP&TUnit=K&PUnit=kPa&DUnit=kg%2Fm3&HUnit=kJ%2Fkg&WUnit=m%2Fs&VisUnit=uPa*s&STUnit=N%2Fm&RefState=DEF), [NIST n-butano](https://webbook.nist.gov/cgi/fluid.cgi?TLow=253.15&THigh=323.15&TInc=10&Digits=5&ID=C106978&Action=Load&Type=SatP&TUnit=K&PUnit=kPa&DUnit=kg%2Fm3&HUnit=kJ%2Fkg&WUnit=m%2Fs&VisUnit=uPa*s&STUnit=N%2Fm&RefState=DEF), restando 101.325 kPa. La mezcla 60/40 es cálculo propio con ley de Raoult. Los renglones 15.56 °C y 37.8 °C son punto exacto de NIST e interpolación propia, respectivamente. Para pasar a bar, dividir kPa entre 100. Todo es TÍPICO.

| °C | Propano kPa | kgf/cm² | psi | 60/40 kPa | kgf/cm² | psi | n-butano kPa |
|---|---|---|---|---|---|---|---|
| -20 | 143 | 1.46 | 21 | 71 | 0.72 | 10 | -56 (vacío) |
| -10 | 244 | 2.49 | 35 | 144 | 1.47 | 21 | -32 (vacío) |
| 0 | 373 | 3.80 | 54 | 238 | 2.42 | 34 | 2 |
| 10 | 535 | 5.46 | 78 | 356 | 3.63 | 52 | 47 |
| 15.56 | 641 | 6.54 | 93 | 434 | 4.43 | 63 | 78 |
| 20 | 735 | 7.49 | 107 | 503 | 5.13 | 73 | 106 |
| 30 | 978 | 9.97 | 142 | 682 | 6.95 | 99 | 182 |
| 37.8 | 1204 | 12.28 | 175 | 849 | 8.66 | 123 | 256 |
| 40 | 1268 | 12.93 | 184 | 896 | 9.14 | 130 | 277 |
| 50 | 1612 | 16.44 | 234 | 1150 | 11.73 | 167 | 394 |

- Regímenes y límites: baja presión regulada de 2.737 kPa sin medidor y 2.86 kPa con medidor; más de 2.86 kPa es alta presión regulada; 3.236 kPa máximo a cero caudal; 2.24 kPa mínimo en la esprea — [NOM-004-SEDG-2004, 3.19, 3.20, 6.4.1.1 y 6.5.1.1](https://www.gob.mx/cms/uploads/attachment/file/138730/NOM-004-SEDG-2004.pdf).
- Regulador: 2.75 kPa ± 0.29 kPa (28.04 gf/cm²), en un rango de servicio de 2.48 a 3.04 kPa; relevo entre 5.49 y 8.23 kPa — [NOM-015-SESH-2013](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/015sesh2013.pdf).
- Gas de prueba de calefactores: Gas LP 1.99, 2.74 y 3.23 kPa (reducida, normal, aumentada) — [NOM-012-SESH-2010, Tabla 2](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/012sesh2010.pdf). Calentadores de agua: 2.74 kPa ± 2 % — [NOM-003-ENER-2021, Tabla 3](https://dof.gob.mx/normasOficiales/8724/sener11_C/sener11_C.html).
- Recipientes: los transportables se diseñan a presión de servicio no menor de 1.65 MPa (16.90 kgf/cm²) — [NOM-213-SCFI-2018, 5.1](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-213-SCFI-2018.pdf); carburación, 2.05 MPa (21 kgf/cm²) — [NOM-005-SESH-2010](https://dof.gob.mx/normasOficiales/4219/sener2a/sener2a.htm).
- Altitud en las NOM: los consumos típicos se toman al nivel del mar aunque el quemador esté más alto, y su cálculo supone 101.325 kPa — [NOM-004-SEDG-2004, 6.2.2.1.3 y notas de Tabla 2](https://www.gob.mx/cms/uploads/attachment/file/138730/NOM-004-SEDG-2004.pdf). La NOM de calentadores corrige el volumen de gas medido con la presión barométrica del lugar, sin factor de altitud — [NOM-003-ENER-2021](https://dof.gob.mx/normasOficiales/8724/sener11_C/sener11_C.html).
- Referencia externa, no mexicana: muchos hornos de EE. UU. se reducen 4 % por cada 1,000 pies por encima de 2,000 pies, por menor oxígeno; algunos modelos, 2 %; uno llega a 7,000 pies sin cambios — [ACHR News](https://achrnews.com/articles/136057-furnaces-must-be-modified-for-high-altitude-applications).

### Inferences
- Presión atmosférica a 2,240 m: 77.2 kPa por atmósfera estándar (cálculo propio); 78 kPa es el dato de partida del encargo y es consistente. Usaría 78 kPa con la etiqueta TÍPICO.
- Con orificio fijo y misma presión manométrica, el gasto de masa cambia con la raíz de la presión atmosférica: √(78/101.325) = 0.877. Son 12 % menos de potencia, y el volumen de gas por orificio sube 14 %. El oxígeno por m³ de aire baja 23 %.
- La regla de EE. UU. daría 21 % a 7,349 pies. No son números rivales: 12 % es lo que pasa solo, 21 % es lo que se pide para cuidar la combustión. Citaría solo el 12 % como efecto físico y diría que el ajuste lo define el fabricante.
- Un manómetro en CDMX marca unos 23 kPa (0.24 kgf/cm²) más que al nivel del mar para el mismo estado del tanque, porque mide contra la atmósfera.
- Si hay medidor en m³, un m³ de vapor en CDMX contiene 23 % menos gas que a nivel del mar: 0.613 m³/kg contra 0.470 m³/kg para 60/40.
- El n-butano puro casi no da presión a 0 °C (2 kPa). Esto explica por qué el propano es indispensable en frío.

### Gaps
- No encontré un factor o tabla oficial mexicana de corrección por altitud para quemadores de Gas LP. No revisé la NOM de estufas (NOM-010-SESH-2010), ni una fuente oficial del valor de 78 kPa.
- La NOM-011-SEDG-1999 fija 1.65 MPa a 323 K para el diseño del recipiente — [DOF](https://dof.gob.mx/nota_detalle_popup.php?codigo=2051734); no confirmé si sigue vigente frente a la NOM-213.

## Comparación entre combustibles y sustitución Gas LP ↔ gas natural

### Takeaway
La fórmula es precio ÷ (poder calorífico × eficiencia). Compara dentro de una sola lista oficial: CONUEE 2025 y Semarnat 2015 discrepan hasta 9.6 % en gasolina. El Wobbe del Gas LP es cerca de 1.5 veces el del gas natural; al cambiar se ajustan esprea y regulador.

### Cited Findings
- Poderes caloríficos netos, [CONUEE 2025](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf) contra [Semarnat 2015](https://www.gob.mx/cms/uploads/attachment/file/235891/FACTORES_DE_EMISION_2015.pdf). MJ/L de CONUEE por cálculo propio:

| Combustible | CONUEE 2025 | Semarnat 2015 | Diferencia | Tipo |
|---|---|---|---|---|
| Gas LP | 4,152.89 MJ/bl; 26.12 MJ/L | 4,124 MJ/bl; 25.94 MJ/L | +0.7 % | TÍPICO |
| Gasolinas y naftas | 5,613 MJ/bl; 35.30 MJ/L | 5,122 MJ/bl; 32.22 MJ/L | +9.6 % | TÍPICO |
| Diésel | 6,065 MJ/bl; 38.15 MJ/L | 5,715 MJ/bl; 35.95 MJ/L | +6.1 % | TÍPICO |
| Gas seco (20 °C y 100 kPa) | 33,543.27 kJ/m³ | 38,563 kJ/m³ (como gas natural) | -13 % | TÍPICO |
| Electricidad | 3,600 MJ/MWh | n.a. | n.a. | EXACTO |

- Eficiencia térmica mínima de calentadores de agua a gas: almacenamiento 74 a 78 % según volumen; rápida recuperación 82 %; instantáneo 85 % — [NOM-003-ENER-2021, Tabla 1](https://dof.gob.mx/normasOficiales/8724/sener11_C/sener11_C.html). Los mismos gases de prueba: natural 1.76 kPa, Gas LP 2.74 kPa.
- Índice Wobbe del gas natural: 48.20 a 53.20 MJ/m³ en el resto del país desde 2013 y 45.20 a 53.20 MJ/m³ en la zona sur; PCS mínimo 37.30 y 35.30 MJ/m³. Condiciones 101.325 kPa y 288.15 K — [NOM-001-SECRE-2010](https://dof.gob.mx/normasOficiales/3997/sener/sener.htm).
- Calor de referencia en una misma norma: gas natural 37.3 MJ/m³ y Gas LP 93.1 MJ/m³. Presión normal de prueba: natural 1.74 kPa, Gas LP 2.74 kPa — [NOM-012-SESH-2010](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/012sesh2010.pdf). Las dos NOM difieren para gas natural (1.74 y 1.76 kPa); usaría 1.76 por ser la más reciente y son prácticamente iguales.
- La reconversión de instalaciones de Gas LP a gas natural está en el capítulo 12 de la NOM-002-SECRE-2010: adecuar tuberías y accesorios, prueba de hermeticidad, puesta en servicio y dictamen. No habla de espreas — [NOM-002-SECRE-2010](https://faolex.fao.org/docs/pdf/mex100678.pdf).

### Inferences
- Wobbe del propano con datos de NOM-004: 93.74 ÷ √1.52 = 76.0 MJ/m³. Con NOM-012: 75.5 MJ/m³. Mezcla 60/40 física: unos 80.7 MJ/m³. Razón contra gas natural (48.20 a 53.20): 1.43 a 1.58, cerca de 1.5 en el centro.
- Para igual potencia, la esprea de gas natural necesita área 1.87 veces mayor: A_gn/A_LP = (W_LP/W_gn) × √(Δp_LP/Δp_gn) = 1.50 × √(2.74/1.76). Eso es diámetro 1.37 veces mayor. Se ajustan esprea, regulador (2.74 a 1.76 kPa) y aire primario. Cálculo y conclusión propios.
- Volumen equivalente: 1 L de Gas LP líquido (26.12 MJ/L) equivale a 0.78 m³ de gas seco (33.54 MJ/m³) con CONUEE. 1 m³ de vapor de Gas LP equivale a unos 2.5 m³ de gas natural con NOM-012.
- Los valores de líquidos en CONUEE 2025 lucen más cercanos a poder calorífico superior que a neto: gasolina a 35.30 MJ/L contra 32.22 en Semarnat. Si se compara Gas LP contra gasolina, la lista cambia el resultado: 1.35 L de Gas LP por L de gasolina con CONUEE y 1.24 con Semarnat. Por defecto usaría CONUEE para todos por ser la vigente y por ser la que remite el Acuerdo de emisiones, y declararía esta diferencia.

### Gaps
- Eficiencia de estufas y de aparatos eléctricos: sin fuente verificada. El dato de 32 % para estufa de gas no se confirmó en la búsqueda. Dejar la eficiencia como dato editable.
- El ajuste de aparato al cambiar de gas no está en las NOM que leí; las conclusiones sobre esprea son física, no norma.
- Precios de gas natural y electricidad no se investigaron aquí: en los ejemplos son ilustrativos.

## Emisiones

### Takeaway
El factor oficial sigue siendo 63.1 tCO₂/TJ, del Acuerdo publicado en el DOF el 3 de septiembre de 2015. Por litro o kg no hay un solo valor oficial: usaría 1.648 kgCO₂/L con la energía de CONUEE, y mostraría 2.985 tCO₂/t como dato alternativo oficial.

### Cited Findings
- Transporte vehicular: CO₂ 6.31E-05 t/MJ, CH₄ 6.2E-05 kg/MJ, N₂O 2.0E-07 kg/MJ. Combustión fija ("Gas licuado"): CO₂ 6.31E-05 t/MJ, CH₄ 1.0E-06 kg/MJ, N₂O 1.0E-07 kg/MJ. Hierro y acero ("GLP"): 2.985 tCO₂/t — [Acuerdo DOF 2015](https://dof.gob.mx/nota_detalle.php?codigo=5406149&fecha=03%2F09%2F2015).
- El Acuerdo no da poder calorífico: remite a medición directa o a lo que determine CONUEE. Permite los potenciales de calentamiento del Quinto Informe del IPCC mientras la Secretaría no los fije, y no tiene fecha de caducidad — [Acuerdo DOF 2015](https://dof.gob.mx/nota_detalle.php?codigo=5406149&fecha=03%2F09%2F2015).
- Hoja de Semarnat: 63,100 kgCO₂/TJ, 25.94 MJ/L, 0.001636762 tCO₂/L, 1.636762 tCO₂/m³; su fuente es IPCC 2006 — [Semarnat 2015](https://www.gob.mx/cms/uploads/attachment/file/235891/FACTORES_DE_EMISION_2015.pdf).

### Inferences
- CO₂e, con PCG de 28 para CH₄ y 265 para N₂O (valores del Quinto Informe, no citados en el Acuerdo): combustión fija 63.15 kgCO₂e/GJ; vehicular 64.89 kgCO₂e/GJ. Cálculo propio.
- Revisión física: la estequiometría da 2.99 kgCO₂/kg de propano, 3.03 de butano y 3.01 para 60/40. Los valores 2.985 y 3.052 quedan a ±1.4 % de eso.
- 2.985 ÷ 63.1 = 47.3 MJ/kg, el PCI que está detrás del factor por tonelada. Por eso no se debe combinar 63.1 con 46.07 MJ/kg: daría 2.91 kgCO₂/kg, por debajo del carbono que realmente trae el gas.

### Gaps
- No encontré una modificación posterior del Acuerdo de 2015 ni un factor específico para RENE vigente en 2026, pero tampoco pude descartarla: la búsqueda fue limitada.

## Fórmulas con ejemplos resueltos

### Takeaway
Todas salen de tres números base y dos entradas opcionales (temperatura y llenado). Los ejemplos usan el precio máximo de Ciudad de México del 8-14 de noviembre de 2026: 20.80 $/kg y 11.23 $/L — [CNE](https://www.gob.mx/cms/uploads/attachment/file/1115181/PRECIOS_MAXIMOS_VIGENTES_DEL_8_al_14_de_noviembre_DE_2026.pdf).

### Cited Findings
Los insumos están citados arriba. Lo siguiente es aritmética propia.

1. **kg a litros.** L = kg ÷ 0.54. Cilindro de 20 kg: 37.04 L.
2. **$/kg a $/L.** $/L = $/kg × 0.54. 20.80 × 0.54 = 11.232, publicado 11.23.
3. **Costo de carga.** Cilindro de 20 kg: 20 × 20.80 = $416.00. Tanque, 100 L: 100 × 11.23 = $1,123.00.
4. **Litros que caben.** L_gas = L_agua × llenado. Tanque de 300 L al 85 %: 255 L = 137.7 kg.
5. **Rellenar desde el indicador.** Del 30 % al 85 % en 300 L: 0.55 × 300 = 165 L; 165 × 11.23 = $1,852.95; 89.1 kg.
6. **Energía.** MJ = L × 26.12. Cilindro de 20 kg: 37.04 × 26.12 = 967 MJ = 269 kWh. Físico: 20 × 46.07 = 921 MJ = 256 kWh.
7. **Vapor.** m³ = kg × v. 20 kg de 60/40: 20 × 0.470 = 9.4 m³ a nivel del mar; 20 × 0.613 = 12.3 m³ a 78 kPa.
8. **Corrección de temperatura.** V₁₅.₅₆ = V_T × VCF(T); masa = V₁₅.₅₆ × ρ₁₅.₅₆. Comprar 100 L a 30 °C de 60/40: 100 × 0.9627 = 96.27 L a 15.56 °C; 96.27 × 0.5375 = 51.7 kg. A 0 °C: 103.72 L; 55.7 kg.
9. **Precio real por kg.** $/kg_real = ($/L) ÷ ρ(T). 11.23 ÷ 0.5174 = 21.70 $/kg, contra 20.80 nominal (+4.4 %).
10. **Error del medidor.** ±1 % en 100 L = ±1 L = ±0.54 kg = ±$11.23.
11. **Energía útil y costo por GJ.** C = P ÷ (PC × η). Gas LP en calor bruto: 11.23 ÷ 26.12 MJ/L = 430 $/GJ; físico 20.80 ÷ 46.07 MJ/kg = 451 $/GJ. Con η = 0.85: 506 y 531 $/GJ útil. Electricidad, a 1.20 $/kWh ilustrativo: 333 $/GJ; con η = 0.95 (supuesto), 351 $/GJ útil; con bomba de calor de COP 3 (supuesto), 111 $/GJ útil.
12. **Agua caliente.** Q = L × 4.186 × ΔT. 150 L de 15 a 40 °C: 15.7 MJ. Con η = 0.85 (mínimo instantáneo de la NOM): 18.47 MJ; 0.707 L; $7.94. Con PCI físico: 0.401 kg; $8.34.
13. **Barriles.** t/día = mbd × 85.85 (mbd son miles de barriles al día). 270 mbd: 23,180 t/día = 23.2 kt/día; 8.46 Mt/año; TJ/día = mbd × 4.153 = 1,121 TJ/día; 409 PJ/año con CONUEE.
14. **Emisiones.** kgCO₂ = L × 26.12 × 0.0631. Cilindro de 20 kg: 37.04 × 1.648 = 61.0 kgCO₂. Con el factor por tonelada: 20 × 2.985 = 59.7 kgCO₂.
15. **Sustituir gas natural.** W = PCS ÷ √d. Gas LP 76 MJ/m³ contra gas natural 50.7 MJ/m³: 1.50. A_gn/A_LP = 1.50 × √(2.74/1.76) = 1.87; diámetro × 1.37.
16. **Potencia en altitud.** P_h/P_0 = √(P_atm/101.325). A 78 kPa: 0.877.
17. **Rendimiento vehicular.** L_LP/100 km = L_gasolina/100 km × (PC_gasolina ÷ PC_LP). 8 × 1.24 = 9.9; 8 × 1.35 = 10.8.

### Inferences
- Se sugiere un modo simple (0.54, 26.12, sin temperatura) y un modo experto (mezcla y temperatura). Ambos deben decir qué factor usan.
- Los ejemplos 11 y 12 dependen del precio de esa semana: deben tomar la tabla vigente, no los números de esta nota.

### Gaps
- La tarifa de electricidad y las eficiencias marcadas como supuesto no están verificadas.

## Trampas

### Takeaway
Las confusiones más caras para el usuario son litros de agua contra litros de gas, kg contra L y m³ líquido contra m³ de vapor. Las más caras para el catálogo son la cadena 0.54 × 26.12 y citar normas que no aplican.

### Cited Findings
1. **Litros de agua no son litros de gas.** Un tanque "de 300 litros" es su volumen interior; carga 255 L al 85 % — [NOM-009-SESH-2011](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/009sesh2011.pdf).
2. **Un cilindro de 20 kg no se llena "a 20".** Son 37 L de gas en 45 a 48 L de agua, con 19.4 kg de tara y 39.4 kg de peso bruto — [NOM-213-SCFI-2018](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-213-SCFI-2018.pdf).
3. **El 42 % de llenado de cilindros es por masa, no por volumen.** Es la relación kg de gas por litro de agua, no un nivel de líquido; al 0.54 kg/L el líquido ocupa cerca de 77 a 82 % — [NOM-213-SCFI-2018, 5.2.5](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-213-SCFI-2018.pdf).
4. **El 0.6 kg/L de la NOM-004 no es densidad de venta.** Es una carga de diseño para patas y bases del tanque — [NOM-004-SEDG-2004, 6.1.3.7.11 y 6.1.3.8.2](https://www.gob.mx/cms/uploads/attachment/file/138730/NOM-004-SEDG-2004.pdf).
5. **Precio máximo no es igual en todas partes ni para todos.** Son 220 regiones y, desde enero de 2026, no aplica a bodegas ni a estaciones de carburación — [DOF 5778484, reproducción](https://sdv.com.mx/dof/5778484/).
6. **Normas equivocadas.** Para medir Gas LP aplica [NOM-259-SE-2022](https://platiica.economia.gob.mx/normalizacion/nom-259-se-2022/), no [NOM-005-SCFI-2017](https://platiica.economia.gob.mx/normalizacion/nom-005-scfi-2017/) ni [NOM-185-SCFI-2017](https://platiica.economia.gob.mx/normalizacion/nom-185-scfi-2017/). La NOM-008-SESH/SCFI-2010 fue [cancelada por NOM-213](https://platiica.economia.gob.mx/normalizacion/wp-content/uploads/sites/2/PDF_Normas_Publicas/NOM-213-SCFI-2018.pdf).
7. **Temperaturas de referencia mezcladas.** 15.6 °C en [NOM-016](https://platiica.economia.gob.mx/wp-content/uploads/sites/2/PDF_Normas_Publicas/016cre2016.pdf), 20 °C en [Anexo 30](https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2024/rmf/anexos/Anexo_30_RMF2024-22012024.pdf), 20 °C y 100 kPa en la [lista de CONUEE para gases](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf), 15 °C y base de 20 °C con 98.07 kPa en [NOM-001-SECRE](https://dof.gob.mx/normasOficiales/3997/sener/sener.htm). Un m³ en condiciones base equivale a 0.95137 m³ estándar en esa norma.
8. **Marcos heredados con sucesor incierto.** La [NOM-EM-007-ASEA-2025](https://platiica.economia.gob.mx/normalizacion/nom-em-007-asea-2025/) canceló a la NOM-007-SESH-2010 y aparece como cancelada pese a una prórroga de seis meses de abril de 2026. La [NOM-EM-008-ASEA-2026](https://mley.mx/normas/nom-em-008-asea-2026/), publicada el 2 de octubre de 2026, regula el transporte por autotanque y semirremolque.
9. **"mbd" de Pemex no es demanda nacional.** 143.7 mbd son [ventas de Pemex](https://www.dineroenimagen.com/economia/mexico-depende-exterior-casi-60-del-gas-lp-de-pemex-es-importado). Y un barril de Gas LP no es un barril de crudo: vale [0.6461 bep](https://www.gob.mx/cms/uploads/attachment/file/978053/lista_de_combustibles_2025.pdf).

### Inferences
10. **La cadena oficial da más calor del que existe.** 26.12 ÷ 0.54 = 48.4 MJ/kg, por encima del PCI de propano (46.3) y por debajo de su PCS (50.3). Una explicación posible es que el dato de SENER corresponda a una mezcla más densa (26.12 ÷ 46.07 = 0.567 kg/L) o a otra base. Es hipótesis no verificada.
11. **0.54 sobreestima en clima cálido y con más propano.** A 30 °C los litros de 80/20 pesan 7 % menos de lo nominal.
12. **"Metro cúbico de Gas LP" es ambiguo.** Un m³ líquido tiene 26.1 GJ; un m³ de vapor, cerca de 0.09 GJ. Son más de 250 veces. Siempre pedir estado.
13. **1:270 no es regla general.** Es 1:252 para 60/40 al nivel del mar y 1:330 en CDMX.
14. **PCS y PCI se mezclan sin aviso.** Las normas de aparatos usan PCS (93.1 MJ/m³) y la lista de CONUEE dice neto. Diferencia de cerca de 8 %.
15. **Manómetro en altitud.** Marca 23 kPa más en CDMX para el mismo estado del tanque.
16. **Factor de CO₂ fuera de pareja.** 63.1 con 46.07 MJ/kg da 2.91 kgCO₂/kg, por debajo de la estequiometría.
17. **Cambiar de lista cambia el ganador.** Comparar Gas LP contra gasolina con listas distintas mueve el resultado hasta 9.6 %.
18. **El indicador del tanque marca volumen, no masa.** Con la dilatación, el porcentaje cambia con la temperatura aunque no se haya gastado gas: de 15 a 30 °C sube cerca de 4 %. Restar dos lecturas de días con distinta temperatura no da el consumo real.

### Gaps
- No se midió cuánto gas queda sin aprovechar al fondo del tanque. La NOM-004 define la vaporización natural con líquido a 20 % del volumen, pero no es un límite de uso.
- Vigencia de NOM heredadas de Sedeg y Sener: la ficha de PLATIICA da la [NOM-004-SEDG-2004 como vigente](https://platiica.economia.gob.mx/normalizacion/?p=35275), en vigor desde el 31 de enero de 2005. No revisé la ficha de NOM-009-SESH-2011, NOM-012-SESH-2010, NOM-015-SESH-2013, NOM-005-SESH-2010 ni NOM-011-SEDG-1999: confirmar en el catálogo antes de publicar. Otras NOM de esta familia, como NOM-001-SESH-2014 (plantas) y NOM-003-SEDG-2004 (estaciones de carburación), no se leyeron.
