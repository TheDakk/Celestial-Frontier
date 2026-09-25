import fs from 'node:fs';import {createRequire} from 'node:module';
const req=createRequire('/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/package.json'),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),p=import.meta.dirname;
const tiles=[];for(const [i,id]of ['civet-native-01','cougar-native-02'].entries()){
 const r=JSON.parse(fs.readFileSync(p+'/'+id+'/report.json')),c=r.capture,header=Buffer.from(`<svg width="1024" height="70"><rect width="100%" height="100%" fill="#172329"/><text x="20" y="29" fill="white" font-size="24" font-family="Arial">${id}: ${r.status} — final encoded frame</text><text x="20" y="56" fill="#e4daba" font-size="18" font-family="Arial">${c.frames} live / ${c.encodedFrames.frames} encoded; ${(c.durationMs/1000).toFixed(3)}s; refusals ${c.refusalsAtEnd.left}/${c.refusalsAtEnd.right}</text></svg>`);
 tiles.push({input:header,left:0,top:i*646},{input:await sharp(p+'/'+id+'/encoded-final-frame.png').png().toBuffer(),left:0,top:i*646+70});
}
await sharp({create:{width:1024,height:1292,channels:4,background:'#172329'}}).composite(tiles).png().toFile(p+'/review-sheet.png');
