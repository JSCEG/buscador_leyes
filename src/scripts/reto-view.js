/**
 * Reto Jurídico (#reto): five questions a day generated from the acervo (src/lib/reto-engine.js),
 * the same for everyone, with a streak and a shareable result. After each answer the source opens
 * in the reader. A practice round with other questions does not count for the streak.
 */
import { buildReto, planPassages, isCorrect, resultLine, retoNumber, dayKey, streakFrom, seededRandom, RETO_LENGTH } from '../lib/reto-engine.js';
import { loadAllDefinitions, loadArticlesOf } from './reto-data.js';
import '../styles/reto.css';

const STORE = 'reto-resultados';
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const LETTERS = ['A', 'B', 'C', 'D'];

const readResults = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { return {}; } };
function saveResult(day, marks) {
    const all = readResults();
    all[day] = { marks, at: new Date().toISOString() };
    // Keep the last year.
    const keys = Object.keys(all).sort();
    for (const key of keys.slice(0, Math.max(0, keys.length - 366))) delete all[key];
    try { localStorage.setItem(STORE, JSON.stringify(all)); } catch { /* private mode */ }
}

export function renderRetoView(container, catalog, { onOpenLaw = () => {} } = {}) {
    let alive = true;
    const summaries = () => (typeof catalog === 'function' ? catalog() || [] : catalog || []);
    const today = dayKey();
    const number = retoNumber(today);

    const root = document.createElement('section');
    root.className = 'rt-view';
    root.setAttribute('aria-labelledby', 'rt-title');
    root.innerHTML = `
        <div class="rt-head">
            <p class="rt-eyebrow">Reto Jurídico <span>#${number}</span></p>
            <h1 id="rt-title">El reto del día</h1>
            <p class="rt-intro">Cinco preguntas armadas con el acervo: definiciones oficiales, pasajes de artículos, quién emite cada instrumento y cuándo se publicó. Cambia cada día y es el mismo para todos.</p>
            <div class="rt-stats" aria-live="polite"></div>
        </div>
        <div class="rt-stage"><div class="rt-card rt-loading"><i></i><i></i><i></i></div></div>`;
    container.replaceChildren(root);
    const stage = root.querySelector('.rt-stage');

    function drawStats() {
        const results = readResults();
        const days = Object.keys(results);
        const streak = streakFrom(days, today) || streakFrom(days, dayKey(new Date(Date.now() - 864e5)));
        const perfect = days.filter(day => results[day].marks.every(Boolean)).length;
        root.querySelector('.rt-stats').innerHTML = `
            <span><b>${streak}</b> ${streak === 1 ? 'día seguido' : 'días seguidos'}</span>
            <span><b>${days.length}</b> ${days.length === 1 ? 'reto jugado' : 'retos jugados'}</span>
            <span><b>${perfect}</b> ${perfect === 1 ? 'perfecto' : 'perfectos'}</span>`;
    }

    async function prepare(seed) {
        const laws = summaries().filter(law => law?.titulo);
        const glossary = await loadAllDefinitions(laws);
        // The plan depends only on the seed and the catalogue, so every visitor gets the same reto.
        const plan = planPassages(seededRandom(`plan:${seed}`), laws, today);
        const passages = await Promise.all(plan.map(async law => ({ law, rows: await loadArticlesOf(law.id) })));
        return buildReto({ laws, glossary, passages, seed });
    }

    function start({ seed, practice }) {
        // While playing, the header shrinks so the question fits on a phone screen.
        root.classList.add('is-playing');
        stage.innerHTML = '<div class="rt-card rt-loading"><i></i><i></i><i></i></div>';
        prepare(seed).then(questions => {
            if (!alive) return;
            if (questions.length < 3) { stage.innerHTML = '<div class="rt-card"><p>No pudimos armar el reto de hoy. Intenta más tarde.</p></div>'; return; }
            play(questions, { practice });
        }).catch(() => {
            if (alive) stage.innerHTML = '<div class="rt-card"><p>No pudimos cargar el acervo para el reto. Revisa tu conexión e intenta de nuevo.</p><button type="button" class="rt-btn rt-retry">Reintentar</button></div>';
            stage.querySelector('.rt-retry')?.addEventListener('click', () => start({ seed, practice }));
        });
    }

    function play(questions, { practice }) {
        const marks = [];
        let index = 0;

        const dots = () => `<ol class="rt-dots" aria-label="Progreso">${questions.map((_, i) => `<li class="${i < marks.length ? (marks[i] ? 'is-ok' : 'is-bad') : i === index ? 'is-now' : ''}"><span class="sr-only">Pregunta ${i + 1}${i < marks.length ? (marks[i] ? ': correcta' : ': incorrecta') : ''}</span></li>`).join('')}</ol>`;

        function show() {
            const q = questions[index];
            const order = q.kind === 'order';
            stage.innerHTML = `
                <article class="rt-card rt-question" aria-labelledby="rt-q-prompt">
                    <div class="rt-q-top">${dots()}<span class="rt-count">${index + 1} de ${questions.length}</span></div>
                    <p class="rt-kind"><span>${esc(q.label)}</span>${q.isNew ? '<span class="rt-new">Nuevo en el acervo</span>' : ''}${practice ? '<span class="rt-practice">Práctica</span>' : ''}</p>
                    <h2 id="rt-q-prompt" class="rt-prompt">${esc(q.prompt)}</h2>
                    ${order ? `<p class="rt-hint">${esc(q.body)}</p>` : `<blockquote class="rt-body">${esc(q.body)}</blockquote>`}
                    <div class="rt-options${order ? ' is-order' : ''}" role="group" aria-label="Opciones">
                        ${q.options.map((option, i) => `<button type="button" class="rt-option" data-option="${i}"><span class="rt-letter">${order ? '' : LETTERS[i]}</span><span class="rt-option-text">${esc(option)}</span></button>`).join('')}
                    </div>
                    ${order ? '<div class="rt-order-actions"><button type="button" class="rt-btn rt-ghost rt-reset">Reiniciar</button><button type="button" class="rt-btn rt-check" disabled>Comprobar</button></div>' : ''}
                    <div class="rt-feedback" aria-live="polite"></div>
                </article>`;
            const box = stage.querySelector('.rt-options');
            // The first question rises to the top of the screen; later ones only need to be in view.
            stage.scrollIntoView({ behavior: 'smooth', block: index === 0 ? 'start' : 'nearest' });

            if (!order) {
                box.addEventListener('click', event => {
                    const button = event.target.closest('[data-option]');
                    if (!button || box.classList.contains('is-done')) return;
                    answer(Number(button.dataset.option));
                }, { once: false });
                return;
            }
            const picked = [];
            const check = stage.querySelector('.rt-check');
            const paintOrder = () => {
                box.querySelectorAll('[data-option]').forEach(button => {
                    const at = picked.indexOf(Number(button.dataset.option));
                    button.classList.toggle('is-picked', at >= 0);
                    button.querySelector('.rt-letter').textContent = at >= 0 ? String(at + 1) : '';
                    button.setAttribute('aria-pressed', String(at >= 0));
                });
                check.disabled = picked.length !== q.options.length;
            };
            box.addEventListener('click', event => {
                const button = event.target.closest('[data-option]');
                if (!button || box.classList.contains('is-done')) return;
                const i = Number(button.dataset.option);
                if (picked.includes(i)) picked.splice(picked.indexOf(i), 1); else picked.push(i);
                paintOrder();
            });
            stage.querySelector('.rt-reset').addEventListener('click', () => { picked.length = 0; paintOrder(); });
            check.addEventListener('click', () => answer([...picked]));
        }

        function answer(response) {
            const q = questions[index];
            const ok = isCorrect(q, response);
            marks.push(ok);
            const box = stage.querySelector('.rt-options');
            box.classList.add('is-done');
            box.querySelectorAll('[data-option]').forEach(button => {
                const i = Number(button.dataset.option);
                button.disabled = true;
                if (q.kind === 'order') {
                    const right = q.answerOrder.indexOf(i);
                    button.classList.add(response[right] === i ? 'is-right' : 'is-wrong');
                    button.querySelector('.rt-letter').textContent = String(right + 1);
                    button.querySelector('.rt-option-text').insertAdjacentHTML('beforeend', `<small>${esc(q.dates[i])}</small>`);
                } else {
                    if (i === q.answer) button.classList.add('is-right');
                    else if (i === response) button.classList.add('is-wrong');
                }
            });
            stage.querySelector('.rt-order-actions')?.remove();
            const last = index === questions.length - 1;
            stage.querySelector('.rt-feedback').innerHTML = `
                <p class="rt-verdict ${ok ? 'is-ok' : 'is-bad'}">${ok ? '¡Correcto!' : 'No esta vez.'}</p>
                <p class="rt-explain">${esc(q.explain)}</p>
                <div class="rt-feedback-actions">
                    ${q.link?.articleId ? '<button type="button" class="rt-btn rt-ghost rt-source" data-source="article">Ver el artículo</button>' : ''}
                    ${q.link?.lawId && !q.link?.articleId ? '<button type="button" class="rt-btn rt-ghost rt-source" data-source="law">Abrir el instrumento</button>' : ''}
                    <button type="button" class="rt-btn rt-next">${last ? 'Ver resultado' : 'Siguiente'}</button>
                </div>`;
            stage.querySelector('.rt-q-top').innerHTML = `${dots()}<span class="rt-count">${index + 1} de ${questions.length}</span>`;
            stage.querySelector('.rt-source')?.addEventListener('click', () => {
                if (q.link.articleId) document.dispatchEvent(new CustomEvent('analisis:openArticle', { detail: { id: q.link.articleId, list: [q.link.articleId] } }));
                else { const law = summaries().find(item => String(item.id) === String(q.link.lawId)); if (law) onOpenLaw(law); }
            });
            const next = stage.querySelector('.rt-next');
            next.addEventListener('click', () => {
                index++;
                if (index < questions.length) show(); else finish();
            });
            next.focus({ preventScroll: true });
        }

        function finish() {
            if (!practice) saveResult(today, marks);
            drawStats();
            result(marks, { practice });
        }

        show();
    }

    function result(marks, { practice = false } = {}) {
        root.classList.remove('is-playing');
        const score = marks.filter(Boolean).length;
        const line = resultLine(marks);
        const text = `Reto Jurídico #${number} · ${score}/${marks.length}\n${line}\nJuega el reto de hoy: https://buscador-juridico.com/#reto`;
        const message = score === marks.length ? '¡Reto perfecto!' : score >= marks.length - 1 ? '¡Muy bien!' : score >= Math.ceil(marks.length / 2) ? 'Buen resultado' : 'Mañana hay revancha';
        stage.innerHTML = `
            <div class="rt-card rt-result">
                ${practice ? '<p class="rt-kind"><span class="rt-practice">Práctica · no cuenta para tu racha</span></p>' : ''}
                <p class="rt-score"><b>${score}</b><span>/${marks.length}</span></p>
                <p class="rt-message">${message}</p>
                <p class="rt-line" aria-label="${score} de ${marks.length} correctas">${line}</p>
                <div class="rt-result-actions">
                    ${practice ? '' : '<button type="button" class="rt-btn rt-share">Compartir resultado</button>'}
                    <button type="button" class="rt-btn rt-ghost rt-practice-btn">Practicar con otras preguntas</button>
                </div>
                ${practice ? '' : `<p class="rt-next-day">El próximo reto sale en <b class="rt-countdown"></b>.</p>`}
            </div>`;
        stage.querySelector('.rt-share')?.addEventListener('click', async event => {
            try {
                if (navigator.share) { await navigator.share({ text }); return; }
            } catch { /* cancelled */ return; }
            try { await navigator.clipboard.writeText(text); event.target.textContent = 'Copiado: pégalo donde quieras'; } catch {
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
            }
        });
        stage.querySelector('.rt-practice-btn').addEventListener('click', () => start({ seed: `practica-${Date.now()}`, practice: true }));
        const countdown = stage.querySelector('.rt-countdown');
        if (countdown) {
            const tick = () => {
                if (!alive || !countdown.isConnected) return;
                const now = new Date();
                const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                const left = Math.max(0, next - now);
                const h = Math.floor(left / 36e5), m = Math.floor(left / 6e4) % 60;
                countdown.textContent = `${h} h ${String(m).padStart(2, '0')} min`;
                setTimeout(tick, 30000);
            };
            tick();
        }
    }

    function intro() {
        const done = readResults()[today];
        if (done) { result(done.marks); return; }
        stage.innerHTML = `
            <div class="rt-card rt-start">
                <p class="rt-start-title">Reto #${number}</p>
                <ul class="rt-rules">
                    <li><b>${RETO_LENGTH} preguntas</b> sobre leyes, reglamentos y acuerdos del acervo.</li>
                    <li>Una sale de lo <b>publicado recientemente</b>.</li>
                    <li>Después de cada una puedes <b>abrir la fuente</b> y leerla.</li>
                </ul>
                <button type="button" class="rt-btn rt-go">Empezar el reto</button>
            </div>`;
        stage.querySelector('.rt-go').addEventListener('click', () => start({ seed: today, practice: false }));
    }

    drawStats();
    intro();
    return { destroy: () => { alive = false; root.remove(); } };
}
