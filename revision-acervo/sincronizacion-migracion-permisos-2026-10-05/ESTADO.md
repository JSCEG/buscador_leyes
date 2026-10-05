# Mapa del PDF · Lineamientos de migración

Los Lineamientos para la migración voluntaria y expedita quedaron cotejados contra la edición matutina oficial del DOF del 18 de junio de 2026. Se reutiliza el PDF ya conservado en `revision-acervo/incorporacion-pendientes-2026-09-19/fuentes/MIGRACION-PERMISOS-edicion.pdf`: SHA-256 `4fb0664039a940ee5f281059d741aa8bafff6b713ff969e60af49ed248331c49`, 5,584,306 bytes y 324 páginas. El instrumento está en las páginas impresas 5–26.

El mapa sincroniza los 77 fragmentos oficiales del acuerdo, lineamientos, 61 artículos, trece transitorios y firma, con 1,156 anclas a páginas y zonas del original. El fragmento editorial local queda fuera del mapa. El PDF no se duplica en el repositorio; el lector lo solicita a su vínculo oficial mediante el proxy, que acepta sólo esta edición y verifica su huella.

`preparar.py` regenera el mapa y el cotejo desde los insumos existentes; `publicar.mjs` comprueba UUID, texto, huellas, páginas y coordenadas antes de modificar el manifiesto.

Verificación: 77 fragmentos contrastados mediante SHA-256 exacto; pruebas focalizadas, ESLint y build ejecutados.
