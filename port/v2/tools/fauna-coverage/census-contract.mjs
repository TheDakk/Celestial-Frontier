export function inspectInk(rgba,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||rgba.length!==width*height*4)throw Error('Census ink dimensions');
 let pixels=0,minX=width,minY=height,maxX=-1,maxY=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>12){pixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
 if(!pixels)throw Error('Census blank ink');
 return {width,height,paintedPixels:pixels,bounds:{minX,minY,maxX,maxY}};
}
export function comparePixels(a,b){if(a.length!==b.length)throw Error('Census pixel dimensions');let changed=0;for(let i=0;i<a.length;i++)changed+=a[i]!==b[i];return changed;}
export function summarizeCensus(rows,expected){
 const ids=rows.map(r=>r.id);if(new Set(expected).size!==expected.length||new Set(ids).size!==ids.length||ids.length!==expected.length||expected.some(id=>!ids.includes(id)))throw Error('Census missing/duplicate/unknown case');
 if(rows.some(r=>!['RASTER_PASS','LEGACY_FALLTHROUGH','FAIL'].includes(r.status)))throw Error('Census unfinished case');
 return {total:rows.length,earth:rows.filter(r=>r.kind==='earth').length,procedural:rows.filter(r=>r.kind==='procedural').length,rasterPass:rows.filter(r=>r.status==='RASTER_PASS').length,legacyFallthrough:rows.filter(r=>r.status==='LEGACY_FALLTHROUGH').length,failures:rows.filter(r=>r.status==='FAIL').length,topologyEmissions:rows.filter(r=>r.observation).length};
}
