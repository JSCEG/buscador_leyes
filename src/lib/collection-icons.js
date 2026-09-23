/** One line icon per acervo collection (24×24, stroked with currentColor). Static, trusted markup. */
const PATHS = Object.freeze({
    all: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    // Balanza: la ley
    leyes: '<path d="M12 3v17M8 20h8M5 7h14M12 4.5 5 7M12 4.5 19 7"/><path d="m5 7-2.8 6.2a3 3 0 0 0 5.6 0Z"/><path d="m19 7-2.8 6.2a3 3 0 0 0 5.6 0Z"/>',
    // Libro con renglones: el reglamento que desarrolla la ley
    reglamentos: '<path d="M4 19.5V5a2.5 2.5 0 0 1 2.5-2.5H20v17H6.5A2.5 2.5 0 0 0 4 22a2.5 2.5 0 0 1 2.5-2.5"/><path d="M9 7.5h7M9 11.5h5"/>',
    // Documento con firma: el acuerdo
    acuerdos: '<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8Z"/><path d="M14 2.5V8h5.5"/><path d="M8 17.5c1.2-1.8 2.2-1.8 2.8 0s1.6 1.8 2.8 0 1.8-1 2.6.3"/>',
    // Lista verificada: disposiciones administrativas de carácter general
    dacg: '<rect x="4.5" y="4" width="15" height="18" rx="2"/><path d="M9 2.5h6v3H9z"/><path d="m8.5 11.5 1.6 1.6 3-3.1M8.5 17h7"/>',
    // Megáfono: la convocatoria
    convocatorias: '<path d="M3.5 10.5v3a1 1 0 0 0 1 1H7l6 4.5v-14L7 9.5H4.5a1 1 0 0 0-1 1Z"/><path d="M16.5 9a4.2 4.2 0 0 1 0 6M19.2 6.3a8 8 0 0 1 0 11.4"/>',
    // Escudo con palomita: la norma técnica
    normas: '<path d="M12 2.5 4.5 5.5v5.8c0 4.6 3.2 8.4 7.5 10.2 4.3-1.8 7.5-5.6 7.5-10.2V5.5Z"/><path d="m8.8 12 2.3 2.3 4.2-4.6"/>',
    // Carpeta: otros instrumentos
    otros: '<path d="M3 6.5a2 2 0 0 1 2-2h4.2l2 2.2H19a2 2 0 0 1 2 2v9.8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
});

export function collectionIcon(groupId, size = 16) {
    const paths = PATHS[groupId] || PATHS.otros;
    return `<svg aria-hidden="true" focusable="false" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
