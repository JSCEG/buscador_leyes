# Mapa de las DACG de mecanismos competitivos del CENACE

Se cotejaron los **40 fragmentos oficiales** cargados en Supabase con la copia PDF que el propio CENACE publica en su sección de marco regulatorio. El mapa cubre las 26 páginas del documento (páginas impresas 54–79 del DOF), incluidas las tablas y fórmulas de los apartados 5.4–5.7.

- Cada fragmento tiene páginas y anclas geométricas; la nota editorial de Supabase se excluye porque no forma parte del acuerdo.
- Fuente de la ficha oficial: [SIDOF, acuerdo publicado el 3 de abril de 2026](https://sidof.segob.gob.mx/notas/docFuente/5784027).
- PDF remoto cotejado: [copia oficial alojada por CENACE](https://www.cenace.gob.mx/Docs/16_MARCOREGULATORIO/SENyMEM/%28DOF%202026-04-03%20SENER%29%20DACG%20Criterios%20para%20aplicaci%C3%B3n%20Mecanismos_Competitivos_Confiabilidad%20SEN.pdf). La copia corresponde al acuerdo íntegro de la edición matutina del DOF del 3 de abril de 2026.
- SHA-256 de la edición cotejada: `d48705b079e9742cd38b920870a45d2100ebffa043b30bcff78432b54f40191e`. Tamaño: 555,364 bytes; 26 páginas.
- El PDF se descargó sólo a `tmp/` para el cotejo. No se incorpora PDF ni imagen a Git; el lector lo solicita a CENACE y verifica la huella.

Estado técnico antes de publicar: mapa agregado al manifiesto (revisión 65), proxy limitado a la URL oficial exacta y pruebas del mapa/proxy aprobadas. Lint y build aprobados; suite completa: 374 pruebas aprobadas antes de añadir la prueba final del mapa. Falta ejecutar esa suite definitiva y verificar el despliegue público.
