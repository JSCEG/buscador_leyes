/**
 * Buscador Jurídico · preset de Tailwind 3.4 generado desde project/tokens.json.
 * Uso en tailwind.config.js:  presets: [require('./src/design/tailwind.preset.js')]
 * Cada color se expone como función para que los modificadores de opacidad (bg-guinda/10)
 * sigan funcionando con variables CSS, vía color-mix.
 * Los colores apuntan a las variables de variables.css, así que el tema cambia sin clases dark:.
 * Los nombres heredados (guinda, verde, dorado, bg, txt…) se conservan como alias para no romper el HTML actual.
 */
const preset = {
  "darkMode": [
    "selector",
    "[data-theme=\"dark\"]"
  ],
  "theme": {
    "extend": {
      "colors": {
        "surface-0": "var(--surface-0)",
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        "surface-sunken": "var(--surface-sunken)",
        "surface-inverse": "var(--surface-inverse)",
        "ink": "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-muted": "var(--ink-muted)",
        "ink-inverse": "var(--ink-inverse)",
        "primary": "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "on-primary": "var(--on-primary)",
        "brand": "var(--brand)",
        "brand-hover": "var(--brand-hover)",
        "on-brand": "var(--on-brand)",
        "brand-soft": "var(--brand-soft)",
        "gold": "var(--gold)",
        "accent": "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "highlight": "var(--highlight)",
        "link": "var(--link)",
        "hairline": "var(--hairline)",
        "border": "var(--hairline)",
        "control": "var(--border)",
        "border-strong": "var(--border-strong)",
        "focus": "var(--focus)",
        "success": "var(--success)",
        "success-soft": "var(--success-soft)",
        "warning": "var(--warning)",
        "warning-soft": "var(--warning-soft)",
        "danger": "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        "info": "var(--info)",
        "info-soft": "var(--info-soft)",
        "col-ley": "var(--col-ley)",
        "col-reglamento": "var(--col-reglamento)",
        "col-disposicion": "var(--col-disposicion)",
        "col-permiso": "var(--col-permiso)",
        "col-decreto": "var(--col-decreto)",
        "navy-950": "var(--navy-950)",
        "navy-900": "var(--navy-900)",
        "navy-700": "var(--navy-700)",
        "navy-500": "var(--navy-500)",
        "navy-300": "var(--navy-300)",
        "navy-100": "var(--navy-100)",
        "sand-50": "var(--sand-50)",
        "sand-100": "var(--sand-100)",
        "sand-200": "var(--sand-200)",
        "sand-300": "var(--sand-300)",
        "guinda-700": "var(--guinda-700)",
        "guinda-500": "var(--guinda-500)",
        "guinda-300": "var(--guinda-300)",
        "guinda-100": "var(--guinda-100)",
        "tec-fv": "var(--tec-fv)",
        "tec-eo": "var(--tec-eo)",
        "tec-hid": "var(--tec-hid)",
        "tec-cc": "var(--tec-cc)",
        "tec-cog": "var(--tec-cog)",
        "tec-geo": "var(--tec-geo)",
        "tec-csp": "var(--tec-csp)",
        "tec-h2": "var(--tec-h2)",
        "tec-ci": "var(--tec-ci)",
        "tec-bio": "var(--tec-bio)",
        "tec-nuc": "var(--tec-nuc)",
        "tec-alm": "var(--tec-alm)",
        "map-land": "var(--map-land)",
        "map-water": "var(--map-water)",
        "map-boundary": "var(--map-boundary)",
        "map-kv400": "var(--map-kv400)",
        "map-kv230": "var(--map-kv230)",
        "map-kv161": "var(--map-kv161)",
        "map-kv115": "var(--map-kv115)",
        "map-kv34": "var(--map-kv34)",
        "map-node": "var(--map-node)",
        "glass-fill": "var(--glass-fill)",
        "glass-stroke": "var(--glass-stroke)",
        "scrim": "var(--scrim)",
        "guinda": "var(--brand)",
        "guinda-dk": "var(--brand-hover)",
        "guinda-lt": "var(--guinda-300)",
        "verde": "var(--col-disposicion)",
        "verde-lt": "var(--col-disposicion)",
        "dorado": "var(--accent)",
        "dorado-lt": "var(--gold)",
        "gris": "var(--ink-muted)",
        "gris-claro": "var(--hairline)",
        "bg": "var(--surface-0)",
        "bg-card": "var(--surface-1)",
        "txt": "var(--ink)",
        "txt-muted": "var(--ink-muted)"
      },
      "fontFamily": {
        "display": [
          "Newsreader",
          "Patria",
          "Georgia",
          "serif"
        ],
        "sans": [
          "Noto Sans",
          "Segoe UI",
          "system-ui",
          "sans-serif"
        ],
        "mono": [
          "IBM Plex Mono",
          "ui-monospace",
          "Menlo",
          "monospace"
        ],
        "head": [
          "Newsreader",
          "Patria",
          "Georgia",
          "serif"
        ],
        "body": [
          "Noto Sans",
          "Segoe UI",
          "system-ui",
          "sans-serif"
        ]
      },
      "borderRadius": {
        "xs": "var(--radius-xs)",
        "sm": "var(--radius-sm)",
        "md": "var(--radius-md)",
        "lg": "var(--radius-lg)",
        "xl": "var(--radius-xl)",
        "pill": "var(--radius-pill)"
      },
      "boxShadow": {
        "sm": "var(--shadow-sm)",
        "md": "var(--shadow-md)",
        "lg": "var(--shadow-lg)",
        "glass": "var(--shadow-glass)"
      },
      "maxWidth": {
        "measure": "var(--measure)",
        "content": "var(--content-max)"
      },
      "height": {
        "nav": "var(--nav-height)",
        "touch": "var(--touch)"
      },
      "minHeight": {
        "touch": "var(--touch)"
      },
      "width": {
        "toc": "var(--toc-width)"
      },
      "transitionTimingFunction": {
        "out": "var(--ease-out)"
      },
      "transitionDuration": {
        "fast": "140ms",
        "base": "220ms",
        "slow": "360ms"
      }
    }
  }
};

const withOpacity = value => ({ opacityValue }) =>
  opacityValue === undefined || opacityValue === '1'
    ? value
    : `color-mix(in srgb, ${value} calc(${opacityValue} * 100%), transparent)`;

const colors = preset.theme.extend.colors;
for (const name of Object.keys(colors)) colors[name] = withOpacity(colors[name]);

module.exports = preset;
