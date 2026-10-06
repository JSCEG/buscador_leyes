# Sincronización de la reforma constitucional en materia de simplificación orgánica

Se vincularon los 29 fragmentos oficiales cargados en Supabase con las páginas de la edición vespertina del DOF del 20 de diciembre de 2024. Se excluyó la nota editorial del buscador; la firma y publicación permanecen como fragmento oficial relacionado dentro del decreto.

- Publicación oficial: https://sidof.segob.gob.mx/notas/docFuente/5745905
- Edición PDF remota: https://sidof.segob.gob.mx/notas/getNewsletter/20-12-2024/Vespertina/318281
- Páginas impresas del decreto: 2–10. La edición completa tiene 168 páginas.
- SHA-256 de la edición cotejada: `878e180516f11559603f1c361026978b42ec475e50d0a3628cfae4ec61de9ee6`.
- Se verificaron 30/30 IDs y hashes de texto de Supabase frente a la carga cotejada. No se subió una copia del PDF a Git.

Para regenerar mapas, el PDF verificado debe estar disponible localmente en `tmp/pdfs/reforma-simplificacion-dof-2024-12-20.pdf`. Ejecuta `preparar.py` con el runtime Python del proyecto y luego `node publicar.mjs`.
