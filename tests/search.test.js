import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();

vi.mock('../src/lib/supabase.js', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('Search Engine', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('dispatches search-ready with Supabase metadata', async () => {
    const leyesRows = [
      {
        id: 'ley-1',
        titulo: 'Ley Test',
        fecha_publicacion: '2024-01-01',
        temas_clave: ['mercado'],
        articulos: [{ count: 2 }],
      },
      {
        id: 'ley-2',
        titulo: 'Reglamento Test',
        fecha_publicacion: null,
        temas_clave: null,
        articulos: [{ count: 3 }],
      },
    ];

    fromMock.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({
        data: leyesRows,
        error: null,
      }),
    });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { initSearch } = await import('../src/scripts/search-engine.js');

    await initSearch();

    expect(fromMock).toHaveBeenCalledWith('leyes');
    expect(dispatchSpy).toHaveBeenCalledTimes(1);

    const event = dispatchSpy.mock.calls[0][0];
    expect(event.type).toBe('search-ready');
    expect(event.detail).toEqual({
      totalLeyes: 2,
      totalArticulos: 5,
      leyes: ['Ley Test', 'Reglamento Test'],
      summaries: [
        {
          id: 'ley-1',
          titulo: 'Ley Test',
          siglas: null,
          fecha_publicacion: '2024-01-01',
          fecha_ultima_reforma: undefined,
          articulos: 2,
          temas_clave: ['mercado'],
          resumen: 'Ley Test',
          url_original: null,
          tipo: null,
        },
        {
          id: 'ley-2',
          titulo: 'Reglamento Test',
          siglas: null,
          fecha_publicacion: null,
          fecha_ultima_reforma: undefined,
          articulos: 3,
          temas_clave: [],
          resumen: 'Reglamento Test',
          url_original: null,
          tipo: null,
        },
      ],
    });
  });

  it('returns mapped paginated search results from Supabase', async () => {
    const queryMock = {};
    queryMock.select = vi.fn(() => queryMock);
    queryMock.eq = vi.fn(() => queryMock);
    queryMock.ilike = vi.fn(() => queryMock);
    queryMock.textSearch = vi.fn(() => queryMock);
    queryMock.range = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'art-1',
          identificador: 'Artículo 1',
          contenido: 'Texto de prueba',
          tipo_articulo: 'ordinario',
          leyes: {
            titulo: 'Ley Test',
            fecha_publicacion: '2024-01-01',
          },
        },
      ],
      error: null,
      count: 1,
    });

    fromMock.mockReturnValue(queryMock);

    const { performSearch } = await import('../src/scripts/search-engine.js');
    const result = await performSearch('texto prueba', 2, 10, {
      law: 'Ley Test',
      artNum: '1',
    });

    expect(fromMock).toHaveBeenCalledWith('articulos');
    expect(queryMock.textSearch).toHaveBeenCalledWith('fts', 'texto prueba', { config: 'spanish', type: 'phrase' });
    expect(queryMock.eq).toHaveBeenCalledWith('leyes.titulo', 'Ley Test');
    expect(queryMock.ilike).toHaveBeenCalledWith('identificador', '%1%');
    expect(queryMock.range).toHaveBeenCalledWith(10, 19);
    expect(result).toEqual({
      data: [
        {
          id: 'art-1',
          ley_origen: 'Ley Test',
          siglas_ley: null,
          fecha_publicacion: '2024-01-01',
          articulo_label: 'Artículo 1',
          tipo_articulo: 'ordinario',
          titulo_nombre: '',
          capitulo_nombre: '',
          texto: 'Texto de prueba',
          url_original: null,
          score: 1000,
        },
      ],
      total: 1,
    });
  });

  it('returns empty results for short queries', async () => {
    const { performSearch } = await import('../src/scripts/search-engine.js');

    await expect(performSearch('ab')).resolves.toEqual({ data: [], total: 0 });
    expect(fromMock).not.toHaveBeenCalled();
  });
});
