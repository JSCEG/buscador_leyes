/**
 * Printed pages (and "Guardar como PDF") get the brand, the consultation date and the page
 * address at the top, and the legal note at the bottom. Hidden on screen; see print.css.
 */
import '../styles/print.css';

const LEGAL = 'Documento de consulta generado con Buscador Jurídico. El texto con validez jurídica es el publicado en el Diario Oficial de la Federación o en la fuente oficial de cada instrumento.';

export function initPrintBrand() {
    const head = document.createElement('div');
    head.id = 'print-brand';
    head.setAttribute('aria-hidden', 'true');
    head.innerHTML = '<img src="/img/logo-buscador.png" alt="Buscador Jurídico"><p><span></span><br><span></span></p>';
    const foot = document.createElement('p');
    foot.id = 'print-legal';
    foot.setAttribute('aria-hidden', 'true');
    foot.textContent = LEGAL;
    document.body.prepend(head);
    document.body.append(foot);

    const fill = () => {
        const date = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        const [when, where] = head.querySelectorAll('p span');
        when.textContent = `Consultado el ${date}`;
        where.textContent = `${location.host}${location.pathname}${location.hash}`;
    };
    fill();
    window.addEventListener('beforeprint', fill);
}
