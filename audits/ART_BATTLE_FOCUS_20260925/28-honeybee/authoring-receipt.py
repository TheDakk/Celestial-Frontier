from pathlib import Path
import json,shutil,hashlib
b=Path('audits/ART_BATTLE_FOCUS_20260925/28-honeybee')
src='/Users/nick/.codex/generated_images/01a0c73f-5f04-7592-8681-402a4e887ffc/exec-48ca39df-724d-4250-81ad-00fd12b01bfc.png';shutil.copy2(src,b/'master.png');sha=hashlib.sha256((b/'master.png').read_bytes()).hexdigest()
(b/'tool-receipt-04.json').write_text(json.dumps({'tool':'image_gen.imagegen','output':src,'masterSha256':sha,'selected':True,'manualReview':'Six separately visible feet and four wing lobes, connected plain body, opaque magenta, antennae corrected inside margins.'},indent=2)+'\n')
lm={'root':[752,640],'thorax':[755,637],'head':[922,658],'mandible':[976,756],'abdomen':[443,672], 'legFrontFarKnee':[797,819],'legFrontFarFoot':[835,884],'legFrontNearKnee':[900,807],'legFrontNearFoot':[1021,952], 'legMidFarKnee':[584,846],'legMidFarFoot':[621,942],'legMidNearKnee':[680,839],'legMidNearFoot':[765,1020], 'legHindFarKnee':[373,843],'legHindFarFoot':[270,936],'legHindNearKnee':[444,857],'legHindNearFoot':[359,1027], 'antennaFar':[1096,596],'antennaNear':[1090,656],'wingFar':[612,351],'wingNear':[381,359]}
parts=[]
def part(id,joint,layer,poly):parts.append({'id':id,'joint':joint,'layer':layer,'polygonPx':poly})
part('antenna-far','antennaFar','far',[[976,618],[975,559],[1023,544],[1133,552],[1133,618],[1036,591],[993,626]])
part('antenna-near','antennaNear','near',[[978,632],[1000,603],[1036,589],[1075,610],[1120,641],[1120,683],[1081,684],[1048,636],[1018,615]])
# Existing insect template has two wing owners, each carrying its visible fore/hind pair.
part('wing-far','wingFar','far',[[386,130],[474,130],[653,263],[779,472],[770,518],[697,501],[572,426],[504,362],[514,328],[456,306],[412,238]])
part('wing-near','wingNear','near',[[122,220],[275,222],[452,300],[655,473],[747,582],[688,563],[569,538],[410,554],[320,506],[282,451],[300,435],[401,440],[236,401],[163,327]])
# Distal and proximal regions authored from the visible six limbs; far regions precede near only where physically separate.
part('leg-front-far-foot','legFrontFarFoot','far',[[777,815],[813,808],[827,862],[857,872],[862,914],[822,911],[792,875]])
part('leg-front-far','legFrontFarKnee','far',[[783,746],[823,729],[819,785],[813,829],[777,831],[766,787]])
part('leg-front-near-foot','legFrontNearFoot','near',[[884,799],[923,793],[978,874],[994,915],[1047,934],[1054,975],[1013,978],[974,945],[943,895],[906,878]])
part('leg-front-near','legFrontNearKnee','near',[[835,710],[870,710],[915,769],[923,813],[884,824],[848,772]])
part('leg-mid-far-foot','legMidFarFoot','far',[[569,836],[601,834],[607,902],[644,930],[641,969],[607,970],[574,934],[563,878]])
part('leg-mid-far','legMidFarKnee','far',[[628,746],[658,760],[621,815],[602,855],[569,855],[568,822]])
part('leg-mid-near-foot','legMidNearFoot','near',[[657,831],[699,819],[733,894],[732,935],[754,987],[788,1012],[794,1049],[754,1054],[720,1019],[705,971],[677,928]])
part('leg-mid-near','legMidNearKnee','near',[[627,737],[660,735],[685,783],[705,832],[661,851],[630,811],[616,767]])
part('leg-hind-far-foot','legHindFarFoot','far',[[354,830],[393,839],[349,895],[308,932],[278,948],[257,963],[234,948],[241,922],[277,920],[312,888]])
part('leg-hind-far','legHindFarKnee','far',[[449,731],[483,749],[416,808],[394,852],[354,850],[364,809],[405,773]])
part('leg-hind-near-foot','legHindNearFoot','near',[[414,851],[460,849],[452,928],[431,974],[398,1018],[363,1057],[335,1047],[337,1023],[372,1007],[397,963]])
part('leg-hind-near','legHindNearKnee','near',[[497,670],[540,659],[589,695],[623,714],[614,738],[579,730],[539,698],[499,750],[479,820],[460,868],[413,861],[422,798],[460,737]])
part('mandible','mandible','near',[[943,713],[989,710],[1008,756],[1000,797],[961,810],[950,775]])
part('head','head','near',[[873,539],[932,533],[980,561],[1000,628],[1004,700],[968,748],[902,734],[865,702],[855,625]])
part('abdomen','abdomen','near',[[188,829],[187,750],[247,645],[342,571],[449,539],[542,530],[603,558],[638,610],[619,653],[575,685],[534,673],[497,694],[461,740],[451,772],[335,814]])
part('root','root','near',[[746,634],[758,634],[758,646],[746,646]])
part('thorax','thorax','near',[[0,0],[1254,0],[1254,1254],[0,1254]])
a={'id':'honeybee','family':'insect','landmarksPx':lm,'groundLineY':1060/1254,'materials':{'surface':'chitinous shell with short thoracic fur and transparent veined wings'},'remainderPart':'thorax','parts':parts,'habitat':{'realm':'air','source':'Manually observed adult Honeybee with four visible unfolded wings; retained master SHA256 '+sha},'coverage':{'anatomy':'Six visible legs and four visible wing lobes; each near/far wing owner carries a fore/hind pair. Bumblebee, Wasp, Fly and Black Fly remain caveats.'}}
(b/'authoring.json').write_text(json.dumps(a,indent=2)+'\n');(b/'presence.json').write_text(json.dumps({'schema':'cf.anatomy-presence/v2','absent':[],'hidden':[],'folded':[]},indent=2)+'\n')
print(len(lm),len(parts),sha)
