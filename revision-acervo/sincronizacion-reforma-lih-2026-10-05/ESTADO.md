# Sincronización de la Reforma a la Ley de Ingresos sobre Hidrocarburos

Se agregaron mapas para los 41 fragmentos oficiales que ya estaban cargados en Supabase. La nota editorial se excluyó porque no corresponde a texto de la publicación.

- Fuente: edición vespertina oficial del DOF del 18 de marzo de 2025, páginas impresas 260–268.
- PDF remoto: `https://sidof.segob.gob.mx/notas/getNewsletter/18-03-2025/Vespertina/320062`.
- Huella SHA-256: `ed57fbef06b46f37d53ca1caea856f4eb3b0d2d316c6e7bb7e837daa001708a3`.
- El PDF ya estaba registrado en el manifiesto por esa misma huella. Se reutiliza la fuente existente; no se añade ni se sube otra copia.
- El cotejo guarda páginas, anclas geométricas y SHA-256 del contenido de cada fragmento. Los cinco bloques extensos cuya extracción de texto del PDF no queda en una secuencia lineal se ubican con su texto inicial y los límites del fragmento siguiente; sus rangos de página están incluidos en `cotejo.json`.

Para regenerar el mapa, mantener disponible la copia de cotejo existente y ejecutar:

```powershell
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' revision-acervo/sincronizacion-reforma-lih-2026-10-05/preparar.py
node revision-acervo/sincronizacion-reforma-lih-2026-10-05/publicar.mjs
```

`articulos-verificados.json` contiene la instantánea de Supabase usada para validar los identificadores y hashes, y `cotejo.json` contiene el detalle del mapeo.
