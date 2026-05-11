---
schemaVersion: 1
scope: workspace
updatedAt: "2026-05-10T04:47:43.564Z"
workspaceName: "65.-Buscador de Leyes Energía"
---

# Project Memory

## Project Overview
- Workspace para una app web de consulta/búsqueda de leyes y marco legal energético, con identidad institucional SENER.
- La solicitud inicial fue “levanta la app y mejoremos el diseño”.

## Current State
- Fuente activa: `App.jsx`, aunque contiene documento HTML completo con Tailwind/CDN y estructura de app.
- Se inspeccionó la app existente antes de editar y se preservó como base.
- La pantalla principal ya tiene dirección institucional: fondo cálido, hero editorial, elementos decorativos, tarjetas y microcopy de contexto.
- Se mejoraron el menú, efectos hover, estados activos, drawer móvil y modo oscuro persistente.
- `DESIGN.md` existe y debe tratarse como la fuente autoritativa del sistema visual; se actualizó con estados/interacciones y modo oscuro.
- Se añadieron destinos/anclas internas para navegación tras advertencias del verificador.
- Se detectaron 5 valores editables/tweakables en `App.jsx`.
- La vista previa/verificación automática sigue bloqueada por falla del host: falta módulo `ms` en Open CoDesign, no necesariamente por error de la app.

## Artifacts
- `App.jsx`: fuente activa de la interfaz principal del buscador; incluye header, menú móvil, modal de autenticación, hero, buscador, sección de características, resultados/acciones, footer, microinteracciones de navegación y modo oscuro.
- `DESIGN.md`: sistema visual mínimo para decisiones de identidad, paleta, tipografía, layout, elevación, formas, componentes, estados interactivos y modo oscuro.
- `Estilos Institucionales/index.html`, `index_mapa.html`, `login.html`, `sener_test.html`, `vistas_sener.html`: candidatos/fuentes de referencia institucional existentes en el workspace.
- `AGENTS.md`: presente.

## Design Direction
- Estilo institucional mexicano/SENER, sobrio y confiable, con énfasis editorial jurídico.
- Guinda como color protagonista, dorado como acento institucional y superficies cálidas tipo papel.
- Tipografía serif para titulares y tono legal/editorial; sans para UI funcional.
- Interfaz enfocada en consulta clara, confianza, jerarquía, legibilidad y navegación con estados visibles.
- Modo oscuro debe conservar el tono institucional, no volverse genérico ni excesivamente contrastado.
- Evitar apariencia genérica o reconstrucción completa no solicitada.

## User Feedback
- El usuario pidió levantar la app y mejorar el diseño.
- Ante “listo?”, se confirmó que el diseño quedó aplicado y que la verificación sólo falla por problema del host.
- Luego pidió mejorar menú, efectos hover, estados activos y “hacer run modo oscuro”; se implementaron esos ajustes.

## Decisions
- Mantener el producto como buscador/consulta de leyes energéticas.
- Conservar identidad SENER y tono institucional.
- Documentar decisiones visuales estables en `DESIGN.md`.
- No reconstruir desde cero; mejorar la fuente existente.
- Preservar el nombre actual del diseño: “Diseño de app”.
- Usar modo oscuro persistente como extensión del sistema visual, respetando la identidad institucional.

## Open Questions
- Confirmar si la navegación superior debe apuntar a secciones reales, rutas SPA o botones con lógica JS.
- Validar si el diseño debe alinearse estrictamente a lineamientos oficiales de Gobierno/SENER o sólo inspirarse en ellos.
- Revisar en navegador real cuando el problema del host/runtime esté resuelto.
- Confirmar si el modo oscuro debe activarse por preferencia del sistema, botón manual o ambos.

## Next Steps
- Ejecutar la app en un entorno local funcional para validar layout, responsividad y JS.
- Revisar interacciones de navegación, búsqueda, modal de login, menú móvil y persistencia del modo oscuro.
- Ajustar estados de resultados/vacío/carga si el flujo real lo requiere.
- Consolidar componentes reutilizables si el proyecto migra a React real en lugar de HTML dentro de `App.jsx`.
- Reintentar verificación cuando se resuelva la dependencia faltante `ms` del host.

## Promotion Candidates For DESIGN.md
- Guinda institucional como color primario y dorado como acento.
- Fondo cálido tipo papel para reducir apariencia genérica.
- Titulares serif editoriales y cuerpo sans legible.
- Tarjetas institucionales con bordes suaves, sombras discretas y acentos de color contenidos.
- Estados hover/activo/focus más visibles para navegación institucional.
- Modo oscuro institucional con contraste legible y conservación de acentos guinda/dorado.

## Recent History
- 2026-05-10: Se inspeccionó workspace y `App.jsx`.
- 2026-05-10: Se aplicó mejora visual a la app principal manteniendo estructura existente.
- 2026-05-10: Se creó `DESIGN.md`.
- 2026-05-10: Se corrigieron advertencias iniciales de enlaces vacíos; verificación runtime quedó bloqueada por dependencia faltante del host (`ms`).
- 2026-05-10: Se releyeron `DESIGN.md` y `App.jsx`, se confirmaron controles editables y se reiteró que el bloqueo actual es del host.
- 2026-05-10: Se mejoraron menú, hover, estados activos, drawer móvil y modo oscuro persistente; `DESIGN.md` se actualizó con esas decisiones.