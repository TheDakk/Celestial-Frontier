/** U2: one sheet, stack and motion presentation owner. Native focus/Close,
 * panel scrolling and Compendium's virtual scrollport retain their owners. */
const SHEETS = ":is(#codexpanel,#recpanel,#atlaspanel,#chpanel,#primepanel,#shipyardpanel,#inventorypanel,#combatpanel,#setpanel,#guidepanel,#notificationpanel)";
export const UI_SHEET_CSS = `
:root{--cf-lower-top:calc(100dvh - var(--safe-bottom) - 164px);--cf-sheet-floor:calc(var(--cf-lower-top) - 8px);--cf-sheet-bottom:calc(100dvh - var(--cf-sheet-floor));--cf-toast-bottom:calc(100dvh - var(--cf-lower-top) + 8px);--cf-toast-height:0px}
${SHEETS},#survey{--cf-sheet-start:calc(var(--topbar-h) + 8px);top:var(--cf-sheet-start);bottom:auto;min-height:0;max-height:max(44px,calc(var(--cf-sheet-floor) - var(--cf-sheet-start)));overflow-y:auto;overscroll-behavior:contain;scrollbar-color:var(--cf-color-border) transparent;border-radius:var(--cf-radius-panel);border-color:var(--cf-color-border)}
.panel{z-index:var(--cf-layer-sheet)}
#codexpanel .compendium-scroll{height:min(560px,max(44px,calc(var(--cf-sheet-floor) - var(--topbar-h) - 116px)))}
.panel[aria-hidden="false"],#survey[aria-hidden="false"]{animation:cf-sheet-enter var(--cf-duration-enter) var(--cf-ease-standard)}
@keyframes cf-sheet-enter{from{box-shadow:0 4px 12px #0004}to{box-shadow:0 8px 28px #0008}}
#survey{z-index:var(--cf-layer-survey)}
:is(#setpanel,#guidepanel,#notificationpanel){z-index:var(--cf-layer-utility-panel)}
body:not(.training) :is(#codexpanel,#recpanel,#atlaspanel,#chpanel,#primepanel,#shipyardpanel,#inventorypanel,#combatpanel){z-index:var(--cf-layer-utility-panel)}
.panel .sheet-header{position:sticky;top:0;z-index:1;clear:none;display:flex;align-items:center;gap:8px;min-height:44px;box-sizing:border-box;margin:0 0 12px;padding:0 0 8px;background:var(--cf-color-surface);color:var(--cf-color-accent-gold);font-size:var(--cf-type-section);line-height:1.4;letter-spacing:.06em;border-bottom:1px solid var(--cf-color-border)}
.panel .sheet-header::before{font-size:18px;letter-spacing:0}
.panel [data-sheet-kind="set"]::before{content:'⚙'}
.panel [data-sheet-kind="guide"]::before{content:'?'}
.panel [data-sheet-kind="codex"]::before{content:'📖'}
.panel [data-sheet-kind="atlas"]::before{content:'🌍'}
.panel [data-sheet-kind="ch"]::before{content:'📜'}
.panel [data-sheet-kind="rec"]::before{content:'🏆'}
.panel [data-sheet-kind="notifications"]::before{content:'🔔'}
.panel .sheet-close{position:sticky;top:0;z-index:3;margin:0 -4px 0 8px;transform:translateX(44px)}
.survey-head{position:sticky;top:0;z-index:3;background:var(--cf-color-surface)}
#planetside{position:fixed;left:calc(var(--safe-left) + 12px);bottom:var(--cf-sheet-bottom);max-width:min(560px,calc(100vw - var(--safe-left) - var(--safe-right) - 24px));box-sizing:border-box;z-index:var(--cf-layer-sheet);border-radius:var(--cf-radius-panel);padding:8px 10px;overflow:auto;white-space:nowrap;scrollbar-width:thin}
#toast{bottom:var(--cf-toast-bottom);z-index:var(--cf-layer-toast);transition:opacity var(--cf-duration-exit) var(--cf-ease-standard)}
#tutcard{z-index:var(--cf-layer-training)}#tutspot{z-index:calc(var(--cf-layer-training) - 1)}
body.training :is(#survey,#codexpanel,#recpanel,#atlaspanel,#chpanel,#primepanel,#shipyardpanel,#inventorypanel,#combatpanel).tutpri{z-index:var(--cf-layer-training-surface)}
body.training #setpanel{z-index:var(--cf-layer-training-settings)}
:is(.panel,#survey,#dock,#topbar,#sceneactions,#raillft,#railrgt) :is(button,input,select){transition:background-color var(--cf-duration-press) var(--cf-ease-standard),border-color var(--cf-duration-press) var(--cf-ease-standard),box-shadow var(--cf-duration-press) var(--cf-ease-standard)}
:is(.panel,#survey) button:not(:disabled):hover{border-color:var(--cf-color-accent-teal)}
:is(.panel,#survey,#dock,#sceneactions,#raillft,#railrgt) button:not(:disabled):active{box-shadow:inset 0 0 0 2px var(--cf-color-accent-gold)}
:is(.panel,#survey) button:is([aria-pressed="true"],[aria-selected="true"],.sel){border-color:var(--cf-color-accent-gold);box-shadow:inset 0 0 0 1px var(--cf-color-accent-gold)}
:is(.panel,#survey) button:disabled{cursor:default;filter:saturate(.45)}
:is(.panel,#survey) :is(button,input,select):focus-visible{outline:2px solid var(--cf-color-accent-gold);outline-offset:2px}
@media(max-width:900px) and (orientation:portrait){
 body.surface-mode #planetside{min-height:0;max-height:max(72px,min(calc(var(--cf-sheet-floor) - var(--surface-chrome-bottom) - 8px),var(--planetside-card-max,100dvh)));overflow-y:auto}
 body.surface-mode.card-open #planetside{--planetside-card-max:calc(var(--cf-sheet-floor) - var(--topbar-h) - 80px)}
 body.surface-mode #survey{max-height:max(44px,calc(var(--planetside-top,var(--cf-sheet-floor)) - var(--cf-sheet-start) - 8px))}
}
@media(min-width:901px){
 :is(#recpanel,#guidepanel,#notificationpanel,#inventorypanel,#combatpanel){top:auto;left:auto;right:calc(var(--safe-right) + 16px);bottom:var(--cf-sheet-bottom);max-height:max(44px,calc(var(--cf-sheet-floor) - var(--safe-top) - 12px))}
 #shipyardpanel{left:auto;right:calc(var(--safe-right) + 16px);top:calc(var(--topbar-h) + 112px);bottom:auto;max-height:max(44px,calc(var(--cf-sheet-floor) - var(--topbar-h) - 112px))}
 #setpanel{left:auto;right:calc(var(--safe-right) + 16px);top:calc((var(--topbar-h) + var(--cf-sheet-floor)) / 2);bottom:auto;transform:translateY(-50%);max-height:max(44px,calc(var(--cf-sheet-floor) - var(--topbar-h) - 16px))}
}
@media(max-width:900px) and (orientation:landscape){
 body.panel-open .panel,body.panel-open #notificationpanel{--cf-sheet-start:calc(var(--safe-top) + 6px);top:var(--cf-sheet-start);bottom:auto;left:calc(var(--safe-left) + 8px);right:auto;transform:none;width:calc((100vw - var(--safe-left) - var(--safe-right) - 36px) / 2);max-height:calc(100dvh - var(--safe-top) - var(--safe-bottom) - 30px)}
 body.surface-mode #planetside{top:calc(var(--topbar-h) + 6px);bottom:auto;min-height:0;max-height:max(44px,calc(var(--cf-sheet-floor) - var(--topbar-h) - 6px))}
 body.panel-open #toast{width:calc((100vw - var(--safe-left) - var(--safe-right) - 36px) / 2);right:calc(var(--safe-right) + 12px)}
}
@media(prefers-reduced-motion:reduce){:is(.panel,#survey,#toast,#tutspot,#dock,#topbar,#sceneactions,#raillft,#railrgt),:is(.panel,#survey,#dock,#topbar,#sceneactions,#raillft,#railrgt) *{transition:none!important;animation:none!important}}
body.motion-reduced :is(.panel,#survey,#toast,#tutspot,#dock,#topbar,#sceneactions,#raillft,#railrgt),body.motion-reduced :is(.panel,#survey,#dock,#topbar,#sceneactions,#raillft,#railrgt) *{transition:none!important;animation:none!important}
`;
