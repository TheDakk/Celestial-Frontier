from pathlib import Path
import json
p=Path(__file__).resolve().parent
lm={'root':[679,650],'pelvis':[505,652],'spine':[660,641],'chest':[848,658],'neck':[933,619],'head':[1038,594],'jaw':[1063,632],
'hindNearRoot':[490,674],'hindNearKnee':[475,710],'hindNearAnkle':[435,748],'hindNearPaw':[446,783],
'hindFarRoot':[581,710],'hindFarKnee':[571,735],'hindFarAnkle':[579,752],'hindFarPaw':[606,780],
'foreNearRoot':[865,681],'foreNearKnee':[833,708],'foreNearAnkle':[853,753],'foreNearPaw':[882,780],
'foreFarRoot':[946,692],'foreFarKnee':[958,717],'foreFarAnkle':[979,741],'foreFarPaw':[1002,756],
'tail0':[429,674],'tail1':[316,697],'tail2':[195,656],'tail3':[231,591]}
parts=[]
def part(i,j,poly,layer='near'):parts.append({'id':i,'joint':j,'polygonPx':poly,'layer':layer})
part('root','root',[[673,644],[685,644],[685,656],[673,656]])
part('hind-near-paw','hindNearPaw',[[410,758],[470,754],[509,805],[389,816]])
part('hind-near-ankle','hindNearAnkle',[[419,730],[469,735],[477,759],[412,763]])
part('hind-near-knee','hindNearKnee',[[446,686],[517,696],[471,738],[415,736]])
part('hind-near-root','hindNearRoot',[[451,643],[506,644],[528,676],[517,701],[446,694]])
part('fore-near-paw','foreNearPaw',[[838,760],[894,752],[929,810],[846,815]])
part('fore-near-ankle','foreNearAnkle',[[819,729],[858,727],[896,756],[841,765]])
part('fore-near-knee','foreNearKnee',[[807,687],[850,680],[880,706],[858,736],[820,734]])
part('fore-near-root','foreNearRoot',[[833,649],[877,650],[897,677],[877,708],[847,688],[808,690]])
part('hind-far-paw','hindFarPaw',[[548,751],[592,750],[656,783],[644,807],[526,800]],'far')
part('hind-far-ankle','hindFarAnkle',[[550,737],[598,737],[598,755],[548,758]],'far')
part('hind-far-knee','hindFarKnee',[[552,714],[611,715],[598,740],[550,741]],'far')
part('hind-far-root','hindFarRoot',[[550,692],[594,691],[618,711],[611,720],[552,720]],'far')
part('fore-far-paw','foreFarPaw',[[958,735],[1001,730],[1043,745],[1044,779],[945,777]],'far')
part('fore-far-ankle','foreFarAnkle',[[939,717],[974,713],[1002,735],[957,743]],'far')
part('fore-far-knee','foreFarKnee',[[932,696],[966,691],[979,718],[939,724]],'far')
part('fore-far-root','foreFarRoot',[[922,673],[957,671],[968,696],[933,706]],'far')
part('jaw','jaw',[[1001,620],[1116,608],[1114,656],[1005,666]])
part('head','head',[[972,538],[1128,541],[1128,613],[1002,624],[957,638],[940,591]])
part('neck','neck',[[889,570],[974,538],[941,591],[959,641],[1004,665],[955,685],[886,700],[868,649]])
part('tail3','tail3',[[135,535],[317,535],[316,634],[223,650],[168,655],[135,630]])
part('tail2','tail2',[[134,632],[229,645],[274,652],[273,752],[137,764]])
part('tail1','tail1',[[272,637],[374,612],[388,736],[273,758]])
part('tail0','tail0',[[374,613],[459,590],[464,698],[384,739]])
part('chest','chest',[[796,610],[874,604],[891,657],[844,677],[808,705],[806,735],[757,722]])
part('pelvis','pelvis',[[459,609],[529,591],[571,674],[537,714],[498,713],[445,696]])
part('spine','spine',[[0,0],[1254,0],[1254,1254],[0,1254]])
a={'id':'salamander','family':'quadruped','landmarksPx':lm,'habitat':{'realm':'land'},'groundLineY':806/1254,'materials':{'surface':'smooth moist plain dark charcoal skin'},'remainderPart':'spine','parts':parts,'coverage':{'mustPaint':'smooth scaleless moist skin, blunt head, four short splayed limbs, long rounded tail, plain dark base; four fore toes and five hind toes visibly observed','scope':'Manually observed Salamander master only; Axolotl/Olm caveats remain'}}
# Habitat uses the existing authoring schema, copied field shape only.
a['habitat']='land'
(p/'authoring.json').write_text(json.dumps(a,indent=2)+'\n');(p/'presence.json').write_text(json.dumps({'schema':'cf.anatomy-presence/v2','absent':['external-ears'],'hidden':[],'folded':[]},indent=2)+'\n')
print(len(parts),len(lm))
