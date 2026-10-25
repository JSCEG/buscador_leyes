# Confirmación de tres detalles de formularios contra PDF

Fecha: 21 de octubre de 2026. Alcance limitado a los tres detalles de estructura solicitados; no constituye una nueva auditoría integral del contenido.

Se consultaron los tres fragmentos actuales en Supabase y se confirmó que sus hashes SHA-256 coinciden con el manifiesto del lector. Se verificaron los hashes de los tres PDFs oficiales antes de inspeccionar las páginas renderizadas. No se modifica Supabase, la interfaz ni los mapas.

## DACG-ACCESO-REDES · Apéndice C1, Formato 1

Fragmento: `9fe97af5-aca7-5fd7-8f8a-dd3b9896fee8`.

Inspección visual de páginas 272–275. El formato oficial alterna secciones a todo el ancho, grupos con distinto número de columnas y descripciones que abarcan varias filas (DATO 1 a DATO 4). Las cinco tablas del fragmento conservan esa estructura mediante colspan/rowspan. La diferencia de columnas entre filas no justifica añadir celdas ni uniformar el formulario. La página 275 inicia después el Formato 2; no pertenece íntegramente al Formato 1.

Fuente: https://sidof.segob.gob.mx/notas/getNewsletter/23-01-2024/Matutina/311101

SHA-256: `69abcd4beaa791bbde64666099c23ba394e7db0f9a23ab0ef09717a34e014743`.

## BENEFICIO-REDES · Anexo I

Fragmento: `f4fcf5f4-7818-58a6-a09a-903bd7147156`.

Las 58 tablas HTML representan campos y rejillas del formulario de las páginas 532–545, no 58 documentos distintos. Se inspeccionaron visualmente las páginas 532, 534 y 536 para los detalles señalados: domicilio, datos personales, identificación, casillas y datos de representación. Los blancos y renglones reservados para captura tienen correspondencia con el PDF. Conservarlos; no eliminarlos por parecer filas sin contenido. Los rótulos de campos no son necesariamente encabezados generales de columna.

Fuente: https://sidof.segob.gob.mx/notas/getNewsletter/18-01-2024/Matutina/311042

SHA-256: `f19d7306421896e2fb023a6d97b156233714ffb65876177c9849330f13bd1abe`.

## MODELOS-INTERCONEXIÓN · Campos de firmas

Fragmento: `6d66a87a-b3cd-5e81-9191-4d997051fc85`.

Página 19: dos bloques para «LA [TRANSPORTISTA / DISTRIBUIDORA]» y «LA SOLICITANTE», cada uno con dos espacios y el rótulo «(Nombre, cargo y firma)». Las dos tablas actuales son maquetación de firmas. No convertir esa fila en thead/th ni interpretarla como títulos de una tabla de datos. El artículo segundo comienza más abajo y es un fragmento diferente.

Fuente: https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=17032026-MAT.pdf&repo=

SHA-256: `3ae8c9b91d329d0508aafcd558e552fa7361c90c01d8ca3ac839a721175dcc34`.

## Resultado

Los tres detalles quedan confirmados contra el PDF; no se requiere corrección de datos para estos puntos. Los renderizados y la descarga adicional se conservaron únicamente en el directorio temporal, fuera de los archivos versionados.
