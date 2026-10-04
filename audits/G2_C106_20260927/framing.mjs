/** Output framing observation, not anatomy or runtime admission. Dakk's existing 8% request is unchanged. */
export function observeFraming(mask,width,height){
 if(!Number.isSafeInteger(width)||width<=0||!Number.isSafeInteger(height)||height<=0||mask.length!==width*height)throw Error('Framing raster shape');
 let x0=width,y0=height,x1=-1,y1=-1;
 for(let i=0;i<mask.length;i++)if(mask[i]){const x=i%width,y=Math.floor(i/width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0)return{status:'REFUSE',reason:'No observed paint'};
 const margins={left:x0,right:width-1-x1,top:y0,bottom:height-1-y1},required={x:Math.ceil(width*.08),y:Math.ceil(height*.08)};
 return{status:margins.left>=required.x&&margins.right>=required.x&&margins.top>=required.y&&margins.bottom>=required.y?'PASS_FRAMING_ONLY':'REFUSE',bounds:{x0,y0,x1,y1},margins,required,scope:'Existing requested 8% clear margin; no identity, anatomy or motion claim'};
}
