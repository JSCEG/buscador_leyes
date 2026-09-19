# Recursos del prototipo

- `sener/styles.css` y `sener/tokens/`: copia del skill institucional `anthropic-skills:sener-design`, sistema de diseño SENER. Las rutas de fuentes se adaptaron a `/tipografias/`, que ya existe en este proyecto. Se eliminó la importación externa de IBM Plex Mono; este prototipo utiliza Noto Sans con cifras tabulares. La escala de diapositivas se adapta para web en `prototipo.css`, sin modificar los tokens originales de tamaño.
- Logos: `/img/logo_gob.png` y `/img/logo_sener.png`, archivos existentes del proyecto.
- Iconos: **Feather Icons 4.29.2**, distribución publicada `feather-icons@4.29.2/dist/feather.min.js`, descargada desde jsDelivr y alojada localmente. Proyecto original: <https://github.com/feathericons/feather>. Licencia MIT copiada en `FEATHER-LICENSE`. Los iconos se obtienen directamente de la biblioteca, sin redibujar sus trazados.
- Textos: publicaciones previamente cotejadas en `revision-acervo/incorporacion-autoconsumo-2026-09-18`. `generar-fixture.cjs` conserva una copia sanitizada de los tres instrumentos y tres fragmentos de la LSE extraídos del respaldo posterior a su incorporación. No realiza llamadas ni escrituras a Supabase.

El prototipo no instala dependencias adicionales y, una vez servido desde el proyecto, carga recursos locales. Sus enlaces a fuentes oficiales abren páginas externas únicamente por acción de quien consulta.
