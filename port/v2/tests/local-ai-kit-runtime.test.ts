import {afterEach,describe,expect,it,vi} from 'vitest';
import {createWarmKitLandfallRuntimeV4,type KitLandfallRecipeV4} from '../apps/game/src/local-ai-kit-runtime.js';
class WorkerFixture {
  static all: WorkerFixture[]=[];onmessage: ((e: {data: Record<string,unknown>})=>void)|null=null;onerror=null;onmessageerror=null;terminated=false;last: Record<string,unknown>={};
  constructor(){WorkerFixture.all.push(this);}postMessage(job: Record<string,unknown>){this.last=job;}
  terminate(){this.terminated=true;}reply(extra: Record<string,unknown>={}){this.onmessage?.({data:{type:'complete',requestId:this.last.requestId,schema:'cf.kit-engine-result.v4',painting:new Blob(['fixture'],{type:'image/png'}),width:1024,height:576,qualityAccepted:false,...extra}});}
}
const recipe={width:1024,height:576} as KitLandfallRecipeV4;
afterEach(()=>{vi.unstubAllGlobals();WorkerFixture.all=[];});
describe('app-owned warm kit worker',()=>{
 it('retains the worker across successful landings and terminates it on cancellation',async()=>{
  vi.stubGlobal('Worker',WorkerFixture);const runtime=createWarmKitLandfallRuntimeV4('/worker.mjs');
  const first=runtime.generate(recipe,new AbortController().signal);WorkerFixture.all[0]!.reply();await first;
  const second=runtime.generate(recipe,new AbortController().signal);expect(WorkerFixture.all).toHaveLength(1);WorkerFixture.all[0]!.reply();await second;
  expect(WorkerFixture.all[0]!.terminated).toBe(false);
  const abort=new AbortController(),pending=runtime.generate(recipe,abort.signal);const rejected=expect(pending).rejects.toMatchObject({name:'AbortError'});abort.abort();await rejected;expect(WorkerFixture.all[0]!.terminated).toBe(true);
  const next=runtime.generate(recipe,new AbortController().signal);expect(WorkerFixture.all).toHaveLength(2);WorkerFixture.all[1]!.reply();await next;runtime.dispose();expect(WorkerFixture.all[1]!.terminated).toBe(true);
 });
 it('rejects wrong geometry instead of retaining a false success',async()=>{
  vi.stubGlobal('Worker',WorkerFixture);const runtime=createWarmKitLandfallRuntimeV4('/worker.mjs');const pending=runtime.generate(recipe,new AbortController().signal);WorkerFixture.all[0]!.reply({width:999});await expect(pending).rejects.toThrow('contract mismatch');expect(WorkerFixture.all[0]!.terminated).toBe(true);runtime.dispose();
 });
});
