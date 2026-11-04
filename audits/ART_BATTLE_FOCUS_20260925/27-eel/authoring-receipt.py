from pathlib import Path
import json
p=Path(__file__).resolve().parent
lm={'root':[974,648],'head':[1051,642],'jaw':[1062,658],'seg0':[937,661],'seg1':[856,677],'seg2':[773,676],'seg3':[691,650],'seg4':[607,615],'seg5':[523,608],'seg6':[439,638],'seg7':[358,678],'seg8':[278,678],'seg9':[199,642]}
parts=[]
def part(i,j,poly):parts.append({'id':i,'joint':j,'layer':'near','polygonPx':poly})
part('root','root',[[968,642],[980,642],[980,654],[968,654]])
part('jaw','jaw',[[1000,653],[1108,633],[1114,689],[992,695]])
part('head','head',[[981,599],[1117,602],[1115,638],[1000,656],[978,663]])
# Explicitly observed transverse body owners; the same continuous fin fringe belongs to its local body section.
for i,(left,right) in enumerate([(899,987),(815,899),(732,815),(649,732),(565,649),(481,565),(398,481),(318,398),(239,318),(0,239)]):
 part('segment-'+str(i),'seg'+str(i),[[left,430],[right,430],[right,790],[left,790]])
a={'id':'eel','family':'serpent','landmarksPx':lm,'habitat':{'realm':'aquatic','source':'Explicit freshwater eel; continuous dorsal/caudal/anal fringe and two visible small pectoral fins, no pelvic fins or legs.'},'groundLineY':727/1254,'materials':{'surface':'plain olive-brown slick wet skin and fine fin membrane'},'remainderPart':'segment-0','parts':parts,'coverage':{'scope':'One manually observed Eel painting; Lamprey/Moray/Oarfish remain documented caveats.','finOwnership':'Continuous fin fringe follows containing body segments; paired pectorals painted on proximal segment0, no independent fin articulation in serpent template.'}}
(p/'authoring.json').write_text(json.dumps(a,indent=2)+'\n');(p/'presence.json').write_text(json.dumps({'schema':'cf.anatomy-presence/v2','absent':[],'hidden':[],'folded':[]},indent=2)+'\n')
print(len(parts),len(lm))
