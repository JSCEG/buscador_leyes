# Acuerdos CNE y ASEA — 27 de octubre de 2026

Dos instrumentos cargados en Supabase, 18 fragmentos. Verificación posterior: 18 presentes, 18 contenidos idénticos por MD5 al payload y 18 índices de búsqueda generados. Se normalizaron únicamente los retornos CR introducidos por el transporte de PowerShell, para conservar los bytes LF cotejados.

## Instrumentos

- ASEA-DELEGACION-2026: `fb1a8c25-f29f-521f-88a4-c004efccbd49`. Once fragmentos, ocho acuerdos y transitorio; páginas 23–26. El acuerdo se publicó el 27 de octubre y entra en vigor el 28. No contiene tablas.
- CNE-INICIO-CADUCIDAD-132-2026: `8d4ad440-ecec-5f73-8aff-e8d9d4246a24`. Siete fragmentos, cuatro acuerdos y transitorio; páginas 27–36. Inicio de procedimientos individuales, sin declarar todavía la caducidad de los permisos.

## Cotejo

La fuente HTML de cada instrumento se conserva íntegra en texto, en orden, incluidos encabezados, considerandos, disposiciones, transitorio y firma. Todos los párrafos completos se cotejan también contra el PDF por texto alfanumérico normalizado en orden. La versión cargada conserva la redacción y puntuación del HTML oficial, sin aplicar esa normalización al contenido.

La relación de CNE contiene 132 filas consecutivas, cinco columnas y 660 celdas de datos idénticas a las extraídas del PDF, comparadas individualmente sin espacios. Sus cinco encabezados también coinciden. El corte artificial del portal HTML después de la fila 96 se elimina, generando una tabla continua con `thead/th` y `tbody/td`, sin duplicar registros.

Inspección visual del PDF: páginas 26, 30, 35 y 36. La errata «SÉPTMO» aparece en el original de ASEA y se conserva. Las firmas siguen dentro del fragmento transitorio; no se crean documentos relacionados artificiales.

## PDF remoto y mapas

Fuente `dof-cne-asea-20261027-5043e1a11443`. PDF oficial del DOF matutino: 208 páginas, 4,624,025 bytes, SHA-256 `5043e1a11443c1b4c12ccc47d4bbc32e5dfe16d16ec1ba89f950e46bac6663ca`, verificado con una descarga nueva. No se publican binarios ni imágenes en Git.

Los 18 fragmentos tienen SHA-256 del contenido y anclas por línea. PRIMERO de CNE abarca las páginas 30–35; SEGUNDO, 35–36. El último mapa termina antes del aviso de INEEL de la página 36. PRIMERO de ASEA apunta únicamente a la página 25, sin confundirlo con el considerando del mismo nombre.

La publicación incrementa el manifiesto de lectura de revisión 114 a 115 y verifica que todos los mapas anteriores permanezcan idénticos. Se agrega únicamente la URL revisada del DOF a la lista autorizada del transporte. No se modifica la interfaz.

## Reproducción

`python preparar.py <ruta-al-PDF-oficial>` genera carga, SQL, metadatos, cotejo y mapa; verifica la huella y detiene el proceso si una celda, párrafo o marcador no coincide. `aplicar.sql` es una transacción con protección contra duplicados. `publicar.mjs` incorpora los mapas sin reformatear ni alterar las fuentes anteriores.

Validación previa a publicación: lint y build aprobados; suite completa de 129 archivos y 525 pruebas aprobadas.
