# Seis incorporaciones verificadas — 17 de septiembre de 2026

El acervo pasó de **19 a 25 instrumentos**, de **2,527 a 3,044 fragmentos** y de **494 a 644 entradas de estructura**. Los registros anteriores permanecen exactamente iguales, incluidas sus fechas de creación.

| Instrumento | Fragmentos | Estructura | Publicación oficial |
|---|---:|---:|---|
| RLBio | 128 | 29 | [03/10/2025](https://sidof.segob.gob.mx/notas/docFuente/5769156) |
| RLGeo | 112 | 32 | [03/10/2025](https://sidof.segob.gob.mx/notas/docFuente/5769154) |
| RLEPECFE | 93 | 23 | [02/12/2025](https://sidof.segob.gob.mx/notas/docFuente/5774837) |
| RLEPEPM | 90 | 24 | [03/12/2025](https://sidof.segob.gob.mx/notas/docFuente/5775017) |
| DACG-PERMISOS-GA | 86 | 38 | [23/10/2025](https://sidof.segob.gob.mx/notas/docFuente/5770667) |
| FORMATOS-SAEE | 8 | 4 | [22/05/2026](https://sidof.segob.gob.mx/notas/docFuente/5788270) |

Los cuatro reglamentos suman 379 artículos y 35 transitorios. Las DACG de permisos conservan 71 numerales, cinco transitorios y seis formularios; el acuerdo SAEE conserva el resolutivo Único, un transitorio y tres formularios. Los 517 fragmentos añadidos incluyen preámbulos, índice, anexos, firmas y fe de erratas.

Se aplicó la fe de erratas de CFE de 29 de diciembre de 2025 al tercer párrafo del artículo 68. La fe de erratas permanece como documento complementario del reglamento, no como un séptimo instrumento.

Las dos publicaciones de almacenamiento conservan **130 tablas, 2,073 celdas y 115 casillas**. Se cotejó el texto completo y la estructura de cada celda, incluidas las combinadas. Las 115 imágenes de casillas vacías fueron descargadas, cotejadas por huella y representadas como □; no se eliminaron campos de los formularios.

El cotejo posterior es exacto contra los seis payloads. Se verificaron cero textos vacíos, índices FTS vacíos, identificadores duplicados por instrumento y órdenes duplicados. Seis búsquedas reales devolvieron resultados y los nueve formularios se abrieron en el buscador: tablas, celdas y casillas coinciden, sin desbordamiento horizontal en el tamaño comprobado. No se ejecutó de nuevo la suite de aplicación porque esta incorporación no modifica su código.

## Evidencia

- [Informe navegable](INCORPORACION.html).
- [Cotejo posterior y conservación del acervo anterior](VERIFICACION.json).
- [Cotejo completo de tablas](COTEJO-TABLAS.json).
- [Comprobación en navegador](VERIFICACION-NAVEGADOR.json).
- [Fuentes oficiales y huellas](fuentes.json).
- Respaldos completos: `antes-verificado/` y `despues-verificado/`.
- Por instrumento: `*-revisado.json`, `*-carga.json`, `*-aplicar.sql` y fuentes originales en `fuentes/`.

## Pendientes y alcance

El [inventario actualizado](../inventario-radar-2026-09-17/INVENTARIO.html) cruza los 25 instrumentos con las 179 filas del radar v4.17 (corte 14 de septiembre). Se conservan 164 referencias sin repeticiones: 117 por cotejar e incorporar, 16 cubiertas directamente, un decreto con cobertura parcial, 13 antecedentes o de efectos limitados, cuatro filas de proyectos, diez portales y tres publicaciones no localizadas. No son 117 leyes por subir.

Siguiente bloque propuesto: 13 piezas de las tres convocatorias de generación (tres originales y diez modificaciones), con calendarios y anexos. Los perfiles usados están cerrados a estas fuentes; el parser genérico, las relaciones y los temas transversales no se amplían automáticamente. Los datos ya están en Supabase y no se desplegó un nuevo frontend.

## Resúmenes de orientación

### Reglamento de la Ley de Biocombustibles

Desarrolla la Ley de Biocombustibles mediante reglas sobre coordinación, planeación, investigación y permisos de producción, almacenamiento, transporte, distribución, comercialización, expendio, importación y exportación. Incluye procedimientos ante SENER y SADER, obligaciones de titulares y el sistema de información del sector.

También contiene disposiciones de protección ambiental, verificación, supervisión, medidas de seguridad, sanciones y participación social. Se incorporaron sus 116 artículos y diez transitorios, con títulos, capítulos y secciones; el preámbulo y las firmas quedaron separados.

### Reglamento de la Ley de Geotermia

Desarrolla las modalidades de aprovechamiento de los recursos geotérmicos: exploración, concesiones de explotación, concesiones de agua, permisos para usos diversos y aprovechamientos exentos. Incluye planeación, innovación y los trámites relacionados con permisos y concesiones.

Su estructura también comprende información del subsuelo, revocación, terminación, rescate, reasignación, inspección, verificación y sanciones. Se conservaron los 100 artículos, diez transitorios y 32 encabezados de estructura, sin confundir referencias internas con nuevos artículos.

### Reglamento de la Ley de la Empresa Pública del Estado, Comisión Federal de Electricidad

Regula aspectos de la Comisión Federal de Electricidad como empresa pública del Estado: integración del Consejo de Administración, conflictos de interés, comités, remuneraciones, vigilancia y auditoría. Desarrolla además su régimen especial y los mecanismos de evaluación.

La incorporación comprende 82 artículos, ocho transitorios del decreto y la fe de erratas publicada el 29 de diciembre de 2025. El tercer párrafo del artículo 68 usa la denominación corregida Comisión Federal de Electricidad; la publicación de la fe de erratas se conserva como complemento trazable.

### Reglamento de la Ley de la Empresa Pública del Estado, Petróleos Mexicanos

Regula aspectos de Petróleos Mexicanos como empresa pública del Estado, la organización de su Consejo de Administración, comités, vigilancia y auditoría. Desarrolla su régimen especial en materias como filiales, adquisiciones, responsabilidades, presupuesto, deuda y sostenibilidad.

Incluye evaluación, alianzas estratégicas, esquemas para desarrollo mixto, asociaciones y contratos mixtos. Se incorporaron sus 81 artículos y siete transitorios del decreto, manteniendo los encabezados de capítulos y secciones y separando las firmas del articulado.

### Disposiciones administrativas de carácter general para solicitar el otorgamiento y la modificación de permisos de generación y almacenamiento de energía eléctrica, así como su vigencia

Establece términos legales, técnicos y financieros para solicitar el otorgamiento y modificación de permisos de generación y almacenamiento de energía eléctrica, así como su vigencia. Se respetaron los 71 numerales y subnumerales de su estructura original.

La carga conserva cinco transitorios, instrucciones de llenado y seis formatos completos, CNE_ELECTRICIDAD_01 a CNE_ELECTRICIDAD_06. Las tablas, celdas combinadas y casillas se cotejaron contra la fuente oficial; los números de campos de los formularios no se trataron como artículos.

### Acuerdo de la Comisión Nacional de Energía por el que se emiten los formatos referidos en las DACG para la integración de Sistemas de Almacenamiento de Energía Eléctrica al Sistema Eléctrico Nacional

El acuerdo de 22 de mayo de 2026 emite los formatos referidos en las DACG para la integración de Sistemas de Almacenamiento de Energía Eléctrica al Sistema Eléctrico Nacional. Complementa el instrumento de integración SAEE que ya estaba en el catálogo.

Se conservaron el resolutivo Único, el transitorio, las instrucciones y los tres formatos completos CNE_ELECTRICIDAD_09, CNE_ELECTRICIDAD_10 y CNE_ELECTRICIDAD_11. Cada formato ocupa un fragmento con todas sus tablas y campos, sin cortes falsos provocados por su numeración interna.

