import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    DESK_LIMIT, clearDesk, deskHash, getDesk, isPinned, moveInDesk, parseDeskHash, pin, reloadDesk, setDesk, togglePin, unpin,
} from '../src/lib/desk-store.js';
import { articleHtml } from '../src/lib/article-html.js';
import { initDesk, pinButtonHtml } from '../src/scripts/desk-view.js';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('desk store', () => {
    beforeEach(() => { localStorage.clear(); reloadDesk(); });

    it('pins, keeps order, persists and refuses duplicates and overflow', () => {
        expect(pin('a').reason).toBe('added');
        expect(pin('a').reason).toBe('already');
        pin('b'); pin('c');
        expect(getDesk()).toEqual(['a', 'b', 'c']);
        reloadDesk();
        expect(getDesk()).toEqual(['a', 'b', 'c']);
        for (let i = 0; i < DESK_LIMIT; i++) pin(`x${i}`);
        expect(getDesk()).toHaveLength(DESK_LIMIT);
        expect(pin('late')).toEqual({ ok: false, reason: 'full' });
    });

    it('moves, removes, toggles and clears', () => {
        setDesk(['a', 'b', 'c']);
        expect(moveInDesk('c', -1)).toBe(true);
        expect(getDesk()).toEqual(['a', 'c', 'b']);
        expect(moveInDesk('a', -1)).toBe(false);
        expect(unpin('c')).toBe(true);
        expect(togglePin('a').reason).toBe('removed');
        expect(isPinned('a')).toBe(false);
        clearDesk();
        expect(getDesk()).toEqual([]);
    });

    it('shares a desk through the hash and trims shared lists to the limit', () => {
        const hash = deskHash(['a b', 'c']);
        expect(parseDeskHash(hash)).toEqual(['a b', 'c']);
        expect(parseDeskHash('#art-1')).toBeNull();
        setDesk(Array.from({ length: 20 }, (_, i) => `id${i}`));
        expect(getDesk()).toHaveLength(DESK_LIMIT);
    });
});

describe('article html', () => {
    it('keeps structure but drops scripts, handlers and javascript links', () => {
        const html = articleHtml('<p onclick="x()">Uno <a href="javascript:alert(1)">l</a></p><script>bad()</script><table><tr><td>t</td></tr></table>');
        expect(html).not.toMatch(/script|onclick|javascript/);
        expect(html).toContain('<table>');
    });

    it('turns plain text into escaped paragraphs', () => {
        expect(articleHtml('Primero <b>\n\nSegundo')).toBe('<p>Primero &lt;b&gt;</p><p>Segundo</p>');
    });
});

describe('desk view', () => {
    const articles = {
        a: { id: 'a', ley_id: 'lse', ley_origen: 'Ley del Sector Eléctrico', siglas_ley: 'LSE', articulo_label: 'Artículo 12', texto: 'Texto doce' },
        b: { id: 'b', ley_id: 'rlse', ley_origen: 'Reglamento de la LSE', siglas_ley: 'RLSE', articulo_label: 'Artículo 45', texto: 'Texto cuarenta y cinco' },
        c: { id: 'c', ley_id: 'lse', ley_origen: 'Ley del Sector Eléctrico', siglas_ley: 'LSE', articulo_label: 'Artículo 3', texto: 'Texto tres' },
    };
    let desk; let loadArticles; let onOpenArticle; let notify;

    beforeEach(() => {
        localStorage.clear(); reloadDesk();
        document.body.innerHTML = '<ul><li class="card"><button id="p1">x</button></li></ul>';
        loadArticles = vi.fn(async ids => ids.map(id => articles[id]).filter(Boolean));
        onOpenArticle = vi.fn(); notify = vi.fn();
        desk = initDesk({ loadArticles, onOpenArticle, notify, lawFor: item => ({ id: item.ley_id, siglas: item.siglas_ley, tipo: item.ley_id.startsWith('r') ? 'reglamento' : 'ley' }) });
    });

    it('pins from any button without triggering the card underneath', () => {
        const card = document.querySelector('.card');
        const cardClick = vi.fn();
        card.addEventListener('click', cardClick);
        card.insertAdjacentHTML('beforeend', pinButtonHtml('a'));
        card.querySelector('[data-pin-article]').click();
        expect(getDesk()).toEqual(['a']);
        expect(cardClick).not.toHaveBeenCalled();
        const button = card.querySelector('[data-pin-article]');
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(button.textContent).toContain('En mi mesa');
        expect(notify).toHaveBeenCalledWith(expect.stringContaining('1 de 12'), expect.anything());
        expect(document.getElementById('desk-toggle').hidden).toBe(false);
    });

    it('opens with the pinned articles, reorders, removes and opens one in the reader', async () => {
        setDesk(['a', 'b']);
        desk.open();
        await flush(); await flush();
        const titles = () => [...document.querySelectorAll('.desk-card h3')].map(h => h.textContent);
        expect(titles()).toEqual(['Artículo 12', 'Artículo 45']);
        expect(document.querySelector('.desk-card[data-id="b"]').dataset.category).toBe('reglamentos');
        document.querySelector('.desk-card[data-id="b"] [data-desk-move="-1"]').click();
        await flush();
        expect(getDesk()).toEqual(['b', 'a']);
        document.querySelector('.desk-card[data-id="a"] [data-desk-open]').click();
        expect(onOpenArticle).toHaveBeenCalledWith('a', [articles.b, articles.a]);
        document.querySelector('.desk-card[data-id="b"] [data-desk-remove]').click();
        await flush();
        expect(getDesk()).toEqual(['a']);
        expect(loadArticles).toHaveBeenCalledTimes(1);
    });

    it('shows up to three chosen articles side by side and closes with Escape', async () => {
        setDesk(['a', 'b', 'c']);
        desk.open();
        await flush(); await flush();
        for (const id of ['a', 'c']) {
            const box = document.querySelector(`[data-desk-select="${id}"]`);
            box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true }));
        }
        document.querySelector('[data-desk-side]').click();
        await flush();
        const side = document.getElementById('desk-side');
        expect(side.hidden).toBe(false);
        expect([...side.querySelectorAll('.desk-column h3')].map(h => h.textContent)).toEqual(['Artículo 12', 'Artículo 3']);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(side.hidden).toBe(true);
    });
});
