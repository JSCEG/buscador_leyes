---
version: alpha
name: SENER Legal Search Design System
description: Sistema visual institucional para el buscador jurídico energético.
colors:
  background: "#F7F1E7"
  surface: "#FFFAF1"
  text: "#20171B"
  muted: "#6C5B58"
  border: "#E8D8C7"
  accent: "#9B2247"
  success: "#1E5B4F"
  warning: "#A57F2C"
typography:
  display:
    fontFamily: Merriweather
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
rounded:
  sm: 10px
  md: 16px
  lg: 24px
spacing:
  sm: 8px
  md: 16px
  lg: 32px
components:
  hero-panel:
    backgroundColor: "#FFFAF1"
    textColor: "#20171B"
    rounded: "{rounded.lg}"
    padding: 32px
  search-input:
    backgroundColor: "#FFFFFF"
    textColor: "#20171B"
    rounded: "{rounded.lg}"
    padding: 16px
  feature-card:
    backgroundColor: "#FFFAF1"
    textColor: "#20171B"
    rounded: "{rounded.lg}"
    padding: 24px
---

## Overview

Dirección visual para una aplicación institucional de consulta jurídica: cálida, editorial y sobria, con acentos SENER en guinda, verde energía y dorado.

## Colors

- `accent` se usa para acciones, énfasis jurídico e indicadores de navegación.
- `success` se reserva para energía, temas y estados positivos.
- `warning` funciona como acento patrimonial y foco accesible.
- Los fondos nunca son blanco puro; usan superficies crema con grano sutil.

## Typography

Merriweather sostiene titulares con tono jurídico/editorial. Noto Sans se usa para lectura de interfaz, filtros y textos largos.

## Layout

La portada prioriza una tarjeta hero amplia, buscador elevado y tarjetas informativas con profundidad ligera. En móvil se reduce a una columna sin recortes horizontales.

## Elevation & Depth

Sombras cálidas, bordes guinda translúcidos y capas con blur ligero para separar header, buscador y tarjetas sin parecer genérico.

## Shapes

Radios grandes en superficies principales; chips y controles usan píldoras para sugerencias y metadatos.

## Components

- Header translúcido con borde institucional fino.
- Menú con subrayado activo guinda/dorado, hover elevado y `aria-current` en la sección vigente.
- Drawer móvil cálido con estados activos laterales y foco visible.
- Toggle de modo oscuro persistente, respetando guinda, verde energía y dorado sobre superficies profundas.
- Hero panel con sello tipográfico y órbitas decorativas.
- Search input prominente con foco dorado.
- Feature cards con iconografía monocroma y copy específico.

## Do's and Don'ts

- Do: mantener guinda, verde y dorado como acentos jerárquicos.
- Do: preservar lectura jurídica, sobria y de alta confianza.
- Don't: introducir gradientes morados, blanco plano o tarjetas genéricas sin contenido normativo.
