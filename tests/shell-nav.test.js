import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { openMoreSheet, syncRailGroups } from '../src/scripts/shell-more.js';

const KEPT_IDS = ['nav-leyes', 'nav-inicio', 'nav-cronologia', 'nav-permisos', 'nav-polos', 'nav-analisis', 'nav-stats', 'nav-reto', 'nav-ayuda',
  'nav-como-funciona', 'nav-favorites', 'nav-login-btn', 'nav-user-label', 'darkmode-toggle', 'darkmode-icon-moon', 'darkmode-icon-sun', 'keyboard-help-btn',
  'mobile-menu-btn', 'mobile-menu-overlay', 'mobile-menu-drawer', 'close-mobile-menu', 'mobile-nav-inicio', 'mobile-nav-leyes', 'mobile-nav-cronologia',
  'mobile-nav-permisos', 'mobile-nav-polos', 'mobile-nav-analisis', 'mobile-nav-stats', 'mobile-nav-como-funciona', 'mobile-nav-reto', 'mobile-nav-ayuda',
  'mobile-nav-favorites', 'mobile-nav-desk', 'mobile-nav-login-btn', 'mobile-user-label', 'mobile-nav-admin', 'mobile-nav-usuarios', 'brand-home', 'nav-admin', 'nav-usuarios'];

const loadIndex = () => {
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
};

describe('app shell', () => {
  beforeEach(loadIndex);

  it('offers seven destinations and keeps every id', () => {
    expect(document.querySelectorAll('.bu-riel__nav > [data-nav]')).toHaveLength(7);
    for (const id of KEPT_IDS) expect(document.getElementById(id), id).not.toBeNull();
  });

  it('groups Estadísticas in Análisis and the rest in Aprende', () => {
    const analisis = document.querySelector('.bu-riel [data-nav="analisis"]');
    expect(analisis.querySelector('#nav-analisis')).not.toBeNull();
    expect(analisis.querySelector('#nav-stats')).not.toBeNull();
    const aprende = document.querySelector('.bu-riel [data-nav="aprende"]');
    for (const id of ['#nav-como-funciona', '#nav-reto', '#nav-ayuda']) expect(aprende.querySelector(id), id).not.toBeNull();
  });

  it('keeps the theme choices in the «Más» sheet and in the rail', () => {
    expect(document.querySelectorAll('#mobile-menu-drawer [data-theme-choice]')).toHaveLength(4);
    expect(document.querySelectorAll('.bu-riel [data-theme-choice]')).toHaveLength(4);
  });

  it('opens the sheet through the menu button', () => {
    let opened = 0;
    document.getElementById('mobile-menu-btn').addEventListener('click', () => { opened += 1; });
    openMoreSheet();
    expect(opened).toBe(1);
  });

  it('opens and marks the group holding the current section', () => {
    document.getElementById('nav-stats').setAttribute('aria-current', 'page');
    syncRailGroups();
    const group = document.querySelector('[data-nav="analisis"]');
    expect(group.open).toBe(true);
    expect(group.classList.contains('is-current')).toBe(true);
    expect(document.querySelector('[data-nav="aprende"]').classList.contains('is-current')).toBe(false);
  });
});

describe('saved links', () => {
  const source = readFileSync('src/scripts/ui.js', 'utf8');
  it.each(['#art:', '#ley:', 'permiso=', 'resolucion=', 'tramite=', 'lectura-', 'mapa-permisos'])('%s still has a route', hash => {
    const both = source + readFileSync('src/lib/cne-api.js', 'utf8') + readFileSync('src/scripts/permits-map-view.js', 'utf8') + readFileSync('src/scripts/article-page-view.js', 'utf8');
    expect(both.includes(hash) || both.includes(hash.replace('#', '').replace(':', ''))).toBe(true);
  });
});
