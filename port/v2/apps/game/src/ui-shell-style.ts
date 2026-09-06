import { UI_PRESENTATION_DESKTOP_MIN, UI_PRESENTATION_PHONE_MAX } from './ui-presentation-tokens.js';

/** U1 shell only. Panel interiors, native focus/Training owners and semantic
 * colors remain outside this file. Phone geometry follows Nick's explicit
 * 58/64/36/44 metrics; the visible v2 trail is an additional reserved lane. */
export const UI_SHELL_CSS = `
#topbar{position:fixed;inset:0 0 auto;z-index:var(--cf-layer-shell);pointer-events:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(56px,300px) 44px;align-items:center;gap:6px 8px;padding:max(8px,var(--safe-top)) calc(var(--safe-right) + 18px) 8px calc(var(--safe-left) + 18px);background:linear-gradient(180deg,rgba(4,4,12,.55),transparent);border:0;box-sizing:border-box}
#topbar>button,#searchbox{pointer-events:auto}
#dockinventory{display:flex;align-items:center;justify-content:flex-start;min-height:var(--cf-touch-target);min-width:var(--cf-touch-target);width:max-content;max-width:100%;padding:0;background:none;border:0;border-radius:var(--cf-radius-pill);color:var(--ink);font:inherit;cursor:pointer}
#playerchip{display:block;box-sizing:border-box;min-width:0;max-width:100%;padding:7px 15px;font-size:11px;line-height:1.25;letter-spacing:.08em;text-transform:uppercase;color:#dbe7f8;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#playerchip .dim{color:var(--dim)}#playerchip .player-rank{color:inherit}
#playerchip.rank-iridescent{color:#f4f7ff;background:linear-gradient(110deg,rgba(70,194,178,.34),rgba(176,108,255,.34),rgba(255,217,106,.34))}
#hpbar{grid-column:1/-1;display:flex;align-items:center;gap:7px;margin:0;padding:4px 11px 4px 9px;width:max-content;max-width:100%;box-sizing:border-box;line-height:12px}
#hpbar>.track{display:block;width:158px;height:12px;border-radius:var(--cf-radius-pill);background:#16202f;overflow:hidden;border:0;position:relative;box-shadow:inset 0 1px 2px #0008}
#hpbar>.track::after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 calc(25% - 1px),#ffffff17 calc(25% - 1px) 25%)}
#hpbar .fill{display:block;height:100%;background:linear-gradient(180deg,#a9f0a0,#3fae52);border-radius:var(--cf-radius-pill)}
#hpbar .txt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;color:#f4fff6;text-shadow:0 1px 2px #000;line-height:12px;background:rgba(5,12,8,.78)}
#searchbox{position:static;min-width:0;width:100%;min-height:var(--cf-touch-target);box-sizing:border-box;padding:5px 11px;font:12px var(--ui);color:var(--ink)}
#searchbox::placeholder,#guidesearch::placeholder{color:var(--dim);opacity:1}
#trail{position:fixed;top:calc(var(--topbar-h) + 8px);left:50%;transform:translateX(-50%);z-index:var(--cf-layer-trail);pointer-events:none;font-size:10.5px;letter-spacing:.06em;color:var(--dim);white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis;background:rgba(10,16,30,.94);border:1px solid var(--cf-color-border);border-radius:var(--cf-radius-pill);padding:2px 12px}
#trail .cur{color:#c8ebff}#trail .sep{color:var(--dim);padding:0 5px;font-size:9px}
#objchip{position:fixed;left:calc(var(--safe-left) + 18px);top:calc(var(--topbar-h) + var(--cf-objective-offset));z-index:var(--cf-layer-objective);padding:6px 11px;font-size:10.5px;letter-spacing:.04em;line-height:1.35;color:#f0cf8a;max-width:min(62vw,340px);box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-color:rgba(255,207,138,.35)}
#objchip:empty{display:none}#objchip .prog{color:#7ec8f0;font-weight:600}
body:is(.card-open,.panel-open) :is(#trail,#objchip){display:none}
#ctxbar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--safe-bottom) + 64px);width:max-content;max-width:min(620px,90vw);text-align:center;pointer-events:none;z-index:var(--cf-layer-caption);box-sizing:border-box;padding:0;border:0;background:rgba(10,16,30,.94);border-radius:0;font-size:12.5px;line-height:1.5;color:var(--dim);text-shadow:0 1px 12px #000c}
#hintpill{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--safe-bottom) + 18px);z-index:var(--cf-layer-caption);pointer-events:none;font-size:11px;letter-spacing:.04em;color:var(--faint);padding:7px 16px;white-space:nowrap;max-width:94vw;box-sizing:border-box;overflow:hidden;text-overflow:ellipsis}
#hintpill .kw{color:#7ec8f0;font-weight:600}
#dock{position:fixed;z-index:var(--cf-layer-shell);background:none;border:0;box-sizing:border-box;pointer-events:none}
#dock button{pointer-events:auto;box-sizing:border-box;cursor:pointer;font-family:var(--ui);appearance:none;-webkit-appearance:none;touch-action:manipulation}
#dock .dock-board{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:var(--cf-dock-chip-width);min-width:var(--cf-dock-chip-width);min-height:var(--cf-touch-target);padding:4px 1px;border:1px solid #2a3c5e;border-radius:var(--cf-radius-pill);background:rgba(14,22,40,.88);color:var(--dim);line-height:1}
#dock .dock-board .ico{display:block;font-size:14px;line-height:16px}
#dock .dock-board .lbl{display:block;font-size:8.5px;line-height:1.1;font-weight:500;letter-spacing:0;white-space:normal;overflow-wrap:anywhere}
#dock .prime-count{display:block;font-size:8px;line-height:1.1;font-weight:700;font-variant-numeric:tabular-nums}
#primechip{color:#ffd9a0;border-color:#6e5a30}
#dock .dock-board:is(.sel,.on){background:linear-gradient(135deg,rgba(255,217,106,.22),rgba(255,190,80,.12)),rgba(14,22,40,.88);border-color:rgba(255,217,106,.8);box-shadow:0 0 14px rgba(255,217,106,.25)}
.dock-utility{display:flex;align-items:center;justify-content:center;width:var(--cf-touch-target);min-width:var(--cf-touch-target);height:var(--cf-touch-target);min-height:var(--cf-touch-target);box-sizing:border-box;padding:0;background:none;border:0;border-radius:50%;color:var(--dim);cursor:pointer;font:inherit;touch-action:manipulation}
.dock-utility .utility-face{display:flex;align-items:center;justify-content:center;width:var(--cf-utility-face);height:var(--cf-utility-face);box-sizing:border-box;border:1px solid #2a3c5e;border-radius:50%;background:rgba(14,22,40,.88);pointer-events:none}
.dock-utility .ico{display:block;font-size:14px;line-height:1}
.dock-utility:is(.sel,.on) .utility-face{background:linear-gradient(135deg,rgba(255,217,106,.22),rgba(255,190,80,.12)),rgba(14,22,40,.88);border-color:rgba(255,217,106,.8);box-shadow:0 0 14px rgba(255,217,106,.25)}
:is(#dock,#topbar,#sceneactions,#raillft,#railrgt) button:focus-visible{outline:2px solid var(--cf-color-accent-gold);outline-offset:2px}
#sceneactions{position:fixed;left:calc(var(--safe-left) + 18px);top:calc(var(--topbar-h) + 172px);z-index:var(--cf-layer-shell);display:flex;gap:8px;max-width:calc(100vw - var(--safe-left) - var(--safe-right) - 36px)}
#sceneactions button{display:flex;align-items:center;gap:6px;min-height:var(--cf-touch-target);min-width:var(--cf-touch-target);padding:6px 12px;border:1px solid #2a3c5e;border-radius:var(--cf-radius-pill);background:rgba(10,16,30,.94);color:var(--dim);font:11px var(--ui);cursor:pointer;touch-action:manipulation}
#sceneactions button[aria-pressed="true"],#sceneactions button.on{border-color:var(--cf-color-accent-gold);color:#ffe3a8}
/* Compatibility rails keep their ids/wiring but no longer create a second
   navigation system at larger breakpoints. The launcher is the visible owner. */
#raillft,#railrgt{display:none}
@media(max-width:${UI_PRESENTATION_PHONE_MAX}px){
  #topbar{grid-template-columns:minmax(0,1fr) minmax(56px,.85fr) 44px;padding-right:calc(var(--safe-right) + 10px);padding-left:calc(var(--safe-left) + 10px)}
  #playerchip{padding:4px 9px;font-size:10px;letter-spacing:.06em}
  #searchbox{font-size:16px}
  #hpbar>.track{width:clamp(110px,33vw,188px)}
  #dock{left:50%;right:auto;transform:translateX(-50%);bottom:calc(var(--safe-bottom) + var(--cf-phone-dock-bottom));display:grid;grid-template-columns:repeat(10,var(--cf-dock-half-pitch));grid-template-rows:minmax(44px,auto) 44px;column-gap:0;row-gap:var(--cf-dock-row-gap);width:320px;max-width:none;justify-items:center;align-items:center}
  #dock .dock-board{grid-row:1;align-self:stretch;position:static;transform:none;max-width:none;padding-inline:0}
  #dockcharters{grid-column:1/3}#dockcodex{grid-column:3/5}#primechip{grid-column:5/7}#dockshipyard{grid-column:7/9}#dockatlas{grid-column:9/11}
  #dock .dock-utility{grid-row:2}#dockrecords{grid-column:2/4}#docknotifications{grid-column:4/6}#dockguide{grid-column:6/8}#docksets{grid-column:8/10}
  #dock #primechip{display:grid;grid-template-columns:auto auto;grid-template-rows:16px auto;align-content:center;justify-content:center;column-gap:2px;row-gap:1px}
  #primechip>.ico{grid-column:1/-1;grid-row:1}#primechip>.lbl{grid-column:1;grid-row:2}#primechip>.prime-count{grid-column:2;grid-row:2}
  #primechip .prime-full-label{display:none}
  #hintpill{bottom:calc(var(--safe-bottom) + var(--cf-phone-hint-bottom))}
  #ctxbar{bottom:calc(var(--safe-bottom) + max(var(--cf-phone-caption-bottom), var(--cf-phone-hint-bottom) + var(--hint-h) + 8px))}
  #sceneactions{top:calc(var(--topbar-h) + 40px)}
  body.surface-mode #objchip{display:none}
  body.fs-lg #dock .dock-board .lbl{font-size:10px!important}body.fs-xl #dock .dock-board .lbl{font-size:11.5px!important}
  body.fs-lg #dock .prime-count{font-size:9px!important}body.fs-xl #dock .prime-count{font-size:10px!important}
}
@media(max-width:480px){#playerchip :is(.player-worlds,.player-rank){display:none}}
@media(min-width:${UI_PRESENTATION_DESKTOP_MIN}px){
  #topbar{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 44px}
  #dockinventory{grid-column:1;max-width:min(28vw,340px)}
  #searchbox{grid-column:3;justify-self:end;width:min(300px,calc(33vw - 62px))}
  #shelfnotifications{grid-column:4}
  #dock{left:50%;right:auto;transform:translateX(-50%);bottom:calc(var(--safe-bottom) + 12px);display:grid;grid-template-columns:repeat(9,var(--cf-launcher-pitch));grid-template-rows:minmax(var(--cf-launcher-target),auto);justify-items:center;align-items:center;gap:0;width:var(--cf-launcher-width);max-width:none;padding:var(--cf-launcher-padding);border:0;border-radius:20px;background:rgba(10,16,30,.78);box-shadow:0 10px 30px #0006,inset 0 0 0 1px rgba(126,160,210,.22);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);pointer-events:auto}
  #dock .dock-board{display:flex;align-self:stretch;width:calc(var(--cf-launcher-pitch) - 6px);min-width:calc(var(--cf-launcher-pitch) - 6px);min-height:var(--cf-launcher-target);padding-inline:0}
  #dock .dock-board .ico{font-size:var(--cf-launcher-icon);line-height:var(--cf-launcher-icon-line)}
  #dock .dock-board .lbl{font-size:var(--cf-launcher-label)}
  #dock .prime-count{font-size:var(--cf-launcher-count)}
  #dock .dock-utility{width:var(--cf-launcher-target);height:var(--cf-launcher-target);min-width:var(--cf-launcher-target);min-height:var(--cf-launcher-target)}
  #dock .utility-face{width:var(--cf-launcher-face);height:var(--cf-launcher-face)}
  #dock .dock-utility .ico{font-size:var(--cf-launcher-icon)}
  #dock #primechip{display:grid;position:static;transform:none;max-width:none;grid-template-columns:auto auto;grid-template-rows:var(--cf-launcher-icon-line) auto;align-content:center;justify-content:center;column-gap:2px;row-gap:1px}
  #primechip>.ico{grid-column:1/-1;grid-row:1}#primechip>.lbl{grid-column:1;grid-row:2}#primechip>.prime-count{grid-column:2;grid-row:2}
  #primechip .prime-full-label{display:none}
  #hintpill{bottom:calc(var(--safe-bottom) + max(96px,var(--dock-h) + 28px))}
  #ctxbar{bottom:calc(var(--safe-bottom) + max(136px,var(--dock-h) + 28px + var(--hint-h) + 8px))}
  #sceneactions{top:calc(var(--topbar-h) + 40px)}
  body.fs-lg #dock .dock-board .lbl{font-size:max(11px,var(--cf-launcher-label))!important}body.fs-xl #dock .dock-board .lbl{font-size:max(12.5px,var(--cf-launcher-label))!important}
  body.fs-lg #dock .prime-count{font-size:10px!important}body.fs-xl #dock .prime-count{font-size:11px!important}

}
/* Native short-landscape panels keep the full-height left workspace. The
   interactive shelf and every board opener occupy the right safe column;
   only status chrome yields. This is an open-panel exception, not a second
   default breakpoint or a change to the panel's internal scroll/focus owner. */
@media(max-width:900px) and (orientation:landscape){
  body.panel-open #topbar{top:calc(var(--safe-top) + 6px);left:auto;right:calc(var(--safe-right) + 12px);bottom:auto;width:calc((100vw - var(--safe-left) - var(--safe-right) - 36px) / 2);padding:0;grid-template-columns:minmax(0,1fr) 44px;gap:6px 8px;background:none;visibility:visible}
  body.panel-open #dockinventory{grid-column:1;grid-row:1;width:100%;max-width:100%}
  body.panel-open #playerchip{max-width:100%}
  body.panel-open #shelfnotifications{grid-column:2;grid-row:1}
  body.panel-open #searchbox{grid-column:1/-1;grid-row:2;justify-self:stretch;width:100%;max-width:none}
  body.panel-open #hpbar{display:none}
  body.panel-open #dock{left:auto;right:calc(var(--safe-right) + 12px);transform:none}
  body.panel-open #sceneactions{left:calc((100vw + var(--safe-left) - var(--safe-right) + 12px) / 2);right:calc(var(--safe-right) + 12px);top:calc(var(--safe-top) + var(--topbar-h) + 12px);justify-content:center}
}
/* Narrow landscape keeps the phone arrangement. When a panel opens, the
   existing rule above places that compact launcher in its right safe column. */
@media(min-width:${UI_PRESENTATION_DESKTOP_MIN}px) and (max-width:900px) and (orientation:landscape){
  #dock{grid-template-columns:repeat(10,var(--cf-dock-half-pitch));grid-template-rows:minmax(44px,auto) 44px;row-gap:var(--cf-dock-row-gap);width:320px;padding:0;border-radius:0;background:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;pointer-events:none}
  #dock .dock-board{grid-row:1;width:58px;min-width:58px;min-height:44px}
  #dockcharters{grid-column:1/3}#dockcodex{grid-column:3/5}#primechip{grid-column:5/7}#dockshipyard{grid-column:7/9}#dockatlas{grid-column:9/11}
  #dock .dock-utility{grid-row:2;width:44px;height:44px;min-width:44px;min-height:44px}
  #dockrecords{grid-column:2/4}#docknotifications{grid-column:4/6}#dockguide{grid-column:6/8}#docksets{grid-column:8/10}
  #dock .utility-face{width:36px;height:36px}
  #dock .dock-board .ico{font-size:14px;line-height:16px}#dock .dock-utility .ico{font-size:14px}
  #dock .dock-board .lbl{font-size:8.5px}#dock .prime-count{font-size:8px}
  #dock #primechip{grid-template-rows:16px auto}
  body.fs-lg #dock .dock-board .lbl{font-size:10px!important}body.fs-xl #dock .dock-board .lbl{font-size:11.5px!important}
  body.fs-lg #dock .prime-count{font-size:9px!important}body.fs-xl #dock .prime-count{font-size:10px!important}
}
@media(min-width:901px){
  #setpanel,#recpanel,#shipyardpanel,#inventorypanel,#combatpanel,#toast{right:calc((100vw - var(--cf-launcher-width)) / 2);bottom:calc(var(--safe-bottom) + var(--dock-h) + 24px)}
}
@media(max-width:${UI_PRESENTATION_PHONE_MAX}px),(pointer:coarse){#searchbox,body.fs-lg #searchbox{font-size:16px!important}body.fs-xl #searchbox{font-size:17px!important}}
@media(prefers-reduced-motion:reduce){#dock *,#topbar *,#sceneactions *{transition:none!important;animation:none!important}}
@media(forced-colors:active){#dock .dock-board,.dock-utility .utility-face,#sceneactions button,#raillft button::before,#railrgt button::before{background:Canvas;color:CanvasText;border-color:ButtonText}#dock .dock-board:is(.sel,.on),.dock-utility:is(.sel,.on) .utility-face{border-color:Highlight;color:Highlight}#dockinventory,#playerchip{color:CanvasText}}
`;
