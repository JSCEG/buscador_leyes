-- Official source links that sent readers to the wrong document or to a certificate warning.

-- The Ley del Sector Eléctrico pointed to the whole 18-mar-2025 decree, which opens with the
-- Ley de la Empresa Pública del Estado, Comisión Federal de Electricidad.
update public.leyes
set url_original = 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LSE.pdf'
where siglas = 'LSE'
  and url_original = 'https://www.diputados.gob.mx/LeyesBiblio/ref/lse/LSE_orig_18mar25.pdf';

-- www.dof.gob.mx serves a certificate issued only for dof.gob.mx, so browsers warn.
-- Move to the covered host and drop the "#gsc.tab=0" search widget hash.
update public.leyes
set url_original = regexp_replace(
        regexp_replace(url_original, '^https?://www\.dof\.gob\.mx/', 'https://dof.gob.mx/'),
        '#gsc\.tab=\d*$', '')
where url_original ~ '^https?://www\.dof\.gob\.mx/';
