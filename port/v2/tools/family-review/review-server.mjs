import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {pathToFileURL} from 'node:url';
export function byteRange(header,size){
 if(header===undefined)return null;
 const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2]))throw Error('Invalid range');
 const start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2])),end=m[1]?(m[2]?Math.min(Number(m[2]),size-1):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw Error('Unsatisfiable range');
 return {start,end};
}
export function reviewServer(directory){
 const root=fs.realpathSync(directory),types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.mp4':'video/mp4','.webm':'video/webm','.png':'image/png','.jpg':'image/jpeg'};
 return http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  try{
   let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');p=fs.realpathSync(p);
   if(!p.startsWith(root+path.sep))throw Error('Outside review root');
   const size=fs.statSync(p).size;let range;try{range=byteRange(req.headers.range,size);}catch{res.writeHead(416,{'Content-Range':'bytes */'+size}).end();return;}
   res.setHeader('Content-Type',types[path.extname(p)]??'application/octet-stream');res.setHeader('Accept-Ranges','bytes');res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Length',range?range.end-range.start+1:size);
   if(range)res.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${size}`);res.writeHead(range?206:200);
   if(req.method==='HEAD'){res.end();return;}
   fs.createReadStream(p,range??{}).on('error',()=>res.destroy()).pipe(res);
  }catch{res.writeHead(404).end('Review asset not found');}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const root=process.argv[2],port=Number(process.argv[3]??49816);if(!root)throw Error('Usage: review-server DIRECTORY [PORT]');reviewServer(root).listen(port,'127.0.0.1',()=>console.log(`Review: http://127.0.0.1:${port}/`));}
