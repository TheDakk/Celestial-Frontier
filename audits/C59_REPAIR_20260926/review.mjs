import fs from'node:fs';import path from'node:path';import{createRequire}from'node:module';const req=createRequire(new URL('../../port/v2/package.json',import.meta.url)),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const rows=[['g2c56','06-mink'],['g2c56','08-fisher'],['g2c57','05-snow-leopard'],['g2c57','06-clouded-leopard'],['g2c54','05-tiger'],['g2c54','06-leopard'],['g2c54','09-ocelot']];
const tiles=[];for(const[tag,id]of rows){const k=rows.findIndex(x=>x[0]===tag&&x[1]===id),y=k*278,base=tag==='g2c54'?'audits/G1_AUTO_AUTHOR_20260926/native-g2c54/'+id:'audits/G1_AUTO_AUTHOR_20260926/native-g2c56/'+tag.slice(2)+'-'+id;
 const paths=[base+'/turn0-hit-approach-50.png',path.join(import.meta.dirname,tag+'-'+id+'-side-native/turn0-hit-approach-50.png')];
 const label=Buffer.from(`<svg width="1024" height="28"><rect width="1024" height="28" fill="white"/><text x="8" y="20" font-family="sans-serif" font-size="18">${tag} ${id}: original (left), opposite-leg ownership correction (right)</text></svg>`);tiles.push({input:label,left:0,top:y});
 for(let i=0;i<2;i++){const tile=await sharp(paths[i]).extract({left:0,top:230,width:512,height:250}).png().toBuffer();tiles.push({input:tile,left:i*512,top:y+28});}
}
await sharp({create:{width:1024,height:rows.length*278,channels:3,background:'#fff'}}).composite(tiles).png().toFile(path.join(import.meta.dirname,'elbow-before-after.png'));
