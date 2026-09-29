# Ley de la Empresa Pública del Estado, Petróleos Mexicanos: sincronización con PDF oficial

Cotejo del 29/09/2026: 152 fragmentos vinculados al PDF oficial de 44 páginas; `missing.json` vacío. Se compara el texto completo sin espacios de maquetación, encabezados o folios y se mantienen huellas SHA-256 del documento y del contenido exacto.

Todos los fragmentos coinciden con el texto vigente publicado por Diputados.

Se revisaron visualmente el preámbulo, un artículo multipágina y el cierre. El PDF se consulta desde Diputados por el proxy existente; no se modificaron Supabase ni el frontend, ni se guardó el PDF en Git. La sincronización documental no certifica vigencia jurídica.

Reproducir con `preparar.py` y `publicar.py`, con el PDF oficial en `.local/lepepm-sync/LEPEPM.pdf` y PyMuPDF en `.local/lse-sync/python`.
