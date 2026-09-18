> **Estado posterior:** los 12 instrumentos fueron corregidos en Supabase. Ver [correcciones y verificación](../reparacion-2026-09-17/CORRECCIONES.md). Este informe conserva la fotografía anterior; el conteo de transitorios del RLSH se rectificó a 32.

# Auditoría del acervo cargado — 17 de septiembre de 2026

**12 instrumentos y 1,749 fragmentos examinados. Nueve instrumentos tienen errores de fragmentación confirmados; los otros tres requieren limpieza o metadatos. No se modificó Supabase.**

Hay 33 artículos o numerales sin un fragmento correctamente identificado: 29 están unidos o desplazados a otro fragmento y 4 están rotulados con el número truncado. El texto localizado en otro fragmento no se considera perdido. Además hay referencias internas convertidas en disposiciones, bloques de transitorios mezclados y tres fechas incorrectas.

| Instrumento | Fragmentos | Resultado |
|---|---:|---|
| RLSE | 323 | 16 artículos carecen de identificación correcta: 12 están unidos a otros y 4 tienen el número truncado. El transitorio Octavo también fue cortado por una referencia al Noveno. |
| LSE | 200 | Seis artículos están unidos al anterior. Se mezclaron transitorios de la ley y del decreto y se creó un falso transitorio con una referencia a otros artículos del decreto. |
| LPTE | 110 | Los artículos 14 y 66 están unidos al anterior. Se mezclaron transitorios de la ley y del decreto y se creó un falso transitorio con una referencia del decreto. |
| LGTAIP | 234 | Cuatro artículos están unidos al anterior. El transitorio Décimo Quinto fue partido por una referencia interna y el Décimo Séptimo quedó mal identificado. |
| LGEC | 56 | El artículo 44 está dentro del 43. La fecha de publicación almacenada también es incorrecta. |
| PODECOBI-LIN | 37 | Los lineamientos 9 y 16 quedaron dentro del preámbulo; 13 y 14 dentro del lineamiento 12. Hay 35 fragmentos ordinarios para 39 lineamientos. |
| SAEE | 154 | El numeral 3.13 fue cortado al citar 3.12, creando un segundo fragmento etiquetado 3.12. Hay pies de impresión dentro del texto. |
| RLSH | 369 | Los 336 artículos tienen identificación individual. Dos referencias dentro de transitorios se convirtieron en fragmentos adicionales: Tercero y Artículo Transitorio. |
| PODECOBI-DEC | 18 | Una referencia al artículo 89 constitucional se convirtió en un artículo del decreto. El decreto tiene 13 artículos ordinales, además de 3 transitorios. |
| DACG-PV | 10 | Los 8 artículos y el transitorio único están identificados. Hay pies de impresión y fecha de publicación incorrecta. |
| RISENER | 87 | Los 78 artículos y 7 transitorios están identificados, además de la fórmula de expedición. La fecha guardada corresponde a la firma y no a la publicación; el cierre está unido al último transitorio. |
| RLPTE | 151 | Los 136 artículos y 13 transitorios están identificados, además de la fórmula de expedición. No se confirmaron fusiones o falsos cortes de disposiciones; hay encabezados y firmas unidos al cuerpo de fragmentos. |

## Cómo se comprobó

Se exportaron únicamente leyes, artículos y temas con lectura pública paginada y conteos exactos. La fotografía guarda los UUID actuales y un hash. Se comprobaron secuencias, identificadores, tipos, orden, texto vacío y marcadores editoriales. No hay contenido, identificadores ni índices FTS nulos/vacíos en las 1,749 filas consultadas; tampoco órdenes duplicados por instrumento. Eso no garantiza una fragmentación correcta.

Se descargaron las 12 fuentes oficiales enlazadas por el catálogo. Para LSE, el enlace devuelve el decreto completo de 258 páginas: el cotejo se delimitó a su ley, entre los artículos de expedición Tercero y Cuarto. Para LGEC se distinguieron las reformas a otras leyes incluidas en el mismo decreto. Se guardaron fuentes, hashes, extracción y resultados por fila.

El parser nuevo se utilizó solo para localizar candidatos: no se tomó su resultado como verdad jurídica ni como reemplazo automático. También presenta diferencias y falsos positivos en algunas fuentes; cada reparación debe cotejarse. Se confirmaron los casos señalados con el texto almacenado y la fuente. Se inspeccionaron visualmente las páginas 12 del RLSE y 8 de LPTE.

La auditoría cubre estructura y fallos encontrados; no es una certificación tipográfica integral, de todas las tablas, ni una revisión de vigencia. Las diferencias de signos o de longitud del análisis automático no se clasificaron por sí solas como pérdida de texto.

Ocho instrumentos carecen de filas en `temas`; seis de ellos sí tienen estructura relevante en su fuente. Esto se registra aparte de los errores de corte. Algunos artículos conservan jerarquía aunque falte la tabla de temas.

## RLSE — Cortes confirmados

Reglamento de la Ley del Sector Eléctrico

16 artículos carecen de identificación correcta: 12 están unidos a otros y 4 tienen el número truncado. El transitorio Octavo también fue cortado por una referencia al Noveno.

[Fuente oficial](https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LSE.pdf) · UUID del instrumento: `7b6d37f8-5fd5-485e-bc5d-640a9b234950`

### Artículo 32 sin fragmento correctamente identificado

Registro: `61f924c5-16e0-4510-ac1e-c33317b98119` · Etiqueta actual: **Artículo   3**

Texto almacenado (extracto):

```text
2. La revocación de un permiso o autorización no exime a la persona permisionaria o autorizada de las 
 responsabilidades y obligaciones contraídas durante su vigencia, ni de la obligación de resarcir aquellos daños o 
 perjuicios que correspondan en términos de las disposiciones jurídicas aplicables. 
 La persona titular de un permiso o autorización que haya sido revocada, así como las personas que ejerzan 
 control sobre dicho titular, están imposibilitados para obtener otro permiso o autorización para la misma a ctividad 
 durante un plazo de cinco años, contado a partir de que se encuentre firme la resolución respectiva. 
 TÍTULO SEGUNDO 
 DE LA JUSTICIA ENERGÉTICA 
 Capítulo I 
 De la Justicia Energética
```

Fuente o explicación del cotejo:

La revocación de un permiso o autorización no exime a la persona permisionaria o autorizada de las
responsabilidades y obligaciones contraídas durante su vigencia, ni de la obligación de resarcir aque

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 45 sin fragmento correctamente identificado

Registro: `9d71eaad-520c-4d9f-8813-66ccb2bc4d3a` · Etiqueta actual: **Artículo   4**

Texto almacenado (extracto):

```text
5. El excedente de ingresos que resulte de la gestión de pérdidas técnicas en el Mercado Eléctrico 
 Mayorista, destinado al Fondo, se debe calcular a partir de la diferencia entre: 
 I. El valor neto que resulta del componente de pérdidas de los Precios Margi nales Locales en cada nodo, 
 al cobrar la cantidad de energía eléctrica retirada en cada nodo y pagar la cantidad de energía 
 eléctrica inyectada en cada nodo en el Mercado Eléctrico Mayorista, y 
 II. El valor neto que resulta del componente de energía de los Precios Marginales Locales en cada nodo, 
 al cobrar la cantidad de energía eléctrica retirada en cada nodo y pagar la cantidad de energía 
 eléctrica inyectada en cada nodo en el Mercado Eléctrico Mayorista, así como los demás a…
```

Fuente o explicación del cotejo:

El excedente de ingresos que resulte de la gestión de pérdidas técnicas en el Mercado Eléctrico
Mayorista, destinado al Fondo, se debe calcular a partir de la diferencia entre:
I.  El valor neto que r

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 58 sin fragmento correctamente identificado

Registro: `87a728dd-3d74-478a-a966-c395e4b10905` · Etiqueta actual: **Artículo   57.**

Texto almacenado (extracto):

```text
…r cuanto hace 
 al supuesto a que se refiere el artículo 32, fracción II de la Ley. 
 Art ículo 58. El trámite simplificado para la gestión y, en su caso, obtención de los permisos de generación para 
 autoconsumo modalidad interconectado con Capacidad Instalada de entre 0.7 y 20 MW, está sujeto a los 
 lineamientos que, para tal efecto publique la CNE, los cuales deben prever, como mínimo, lo siguiente: 
 I. Requisitos simplificados generales: 
 a ) Descripción general del proyecto, y 
 b ) Contenido mínimo para el programa simplificado de obras, y 
 II. El plazo de respuesta, mismo que no debe ser mayor al previsto en el artículo 25 del presente 
 reglamento.
```

Fuente o explicación del cotejo:

El trámite simplificado para la gestión y, en su caso, obtención de los permisos de generación para
autoconsumo modalidad interconectado con Capacidad Instalada de entre 0.7 y 20 MW, está sujeto a los

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 71 sin fragmento correctamente identificado

Registro: `2182cf99-c968-49b8-87f9-9db9be1d7f3c` · Etiqueta actual: **Artículo   70.**

Texto almacenado (extracto):

```text
…to de selección de las personas particulares con los que se desarrolle el proyecto. 
 A rtículo 71. Una vez que haya sido aprobado el proyecto por su consejo de administración, la Empresa Pública 
 del Estado debe llevar a cabo el procedimiento para la selección de las personas particulares en apego a los 
 principios de transparencia, racionalid ad, eficiencia, oportunidad y rendición de cuentas, de conformidad con los 
 lineamientos que para tal efecto emita el consejo de administración, los cuales deben ser publicados en el Diario 
 Oficial de la Federación.
```

Fuente o explicación del cotejo:

Una vez que haya sido aprobado el proyecto por su consejo de administración, la Empresa Pública
del Estado debe llevar a cabo el procedimiento para la selección de las personas particulares en apego a

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 74 sin fragmento correctamente identificado

Registro: `f568eb57-907e-4963-8abd-4978c0330be1` · Etiqueta actual: **Artículo   73.**

Texto almacenado (extracto):

```text
… las inversiones que se hayan 
 efectuado, el cual no debe exceder de treinta años. 
 A rtículo 74. Para la ejecución de los proyectos bajo esquemas para el desarrollo mixto se pueden constituir 
 instrumentos, vehículos jurídicos o financieros de propósito específico, de conformidad con la legislación aplicable. 
 El instrumento o vehículo juríd ico o financiero que se elija para el desarrollo de los proyectos bajo esquemas para 
 el desarrollo mixto debe establecer al menos, las condiciones generales de operación y mantenimiento, las acciones 
 necesarias que aseguren la actualización tecnológica que garantice la operación eficiente durante la vida útil de los 
 proyectos y el destino de los activos al término de la vigencia o terminación del proyecto. 
 Asimismo, debe incorporar los términos de salida de las partes en cualquier momento…
```

Fuente o explicación del cotejo:

Para la ejecución de los proyectos bajo esquemas para el desarrollo mixto se pueden constituir
instrumentos, vehículos jurídicos o financieros de propósito específico, de conformidad con la legislació

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 77 sin fragmento correctamente identificado

Registro: `66054559-bd97-463e-b1ab-6bae8115c482` · Etiqueta actual: **Artículo   76.**

Texto almacenado (extracto):

```text
…etaría de Servicios Parlamentarios 
 Nuevo Reglamento DOF 03 - 10 - 2025 
 20 de 71 
 A rtículo 77. En el esquema de producción de largo plazo, el particular debe construir, financiar, operar y 
 mantener la Central Eléctrica, su infraestructura asociada y obras accesorias, por lo cual, la Empresa Pública del 
 Estado no aporta capital para el de sarrollo del proyecto.
```

Fuente o explicación del cotejo:

En el esquema de producción de largo plazo, el particular debe construir, financiar, operar y
mantener la Central Eléctrica, su infraestructura asociada y obras accesorias, por lo cual, la Empresa Púb

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 79 sin fragmento correctamente identificado

Registro: `22c9b7ed-3005-487f-a5db-2af1f734606f` · Etiqueta actual: **Artículo   78.**

Texto almacenado (extracto):

```text
… Asociados a partir de la entrada en operación comercial de la Central 
 Eléctrica. 
 Artícul o 79. La transferencia de activos es optativa para la Empresa Pública del Estado, la cual debe ser sin 
 costo y estar sujeta a las condiciones técnicas convenidas. 
 Las partes deben establecer en el contrato las condiciones de transferencia de los activos al término de la 
 vigencia o terminación de este.
```

Fuente o explicación del cotejo:

La transferencia de activos es optativa para la Empresa Pública del Estado, la cual debe ser sin
costo y estar sujeta a las condiciones técnicas convenidas.
Las partes deben establecer en el contrato 

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 123 sin fragmento correctamente identificado

Registro: `17fb8ef4-905f-46f2-bbd5-85b9be800226` · Etiqueta actual: **Artículo   12**

Texto almacenado (extracto):

```text
3. La solicitud para la aprobación y expedición de las Tarifas Eléctricas, contraprestaciones, precios y 
 costos, así como de su modificación, se debe sujetar al procedimiento que se establezca en las disposiciones 
 administrativas de carácter general que pa ra tal efecto emita la CNE, en coordinación con la Secretaría.
```

Fuente o explicación del cotejo:

La solicitud para la aprobación y expedición de las Tarifas Eléctricas, contraprestaciones, precios y
costos, así como de su modificación, se debe sujetar al procedimiento que se establezca en las dis

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 134 sin fragmento correctamente identificado

Registro: `2fae0b00-1431-43a8-ad56-4b5a6b168b4c` · Etiqueta actual: **Artículo   133.**

Texto almacenado (extracto):

```text
…er 
 considerado como instalación de una Usuaria Final individual en Baja Tensión. 
 A rtículo 134. Para el caso de las Aportaciones referidas en el presente Capítulo, cuando para la ejecución de las 
 Obras Específicas, de Ampliación, de Modificación, de refuerzo, se requiera efectuar gastos adicionales para la 
 adquisición de predios, la cons titución de servidumbres de paso, realización de estudios de impacto ambiental o de 
 Impacto Social, el pago de derechos para la obtención de permisos o el pago de otros trabajos en inmuebles de 
 terceras personas, entre otros, su gestión e importe debe ser cubierto por la Solicitante.
```

Fuente o explicación del cotejo:

Para el caso de las Aportaciones referidas en el presente Capítulo, cuando para la ejecución de las
Obras Específicas, de Ampliación, de Modificación, de refuerzo, se requiera efectuar gastos adiciona

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 185 sin fragmento correctamente identificado

Registro: `0894988b-8a19-413b-accc-eb23db85dd2d` · Etiqueta actual: **Artículo   184.**

Texto almacenado (extracto):

```text
…abilite en términos del artículo 149 de la Ley y el 182 del 
 presente reglamento. 
 Art ículo 185. La Secretaría debe emitir las disposiciones administrativas de carácter general que prevean la 
 metodología para establecer el requisito de Certificados de Energías Limpias al que se refiere el artículo 145 de la 
 Ley. Para tales efectos, la CNE d ebe brindar apoyo técnico a la Secretaría.
```

Fuente o explicación del cotejo:

La Secretaría debe emitir las disposiciones administrativas de carácter general que prevean la
metodología para establecer el requisito de Certificados de Energías Limpias al que se refiere el artícul

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 207 sin fragmento correctamente identificado

Registro: `fbe38f85-3438-41d0-9640-afa875d1b504` · Etiqueta actual: **Artículo   206.**

Texto almacenado (extracto):

```text
… de cualquier persona a través de los medios que para 
 tal efecto se establezcan. 
 Art ículo 207. El Plan de Gestión Social del proyecto debe incorporar, al menos: 

REGLAMENTO DE LA LEY DEL SECTOR ELÉCTRI CO 
 C ÁMARA DE D IPUTADOS DEL H. C ONGRESO DE LA U NIÓN 
 Secr etaría General 
 Secretaría de Servicios Parlamentarios 
 Nuevo Reglamento DOF 03 - 10 - 2025 
 45 de 71 
 I. La estrategia de implementación de las medidas de prevención, mitigación, remediación, 
 compensación y ampliación de los Impactos Sociales; 
 II. La estrategia de comunicación y v inculación con las poblaciones ubicadas en el área de influencia y 
 otros actores, incluidos los sistemas o mecanismos de atención de quejas, y 
 III. Las demás previstas en las disposiciones administrativas de carácter general en materia de impacto 
 social. 
 A rtículo 208. Además de…
```

Fuente o explicación del cotejo:

El Plan de Gestión Social del proyecto debe incorporar, al menos:
I.  La estrategia de implementación de las medidas de prevención, mitigación, remediación,
compensación y ampliación de los Impactos S

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 208 sin fragmento correctamente identificado

Registro: `fbe38f85-3438-41d0-9640-afa875d1b504` · Etiqueta actual: **Artículo   206.**

Texto almacenado (extracto):

```text
… disposiciones administrativas de carácter general en materia de impacto 
 social. 
 A rtículo 208. Además de lo indicado en el artículo anterior, para las obras y actividades que, por sus 
 dimensiones o impacto, así lo prevean las disposiciones administrativas de carácter general en materia de impacto 
 social, el Plan de Gestión Social debe i ncorporar: 
 I. El Plan de abandono, cierre o desmantelamiento con las medidas de carácter social; 
 II. El Plan de reasentamiento, cuando se requiera; 
 III. Los indicadores de seguimiento del Plan de Gestión Social; 
 IV. La Estrategia de Beneficios Sociales Com partidos, y 
 V. El monto de inversión total anual estimado del Plan de Gestión Social.
```

Fuente o explicación del cotejo:

Además de lo indicado en el artículo anterior, para las obras y actividades que, por sus
dimensiones o impacto, así lo prevean las disposiciones administrativas de carácter general en materia de impac

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 265 sin fragmento correctamente identificado

Registro: `7c3d358c-23f2-4b4d-b3a8-6bbf3b6aad23` · Etiqueta actual: **Artículo   264.**

Texto almacenado (extracto):

```text
…ades de la Administración Pública Federal con actividades en 
 el Sector Eléctrico 
 A rtículo 265. La Secretaría y la CNE, en el ámbito de sus competencias, pueden solicitar a otras entidades de la 
 Administración Pública Federal Integrantes del Sector Eléctrico la presentación de información, informes, citar a 
 comparecer a sus representante s o administradores, o cualquier actividad que considere necesaria para realizar la 
 supervisión y vigilancia del cumplimiento de la Ley, el presente reglamento y la demás disposiciones administrativas 
 de carácter general y jurídicas aplicables, en términos de lo señalado en el artículo 10, fracción XXXIII y 11, fracción 
 XLII de la Ley. 
 Se entiende como otras entidades de la Administración Pública Federal Integrantes del Sector Eléctrico a 
 aquellas en las que la Secretaría no participe di…
```

Fuente o explicación del cotejo:

La Secretaría y la CNE, en el ámbito de sus competencias, pueden solicitar a otras entidades de la
Administración Pública Federal Integrantes del Sector Eléctrico la presentación de información, infor

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 272 sin fragmento correctamente identificado

Registro: `8d5a673a-272b-4a84-ab2a-af6a8c619e8e` · Etiqueta actual: **Artículo   271.**

Texto almacenado (extracto):

```text
… actividades e 
 instalaciones objeto de estas. 
 Capítulo II 
 De la Intervención 
 Ar tículo 272. Se entiende por intervención a la declaración mediante la cual, cuando existen irregularidades en la 
 administración u operación de algún permisionario, que pongan en riesgo la Calidad, Confiabilidad, Continuidad y 
 Seguridad del Suministro Eléct rico, la Secretaría determina la sustitución temporal de la persona permisionaria en la 
 administración y operación de sus bienes, derechos e instalaciones, cuando se configuren los supuestos 
 establecidos en la Ley, el presente reglamento y demás disposicio nes que de estos emanen. 
 En la declaratoria de intervención, la Secretaría debe precisar cuál es la información, documentación, hechos y 
 circunstancias, que la sustentan.
```

Fuente o explicación del cotejo:

Se entiende por intervención a la declaración mediante la cual, cuando existen irregularidades en la
administración u operación de algún permisionario, que pongan en riesgo la Calidad, Confiabilidad, 

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 287 sin fragmento correctamente identificado

Registro: `bf972da4-0139-4c58-b826-bebd7b92ab17` · Etiqueta actual: **Artículo   2**

Texto almacenado (extracto):

```text
87. En el supuesto de que, por así convenir al orden público e interés general, los bienes objeto de la 
 requisa, pasen al patrimonio de persona distinta del Estado, aquella debe cubrir el importe de la indemnización. 
 TÍTULO DÉCIMO 
 DEL CONSEJO CONSULTIVO PA RA EL FOMENTO DEL SECTOR ELÉCTRICO 
 Capítulo I 
 Integración del Consejo Consultivo
```

Fuente o explicación del cotejo:

En el supuesto de que, por así convenir al orden público e interés general, los bienes objeto de la
requisa, pasen al patrimonio de persona distinta del Estado, aquella debe cubrir el importe de la in

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 294 sin fragmento correctamente identificado

Registro: `9ce09f90-626f-41f7-b712-2b10d95c62d1` · Etiqueta actual: **Artículo   293.**

Texto almacenado (extracto):

```text
… Y DE LA 
 INVERSIÓN EN EL SECTOR ELÉCTRICO 
 Capítulo I 
 Disposiciones Generales 
 Artícul o 294. Para efectos de las compras, adquisiciones y contrataciones de proveeduría que realice el Estado 
 mexicano cuyo objeto sea para la generación eléctrica, la prestación del Servicio Público de Transmisión y 
 Distribución de Energía Eléctrica, la Secreta ría debe establecer en las bases de licitación, en el contrato o asociación 
 correspondiente, los porcentajes mínimos y demás condiciones de contenido nacional, conforme lo señalado en la 
 fracción XLVI del artículo 10 de la Ley. 
 Asimismo, la Secretaría pued e establecer requisitos que fomenten el uso de materiales bajos en emisiones y que 
 promuevan la economía circular.
```

Fuente o explicación del cotejo:

Para efectos de las compras, adquisiciones y contrataciones de proveeduría que realice el Estado
mexicano cuyo objeto sea para la generación eléctrica, la prestación del Servicio Público de Transmisió

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Corte falso dentro del Octavo

Registro: `671132d4-7f16-4622-910a-18a90832cc79` · Etiqueta actual: **Transitorio NOVENO**

Texto almacenado (extracto):

```text
de la Ley emita la Secretaría.
```

Fuente o explicación del cotejo:

La frase «de la Ley emita la Secretaría» continúa la referencia al transitorio Noveno dentro del Octavo; no es otro transitorio.

Acción pendiente: Reunir o reclasificar el texto con su disposición de origen. Preservar la trazabilidad del UUID actual.

## LSE — Cortes confirmados

Ley del Sector Eléctrico

Seis artículos están unidos al anterior. Se mezclaron transitorios de la ley y del decreto y se creó un falso transitorio con una referencia a otros artículos del decreto.

[Fuente oficial](https://www.diputados.gob.mx/LeyesBiblio/ref/lse/LSE_orig_18mar25.pdf) · UUID del instrumento: `8e404121-3502-4f47-937d-a43762c52da8`

### Artículo 13 sin fragmento correctamente identificado

Registro: `2938b70d-fd3e-4fc3-9941-6e2237a818d4` · Etiqueta actual: **Artículo 12.**

Texto almacenado (extracto):

```text
…structura estratégicos necesarios para cumplir con la política energética nacional. Ar tículo 13. - La ampliación y modernización de la Red Nacional de Transmisión y de las Redes Generales de Distribución deben realizarse conforme a los programas que al efecto autorice la Secretaría, escuchando la opinión de la CNE. LEY DEL SECTOR ELÉCTRICO C ÁMARA DE D IPUTADOS DEL H. C ONGRESO DE LA U NIÓN Secretaría General Secretaría de Servicios Parlamentarios Nueva Ley DOF 18 - 03 - 2025 16 de 56 Los programas de ampliació n y modernización de la Red Nacional de Transmisión y de las Redes Generales de Distribución que correspondan al Mercado Eléctrico Mayorista son autorizados por la Secretaría a propuesta del CENACE, la Transportista o la Distribuidora, con la opinión de la CNE. Tales programas deben contemplar objetivos de Justicia Energética, tra…
```

Fuente o explicación del cotejo:

La ampliación y modernización de la Red Nacional de Transmisión y de las Redes Generales
de Distribución deben realizarse conforme a los programas que al efecto autorice la Secretaría, escuchando la
o

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 43 sin fragmento correctamente identificado

Registro: `4a1f9e88-74c4-4b21-a4ad-fbfdb7e9f806` · Etiqueta actual: **Artículo 42.**

Texto almacenado (extracto):

```text
…ía térmica no aprovechada en los procesos industriales asociados a la cogeneración. A rtículo 43. - Se otorga despacho obligado a la energía eléctrica producida mediante el proceso de cogeneración, el cual se limita a: I. La producción de energía eléctrica derivada de la satisfacción de las necesidades directas o indirectas de energía térmic a de los procesos industriales; II. La capacidad de la Central Eléctrica de cogeneración la cual no debe ser mayor a las necesidades de energía térmica del proceso industrial, y III. Cualquier otra que establezca el Reglamento o las disposiciones administr ativas que emita la Secretaría. TÍTULO CUARTO DE LA TRANSMISIÓN Y DISTRIBUCIÓN DE ENERGÍA ELÉCTRICA Capítulo Único De la Transmisión y Distribución de Energía Eléctrica
```

Fuente o explicación del cotejo:

Se otorga despacho obligado a la energía eléctrica producida mediante el proceso de
cogeneración, el cual se limita a:
I.  La producción de energía eléctrica derivada de la satisfacción de las necesid

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 45 sin fragmento correctamente identificado

Registro: `bc331f56-b777-4d7f-b04b-baecdd7d57f3` · Etiqueta actual: **Artículo   44.**

Texto almacenado (extracto):

```text
… Distribuidora se deben sujetar a la coordinación y a las instrucciones del CENACE. Artícu lo 45. - Las condiciones generales para la prestación del Servicio Público de Transmisión y Distribución de Energía Eléctrica que expide la CNE, tienen por objeto determinar los derechos y obligaciones del prestador del servicio y de la persona usuaria, par a lo cual deben contener, como mínimo: I. Las tarifas aplicables; II. Las características, alcances y modalidades del servicio; III. Los criterios, requisitos y publicidad de información para ofrecer el acceso abierto, cuando sea técnicamente factible; IV. Las condiciones crediticias y de suspensión del servicio; V. El esquema de penalizaciones y bonificaciones ante el incumplimiento de los compromisos contractuales; VI. Las condiciones que, en su caso, puedan modificarse de común acuerdo con usu…
```

Fuente o explicación del cotejo:

Las condiciones generales para la prestación del Servicio Público de Transmisión y
Distribución de Energía Eléctrica que expide la CNE, tienen por objeto determinar los derechos y obligaciones
del pre

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 76 sin fragmento correctamente identificado

Registro: `d0fd84a5-498d-4273-add4-d53b406ccad8` · Etiqueta actual: **Artículo   75.**

Texto almacenado (extracto):

```text
…de su Demanda Controlable, a través de una Suministradora de Servicios Calificados. Art ículo 76. - Las personas titulares de los Centros de Carga que se suministren sin la representación de una Suministradora, se denominan Usuarios Calificados Participantes del Mercado. Con excepción de la prestación del Suministro Eléctrico a terceros y la r epresentación de Generadoras Exentas terceras, los Usuarios Calificados Participantes del Mercado pueden realizar las actividades de comercialización a que se refiere el artículo 60 de la presente Ley.
```

Fuente o explicación del cotejo:

Las personas titulares de los Centros de Carga que se suministren sin la representación de
una Suministradora, se denominan Usuarios Calificados Participantes del Mercado. Con excepción de la
prestaci

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 86 sin fragmento correctamente identificado

Registro: `6deed84d-cda0-4295-bed1-94948bf580ff` · Etiqueta actual: **Artículo   85.**

Texto almacenado (extracto):

```text
…e la Infraestructura y el Suministro de Electricidad en Materia de Electromovilidad Artí culo 86. - La Secretaría, a través del Reglamento y de disposiciones administrativas de carácter general, puede regular sobre la infraestructura y el suministro de electricidad necesaria para la electromovilidad. Para efectos del presente apartado se entien de por electromovilidad los sistemas de transporte terrestre basados en vehículos ligeros y pesados con un sistema de tracción eléctrica o sistema híbrido que toman energía de un sistema de suministro eléctrico y que se utilizan para transportar personas o bienes materiales.
```

Fuente o explicación del cotejo:

La Secretaría, a través del Reglamento y de disposiciones administrativas de carácter
general, puede regular sobre la infraestructura y el suministro de electricidad necesaria para la
electromovilidad

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 114 sin fragmento correctamente identificado

Registro: `0bc7e436-1b95-46fe-92a4-630ee33a8708` · Etiqueta actual: **Artículo   113.**

Texto almacenado (extracto):

```text
- Los Generadores, Comercializadores y Usuarios Calificados Participantes del M ercado pueden celebrar Contratos de Cobertura Eléctrica para realizar operaciones de compraventa relativas a la energía eléctrica y Productos Asociados en un nodo del Sistema Eléctrico Nacional, sujetándose a las obligaciones para informar al CENACE, previ stas por las Reglas del Mercado. Asimismo, pueden celebrar Contratos de Cobertura Eléctrica para LEY DEL SECTOR ELÉCTRICO C ÁMARA DE D IPUTADOS DEL H. C ONGRESO DE LA U NIÓN Secretaría General Secretaría de Servicios Parlamentarios Nueva Ley DOF 18 - 03 - 2025 36 de 56 adquirir o realizar operaciones relativas a Energías Limpias, sujetándose a la regulación que emita CNE para validar la titularidad de dichos cer…
```

Fuente o explicación del cotejo:

Los Generadores, Comercializadores y Usuarios Calificados pueden participar en el
Mercado Eléctrico Mayorista, previa celebración del contrato de Participante del Mercado con el CENACE y la
presentaci

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Referencia del decreto tratada como transitorio

Registro: `6096d529-6164-497e-8229-6f32b936e2df` · Etiqueta actual: **Transitorio ARTÍCULO CUARTO**

Texto almacenado (extracto):

```text
A ARTÍCULO DÉCIMO. - … … …
```

Fuente o explicación del cotejo:

ARTÍCULO CUARTO A ARTÍCULO DÉCIMO es material del decreto, no una disposición transitoria de la ley.

Acción pendiente: Reunir o reclasificar el texto con su disposición de origen. Preservar la trazabilidad del UUID actual.

### Dos bloques de transitorios comparten etiqueta

Registro: `7ecd7f54-44a4-4760-9f54-0f72df8d3b6b` · Etiqueta actual: **Transitorio PRIMERO.**

Texto almacenado (extracto):

```text
El presente Decreto entrará en vigor el día siguiente al de su publicación en el Diario Oficial de la Federación.
```

Fuente o explicación del cotejo:

La ley y el decreto de expedición tienen bloques propios. Deben conservarse y distinguirse, sin tratarlos como dos versiones del mismo artículo.

Acción pendiente: Separar los bloques y sus metadatos de pertenencia.

## LPTE — Cortes confirmados

Ley de Planeación y Transición Energética

Los artículos 14 y 66 están unidos al anterior. Se mezclaron transitorios de la ley y del decreto y se creó un falso transitorio con una referencia del decreto.

[Fuente oficial](https://www.diputados.gob.mx/LeyesBiblio/pdf/LPTE.pdf) · UUID del instrumento: `d19354e7-fbf9-427b-aa91-55017b027e0a`

### Artículo 14 sin fragmento correctamente identificado

Registro: `73cbbf7b-81d2-4838-9781-50e685395c47` · Etiqueta actual: **Artículo 13. -**

Texto almacenado (extracto):

```text
…tado y al sector privado, y 
 IV. Las demás que le señale su regulación orgánica. 
 Artí culo 14. - Para efectos de esta Ley, corresponde a la Comisión Nacional de Energía: 
 I. Coadyuvar a la identificación de las zonas de mayor potencial de Energías Limpias; 

LEY DE PLANEACIÓN Y TRANSICIÓN ENERGÉTICA 
 C ÁMARA DE D IPUTADOS DEL H. C ONGRESO DE LA U NIÓN 
 Se cretaría General 
 Secretaría de Servicios Parlamentarios 
 Nueva Ley DOF 18 - 03 - 2025 
 9 de 23 
 II. Expedir los modelos de contrato de interconexión y de contraprestación para la Gene ración Limpia 
 Distribuida; 
 III. Elaborar y publicar anualmente, en coordinación con la Secretaría de Medio Ambiente y Recursos 
 Naturales, el factor de emisión del Sistema Eléctrico Nacional; 
 IV. Brindar apoyo técnico a la Secretaría para la determinación d e las metas que se deben estable…
```

Fuente o explicación del cotejo:

Para efectos de esta Ley, corresponde a la Comisión Nacional de Energía:
I. Coadyuvar a la identificación de las zonas de mayor potencial de Energías Limpias;
II. Expedir los modelos de contrato de in

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 66 sin fragmento correctamente identificado

Registro: `da8a8b69-280d-46ae-8521-550a9dcc4a31` · Etiqueta actual: **Artículo 65. -**

Texto almacenado (extracto):

```text
…o asiento registral sin eliminar del Registro el asiento que 
 contenga el error. 
 Artícu lo 66. - La Comisión Nacional de Energía debe emitir o actualizar las disposiciones relacionadas con la 
 operación del registro de certificados. 
 Capítulo VII 
 Del Desarrollo Industrial
```

Fuente o explicación del cotejo:

La Comisión Nacional de Energía debe emitir o actualizar las disposiciones relacionadas con la
operación del registro de certificados.
Capítulo VII
Del Desarrollo Industrial

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Referencia del decreto tratada como transitorio

Registro: `b24e7517-7c92-4829-8a99-a8ac81479459` · Etiqueta actual: **Transitorio ARTÍCULO SEXTO**

Texto almacenado (extracto):

```text
A ARTÍCULO DÉCIMO. - … … ..
```

Fuente o explicación del cotejo:

ARTÍCULO SEXTO A ARTÍCULO DÉCIMO es material del decreto, no una disposición transitoria de la ley.

Acción pendiente: Reunir o reclasificar el texto con su disposición de origen. Preservar la trazabilidad del UUID actual.

### Dos bloques de transitorios comparten etiqueta

Registro: `ee74a6d9-fcb8-46ad-8c65-992c6c257f0a` · Etiqueta actual: **Transitorio PRIMERO.**

Texto almacenado (extracto):

```text
El presente Decreto entrará en vigor el día siguiente al de su publicación en el Diario Oficial de la 
 Federación.
```

Fuente o explicación del cotejo:

La ley y el decreto de expedición tienen bloques propios. Deben conservarse y distinguirse, sin tratarlos como dos versiones del mismo artículo.

Acción pendiente: Separar los bloques y sus metadatos de pertenencia.

## LGTAIP — Cortes confirmados

Ley General de Transparencia y Acceso a la Información Pública

Cuatro artículos están unidos al anterior. El transitorio Décimo Quinto fue partido por una referencia interna y el Décimo Séptimo quedó mal identificado.

[Fuente oficial](https://www.diputados.gob.mx/LeyesBiblio/pdf/LGTAIP.pdf) · UUID del instrumento: `e7297529-d3df-4e69-8c01-d3d6d70e3e55`

### Artículo 54 sin fragmento correctamente identificado

Registro: `ccf2b23c-4855-4c70-a9bb-3ac71b1bc0a9` · Etiqueta actual: **Artículo 53.**

Texto almacenado (extracto):

```text
…a 
 promoción e implementación de políticas y mecanismos de apertura institucional. 
 Art ículo 54. Los sujetos obligados, en el ámbito de su competencia, en materia de apertura deben: 
 I. Garantizar el ejercicio y cumplimiento de los principios de transparencia con sentido social, la 
 participación ciudadana, la rendición de cuentas, la innovaci ón y el aprovechamiento de la tecnología 
 que privilegie su diseño centrado en el usuario; 
 II. Implementar tecnología y datos abiertos incluyendo, en la digitalización de información relativa a 
 servicios públicos, trámites y demás componentes del actuar gub ernamental, la publicidad de datos de 
 interés para la población, principalmente de manera automática y sin incremento de la carga 
 administrativa, de conformidad con su disponibilidad presupuestaria, y 
 III. Procurar mecanismos que …
```

Fuente o explicación del cotejo:

Los sujetos obligados, en el ámbito de su competencia, en materia de apertura deben:
I.  Garantizar el ejercicio y cumplimiento de los principios de transparencia con sentido social, la
participación 

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 86 sin fragmento correctamente identificado

Registro: `15de49c0-3c48-467e-a72d-6fb446296955` · Etiqueta actual: **Artículo 85.**

Texto almacenado (extracto):

```text
… en los artículos 63 a 80 de esta Ley y demás disposiciones jurídicas 
 aplicables. 
 Artícu lo 86. Las acciones de vigilancia a que se refiere este Capítulo se realizarán de manera oficiosa por las 
 Autoridades garantes, a través de la revisión aleatoria o muestral y periódica al portal de Internet de los sujetos 
 obligados o a la Plataforma Nacion al.
```

Fuente o explicación del cotejo:

Las acciones de vigilancia a que se refiere este Capítulo se realizarán de manera oficiosa por las
Autoridades garantes, a través de la revisión aleatoria o muestral y periódica al portal de Internet 

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 138 sin fragmento correctamente identificado

Registro: `d4f9e2ba-4e4f-41b1-a232-bc8e9c544ce7` · Etiqueta actual: **Artículo 137.**

Texto almacenado (extracto):

```text
…ables estas mismas disposiciones, en el 
 cumplimiento a los recursos de revisión. 
 Artí culo 138. Cuando las Unidades de Transparencia determinen la notoria incompetencia por parte de los 
 sujetos obligados, dentro del ámbito de su aplicación, para atender la solicitud de acceso a la información, deberán 
 comunicarlo a la persona solicitante, d entro de los tres días posteriores a la recepción de la solicitud y, en caso de 
 poderlo determinar, señalar a la persona solicitante el o los sujetos obligados competentes. 
 Si los sujetos obligados son competentes para atender parcialmente la solicitud de acceso a la información, 
 deberán dar respuesta respecto de dicha parte.
```

Fuente o explicación del cotejo:

Cuando las Unidades de Transparencia determinen la notoria incompetencia por parte de los
sujetos obligados, dentro del ámbito de su aplicación, para atender la solicitud de acceso a la información, d

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Artículo 158 sin fragmento correctamente identificado

Registro: `734a77d6-af4c-47c4-bdde-4f3a0f967d34` · Etiqueta actual: **Artículo 157.**

Texto almacenado (extracto):

```text
… para que esta inicie, en su caso, el procedimiento de responsabilidad respectivo. 
 Artícu lo 158. El recurso será desechado por improcedente cuando: 
 I. Sea extemporáneo por haber transcurrido el plazo establecido en el artículo 144 de la presente Ley; 
 II. Se esté tramitando ante el Poder Judicial algún recurso o medio de defensa interpuesto por el 
 recurrente; 
 III. No actualice alguno de los supuestos previstos en el artículo 145 de la presente Ley; 
 IV. No se haya desahogado la prevención en los términos establecidos en el artículo 147 de la presente 
 Ley; 
 V. Se impugne la veracidad de la informac ión proporcionada; 
 VI. Se trate de una consulta, o 
 VII. El recurrente amplíe su solicitud en el recurso de revisión, únicamente respecto de los nuevos 
 contenidos.
```

Fuente o explicación del cotejo:

El recurso será desechado por improcedente cuando:
I.  Sea extemporáneo por haber transcurrido el plazo establecido en el artículo 144 de la presente Ley;
II.  Se esté tramitando ante el Poder Judicia

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Corte falso del Décimo Quinto

Registro: `d574ce36-1a91-48f5-8bfd-0ce28b0e8103` · Etiqueta actual: **Transitorio TERCERO**

Texto almacenado (extracto):

```text
del presente Decreto el Pleno del Instituto Nacional de Transparencia, Acceso a la Información y Protección 
 de Datos Personales deberá integrar, en la fecha de publi cación de este instrumento, un Comité de Transferencia 

LEY GENERAL DE TRANSPARENCIA Y ACCESO A LA INFORMACIÓN PÚBLICA 
 C ÁMARA DE D IPUTADOS DEL H. C ONGRESO DE LA U NIÓN 
 Secretaría General 
 Secretaría de Servicios Parlamenta rios 
 Nueva Ley DOF 20 - 03 - 2025 
 64 de 64 
 conformado por los Comisionados del mencionado Instituto y once personas servidoras públicas del mismo con al 
 menos el nivel de Dirección de área o e
[…]
ue sus integrantes 
 participarán con las diversas autoridades competentes para recibir los asuntos que se señalan en los transitorios 
 antes citados y realizar las demás acciones que se consideren necesarias para dichos efectos.
```

Fuente o explicación del cotejo:

Este texto continúa el transitorio Décimo Quinto después de la referencia a Décimo Tercero.

Acción pendiente: Reunir o reclasificar el texto con su disposición de origen. Preservar la trazabilidad del UUID actual.

### Décimo Séptimo mal identificado

Registro: `aeb089ab-04ef-4c9c-860e-ce2cbf77c947` · Etiqueta actual: **Transitorio DÉCIMO**

Texto almacenado (extracto):

```text
Sé ptimo. - La persona titular de la Secretaría Ejecutiva del Consejo del Sistema Nacional de Acceso a la 
 Información Pública propondrá las reglas de operación y funcionamiento que se señalan en el artículo 25, fracción 
 XV, de la Ley General de Transparencia y Acceso a la Información Pública, para que sean aprobadas en la 
 instalación de dicho Consejo.
```

Fuente o explicación del cotejo:

El contenido empieza «Sé ptimo. -» y completa el ordinal Décimo Séptimo; no es otro Décimo.

Acción pendiente: Reunir o reclasificar el texto con su disposición de origen. Preservar la trazabilidad del UUID actual.

## LGEC — Cortes confirmados

Ley General de Economía Circular

El artículo 44 está dentro del 43. La fecha de publicación almacenada también es incorrecta.

[Fuente oficial](https://www.dof.gob.mx/nota_detalle.php?codigo=5778439&fecha=19/01/2026#gsc.tab=0) · UUID del instrumento: `552fdbe9-91d1-4c6b-b1d2-4de35ad51f0c`

### Artículo 44 sin fragmento correctamente identificado

Registro: `c2030223-a403-469e-97f5-3908c138b1d0` · Etiqueta actual: **Artículo 43. -**

Texto almacenado (extracto):

```text
…eneral Secretaría de Servicios Parlamentarios Nueva Ley DOF 19 - 01 - 2026 19 de 20 A rtículo 44. - La persona productora, importadora o el Organismo Coordinador responsable de fuentes de generación o manejo del Producto, o materias reguladas por esta Ley o en el Reglamento debe proporcionar a la Secretaría los informes, o documentos conform e a las obligaciones previstas en la Gestión Circular inscrita en el Registro, dentro del plazo que establecen las disposiciones jurídicas aplicables. En caso de no cumplir con esta obligación se les aplicarán las sanciones administrativas previstas en la Ley General del Equilibrio Ecológico y la Protección al Ambiente.
```

Fuente o explicación del cotejo:

La persona productora, importadora o el Organismo Coordinador responsable de fuentes de generación o manejo del Producto, o materias reguladas por esta Ley o en el Reglamento debe proporcionar a la Se

Acción pendiente: Restituir la identidad y los límites del artículo cotejando todo su contenido.

### Fecha de publicación incorrecta

Registro: `552fdbe9-91d1-4c6b-b1d2-4de35ad51f0c` · Etiqueta actual: **leyes.fecha_publicacion**

Texto almacenado (extracto):

```text
12026-02-19
```

Fuente o explicación del cotejo:

2026-01-19

Acción pendiente: Corregir la fecha bibliográfica a partir de la publicación oficial; conservar separada la fecha de firma si se necesita.

## PODECOBI-LIN — Cortes confirmados

Acuerdo por el que se emiten los Lineamientos para los Polos de Desarrollo Económico para el Bienestar.

Los lineamientos 9 y 16 quedaron dentro del preámbulo; 13 y 14 dentro del lineamiento 12. Hay 35 fragmentos ordinarios para 39 lineamientos.

[Fuente oficial](https://www.dof.gob.mx/nota_detalle.php?codigo=5758079&fecha=22%2F05%2F2025#gsc.tab=0) · UUID del instrumento: `c05debf0-3748-4dac-9619-f1216a5fbd88`

### Lineamiento 9 en otro fragmento

Registro: `5d91c753-13fd-4f18-bd3d-ea0729aaff02` · Etiqueta actual: **Preámbulo**

Texto almacenado (extracto):

```text
…BIENESTAR DEL PROCEDIMIENTO PARA DETERMINAR LOS POLOS DE DESARROLLO ECONÓMICO PARA EL BIENESTAR 9 . Una vez que la Presidencia del Comité Intersecretarial de Promoción, a través de la persona titular de la Secretaría Técnica, reciba la propuesta para la determinación del Polo de Desarrollo Económico para el Bienestar presentada por la Entidad Federativa, en un plazo que no excederá de cinco días hábiles, debe remitirla a los demás integrantes del Comité Intersecretarial de Promoción, para que analicen y valoren la información y documentación presentada por la Entidad Federativa y emitan un dictamen de viabilidad en el ámbito de su competencia, en un plazo que no excederá de treinta días hábiles. 8/6/26, 12:17 DOF - Diario Oficial de la Federación https://www.dof.gob.mx/nota_detalle.php?codigo=5758079&fecha=22/05/2025&print=true 4/10 DE LA…
```

Fuente o explicación del cotejo:

Una vez que la Presidencia del Comité Intersecretarial de Promoción, a través de la persona titular de la Secretaría Técnica, reciba la propuesta para la determinación del Polo de Desarrollo Económico para el Bienestar presentada por la Entidad Federativa, en un plazo que no excederá de cinco días hábiles, debe remitirla a los demás integrantes del Comité Intersecretarial de Promoción, para que analicen y valoren la información y documentación presentada por la Entidad Federativa y emitan un dictamen de viabilidad en el ámbito de su competencia, en un plazo que no excederá de treinta días hábiles.

Acción pendiente: Crear un fragmento propio y retirar su texto del fragmento que lo absorbió.

### Lineamiento 13 en otro fragmento

Registro: `8f262dfb-135a-42ba-8320-ff7909e05348` · Etiqueta actual: **Lineamiento 12**

Texto almacenado (extracto):

```text
…ecidas en el propio Convenio, asegurando que las partes comprendan y cumplan con sus términos. 1 3. Las modificaciones al Convenio de Coordinación se realizarán conforme a los procedimientos establecidos dentro del mismo, incluyendo la posibilidad de agregar las adendas correspondientes. 14 . El Convenio de Coordinación tendrá validez una vez que haya sido firmado por las partes y publicado, conforme a los procedimientos establecidos.
```

Fuente o explicación del cotejo:

Las modificaciones al Convenio de Coordinación se realizarán conforme a los procedimientos establecidos dentro del mismo, incluyendo la posibilidad de agregar las adendas correspondientes.

Acción pendiente: Crear un fragmento propio y retirar su texto del fragmento que lo absorbió.

### Lineamiento 14 en otro fragmento

Registro: `8f262dfb-135a-42ba-8320-ff7909e05348` · Etiqueta actual: **Lineamiento 12**

Texto almacenado (extracto):

```text
…ablecidos dentro del mismo, incluyendo la posibilidad de agregar las adendas correspondientes. 14 . El Convenio de Coordinación tendrá validez una vez que haya sido firmado por las partes y publicado, conforme a los procedimientos establecidos.
```

Fuente o explicación del cotejo:

El Convenio de Coordinación tendrá validez una vez que haya sido firmado por las partes y publicado, conforme a los procedimientos establecidos.

Acción pendiente: Crear un fragmento propio y retirar su texto del fragmento que lo absorbió.

### Lineamiento 16 en otro fragmento

Registro: `5d91c753-13fd-4f18-bd3d-ea0729aaff02` · Etiqueta actual: **Preámbulo**

Texto almacenado (extracto):

```text
…lle.php?codigo=5758079&fecha=22/05/2025&print=true 5/10 DE LOS VEHÍCULOS DE PROPÓSITO ESPECIAL 16 . El Vehículo de Propósito Especial a que se refiere el artículo Décimo Segundo del Decreto, debe considerar los siguientes elementos: I. Determinación de la Institución financiera privada o Banca de desarrollo. II. Señalamiento del Gobierno Estatal. III. Conformación y operación del Comité Técnico en el que se incluya al Gobierno Federal para efectos de seguimiento y control del Vehículo de Propósito Especial. DE LOS DESARROLLADORES DE LOS REQUISITOS PARA EL OTORGAMIENTO DE LAS AUTORIZACIONES A LOS DESARROLLADORES DE LA CONVOCATORIA DEL CONCURSO PÚBLICO DE LAS ASIGNACIONES DIRECTA S DEL PROCEDIMIENTO DE ASIGNACIÓN DIRECTA DE LAS CAUSALES Y DEL PROCEDIMIENTO DE REVOCACIÓN DE LA AUTORIZACIÓN
```

Fuente o explicación del cotejo:

El Vehículo de Propósito Especial a que se refiere el artículo Décimo Segundo del Decreto, debe considerar los siguientes elementos:
I. Determinación de la Institución financiera privada o Banca de desarrollo.
II. Señalamiento del Gobierno Estatal.
III. Conformación y operación del Comité Técnico en el que se incluya al Gobierno Federal para efectos de seguimiento y control del Vehículo de Propósito Especial.

Acción pendiente: Crear un fragmento propio y retirar su texto del fragmento que lo absorbió.

## SAEE — Cortes confirmados

ACUERDO de la CNE por el que se emiten las DACG para la integración de SAE al SEN

El numeral 3.13 fue cortado al citar 3.12, creando un segundo fragmento etiquetado 3.12. Hay pies de impresión dentro del texto.

[Fuente oficial](https://sidof.segob.gob.mx/notas/docFuente/5785045) · UUID del instrumento: `d5562ad3-7682-4add-8cc9-7ee5994fdc1c`

### 3.13 partido por su referencia a 3.12

Registro: `6b1e977c-ba0e-4e78-b396-68776945925c` · Etiqueta actual: **3.12.**

Texto almacenado (extracto):

```text
de las Disposiciones, haya determinado que la carga del SAEE se realice a partir de energía eléctrica proveniente 
 de la RNT, puede presentar Ofertas de Compra en el Mercado de Energía de Corto Plazo para dicho propósito. 
 En caso de que el representante de la Central Eléctrica haya determinado que la carga del SAEE se realice utilizando la 
 energía generada por la propia Central, la Oferta de Venta de energía eléctrica y Servicios Conexos que ésta presente 
 en el Mercado de Energía de Corto Plazo debe considerar la energía disponible en MWh, descontando la energía 
 destinada a la carga del SAEE correspondiente.
```

Fuente o explicación del cotejo:

Debe continuar el numeral 3.13 (UUID 89994faa-472c-45f2-88f9-0b6516162225). El auténtico 3.12 tiene UUID 398c21fe-8157-4b80-8a8e-fafaf6335ded.

Acción pendiente: Reunir o reclasificar el texto con su disposición de origen. Preservar la trazabilidad del UUID actual.

## RLSH — Cortes confirmados

Reglamento de la Ley del Sector de Hidrocarburos

Los 336 artículos tienen identificación individual. Dos referencias dentro de transitorios se convirtieron en fragmentos adicionales: Tercero y Artículo Transitorio.

[Fuente oficial](https://www.dof.gob.mx/nota_detalle.php?codigo=5769153&fecha=03/10/2025#gsc.tab=0) · UUID del instrumento: `bdfc48ed-5ff9-4746-9251-6e1fdc989c58`

### Corte falso del Segundo

Registro: `3961528a-0292-47c4-a5b2-9cf99d653261` · Etiqueta actual: **Transitorio TERCERO**

Texto almacenado (extracto):

```text
de la Ley de Hidrocarburos, publicados en el Diario Oficial de la Federación el 31 de octubre de 2014.
```

Fuente o explicación del cotejo:

Continúa «Reglamento de las Actividades a que se refiere el Título Tercero de la Ley de Hidrocarburos» dentro del Segundo.

Acción pendiente: Reunir o reclasificar el texto con su disposición de origen. Preservar la trazabilidad del UUID actual.

### Corte falso del Décimo Segundo

Registro: `40752873-fa9e-4dd2-a872-6f4ae0f382c3` · Etiqueta actual: **Transitorio ARTÍCULO   TRANSITORIO**

Texto almacenado (extracto):

```text
deben cumplir con sus obligaciones mediante los mecanismos establecidos para tal efecto. La Secretaría o de la Comisión, según el caso, que reciba la información por parte de las personas Permisionarias debe enviar a la autoridad competente la información recibida para los efectos legales conducentes.
```

Fuente o explicación del cotejo:

La frase «del presente artículo transitorio deben cumplir…» pertenece al Décimo Segundo, no constituye otro transitorio.

Acción pendiente: Reunir o reclasificar el texto con su disposición de origen. Preservar la trazabilidad del UUID actual.

## PODECOBI-DEC — Cortes confirmados

Decreto por el que se otorgan estímulos fiscales en los Polos de Desarrollo Económico para el Bienestar.

Una referencia al artículo 89 constitucional se convirtió en un artículo del decreto. El decreto tiene 13 artículos ordinales, además de 3 transitorios.

[Fuente oficial](https://www.dof.gob.mx/nota_detalle.php?codigo=5758077&fecha=22/05/2025#gsc.tab=0) · UUID del instrumento: `ffa0dcbe-6f52-45da-bbbb-65f6410c2c9a`

### Artículo 89 constitucional confundido con artículo del decreto

Registro: `0eb1395e-5a9e-4a3a-a754-6367a7bbf8e5` · Etiqueta actual: **artículo 89**

Texto almacenado (extracto):

```text
, fracción I, de la Constitución Política de los Estados Unidos Mexicanos, con fundamento en los artículos 31, 32 Bis, 
33, 34 y 41 de la Ley Orgánica de la Administración Pública Federal, 33 de la Ley de Planeación y 39, primer párrafo, fracción III, 
del Código Fiscal de la Federación, y 
 CONSIDERANDO 
 Que, en términos del artículo 25, primer párrafo, de la Constitución Política de los Estados Unidos Mexicanos (CPEUM), 
corresponde al Estado la rectoría del desarrollo nacional para garantizar que este sea integral y sustentable, que fortalezca la 
Soberanía de la Nación y su régimen democr
[…]
uienes obtengan autorización 
como desarrolladores, y en el ejercicio de la facultad establecida en el artículo 39, primer párrafo, fracción III, del Código Fiscal de 
la Federación, he tenido a bien expedir el siguiente 
 DECRETO
```

Fuente o explicación del cotejo:

El encabezado del decreto contiene la referencia a la facultad constitucional. El texto anterior a Artículo Primero forma parte del preámbulo.

Acción pendiente: Reunir o reclasificar el texto con su disposición de origen. Preservar la trazabilidad del UUID actual.

## DACG-PV — Limpieza y metadatos

DACG para la planeación vinculante en la actividad de generación de energía eléctrica

Los 8 artículos y el transitorio único están identificados. Hay pies de impresión y fecha de publicación incorrecta.

[Fuente oficial](https://www.dof.gob.mx/nota_detalle.php?codigo=5770298&fecha=17/10/2025#gsc.tab=0) · UUID del instrumento: `1a4e15a0-cb72-4195-9d96-fe1d939db0e2`

### Fecha de publicación incorrecta

Registro: `1a4e15a0-cb72-4195-9d96-fe1d939db0e2` · Etiqueta actual: **leyes.fecha_publicacion**

Texto almacenado (extracto):

```text
2025-10-27
```

Fuente o explicación del cotejo:

2025-10-17

Acción pendiente: Corregir la fecha bibliográfica a partir de la publicación oficial; conservar separada la fecha de firma si se necesita.

### Firmas o pie editorial dentro del último transitorio

Registro: `03f55d58-e36d-474f-906b-2980cef1f6cd` · Etiqueta actual: **Transitorio ÚNICO.**

Texto almacenado (extracto):

```text
Las presentes Disposiciones entran en vigor el mismo día de su publicación en el Diario Oficial de la Federación. Ciudad de México, a 14 de octubre de 2025. - Secretaria de Energía , Mtra. Luz Elena González Escobar .- Rúbrica. 11/5/26, 12:55 DOF - Diario Oficial de la Federación https://www.dof.gob.mx/nota_detalle.php?codigo=5770298&fecha=17/10/2025&print=true 4/4
```

Fuente o explicación del cotejo:

El cierre del decreto y las firmas son material documental separado de la disposición transitoria.

Acción pendiente: Separar el cierre y revisar el pie de impresión, conservando el texto normativo.

## RISENER — Limpieza y metadatos

Reglamento Interior de la Secretaría de Energía

Los 78 artículos y 7 transitorios están identificados, además de la fórmula de expedición. La fecha guardada corresponde a la firma y no a la publicación; el cierre está unido al último transitorio.

[Fuente oficial](https://sidof.segob.gob.mx/notas/5755222) · UUID del instrumento: `266f38c4-c576-4244-9c45-0c79886cb748`

### Fecha de publicación incorrecta

Registro: `266f38c4-c576-4244-9c45-0c79886cb748` · Etiqueta actual: **leyes.fecha_publicacion**

Texto almacenado (extracto):

```text
2025-04-14
```

Fuente o explicación del cotejo:

2025-04-17

Acción pendiente: Corregir la fecha bibliográfica a partir de la publicación oficial; conservar separada la fecha de firma si se necesita.

### Firmas o pie editorial dentro del último transitorio

Registro: `2091dd5d-64a3-469c-8f79-13a7bc677ba3` · Etiqueta actual: **Transitorio SÉPTIMO.**

Texto almacenado (extracto):

```text
- Las erogaciones que se generen con motivo de la entrada en vigor del presente Reglamento deberán ser cubiertas con cargo al presupuesto aprobado a la Secretaría de Energía en el Presupuesto de Egresos de la Federación para el ejercicio fiscal que corresponda, por lo que no se incrementará su presupuesto y no se autorizarán recursos adicionales para el presente ejercicio fiscal. Dado en la residencia del Poder Ejecutivo Federal, en Ciudad de México, a 14 de abril de 2025.- La Presidenta de los Estados Unidos Mexicanos , Claudia Sheinbaum Pardo .- Rúbrica.- La Secretaria de Energía , Luz Elena González Escobar .- Rúbrica.
```

Fuente o explicación del cotejo:

El cierre del decreto y las firmas son material documental separado de la disposición transitoria.

Acción pendiente: Separar el cierre y revisar el pie de impresión, conservando el texto normativo.

## RLPTE — Limpieza y metadatos

Reglamento de la Ley de Planeación y Transición Energética

Los 136 artículos y 13 transitorios están identificados, además de la fórmula de expedición. No se confirmaron fusiones o falsos cortes de disposiciones; hay encabezados y firmas unidos al cuerpo de fragmentos.

[Fuente oficial](https://www.dof.gob.mx/nota_detalle.php?codigo=5769157&fecha=03/10/2025#gsc.tab=0) · UUID del instrumento: `625c1343-cf4a-4dad-8808-912ed50ba641`

### Firmas o pie editorial dentro del último transitorio

Registro: `aae6db77-5b12-4633-9c77-9c76e36099e7` · Etiqueta actual: **Transitorio DÉCIMO   TERCERO.**

Texto almacenado (extracto):

```text
Las erogaciones que se generen con motivo de la aplicación del presente decreto se deben realizar con cargo a los presupuestos autorizados a los ejecutores del gasto que intervienen en la implementación de este, por lo que no se autorizan ampliaciones líquidas a sus presupuestos para tal fin en el presente ejercicio fiscal, ni se puede incrementar el presupuesto regularizable de dichos ejecutores de gasto para tales efectos. Dado en la residencia del Poder Ejecutivo Federal, en Ciudad de México a 29 de septiembre de 2025.- Presidenta de los Estados Unidos Mexicanos , Claudia Sheinbaum Pardo .- Rúbrica.- Secretaria de Energía , Luz Elena González Escobar .- Rúbrica.
```

Fuente o explicación del cotejo:

El cierre del decreto y las firmas son material documental separado de la disposición transitoria.

Acción pendiente: Separar el cierre y revisar el pie de impresión, conservando el texto normativo.

## Orden propuesto de reparación

1. RLSE, por la cantidad de artículos mal identificados o fusionados.
2. LSE, LPTE, LGTAIP y LGEC: restituir artículos y separar transitorios.
3. PODECOBI lineamientos, SAEE, RLSH y decreto PODECOBI: corregir los falsos cortes identificados.
4. Fechas, pies de impresión, firmas e índices temáticos de todos los instrumentos.

Reparar un instrumento a la vez, con un diff revisable y cotejo de todo el texto afectado. Conservar los UUID de artículos que siguen representando la misma disposición y resolver explícitamente los enlaces, notas y favoritos cuando haya fusiones o nuevos artículos. No borrar y recargar masivamente. El guardado actual no es transaccional; una reparación debe prever recuperación de fallos.

## Archivos

- `hallazgos-confirmados.json`: evidencias y UUID para preparar reparaciones.
- `AUDITORIA.html`: informe navegable.
- `supabase-*.json` y `snapshot.json`: copia íntegra de lectura, con conteos y hash.
- `fuentes/`: originales oficiales y extracción.
- `analisis-automatico.json` y `cotejo.json`: indicadores por fila; incluyen alertas que no equivalen a errores confirmados.