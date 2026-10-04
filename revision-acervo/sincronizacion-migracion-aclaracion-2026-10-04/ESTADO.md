# Mapa del PDF · Nota aclaratoria de migración

La nota aclaratoria publicada el 26 de junio de 2026 quedó cotejada contra la edición matutina oficial del DOF. El PDF ya existente en `revision-acervo/incorporacion-pendientes-2026-09-19/fuentes/` conserva la huella SHA-256 `2d99cb2a77fdc34e7f8f39187ab4d00b105f9b33466b07c66fb7df7e69e53470`, mide 5,117,372 bytes y contiene 274 páginas. La nota aparece en la página impresa 107.

El mapa cubre los tres fragmentos oficiales: presentación, aclaración del artículo 18 con las tablas “Dice” y “Debe decir”, y firma. Excluye la nota editorial del buscador y el aviso general de cuotas del DOF que sigue a la firma en esa misma página. El texto confirma el cambio de fechas del 5–23 de septiembre de 2027 al 5–23 de abril de 2027.

`preparar.py` regenera `map.json` y `cotejo.json` desde el PDF y el JSON de carga existentes. `publicar.mjs` valida UUID, texto, coordenadas y huellas antes de incorporar la fuente y los tres mapas al manifiesto del lector. El endpoint del PDF sólo acepta la liga oficial revisada.

Verificación ejecutada: 30 pruebas focalizadas pasaron; ESLint focalizado pasó; `npm run build` pasó.
