# DACG de Cogeneración: sincronización con el PDF oficial

Cotejo del 30 de septiembre de 2026 contra el [acuerdo del DOF](https://sidof.segob.gob.mx/notas/docFuente/5785044) y su [edición matutina oficial](https://sidof.segob.gob.mx/notas/getNewsletter/16-04-2026/Matutina/326685).

- Supabase contiene 35 fragmentos: preámbulo, artículo único, numerales 1.1 a 3.7, ocho transitorios, una nota editorial y la firma.
- Los 34 fragmentos que forman parte del documento oficial coinciden con el texto del PDF y tienen páginas/anclas: páginas PDF 27 a 34 de 304.
- La nota editorial es metadato local; se conserva sin página enlazada porque no aparece en la publicación oficial.
- La ubicación normaliza únicamente comillas rectas y tipográficas para encontrar coordenadas; no modifica el fragmento guardado. El mapa guarda SHA-256 del contenido original exacto y el lector lo valida.
- Se inspeccionaron visualmente las páginas 27, 30 y 34. No se cambió el texto en Supabase ni se incluyó una copia del PDF en Git.
- El proxy permite sólo la URL oficial exacta, valida el PDF contra su SHA-256 y queda debajo del límite de 20 MiB.

Para reproducir el cotejo, descargar la edición PDF en `.local/dacg-cogeneracion-sync/DOF-16-04-2026.pdf` y ejecutar `preparar.py` desde la raíz del repositorio. `publicar.mjs` agrega la fuente y los mapas al manifiesto de manera idempotente.

Este trabajo verifica la correspondencia con el documento publicado; no constituye una certificación de vigencia jurídica.
