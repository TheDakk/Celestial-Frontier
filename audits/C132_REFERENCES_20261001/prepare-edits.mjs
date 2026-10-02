import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base=import.meta.dirname,rows=JSON.parse(fs.readFileSync(base+'/pilot.json')),sha=b=>createHash('sha256').update(b).digest('hex'),next=[];
fs.writeFileSync(base+'/original-pilot.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
for(const row of rows){
 const packet=row.packet+'/candidate-02';fs.mkdirSync(packet);
 for(const file of ['subject-source.json','compiler-inputs.json'])fs.copyFileSync(row.packet+'/'+file,packet+'/'+file,fs.constants.COPYFILE_EXCL);
 const oldPrompt=fs.readFileSync(row.packet+'/prompt.txt','utf8'),request=JSON.parse(fs.readFileSync(row.packet+'/request.json'));
 const style=oldPrompt.slice(oldPrompt.indexOf('  Rich natural-history fantasy painting,'),oldPrompt.indexOf('\n\nThe scene-contact'));
 if(!style.startsWith('  Rich natural-history')||!style.endsWith('no glowing outlines.'))throw Error('Exact kit style paragraph required');
 const ear=['Gazelle','Gaur'].includes(row.name)?' Also reveal the existing far ear in a natural slight offset: exactly TWO natural ears total, each complete from its attachment to its tip and separately visible, with no third ear, no new horn, and no invented anatomy. Keep the near ear unchanged; expose the actual far ear on the other side of the head.':'';
 const prompt='Use case: identity-preserve. The attached image is the edit target: one Earth '+row.name+'. Preserve this exact creature identity, painted style, natural body proportions, coat pattern, colours, head, horns if present, complete tail and four-limb stance.\n\nZoom the ENTIRE EXISTING ANIMAL OUT to 60 percent of its current size and centre it in the SAME 1254 by 1254 square. This means the whole animal becomes smaller together; never shorten the tail or legs. Keep every painted pixel including horns, ears, whiskers and tail tips inside x=250..1004 and y=250..1004, leaving generous empty magenta on all sides. Do not paint a rectangle or any labels.'+ear+'\n\n'+style+'\n\nBackground: every non-subject pixel is perfectly flat pure magenta #FF00FF. No scene, floor, cast shadow, transparency, border, text or new decoration. Preserve four distinct natural legs and complete connected tail. This is a new immutable edited candidate; prior painting remains retained.\n';
 fs.writeFileSync(packet+'/prompt.txt',prompt,{flag:'wx'});
 fs.writeFileSync(packet+'/request.json',JSON.stringify({...request,basePromptSha256:request.promptSha256,promptSha256:sha(prompt),editTarget:row.master,editTargetSha256:sha(fs.readFileSync(row.master)),purpose:'Single targeted framing edit; Gazelle/Gaur additionally expose the natural far ear. Earlier original retained.',editCompilerSha256:sha(fs.readFileSync(import.meta.filename)),authoringCreated:false},null,2)+'\n',{flag:'wx'});
 next.push({...row,packet,master:packet+'/master.png'});
}
fs.writeFileSync(base+'/pilot.json.tmp',JSON.stringify(next,null,2)+'\n',{flag:'wx'});fs.renameSync(base+'/pilot.json.tmp',base+'/pilot.json');
