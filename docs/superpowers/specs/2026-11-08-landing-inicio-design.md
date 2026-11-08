# Landing de inicio

Fecha: 2026-11-08. Estado: diseño aprobado en conversación; falta revisión del texto escrito.

## Propósito

El sitio abre en una landing que carga de inmediato, en lugar de la intro del búho 3D. El búho sigue, pero solo cuando alguien lo pide. La imagen de referencia del usuario inspira la composición; los colores, las secciones y los textos son los del sitio.

## Punto de partida (medición)

Visita nueva, sitio publicado (commit aa97000), Chrome sin ventana y sin GPU, por lo que el búho sale más lento que en una máquina real.

| Marca | Escritorio sin límite | Celular 4G lento (1.6 Mbps, 150 ms, CPU x4) |
|---|---|---|
| Primer texto (FCP) | 0.7–1.9 s | 3.2–6.0 s, y es el texto del buscador viejo |
| Página lista (DOMContentLoaded) | 0.7–1.4 s | 4.9–8.1 s |
| Búho dibujado | 5.3–12.5 s | Nunca; imagen de respaldo a los 19–21 s |
| Catálogo (`search-ready`) | 6.1–12.8 s | 19.9–22.6 s |
| KB hasta la primera pantalla | 709 | 709 |

Script: `measure-load.mjs` en el scratchpad de la sesión. Se repite igual al terminar.

## Decisiones del usuario

1. Galería por scroll con secciones reales y, al final, foto del búho con botón a la guía. El 3D se descarga solo al tocar.
2. La landing sale en cada visita y al tocar el logo. El estante 3D sigue vivo con su propia dirección.
3. El logo solo lleva a la landing. Deja de abrir el búho.
4. Titular: «Las reglas de la energía en México, a la mano.»

## Primera pantalla

Marcado estático en `index.html`, para que se pinte antes del JavaScript.

- **Texto:** titular (`a la mano.` en `--rojo`), párrafo, caja de búsqueda real, botón «Buscar» en tinta (`--accion`) y enlace «Ver los documentos».
- **Abanico:** tres portadas reales que enlazan a `#ficha-<id>`. Sus identificadores se comprueban contra el catálogo real durante la implementación.
- **Tarjeta «Qué hay en el acervo»:** una barra por tipo de documento con su color `--col-*`; cada una lleva a ese tipo en Acervo. Se llena con `search-ready`. Mientras tanto usa las cifras guardadas de la última visita (`intro-cifras`) o queda en espera, sin inventar números.
- **Franja inferior:** Tu mesa de consulta, selector de los 4 temas (`bu-seg`, `data-theme-choice`) y cifra «N artículos en M documentos».
- **Armazón:** se conserva `.bu-riel`, `.bu-cab-m` y `#bottom-nav`. No se añade barra superior.

Si alguien busca antes de que cargue el JavaScript, el formulario guarda la consulta y se ejecuta al arrancar.

## Galería

Se pinta por JavaScript debajo de la primera pantalla, con entrada al hacer scroll mediante `IntersectionObserver`. Título: «Lo que encuentras aquí».

| Sección | Texto | Muestra | Origen |
|---|---|---|---|
| Buscar | Escribe una palabra y ve cada artículo donde aparece. | Ejemplos que lanzan una búsqueda | Los ejemplos de `#quick-filters` |
| Acervo | Todos los documentos, por tipo y dependencia. Por artículo o como libro. | Portadas y enlace al estante | `summaries`, `coverHTML` |
| Cronología | Qué se publicó y cuándo, en una sola línea. | Línea con fechas | `fecha_publicacion` de `summaries` |
| Permisos | Quién tiene permiso de energía y dónde, en el mapa. | Mapa de México de fondo y mosaicos de tecnología | `mexico-map.js`, `TECH_MARKERS` |
| Polos | Los polos de desarrollo: dónde están y cómo van. | Mapa con puntos reales y conteo | `/polos/polos.json`, al acercarse |
| Aprende | Cómo funciona una central, en figuras que giras y desarmas. | Miniaturas | `/conceptos/miniaturas/*.webp`, diferidas |

Cierre: foto del búho (`intro-buho-claro|oscuro.webp`, `loading="lazy"`; solo el tema oscuro usa la oscura: sepia y contraste tienen fondo claro), «¿Primera vez? El búho te enseña el sitio.» y botón «Abrir la guía» con `data-abrir-buho`. Sin WebGL sigue saliendo el recorrido clásico, como ya hace `openOwlGuide`.

Pie: el aviso legal y los enlaces que hoy tiene el estante (`Términos de uso`, `Privacidad`, `Enviar comentario`).

## Textos

- Párrafo: «Escribe una palabra y ve en qué ley, reglamento o acuerdo aparece. Gratis y sin registrarte.»
- Caja: «Busca una ley, un artículo o un tema».
- Mesa: «Tu mesa de consulta. Junta artículos de varias leyes y léelos lado a lado.» Enlace: «Abrir mi mesa».
- Tarjeta: «Qué hay en el acervo».

## Arranque y rutas

- Un script en `<head>` marca `html.landing-boot` cuando la ruta es `/` o `/index.html`, sin hash. Una regla en línea oculta `#main-container` y el pie y muestra la landing, sin destello del buscador viejo. Las direcciones profundas, `/instalar`, `/ley/…` y los retornos de autenticación no la llevan.
- `main.js` deja de llamar `playIntro`. Se quitan `shouldShowIntro` y `window.__introDone`.
- `ui.js`: dirección vacía y logo muestran la landing (`showLandingView`), que libera y crea su vista como hoy `showHomeView` hace con el estante.
- Estante: `#estante` nueva. `#ficha-…` lo sigue abriendo; cerrar una ficha deja `#estante`, no la dirección vacía. «Estante 3D» de Acervo y el enlace de la landing van ahí.
- `site-intro.js`: el clic en el logo deja de abrir el búho. Quedan `data-abrir-buho`, «Guía rápida» y Ayuda.
- Tour automático de bienvenida: no se dispara para quien llega por la landing, aunque busque antes de que llegue el catálogo. Quien entra por un enlace directo sigue igual.
- Una búsqueda hecha antes de que llegue el catálogo conserva sus resultados cuando este llega.

## Unidades

| Archivo | Hace |
|---|---|
| `src/lib/landing-model.js` | Funciones puras: cifras, barras por tipo, fechas para la línea, a partir de `summaries`. |
| `src/scripts/landing-view.js` | Conecta el marcado estático, pinta la galería, recibe el catálogo, expone `setCatalog`, `setFailed` y `destroy`. |
| `src/styles/landing.css` | Estilos con tokens de `variables.css` y componentes `bu-*`. |
| `index.html` | Marcado de la primera pantalla y script/estilo de arranque. |

## Errores y casos límite

- Catálogo caído: la tarjeta y la cifra se ocultan; la búsqueda, los enlaces y la galería estática siguen.
- `polos.json` o una miniatura fallan: la sección queda sin conteo o sin imagen, sin mensaje de error.
- `prefers-reduced-motion`: sin animaciones de entrada; todo visible.
- Cambio de tema: colores por tokens; la foto del búho se cambia sin recargar.
- Regla de Supabase: ninguna consulta nueva. Todo sale de `search-ready`.

## Fuera de alcance

- Borrar el video, el respaldo con emblema y la intro CSS de `site-intro.js`, que quedan sin uso.
- Diferir d3, anime y marked o partir el paquete de 663 KB, que siguen retrasando el catálogo.

## Pruebas y criterios de aceptación

- Vitest: `landing-model`, `landing-view`, rutas en `ui-home.test.js` y `site-intro-video.test.js` actualizados.
- `npm run lint`, `npx vitest run` y `npm run build` pasan.
- Navegador: 1440, 820 y 390 px por los 4 temas, sin scroll horizontal, con contraste legible y enlaces que funcionan.
- Medición después, mismo script y perfiles: al cargar `/` no se pide `buho.html`, y en celular 4G lento la landing se ve antes que el primer texto de hoy (3.2–6.0 s) y sin el búho de por medio.
