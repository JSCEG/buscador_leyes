---
version: 2
name: Búho · Buscador Jurídico
description: Sistema visual Búho aplicado al buscador de normativa energética. Papel, tinta, cristal y un acento por tipo de documento.
colors:
  papel: "#fafafa"
  papel-alto: "#ffffff"
  tinta: "#0a0707"
  tinta-suave: "#5b5e63"
  rojo: "#9b2247"
  accion: "#0a0707"
typography:
  display: Fraunces
  body: Manrope
---

# Búho en el Buscador Jurídico

La fuente de los valores es `src/styles/design/variables.css`. Los componentes viven en `src/styles/design/buho/`.

## Principios

- **Papel y tinta.** El fondo es papel con retícula neutra. Sin bandas ni difuminados rojos.
- **El color es un acento.** Cada tipo de documento tiene el suyo (`--col-*`) y aparece en banda, listón, regla e icono. El texto nunca lleva el color del tipo.
- **La acción principal es tinta** (`--accion`). El guinda (`--rojo`) marca dónde estás y lo seleccionado.
- **Cristal en dos densidades**, `bu-cristal` y `bu-cristal-fuerte`, nunca una encima de otra. En Contraste se apaga.
- **El contenido oficial no cambia.** La presentación solo añade clases; `scripts/audit-tables.mjs` lo comprueba.

## Temas

`data-theme`: `light`, `dark`, `sepia` y `contraste`. Claro y Oscuro son los de Búho; Sepia y Contraste se derivan. Las preferencias siguen en `app-theme` y `app-dark-mode`.

## Tipos de documento

| Tipo | Claro | Oscuro |
|---|---|---|
| Leyes | `#9b2247` | `#e57a9a` |
| Reglamentos | `#2e6fb0` | `#6ea8e0` |
| Acuerdos | `#0e8a6e` | `#3ba98c` |
| Disposiciones | `#0e7f99` | `#39b5d1` |
| Convocatorias | `#a8720c` | `#e0a12e` |
| Normas | `#b84f29` | `#e0784f` |
| Otros | `#5e6671` | `#9aa3ae` |

`[data-category]` fija `--ac` con el color que corresponde. La autoridad SENER usa `--aut-sener`; la CNE, `--rojo`.

## Armazón

| Ancho | Navegación |
|---|---|
| 1200 px o más | Riel de 220 px |
| 768–1199 px | Riel de iconos |
| Menos de 768 px | Cabecera y menú inferior con hoja «Más» |

`--riel-w` y `--riel-off` dicen cuánto ocupa el riel. Lo que se fija a pantalla completa debe respetar `--riel-off`.

## Componentes

| Clase | Uso |
|---|---|
| `.bu-escena` | Fondo de la app |
| `.bu-cristal`, `.bu-cristal-fuerte` | Superficies de vidrio |
| `.bu-btn` con `-primario`, `-contorno`, `-fantasma`, `-sm` | Botones |
| `.bu-chip`, `.bu-insignia`, `.bu-campo`, `.bu-seg` | Controles |
| `.bu-ico` | Mosaico de tipo de permiso (`typeTile`) |
| `.bu-cf` | Carpeta animada (`folderHtml`) |
| `.bu-mini` | Librito neutro |
| `.bu-modal`, `.bu-telon`, `.bu-hoja`, `.bu-toast` | Capas |
| `.ac-*` | Acervo en `styles/acervo.css`: cartel, hileras de portadas (`.sh-cover`) y filtros |
| `.bu-cuenta` | Ventana de cuenta en `buho/account.css`: el lector es un librito y cada cifra abre lo que cuenta |
| `.bux-*` | Componentes anteriores aún en uso, en `buho/components.css`; leen tokens |

## Tablas

Formato de hoja de cálculo en `article-tables.css`: sin cuadrícula, encabezado guinda con borde de 2 px, cifras tabulares a la derecha, «–» donde falta el dato (solo CSS), total guinda con borde superior. Desde 5 columnas, primera columna fija. Si no cabe, «Desliza» y «Ver en grande».

## Movimiento

Tres velocidades (160, 320 y 800 ms). El estante usa resorte críticamente amortiguado con topes (`springStep`). El grafo de resultados conserva su física. Con `prefers-reduced-motion` todo cambia sin animar.

## Mapas

Las líneas de transmisión usan el estándar por tensión (`--map-kv*`), igual en todos los temas. Marcadores en gota por tecnología (`--tec-*`), de 22, 26 o 30 px según capacidad.

## Deuda conocida

`tests/design-leftovers.test.js` fija un tope de `!important` y de colores fuera de tokens, y solo puede bajar. Cada vista que se reescriba debe bajar esos números.
