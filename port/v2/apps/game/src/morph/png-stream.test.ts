import {describe,it,expect,vi} from 'vitest';
import {completePngStream} from './png-stream.js';
import {encodePng} from './png-encode.js';
import {decodePng} from './png-decode.js';
const deferred=()=>{let resolve!:()=>void;const promise=new Promise<void>(r=>{resolve=r});return {promise,resolve};};
function fixture(failure:'read'|'write'|null=null){
 const closing=deferred(),closed=deferred();let read=0;const chunk=Uint8Array.of(2,4,8);
 const writer={write:vi.fn(async()=>{if(failure==='write')throw Error('write failed');}),close:vi.fn(async()=>{closing.resolve();await closed.promise;}),abort:vi.fn(async()=>{}),releaseLock:vi.fn()};
 const reader={read:vi.fn(async()=>{if(failure==='read')throw Error('read failed');return read++?{done:true,value:undefined}:{done:false,value:chunk};}),cancel:vi.fn(async()=>{}),releaseLock:vi.fn()};
 const stream={writable:{getWriter:()=>writer},readable:{getReader:()=>reader}} as unknown as ReadableWritablePair<Uint8Array,BufferSource>;
 return {stream,writer,reader,closing,closed,chunk};
}
describe('PNG native stream ownership',()=>{
 it('does not publish bytes at readable EOF while native writer close remains pending',async()=>{
  const f=fixture(),input=Uint8Array.of(7,9);let published=false;const pending=completePngStream(f.stream,input).then(v=>{published=true;return v});
  await f.closing.promise;for(let i=0;i<8;i++)await Promise.resolve();
  expect(published).toBe(false);expect(f.writer.releaseLock).not.toHaveBeenCalled();
  f.closed.resolve();expect(await pending).toEqual(f.chunk);expect(input).toEqual(Uint8Array.of(7,9));
  expect(f.writer.releaseLock).toHaveBeenCalledTimes(1);expect(f.reader.releaseLock).toHaveBeenCalledTimes(1);
 });
 for(const failure of ['read','write'] as const)it(`propagates ${failure} failure and releases both owners`,async()=>{
  const f=fixture(failure);f.closed.resolve();await expect(completePngStream(f.stream,Uint8Array.of(1))).rejects.toThrow(failure+' failed');
  expect(f.writer.abort).toHaveBeenCalledTimes(1);expect(f.reader.cancel).toHaveBeenCalledTimes(1);
  expect(f.writer.releaseLock).toHaveBeenCalledTimes(1);expect(f.reader.releaseLock).toHaveBeenCalledTimes(1);
 });
 it('keeps the encoded PNG byte-identical to the old native deflate path',async()=>{
  const width=33,height=17,rgba=Uint8Array.from({length:width*height*4},(_,i)=>(i*37+11)&255);
  const png=await encodePng(rgba,width,height),back=await decodePng(png);expect(back.rgba).toEqual(rgba);
  const raw=new Uint8Array((width*4+1)*height);for(let y=0;y<height;y++)raw.set(rgba.subarray(y*width*4,(y+1)*width*4),y*(width*4+1)+1);
  const cs=new CompressionStream('deflate'),w=cs.writable.getWriter();const write=w.write(raw).then(()=>w.close());
  const reference=new Uint8Array(await new Response(cs.readable).arrayBuffer());await write;
  // PNG's one IDAT starts immediately after signature + IHDR chunk.
  const view=new DataView(png.buffer,png.byteOffset,png.byteLength),length=view.getUint32(33);
  expect(png.slice(41,41+length)).toEqual(reference);
 });
});
