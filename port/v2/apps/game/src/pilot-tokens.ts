/* Shared pilot typography and component tokens; semantic palette owners remain unchanged. */
import { PILOT_FONT_URL } from './pilot-assets.js';
export const PILOT_TOKENS = Object.freeze({
  space: '#080f1b', panel: '#111e30', raised: '#192a40', line: '#455b76',
  text: '#edf2f9', muted: '#b0bfd2', light: '#c3d6ea', accent: '#ddc28a',
  harm: '#f0a4a4', gain: '#9ee49d', player: '#6fd3ff',
  fontBody: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontDisplay: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: Object.freeze({ caption: 12, body: 14, section: 16, title: 22 }),
  fontWeight: Object.freeze({ regular: 400, medium: 500, heading: 600 }),
  spacing: Object.freeze([4, 8, 12, 16, 24, 32, 48]),
  radius: 8, durationMs: 180, easing: 'cubic-bezier(.2,.7,.2,1)',
});
export const PILOT_COMPONENT_CSS = `
@font-face{font-family:Inter;src:url("${PILOT_FONT_URL}") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}
.cf-pilot{--p-space:${PILOT_TOKENS.space};--p-panel:${PILOT_TOKENS.panel};--p-line:${PILOT_TOKENS.line};--p-text:${PILOT_TOKENS.text};--p-muted:${PILOT_TOKENS.muted};--p-accent:${PILOT_TOKENS.accent};color:var(--p-text);font:${PILOT_TOKENS.fontSize.body}px/1.5 ${PILOT_TOKENS.fontBody};color-scheme:dark}
.cf-pilot *{box-sizing:border-box}.cf-pilot h1,.cf-pilot h2,.cf-pilot h3,.cf-pilot p{margin:0}
.cf-pilot h1,.cf-pilot h2{font-family:${PILOT_TOKENS.fontDisplay};font-weight:${PILOT_TOKENS.fontWeight.heading};line-height:1.25;letter-spacing:-.01em}
.cf-pilot h1{font-size:${PILOT_TOKENS.fontSize.title}px}.cf-pilot h2{font-size:${PILOT_TOKENS.fontSize.section}px}.cf-pilot h3{font-size:${PILOT_TOKENS.fontSize.body}px;font-weight:${PILOT_TOKENS.fontWeight.heading}}
.cf-pilot .p-eyebrow{font:${PILOT_TOKENS.fontSize.caption}px/1.5 ${PILOT_TOKENS.fontBody};letter-spacing:.1em;text-transform:uppercase;color:var(--p-accent)}
.cf-pilot .p-muted{color:var(--p-muted)}.cf-pilot .p-card{min-width:0;border:1px solid var(--p-line);border-radius:8px;background:linear-gradient(145deg,#192a3ce8,#0d192beb);box-shadow:inset 0 1px #c3d6ea18,0 5px 14px #0003;overflow:hidden}
.cf-pilot .p-pad{padding:16px}.cf-pilot .p-stack{display:grid;gap:10px}.cf-pilot .p-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.cf-pilot .p-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px}
.cf-pilot button,.cf-pilot select,.cf-pilot .p-button{font:inherit;min-height:44px;min-width:44px;padding:10px 14px;border:1px solid #6a7e98;border-radius:6px;color:var(--p-text);background:#17273c;text-decoration:none;cursor:pointer}
.cf-pilot button:disabled{opacity:.55;cursor:default}.cf-pilot button[aria-pressed=true],.cf-pilot .p-primary{color:#111b2a;background:var(--p-accent);border-color:var(--p-accent)}
.cf-pilot button:focus-visible,.cf-pilot select:focus-visible,.cf-pilot a:focus-visible,.cf-pilot summary:focus-visible,.cf-pilot input:focus-visible,.cf-pilot [tabindex]:focus-visible{outline:3px solid #6fd3ff;outline-offset:3px}
.cf-pilot input[type=checkbox]{width:20px;height:20px;margin:0;accent-color:var(--p-accent)}.cf-pilot .p-check{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px;cursor:pointer}
.cf-pilot .p-disclosure{border-top:1px solid var(--p-line);margin-top:12px}.cf-pilot .p-disclosure>summary{min-height:44px;padding:12px 4px;cursor:pointer;color:var(--p-text);font-weight:600}.cf-pilot .p-disclosure-body{padding:0 4px 12px;display:grid;gap:12px}
.cf-pilot .p-vista{position:relative;isolation:isolate;aspect-ratio:3/2;background:#10202a;overflow:hidden}.cf-pilot .p-vista img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
.cf-pilot .p-ship{width:100%;height:auto;display:block;pointer-events:none;filter:drop-shadow(0 10px 16px #0008)}
.cf-pilot .p-portrait{display:block;background:transparent;object-fit:contain;max-width:none}.cf-pilot .p-portrait-wrap{position:relative;width:max-content;max-width:100%;background:radial-gradient(ellipse,#24385188,#080f1b00 70%)}
.cf-pilot .p-portrait-accent{position:absolute;right:-10px;top:-10px;width:7px;height:7px;background:var(--p-accent);pointer-events:none}
@keyframes cf-pilot-portrait-accent{to{transform:rotate(360deg)}}.cf-pilot[data-motion=animated] .p-vista [data-depth=far]{animation:cf-pilot-atmosphere 12s ease-in-out infinite alternate}@keyframes cf-pilot-atmosphere{to{opacity:.86}}
.cf-pilot dl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0}.cf-pilot dt{color:var(--p-muted)}.cf-pilot dd{text-align:right;margin:0}.cf-pilot .p-divider{height:1px;background:var(--p-line);border:0;margin:8px 0}
@media(prefers-reduced-motion:reduce){.cf-pilot *,.cf-pilot *::after{animation:none!important;transition:none!important}}
@media(forced-colors:active){.cf-pilot .p-card,.cf-pilot button,.cf-pilot select,.cf-pilot .p-button{border:1px solid CanvasText;background:Canvas;color:CanvasText}.cf-pilot .p-muted,.cf-pilot .p-eyebrow{color:CanvasText}.cf-pilot :focus-visible{outline-color:Highlight}}
`;
