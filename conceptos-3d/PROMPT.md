# Prompt para las figuras 3D de «¿Cómo funciona?»

Plantilla para pedirle a Claude cada máquina de Aprende con la skill `teardown`, al estilo Búho. Se copia el bloque de la
sección 2, se llenan los corchetes con la ficha de la sección 3 y se pega en Claude Code dentro de este proyecto.

Nace del prompt de ejemplo de la skill (el mosquito y el tren de aterrizaje del Cessna), adaptado a lo que ya tenemos:
la ficha de cada tema en `src/data/como-funciona.js`, la figura actual y su miniatura como referencia, el sistema Búho y
el contrato con la página de Aprende.

## 1. La idea de la página

La gente no lee: entra y toca. Por eso cada tema se abre con la máquina a lo ancho y casi nada de texto.

- Arriba solo el título y una frase (el `resumen` de la ficha).
- La máquina enseguida, grande, con el recorrido andando.
- Todo lo demás (definiciones, ideas clave, fórmulas, errores comunes, leyes y trámites) va abajo, plegado, para quien
  quiera leer.
- La lista de partes de la página y los botones de la máquina son lo mismo: tocar una parte en un lado la marca en el otro.

## 2. El prompt

```text
/teardown Construye [NOMBRE DE LA MÁQUINA] como figura 3D interactiva para «¿Cómo funciona?» del Buscador Jurídico.
Va en conceptos-3d/[ID]/ (main.js + style.css) y se arma con: node scripts/build-conceptos-3d.mjs [ID]
Usa como base conceptos-3d/generador/ y el estilo común de conceptos-3d/comun/: ya traen los colores, la corriente,
la pantalla completa, el logo y los mensajes con Aprende.

— Paso 0. Referencias (nunca de la imaginación) —
Antes de dibujar, lee:
- la ficha del tema en src/data/como-funciona.js (id «[ID]»): partes, claves, fórmulas, dato y errores comunes;
- la figura actual public/conceptos/[FIGURA]-light.html y su miniatura public/conceptos/miniaturas/[FIGURA]-light.webp;
- [IMAGEN O DISEÑO QUE ADJUNTO, SI HAY].
Dime qué tomaste de cada una.

— Paso 1. La máquina —
Hazla con código, en unidades reales: [PIEZAS, EN EL ORDEN DE LA FICHA].
Las piezas son las partes de la ficha, con su mismo número (1, 2, 3…), porque Aprende las sincroniza por número.

Antes de dibujar, escribe el modelo como funciones puras de una sola entrada: [ENTRADA Y SU RANGO].
Usa cifras reales: [CIFRAS]. Compruébalas a mano y enséñame la cuenta. Si una cifra no es segura, dilo y di de dónde sale.
Cada pieza, cada cifra y cada etiqueta salen de ese modelo. Nada se anima a mano.

— Paso 2. Controles —
Sin texto de más: lo que se explica, se explica moviendo la máquina.
- La cifra principal en vivo, grande: [CIFRA PRINCIPAL].
- Un deslizador para la entrada, con su unidad, y la cámara lenta si el movimiento es muy rápido.
- [1 o 2 GRÁFICAS EN VIVO] que se mueven con la máquina.
- Un botón por parte: la resalta en guinda, lleva la cámara a ella y pone su etiqueta con una línea fina hasta la pieza.
- «Ver por dentro»: [QUÉ SE CORTA].
- «Desarmar»: un deslizador de 0 a 1 que separa las piezas a lo largo de [EJE] con su etiqueta, y las vuelve a armar.
  Se puede arrastrar una pieza para sacarla y se regresa sola a su lugar.
- Vistas de cámara como botones: [VISTAS, p. ej. general, frente, lado, adentro].
- Recorrido automático por las partes; cualquier toque da el control y 30 s quieto lo devuelve.
- Pantalla completa: la escena llena la pantalla y abajo flotan las partes, la cifra y el deslizador. En iPhone la
  figura cubre la ventana (Aprende agranda el marco con el mensaje concepto-fullscreen).
- El logo del Buscador (brandMarkSvg de src/lib/brand-mark.js) en una esquina.

— Paso 3. El aspecto (estilo común) —
- Usa conceptos-3d/comun/: estilo.js (paleta, materiales, estudio, contorno y aros), corriente.js (corriente por los
  cables) y estilo.css (tablero, pantalla completa, polos). No copies colores a mano.
- Como la referencia del mosquito mecánico, con guinda en lugar de naranja: carcasas en cerámica blanca brillante,
  lo mecánico en grafito, bordes y tapas en guinda, contorno fino de tinta en lo blanco, tornillos negros que salen
  volando al desarmar y papel con trazos finos de construcción al fondo.
- Toda corriente eléctrica va en amarillo (crearCorriente): puntos que avanzan con la carga que pasa (en alterna
  van y vienen, en directa avanzan) y una marca + guinda y − grafito en cada cable, que se intercambian cuando la
  corriente cambia de sentido. El amarillo es solo para la corriente (el verde es el cable de tierra; el agua va en azul).
- Cables con conexión real: salen de un punto de la máquina, bajan a la base o al piso y corren pegados a él (nunca
  colgando en el aire), rodean lo que estorba y llegan a cada aparato por su conexión normal (el borne de un medidor,
  la base de un foco). Las marcas ± se esconden cuando una pieza tapa el cable.
- Papel claro o noche, según el archivo: [ID]-light.html (claro) y [ID].html (oscuro). Letras Fraunces y Manrope de
  /fonts. Nada de logos institucionales.
- La máquina llena del 60 al 70 % de la escena en escritorio, tablet y celular (en vertical la cámara se aleja).
- Metal con rugosidad de al menos 0.45; piezas casi blancas con un borde de tinta.
- Escoge la cámara para el mecanismo: si de frente se vuelve una maraña, usa vista 3/4.

— Paso 4. Contrato con Aprende —
- Envía {type:'concepto-height', id:'[ID]', h} al cargar y al cambiar de tamaño (no en pantalla completa).
- Envía {type:'concepto-part', figura:'[ID]', n} cuando el visitante elige una parte.
- Escucha {type:'concepto-select-part', n} y {type:'concepto-fullscreen'} según conceptos-3d/generador/main.js.
- Respeta prefers-reduced-motion: sin recorrido automático.
- Cada archivo pesa menos de 1 MB. El tiempo entre cuadros nunca es negativo (clamp de 0 a 0.1 s).

— Paso 5. Revísala como crítico —
Antes de enseñarme nada:
1. Mira una imagen de cada parte del recorrido, en escritorio, tablet y celular, en claro y oscuro: piezas que se
   atraviesan, piezas flotando lejos de su soporte, etiquetas que tapan lo que nombran, cifras que no cuadran con la pose.
2. Recorre «Desarmar» de 0 a 1 en pasos de 0.1 y busca saltos o choques.
3. Los choques se arreglan con un número en el bloque de parámetros, nunca escondiéndolos con la cámara.
4. Comprueba la pantalla completa (entrar, salir, Esc) y la sincronía de partes con la página.
Dime qué revisaste y qué corregiste, y enséñame las imágenes.
```

### Opcional: video para redes

Cuando la figura esté lista, se puede sacar un video del recorrido para la campaña:

```text
Graba el recorrido de [ID]: render(t) como función pura del tiempo, 60 fps, en 1080×1920 (vertical, para redes) y
1920×1080, con Chrome sin ventana y ffmpeg (H.264, yuv420p, faststart). Agrega el logo del Buscador y, al final,
«buscador-juridico.com». Sonido solo de acento (un clic por botón, un zumbido suave mientras gira), a −14 LUFS.
Enséñame una hoja con un cuadro de cada parte.
```

Esto necesita el Chromium de Playwright instalado en la skill (`npx playwright install chromium` dentro de
`~/.claude/skills/teardown`).

## 3. Fichas por máquina

Las cifras marcadas «verificar» hay que confirmarlas en el Paso 1 antes de usarlas.

### Generador (ya hecho, nivel a subir)

- **Piezas:** 1 Turbina (Pelton), 2 Eje, 3 Imán que gira (rotor), 4 Bobinas de cobre (estator), 5 Voltímetro, 6 Foco.
- **Entrada:** ángulo del imán; la velocidad (0 a 3,600 rpm) decide cuánto avanza.
- **Cifras:** dos polos: f = rpm ÷ 60, 3,600 rpm = 60 Hz; 120 V eficaces a 3,600 rpm (170 V de pico); voltaje proporcional
  a la velocidad (V máx = N·A·B·ω).
- **Cifra principal:** Hz. **Gráficas:** voltaje de las 3 bobinas.
- **Por dentro:** la mitad frontal de la carcasa. **Desarmar:** a lo largo del eje: turbina, chumaceras, carcasa, bobinas,
  imán.
- **Vistas:** general, turbina, adentro del estator, voltímetro.

### Motor eléctrico

- **Piezas:** 1 Ventilador, 2 Imán que gira (rotor), 3 Bobinas: electroimanes (estator), 4 Control, 5 Pila (corriente
  directa), 6 Contacto (corriente alterna).
- **Entrada:** ángulo del campo de las bobinas; la frecuencia (0 a 60 Hz) decide cuánto avanza.
- **Cifras:** el rotor sigue al campo; con dos polos, 60 Hz = 3,600 rpm (un motor de inducción real gira un poco menos:
  deslizamiento de 2 a 5 %, verificar).
- **Cifra principal:** rpm. **Gráficas:** corriente de las 3 bobinas.
- **Por dentro:** la carcasa. **Desarmar:** a lo largo del eje.
- **Vistas:** general, adentro, ventilador.

### Transformador

- **Piezas:** 1 Núcleo de hierro, 2 Bobina de pocas vueltas, 3 Bobina de muchas vueltas, 4 Lado de bajo voltaje, 5 Lado
  de alto voltaje.
- **Entrada:** fase de la corriente alterna (60 Hz) y la relación de vueltas.
- **Cifras:** V₂ = V₁ · N₂ ÷ N₁; p. ej. 13.8 kV a 115 kV en una subestación (verificar el ejemplo con la ficha).
- **Cifra principal:** voltaje de salida. **Gráficas:** voltaje de entrada y de salida en la misma escala.
- **Por dentro:** el tanque de aceite. **Desarmar:** bobinas hacia afuera del núcleo.
- **Vistas:** general, núcleo, bobinas.

### Planta fotovoltaica

- **Piezas:** 1 Módulo solar, 2 Seguidor solar, 3 Caja de conexiones, 4 Inversor, 5 Transformador, 6 Línea a la red,
  7 Piranómetro.
- **Entrada:** hora del día (6 a 20 h).
- **Cifras:** irradiancia hasta ~1,000 W/m² al mediodía; el seguidor gira ±60° (verificar); potencia ≈ área × irradiancia
  × eficiencia (~21 %, verificar).
- **Cifra principal:** potencia en kW. **Gráficas:** potencia a lo largo del día.
- **Por dentro:** una celda del módulo (capas). **Desarmar:** capas del módulo.
- **Vistas:** general, módulo, inversor.

### Ciclo combinado

- **Piezas:** 1 Entrada de gas natural, 2 Compresor y cámara de combustión, 3 Turbina de gas, 4 Recuperador de calor
  (HRSG), 5 Turbina de vapor, 6 Torre de enfriamiento / Condensador.
- **Entrada:** carga de la planta (0 a 100 %).
- **Cifras:** eficiencia ~55 a 60 %; la turbina de gas da ~2/3 de la potencia y la de vapor ~1/3; gases de escape a
  ~600 °C (verificar).
- **Cifra principal:** MW. **Gráficas:** reparto gas/vapor y temperatura por etapa.
- **Por dentro:** la turbina de gas. **Desarmar:** etapas en línea.
- **Vistas:** general, turbina de gas, recuperador.

### Gasoductos

- **Piezas:** 1 Tubería enterrada, 2 Estación de compresión, 3 Válvula de seccionamiento, 4 Trampa de diablos,
  5 Estación de regulación y medición (City Gate).
- **Entrada:** flujo de gas.
- **Cifras:** presión de transporte ~70 bar que baja con la distancia y sube en cada compresora (verificar); diámetro
  típico 36 a 48 pulgadas (verificar).
- **Cifra principal:** presión. **Gráficas:** presión a lo largo del ducto.
- **Por dentro:** el tubo (el diablo pasando). **Desarmar:** la estación de compresión.
- **Vistas:** general, compresora, City Gate.

### Almacenamiento (TAR)

- **Piezas:** 1 Tanques verticales, 2 Dique de contención, 3 Isleta de llenado de pipas, 4 Sistema contra incendios.
- **Entrada:** nivel de llenado del tanque (0 a 100 %).
- **Cifras:** capacidad del tanque en barriles; el dique contiene al menos el volumen del tanque mayor (verificar en la
  norma).
- **Cifra principal:** barriles. **Gráficas:** días de inventario.
- **Por dentro:** el tanque (techo flotante). **Desarmar:** techo y anillos del tanque.
- **Vistas:** general, tanque, isleta.

### Refinación

- **Piezas:** 1 Horno de carga, 2 Zona de vaporización (Flash), 3 Gas y GLP, 4 Nafta, 5 Turbosina y queroseno, 6 Diésel,
  7 Residuo atmosférico.
- **Entrada:** temperatura del horno.
- **Cifras:** los cortes de la ficha (<40 °C, 40 a 200 °C, 180 a 250 °C, 250 a 340 °C, >350 °C).
- **Cifra principal:** °C. **Gráficas:** temperatura a lo alto de la torre.
- **Por dentro:** la torre (platos). **Desarmar:** platos de la torre.
- **Vistas:** general, horno, torre.

### Temas sin máquina

Electricidad, voltaje, CD/CA e hidrocarburos se pueden hacer como banco de pruebas 3D con la misma plantilla (pila, foco,
osciloscopio, moléculas). Mercado CENACE, desarrollo mixto, asignaciones y mercado de hidrocarburos no son máquinas: se
quedan con su figura actual, o se hacen como maqueta con una sola entrada (p. ej. la demanda en MW que va encendiendo
centrales por orden de costo hasta fijar el precio).
