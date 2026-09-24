import { buildInstrumentTimeline } from '../lib/instrument-timeline.js';
import { escapeHtml } from '../lib/explorer-model.js';
import '../styles/instrument-timeline.css';

const dateText = date => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

export function renderInstrumentTimeline(container, data, { onOpenLaw, onOpenArticle }) {
    const { entries, unavailableCount } = buildInstrumentTimeline(data);
    container.innerHTML = `
        <section class="it-timeline" aria-labelledby="instrument-timeline-title">
            <div class="it-heading">
                <div><p class="it-kicker">Historia y documentos relacionados</p><h2 id="instrument-timeline-title">Línea del tiempo</h2></div>
                <span class="it-count">${entries.length} ${entries.length === 1 ? 'documento' : 'documentos'}</span>
            </div>
            <p class="it-intro">Lo que se ha publicado sobre este documento. Cada uno se lee por separado.</p>
            <ol class="it-events" aria-label="Documentos por fecha" tabindex="0">
                ${entries.map(entry => `
                    <li class="it-event${entry.current ? ' it-current' : ''}" data-timeline-id="${escapeHtml(entry.id)}">
                        <div class="it-date"><span class="it-point" aria-hidden="true"></span>${entry.date ? `<time datetime="${entry.date}">${dateText(entry.date)}</time>` : '<span>Sin fecha</span>'}<small>${entry.date ? escapeHtml(entry.dateLabel) : 'No sabemos la fecha exacta'}</small></div>
                        <div class="it-card" ${entry.current ? 'aria-current="true"' : ''}>
                            <div class="it-tags"><span>${escapeHtml(entry.type)}</span>${entry.current ? '<strong>Lo estás viendo</strong>' : ''}</div>
                            <p class="it-role">${escapeHtml(entry.role)}</p>
                            <h3>${escapeHtml(entry.title)}</h3>
                            ${entry.acronym ? `<p class="it-acronym">${escapeHtml(entry.acronym)}</p>` : ''}
                            ${entry.context ? `<p class="it-context">${escapeHtml(entry.context)}</p>` : ''}
                            <div class="it-actions">
                                ${entry.current ? '<span class="it-open-current">Abierto ahora</span>' : `<a class="it-open" data-timeline-key="${escapeHtml(entry.key)}" href="#${entry.kind === 'instrument' ? 'ley' : 'art'}-${encodeURIComponent(entry.id)}" aria-label="Abrir ${escapeHtml(entry.title)}">Abrir documento <span aria-hidden="true">→</span></a>`}
                                ${entry.source ? `<a class="it-source" href="${escapeHtml(entry.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.sourceLabel)} <span aria-hidden="true">↗</span></a>` : ''}
                            </div>
                        </div>
                    </li>`).join('')}
            </ol>
            <p class="it-note">${entries.length === 1 ? 'Por ahora no hay otros documentos relacionados con este.' : 'Están ordenados por fecha; no todos cambian a este documento. Esto no es un texto consolidado.'}${unavailableCount ? ' Algunos documentos mencionados todavía no están en el acervo.' : ''}</p>
        </section>`;
    container.querySelectorAll('[data-timeline-key]').forEach(link => link.addEventListener('click', event => {
        // Preserve native new-tab behavior and usable hash links.
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        const entry = entries.find(item => item.key === link.dataset.timelineKey);
        if (!entry) return;
        event.preventDefault();
        if (entry.kind === 'instrument') onOpenLaw(entry.id);
        else onOpenArticle(entry.id);
    }));
}
