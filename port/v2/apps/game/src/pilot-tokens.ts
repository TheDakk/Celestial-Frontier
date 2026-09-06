/* Candidate component tokens. No global chrome or deterministic palette changes. */
export const PILOT_TOKENS = Object.freeze({
  space: '#071219', panel: '#10252b', raised: '#19343a', line: '#416164',
  text: '#e7eee8', muted: '#a3b7b4', light: '#b9d9d0', accent: '#dcc38d',
  harm: '#ff5a4a', gain: '#7fe6a0', player: '#6fd3ff',
  fontBody: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontDisplay: 'Georgia, Times New Roman, serif',
  spacing: Object.freeze([4, 8, 12, 16, 24, 32, 48]),
  radius: 16, durationMs: 220, easing: 'cubic-bezier(.2,.7,.2,1)',
});
export const PILOT_COMPONENT_CSS = `
.cf-pilot{--p-space:${PILOT_TOKENS.space};--p-panel:${PILOT_TOKENS.panel};--p-line:${PILOT_TOKENS.line};--p-text:${PILOT_TOKENS.text};--p-muted:${PILOT_TOKENS.muted};--p-accent:${PILOT_TOKENS.accent};color:var(--p-text);font:15px/1.5 ${PILOT_TOKENS.fontBody};color-scheme:dark}
.cf-pilot *{box-sizing:border-box}.cf-pilot h1,.cf-pilot h2,.cf-pilot h3,.cf-pilot p{margin:0}
.cf-pilot h1,.cf-pilot h2{font-family:${PILOT_TOKENS.fontDisplay};font-weight:400;line-height:1.08;letter-spacing:-.035em}
.cf-pilot h1{font-size:clamp(38px,6vw,76px)}.cf-pilot h2{font-size:clamp(28px,4vw,44px)}.cf-pilot h3{font-size:18px;font-weight:500}
.cf-pilot .p-eyebrow{font:11px/1.5 ${PILOT_TOKENS.fontBody};letter-spacing:.2em;text-transform:uppercase;color:var(--p-accent)}
.cf-pilot .p-muted{color:var(--p-muted)}.cf-pilot .p-card{border:1px solid var(--p-line);border-radius:16px;background:linear-gradient(140deg,#183337,#0b1b23);box-shadow:inset 0 1px #b9d9d022,0 18px 40px #0004;overflow:hidden}
.cf-pilot .p-pad{padding:24px}.cf-pilot .p-stack{display:grid;gap:16px}.cf-pilot .p-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.cf-pilot .p-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:24px}
.cf-pilot button,.cf-pilot select,.cf-pilot .p-button{font:inherit;min-height:44px;padding:10px 16px;border:1px solid #617e7e;border-radius:10px;color:var(--p-text);background:#163338;text-decoration:none;cursor:pointer}
.cf-pilot button:disabled{opacity:.55;cursor:default}.cf-pilot button[aria-pressed=true],.cf-pilot .p-primary{color:#101b20;background:var(--p-accent);border-color:var(--p-accent)}
.cf-pilot button:focus-visible,.cf-pilot select:focus-visible,.cf-pilot a:focus-visible{outline:3px solid #6fd3ff;outline-offset:4px}
.cf-pilot .p-vista{position:relative;isolation:isolate;aspect-ratio:3/2;background:#10202a;overflow:hidden}.cf-pilot .p-vista img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.cf-pilot .p-ship{width:100%;height:auto;display:block;filter:drop-shadow(0 16px 20px #0009)}
.cf-pilot .p-portrait{display:block;background:transparent;object-fit:contain;max-width:none}.cf-pilot .p-portrait-wrap{position:relative;width:max-content;max-width:100%;background:radial-gradient(ellipse,#29424588,#07121900 70%)}
.cf-pilot .p-portrait-accent{position:absolute;right:-10px;top:-10px;width:7px;height:7px;background:var(--p-accent);pointer-events:none}
@keyframes cf-pilot-portrait-accent{to{transform:rotate(360deg)}}.cf-pilot[data-motion=animated] .p-vista [data-depth=far]{animation:cf-pilot-atmosphere 12s ease-in-out infinite alternate}@keyframes cf-pilot-atmosphere{to{opacity:.86}}
.cf-pilot dl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0}.cf-pilot dt{color:var(--p-muted)}.cf-pilot dd{text-align:right;margin:0}.cf-pilot .p-divider{height:1px;background:var(--p-line);border:0;margin:16px 0}
@media(prefers-reduced-motion:reduce){.cf-pilot *,.cf-pilot *::after{animation:none!important;transition:none!important}}
@media(forced-colors:active){.cf-pilot .p-card,.cf-pilot button,.cf-pilot select{border:1px solid CanvasText;background:Canvas;color:CanvasText}.cf-pilot .p-muted,.cf-pilot .p-eyebrow{color:CanvasText}}
`;
