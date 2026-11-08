# Prompt del búho mecánico (entrada, menú y figura para explorar)

Plantilla para construir y mejorar el búho de `intro-3d/` con la skill `teardown`, por rondas. Sale de dos fuentes:

- el artículo de Elvar, autor de la skill (https://x.com/elvar_official/status/2116174609355571402);
- los prompts del escorpión mecánico de Helio Arreche (canal VibeCoding), con el **ciclo de fidelidad** de Fokki:
  renderizar desde el mismo ángulo que la referencia, ponerlas lado a lado, listar las diferencias y corregir, 3 rondas
  antes de seguir.

Reglas de uso (de las dos fuentes):

- Un paso a la vez, en la misma conversación. Solo se avanza cuando el anterior está bien.
- **Sin imagen de referencia sale un juguete genérico.** El resultado nunca es mejor que la referencia: se generan 3 o 4 y
  se escoge la más detallada.
- Los prompts van en inglés a propósito: el modelo sigue mejor las instrucciones técnicas. Las explicaciones, en español.
- No saltarse el ciclo de fidelidad del paso 2.

## 0. Referencias

Van en `intro-3d/ref/` (está en `.gitignore`, no se publican):

- `emblema-claro.png` y `emblema-oscuro.png`: la cara del búho de frente, en los dos temas (las dos mitades de la imagen del
  emblema). Ya están.
- `cuerpo.png`: el búho completo con alas abiertas, garras y piezas sueltas (la ilustración marfil, grafito y guinda).
  Falta guardarla.
- Si hace falta más detalle del cuerpo, se generan 3 o 4 en una IA de imagen con este prompt y se guarda la mejor:

```text
Studio product render of a mechanical owl, front three-quarter view, wings fully spread and raised. Ivory ceramic armor
plates with thin dark seams and visible hex bolts, dark graphite skeleton and steel gears showing between the plates,
crimson (#9b2247) accent on feather tips and cable sleeves, glowing crimson optical eyes with concentric lens rings and
a fine gear ring around each eye, sharp angular brow plates forming a V, hooked ivory beak, layered chest plates like
scales, articulated wing arms with hinge discs and hydraulic pistons, long primary feathers made of ivory blades with
crimson tips, segmented talons with dark claws, a few loose screws, bearings and armor shells floating around, thin
crimson orbit lines, pale warm studio background, soft shadow on an invisible floor, ultra detailed, technical
cutaway feel, 8k
```

## 1. Construir el búho (con ciclo de fidelidad)

```text
/teardown Rebuild the mechanical owl in intro-3d/ (buho.js, modelo.js, main.js) as an interactive 3D figure.
References: intro-3d/ref/emblema-claro.png (the face, front), intro-3d/ref/cuerpo.png (the whole owl). The pictures set
the look. Every plate, bolt, gear, piston and feather is three.js code.

Build it from code with consistent internal units: the head with the V brow plates, the two optical eyes (lens rings,
gear ring, glowing crimson iris, pupil, glass dome), the hooked beak, the facial disc of layered ivory plates, the chest
of overlapping scale plates over a graphite core with gears and crimson cables, the two articulated wings (shoulder,
elbow and wrist hinges with pistons, coverts, 8 secondary and 10 primary blade feathers), the segmented talons, the
tail fan, and the loose parts (armor shells, screws, bearings, gears).

Before you draw anything, write the model as pure functions of two inputs:
- wings from 0 to 1 (0 = folded against the body, 1 = fully spread and raised),
- teardown from 0 to 1 (0 = assembled, 1 = every part moved out along its own axis and the 7 section modules out of
  the chest: Buscar, Acervo, Cronología, Permisos, Polos, Análisis, Aprende).
The head keeps one scale the whole time. Check by hand that no part passes through another at wings 0, 0.5 and 1 and
teardown 0, 0.5 and 1, and show me the check.

Every part, label and camera reads from that one model. Nothing is animated by hand.

Fidelity loop: render one still from the same angle as each reference, put them side by side, list every gap
(proportions, plate thickness, number of plates and bolts, eye detail, feather shape, materials) and fix it. Do 3 rounds
before moving on. If it looks like a toy, add mass and density: thicker plates, more bolts, more gears behind the
seams, visible piston rods at every joint.
```

## 2. Controles (como las figuras de Aprende)

```text
Lay out light controls around the owl, in the style of conceptos-3d/ (Aprende):
- two sliders: Alas (wings 0 to 1) and Desarmar (teardown 0 to 1)
- one button per part: Cabeza, Ojos, Alas, Pecho, Garras. Each one highlights the part in crimson, moves the camera to
  it and shows its label with a thin leader line
- camera views as buttons: Frente, Tres cuartos, Lado, Cara
- the 7 section modules as real HTML buttons over the canvas, each one linked to its section of the site
Every control and label redraws from the frame's state. No number on screen is typed in.
```

## 3. El aspecto Búho

```text
Style: a clean study model on a pale studio, in two themes that follow the site.
- light: warm off-white background (#fafafa), soft shadows on an invisible floor; dark: the night of the dark emblem
  (#120007 to #0a0004) with a soft crimson glow
- crimson (#9b2247 light, #e57a9a dark) is the only accent, and it marks the part working right now
- ivory plates with a thin ink outline so they never melt into the background; graphite and steel roughness at least
  0.45 so nothing streaks white
- the owl fills 60 to 70% of its view on desktop, tablet and phone (in portrait the camera moves back)
- symmetric and front-on at the start and at the end, 3/4 while it unfolds
```

## 4. Revisión como crítico

```text
Before you show me anything:
1. Render a still at every beat and read each one: a part passing through another, a part floating off its mount, a
   piston rod not reaching its joint, a feather clipping through a plate, a label covering what it names, the head
   changing size.
2. Scrub every transition at 0.2 s steps and look for a jump.
3. Fix collisions with a number in the parameter block. Never hide them with the camera.
Do it in light and dark, landscape and portrait. Tell me what you checked and what you fixed. Show me the stills.
```

## 5. Entrada y menú

```text
Build the entrance as states, not as a film:
- entrance (about 3 s, first visit): the front emblem, the camera pulls back, the wings spread, the 7 modules come out
  of the chest
- menu: the owl breathes and moves its wings a little; drag to turn it, it springs back; hovering a module lights it in
  crimson; clicking one closes the owl and the site opens on that section from the owl's eye (the existing iris)
- explore: the controls of step 2; drag to orbit, scroll to zoom, H hides the controls
- an Entrar button goes to the home page; Saltar and Escape keep working
- left alone in explore mode, a cursor tours the controls by itself; any click, drag, scroll or key hands control back;
  25 seconds of quiet hands it to the tour again
```

## 6. Página interactiva y contrato con el sitio

```text
Make it a page people drive, built like the figures of Aprende:
- one HTML page per theme in public/intro/ (light and dark), under 1 MB, fonts from /fonts, nothing from outside
- the site shows the owl picture (public/img/intro-buho-*.webp) while the page loads and swaps to the canvas without a
  jump when the first frame is drawn
- messages to the site: {type:'buho-seccion', hash} when a module is chosen, {type:'buho-entrar'} for Entrar,
  {type:'buho-listo'} on the first frame; the site navigates and opens the iris from the eye position the page sends
- warm every shader before the first frame so the page never freezes
- test on an integrated GPU and an iPhone and add quality steps: lower pixel ratio, smaller shadows, fewer loose parts
- fallbacks: no WebGL, reduced motion or save-data show the still picture with the same 7 buttons
```

## 7. Arquitectura de la página (patrón de la medusa JF-4)

Tomado del prompt de recreación de «Medusa JF-4», un simulador de una sola página con la misma idea. Se toma **cómo
funciona**, no su aspecto: el búho conserva el sistema Búho (marfil, grafito, guinda, Fraunces y Manrope).

Las cuatro reglas que lo sostienen, pasadas al búho:

1. **Todo sale de la cabeza de reproducción.** La pose del búho, la cámara y los paneles salen de un solo tiempo `t`
   del recorrido; adelantar o regresar en la barra funciona igual en los dos sentidos.
2. **Es una sola máquina continua.** Nada aparece con fundido: las piezas giran en bisagras, se desatornillan, se
   estiran y salen volando de forma mecánica.
3. **Las plumas y los dedos son cadenas.** Cada pluma larga y cada dedo se posa recorriendo la cadena y sumando un doblez
   por eslabón; las piezas repetidas van en `InstancedMesh` (una llamada de dibujo por tipo de pieza).
4. **La página se queda clara y técnica.** Fondo papel, tinta, un solo acento guinda, etiquetas pequeñas con espacio
   entre letras y anillos finos detrás del búho.

```text
Build the owl page the way the Medusa JF-4 simulator is built, in the Búho style:
- one playhead t over a looping tour of about 25 s; every property is a keyframe table sampled with smoothstep between
  keys (a TR table); pose, camera and HUD are functions of t, so scrubbing works both ways
- tour, one reveal every 2 to 3 s:
  0 s EMBLEMA: front face, symmetric, the eyes light up
  2.6 s DESPLIEGUE: the camera pulls back, the wings spread, the talons and tail appear
  4.5 s OJOS: the camera pushes in, the gear ring turns and unscrews, the lens rings separate, the iris opens
  7 s CRÁNEO: the V brow plates hinge up, the crown shells lift, the head gears show
  9.5 s ALA DERECHA: isolated; coverts lift, the primaries fan out feather by feather, the pistons extend
  12.5 s PECHO: the scale plates lift like shutters, the core gear rises spinning, the crimson cables show
  15.5 s DESARME: 330° turntable, every part flies out along its own axis, the 7 section modules come out
  19.5 s REARMADO: everything returns before the turn ends
  21.5 s MENÚ: front and wide, wings open, the 7 sections as shortcuts
- parts buttons (Cabeza, Ojos, Alas, Pecho, Garras) jump the playhead to their beat; display toggles (Etiquetas,
  Desarmar, Giro) override the tour until the next beat starts
- drag the canvas to orbit with damping, pitch limited; a rail to scrub and a round play/pause button; Space pauses
- up to four labels per beat, each projected from a 3D anchor with a thin crimson leader line
- the HUD in translucent cards (white at 72% with a 10 px blur) so feathers pass softly behind them; the mode name big
  in Fraunces, everything else in Manrope; below 820 px only the title, the mode, the parts buttons, the 7 sections and
  the rail remain
- rendering: NeutralToneMapping, RoomEnvironment through PMREM at about 0.6, one shadow-casting key light with a
  2048 PCF soft map that follows the owl, a soft fill light, pixel ratio capped at 1.75
- three.js comes bundled by the teardown build, never from a CDN
```

## Créditos

Skill `teardown` de Elvar (@elvar_official, github.com/elvarofficial/teardown, MIT). Ciclo de fidelidad inspirado en
Fokki (@0x_fokki). Estructura de prompts del escorpión TALON SK-8 de Helio Arreche (canal VibeCoding). Arquitectura de
página tomada del prompt de recreación de «Medusa JF-4».
