/* Opt-in Phase-1 presentation only. Native geometry, semantic hue owners,
 * accessibility preferences and control ownership remain authoritative. */
import { PILOT_TOKENS as T } from './pilot-tokens.js';
export const PILOT_RUNTIME_CSS = `
body[data-cf-pilot-look]:not(.font-sys):not(.font-mono){--ui:${T.fontBody}}
body[data-cf-pilot-look]{--cf-pilot-body-size:14px;--cf-pilot-small-size:12px;--cf-pilot-heading-size:15px;--cf-pilot-title-size:16px;--cf-pilot-gap:8px;--cf-pilot-radius:8px;--cf-pilot-rule:rgba(87,112,154,.42)}
body[data-cf-pilot-look] :is(.panel,#survey,#planetside,#inventorysheet){font-size:14px;font-family:var(--ui);font-variant-numeric:tabular-nums}
body[data-cf-pilot-look] :is(.panel,#survey,#planetside,#inventorysheet) :is(button,input,select,textarea,summary,h2,h3,h4){font-family:var(--ui)}
body[data-cf-pilot-look] :is(.panel,#survey,.inventory-sheet-card){border-radius:8px;border-color:#536888;background:linear-gradient(145deg,rgba(20,32,51,.98),rgba(8,16,30,.98));box-shadow:inset 0 1px #d0e4ff16,0 10px 32px #0008}
/* The native 58px gutter already reserves Close. Avoid charging the grid body
 * another 44px for its float while leaving that full-height gutter intact. */
body[data-cf-pilot-look] .panel-close{margin-right:-44px;margin-left:0;transform:none}
body[data-cf-pilot-look] :is(.panel,#survey,#inventorysheet) :is(h2,h3,h4){font-size:16px;font-weight:600;letter-spacing:0;gap:6px}
body[data-cf-pilot-look] :is(.panel,#survey,#inventorysheet) :is(button:not(.atlas-chart-point),input,select,textarea){border-radius:6px}
body[data-cf-pilot-look] :is(.inventory-panel-body,.inventory-detail,[data-star-atlas-body]){gap:8px}
body[data-cf-pilot-look] #inventorypanel button.inventory-row{border-radius:6px;padding:8px 10px}
body[data-cf-pilot-look] .inventory-badge{border-radius:4px}
body[data-cf-pilot-look] #atlaspanel .atlas-filters>button{gap:6px}
body[data-cf-pilot-look] #planetside button{min-height:44px;min-width:44px;padding:8px 12px;border:1px solid #61799d;border-radius:6px;color:var(--ink);background:#17263c;font:inherit;cursor:pointer}
body[data-cf-pilot-look] :is(.panel,#survey,#planetside,#inventorysheet) :is(button,input,select,textarea,summary):not(.compendium-row):focus-visible{outline:3px solid #6fd3ff;outline-offset:2px}
[data-cf-audiovisual-pilot]{pointer-events:none}
[data-cf-pilot-scene]{position:fixed;z-index:1;inset:var(--topbar-h,96px) 0 calc(var(--safe-bottom,0px) + var(--dock-h,68px) + 32px);pointer-events:none;overflow:hidden;background:#091724}
[data-cf-pilot-scene][hidden]{display:none}
[data-cf-pilot-scene] .p-vista{width:100%;height:100%;aspect-ratio:auto;background:radial-gradient(ellipse,#1f3744,#071423)}
[data-cf-pilot-scene] .p-vista img{object-fit:contain;animation:none}
/* One actual committed landfall owns this finite decorative ship. The
 * canonical residents and all input targets remain underneath untouched. */
[data-cf-pilot-ship="landing"]{position:absolute;pointer-events:none;z-index:1;width:clamp(112px,28vw,260px);height:auto;max-height:34%;object-fit:contain;left:50%;top:38%;transform:translate(-50%,-50%);opacity:1;filter:drop-shadow(0 10px 12px #0008)}
[data-cf-pilot-ship="landing"][hidden]{display:none}
[data-cf-pilot-ship="landing"][data-motion="animated"]{animation:cf-pilot-landfall 1800ms ease-out both}
[data-cf-pilot-ship="landing"][data-motion="static"]{animation:none}
@keyframes cf-pilot-landfall{0%{transform:translate(-50%,-115%) scale(.68);opacity:0}18%{opacity:1}70%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}
/* The header keeps its existing Close column and row height. */
.survey-head:has([data-cf-pilot-ship="landing"]){grid-template-columns:minmax(0,1fr) 72px 44px;align-items:center}
.survey-head [data-cf-pilot-ship="landing"]{position:static;width:72px;height:44px;max-height:none;transform:none;filter:none}
.survey-head [data-cf-pilot-ship="landing"][data-motion="animated"]{animation:cf-pilot-header-landfall 1800ms ease-out both}
@keyframes cf-pilot-header-landfall{0%{transform:translateY(-4px) scale(.75);opacity:0}18%{opacity:1}70%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(0) scale(1);opacity:0}}
@media(prefers-reduced-motion:reduce){[data-cf-pilot-ship="landing"]{animation:none!important}}
[data-cf-pilot-controls]{position:fixed;right:calc(var(--safe-right,0px) + 12px);bottom:calc(var(--safe-bottom,0px) + var(--dock-h,68px) + 12px);z-index:80;pointer-events:auto;width:max-content;max-width:min(300px,calc(100vw - var(--safe-left,0px) - var(--safe-right,0px) - 24px));max-height:max(44px,calc(100dvh - var(--topbar-h,96px) - var(--safe-bottom,0px) - var(--dock-h,68px) - 30px));overflow:auto;overscroll-behavior:contain;background:#101d30fa;border:1px solid #566c8a;border-radius:8px;padding:0 10px;box-shadow:0 5px 16px #0006}
[data-cf-pilot-controls] summary{min-height:44px;display:flex;align-items:center;cursor:pointer;color:#ddc28a;font-weight:500;gap:8px}
[data-cf-pilot-controls] summary::before{content:'+';font-size:16px}
[data-cf-pilot-controls][open] summary::before{content:'−'}
[data-cf-pilot-controls][open]{width:300px;padding-bottom:8px}
[data-cf-pilot-controls] p{font-size:12px;margin:8px 0;line-height:1.45}
[data-cf-pilot-controls] button{width:100%;margin:4px 0;padding:8px 10px}
[data-cf-pilot-controls] label{min-height:44px;display:flex;gap:8px;align-items:center}
body.fs-lg [data-cf-pilot-controls]{font-size:15px}body.fs-xl [data-cf-pilot-controls]{font-size:17px}
body.fs-lg [data-cf-pilot-controls] p{font-size:14px}body.fs-xl [data-cf-pilot-controls] p{font-size:16px}
body:is(.font-sys,.font-mono) [data-cf-pilot-controls]{font-family:var(--ui)}
body.card-open [data-cf-pilot-controls],body.panel-open [data-cf-pilot-controls],body.training [data-cf-pilot-controls],
body:has(#tutcard:not([hidden]):not([aria-hidden="true"]):not([style*="display:none"]):not([style*="display: none"])) [data-cf-pilot-controls],
body:has(#importsheet:not([hidden]):not([aria-hidden="true"]):not([style*="display:none"]):not([style*="display: none"])) [data-cf-pilot-controls],
body:has(#inventorysheet:not([hidden]):not([aria-hidden="true"]):not([style*="display:none"]):not([style*="display: none"])) [data-cf-pilot-controls]{display:none!important;pointer-events:none!important}
@media(forced-colors:active){body[data-cf-pilot-look] :is(.panel,#survey,.inventory-sheet-card),body[data-cf-pilot-look] #planetside button{background:Canvas;border-color:CanvasText;color:CanvasText}}
`;
