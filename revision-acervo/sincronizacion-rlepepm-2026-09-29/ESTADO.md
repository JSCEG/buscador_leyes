# Reglamento de la Ley de la Empresa Pública del Estado, Petróleos Mexicanos: sincronización con PDF oficial

Cotejo del 29/09/2026: 90 fragmentos vinculados al PDF oficial de 16 páginas; `missing.json` vacío. Se compara el texto completo sin espacios de maquetación, encabezados o folios y se mantienen huellas SHA-256 del documento y del contenido exacto.

El preámbulo del DOF repite su título al final del bloque en Diputados. El cotejo omite la aparición inicial al ubicar el texto y conserva la huella íntegra del contenido.

Se revisaron visualmente el preámbulo, un artículo multipágina y el cierre. El PDF se consulta desde Diputados por el proxy existente; no se modificaron Supabase ni el frontend, ni se guardó el PDF en Git. La sincronización documental no certifica vigencia jurídica.

Reproducir con `preparar.py` y `publicar.py`, con el PDF oficial en `.local/rlepepm-sync/RLEPEPM.pdf` y PyMuPDF en `.local/lse-sync/python`.
