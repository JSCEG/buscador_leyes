# Productos, periodos y cálculos del mercado eléctrico mexicano (notas para una calculadora pública)

Notas al 8 de noviembre de 2026. Las rutas `public/data/...` son archivos locales de este repositorio; el identificador que sigue a cada ruta (por ejemplo `LSE-Art-019`) es el campo `id` del artículo dentro del JSON. Esos archivos sirven para leer el texto, no prueban que el instrumento esté vigente ni publicado en el acervo de producción (ver sección 0). Siglas: LSE (Ley del Sector Eléctrico), RLSE (su Reglamento), BME (Bases del Mercado Eléctrico), MBP (Mercado para el Balance de Potencia), MECP (Mercado de Energía de Corto Plazo), RNT (Red Nacional de Transmisión), RGD (Redes Generales de Distribución), SAE (Sistema de Almacenamiento de Energía Eléctrica).

## 0. ¿Qué instrumentos siguen vigentes y qué cambió con la reforma de 2025?

### Takeaway
La LSE (DOF 18-mar-2025) abrogó la Ley de la Industria Eléctrica, pero su Transitorio Tercero mantiene en operación las Reglas del Mercado anteriores "hasta en tanto no se expidan nuevas disposiciones". CENACE siguió aplicando en 2026 las Bases de 2015 y el Manual de 2016 para calcular la Potencia, y no encontré publicación de reglas sustitutas a noviembre de 2026. Las tarifas sí tienen instrumento nuevo: el Acuerdo CT/11.SE/8-2025 de la CNE para 2026.

### Cited Findings

**Tabla de vigencia**

| Instrumento | Estado a nov-2026 | Evidencia |
|---|---|---|
| LSE, DOF 18-mar-2025 | Vigente. Abroga la Ley de la Industria Eléctrica | Transitorio Segundo: `public/data/Ley_Sector_Electrico_chunks.json`, `LSE-Trans-02`. No verifiqué si tiene reformas posteriores al texto local |
| RLSE | Vigente. Abroga el Reglamento de la Ley de la Industria Eléctrica | Transitorio Segundo dentro de `RLSE-Art-306`, `public/data/RLSE_chunks.json`. Publicado en octubre de 2025 según [Garrigues](https://www.garrigues.com/sites/default/files/noticias/files/20251016_mexico-reglamento-ley-sector-electrico.pdf). El campo `fecha_publicacion` del JSON local dice 2025-01-01, lo que parece un error de datos (el propio texto trae sellos de impresión "6/10/25") |
| BME, DOF 8-sep-2015 | Siguen aplicando por transitorio. Sin evidencia de sustitución | CENACE recomienda en su página del MBP leer la Base 11 "DOF SENER 08-Sep-15" ([CENACE MBP](https://www.cenace.gob.mx/Paginas/SIM/MercadoBalance.aspx)) y su informe cita el Transitorio Tercero como fundamento ([Informe MBP 2026](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202026%20A%C3%B1o%20de%20Producci%C3%B3n%202025%20(v2026-02-27).pdf)) |
| Manual del MBP, DOF 22-sep-2016 | Aplicado por CENACE en febrero y septiembre de 2026 | Citado por numeral en el [Informe MBP 2026 recálculo](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202026%20A%C3%B1o%20de%20Producci%C3%B3n%202025%20(v2026-09-03)%20Rec%C3%A1lculo.pdf). [Texto del Manual](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20del%20Mercado%20para%20el%20Balance%20de%20Potencia%20%5bDOF%2022-09-16%5d.pdf) |
| Manual de MECP, DOF 17-jun-2016 | Se desconoce si tiene modificaciones. Publicado por CENACE en su carpeta de reglas | [Texto del Manual](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20de%20Mercado%20de%20Energ%C3%ADa%20de%20Corto%20Plazo%20%5bDOF%2017-06-16%5d.pdf) |
| RES/916/2015 (requisito de Potencia) | Usada por CENACE para el MBP 2026 | Notas de las tablas 5 y 6 del [Informe MBP 2026](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202026%20A%C3%B1o%20de%20Producci%C3%B3n%202025%20(v2026-02-27).pdf) |
| Tarifas 2025: Acuerdo A/158/2024 (CRE) | Ya no es el acuerdo de 2026, aunque CFE lo sigue citando | [DOF, A/158/2024](https://dof.gob.mx/nota_detalle_popup.php?codigo=5747760), aplicable del 1-ene al 31-dic-2025; [ficha CFE GDMTH](https://app.cfe.mx/Aplicaciones/CCFE/Tarifas/TarifasCRENegocio/Tarifas/GranDemandaMTH.aspx) lo cita todavía |
| Tarifas 2026: Acuerdo CT/11.SE/8-2025 (CNE) | Vigente del 1-ene al 31-dic-2026 | [DOF, Acuerdo CNE](https://dof.gob.mx/nota_detalle_popup.php?codigo=5783862), publicado el 1-abr-2026 según [SIDOF](https://sidof.segob.gob.mx/notas/5783862) |
| Requisito de CEL 2025 y 2026 | 13.9%. Publicado el 17-ago-2026 | [Cuatrecasas](https://www.cuatrecasas.com/es/spain/publico/art/sener-cels-requisitos-2025-2026), [Mijares](https://www.mijares.mx/en/noticias/publica-sener-requisitos-para-la-adquisicion-de-cel-para-2025-y-2026). No abrí el DOF |

**Texto literal de los transitorios clave**

- LSE Transitorio Tercero: "La operación del Mercado Eléctrico Mayorista debe realizarse conforme a las Reglas del Mercado, las Disposiciones Administrativas de Carácter General que contienen los criterios de eficiencia, Calidad, Confiabilidad, Continuidad, seguridad y sustentabilidad del Sistema Eléctrico Nacional: Código de Red, y demás disposiciones aplicables vigentes al momento de la publicación de esta Ley y hasta en tanto no se expidan nuevas disposiciones." — `public/data/Ley_Sector_Electrico_chunks.json`, `LSE-Trans-03`
- RLSE Transitorio Quinto: "Por única ocasión, la Secretaría debe coordinar la actualización de las Reglas del Mercado para su alineación con los objetivos de la Ley y el presente reglamento [...] Una vez que la Secretaría determine concluida la actualización de las Reglas del Mercado, la CNE y el CENACE, en el ámbito de sus facultades, deben realizar las revisiones, modificaciones y emisión de las Reglas del Mercado" — `public/data/RLSE_chunks.json`, Transitorio Quinto
- LCNE Transitorio Tercero: "Las referencias normativas a la Comisión Nacional de Hidrocarburos y a la Comisión Reguladora de Energía se entienden hechas o conferidas a la Secretaría o a la Comisión" — `public/data/LCNE_chunks.json`, `LCNE-Trans-03`. Por eso las menciones a "CRE" en las BME se leen hoy como SENER o CNE.
- Quién emite ahora: la CNE debe "Emitir, revisar, ajustar y actualizar las Bases del Mercado Eléctrico" (LSE art. 11, fr. VIII, `LSE-Art-011`). CENACE emite las Disposiciones Operativas, que incluyen los manuales (LSE art. 3, fr. XVIII y art. 124, fr. III).
- En junio de 2026 la actualización seguía pendiente: los lineamientos de migración de SENER y CNE usan las fórmulas "en tanto no se actualicen las Reglas del Mercado" y "en tanto se actualicen" ([Energía a Debate, 18-jun-2026](https://energiaadebate.com/publican-sener-y-cne-lineamientos-para-la-migracion-al-mercado-electrico-mayorista/)).

**Qué cambió con la reforma de 2025 (y qué no)**

| Tema | Antes | Ahora | Fuente |
|---|---|---|---|
| Regulador | CRE | CNE; SENER coordina la actualización de reglas | LCNE Transitorio Tercero; LSE art. 11 |
| Umbral de permiso | 0.5 MW ([LIE art. 17](https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo98009.html)) | 0.7 MW (LSE art. 19, `LSE-Art-019`) | Texto de ambas leyes |
| Abasto aislado | Figura de la LIE art. 22 | La expresión no aparece en la LSE; ahora es "autoconsumo aislado" (LSE art. 31). Solo queda en BME y en dos pasajes transitorios del RLSE | Búsqueda en `public/data` |
| CEL | Título de la CRE | Título de la CNE; otorgamiento que no depende "ni de la propiedad, ni de la fecha de inicio de operación comercial" (LSE art. 143); vigencia de 30 meses (LSE art. 146) | `LSE-Art-143`, `LSE-Art-146` |
| Mercado de Potencia | Base 11 y Manual | Sin cambio operativo verificado. La LSE no nombra al "Mercado para el Balance de Potencia": la expresión solo aparece en `BME_chunks.json` | Búsqueda en `public/data` |
| Tarifas finales | Acuerdos CRE | Acuerdo CNE con los mismos factores de carga y los mismos horarios de GDMTH que A/158/2024 (comparé ambos textos) | [A/158/2024](https://dof.gob.mx/nota_detalle_popup.php?codigo=5747760), [CNE 2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5783862) |

**Estado en el acervo local (revisé `public/data` el 8-nov-2026)**

- Sí están en `public/data`: LSE, RLSE, LPTE, RLPTE, LCNE y `BME_chunks.json`.
- No están en `public/data`: Manual del MBP, Manual de MECP, Código de Red, acuerdos de tarifas, avisos de CEL ni factor de emisión.
- Las BME no deben enlazarse como acervo sin comprobarlo: la nota del proyecto `citar-leyes-acervo` registra que el 8-nov-2026 `BME_chunks.json` no tenía registro en la tabla `leyes` de Supabase y que `src/data/explorer-catalog.json` la llama referencia heredada. No volví a consultar Supabase. El DOF de las Bases está en [nota 5407715](http://www.dof.gob.mx/nota_detalle.php?codigo=5407715&fecha=08/09/2015), enlace que cita la CNE en su [Reporte de Confiabilidad 2024](https://www.cne.gob.mx/Electricidad%20CNE/Codigo%20de%20red/Anexo%20Acuerdo%20RCSEN2024%20R00.pdf).

### Inferences
- Lo prudente para el sitio es rotular: "Regla aplicada hoy por CENACE con base en el Transitorio Tercero de la LSE; pendiente de actualización". No decir "vigente" sin matiz ni "derogada".
- Como el art. 112 de la LSE habla de "Potencia o cualquier otro producto que garantice la suficiencia de recursos", la ley permite rediseñar el producto de capacidad. Toda calculadora de Potencia debe llevar fecha y versión.

### Gaps
- No pude revisar el índice completo del DOF de 2026. "No encontré Bases nuevas" no equivale a "no existen". El aviso del DOF del 18-jun-2026 que un buscador mencionó no se pudo abrir ([enlace](https://dof.gob.mx/nota_to_pdf.php?fecha=18%2F06%2F2026&edicion=MAT) devolvió contenido vacío).
- Sin confirmar si el Manual de MECP o el Código de Red tienen versiones posteriores a las que leí.

## 1. Potencia, energía y servicios conexos; Mercado para el Balance de Potencia

### Takeaway
La Potencia con mayúscula es un compromiso comercial anual, no energía ni la potencia física. Se liquida en pesos por MW-año, después de terminado el año, por zona de Potencia. Para el año de producción 2025 el Precio Neto fue 4,397,797.01 $/MW-año en el SIN, 2,073,887.95 en BCA y 6,814,089.79 en BCS.

### Cited Findings

**Glosario**

| Término | Definición literal | Fuente | En lenguaje sencillo |
|---|---|---|---|
| Mercado Eléctrico Mayorista | "Sistema de transacciones, operado por el CENACE, para la compra y venta de energía eléctrica, potencia, Servicios Conexos y otros Productos Asociados" | LSE art. 3, fr. XXXI, `LSE-Art-003` | Donde las grandes empresas eléctricas compran y venden, no es el recibo de luz |
| Productos Asociados | "Productos vinculados a la operación y desarrollo del sector eléctrico [...] entre los que se encuentran: potencia, Servicios Conexos, servicios de transmisión y distribución y Control Operativo" | LSE art. 3, fr. XXXVIII | Todo lo que se vende además de la energía |
| Potencia (mayúscula) | "El compromiso para mantener Capacidad Instalada de generación y ofrecerla al Mercado de Energía de Corto Plazo durante un periodo dado [...] Se distingue de 'potencia', la cual se refiere a la tasa de producción de energía en un momento dado." | BME 2.1.97, `BME_chunks.json` (regla 2015, aplicada por transitorio) | Pagar para que una central esté lista cuando se necesite |
| capacidad | "la cantidad de potencia (en MW) que una Unidad de Central Eléctrica o Recurso de Demanda Controlable es físicamente capaz de producir o dejar de consumir" | BME 11.1.4(c) | El tamaño físico de la máquina |
| Capacidad Instalada | "Cantidad de potencia que tiene una Central Eléctrica, un Sistema de Almacenamiento de Energía Eléctrica o un recurso de Demanda Controlable, también es identificada como la capacidad de placa" | RLSE art. 2, fr. VII, `public/data/RLSE_chunks.json` | Lo que dice la placa |
| Capacidad Entregada | "El promedio de la cantidad total de potencia que un Recurso efectivamente haya puesto a disposición del Sistema Eléctrico Nacional en las Horas Críticas de un año dado, el cual se expresará en MW" | [Manual MBP 1.3](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20del%20Mercado%20para%20el%20Balance%20de%20Potencia%20%5bDOF%2022-09-16%5d.pdf) | Lo que de verdad estuvo disponible en las horas más apretadas |
| Mercado para el Balance de Potencia | "Mercado cuyos participantes podrán comprar y vender Potencia cada año para cubrir los desbalances que puedan existir respecto a Transacciones Bilaterales de Potencia y los requisitos de Potencia" | BME 2.1.77 (dentro de `BME-2-1-76`) | Un ajuste anual para quien quedó corto o le sobró |
| Horas Críticas | "Cada una de las 100 horas críticas que identifique el CENACE para cada año y para cada Zona de Potencia" | Manual MBP 1.3 | Las 100 horas del año con menos margen |
| Potencia Anual Acreditada (PAA) | "La cantidad total de Potencia (expresada en MW-año) acreditada por el CENACE a los Recursos que hayan sido representados por un Participante del Mercado en un año determinado, calculada y notificada por el CENACE una vez que haya transcurrido ese año" | Manual MBP 1.3 | Cuánta Potencia le reconocen a una empresa por lo que ya hizo |
| Requisito Anual de Potencia (RAP) | "La cantidad total de Potencia (expresada en MW-año) que cada Entidad Responsable de Carga tendrá la obligación de adquirir" | Manual MBP 1.3 | Cuánta Potencia debe comprar quien vende luz |
| Precio de Cierre de Potencia | "El precio de Potencia que resulta del cruce de la curva de oferta de Potencia y la curva de demanda de Potencia." | BME 2.1.98 | Precio donde se cruzan oferta y demanda |
| Precio Neto de Potencia | "El precio de Potencia a liquidarse como resultado del Mercado para el Balance de Potencia, para el cual se resta al Precio de Cierre de Potencia, la renta estimada que corresponde a la tecnología de generación de referencia por su operación en el Mercado del Día en Adelanto." | BME 2.1.101 | El precio final, ya descontado lo que esa central típica gana vendiendo energía |
| Zona de Potencia | "La zona conformada por varios NodosP en los términos de la Base 11.1.3 y del Capítulo 4" | Manual MBP 1.3 | Región donde se calcula un precio de Potencia |
| Año de Producción | "El año para el cual se calculan las cantidades de Potencia [...] Por ejemplo, el Mercado para el Balance de Potencia para el Año de Producción 2018 será operado por el CENACE en los primeros meses del año 2019." | Manual MBP 1.3 | El MBP cobra el año que ya pasó |

**Cómo se calculan las 100 horas críticas (regla aplicada)**

- Base 11.1.5(c)(i): para 2016 y 2017 fueron las de "demanda máxima"; "Para el año 2018 en adelante, las 100 horas críticas serán las 100 horas de menores reservas totales de generación en el sistema interconectado o zona de Potencia correspondiente" (`BME-11-1-5`).
- Cálculo por hora, Base 11.1.5(c)(i)(I)-(III): reserva total = disponibilidad total de generación menos demanda firme. La disponibilidad suma las capacidades máximas de las centrales firmes ofrecidas en el Mercado de Tiempo Real, menos lo que no estuvo disponible ante la instrucción de despacho, más la generación real de las intermitentes. La demanda firme es la demanda observada menos los Recursos de Demanda Controlable Garantizados ofrecidos, más los que CENACE activó.
- Capacidad Entregada: "el menor entre la Disponibilidad de Producción Física y la Disponibilidad de Entrega Física" (Base 11.1.5(b)).
- CENACE las identifica "a más tardar en enero del año inmediato siguiente al Año de Producción" y son "horas exactas" según las convenciones del Manual de MECP ([Manual MBP 3.2](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20del%20Mercado%20para%20el%20Balance%20de%20Potencia%20%5bDOF%2022-09-16%5d.pdf)). Esa convención llama "Hora Terminada 24" a la hora de 23:00 a 24:00 ([Manual MECP 1.3](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20de%20Mercado%20de%20Energ%C3%ADa%20de%20Corto%20Plazo%20%5bDOF%2017-06-16%5d.pdf)).

**Resultados oficiales del MBP 2026 (año de producción 2025)**

| Zona | Tecnología de referencia | Costo fijo nivelado ($/MW-año) | Ingresos de energía IMTGR ($/MW-año) | Precio de cierre (p.u.) | Precio de cierre ($/MW-año) | Precio máximo ($/MW-año) | Precio Neto ($/MW-año) |
|---|---|---|---|---|---|---|---|
| SIN | Turbina de gas industrial 260 MW, gas natural | 3,812,112.33 | 843,476.23 | 1.3749 | 5,241,273.24 | 4,966,564.17 | **4,397,797.01** |
| BCA | Turbina de gas industrial 260 MW, gas natural | 2,322,581.30 | 2,571,274.65 | 2.00 | 4,645,162.60 | 2,073,887.95 | **2,073,887.95** |
| BCS | Turbina de gas industrial 76.05 MW, diésel | 3,424,800.00 | 35,510.21 | 2.00 | 6,849,600.00 | 6,814,089.79 | **6,814,089.79** |

Fuentes: [Informe MBP 2026, 27-feb-2026](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202026%20A%C3%B1o%20de%20Producci%C3%B3n%202025%20(v2026-02-27).pdf) y [Precio Neto recálculo, 3-sep-2026](https://www.cenace.gob.mx/Docs/02_MBP/PrecioNetoPotencia/2025/Precio%20Neto%20de%20la%20Potencia%20en%202025%20(v2026%2009%2003)%20Rec%C3%A1lculo.pdf). La zona y el orden de cada fila vienen de un PDF con columnas desordenadas; los comprobé porque las fórmulas de CENACE reproducen cada cifra.

- Fórmula literal de CENACE: `PNP_SIN= max[0, (1.3749*3,812,112.33) - 843,476.23]`, y equivalentes para BCA y BCS ([Precio Neto recálculo](https://www.cenace.gob.mx/Docs/02_MBP/PrecioNetoPotencia/2025/Precio%20Neto%20de%20la%20Potencia%20en%202025%20(v2026%2009%2003)%20Rec%C3%A1lculo.pdf)).
- Cantidades tras el recálculo de BCS: Potencia adquirida 4,295.45 MW-año en SIN (2,063.85 obligatoria más 2,231.60 de Potencia Eficiente), 730.57 en BCA, 87.08 en BCS. Montos: 18,890,517,166.60, 1,515,120,319.63 y 593,370,938.91 pesos ([Informe recálculo](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202026%20A%C3%B1o%20de%20Producci%C3%B3n%202025%20(v2026-09-03)%20Rec%C3%A1lculo.pdf)). Comprobé que Potencia adquirida × Precio Neto da exactamente esos montos en las tres zonas.
- Cantidad incumplida de la obligación neta: 532.42 MW-año en SIN y 339.41 en BCA (mismo informe).
- El recálculo tocó solo BCS, por cambio en la Disponibilidad de Producción Física de tres unidades. SIN y BCA "se mantienen sin modificación" y el precio neto de BCS no cambió; sí cambiaron cantidades y las horas críticas de BCS (mismo informe; notificación del [8-sep-2026](https://www.cenace.gob.mx/Paginas/SIM/MercadoBalance.aspx)). El informe fecha el recálculo el 5-may-2026 y el documento es de septiembre.
- Precio Neto del año anterior (MBP 2025, año de producción 2024): SIN 4,983,551.47; BCA 2,915,386.53; BCS 8,650,298.08 $/MW-año, tomados de fragmentos de búsqueda de los documentos de [CENACE](https://www.cenace.gob.mx/Docs/02_MBP/PrecioNetoPotencia/2024/Precio%20Neto%20de%20la%20Potencia%20en%202024%20(v2025%2002%2028).pdf). Hubo [recálculo el 23-sep-2025](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202025%20A%C3%B1o%20de%20Producci%C3%B3n%202024%20(2025%2009%2023)%20Rec%C3%A1lculo.pdf); solo confirmé que SIN conserva 4,983,551.47 en esa versión.

**Horas críticas del año de producción 2025**

| Zona | Ventana de cálculo | Primera y última hora crítica | Reserva promedio en esas horas |
|---|---|---|---|
| SIN | 2-abr a 2-jul-2025 | 2-abr-2025 hora 20; 19-jun-2025 hora 21 | 4,277.87 MW |
| BCA | 18-jun a 23-sep-2025 | 7-ago-2025 hora 13; 4-sep-2025 hora 19 | 193.98 MW |
| BCS (versión recálculo) | 2-abr a 14-nov-2025 | 17-abr-2025; 13-nov-2025 hora 22 | 51.46 MW (la versión de febrero decía −1.84 MW) |

Fuente: [Informe de febrero](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202026%20A%C3%B1o%20de%20Producci%C3%B3n%202025%20(v2026-02-27).pdf) e [Informe de recálculo](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202026%20A%C3%B1o%20de%20Producci%C3%B3n%202025%20(v2026-09-03)%20Rec%C3%A1lculo.pdf). La fila BCA y las horas de SIN vienen de los rótulos de las gráficas.

**Zonas de Potencia y reservas de planeación**

- Para el MBP 2026 son tres y cada una equivale a un sistema interconectado (SIN, BCA, BCS); por eso el Porcentaje Zonal es 100% ([Informe](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202026%20A%C3%B1o%20de%20Producci%C3%B3n%202025%20(v2026-02-27).pdf)). La Base 11.1.3 permite zonas más chicas, "sólo [...] donde haya una necesidad de generación local" (`BME-11-1-3`).
- Reserva de planeación mínima en términos de requisito de Potencia: nacional 7.7%, Baja California 8.6%, Baja California Sur 13.8%. Eficiente: 15.3%, 16.4%, 32.7% (mismo informe, tablas 5 y 6).
- Tamaño del mercado en el SIN: oferta estimada 48,218.71 y obligación estimada 46,519.59 MW-año; obligación neta 2,596.27 MW-año (mismo informe, tablas 7 y 12).
- Bases legales en la LSE: la CNE establece los requisitos de potencia (art. 69, `LSE-Art-069`); las Reglas del Mercado deben permitir compraventa de "Potencia o cualquier otro producto que garantice la suficiencia de recursos" (art. 112, fr. III, `LSE-Art-112`); CENACE puede pedir mecanismos competitivos para adquirir potencia (art. 155, `LSE-Art-155`).

### Inferences
- **MW-año no es energía.** Un MW-año es tener un MW comprometido todo un año, no 8,760 MWh entregados (se deduce del concepto en BME 2.1.97 y Manual 1.3).
- Solo cerca de 5.6% de la obligación estimada del SIN pasó al MBP como obligación neta (2,596.27 / 46,519.59). El resto se cubre con contratos o transacciones bilaterales que el informe no publica a precio, así que el Precio Neto no es lo que cobra toda la Potencia del país.
- En BCA y BCS el precio neto coincide con el precio máximo porque la oferta no alcanzó la obligación: 2.00 p.u. es el tope de la curva. Es lectura mía de los cuadros.

### Gaps
- No hay definición de "potencia" en la LSE; depende de las BME y del Manual, ambos pendientes de actualización.
- No leí los capítulos 5, 6 y 8 del Manual a nivel de fórmula, ni los valores individuales de PAA y RAP, que están en el área certificada del Sistema de Información del Mercado.

## 2. Servicios conexos: unidades y tiempos

### Takeaway
La ley los define de forma abierta. Los incluidos en el mercado son reservas: se ofertan en MW con costo en $/MWh y se pagan por hora y zona de reservas. Lo demás (control de voltaje, arranque de emergencia) va por tarifa regulada. "Arranque negro" no es término de los textos revisados.

### Cited Findings

**Definición en ley**: "Los servicios vinculados a la operación del Sistema Eléctrico Nacional y que son necesarios para garantizar su Calidad, Confiabilidad, Continuidad y seguridad, entre los que se pueden incluir: la reserva operativa, la reserva rodante, regulación de frecuencia, regulación de voltaje y el arranque de emergencia, entre otros, que se definan en las Reglas del Mercado" (LSE art. 3, fr. XLIX, `LSE-Art-003`). Precio de los no incluidos en el mercado: "se fijan con base en las Tarifas Reguladas que determina la CNE" (LSE art. 115, `LSE-Art-115`).

| Servicio | Definición literal | ¿En el mercado? | Cantidad | Precio | Tiempo verificado | En lenguaje sencillo |
|---|---|---|---|---|---|---|
| Reserva de Regulación Secundaria | "Capacidad en MW disponible [...] para incrementar o disminuir su generación o consumo a partir de una condición inicial, que cuenten con la infraestructura para operar en modo de regulación secundaria y estén funcionando dentro del Control Automático de Generación" (BME 2.1.116) | Sí | MW | $/MWh | La señal automática se envía cada 4 segundos ([MECP](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20de%20Mercado%20de%20Energ%C3%ADa%20de%20Corto%20Plazo%20%5bDOF%2017-06-16%5d.pdf)). "5 minutos": sin fuente verificada | Plantas que suben y bajan solas para mantener la frecuencia |
| Reserva Rodante | "Capacidad en MW [...] sincronizados a la red eléctrica para incrementar su generación o reducir su consumo dentro de un lapso establecido" (BME 2.1.120) | Sí, "de 10 minutos" y suplementaria | MW | $/MWh | 10 minutos (BME 10.3.8; MECP) | Ya encendidas y conectadas, listas para dar más |
| Reserva No Rodante | "Capacidad en MW [...] desconectados de la red eléctrica, que puedan sincronizar y entregar su potencia disponible dentro de un lapso establecido" (BME 2.1.117) | Sí, "de 10 minutos" y suplementaria | MW | $/MWh | 10 minutos (BME 10.3.8; MECP) | Apagadas, pero arrancan rápido |
| Reserva Operativa | "para incrementar su generación o consumo dentro de un lapso establecido, que combina Reserva Rodante y Reserva No Rodante" (BME 2.1.118) | Es requisito, no producto de oferta propio | MW | Sin precio de oferta propio | "generalmente, 10 minutos" ([CNE, Reporte 2024](https://www.cne.gob.mx/Electricidad%20CNE/Codigo%20de%20red/Anexo%20Acuerdo%20RCSEN2024%20R00.pdf)) | La suma de las dos anteriores |
| Reserva Suplementaria | "dentro de un lapso establecido, que será mayor al lapso requerido para la Reserva Operativa" (BME 2.1.121) | Sí, rodante y no rodante suplementarias | MW | $/MWh | 30 minutos (BME 10.3.8) | La de respaldo más lento |
| Reserva Reactiva | "Capacidad en MVAr disponible en equipos eléctricos para inyectar potencia reactiva a la red eléctrica o absorber potencia reactiva de ésta" (BME 2.1.119) | No | MVAr | Tarifa regulada | Sin dato | Ayuda a sostener el voltaje |
| Control de voltaje y potencia reactiva | "La aportación, absorción y reserva de potencia reactiva para control de voltaje [...] son Servicios Conexos no incluidos en el Mercado Eléctrico Mayorista" (BME 6.2.6) | No | Sin dato | Tarifa regulada | Sin dato | Mantener el voltaje correcto |
| Arranque de emergencia, operación en isla y conexión a bus muerto | Mismo texto de BME 6.2.6. La LSE dice "arranque de emergencia" | No | Sin dato | Tarifa regulada | Sin dato | Volver a encender la red tras un apagón |

- Literal del Manual de MECP para ofertas: "Oferta de Venta para Reserva Rodante de 10 minutos: (I) Cantidad expresada en MW y, (II) Costo expresado en $/MWh", y así para cada reserva ([MECP](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20de%20Mercado%20de%20Energ%C3%ADa%20de%20Corto%20Plazo%20%5bDOF%2017-06-16%5d.pdf)).
- Cuatro tipos de requisito se cubren con cinco productos de venta: regulación secundaria, rodante de 10 minutos, no rodante de 10 minutos, rodante suplementaria y no rodante suplementaria (MECP, Tabla 1).
- Precios se calculan por zona de reservas: BME 9.1.9(b), `BME-9-1-9`.
- Ejemplo real de precios: semana del 29-dic-2024 al 4-ene-2025, zona SIN, regulación secundaria de 7.73 a 577.86 $/MWh; rodante de 10 minutos de 2.81 a 114.49 $/MWh ([Reporte semanal CENACE](https://www.cenace.gob.mx/Docs/01_MECP/ReporteSemanal/2025/SIN%20Reporte%20MEM%20Sem%2001%202025%20Dic%2029%20a%20Ene%204.pdf)).
- Para quien tiene tarifa: el "Cargo de Servicios Conexos no MEM" fue 0.0069 $/kWh en julio de 2026 ([DOF](https://dof.gob.mx/nota_detalle_popup.php?codigo=5795184)).
- Existe un Manual de Servicios Conexos no incluidos en el MEM publicado en octubre de 2023, según prensa sectorial ([Factor Energético](https://factorenergetico.mx/cenace-publica-manual-de-servicios-conexos-no-incluidos-en-el-mercado-electrico-mayorista)). No lo leí.

### Inferences
- Los $/MWh de una reserva pagan tener un MW listo durante una hora, no energía entregada. Se deduce de que la cantidad se expresa en MW y de la definición como capacidad; la norma no lo dice así. No debe sumarse al PML como si fuera energía.

### Gaps
- Tiempo de respuesta de la regulación secundaria y de la regulación primaria: sin fuente verificada. Podrían estar en el Código de Red o en el Manual de Requerimientos Técnicos, que no leí.
- "Arranque negro" no aparece en LSE, RLSE ni BME (búsqueda en `public/data`); los textos usan "arranque de emergencia".
- Unidades de cobro de los servicios no incluidos en el mercado para quien los presta: sin revisar.

## 3. Precios Marginales Locales

### Takeaway
El PML es el precio de la energía en un punto de la red en un periodo. Tiene tres componentes y se expresa en $/MWh; se divide entre 1,000 para $/kWh. Se calcula por hora en el Día en Adelanto y en ciclos de 15 minutos en Tiempo Real, con promedio horario para liquidar.

### Cited Findings

| Término | Definición literal | Fuente | En lenguaje sencillo |
|---|---|---|---|
| Precio Marginal Local | "Precio de la energía eléctrica en un nodo determinado del Sistema Eléctrico Nacional para un periodo definido, calculado de conformidad con las Reglas del Mercado y aplicable a las transacciones de energía eléctrica realizadas en el Mercado Eléctrico Mayorista" | LSE art. 3, fr. XXXVI | Cuánto cuesta la siguiente unidad de energía en ese lugar y a esa hora |
| Componente de Energía Marginal | "La parte del Precio Marginal Local que representa el costo marginal de energía en el nodo de referencia del sistema interconectado correspondiente." | BME 2.1.18 | El precio base de la energía |
| Componente de Pérdidas Marginales | "La parte del Precio Marginal Local que representa el costo marginal de pérdidas en cada NodoP." | BME 2.1.19 | Lo que se pierde en el camino |
| Componente de Congestión Marginal | "La parte del Precio Marginal Local que representa el costo marginal de congestionamiento en cada NodoP." | BME 2.1.17 | El sobreprecio cuando las líneas se saturan |
| Mercado del Día en Adelanto | "Mercado de antelación cuyos participantes podrán presentar ofertas horarias [...] resultarán en compromisos financieramente vinculantes para la entrega o recepción de energía y Servicios Conexos en el día siguiente" | BME 2.1.76 | Se pacta hoy para mañana |
| Mercado de Tiempo Real | "Mercado cuyos participantes podrán presentar ofertas horarias [...] las cuales resultarán en instrucciones de despacho para la entrega o recepción física [...] en el mismo día" | BME 2.1.74 | Ajuste de lo que realmente pasa hoy |
| Intervalo de Despacho | "Es el ciclo de 15 minutos donde se realiza el Despacho Económico con Restricciones de Seguridad y se envían las instrucciones de puntos base de despacho económico a los oferentes." | [Manual MECP 1.3.13](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20de%20Mercado%20de%20Energ%C3%ADa%20de%20Corto%20Plazo%20%5bDOF%2017-06-16%5d.pdf) | Cada cuarto de hora se reacomoda la generación |

Calendario (todo del [Manual de MECP](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20de%20Mercado%20de%20Energ%C3%ADa%20de%20Corto%20Plazo%20%5bDOF%2017-06-16%5d.pdf)):

- Día en Adelanto: ofertas "desde 7 días naturales previos al Día de Operación hasta las 10:00 horas del día anterior" (4.2.1). Calcula PML y precios de servicios conexos "para cada hora del Día de Operación". Programas "antes de las 17:00 horas".
- Tiempo Real: el despacho de múltiples intervalos "se realiza cada 15 minutos para cada sistema interconectado [...] con un horizonte de 4 Intervalos de Despacho" (6.8.1).
- Liquidación: "al final de cada intervalo horario del Día de Operación, se determinan valores medios horarios de los resultados de Precios Marginales Locales [...] obtenidos por el modelo DERS-MI para los Intervalos de Despacho de quince-minutos" (6.9.10).
- Mercado de Una Hora en Adelanto: las BME lo prevén "una vez que sea implementado" (2.1.73). No verifiqué si opera.

Otros datos:

- Los precios pueden ser negativos: recursos intermitentes "podrán recibir liquidación basados en un Precio Marginal Local negativo" (BME 10.3.10). Caso real: mínimo de −179.49 $/MWh en la semana 1 de 2025 ([Reporte CENACE](https://www.cenace.gob.mx/Docs/01_MECP/ReporteSemanal/2025/SIN%20Reporte%20MEM%20Sem%2001%202025%20Dic%2029%20a%20Ene%204.pdf)).
- Referencia de orden de magnitud: PML promedio 365.39 $/MWh, máximo 3,960.31 $/MWh en esa misma semana (mismo reporte).
- La LSE no enumera los tres componentes; el desglose viene de BME 9.1.9(a) (`BME-9-1-9`).

### Inferences
- Fórmula para el sitio: `PML = energía + pérdidas + congestión`, con los tres en $/MWh. Ejemplo ilustrativo inventado: 900 + 40 − 15 = 925 $/MWh = 0.925 $/kWh. Pérdidas y congestión pueden restar, según el nodo; se deduce de que el PML total puede ser negativo y de que varían por nodo, no lo leí como regla explícita.
- El PML no es lo que paga un usuario de Suministro Básico: la tarifa final tiene su propio cargo de energía, regulado.

### Gaps
- El sitio no tiene series de PML. CENACE las publica por nodo en su Sistema de Información del Mercado; no probé acceso automático.

## 4. Hora punta, base, intermedia, semipunta; demanda; "hora pico" y "horas críticas"

### Takeaway
"Punta" es un periodo tarifario fijo publicado por sistema interconectado, temporada y categoría, y solo existe en GDMTH, DIST y DIT. "Demanda facturable" con factores FRI y FRB ya no está en el Acuerdo de 2026: hoy se cobra capacidad y distribución sobre el menor de dos valores. "Hora pico" no es término legal. "Hora crítica" es un concepto del mercado de Potencia que se conoce al terminar el año.

### Cited Findings

**Tres ideas que se confunden**

| | Hora pico o demanda máxima del sistema | Horario punta | Horas críticas |
|---|---|---|---|
| Qué es | La hora en que el país consume más. No está definida en LSE, RLSE ni BME (búsqueda en `public/data`) | Periodo fijo en que la energía y la capacidad cuestan más en GDMTH, DIST y DIT | Las 100 horas del año con menos reserva de generación |
| Quién la fija | Sucede; la mide CENACE | La CNE, en el acuerdo tarifario | CENACE, después de cada año |
| Se sabe | Después | Antes, todo el año | Después, a más tardar en enero siguiente |
| Ejemplo | 23-jul-2026, 20:22 h (ver sección 5) | SIN, verano, lunes a viernes, 20:00–22:00 | SIN 2025: entre el 2-abr y el 19-jun |
| Sirve para | Planeación y operación | Cobrarle a un usuario | Acreditar Potencia a una central |

**Categorías** ([Acuerdo CNE 2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5783862), Tabla 1 y numerales 2.6.1, 2.6.2 y Tabla 2)

| Categoría | Descripción literal | Categoría anterior de CFE | Factor de carga | Cargo de energía | Cargo de capacidad |
|---|---|---|---|---|---|
| DB1 | "Doméstico en Baja Tensión, consumiendo hasta 150 kWh-mes" | 1, 1A–1F | 0.59 | Ordinario | $/kWh |
| DB2 | "Doméstico en Baja Tensión, consumiendo más de 150 kWh-mes" | 1, 1A–1F, DAC | 0.59 | Ordinario | $/kWh |
| PDBT | "Pequeña Demanda (hasta 25 kW-mes) en Baja Tensión" | 2, 6 | 0.58 | Ordinario | $/kWh |
| GDBT | "Gran Demanda (mayor a 25 kW-mes) en Baja Tensión" | 3, 6 | 0.49 | Ordinario | $/kW |
| APBT y APMT | Alumbrado público | 5, 5A | 0.50 | Ordinario | $/kWh |
| RABT | Riego agrícola en baja tensión | 9, 9CU, 9N | 0.50 | Ordinario | $/kWh |
| RAMT | Riego agrícola en media tensión | 9M, 9CU, 9N | 0.50 | Ordinario | $/kW |
| GDMTO | "Gran Demanda (menor a 100 kW-mes) en Media Tensión Ordinaria" | OM, 6 | 0.55 | Ordinario | $/kW |
| GDMTH | "Gran Demanda (igual o mayor a 100 kW-mes) en Media Tensión Horaria" | HM, HMC, 6 | 0.57 | Horario | $/kW |
| DIST | "Demanda Industrial en Subtransmisión" | HS, HSL | 0.74 | Horario | $/kW |
| DIT | "Demanda Industrial en Transmisión" | HT, HTL | 0.71 | Horario | $/kW |

**Temporadas** ([Acuerdo CNE 2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5783862), Tabla 4)

| Sistema | Categoría | Temporada | Periodo |
|---|---|---|---|
| Baja California | GDMTH, DIST, DIT | Verano | Del primero de mayo al sábado anterior al último domingo de octubre |
| | | Invierno | Del último domingo de octubre al 30 de abril |
| Baja California Sur | GDMTH, DIST, DIT | Verano | Del primer domingo de abril al sábado anterior al último domingo de octubre |
| | | Invierno | Del último domingo de octubre al sábado anterior al primer domingo de abril |
| SIN | GDMTH | Verano | Del primer domingo de abril al sábado anterior al último domingo de octubre |
| | | Invierno | Del último domingo de octubre al sábado anterior al primer domingo de abril |
| SIN | DIST, DIT | Primavera | Del 1-feb al sábado anterior al primer domingo de abril |
| | | Verano | Del primer domingo de abril al 31-jul |
| | | Otoño | Del 1-ago al sábado anterior al último domingo de octubre |
| | | Invierno | Del último domingo de octubre al 31-ene |

**Horarios GDMTH** (Tabla 5 del [Acuerdo CNE 2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5783862); la [ficha de CFE](https://app.cfe.mx/Aplicaciones/CCFE/Tarifas/TarifasCRENegocio/Tarifas/GranDemandaMTH.aspx) los lista para las regiones Central, Noreste, Noroeste, Norte, Peninsular y Sur bajo el SIN)

| Sistema y temporada | Día | Base | Intermedio | Punta |
|---|---|---|---|---|
| SIN verano | Lunes a viernes | 0–6 | 6–20, 22–24 | **20–22** |
| | Sábado | 0–7 | 7–24 | No hay |
| | Domingo y festivo | 0–19 | 19–24 | No hay |
| SIN invierno | Lunes a viernes | 0–6 | 6–18, 22–24 | **18–22** |
| | Sábado | 0–8 | 8–19, 21–24 | **19–21** |
| | Domingo y festivo | 0–18 | 18–24 | No hay |
| Baja California verano | Lunes a viernes | No hay | 0–14, 18–24 | **14–18** |
| | Sábado, domingo y festivo | No hay | 0–24 | No hay |
| Baja California invierno | Lunes a viernes | 0–17, 22–24 | 17–22 | No hay |
| | Sábado | 0–18, 21–24 | 18–21 | No hay |
| | Domingo y festivo | 0–24 | No hay | No hay |
| Baja California Sur verano | Lunes a viernes | No hay | 0–12, 22–24 | **12–22** |
| | Sábado | No hay | 0–19, 22–24 | **19–22** |
| | Domingo y festivo | No hay | 0–24 | No hay |
| Baja California Sur invierno | Lunes a viernes | 0–18, 22–24 | 18–22 | No hay |
| | Sábado | 0–18, 21–24 | 18–21 | No hay |
| | Domingo y festivo | 0–19, 21–24 | 19–21 | No hay |

**Horarios de punta en DIST y DIT, SIN** (Tablas 6 y 7, mismo Acuerdo)

| Temporada | DIST lunes a viernes | DIT lunes a viernes | Sábado |
|---|---|---|---|
| Primavera | 19:00–22:00 | 19:30–22:30 | Sin punta |
| Verano | 20:00–22:00 | 20:30–22:30 | Sin punta |
| Otoño | 19:00–22:00 | 19:30–22:30 | Sin punta |
| Invierno | 18:00–22:00 | 18:30–22:30 | DIST 19:00–21:00; DIT 19:30–21:30 |

- **Semipunta**: "El cargo de semipunta se aplica únicamente en la división de Baja California" (Acuerdo, Figura 2, nota 2). En verano, lunes a viernes: DIST de 12:00 a 14:00 y de 18:00 a 22:00, con punta de 14:00 a 18:00; DIT de 17:00 a 23:00, con punta de 13:00 a 17:00. GDMTH no la usa (Tablas 5 a 7).
- **Festivos**: la ficha de CFE remite al art. 74 de la Ley Federal del Trabajo, excepto su fracción IX; el Acuerdo trae la misma referencia.
- **17 divisiones tarifarias**: las cuotas cambian por división (numeral 1.3 y notas mensuales del DOF), mientras los horarios cambian por sistema interconectado.

**Demanda** ([Acuerdo CNE 2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5783862))

- Numeral 5.1.1, literal: "La demanda máxima a la que se deben aplicar los cargos de capacidad expresados en $/kW-mes, debe ser la mínima entre los valores que se definen a continuación". Fórmula (imagen del DOF que leí): `mín{ Dmax_punta , [ Q_mensual / (24 * d * F.C.) ] }`.
- Sin periodo de punta o sin medición de demanda: `Demanda = [ Q_mensual / (24 * d * F.C.) ]`.
- Numeral 5.2.1, cobro por distribución en $/kW-mes: `mín{ Dmax_mensual , [ Q_mensual / (24 * d * F.C.) ] }`.
- Donde Dmax_punta es "la demanda máxima coincidente con el periodo horario de punta medida en kilowatts", Q es el consumo mensual en kWh, d los días del periodo de facturación y F.C. el factor de carga del numeral 3.1.2. Mismas fórmulas en [A/158/2024](https://dof.gob.mx/nota_detalle_popup.php?codigo=5747760), numeral 5.
- Factor de carga, literal: "la relación entre la carga promedio en un tiempo determinado y la carga máxima registrada en el mismo periodo de una categoría tarifaria" (numeral 3.1.2).
- Demanda máxima medida en GDMTH: "la demanda media en kilowatts durante cualquier intervalo de 15 minutos en el cual el consumo de energía eléctrica sea mayor que en cualquier otro intervalo de 15 minutos en el periodo correspondiente. Cualquier fracción de kilowatt de demanda medida se debe tomar como kilowatt completo."
- Demanda contratada en GDMTH: "su valor no debe ser menor del 60% de la carga total conectada, ni menor de 100 kilowatts o la capacidad del mayor motor o aparato instalado"; si ese 60% excede la subestación, se toma "la capacidad de dicha subestación a un factor de 90%". En GDMTO el mínimo es 10 kW.
- Cambios de categoría: PDBT pasa a GDBT tras la tercera medición consecutiva arriba de 25 kW ([ficha PDBT](https://app.cfe.mx/Aplicaciones/CCFE/Tarifas/TarifasCRENegocio/Tarifas/PequenaDemandaBT.aspx), paráfrasis). GDMTH puede pedir pasar a GDMTO tras 12 meses consecutivos por debajo de 100 kW.
- **"Demanda facturable"**: la expresión y "FRI" tienen cero apariciones en el texto del Acuerdo 2026 (búsqueda en el HTML del DOF). La fórmula `DF = DP + FRI × max(DI − DP, 0) + FRB × max(DB − DPI, 0)` apareció en un resumen de búsqueda atribuida a un sitio de divulgación que no pude abrir ([posiblemente este](https://todosloshechos.es/como-se-mide-la-demanda-maxima-cfe), error 403), así que su texto exacto queda sin verificar. Un mensaje técnico de 2016 describe esa estructura para la tarifa horaria anterior, con reducción de 30% en intermedio y 15% en base sobre la diferencia con la máxima de punta e intermedia, lo que sugiere que DPI no es errata ([lista eQuest](https://onebuilding.org/archive-part2/equest-users-onebuilding.org/2016-October/001174.html); la tabla con la fórmula es una imagen que no pude leer). HM ya corresponde a GDMTH (Tabla 1 del Acuerdo).
- **Coincidente y no coincidente**: el Acuerdo usa "demanda no coincidente" y "demanda coincidente mensual" para estimar costos de cada división y categoría (numeral 3.1.3 d-e), no para el recibo individual. En ese recibo, "coincidente" significa coincidente con el periodo de punta.

**Tarifas domésticas de CFE**

| Tarifa | Temperatura media mínima en verano | Límite de alto consumo (kWh/mes, promedio móvil de 12 meses) |
|---|---|---|
| 1 | Sin dato en la ficha (no es por temperatura en el texto que leí) | 250 |
| 1A | 25 °C | 300 |
| 1B | 28 °C | 400 |
| 1C | 30 °C | 850 |
| 1D | 31 °C | 1,000 |
| 1E | 32 °C | 2,000 |
| 1F | 33 °C | 2,500 |

Fuentes: [ficha DAC](https://app.cfe.mx/Aplicaciones/CCFE/Tarifas/TarifasCREHogar/Tarifas/TarifaDAC.aspx), [ficha 1F](https://app.cfe.mx/Aplicaciones/CCFE/Tarifas/TarifasCREHogar/Tarifas/Tarifa1F.aspx), [ficha 1A](https://app.cfe.mx/Aplicaciones/CCFE/Tarifas/TarifasCREHogar/Tarifas/Tarifa1A.aspx) y equivalentes de 1B a 1E.

- Regla de localidad, literal: "cuando alcance el límite indicado durante tres ó más años de los últimos cinco de que se disponga de la información correspondiente". Mínimo mensual: "El equivalente a 25 (veinticinco) kilowatts-hora". Verano: "el periodo que comprende los seis meses consecutivos más cálidos del año" ([ficha 1A](https://app.cfe.mx/Aplicaciones/CCFE/Tarifas/TarifasCREHogar/Tarifas/Tarifa1A.aspx)).
- Base legal del esquema distinto: "El Ejecutivo Federal puede determinar, mediante Acuerdo, un mecanismo de fijación de tarifas distinto al de las tarifas finales" para determinados grupos de usuarias (LSE art. 159, `LSE-Art-159`).
- Ninguna tarifa doméstica, PDBT, GDBT ni GDMTO tiene punta: son de cargo de energía ordinario (numeral 2.6.1 a del Acuerdo).

**Cuotas reales, julio de 2026, División Bajío, GDMTH** ([DOF, oficio F00.06.UE/1853/2026](https://dof.gob.mx/nota_detalle_popup.php?codigo=5795184), columnas confirmadas en la tabla HTML)

| Concepto | Unidad | Valor |
|---|---|---|
| Transmisión | $/kWh | 0.1801 |
| Operación del CENACE | $/kWh | 0.0076 |
| Servicios Conexos no MEM | $/kWh | 0.0069 |
| Generación, energía base | $/kWh | 0.8282 |
| Generación, energía intermedia | $/kWh | 1.6161 |
| Generación, energía punta | $/kWh | 1.8674 |
| Distribución | $/kW | 97.88 |
| Generación, capacidad | $/kW | 377.16 |
| Operación de la Suministradora | $/mes | 427.19 |

### Inferences
- La calculadora debe decir "demanda para el cargo de capacidad" y "demanda para el cargo de distribución", y solo mencionar "demanda facturable" para explicar que es la fórmula de la tarifa anterior.
- Los corchetes de la fórmula parecen indicar redondeo hacia arriba, coherente con "cualquier fracción de kilowatt [...] como kilowatt completo". No está dicho para el término calculado; conviene mostrar el resultado con y sin redondeo.
- Un ejemplo claro de que hora crítica no es hora punta: la última hora crítica de BCS en 2025 fue el 13-nov hora 22 (de 21:00 a 22:00, por la convención de Hora Terminada), un jueves de invierno, cuando BCS no tiene punta en GDMTH: esa hora es intermedia.

### Gaps
- La ficha de CFE cita A/158/2024 aunque el Acuerdo de 2026 ya es otro. Comparé horarios de GDMTH y factores de carga y son iguales, pero no comparé línea por línea DIST y DIT.
- No revisé cuotas posteriores a julio de 2026 ni bonificaciones o cargos por factor de potencia del recibo: el Acuerdo 2026 solo menciona factor de potencia para capacidad nominal de ciertos equipos (numeral 5.7.4).
- Bloques de consumo de tarifas 1 a 1F y DAC: la ficha no los muestra como texto. No verifiqué el fundamento del subsidio ni el acuerdo de SHCP.
- Definición de "demanda coincidente" para sumar varios usuarios en un sistema: no localicé definición legal.

## 5. Potencia pico (MWp) y demanda pico; demanda máxima del SIN

### Takeaway
MWp mide el tamaño de los paneles solares en condiciones de prueba; la demanda pico mide cuánto consume el sistema. Son cosas distintas y la ley no usa ninguna de las dos expresiones. La cifra pública más reciente del SIN es 54,124 MW el 23-jul-2026 según CFE, con un segundo dato de 54,300 MW; no encontré documento primario de CENACE que las confirme.

### Cited Findings
- "MWp", "potencia pico" y "demanda pico" tienen cero apariciones en LSE, RLSE y BME (búsqueda en `public/data`). La norma usa "Capacidad Instalada [...] capacidad de placa" (RLSE art. 2, fr. VII).
- En permisos y notas de prensa aparecen ambas unidades (un permiso de 37.4 MWp y otro de 457.211 MW en corriente alterna), según el resumen de una búsqueda; no abrí las notas ni verifiqué cuál cifra corresponde a cuál enlace: [pv magazine](https://www.pv-magazine.com/press-releases/dhamma-secures-first-mexican-permit_100016399/), [Energías Renovables](https://www.energias-renovables.com/fotovoltaica/autorizan-la-construccion-de-un-parque-fotovoltaico-20140915).
- Demanda máxima 2026: 54,124 MW en el SIN el 23 de julio, frente a 53,702 MW de 2023; 3,705 MW en BCA (anterior 3,638 en 2024); 771 MW en BCS (anterior 749.8). Atribuido a CFE ([El Exprés, 10-ago-2026](https://www.elexpres.com/nota.php?story_id=368388)).
- Segundo dato: 54,300 MW a las 20:22, atribuido a un directivo de CFE, con récord anterior del 21-jun-2023 ([El Financiero, 25-jul-2026](https://www.elfinanciero.com.mx/economia/2026/07/25/la-demanda-electrica-se-dispara-en-mexico-este-fue-el-dia-que-mayor-gastaron-luz-los-mexicanos/)). La fecha exacta se deduce de "el pasado jueves".
- Sobre 2025: 54,124 MW supera el máximo de 2025 en 2.23% (El Exprés). Eso implica unos 52,940 MW; es cálculo mío, no cifra publicada.
- Dato oficial de otro tipo para 2024: curva de duración de carga de la CNE con 3,635 MWh/h en BCA (5-sep, 17:00) y 689 MWh/h en BCS (10-sep, 17:00). El mismo reporte rotula por separado "Demanda máxima instantánea" ([CNE, Reporte de Confiabilidad 2024](https://www.cne.gob.mx/Electricidad%20CNE/Codigo%20de%20red/Anexo%20Acuerdo%20RCSEN2024%20R00.pdf)).
- Capacidad instalada citada en prensa: 93,402 MW ([El Financiero](https://www.elfinanciero.com.mx/economia/2026/07/25/la-demanda-electrica-se-dispara-en-mexico-este-fue-el-dia-que-mayor-gastaron-luz-los-mexicanos/)). No verificada en fuente oficial.

### Inferences
- La diferencia de 54,124 a 54,300 podría deberse a medir promedio de la hora o valor instantáneo, igual que 3,635 MWh/h frente a 3,638 MW en BCA 2024. Es hipótesis: ninguna nota lo aclara.
- Para el sitio: publicar "unos 54 mil MW en julio de 2026, según CFE" con fecha y sin más decimales, hasta tener documento de CENACE.
- Una calculadora de MWp a MW de corriente alterna no debe traer proporción fija: depende del inversor de cada proyecto. Puede pedirla como entrada. Es conocimiento técnico general, sin fuente mexicana verificada.

### Gaps
- Sin fuente oficial mexicana que defina MWp: "sin fuente verificada".
- No hallé comunicado primario de CFE o CENACE con la cifra de julio de 2026 ni el máximo oficial del SIN en 2025. [Reforma](https://www.reforma.com/toca-record-demanda-de-electricidad-en-el-pais-cfe/ar3255666) devolvió error 403.
- No extraje el máximo del SIN del Reporte de Confiabilidad 2024; la búsqueda de texto solo dio BCA y BCS.

## 6. CEL, generación distribuida, autoconsumo y umbrales en MW

### Takeaway
El requisito de CEL es 13.9% para 2025 y 2026; 2027 a 2029 siguen sin publicarse. "1 CEL = 1 MWh" no está en la LSE: viene de disposiciones de la CRE de 2016. El umbral central es 0.7 MW: abajo, Generadora Exenta y Generación Distribuida; igual o arriba, permiso.

### Cited Findings

**CEL**

| Punto | Texto o dato | Fuente |
|---|---|---|
| Definición | "Título emitido por la CNE que acredita la producción de un monto determinado de energía eléctrica a partir de Energías Limpias, y que sirve para cumplir los requisitos asociados al consumo de los Centros de Carga" | LSE art. 3, fr. VII |
| Equivalencia | "con la finalidad de emitir un CEL cada vez que las fracciones acumulen un MWh" | [Resolución RES/174/2016 de la CRE, 10-mar-2016, DOF](https://dof.gob.mx/nota_detalle_popup.php?codigo=5431464), texto previo a la disposición 33 (estado actual no confirmado; el RLSE art. 182 ordena nuevas disposiciones de CNE y SENER) |
| Cómo se fija el requisito | "como una proporción del total de la Energía Eléctrica consumida en los Centros de Carga" | LSE art. 143; RLSE art. 186 |
| Quién está obligado | "Las Suministradoras, los Usuarios Calificados Participantes del Mercado y las Usuarias Finales que se suministren por autoconsumo, sean de carácter público o particular" | LSE art. 144 |
| Calendario legal | "En el primer cuatrimestre de cada año calendario, la Secretaría debe establecer los requisitos [...] a ser cumplidos durante los tres años posteriores" | LSE art. 145 |
| Vigencia | "tienen una vigencia de 30 meses a partir de la fecha de su otorgamiento" | LSE art. 146 |
| Condición de esa vigencia | "El inicio de la vigencia [...] está condicionado al comunicado que emita la CNE para señalar que el sistema electrónico ha concluido su actualización"; los CEL anteriores "conservan su validez" hasta su liquidación o cancelación | RLSE Transitorio Sexto |
| Requisito vigente | 13.9% para 2025 y 2026, DOF 17-ago-2026. CEL requeridos = porcentaje × energía total recibida en el Centro de Carga en MWh | [Mijares](https://www.mijares.mx/en/noticias/publica-sener-requisitos-para-la-adquisicion-de-cel-para-2025-y-2026), [Cuatrecasas](https://www.cuatrecasas.com/es/spain/publico/art/sener-cels-requisitos-2025-2026). Hay una discrepancia sobre desde cuándo es efectivo ([AI Regula](https://airegulasolutions.com/Post/certificados-energias-limpias-2025-2026/36149) vs. Cuatrecasas) |
| 2027 a 2029 | Sin porcentaje publicado; SENER debe determinarlos con la metodología que emita | Mijares; [El Heraldo](https://heraldodemexico.com.mx/edicion-impresa/2026/8/18/ratifican-cuota-de-energias-limpias-871160.html); RLSE art. 185 |
| Almacenamiento | Los SAE no generan CEL, según un resumen de lineamientos de abril de 2026 | [Energía Real](https://www.energiareal.mx/blog/seis-meses-que-reescribieron-las-reglas-del-sector-electrico-de-2026), fuente no oficial |
| Generación distribuida | Pueden recibir CEL si los representa una Suministradora y cumplen medición | RLSE art. 188 |
| Cogeneración eficiente | CEL "por el porcentaje de energía libre de combustible fósil que generen, de acuerdo con el valor que se determine en el dictamen técnico vigente" | RLSE art. 191 |
| Registro | La CNE lleva un registro público de CEL | LPTE art. 61 |
| Emisiones | Las disposiciones de CEL "deben considerar el nivel de emisiones reales de cada tecnología y de cada permisionario" | LPTE art. 60 |

**Umbrales de capacidad**

| Umbral | Consecuencia | Artículo |
|---|---|---|
| Menor a 0.7 MW | "son Generadoras Exentas y no requieren permiso para generar energía eléctrica" | LSE art. 19 |
| Menor a 0.7 MW en circuito con alta concentración de Centros de Carga | Generación Distribuida | LSE art. 25; art. 3, fr. XXII |
| Igual o mayor a 0.7 MW | "deben contar con permiso de generación vigente" | LSE art. 19 |
| Cualquier capacidad, solo para emergencias o interrupciones | "no requieren permiso" | LSE art. 19 |
| Igual o mayor a 0.7 MW, uso propio en sitio | Autoconsumo | LSE art. 30 |
| Entre 0.7 y 20 MW, autoconsumo interconectado | "pueden tener un trámite simplificado" | LSE art. 30; RLSE art. 58 |
| Hasta 20 MW, autoconsumo aislado | Exento de Manifestación de Impacto Social | RLSE art. 54 |
| Igual o mayor a 0.7 MW, para vender | Generación para el mercado | LSE art. 35 |
| Micro-red igual o menor a 0.7 MW | "está exenta de permiso de generación" | RLSE art. 172 |
| SAE no asociado a central o carga, igual o mayor a 0.7 MW | "requieren permiso de almacenamiento otorgado por la CNE" | RLSE art. 193 |
| Micro-Red menor a 5 MW de demanda máxima | Regla heredada de 2015 | BME 2.1.78 |

Todos en `public/data/Ley_Sector_Electrico_chunks.json` y `public/data/RLSE_chunks.json`.

**Otras reglas útiles**

- Figuras de generación: Generación Distribuida, Autoconsumo y Generación para el Mercado (LSE art. 17). Autoconsumo aislado no interconectado (art. 31).
- Excedentes en autoconsumo interconectado: se inyectan "sin contraprestación" o se venden, con condiciones, "de manera exclusiva a la Empresa Pública del Estado" (LSE art. 32).
- Protección contra inyección: dispositivo "de potencia inversa o protección de bajo consumo" (RLSE art. 57).
- Cogeneración: modalidad de permiso en LSE art. 41; energía de "centrales de cogeneración eficiente" es limpia "en términos de los criterios de eficiencia emitidos por la CNE" (art. 3, fr. XXI, inciso k). La capacidad autorizada es "únicamente para la potencia que pueda obtenerse utilizando la energía térmica no aprovechada" (art. 42).
- Instrumentos de 2025 y 2026 mencionados por una fuente no oficial: disposiciones de autoconsumo de la CNE (dic-2025), lineamientos de almacenamiento y cogeneración (abr-2026), Ventanilla Única de Autoconsumo de 0.7 a 20 MW (may-2026) ([Energía Real](https://www.energiareal.mx/blog/seis-meses-que-reescribieron-las-reglas-del-sector-electrico-de-2026); cogeneración también en [pv magazine](https://www.pv-magazine-mexico.com/2026/05/21/la-cne-emite-nuevas-reglas-para-generacion-electrica-en-modalidad-de-cogeneracion/)). No abrí los DOF.
- Usuario Calificado: la LSE lo define por registro ante la CNE, sin cifra (art. 3, fr. LXIV). La LIE remitía a niveles fijados por SENER (art. 59).

### Inferences
- Caso frontera de exactamente 0.7 MW: la LSE art. 19 exige permiso y el RLSE art. 172 exime a la micro-red "igual o menor". El sitio debe mostrar ambos textos.
- El requisito se publicó en agosto de 2026, fuera del primer cuatrimestre del art. 145 y cuando 2025 ya había terminado. Una calculadora de CEL debe limitarse a años con porcentaje publicado.

### Gaps
- No abrí el Acuerdo del DOF del 17-ago-2026: reglas de redondeo, exenciones y traslado de CEL sin confirmar.
- No hallé el comunicado de la CNE del Transitorio Sexto: se desconoce si los 30 meses ya corren.
- Precio de mercado de los CEL: sin fuente oficial verificada.
- Umbral vigente de Usuario Calificado en MW: sin fuente verificada en esta sesión.

## 7. Factor de emisión del Sistema Eléctrico Nacional

### Takeaway
El valor oficial más reciente que encontré es 0.444 tCO2e/MWh, correspondiente a 2024. A mayo de 2026 el de 2025 seguía en proceso.

### Cited Findings
- SEMARNAT, aviso del 29-may-2026 al Registro Nacional de Emisiones: "se encuentra en proceso la estimación y publicación del Factor de Emisión del Sistema Eléctrico Nacional correspondiente a 2025 (a cargo de la Secretaría de Energía) [...] se deberá utilizar el factor de emisión del Sistema Eléctrico Nacional 2024 [...] 0.444 tCO2e / MWh" ([aviso](https://www.gob.mx/cms/uploads/attachment/file/1081506/aviso_factor_de_emision_electrico_coa_2026.pdf)).
- Valor anterior: 0.438 tCO2e/MWh para 2023 ([aviso 2023](https://www.gob.mx/cms/uploads/attachment/file/896217/aviso_fesen_2023.pdf), dato de resumen de búsqueda; no abrí el PDF).
- El aviso de 2024 proviene de una notificación de la CRE ([aviso 2024](https://www.gob.mx/cms/uploads/attachment/file/981194/aviso_fesen_2024.pdf), resumen de búsqueda; publicado el 28-feb-2025 según [Holland & Knight](https://www.hklaw.com/-/media/files/insights/publications/2025/03/mexicoenvironmentalinsights_march2025_en.pdf)).
- Quién lo publica según la ley: la CNE debe "Elaborar y publicar anualmente, en coordinación con la Secretaría de Medio Ambiente y Recursos Naturales, el factor de emisión del Sistema Eléctrico Nacional" (LPTE art. 14, fr. III, `public/data/LPTE_chunks.json`). La metodología se somete a opinión del Consejo (RLPTE art. 105, fr. II).

### Inferences
- El sitio debe rotular "factor 2024" y no "factor vigente 2026". Sirve para emisiones indirectas por electricidad consumida en el reporte al registro; aplicarlo a una central particular sería un mal uso.

### Gaps
- No encontré publicación posterior al 29-may-2026 con el factor de 2025; una consulta a fondo del portal de la CNE sigue pendiente.
- La LPTE asigna la tarea a la CNE y el aviso de SEMARNAT dice "a cargo de la Secretaría de Energía". No resuelvo esa diferencia.

## 8. Calculadoras: cuáles sí, con qué fórmula, y cuáles no

### Takeaway
Conviene ofrecer conversiones y cálculos cuyas entradas pone la persona o salen de una tabla oficial con fecha. No conviene ofrecer nada que prometa ingresos, precios por nodo, Potencia acreditada estimada o el recibo doméstico exacto.

### Cited Findings

**A. Fórmulas para ofrecer** (ejemplos calculados por mí)

| # | Calculadora | Fórmula y unidades | Entradas | Ejemplo | Fuente de datos o regla |
|---|---|---|---|---|---|
| 1 | Precio de energía | `$/MWh = $/kWh × 1,000` | Precio | 1.8674 $/kWh = 1,867.40 $/MWh; 365.39 $/MWh = 0.36539 $/kWh | Unidades: [DOF tarifas](https://dof.gob.mx/nota_detalle_popup.php?codigo=5795184), [CENACE](https://www.cenace.gob.mx/Docs/01_MECP/ReporteSemanal/2025/SIN%20Reporte%20MEM%20Sem%2001%202025%20Dic%2029%20a%20Ene%204.pdf) |
| 2 | Energía a partir de capacidad | `MWh = MW × horas × factor de planta` | MW, horas, factor | 10 MW × 8,760 h × 0.25 = 21,900 MWh | Aritmética; factor lo pone la persona |
| 3 | Precio de Potencia | `$/kW-mes = ($/MW-año) ÷ 1,000 ÷ 12`; inverso `× 12,000` | Precio neto, zona, año | SIN 2025: 4,397,797.01 → 366.48 $/kW-mes. BCA 172.82. BCS 567.84 | [Precio Neto](https://www.cenace.gob.mx/Docs/02_MBP/PrecioNetoPotencia/2025/Precio%20Neto%20de%20la%20Potencia%20en%202025%20(v2026%2009%2003)%20Rec%C3%A1lculo.pdf) |
| 4 | Potencia repartida en energía | `$/MWh ≈ ($/MW-año) ÷ (8,760 × FC)` | Precio, factor de carga | 4,397,797.01 con FC 1 = 502.03 $/MWh; con FC 0.57 = 880.76 $/MWh | Aproximación mía, no regla. 8,784 h en año bisiesto |
| 5 | Ingreso o pago por Potencia | `$ = MW-año × Precio Neto` | PAA notificada, zona, año | 50 MW-año × 4,397,797.01 = 219,889,850.50 $ | Comprobación: reproduce los montos oficiales (4,295.45 × 4,397,797.01 = 18,890,517,166.60) en el [Informe](https://www.cenace.gob.mx/Docs/02_MBP/InformesEjecutivos/Informe%20Ejecutivo%20MBP%202026%20A%C3%B1o%20de%20Producci%C3%B3n%202025%20(v2026-09-03)%20Rec%C3%A1lculo.pdf) |
| 6 | Precio Neto, explicativo | `max[0, p.u. × costo fijo − IMTGR]` | Los tres valores | 1.3749 × 3,812,112.33 − 843,476.23 = 4,397,797.01 | Mismo documento de Precio Neto |
| 7 | Factor de carga propio | `FC = kWh ÷ (kW máx × 24 × días)` | Consumo, demanda, días | 220,000 ÷ (500 × 24 × 30) = 0.611 | Definición numeral 3.1.2, [Acuerdo CNE](https://dof.gob.mx/nota_detalle_popup.php?codigo=5783862) |
| 8 | Demanda para capacidad | `mín{ Dmax_punta , Q ÷ (24 × d × FC_cat) }` | Dmax punta, kWh, días, categoría | mín{450, 220,000 ÷ (24 × 30 × 0.57) = 536.06} = 450 kW | Numeral 5.1.1 y Tabla 2, mismo Acuerdo |
| 9 | Demanda para distribución | `mín{ Dmax_mensual , Q ÷ (24 × d × FC_cat) }` | Dmax del mes, kWh, días, categoría | mín{500, 536.06} = 500 kW | Numeral 5.2.1 |
| 10 | Cargo sin medición de demanda o sin punta | `Q ÷ (24 × d × FC_cat)` | kWh, días, categoría | 50,000 ÷ (24 × 30 × 0.55) = 126.26 kW | Numeral 5.1.1 |
| 11 | Costo por tarifa horaria (estimado) | Suma de energía por periodo × cuota, más transmisión, CENACE y conexos × kWh, más distribución y capacidad × kW, más cargo fijo | kWh por periodo, kW, división, mes | Ver abajo: 585,587.19 $ antes de impuestos | Cuotas del [DOF de cada mes](https://dof.gob.mx/nota_detalle_popup.php?codigo=5795184) |
| 12 | ¿En qué periodo estoy? | Búsqueda en tablas por sistema, categoría, temporada, día y hora | Fecha, hora, sistema, categoría | Martes 14-jul-2026, 20:30, SIN, GDMTH: punta. Lista de festivos según LFT art. 74 | Tablas 4 a 7 del Acuerdo |
| 13 | ¿Soy DAC? | `promedio de 12 meses > límite` | 12 consumos, tarifa de localidad | Tarifa 1C con promedio 900 kWh/mes supera 850: DAC | [Ficha DAC](https://app.cfe.mx/Aplicaciones/CCFE/Tarifas/TarifasCREHogar/Tarifas/TarifaDAC.aspx) |
| 14 | CEL requeridos | `CEL = MWh consumidos × requisito` | MWh, año (solo 2025 o 2026) | 10,000 MWh × 13.9% = 1,390 CEL | LSE arts. 143–145; [Mijares](https://www.mijares.mx/en/noticias/publica-sener-requisitos-para-la-adquisicion-de-cel-para-2025-y-2026) |
| 15 | CEL generados | `CEL = MWh limpios`; en cogeneración `MWh × % libre de fósil` | MWh; % de dictamen | 1,000 MWh × 40% = 400 CEL | [RES/174/2016](https://dof.gob.mx/nota_detalle_popup.php?codigo=5431464); RLSE art. 191 |
| 16 | Emisiones por consumo | `tCO2e = MWh × 0.444` | MWh | 120 MWh = 53.28 tCO2e | [Aviso SEMARNAT](https://www.gob.mx/cms/uploads/attachment/file/1081506/aviso_factor_de_emision_electrico_coa_2026.pdf), factor 2024 |
| 17 | ¿Qué figura me toca? | Reglas por capacidad y uso | MW, uso, conexión | 0.5 MW: Generadora Exenta. 5 MW en autoconsumo interconectado: permiso con trámite simplificado posible | LSE arts. 19, 25, 30, 35; RLSE arts. 54, 58. Solo orientación con enlace al artículo |
| 18 | PML por componentes, explicativo | `PML = energía + pérdidas + congestión` | Tres valores en $/MWh | 900 + 40 − 15 = 925 $/MWh | LSE art. 3; BME 9.1.9 |

**Ejemplo completo de la fila 11.** GDMTH, División Bajío, julio de 2026, 30 días. Consumo 220,000 kWh (50,000 base, 140,000 intermedio, 30,000 punta), demanda máxima del mes 500 kW, demanda en punta 450 kW. Cuotas del [DOF](https://dof.gob.mx/nota_detalle_popup.php?codigo=5795184).

| Concepto | Cálculo | Pesos |
|---|---|---|
| Energía base | 50,000 × 0.8282 | 41,410.00 |
| Energía intermedia | 140,000 × 1.6161 | 226,254.00 |
| Energía punta | 30,000 × 1.8674 | 56,022.00 |
| Transmisión | 220,000 × 0.1801 | 39,622.00 |
| Operación del CENACE | 220,000 × 0.0076 | 1,672.00 |
| Servicios Conexos no MEM | 220,000 × 0.0069 | 1,518.00 |
| Distribución | 500 × 97.88 | 48,940.00 |
| Capacidad | 450 × 377.16 | 169,722.00 |
| Operación de la Suministradora | Fijo | 427.19 |
| **Total antes de impuestos y otros conceptos** | | **585,587.19** |

Costo medio: 2.66 $/kWh. No incluye IVA, derecho de alumbrado público ni ajustes por factor de potencia, que no verifiqué.

**B. Lo que NO se debe ofrecer**

| Calculadora | Por qué no | Qué ofrecer en su lugar |
|---|---|---|
| Recibo doméstico exacto (1–1F, DAC) | Los bloques y cuotas dependen de mes, temporada y localidad; la ficha de CFE no los da como texto y el sitio no los tiene. Hay un mecanismo tarifario aparte (LSE art. 159) | Enlace a CFE y calculadora de DAC |
| Ingreso por vender energía en un nodo | Requiere series de PML por NodoP que el sitio no tiene | Explicación de PML y conversión |
| Estimar la Potencia acreditada de una central | Depende de la disponibilidad en horas que se conocen después del año, de la capacidad de transmisión y de datos de CENACE (Base 11.1.5; Manual cap. 5) | Fila 5 con PAA que ponga la persona |
| Predecir horas críticas | Se identifican a más tardar en enero siguiente y dependen de las reservas reales | Mostrar las ya publicadas, por año |
| Proyectar el precio de Potencia | Cambió de 4,983,551.47 a 4,397,797.01 en un año; hay recálculos y las reglas están por actualizarse | Tabla histórica con versión y fecha |
| Ingreso por servicios conexos | Requiere precios por zona de reservas y programas por unidad | Glosario y unidades |
| Costo de cumplir CEL | Sin precio oficial verificado | Fila 14 solo en cantidad |
| CEL de 2027 en adelante | Porcentaje no publicado | Avisar que falta el dato |
| Fórmula de "demanda facturable" con FRI y FRB | No es del Acuerdo 2026; daría un número falso | Filas 8 y 9, con nota aclaratoria |
| Ahorro por solar o por excedentes | Requiere perfil horario, y los excedentes solo se venden a la Empresa Pública del Estado con condiciones (LSE art. 32) | Fila 12 y figura legal |
| Convertir MWp a MW de corriente alterna con proporción fija | No hay proporción oficial | Solo si la persona pone la relación |
| Cargo o bonificación por factor de potencia | No verificado en el Acuerdo 2026 | Advertir que no está incluido |

**C. Trampas para el público general**

1. **Hora pico, hora punta y hora crítica son tres cosas distintas** (tabla de la sección 4). La punta se conoce todo el año por adelantado; la hora crítica, solo después.
2. **"Potencia" y "Potencia"**: con minúscula es rapidez de producir energía; con mayúscula es el producto comercial (BME 2.1.97 y 11.1.4).
3. **MW-año no son MWh**, ni un kW-mes es un kWh.
4. **Precio de cierre, precio máximo y precio neto** son tres cifras diferentes: se cobra el neto.
5. **El MBP 2026 corresponde al año 2025.** Citar siempre "año de producción".
6. **Los informes se recalculan**: BCS cambió de 84.42 a 87.08 MW-año entre febrero y septiembre de 2026. Citar la versión.
7. **Precio de reserva en $/MWh** no es precio de energía entregada.
8. **PML no es tarifa.**
9. **Hay PML negativos** ([CENACE](https://www.cenace.gob.mx/Docs/01_MECP/ReporteSemanal/2025/SIN%20Reporte%20MEM%20Sem%2001%202025%20Dic%2029%20a%20Ene%204.pdf)).
10. **"Hora 20" en un informe de CENACE** se lee, por la convención de Hora Terminada, como de 19:00 a 20:00 ([MECP 1.3](https://www.cenace.gob.mx/Docs/14_REGLAS/Manuales/Manual%20de%20Mercado%20de%20Energ%C3%ADa%20de%20Corto%20Plazo%20%5bDOF%2017-06-16%5d.pdf); el Manual del MBP remite a esas convenciones, aunque el informe no lo repite). Los horarios tarifarios, en cambio, se escriben "20:00 - 22:00".
11. **"Demanda facturable" es de la tarifa anterior**; circula en blogs.
12. **Demanda contratada, máxima del mes, máxima en punta y demanda para cargos** son cuatro valores. Un error común es cobrar capacidad sobre la máxima del mes.
13. **Factor de carga de la categoría (0.57) no es el factor propio**: la fórmula usa el de la tabla oficial.
14. **Región, sistema y división** no son lo mismo: horarios por sistema, cuotas por una de 17 divisiones.
15. **La ficha de CFE cita A/158/2024**, pero las tarifas de 2026 se fundan en CT/11.SE/8-2025.
16. **Semipunta solo existe en DIST y DIT de Baja California.**
17. **En invierno no hay punta en Baja California ni en Baja California Sur**, para GDMTH según la Tabla 5.
18. **0.7 MW**: "igual o mayor" pide permiso; "menor" no. Las BME y la LIE todavía hablan de otro umbral y de "abasto aislado".
19. **"1 CEL = 1 MWh"** viene de disposiciones de 2016, no de la LSE.
20. **Los 30 meses de vigencia de los CEL** dependen de un comunicado de la CNE que no encontré.
21. **El factor 0.444** es de 2024 y sirve para consumo eléctrico, no para una planta concreta.
22. **Récord de demanda**: 54,124 MW y 54,300 MW son del mismo episodio en prensa; no confundir con capacidad instalada ni con MWp.

### Inferences
- Toda calculadora con valores oficiales debe mostrar instrumento, fecha y versión, y dejar editar el dato, porque cuotas, precios y requisitos cambian por mes o por año.
- Orden sugerido para el sitio, por valor y bajo riesgo: conversiones (1, 3), factor de carga y demandas (7 a 10), periodo horario (12), CEL (14), emisiones (16), figura legal (17). Dejaría costo por tarifa (11) para una segunda fase, porque obliga a mantener 17 divisiones por mes.
- Los enlaces directos del sitio pueden ir a LSE, RLSE, LPTE y RLPTE tras confirmar el registro en `leyes`. Las BME, los Manuales y los acuerdos deben ir como enlace externo al DOF o a CENACE, salvo que se carguen al acervo.

### Gaps
- La fila 11 no se comparó contra un recibo real de CFE. Conviene validarla con un recibo antes de publicarla.
- Sin revisar: IVA, derecho de alumbrado público, tarifas para Participantes del Mercado y cargos de usuarios calificados.
- No verifiqué un calendario oficial de festivos para la fila 12 más allá de la referencia al art. 74 de la Ley Federal del Trabajo y acuerdos presidenciales.
