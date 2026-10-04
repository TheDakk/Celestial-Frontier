import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import {describe,it,expect} from 'vitest';
const root=new URL('../../../',import.meta.url);
describe('review runner exclusion and evidence failure ownership',()=>{
 it('retains a checked lock before any browser/server work without acquiring it in this test',()=>{
  for(const [file,anchor] of [
   ['tools/local-image-generation/probe-webgpu.mjs','const server = http.createServer'],
   ['tools/local-image-generation/run-browser-proof.mjs','  if(!receipt.preflight){'],
   ['port/v2/tools/ui-review-navigation-selftest.mjs','const output = path.resolve'],
   ['port/v2/tools/audiovisual-pilot-review.mjs','const build = fs.realpathSync'],
  ]){
   const source=readFileSync(new URL(file!,root),'utf8');
   const accepts=(s:string)=>{const match=/\n\s*acquireWorkspaceLock\('[^']+', \{inheritFromParent:true\}\);/.exec(s);return !!match&&match.index<s.indexOf(anchor!);};
   expect(accepts(source),file).toBe(true);expect(accepts(source.replace(/\n\s*acquireWorkspaceLock\([^\n]+\);/,'')),file).toBe(false);
  }
  const source=readFileSync(new URL('port/v2/tools/ui-shell-review.mjs',root),'utf8');
  const start=source.indexOf('export async function runUiShellReview('),end=source.indexOf('\nasync function runLockedUiShellReview(',start);
  const wrapper=source.slice(start,end).replace('export ','');const trace:string[]=[];
  const run=runInNewContext(wrapper+';runUiShellReview',{acquireWorkspaceLock:()=>{throw Error('busy');},runLockedUiShellReview:()=>trace.push('browser')});
  return expect(run('build','out')).rejects.toThrow('busy').then(()=>expect(trace).toEqual([]));
 });
 it('event overflow stays bounded, preserves first fault and permits ordinary failure cleanup',()=>{
  for(const file of ['run-game-integration','run-landfall-viewer']){
   const source=readFileSync(new URL('tools/local-image-generation/'+file+'.mjs',root),'utf8');
   const start=source.indexOf('    onEvent:event=>{'),end=source.indexOf('    }});',start);
   expect(start).toBeGreaterThan(0);expect(end).toBeGreaterThan(start);
   const callback='event=>{'+source.slice(start+'    onEvent:event=>{'.length,end)+'}';
   const inspect=(code:string)=>runInNewContext(`let eventFault=null;const receipt={browserEvents:[],targetEvents:[]},inferenceTargets=new Set();const onEvent=${code};for(let i=0;i<305;i++)onEvent({method:'Runtime.exceptionThrown'});const first=eventFault;for(let i=0;i<305;i++)onEvent({method:'Target.targetCreated',params:{}});({first:eventFault===first,count:receipt.browserEvents.length,targetCount:receipt.targetEvents.length,message:eventFault.message})`);
   expect(inspect(callback)).toEqual({first:true,count:300,targetCount:300,message:'Browser event evidence overflow'});
   expect(()=>inspect(callback.replace("eventFault??=Error('Browser event evidence overflow');return;","throw Error('Browser event evidence overflow');"))).toThrow('Browser event evidence overflow');
   expect(source).toContain('if(eventFault)throw eventFault;');
  }
 });
});

it('training review restores exact style/inert attributes even after a measurement throws',async()=>{
 const {createRequire}=await import('node:module');
 const {JSDOM}=createRequire(import.meta.url)('jsdom') as {JSDOM:new(html:string)=>{window:{document:Document;close():void}}};
 const source=readFileSync(new URL('port/v2/tools/ui-shell-review.mjs',root),'utf8');
 const start=source.indexOf('export function readU1PhoneShell('),end=source.indexOf('\nfunction shellGeometry()',start);
 const actual=source.slice(start,end).replace('export ','');
 const check=(code:string)=>{
  const dom=new JSDOM('<div id="dock"></div><div id="topbar" style="" inert="inert"></div><div id="sceneactions" style="color:red;pointer-events:none!important"></div><div id="raillft" inert=""></div>');
  try{
   const nodes=[...dom.window.document.querySelectorAll('div')],attrs=()=>nodes.map(n=>[n.getAttribute('style'),n.getAttribute('inert')]),before=attrs();
   const read=runInNewContext(code+';readU1PhoneShell',{document:dom.window.document,getComputedStyle:()=>{throw Error('measurement failure');}});
   expect(()=>read(true)).toThrow('measurement failure');expect(attrs()).toEqual(before);
  }finally{dom.window.close();}
 };
 check(actual);
 const stale=actual.replace("if (style === null) { node.setAttribute('style', ''); node.removeAttribute('style'); } else node.setAttribute('style', style);","node.style.removeProperty('pointer-events');");
 expect(()=>check(stale)).toThrow();
});
