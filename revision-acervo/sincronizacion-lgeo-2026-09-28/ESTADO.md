# LGEO: sincronización con PDF oficial

28/09/2026: 79 fragmentos cotejados; missing.json vacío. Coincidencia única del texto completo ignorando espacios de maquetación, encabezados y folios. Todos los fragmentos coinciden sin excepciones adicionales.

No se modifica Supabase ni el frontend. El PDF se consulta en Diputados mediante el proxy existente; sólo se publican mapas y huellas, no copias PDF ni imágenes. Revisión visual del resaltado, incluyendo fragmentos multipágina y el artículo 74 del reglamento. Las pruebas validan todos los fragmentos y rechazan cambios de texto.

Reproducir con preparar.py y luego publicar.py; se requiere el PDF oficial en .local/lgeo-sync/LGEO.pdf y PyMuPDF en .local/lse-sync/python. La correspondencia documental no certifica vigencia jurídica.
