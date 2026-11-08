// Dónde queda la cámara a partir de lo que mira, su giro, su elevación y su distancia. Sin three.js: lo usan también las pruebas.
export const posicionCamara = ({ mira, az, el, d }) => [mira[0] + d * Math.cos(el) * Math.sin(az), mira[1] + d * Math.sin(el), mira[2] + d * Math.cos(el) * Math.cos(az)];
