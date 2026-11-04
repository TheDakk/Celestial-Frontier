import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {transformSync} from 'rolldown/utils';import {it,expect} from 'vitest';
// @ts-expect-error Executable tool owner has no declaration shim.
import {usesPhoneDock} from '../tools/phone-shell-viewport.mjs';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom') as {JSDOM:new(html:string)=>{window:{document:Document;close():void}}};
it('both binary and trinary companion call sites use the actual three-stop canvas owner',()=>{
 const main=readFileSync(new URL('../apps/game/src/main.ts',import.meta.url),'utf8');
 const start=main.indexOf('function coronaSpr('),end=main.indexOf('\nlet _moonTermC:',start),source=transformSync('corona.ts',main.slice(start,end)).code;
 const evaluate=(input:string)=>{
  const calls=[...input.matchAll(/coronaSpr\(raw\.(?:binary|trinary)\.col2 \|\| col(?:, true)?\)/g)].map(m=>m[0]);expect(calls).toHaveLength(2);
  return calls.map(call=>{const stops:number[]=[];const context={createRadialGradient:()=>({addColorStop:(n:number)=>stops.push(n)}),beginPath(){},arc(){},fill(){}};
   runInNewContext(source+';'+call,{_coronaC:new Map(),_termC:new Map(),peakLocalCanvasCacheEntries:0,TAU:2*Math.PI,raw:{binary:{col2:'#abcdef'},trinary:{col2:'#abcdef'}},col:'#ffffff',document:{createElement:()=>({getContext:()=>context})},polishSystemCanvasV1:(x:unknown)=>x});return stops;});
 };
 expect(evaluate(main)).toEqual([[0,.25,1],[0,.25,1]]);
 expect(evaluate(main.replace('coronaSpr(raw.binary.col2 || col, true)','coronaSpr(raw.binary.col2 || col)'))).not.toEqual([[0,.25,1],[0,.25,1]]);
});
it('dock coverage includes 844×390 and its sentinel shares the same predicate',()=>{
 for(const [width,height,expected]of [[390,844,true],[844,390,true],[900,500,true],[901,500,false],[701,844,false],[0,400,false],[Infinity,400,false]]as const)expect(usesPhoneDock({width,height})).toBe(expected);
 const legacy=(vp:{width:number})=>vp.width<=700;expect(legacy({width:844})).toBe(false);
 const source=readFileSync(new URL('../tools/glassmatrix.mjs',import.meta.url),'utf8');
 expect(source).toContain('if (usesPhoneDock(vp)) {');expect(source).toContain('MATRIX_VIEWPORTS.some(usesPhoneDock)');
});
it('a utility whose glyph markup drifts produces a finding instead of vanishing from contrast audit',()=>{
 const source=readFileSync(new URL('../tools/glassmatrix.mjs',import.meta.url),'utf8'),start=source.indexOf('    const addContrastSubject = (el) => {'),end=source.indexOf('\n    for (const sel of opts.contrastSelectors',start);expect(end).toBeGreaterThan(start);
 const code=source.slice(start,end);
 const sample=(input:string,markup:string)=>{
  const dom=new JSDOM(markup);try{return runInNewContext(input+";addContrastSubject(document.querySelector('button'));out",{document:dom.window.document,out:[],surface:'test',contrastNodes:new Set(),nameplateOwners:new Map(),directText:()=>'',visible:()=>true,selectorName:(el:Element)=>'#'+el.id,issue:(code:string)=>({code})});}finally{dom.window.close();}
 };
 const good='<button id="cue" class="dock-utility"><span class="utility-face"><span class="ico">?</span></span></button>',bad=good.replace('class="ico"','class="drift"');
 expect(sample(code,good)).toEqual([]);expect(sample(code,bad)).toEqual([{code:'CONTRAST_SUBJECT_MISSING'}]);
 const old=code.replace(/      const glyph =[\s\S]+?(?=      \/\/ The native target)/,'');expect(sample(old,bad)).toEqual([]);
});
