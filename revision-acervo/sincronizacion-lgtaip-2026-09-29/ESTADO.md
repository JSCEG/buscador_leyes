# Ley General de Transparencia: cotejo y sincronización

29/09/2026. Comparación del contenido cargado en Supabase con el PDF oficial de Diputados, Ley General de Transparencia y Acceso a la Información Pública, nueva ley DOF 20/03/2025: https://www.diputados.gob.mx/LeyesBiblio/pdf/LGTAIP.pdf.

Los 238 fragmentos (1 preámbulo, 216 ordinarios, 20 transitorios y 1 complementario de firmas) tienen una coincidencia única de texto en el PDF de 64 páginas tras normalizar espacios de maquetación y excluir encabezados y folios. No se detectaron fragmentos faltantes ni discrepancias textuales. Se revisaron visualmente el preámbulo, artículo 1, un artículo multipágina, el transitorio vigésimo y las firmas; las coordenadas resaltan los pasajes correspondientes.

Se conserva la huella SHA-256 del PDF y de cada contenido íntegro de Supabase. El visor consulta el PDF oficial mediante el proxy existente. No se modifica el texto de Supabase ni se incorpora una copia del PDF al repositorio. El cotejo corresponde a la nueva ley publicada el 20/03/2025 y no certifica vigencia jurídica posterior.

Reproducción: descargar el original a `.local/lgtaip-sync/LGTAIP.pdf`, ejecutar `preparar.py` y `publicar.py`; se requiere PyMuPDF en `.local/lse-sync/python`.
