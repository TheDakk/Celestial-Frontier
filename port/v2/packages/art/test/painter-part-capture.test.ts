import {expect,it} from 'vitest';
import {PainterPartCapture} from '../src/painter-part-capture.js';
const part=(id:string,joint=id)=>({id,joint,layer:'near' as const});
it('owns actual changed ink and occlusion, preserves unchanged pixels, splits only the drawn tube stage',()=>{
 const rgba=new Uint8ClampedArray(8*4),source=()=>rgba;
 const cap=new PainterPartCapture(8,1,source);cap.begin([part('body')]);
 for(let i=0;i<8;i++)rgba.set([100,70,40,255],i*4);
 cap.begin([part('upper'),part('lower'),part('paw')],[[.5,.5],[1.5,.5],[2.5,.5],[3.5,.5],[4.5,.5],[5.5,.5],[6.5,.5],[7.5,.5]],[.45,.82]);
 for(let i=1;i<8;i++)rgba[i*4]=101;
 cap.begin([part('head')]);rgba.set([11,22,33,255],2*4);rgba[7*4+3]=0;
 const before=rgba.slice(),result=cap.finish();expect(rgba).toEqual(before);
 const owners=Array.from(result.labels,n=>n?result.parts[n-1]!.id:null);
 expect(owners).toEqual(['body','upper','head','upper','lower','lower','paw',null]);
 // Wrong layer-wide reassignment and a missing silhouette must fail this same outcome.
 expect(()=>expect(owners.map(()=> 'head')).toEqual(owners)).toThrow();
 expect(()=>expect([...owners.slice(0,6),null,null]).toEqual(owners)).toThrow();
 expect(()=>cap.begin([part('body')])).toThrow('finished');
});
it('refuses malformed, conflicting, unowned and prepainted input',()=>{
 const rgba=new Uint8ClampedArray(16),cap=new PainterPartCapture(4,1,()=>rgba);
 expect(()=>cap.begin([part('a'),part('b')],[[0,0],[1,1]],[NaN])).toThrow('geometry');
 cap.begin([part('a')]);expect(()=>cap.begin([part('a','wrong')])).toThrow('conflicting');
 expect(()=>cap.begin([part('a'),part('a')],[[0,0],[1,1]],[.5])).toThrow('identity');
 rgba[3]=255;expect(()=>new PainterPartCapture(4,1,()=>rgba)).toThrow('empty ink');
 const untouched=new Uint8ClampedArray(4),missing=new PainterPartCapture(1,1,()=>untouched);untouched[3]=255;expect(()=>missing.finish()).toThrow('unowned');
 expect(()=>new PainterPartCapture(4,1,()=>new Uint8ClampedArray(4))).toThrow('dimensions');
});

it('admits the shared forty-part budget and refuses the forty-first owner',()=>{const cap=new PainterPartCapture(1,1,()=>new Uint8ClampedArray(4));for(let i=0;i<40;i++)cap.begin([part('part-'+i)]);expect(()=>cap.begin([part('part-40')])).toThrow('part budget');});
