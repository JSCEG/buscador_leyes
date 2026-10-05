# Mapa PDF del Acuerdo PODECOBI

Se mapearon los 42 fragmentos vigentes en el acervo: preámbulo, Lineamientos 1–39, transitorio único y firmas. Las anclas se cotejaron contra la edición vespertina oficial del DOF del 22 de mayo de 2025, páginas impresas 9–20.

El PDF de la edición completa se consume desde la URL oficial del DOF mediante `/api/reader/{sourceId}`. El archivo se descargó sólo a `tmp/` para revisar texto, páginas y coordenadas; no forma parte de este paquete ni debe agregarse a Git. El hash SHA-256 fijado en el mapa evita mostrar una edición distinta si el DOF cambia el archivo.

Este mapa representa el acuerdo como se publicó originalmente el 22 de mayo de 2025. Cualquier modificación posterior debe consultarse y mapearse contra su propia publicación oficial.

Para regenerar las anclas, descargar el PDF oficial a `tmp/podecobi-dof-22052025.pdf` y ejecutar:

```powershell
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' revision-acervo/sincronizacion-acuerdo-podecobi-2026-10-05/preparar.py
node revision-acervo/sincronizacion-acuerdo-podecobi-2026-10-05/publicar.mjs
```

`articulos-verificados.json` conserva la instantánea de los 42 fragmentos consultados en Supabase durante el cotejo. `cotejo.json` registra las páginas y anclas de cada fragmento.
