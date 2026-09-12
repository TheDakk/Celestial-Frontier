import {createGrazer} from './grazer.mjs';
import {createSmallCreatures} from './small-creatures.mjs';
import {createPlants} from './plants.mjs';
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d'),button=document.getElementById('toggle');
const image=async url=>{const img=new Image();img.src=url;await img.decode();return img;};
const [source,background]=await Promise.all([image('../LOCAL_AI_DESERT_TEST_20260909/raw-output.png'),image('./background-clean.png')]);
if(source.naturalWidth!==1024||source.naturalHeight!==576)throw Error('Source image dimensions changed');
const grazer=createGrazer(source),small=createSmallCreatures(source),plants=createPlants(source);
let playing=false,frame=0,time=0,last=null;
const particles=Array.from({length:25},(_,i)=>({x:(i*.61803398875)%1,y:.55+((i*.381966)%1)*.43,alpha:.035+(i%4)*.012}));
function draw(seconds){const t=((seconds%12)+12)%12;ctx.clearRect(0,0,1024,576);ctx.drawImage(background,0,0,1024,576);
 plants.drawBack(ctx,t);small.drawBat(ctx,t);grazer.draw(ctx,t);small.drawLizard(ctx,t);plants.drawFront(ctx,t);
 for(const d of particles){const x=(d.x+t/12)%1,fade=Math.min(1,x*12,(1-x)*12);ctx.fillStyle=`rgba(245,198,151,${d.alpha*fade})`;ctx.fillRect(x*1024,d.y*576+Math.sin(t*Math.PI/3+d.x*8)*2,4,.8);}
 return {seconds:t,grazer:grazer.diagnostics(t),small:small.diagnostics(t),plants:plants.diagnostics(t)};
}
function update(){button.textContent=playing?'Pause':'Play';button.setAttribute('aria-pressed',String(playing));}
function tick(now){if(last!==null)time+=(now-last)/1000;last=now;draw(time);if(playing)frame=requestAnimationFrame(tick);}
function setPlaying(value){cancelAnimationFrame(frame);playing=value;last=null;update();if(value)frame=requestAnimationFrame(tick);}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');button.disabled=false;button.addEventListener('click',()=>setPlaying(!playing));reduced.addEventListener('change',()=>{if(reduced.matches)setPlaying(false);});
window.desertMotion={ready:true,draw(seconds){if(!Number.isFinite(seconds)||seconds<0)throw Error('Invalid animation time');setPlaying(false);time=seconds;return draw(time);},get playing(){return playing;},get seconds(){return time;},setPlaying};
window.articulation={diagnostics:t=>({grazer:grazer.diagnostics(t),small:small.diagnostics(t),plants:plants.diagnostics(t)})};
draw(0);setPlaying(!reduced.matches);addEventListener('pagehide',()=>setPlaying(false));
