import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
const glass = readFileSync(new URL('../tools/glassmatrix.mjs',import.meta.url),'utf8');
const frames = readFileSync(new URL('../tools/ui-review-evaluation.mjs',import.meta.url),'utf8');
const extract = (source:string,start:string,end:string) => {
  expect(source.split(start)).toHaveLength(2); expect(source.split(end)).toHaveLength(2);
  return source.slice(source.indexOf(start),source.indexOf(end)).replace(/^export /gm,'');
};
const owner = extract(glass,'export async function chartersCloseSettlement(','const here = path.dirname(');
const close = extract(glass,'  const panelCloseOutcome =','  const inventoryRowsOutcome =');
const frameOwner = frames.slice(frames.indexOf('export function assessReviewFrameSettlement(')).replace(/^export /gm,'');
async function fixture(settledOwned=false, earlyOwned=false) {
  let at=0,panelOpen:string|null='ch',owns=false,toastOn=true,serial=7,classes='fs-xl tone-max surface-mode panel-open';
  let releaseFonts!:()=>void; const callbacks:Array<()=>void>=[],calls:string[]=[];
  const fonts={status:'loading',ready:new Promise<void>(resolve=>{releaseFonts=resolve;})};
  const rect=(left:number,top:number,width:number,height:number)=>({left,top,width,height,right:left+width,bottom:top+height});
  const nodes = new Map<string,any>();
  for (const id of ['objchip','topbar','planetside','heading','hintpill','ctxbar','dock','toast','chpanel','close','body','html']) {
    const node:any={id,tagName:id==='objchip'||id==='close'?'BUTTON':'DIV',className:'',parentElement:null,
      textContent:id==='objchip'?'⬆ Chapter 1 — Off the Rock is recorded — the next Charter action is not available in this development slice':id,
      offsetHeight:44,scrollTop:0,scrollLeft:0,style:{opacity:id==='toast'?'1':''},
      getBoundingClientRect:()=>id==='objchip'?(panelOpen?rect(0,0,0,0):rect(148,60,162,262.875))
        :id==='close'?rect(248,147,44,44):id==='chpanel'&&!panelOpen?rect(0,0,0,0):rect(12,132,296,44),
      contains:(other:any)=>other===node,querySelector:()=>nodes.get('close')}; nodes.set(id,node);
  }
  nodes.get('heading').parentElement=nodes.get('planetside');
  const document:any={documentElement:nodes.get('html'),body:nodes.get('body'),activeElement:nodes.get('close'),fonts,visibilityState:'visible',
    getElementById:(id:string)=>nodes.get(id),querySelector:(selector:string)=>selector.includes('planetside-heading')?nodes.get('heading'):nodes.get(selector.slice(1)),
    elementFromPoint:()=>panelOpen?nodes.get('close'):owns?nodes.get('objchip'):nodes.get('heading')};
  document.body.getAttribute=()=>classes;
  nodes.get('close').click=()=>{calls.push('close');owns=earlyOwned;panelOpen=null;classes='fs-xl tone-max surface-mode';document.activeElement=nodes.get('objchip');};
  const window:any={__CF_SLICE__:{api:{state:()=>({mode:'surface',star:424242,planet:133,panelOpen,cardOpen:false,toastSerial:serial,toastOn})}},__CF_GLASS_AUDIT__:{}};
  const audit=(options:any)=>{calls.push('audit');expect(options.surface).toBe('charters-opener-off');return owns?[]:[{code:'CONTROL_NOT_HITTABLE',element:'#objchip',
    actual:{at:[229,191.44],rect:{left:148,top:60,right:310,bottom:322.88,width:162,height:262.88}}}];};
  const exported=runInNewContext(frameOwner+close+owner+'\nwindow.__CF_GLASS_AUDIT__={panelCloseOutcome,audit};\n({chartersCloseSettlement,assessChartersCloseSettlement,reviewFrameSettlement,readReviewFrameSettlements})',{
    window,document,audit,Element:Object,visible:(node:any)=>node!==nodes.get('chpanel')||panelOpen!==null,selectorName:(node:any)=>'#'+node.id,
    round:(n:number)=>Math.round(n*100)/100,innerWidth:320,innerHeight:568,performance:{now:()=>++at,timeOrigin:1000},
    requestAnimationFrame:(cb:()=>void)=>callbacks.push(cb),getComputedStyle:(node:any)=>({getPropertyValue:()=> '326px',
      display:node===nodes.get('chpanel')&&!panelOpen?'none':'block',visibility:'visible',opacity:node===nodes.get('toast')&&!toastOn?'0':'1',
      fontSize:'17px',fontFamily:'Inter',minHeight:'0px',maxHeight:'72px',zIndex:'22',overflowY:'auto'})});
  const pending=exported.chartersCloseSettlement(exported.reviewFrameSettlement,exported.readReviewFrameSettlements,{surface:'charters-opener-off'});
  expect(calls).toEqual(['close']);expect(callbacks).toHaveLength(0);await Promise.resolve();
  fonts.status='loaded';releaseFonts();await Promise.resolve();await Promise.resolve();expect(callbacks).toHaveLength(1);
  callbacks.shift()!();expect(callbacks).toHaveLength(1);owns=settledOwned;callbacks.shift()!();
  const receipt=JSON.parse(JSON.stringify(await pending));expect(calls).toEqual(['close','audit','audit']);
  return {receipt,assess:(r:any)=>exported.assessChartersCloseSettlement(r,{width:320,height:568}),
    expireLater:()=>{toastOn=false;serial++;owns=true;return audit({surface:'charters-opener-off'});}};
}
it('executes the original synchronous Close, then microtask and one actual font/two-frame owner before the atomic audit',async()=>{
  const {receipt,assess}=await fixture(true);expect(assess(receipt)).toEqual({ok:true,errors:[]});
  expect(receipt.closeOutcome).toMatchObject({ok:true,panelClosed:true,focusRestored:true});
  expect(receipt.immediate.hit).toMatchObject({owned:false,point:[229,191.4375]});expect(receipt.settled.hit.owned).toBe(true);
  expect(receipt.frame.phases.map((p:any)=>p.phase)).toEqual(['fonts-wait','fonts-ready','frame1','frame2','settled']);
  expect(receipt.before.classes).toContain('panel-open');expect(receipt.settled.geometry.objchip.text).toBe(receipt.before.geometry.objchip.text);
});
it('rejects missing, swapped or corrupt causal receipts, expired notices and green booleans without coherent native hit facts',async()=>{
  const {receipt,assess}=await fixture();
  const faults:Array<(r:any)=>void>=[r=>{delete r.frame;},r=>{r.frame.id++;},r=>{r.frame.label='earlier';},r=>{r.frame.phases.splice(2,1);},
    r=>{r.microtask.at=r.settled.at+1;},r=>{r.settled.timeOrigin++;},r=>{r.settled.viewport.width=390;},
    r=>{r.settled.toast.serial++;},r=>{r.settled.toast.text='Replacement';},r=>{r.settled.toast.on=false;},
    r=>{r.settled.toast.inlineOpacity='0';},r=>{r.settled.toast.computedOpacity=0;},r=>{r.settled.geometry.heading=null;},
    r=>{r.settled.vars['--cf-sheet-floor']='';},r=>{r.settled.geometry.objchip.width++;},r=>{r.settled.classes='surface-mode';},
    r=>{r.settled.geometry.objchip.text='Shortened';},r=>{r.settled.scroll.body=[0];},r=>{r.settled.route.cardOpen=true;},
    r=>{r.settled.focus='docksets';},r=>{r.settled.hit.owned=true;},r=>{r.settled.hit.point[1]++;},
    r=>{r.settled.hit.path=[null];},r=>{r.openerAudit=[];},r=>{r.openerAudit[0].actual.rect.top++;},r=>{delete r.closeOutcome;},r=>{r.error='failed'}];
  expect(assess(receipt)).toEqual({ok:true,errors:[]});for(const mutate of faults){const broken=structuredClone(receipt);mutate(broken);expect(assess(broken).ok).toBe(false);}
});
it('retains the same-task settled red at the original opener-off call site after a later expiry would make it green',async()=>{
  const {receipt,assess,expireLater}=await fixture();expect(assess(receipt).ok).toBe(true);expect(expireLater()).toEqual([]);
  const code=extract(glass,'          add(vp.label, `${item.name}-opener-off`,','\n        }\n\n        if (vp.width > 900 && !hiddenOpenerControlRun)');
  const calls:any[]=[];let remeasurements=0;
  await runInNewContext('(async()=>{'+code+'})()', {vp:{label:'small-phone'},item:{name:'charters'},chartersSettlement:receipt,
    add:(...args:any[])=>calls.push(args),audit:()=>{remeasurements++;return[];}});
  expect(remeasurements).toBe(0);expect(calls[0][2]).toBe(receipt.openerAudit);expect(calls[0][2][0].code).toBe('CONTROL_NOT_HITTABLE');
});

it('allows a later ceremony only with a retained green audit before it; never substitutes expiry for answerability',async()=>{
  const {receipt,assess}=await fixture(true,true);
  const changed=structuredClone(receipt);changed.settled.toast.serial++;changed.settled.toast.text='A queued achievement';
  expect(assess(changed).ok).toBe(true);
  for(const key of ['immediate','microtask']){const tooEarly=structuredClone(receipt);tooEarly[key].toast.serial++;expect(assess(tooEarly).ok).toBe(false);}
  for(const early of [null,[{code:'CONTROL_NOT_HITTABLE',element:'#objchip'}]]){const red=structuredClone(changed);red.microtaskAudit=early;expect(assess(red).ok).toBe(false);}
  const forged=structuredClone(changed);forged.microtask.hit.path=[];expect(assess(forged).ok).toBe(false);
});
