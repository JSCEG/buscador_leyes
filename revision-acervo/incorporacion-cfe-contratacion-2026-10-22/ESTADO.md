# Incorporación de nueve convocatorias de contratación CFE

Corte: 22 de octubre de 2026. Los nueve registros están cargados en Supabase, con 18 fragmentos: nueve avisos oficiales completos y nueve notas editoriales identificadas. Los 18 contenidos coinciden por MD5 con carga.json y tienen índice de búsqueda generado. El acervo queda en 120 instrumentos.

## Identificación

- Tipo existente: convocatoria. Títulos con prefijo «Convocatoria de contratación CFE» y número de procedimiento como siglas.
- Publicación DOF: 22 de octubre de 2026. Las fechas del micrositio se conservan por separado.
- Etapa acreditada: convocatoria/concurso al corte. Fallos previstos, no adjudicaciones ni ejecución acreditadas.
- La vigilancia de instalaciones de la Coordinación Nuclear se identifica como servicio de seguridad. No se atribuye una central de destino a la draga marina.
- No se modifica la interfaz. FRONTEND.md describe el contrato de datos y metadatos-contratacion.json contiene el desglose para futuras vistas.

## Cotejo y mapas

PDF oficial de 224 páginas, 21,039,995 bytes. SHA-256 `b0d0ebd53552a59d1707e6897f5bf013d2f23f73b38a209bb591f2ac6bd7879b`, comprobado contra una descarga nueva del DOF. Se inspeccionaron visualmente las páginas 155–159.

Nueve tablas reconstruidas como HTML semántico. El contenido de cada tabla coincide carácter por carácter (sin espacios y sin depender del orden de extracción de columnas) con las líneas del PDF. Se unieron los rótulos que la extracción había dividido en dos filas físicas y se retiraron duplicados producidos por rectángulos solapados del detector; no se añadieron fechas ni rótulos jurídicos.

Cada mapa sólo abarca el aviso correspondiente, hasta su registro R.- del DOF. Las notas editoriales no tienen mapa. Una única fuente remota compartida por los nueve instrumentos; no se incorporan PDFs ni imágenes al repositorio.

## Validación

Lint y build aprobados. Suite: 512 pruebas aprobadas y una de navegación agotó su límite de cinco segundos; esa prueba pasó al ejecutarse aisladamente (3.0 segundos), sin cambios de interfaz. Las dos pruebas nuevas de esta entrega pasaron. Los mapas y fuentes anteriores se preservan.
