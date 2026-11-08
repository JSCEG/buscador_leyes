# Intro Búho Mecánico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la intro existente en un emblema mecánico frontal que se despliega en un búho completo, se desmonta para presentar las siete secciones y se recompone con alta fidelidad a las referencias.

**Architecture:** Se conserva `runSim` y el estado puro `estado(t, aspecto)` de `intro-3d/modelo.js`. La geometría paramétrica se reconstruye dentro de la implementación actual; el mismo estado controla piezas, módulos, cámara y coordenadas finales del ojo. El pipeline existente genera cuadros de revisión y los dos videos del sitio.

**Tech Stack:** JavaScript ESM, Three.js 0.186.1 mediante `teardown`, Playwright, FFmpeg, Vite y Vitest.

**Spec:** `docs/superpowers/specs/2026-11-07-buho-intro-design.md`

## Global Constraints

- Modificar la intro existente en `intro-3d/`; no crear una intro paralela ni añadir dependencias al proyecto.
- Fondo claro, placas marfil con volumen, mecanismo grafito y guinda como único acento.
- Duración aproximada de 8.5 segundos; formatos horizontal 1920×1080 y vertical 720×1280.
- Sin consola industrial, sonido, tour de 25 segundos, modelos descargados ni referencias pegadas como imágenes planas.
- Conservar Saltar, Escape, movimiento reducido, ahorro de datos, enlaces profundos y fallback CSS.
- No hacer commits, push ni merge salvo que el usuario lo pida expresamente.
- No dar por buena la fidelidad sin inspeccionar renders reales.

## Review Focus

1. **Simetría y continuidad:** el inicio y el final deben leerse como el mismo emblema frontal. Prueba de estado en Task 2 y cuadros en Tasks 1 y 4.
2. **Marfil sobre fondo claro:** las placas no deben perder silueta ni quemarse con las luces. Revisión frontal y tres cuartos en Task 1.
3. **Colisiones mecánicas:** alas, corazas y tornillos no deben atravesar cabeza o cuerpo durante el desmontaje. Cuadros intermedios en Task 3.
4. **Pantalla vertical:** alas, módulos y las siete etiquetas deben permanecer dentro del cuadro. Hojas verticales en Task 3 y reproducción en Task 4.
5. **Iris y fallback:** el sitio debe abrir desde el ojo final y cualquier video lento/fallido debe seguir usando la intro CSS. Pruebas en Task 4.

---

### Task 1: Cabeza y materiales fieles a la referencia

**Files:**
- Modify: `intro-3d/buho.js`, `intro-3d/main.js`
- Review output: `.local/intro-3d/cuadro-horizontal-0.65.png`, `.local/intro-3d/cuadro-vertical-0.65.png`

**Interfaces:**
- Consumes: `construirBuho(M) -> { raiz, posar, lentes, engrane }`, `CABEZA`, `OJOS` y `materiales(P)` existentes.
- Produces: la misma interfaz pública; geometría frontal reconstruida y piezas de cabeza registradas para `posar(e)`.

- [ ] **Step 1: Capturar la línea base.** Run: `node scripts/render-intro-3d.mjs cuadro 0.65`. Expected: se generan ambos cuadros. Inspeccionarlos y anotar diferencias de proporción, volumen y materiales contra la segunda referencia.

- [ ] **Step 2: Reconstruir la cabeza.** Sustituir la máscara esférica, las plumas faciales pequeñas y las cejas actuales por placas paramétricas con grosor, bisel, cara interior grafito y tornillos. Formar dos cejas marfil grandes que converjan sobre el pico, ojos ópticos circulares con anillo dentado, iris guinda luminoso y pupila negra, pico central ganchudo y penachos marfil/guinda. Mantener `OJOS` como fuente de posición para el iris del sitio.

- [ ] **Step 3: Ajustar luz y material.** Usar marfil/cerámica con rugosidad ≥0.45, bordes finos oscuros, interior grafito y un solo acento guinda. Evitar exposición que borre los bordes sobre el fondo claro. No cambiar la duración ni los módulos.

- [ ] **Step 4: Ejecutar tres rondas de fidelidad.** Después de cada corrección, run: `node scripts/render-intro-3d.mjs cuadro 0.65`. Expected en cada ronda: ambos cuadros se generan y se inspeccionan. Comparar explícitamente cejas, ojos, pico, densidad de placas, tornillos, aros, volumen y materiales; corregir las diferencias visibles antes de avanzar. Si el equipo no puede renderizar, detener la fase y reportarlo.

- [ ] **Step 5: Comprobar volumen.** Ajustar temporalmente la cámara de revisión a tres cuartos sin cambiar el contrato de `estado`; generar un cuadro y verificar grosor, interiores oscuros, ausencia de huecos accidentales e intersecciones. Revertir el ajuste temporal después de la revisión.

### Task 2: Despliegue del cuerpo y alas desde el emblema

**Files:**
- Modify: `intro-3d/modelo.js`, `intro-3d/buho.js`, `intro-3d/main.js`, `intro-3d/timeline.json`
- Test: `tests/intro-3d-model.test.js`

**Interfaces:**
- Consumes: la cabeza de Task 1 y `estado(t, aspecto)` actual.
- Produces: `estado(...)` añade `despliegue: number` en 0–1; al inicio `despliegue=0`, durante la apertura `despliegue=1` y al final vuelve a una pose frontal ensamblada. Conserva `ala`, `plumas`, `abierto`, `modulos`, `camara` y `revisar()`.

- [ ] **Step 1: Escribir las pruebas de estado.** Crear pruebas que importen `DURACION`, `MOMENTOS`, `estado` y `revisar` y comprueben: emblema sin cuerpo desplegado ni módulos a `t=0`; despliegue completo antes del desmontaje; siete módulos en ambos formatos; retorno a `abierto=0` y módulos ocultos en `DURACION-1/60`; ausencia de problemas de `revisar()`; mismos resultados al llamar dos veces con idénticos argumentos.

```js
expect(estado(0).despliegue).toBe(0);
expect(estado(MOMENTOS.abre).despliegue).toBe(1);
expect(estado(DURACION - 1 / 60).abierto).toBe(0);
expect(estado(4).modulos).toHaveLength(7);
expect(revisar()).toEqual([]);
```

- [ ] **Step 2: Verificar que las pruebas fallan.** Run: `npx vitest run tests/intro-3d-model.test.js`. Expected: FAIL porque `despliegue` aún no existe.

- [ ] **Step 3: Implementar el despliegue.** Añadir `despliegue` al estado puro y usarlo para revelar cuerpo, alas, patas y cola desde detrás del emblema. Ajustar cámara: frontal al inicio, alejamiento y tres cuartos al mostrar el cuerpo, frontal al final. Mantener los tiempos aproximados del spec y la duración de 8.5 s.

- [ ] **Step 4: Reconstruir cuerpo y alas.** Aumentar la lectura mecánica de la tercera referencia: corazas gruesas, plumas marfil con puntas guinda, bisagras, bielas/pistones, tornillería y cables internos. Conservar `N_PLUMAS`, los pivotes articulados y `posar(e)`; todas las posiciones deben derivarse del estado, sin acumulación entre cuadros.

- [ ] **Step 5: Verificar estado y render.** Run: `npx vitest run tests/intro-3d-model.test.js && node scripts/render-intro-3d.mjs cuadro 1.8 && node scripts/render-intro-3d.mjs cuadro 2.4`. Expected: pruebas PASS; cuatro imágenes generadas e inspeccionadas, con transición legible de emblema a búho completo y sin recortes en vertical.

### Task 3: Desmontaje, secciones y recomposición

**Files:**
- Modify: `intro-3d/modelo.js`, `intro-3d/buho.js`, `intro-3d/main.js`, `intro-3d/style.css`, `intro-3d/timeline.json`
- Test: `tests/intro-3d-model.test.js`
- Review output: `.local/intro-3d/hoja-horizontal.png`, `.local/intro-3d/hoja-vertical.png`

**Interfaces:**
- Consumes: `despliegue`, `abierto`, `modulos` y las piezas registradas en Tasks 1–2.
- Produces: cada pieza desmontable conserva una pose base y un desplazamiento derivado de `abierto`; `revisar()` sigue validando módulos y formatos.

- [ ] **Step 1: Ampliar las pruebas de transición.** Comprobar que durante `MOMENTOS.abre` las piezas empiezan ensambladas, que en el centro del recorrido `abierto=1` y los siete módulos son visibles, y que antes del iris todo vuelve a su pose base. Verificar en horizontal y vertical que ninguna etiqueta tenga opacidad negativa o mayor que 1.

- [ ] **Step 2: Verificar el fallo pertinente.** Run: `npx vitest run tests/intro-3d-model.test.js`. Expected: cualquier FAIL debe corresponder al nuevo comportamiento todavía no implementado; no relajar afirmaciones para ocultar una regresión.

- [ ] **Step 3: Implementar el desmontaje fiel.** Separar corazas, cejas/cubiertas designadas, tornillos, rodamientos y engranes a lo largo de ejes coherentes. Mantener el mecanismo del pecho como origen de los módulos y conservar los aros subordinados a la silueta. Recomponer en orden inverso antes del nombre.

- [ ] **Step 4: Revisar hojas completas.** Run: `npx vitest run tests/intro-3d-model.test.js && node scripts/render-intro-3d.mjs hojas`. Expected: pruebas PASS y ambas hojas generadas. Inspeccionar cada momento; corregir colisiones, cortes, módulos que tocan al búho, texto ilegible y cambios bruscos de cámara.

- [ ] **Step 5: Revisar transiciones críticas.** Run: `node scripts/render-intro-3d.mjs cuadro 1.6`, `... cuadro 2.6`, `... cuadro 5.8` y los tiempos intermedios adicionales que revelen un salto. Expected: no hay atravesamientos, desapariciones accidentales ni cambios de pose sin continuidad.

### Task 4: Videos finales, iris y validación del sitio

**Files:**
- Modify: `src/scripts/site-intro.js`, `public/video/intro-landscape.mp4`, `public/video/intro-portrait.mp4`
- Test: `tests/site-intro-video.test.js`, `tests/intro-3d-model.test.js`

**Interfaces:**
- Consumes: modelo y hojas aprobados en Tasks 1–3.
- Produces: videos finales y `FILMS.landscape.eye` / `FILMS.portrait.eye` actualizados con la salida del render.

- [ ] **Step 1: Grabar los videos.** Run: `node scripts/render-intro-3d.mjs`. Expected: finaliza sin errores, genera ambos MP4, informa sus tamaños y escribe las coordenadas del ojo horizontal y vertical.

- [ ] **Step 2: Actualizar el iris.** Copiar exactamente las coordenadas impresas a `FILMS` en `src/scripts/site-intro.js`; no cambiar `VIDEO_WAIT_MS`, `VIDEO_LIMIT_MS`, `shouldShowIntro`, `canPlayFilm` ni el fallback salvo que una prueba demuestre una incompatibilidad nueva.

- [ ] **Step 3: Ejecutar pruebas y build.** Run: `npx vitest run tests/intro-3d-model.test.js tests/site-intro-video.test.js && npm run lint && npm run build`. Expected: PASS y build exitoso. No corregir fallos ajenos a este cambio; reportarlos por separado.

- [ ] **Step 4: Reproducir el escenario real.** Abrir el sitio en desarrollo con `?intro` en horizontal y vertical. Verificar video completo, legibilidad de las siete secciones, ausencia de errores de consola, iris alineado con el ojo y entrada al sitio. Probar Saltar y Escape; comprobar fallback con ahorro de datos y ausencia de video con movimiento reducido.

- [ ] **Step 5: Revisar archivos generados.** Run: `git status --short`. Expected: solo los archivos deliberados del diseño y sus salidas; conservar revisiones en `.local/intro-3d/`, eliminar únicamente temporales creados por esta tarea y no tocar cambios ajenos.
