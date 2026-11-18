// Videos explicativos de los recorridos de Temas Transversales, por id de recorrido.
// Viven en código y no en el catálogo: el catálogo puede venir de Supabase y editarse
// desde el panel, y una edición no debe borrar el video.
// Guion, voz y cuadros: video-temas/<slug>/guion.json. Se arma con
// `node scripts/build-video-tema.mjs <slug>`, que escribe los tres archivos de public/video/.
export const TEMA_VIDEOS = {
  'planeacion-vinculante': {
    titulo: '¿Qué es la planeación vinculante?',
    resumen: 'Quién planea el sector energético, qué planes publica y por qué todos deben seguirlos.',
    duracion: '1:20',
    src: '/video/planeacion-vinculante.mp4',
    poster: '/video/planeacion-vinculante.webp',
    subtitulos: '/video/planeacion-vinculante.vtt',
    fundamentos: [
      { label: 'LPTE · Artículo 2', articleId: 'cc0ff4c9-59ad-4f8c-acb3-906e691b33ae' },
      { label: 'LPTE · Artículo 21', articleId: '3e0d9d78-e421-452a-ada1-5054c39f3869' },
      { label: 'LPTE · Artículo 23', articleId: 'eacb779d-7bf5-4d2c-912b-88a59ad25bce' },
      { label: 'LSE · Artículo 11', articleId: 'e4fbfffc-2dd0-469f-ab7f-69c2102e2699' },
      { label: 'LSE · Artículo 12', articleId: '2938b70d-fd3e-4fc3-9941-6e2237a818d4' },
      { label: 'LSE · Artículo 13', articleId: '4f05fa29-9909-5b4d-8f12-e01b2927ca8e' },
      { label: 'LSH · Artículo 8', articleId: 'de08db51-9fac-532c-a1b6-98ec84a03843' },
    ],
  },
};
