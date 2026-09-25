/** PNG read/write for the compiler's runners (pngjs), owned here so no runner imports from Codex's canonical
 * finisher files (which stopped exporting readPng/writePng at the 2026-09-21 re-merge). Same shapes as before:
 * readPng(bytes) → {width,height,data:Uint8Array RGBA}; writePng(width,height,data) → Buffer. */
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {PNG}=require('pngjs');
export const readPng=bytes=>{const p=PNG.sync.read(bytes);return {width:p.width,height:p.height,data:new Uint8Array(p.data.buffer,p.data.byteOffset,p.data.length)};};
export const writePng=(width,height,data)=>{const p=new PNG({width,height});p.data=Buffer.from(data.buffer,data.byteOffset,data.length);return PNG.sync.write(p);};
