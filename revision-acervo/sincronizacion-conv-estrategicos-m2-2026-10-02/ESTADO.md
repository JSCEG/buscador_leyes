# Sincronización de CONV-ESTRATEGICOS-M2

Se cotejan los 27 fragmentos de la segunda modificación con la edición matutina oficial del DOF del 10 de julio de 2026. El acuerdo ocupa las páginas impresas 11–20 de un PDF de 324 páginas. Se verificó visualmente la primera página del acuerdo y la página 20, que contiene el numeral 18.2 con la tabla de capacidad (935 MW en total y tres horas de almacenamiento por región). El paquete de ingesta conserva tres tablas.

El mapa enlaza cada fragmento oficial con las líneas y coordenadas que se extrajeron del PDF. La nota editorial de versiones relacionadas se excluye porque no aparece en el DOF. El PDF se transmite desde la edición oficial y no se incorpora a Git como archivo binario.

`map.json` contiene la fuente y los mapas geométricos. `cotejo.json` registra la huella SHA-256, páginas y anclas por fragmento. `preparar.py` reconstruye el mapa a partir de `tmp/conv-estrategicos-m2.pdf`; `publicar.mjs` comprueba cobertura, integridad del texto y límites de coordenadas antes de actualizar el manifiesto.

## Fuentes oficiales

- [Edición matutina del DOF del 10 de julio de 2026](https://sidof.segob.gob.mx/notas/getNewsletter/10-07-2026/Matutina/328425)
- [Acuerdo de segunda modificación](https://sidof.segob.gob.mx/notas/docFuente/5793261)
