/** Two existing canonical portraits on a bounded battle stage. No new art,
 * filters, scaling, idle loop, hit timing or input owner. */
export const COMBAT_BATTLE_SCENE_CSS = `
[data-combat-battle-scene]{min-width:0;border:1px solid var(--cf-color-border);border-radius:var(--cf-radius-panel);padding:8px;background:var(--cf-color-surface)}
[data-battle-stage]{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:end;padding:12px 8px 4px;overflow:hidden}
[data-battle-side]{margin:0;min-width:0;text-align:center}
[data-battle-side] figcaption{overflow-wrap:anywhere;font-size:inherit;line-height:1.4;margin-top:4px}
[data-battle-actor]{display:grid;place-items:center;min-width:0;min-height:88px;position:relative}
[data-battle-portrait]{display:block;width:min(100%,132px);height:auto;aspect-ratio:1;object-fit:contain;border-radius:8px}
[data-battle-player-nameplate]{display:grid;place-items:center;min-height:88px;width:100%;padding:8px;box-sizing:border-box;border:1px solid var(--cf-color-border);border-radius:8px;overflow-wrap:anywhere}
[data-battle-actor][data-battle-action="hit"]{outline:2px solid var(--cf-color-accent-gold);outline-offset:2px}
[data-battle-actor][data-battle-action="evades"],[data-battle-actor][data-battle-action="staggered"]{outline:2px dashed var(--cf-color-accent-teal);outline-offset:2px}
[data-battle-cue]{margin:8px 0 0;min-height:2.8em;overflow-wrap:anywhere;line-height:1.4;color:inherit}
`;
