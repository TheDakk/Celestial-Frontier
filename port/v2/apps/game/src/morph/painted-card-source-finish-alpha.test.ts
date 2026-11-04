import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {CARD_ARCHETYPES} from './card-archetypes.js';
import {PaintedCardSource,type PaintedCardAssets,type FinishedCardMasterV1} from './painted-card-source.js';
import {finishedCardMasterV1} from '../creature-finish-route.js';
import {getBattle2MasterPin} from '../battle2-master-pins.generated.js';
import {decodePng} from './png-decode.js';
const root=new URL('../../../../../../',import.meta.url),read=(p:string)=>new Uint8Array(readFileSync(new URL(p,root)));
const assets:PaintedCardAssets={bytes:async p=>read(p),json:async p=>JSON.parse(new TextDecoder().decode(read(p)))};
const registry=CARD_ARCHETYPES.filter(a=>a.earthName==='Crab'||a.earthName==='Civet'),now=()=>Promise.resolve();
const genome=(name:string)=>({_earthName:name,kingdom:'fauna',seed:5,color:12,accent:3,size:0,head:0,tail:1,pattern:0});
const source=(finished?:FinishedCardMasterV1)=>new PaintedCardSource({assets,registry,yieldToHost:now,...(finished?{finished:async()=>finished}:{})});
it('C46 final consumer refuses the real opaque Civet original even with matching recipe/size and uses the exact painter card',async()=>{
 const p=getBattle2MasterPin('civet')!,finished=await finishedCardMasterV1(read(p.masterPath),p.recipeHash,p.masterSha256),g=genome('Civet');
 expect(finished.rgba.every((v,i)=>i%4!==3||v===255)).toBe(true);
 const painter=await source().card(g,'portrait')!,candidate=source(finished),card=await candidate.card(g,'portrait')!;
 expect(card.url).toBe(painter.url);expect(card.finishedSha256).toBeUndefined();expect((await candidate.card(g,'portrait')!).url).toBe(painter.url);
 const png=await decodePng(new Uint8Array(Buffer.from(card.url.split(',')[1]!,'base64')));expect(png.rgba.some((v,i)=>i%4===3&&v===0)).toBe(true);
 // No normalization or mutation of the retained opaque source occurred.
 expect(finished.rgba.every((v,i)=>i%4!==3||v===255)).toBe(true);
},60000);
it('C46 final consumer admits a real Crab finish with exact card alpha, rejects one changed alpha byte, then admits the genuine control again',async()=>{
 const a=registry.find(r=>r.earthName==='Crab')!,record=await assets.json(a.dir+'record.json') as {recipeHash:string},master=await decodePng(read(a.dir+'card/master-512.png'));
 const rgba=master.rgba.slice();for(let i=0;i<rgba.length;i+=4)if(rgba[i+3]){rgba[i]=255-rgba[i]!;rgba[i+1]=255-rgba[i+1]!;}
 const good:FinishedCardMasterV1={sha256:'a'.repeat(64),recordRecipeHash:record.recipeHash,width:master.width,height:master.height,rgba},g=genome('Crab'),painter=await source().card(g,'portrait')!;
 const first=await source(good).card(g,'portrait')!;expect(first.finishedSha256).toBe(good.sha256);expect(first.url).not.toBe(painter.url);
 const altered=rgba.slice(),at=altered.findIndex((v,i)=>i%4===3&&v===0);expect(at).toBeGreaterThan(0);altered[at]=1;
 const bad=await source({...good,sha256:'b'.repeat(64),rgba:altered}).card(g,'portrait')!;expect(bad.url).toBe(painter.url);expect(bad.finishedSha256).toBeUndefined();
 const again=await source(good).card(g,'portrait')!;expect(again.url).toBe(first.url);expect(again.finishedSha256).toBe(good.sha256);
},60000);
