# Sincronización de acuerdos del DOF — 30/09/2026

Cotejo efectuado el 1 de octubre de 2026 contra la edición matutina oficial de 344 páginas. El PDF temporal se usa sólo para extraer texto y coordenadas; el visor lo solicita por el proxy con SHA-256 verificado y no guarda la copia en el repositorio.

## Resultado del mapa

- **UPAC-SGE:** 22 fragmentos oficiales anclados entre las páginas impresas 41 y 45.
- **CNE-MOD-CARGO-TRANSMISION:** 6 fragmentos oficiales anclados entre las páginas impresas 46 y 48.
- **Total:** 28 fragmentos mapeados con 389 anclas geométricas. Las dos notas editoriales se excluyen porque no aparecen en la publicación.
- Ambos instrumentos comparten el mismo ejemplar PDF oficial y su huella (`598b6f92b41292cebf27dc3f0dce793b7d6a02477e56a3f0ca49866ce528334c`).
- El artículo 13 de UPAC cubre las páginas 44–45 y el preámbulo de la modificación CNE las páginas 46–47. El visor valida el hash del texto cargado antes de mostrar resaltados.

## Archivos

- `map.json`: fuente remota y mapas por UUID de fragmento.
- `cotejo.json`: páginas y anclas verificadas.
- `sin-mapa-editorial.json`: exclusiones deliberadas.
- `preparar.py`: reconstruye las coordenadas desde el PDF temporal y los paquetes cotejados.
- `publicar.mjs`: incorpora de forma idempotente mapas y fuente al manifiesto.

El manifiesto local ya contiene los mapas (revisión 32). El proxy acepta sólo la URL oficial exacta del ejemplar del 30/09/2026, rechaza alternativas y valida SHA-256; la edición pesa 9,644,927 bytes, por debajo del límite de 20 MiB. No se generaron imágenes ni se agregó el PDF a Git.

## Fuentes oficiales

- [Acuerdo UPAC-SGE, SIDOF](https://sidof.segob.gob.mx/notas/docFuente/5799963)
- [Modificación a cargos de transmisión, SIDOF](https://sidof.segob.gob.mx/notas/docFuente/5799964)
- [Edición matutina DOF del 30/09/2026](https://sidof.segob.gob.mx/notas/getNewsletter/30-09-2026/Matutina/329925)
