import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { afterEach, it, expect, vi } from 'vitest';
import { stripTypeScriptTypes } from 'node:module';
import { createAiPresentationRefresh, isAiActionTarget } from '../apps/game/src/ai-presentation.js';
const { JSDOM }=createRequire(import.meta.url)('jsdom');
afterEach(()=>vi.unstubAllGlobals());
it('6700 updates render once per frame and preserve exact AI job focus',()=>{
 const dom=new JSDOM('<div id="survey"><button data-ai-act="cancel" data-ai-job="2">Cancel</button></div>');
 vi.stubGlobal('document',dom.window.document);vi.stubGlobal('Element',dom.window.Element);
 const frames:Array<()=>void>=[];vi.stubGlobal('requestAnimationFrame',(fn:()=>void)=>{frames.push(fn);return frames.length;});
 const panel=document.querySelector('#survey')!;const markup=panel.innerHTML;const render=vi.fn(()=>{panel.innerHTML=markup;});
 (panel.firstElementChild as HTMLElement).focus();const refresh=createAiPresentationRefresh(render);
 for(let i=0;i<6700;i++)refresh();expect(frames).toHaveLength(1);expect(render).not.toHaveBeenCalled();frames.shift()!();expect(render).toHaveBeenCalledOnce();expect((document.activeElement as HTMLElement).dataset.aiJob).toBe('2');
 // Direct rebuilding reproduces the old focus loss under the same oracle.
 render();expect((document.activeElement as HTMLElement).dataset.aiJob).not.toBe('2');
 expect(isAiActionTarget(panel.firstElementChild)).toBe(true);expect(isAiActionTarget(panel)).toBe(false);dom.window.close();
});
const source=readFileSync(new URL('../apps/game/src/main.ts',import.meta.url),'utf8');
function compiled(text:string){return stripTypeScriptTypes(text,{mode:'strip'});}
it('actual View function never travels, lands or enqueues on a snapshot mismatch',async()=>{
 const start=source.indexOf('async function viewLocalAiOriginal('),end=source.indexOf('async function handleLocalAiAction',start);
 const text=source.slice(start,end),mount=vi.fn(async()=>true),jump=vi.fn(),land=vi.fn();
 const fn=new Function('blockRouteChangeWhileProductAction','currentAiLandfallInput','mountLocalAiOriginal','searchTravel','landWithPilotPresentation',compiled(text)+';return viewLocalAiOriginal;')(()=>false,()=>({snapshotDigest:'current'}),mount,{jumpToProvenNav:jump},land);
 expect(await fn({input:{snapshotDigest:'other'}})).toBe(false);expect(mount).not.toHaveBeenCalled();expect(jump).not.toHaveBeenCalled();expect(land).not.toHaveBeenCalled();
 expect(await fn({input:{snapshotDigest:'current'}})).toBe(true);expect(mount).toHaveBeenCalledOnce();
});
it('actual survey handler closes synchronously; the old awaited guard fails that timing',async()=>{
 const dom=new JSDOM('<button data-survey-close>Close</button>');vi.stubGlobal('Element',dom.window.Element);
 const start=source.indexOf("card.addEventListener('click', async (e) => {"),end=source.indexOf('  const act =',start);
 const body=source.slice(start,end).split("async (e) => {")[1]!;
 const close=vi.fn(),guard=vi.fn(async()=>false),event={target:dom.window.document.querySelector('button')};
 const run=(body:string)=>new Function('isAiActionTarget','handleLocalAiAction','hideSurvey','return '+compiled('(async (e:any)=>{'+body+'})'))(isAiActionTarget,guard,close)(event);
 const pending=run(body);expect(close).toHaveBeenCalledOnce();await pending;
 close.mockClear();const old=run(body.replace('if (isAiActionTarget(e.target)) { await handleLocalAiAction(e); return; }','if (await handleLocalAiAction(e)) return;'));
 expect(close).not.toHaveBeenCalled();await old;expect(close).toHaveBeenCalledOnce();dom.window.close();
});
it('actual AI handler permits synthetic smoke controls only inside evidence builds',async()=>{
 const dom=new JSDOM('<button data-ai-act="cancel" data-ai-job="job">Cancel</button>');vi.stubGlobal('Element',dom.window.Element);
 const start=source.indexOf('async function handleLocalAiAction'),end=source.indexOf("notificationPanel.addEventListener",start),body=compiled(source.slice(start,end));
 const action=vi.fn();const make=(evidence:boolean)=>new Function('__CF_EVIDENCE_BUILD__','location','localAiGame','noteSurfaceVistaFault','toast',body+';return handleLocalAiAction;')(evidence,{search:'?smoke=1'},{action},()=>{},()=>{});
 await make(true)({target:dom.window.document.querySelector('button'),isTrusted:false});expect(action).toHaveBeenCalledOnce();
 action.mockClear();await make(false)({target:dom.window.document.querySelector('button'),isTrusted:false});expect(action).not.toHaveBeenCalled();dom.window.close();
});
