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
          titulo: 'Ley Test',
          fecha: '2024-01-01',
          articulos: 2,
          temas_clave: ['mercado'],
          id: 'ley-1',
          resumen: 'Ley Test',
        },
        {
          titulo: 'Reglamento Test',
          fecha: 'N/D',
          articulos: 3,
          temas_clave: [],
          id: 'ley-2',
          resumen: 'Reglamento Test',
        },
      ],
    });
  });

  it('returns mapped paginated search results from Supabase', async () => {
    const rangeMock = vi.fn().mockResolvedValue({
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

    const ilikeMock = vi.fn(() => ({ range: rangeMock }));
    const eqMock = vi.fn(() => ({
      ilike: ilikeMock,
    }));
    const textSearchMock = vi.fn(() => ({
      eq: eqMock,
    }));

    fromMock.mockReturnValueOnce({
      select: vi.fn(() => ({
        textSearch: textSearchMock,
      })),
    });

    const { performSearch } = await import('../src/scripts/search-engine.js');
    const result = await performSearch('texto prueba', 2, 10, {
      law: 'Ley Test',
      artNum: '1',
    });

    expect(fromMock).toHaveBeenCalledWith('articulos');
    expect(textSearchMock).toHaveBeenCalledWith('fts', 'texto & prueba');
    expect(eqMock).toHaveBeenCalledWith('leyes.titulo', 'Ley Test');
    expect(ilikeMock).toHaveBeenCalledWith('identificador', '%1%');
    expect(rangeMock).toHaveBeenCalledWith(10, 19);
    expect(result).toEqual({
      data: [
        {
          id: 'art-1',
          ley_origen: 'Ley Test',
          fecha_publicacion: '2024-01-01',
          articulo_label: 'Artículo 1',
          tipo_articulo: 'ordinario',
          titulo_nombre: '',
          capitulo_nombre: '',
          texto: 'Texto de prueba',
          score: 100,
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
