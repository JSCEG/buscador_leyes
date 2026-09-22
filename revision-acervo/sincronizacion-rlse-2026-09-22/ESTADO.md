# RLSE: sincronización con el PDF oficial

Revisión del 22 de septiembre de 2026. Los 335 fragmentos actuales de Supabase tienen coincidencia única de texto completo en el PDF de 71 páginas de https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LSE.pdf.

El cotejo elimina únicamente espacios de maquetación, encabezados repetidos y folios. No elimina palabras, puntuación ni acentos. Se conserva el SHA-256 del texto exacto de cada UUID y la huella de la edición del PDF. Un cambio en cualquiera de ellos desactiva la sincronización hasta revisar la nueva versión.

Revisión visual: artículo 1, final del artículo 2 (cuatro páginas), transitorio Vigésimo Séptimo y firmas. Los resaltados respetan los límites entre fragmentos. Las pruebas verifican todos los UUID y páginas, cambios de contenido y las restricciones del proxy para la carpeta oficial `regley`.

El PDF se consulta mediante el proxy del lector, sin publicar copias ni imágenes en Git. No se cambió el contenido ni la clasificación de Supabase. Esta verificación es de correspondencia documental, no una certificación de vigencia.

Para reproducir desde la raíz: descargar el original en `.local/rlse-sync/RLSE.pdf`, disponer de PyMuPDF (se admite la instalación temporal en `.local/lse-sync/python`), ejecutar `preparar.py` y luego `publicar.py`. La instantánea de artículos permite verificar los hashes sin credenciales. Se exigen los 335 cotejos antes de publicar.
