# Diseño: intro del búho mecánico — emblema que se despliega

## Intención

Rehacer la apariencia de la intro existente para que el búho se vea fiel a las tres referencias aportadas por el usuario: un emblema frontal marfil/grafito/guinda, una vista cercana de la cabeza y un búho mecánico completo con alas y piezas separadas. La intro debe seguir explicando que las secciones del Buscador Jurídico salen del interior del búho.

La primera versión ya debe priorizar la fidelidad de las piezas; no se trata de aceptar un búho genérico y mejorarlo mucho después.

## Decisión visual

Se eligió la opción **C: emblema que se despliega**.

1. Inicio frontal, simétrico y reconocible como el emblema de las dos primeras referencias.
2. La cámara se aleja y el emblema revela cuerpo, alas articuladas, plumas y patas mecánicas, tomando la tercera referencia como guía.
3. Corazas, cubiertas, tornillos, rodamientos y engranes se separan por sus propios ejes.
4. Las siete secciones salen del mecanismo del pecho: Buscar, Acervo, Cronología, Permisos, Polos, Análisis y Aprende.
5. El búho se recompone, recupera una pose frontal y el sitio se abre desde un ojo mediante el iris existente.

## Objetivos

- Reproducir con geometría Three.js la lectura visual de las referencias: cejas grandes y afiladas, ojos ópticos circulares, pico central ganchudo, placas marfil traslapadas, mecanismo grafito, detalles guinda y tornillería visible.
- Dar volumen real a las placas: grosor, biseles, caras interiores oscuras, separación y sombras; no usar láminas planas sin relieve.
- Mantener coherencia entre cabeza, cuerpo, alas y piezas desprendidas durante toda la animación.
- Conservar la intro breve, horizontal y vertical, y el desmontaje como medio para presentar las secciones del sitio.
- Comparar renders contra las referencias antes de integrar el resultado final.

## No objetivos

- No construir el simulador industrial interactivo de 25 segundos descrito en el PDF del escorpión.
- No añadir consola de presión, gráficas mecánicas, controles WASD, sonido ni publicación independiente.
- No sustituir la intro CSS de respaldo ni las reglas de accesibilidad y ahorro de datos.
- No incorporar modelos descargados, imágenes planas como sustituto del 3D ni nuevas dependencias al proyecto.
- No hacer una variante oscura en esta primera versión; se usará el estudio claro de la segunda y tercera referencia.

## Enfoques considerados

- **A. Emblema desarmable:** máxima concentración en la cara y los aros, pero elimina cuerpo y alas. Descartado porque el usuario eligió conservar la transformación.
- **B. Guardián completo:** reutiliza directamente la composición actual, pero el arranque no se parece al emblema frontal. Descartado como dirección principal.
- **C. Emblema que se despliega:** combina la fidelidad frontal con el cuerpo completo y el desmontaje. Elegido por el usuario.

## Estructura técnica

Se modifica la implementación existente en `intro-3d/`; no se crea una intro paralela.

- `intro-3d/modelo.js`: conserva el estado puro en función del tiempo. Ajusta proporciones, poses, cámara y momentos para la secuencia emblema → despliegue → desmontaje → secciones → recomposición.
- `intro-3d/buho.js`: concentra la mayor parte del trabajo. Reconstruye cabeza, cejas, ojos, pico, placas, alas y piezas con geometría paramétrica. Cada pieza conserva su posición, orientación y eje de desmontaje.
- `intro-3d/main.js`: ajusta iluminación, materiales, cámara y presentación solo cuando lo exija el nuevo modelo. Las etiquetas y módulos siguen leyendo el mismo estado.
- `intro-3d/style.css`: conserva la presentación clara y adapta títulos/etiquetas si los nuevos encuadres lo requieren.
- `intro-3d/timeline.json`: se sigue generando desde las constantes del modelo.
- `scripts/render-intro-3d.mjs`: se reutiliza para cuadros, hojas de revisión y videos. Solo se modifica si cambia una ruta o una necesidad comprobada del pipeline.

La animación mantiene un único estado temporal. Las poses, los paneles y la posición final del ojo no se animan por separado. Las dimensiones son internas y coherentes; no se presentan como medidas físicas reales de una máquina existente.

## Lenguaje visual

- Fondo de estudio claro, casi blanco cálido, con sombra suave y sin elementos decorativos que compitan con el búho.
- Placas de marfil/cerámica con bordes finos oscuros, rugosidad suficiente para evitar reflejos quemados y volumen visible en tres cuartos.
- Estructura interna grafito y acero oscuro; tornillos, rodamientos, pistones y engranes visibles donde la referencia los muestra.
- Guinda institucional como único acento. Los ojos y ranuras luminosas pueden usar un rosa guinda más brillante, sin introducir otro color de acento.
- Simetría frontal al inicio y al final; una cámara en tres cuartos durante el despliegue para mostrar el volumen.
- Aros orbitales finos y nodos guinda inspirados en las referencias, subordinados a la silueta.

## Ritmo

Se conserva una duración aproximada de **8.5 segundos** y los límites actuales del reproductor.

- 0.0–1.2 s: emblema frontal; activación de ojos y luz.
- 1.2–2.4 s: alejamiento de cámara y despliegue de cuerpo/alas.
- 2.4–3.3 s: apertura de corazas y separación de piezas principales.
- 3.0–5.4 s: aparición y recorrido de las siete secciones.
- 5.4–6.6 s: retorno de módulos y recomposición.
- 6.6–7.9 s: recuperación de la lectura frontal y presentación del nombre.
- 7.9–8.5 s: preparación del ojo para el iris de entrada al sitio.

Los tiempos exactos pueden variar ligeramente para evitar solapamientos y mantener la legibilidad, sin convertir la intro en un tour largo.

## Fidelidad y revisión

El PDF compartido por el usuario aporta el método de revisión, no el contenido visual. Se aplicará así:

1. Construir primero la cabeza frontal y renderizar un cuadro comparable a la segunda referencia.
2. Revisar proporciones, grosor de cejas, diámetro de ojos, pico, densidad de placas, tornillos, materiales y aros. Corregir y repetir hasta tres rondas de fidelidad antes de avanzar.
3. Renderizar una vista en tres cuartos para detectar piezas planas, huecos o intersecciones que el frente oculta.
4. Completar cuerpo y alas usando la tercera referencia; revisar su silueta ensamblada y desmontada.
5. Generar hojas con todos los momentos en horizontal y vertical. Revisar colisiones, piezas flotantes sin intención, módulos que tocan al búho, etiquetas cortadas y continuidad de cámara.
6. Revisar transiciones críticas con cuadros intermedios antes de grabar los videos finales.

No se declara fidelidad solo por compilar: deben inspeccionarse las imágenes renderizadas.

## Integración y verificación

- Mantener `node scripts/render-intro-3d.mjs cuadro <t>` y `... hojas` como flujos de revisión.
- Generar `public/video/intro-landscape.mp4` e `intro-portrait.mp4` con el pipeline existente.
- Actualizar las coordenadas del ojo en `src/scripts/site-intro.js` con los valores impresos por el render final.
- Ejecutar los tests de intro, el build de producción y una reproducción real de la intro en navegador en horizontal y vertical.
- Confirmar que Saltar, Escape, ahorro de datos, movimiento reducido y fallback CSS siguen funcionando.
- Conservar los archivos de revisión en `.local/intro-3d/`; no añadir artefactos temporales al bundle.

## Decisiones del diseñador

- Se usa fondo claro porque coincide con el sitio y con dos de las referencias; el fondo oscuro queda fuera de esta iteración.
- Se mantiene la duración breve actual para no modificar los tiempos de espera del reproductor.
- La fidelidad se busca mediante geometría y materiales, no pegando las referencias dentro de la escena.
- El modelo puede simplificar mecanismos internos que no sean visibles, pero no las piezas que definan la apariencia exterior.
