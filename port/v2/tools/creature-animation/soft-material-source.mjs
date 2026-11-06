/** Source-supported soft body fields; no taxonomic classifier or material ruler. */
export function validateSoftMaterialSource(author,rgba,width,height){
 if(author?.family!=='ctenophore-body')return null;
 const need=(ok,message)=>{if(!ok)throw Error('Soft material source: '+message);};
 need(Number.isInteger(width)&&width>0&&Number.isInteger(height)&&height>0&&rgba?.length===width*height*4,'finite source RGBA dimensions');
 const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const fields=[];for(const joint of ['aboral','oral','dorsal','ventral','centre']){
  const point=author.landmarksPx?.[joint];need(Array.isArray(point)&&point.length===2&&point.every(Number.isFinite),joint+' source support landmark');
  const[x,y]=point.map(Math.floor);need(x>=0&&x<width&&y>=0&&y<height&&rgba[(y*width+x)*4+3]>0,joint+' source support at observed landmark');
  const owner=author.parts?.find(p=>inside(x+.5,y+.5,p.polygonPx));need(owner?.joint===joint,joint+' must retain its observed source field');fields.push({joint,point,part:owner.id,positiveSourceAlpha:rgba[(y*width+x)*4+3]});
 }
 return{schema:'cf.soft-material-source/v1',status:'PASS',fields,scope:'source support and preserved manually observed soft-body ownership only; no species classification or native acceptance',nativeAcceptance:false};
}
