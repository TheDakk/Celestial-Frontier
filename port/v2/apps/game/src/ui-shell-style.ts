import { UI_PRESENTATION_DESKTOP_MIN, UI_PRESENTATION_PHONE_MAX } from './ui-presentation-tokens.js';

/** Production v1.8.9 placement adapted to v2's native owners. Nick's screenshot
 * amendments: right objective, icon-only phones, name-only Inventory, Health
 * caption, hidden trail and plain guidance. Touch floors remain 44px. */
export const UI_SHELL_CSS = `
#topbar{position:fixed;inset:0 0 auto;z-index:var(--cf-layer-shell);pointer-events:none;display:grid;grid-template-columns:var(--cf-hud-column) minmax(0,1fr);grid-template-rows:minmax(44px,auto) minmax(44px,auto);align-items:start;gap:8px 14px;padding:max(10px,var(--safe-top)) calc(var(--safe-right) + var(--cf-hud-inset)) 8px calc(var(--safe-left) + var(--cf-hud-inset));background:linear-gradient(180deg,rgba(4,4,12,.7),transparent);border:0;box-sizing:border-box}
#topbar>button,#searchbox{pointer-events:auto}
#dockinventory{grid-column:1;grid-row:1;display:flex;align-items:stretch;min-height:44px;min-width:44px;width:100%;max-width:100%;padding:0;background:none;border:0;border-radius:999px;color:var(--ink);font:inherit;cursor:pointer}
#playerchip{display:flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:0;min-height:44px;width:100%;padding:8px 11px;border-radius:999px;font-size:11px;line-height:1.4;letter-spacing:.06em;text-transform:uppercase;color:#dbe7f8;font-weight:600;white-space:normal;overflow-wrap:anywhere;background:linear-gradient(180deg,rgba(167,196,221,.26),rgba(96,127,165,.16)),rgba(10,16,30,.94);box-shadow:inset 0 1px 0 #edf5ff55,0 0 16px #a6c7e326}
#playerchip.rank-iridescent{color:#f4f7ff;background:linear-gradient(110deg,rgba(70,194,178,.34),rgba(176,108,255,.34),rgba(255,217,106,.34))}
#hpbar{grid-column:1;grid-row:2;display:grid;grid-template-columns:24px minmax(0,1fr);grid-template-rows:minmax(10px,auto) minmax(18px,auto);align-items:center;gap:2px 7px;margin:0;padding:5px 11px 5px 9px;width:100%;min-height:44px;max-width:100%;box-sizing:border-box;border:1px solid #405477;border-radius:999px;background:rgba(10,13,26,.94);box-shadow:inset 0 1px 0 #bfffe116,0 2px 8px #0003}
#hpbar>.hp-icon{grid-column:1;grid-row:1/3;display:flex;align-items:center;justify-content:center;width:24px;height:28px;color:#ff6060;font-size:20px;line-height:1;text-shadow:0 0 9px #ff494980}
#hpbar>.hp-label{grid-column:2;grid-row:1;color:#b7daca;font-size:8px;line-height:1.25;font-weight:600;letter-spacing:.13em;text-transform:uppercase}
#hpbar>.track{grid-column:2;grid-row:2;display:block;width:100%;min-width:0;height:18px;border-radius:999px;background:#102521;overflow:hidden;border:1px solid #3f6957;box-sizing:border-box;position:relative;box-shadow:inset 0 1px 3px #0008}
#hpbar .fill{display:block;height:100%;background:linear-gradient(180deg,#b4fbd1,#58dc86 45%,#35b762);border-radius:999px;box-shadow:inset 0 1px 0 #e1ffee80}
#hpbar .txt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;color:#f4fff6;text-shadow:0 1px 2px #000;line-height:1;background:rgba(5,12,8,.62)}
#searchbox{grid-column:2;grid-row:1;justify-self:end;position:static;min-width:0;width:236px;max-width:100%;min-height:44px;box-sizing:border-box;padding:7px 13px;border-radius:999px;font:11.5px var(--ui);color:var(--ink)}
#shelfnotifications{display:none}
#searchbox::placeholder,#guidesearch::placeholder{color:var(--dim);opacity:1}
/* Canonical location text stays available to existing diagnostics. It has no
   visible Current view label, navigation control or reserved screen lane. */
#trail{display:none;pointer-events:none}
#trail .cur{color:#c8ebff;font-weight:600}#trail .sep{padding:0 4px}
#objchip{grid-column:2;grid-row:2;justify-self:end;position:static;inset:auto;z-index:auto;display:block;margin:0;padding:8px 11px;font-size:10.5px;letter-spacing:.01em;line-height:1.45;color:#f0cf8a;width:236px;max-width:100%;box-sizing:border-box;white-space:normal;overflow-wrap:anywhere;border:1px solid rgba(255,207,138,.48);border-radius:22px;background:rgba(10,16,30,.94);pointer-events:none}
#objchip::before{content:'Objective';display:block;margin-bottom:2px;font-size:8px;line-height:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#d4be97}
#objchip:empty{display:none}#objchip .prog{color:#7ec8f0;font-weight:600;white-space:nowrap}
body:is(.card-open,.panel-open) :is(#trail,#objchip){display:none}
#ctxbar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--safe-bottom) + 64px);width:max-content;max-width:min(620px,90vw);text-align:center;pointer-events:none;z-index:var(--cf-layer-caption);box-sizing:border-box;padding:0;border:0;background:rgba(10,16,30,.94);border-radius:0;font-size:12.5px;line-height:1.5;color:var(--dim);text-shadow:0 1px 12px #000c}
#hintpill{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--safe-bottom) + 18px);z-index:var(--cf-layer-caption);pointer-events:none;font-size:11px;line-height:1.5;letter-spacing:.04em;color:var(--dim);padding:0;border:0;border-radius:0;background:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;text-align:center;text-shadow:0 1px 3px #000,0 0 8px #000;white-space:normal;max-width:min(620px,90vw);width:max-content;box-sizing:border-box}
#hintpill .kw{color:#7ec8f0;font-weight:600}
#dock{position:fixed;z-index:var(--cf-layer-shell);background:none;border:0;box-sizing:border-box;pointer-events:auto}
#dock button{pointer-events:auto;box-sizing:border-box;cursor:pointer;font-family:var(--ui);appearance:none;-webkit-appearance:none;touch-action:manipulation}
#dock .dock-board{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:var(--cf-dock-chip-width);min-width:var(--cf-dock-chip-width);min-height:44px;padding:6px 0 4px;border:1px solid #2a3c5e;border-radius:999px;background:rgba(10,13,26,.88);color:var(--dim);line-height:1}
#dock .dock-board .ico{display:block;font-size:14px;line-height:16px}
#dock .dock-board .lbl{font-size:11px;line-height:1.3;font-weight:500;white-space:normal}
#dock .prime-count{display:block;font-size:8px;line-height:1.3;font-weight:700;font-variant-numeric:tabular-nums}
#dock #primechip{color:#ffd9a0;border-color:#6e5a30;background:rgba(35,28,13,.88)}
#dock .dock-board:is(.sel,.on),:is(#raillft,#railrgt) button:is(.sel,.on){background:linear-gradient(135deg,rgba(255,217,106,.22),rgba(255,190,80,.12)),rgba(10,13,26,.88);border-color:rgba(255,217,106,.8);box-shadow:0 0 14px rgba(255,217,106,.25)}
.dock-utility{display:flex;align-items:center;justify-content:center;width:44px;min-width:44px;height:44px;min-height:44px;box-sizing:border-box;padding:0;background:none;border:0;border-radius:50%;color:var(--dim);cursor:pointer;font:inherit;touch-action:manipulation}
.dock-utility .utility-face{display:flex;align-items:center;justify-content:center;width:var(--cf-utility-face);height:var(--cf-utility-face);box-sizing:border-box;border:1px solid #2a3c5e;border-radius:50%;background:rgba(10,13,26,.88);pointer-events:none}
.dock-utility .ico{display:block;font-size:14px;line-height:1}
.dock-utility:is(.sel,.on) .utility-face{background:linear-gradient(135deg,rgba(255,217,106,.22),rgba(255,190,80,.12)),rgba(10,13,26,.88);border-color:rgba(255,217,106,.8);box-shadow:0 0 14px rgba(255,217,106,.25)}
:is(#dock,#topbar,#sceneactions,#raillft,#railrgt) button:focus-visible{outline:2px solid var(--cf-color-accent-gold);outline-offset:2px}
#sceneactions{position:fixed;left:calc(var(--safe-left) + var(--cf-hud-inset));top:calc(var(--topbar-h) + 112px);z-index:var(--cf-layer-shell);pointer-events:none;display:flex;flex-direction:column;align-items:stretch;gap:8px;width:var(--cf-hud-column);max-width:calc(100vw - var(--safe-left) - var(--safe-right) - 2 * var(--cf-hud-inset))}
#sceneactions button{pointer-events:auto;display:flex;align-items:center;justify-content:flex-start;gap:8px;width:100%;min-height:44px;min-width:44px;box-sizing:border-box;padding:8px 13px;border:1px solid #344968;border-radius:999px;background:rgba(10,13,26,.94);color:var(--dim);font:11px var(--ui);text-align:left;cursor:pointer;touch-action:manipulation}
#sceneactions button>.ico{width:20px;flex:0 0 20px;text-align:center;font-size:14px}
#sceneactions button[aria-pressed="true"],#sceneactions button.on{border-color:var(--cf-color-accent-gold);color:#ffe3a8}
#raillft,#railrgt{position:fixed;top:calc(var(--topbar-h) + 8px);z-index:var(--cf-layer-shell);display:flex;flex-direction:column;gap:8px;width:var(--cf-hud-column);pointer-events:auto}
#raillft{left:calc(var(--safe-left) + var(--cf-hud-inset))}#railrgt{right:calc(var(--safe-right) + var(--cf-hud-inset));width:236px;align-items:flex-end}
:is(#raillft,#railrgt) button{box-sizing:border-box;min-width:44px;min-height:44px;padding:8px 13px;border:1px solid #2a3c5e;border-radius:999px;background:rgba(10,13,26,.88);color:var(--dim);font:11px/1.4 var(--ui);cursor:pointer;touch-action:manipulation}
#raillft button{width:100%;text-align:left}#railrgt button{width:100%;text-align:right}
#railinventory,#railrecords{display:none}
@media(min-width:${UI_PRESENTATION_DESKTOP_MIN}px){
  #dock{right:calc(var(--safe-right) + 16px);bottom:calc(var(--safe-bottom) + 12px);display:flex;gap:8px;align-items:center;width:max-content}
  #dock .dock-board{display:none}
  #dock #primechip{position:fixed;top:max(10px,var(--safe-top));left:50%;transform:translateX(-50%);display:flex;flex-direction:row;gap:6px;width:max-content;max-width:26vw;min-width:44px;padding:8px 13px;min-height:44px}
  #primechip .prime-count{font-size:10px}#primechip .prime-short-label{display:none}
  #hintpill{max-width:min(620px,calc(100vw - 480px))}
  #ctxbar{bottom:calc(var(--safe-bottom) + max(64px,18px + var(--hint-h) + 8px))}
}
/* Phone uses production's two rows and 64px rhythm. Short landscape keeps the
   existing compact safe-column behavior even when its width exceeds 700px. */
@media(max-width:${UI_PRESENTATION_PHONE_MAX}px),(max-width:900px) and (orientation:landscape){
  :root{--cf-hud-inset:10px;--cf-hud-column:clamp(128px,36vw,176px)}
  #topbar{gap:8px 10px;padding-top:max(8px,var(--safe-top))}
  #playerchip{font-size:10px;padding:8px 9px}
  #searchbox{justify-self:start;width:100%;max-width:37vw;padding:5px 11px;font-size:16px}
  #objchip{width:100%;justify-self:end}
  #raillft,#railrgt{display:none}
  #sceneactions{top:calc(var(--topbar-h) + 8px)}
  #dock{left:50%;right:auto;transform:translateX(-50%);bottom:calc(var(--safe-bottom) + 12px);display:grid;grid-template-columns:repeat(10,32px);grid-template-rows:minmax(44px,auto) 44px;column-gap:0;row-gap:4px;width:320px;max-width:none;justify-items:center;align-items:center}
  #dock .dock-board{display:flex;grid-row:1;align-self:stretch;position:static;transform:none;max-width:none;width:60px;min-width:60px}
  #dockcharters{grid-column:1/3}#dockcodex{grid-column:3/5}#primechip{grid-column:5/7}#dockshipyard{grid-column:7/9}#dockatlas{grid-column:9/11}
  #dock .dock-utility{grid-row:2}#dockrecords{grid-column:2/4}#docknotifications{grid-column:4/6}#dockguide{grid-column:6/8}#docksets{grid-column:8/10}
  #dock #primechip{position:static;inset:auto;transform:none;display:flex;flex-direction:column;gap:1px;width:60px;min-width:60px;max-width:none;padding:6px 0 4px}
  #dock .dock-board .lbl{display:none}
  #dock .prime-count{font-size:8px}
  #hintpill{bottom:calc(var(--safe-bottom) + 124px);max-width:min(620px,90vw)}
  #ctxbar{bottom:calc(var(--safe-bottom) + max(164px,124px + var(--hint-h) + 8px))}
  body.fs-lg #dock .prime-count{font-size:9px!important}body.fs-xl #dock .prime-count{font-size:10px!important}
}
@media(max-width:900px) and (orientation:landscape){
  body.panel-open #topbar{top:calc(var(--safe-top) + 6px);left:auto;right:calc(var(--safe-right) + 12px);bottom:auto;width:calc((100vw - var(--safe-left) - var(--safe-right) - 36px) / 2);padding:0;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto;gap:6px;background:none;visibility:visible}
  body.panel-open #dockinventory{grid-column:1;grid-row:1}
  body.panel-open #searchbox{grid-column:1;grid-row:2;justify-self:stretch;width:100%;max-width:none}
  body.panel-open #hpbar{display:none}
  body.panel-open #dock{left:auto;right:calc(var(--safe-right) + 12px);transform:none}
  body.panel-open #sceneactions{left:calc((100vw + var(--safe-left) - var(--safe-right) + 12px) / 2);right:calc(var(--safe-right) + 12px);top:calc(var(--safe-top) + var(--topbar-h) + 12px);width:auto;flex-direction:row;justify-content:center}
  body.panel-open #sceneactions button{width:auto;flex:1;justify-content:center}
}
@media(min-width:901px){
  #setpanel,#recpanel,#shipyardpanel,#inventorypanel,#combatpanel,#toast{right:calc(var(--safe-right) + 16px);bottom:calc(var(--safe-bottom) + var(--dock-h) + 24px)}
}
@media(max-width:${UI_PRESENTATION_PHONE_MAX}px),(pointer:coarse){#searchbox,body.fs-lg #searchbox{font-size:16px!important}body.fs-xl #searchbox{font-size:17px!important}}
@media(max-width:900px) and (orientation:portrait){
  body.surface-mode #sceneactions{flex-direction:row;width:auto;right:calc(var(--safe-right) + var(--cf-hud-inset))}
  body.surface-mode #sceneactions button{flex:1;width:auto;justify-content:center}
  body.surface-mode #objchip{display:none}
}
body.fs-lg #sceneactions button{font-size:13px}body.fs-xl #sceneactions button{font-size:15px}
body.fs-lg #hpbar>.hp-icon{font-size:20px!important}body.fs-xl #hpbar>.hp-icon{font-size:22px!important}
body.fs-lg #objchip::before{font-size:10px}body.fs-xl #objchip::before{font-size:11px}
@media(prefers-reduced-motion:reduce){#dock *,#topbar *,#sceneactions *{transition:none!important;animation:none!important}}
@media(forced-colors:active){#dock .dock-board,.dock-utility .utility-face,#sceneactions button,#raillft button,#railrgt button{background:Canvas;color:CanvasText;border-color:ButtonText}#dock .dock-board:is(.sel,.on),.dock-utility:is(.sel,.on) .utility-face{border-color:Highlight;color:Highlight}#dockinventory,#playerchip{color:CanvasText}#hpbar{background:Canvas;border-color:CanvasText}#hpbar>.track{background:Canvas;border-color:CanvasText}#hpbar .fill{background:Highlight}#hpbar .txt{background:Canvas;color:CanvasText}#hpbar>.hp-icon,#hpbar>.hp-label{background:none;color:CanvasText}}
`;
