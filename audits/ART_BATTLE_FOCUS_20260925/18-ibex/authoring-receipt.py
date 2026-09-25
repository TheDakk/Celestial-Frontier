from pathlib import Path
import json,hashlib,shutil
p=Path('audits/ART_BATTLE_FOCUS_20260925/18-ibex');src=Path('/Users/nick/.codex/generated_images/01a0c73f-5f04-7592-8681-402a4e887ffc/exec-333c6dee-773a-4eee-a69a-72f7844c5743.png');assert not(p/'master.png').exists();shutil.copyfile(src,p/'master.png')
sha=lambda f:hashlib.sha256(Path(f).read_bytes()).hexdigest()
(p/'tool-receipt-02.json').write_text(json.dumps({'tool':'image_gen.imagegen','outputPath':str(src),'masterSha256':sha(src),'promptFile':'correction-prompt-02.txt','promptSha256':sha(p/'correction-prompt-02.txt'),'reference':'generation-01/master.png','referenceSha256':sha(p/'generation-01/master.png'),'decision':'candidate: two visible ears, full horns and all four hooves, generous margin; Nick art review pending'},indent=2)+'\n')
# Coordinates manually read on the 1280-wide displayed preview; map to exact 1254 master, never alter source pixels.
s=1254/1280
L={'root':(614,725),'pelvis':(477,714),'spine':(614,725),'chest':(746,719),'neck':(851,609),'head':(944,568),'jaw':(994,621),'hindNearRoot':(461,750),'hindNearKnee':(465,837),'hindNearAnkle':(422,942),'hindNearPaw':(481,1060),'hindFarRoot':(392,786),'hindFarKnee':(397,852),'hindFarAnkle':(352,939),'hindFarPaw':(338,1051),'foreNearRoot':(732,774),'foreNearKnee':(708,877),'foreNearAnkle':(697,981),'foreNearPaw':(728,1070),'foreFarRoot':(789,795),'foreFarKnee':(793,887),'foreFarAnkle':(814,997),'foreFarPaw':(852,1059),'tail0':(394,692),'tail1':(364,669),'tail2':(343,643),'tail3':(351,606),'earNearRoot':(858,539),'earNearTip':(825,480),'earFarRoot':(980,515),'earFarTip':(993,478)}
P=[]
def part(i,j,pts,layer='near'):P.append({'id':i,'joint':j,'polygonPx':[[round(x*s,3),round(y*s,3)] for x,y in pts],'layer':layer})
def rect(i,j,x,y,X,Y,l='near'):part(i,j,[(x,y),(X,y),(X,Y),(x,Y)],l)
rect('root','root',608,719,620,731)
rect('ear-near-tip','earNearTip',806,451,846,499);part('ear-near-root','earNearRoot',[(808,493),(846,486),(887,535),(875,558),(841,554)])
rect('ear-far-tip','earFarTip',983,458,1008,490,'far');rect('ear-far-root','earFarRoot',965,487,1004,531,'far')
# Hooves first, then proximal owner cuts. Explicit paint boundaries cover visible fur fringes.
part('hind-near-paw','hindNearPaw',[(421,1027),(474,1023),(514,1046),(531,1094),(458,1094),(434,1078)])
part('hind-near-ankle','hindNearAnkle',[(389,923),(445,913),(464,973),(490,1030),(458,1056),(424,1039),(410,993)])
part('hind-near-knee','hindNearKnee',[(414,808),(512,793),(510,853),(461,917),(445,950),(394,960),(381,920)])
part('hind-near-root','hindNearRoot',[(402,660),(481,643),(550,689),(535,786),(512,828),(457,868),(407,844),(388,756)])
part('fore-near-paw','foreNearPaw',[(661,1027),(719,1020),(747,1046),(767,1095),(684,1097),(664,1073)])
part('fore-near-ankle','foreNearAnkle',[(666,948),(721,940),(728,991),(718,1039),(689,1064),(657,1042)])
part('fore-near-knee','foreNearKnee',[(677,813),(748,812),(760,861),(735,918),(723,969),(667,978),(672,919),(658,865)])
part('fore-near-root','foreNearRoot',[(678,690),(757,671),(793,723),(782,792),(753,851),(687,882),(662,828),(653,758)])
part('hind-far-paw','hindFarPaw',[(295,1026),(342,1019),(367,1039),(386,1087),(306,1090),(289,1064)],'far')
part('hind-far-ankle','hindFarAnkle',[(303,934),(357,921),(362,966),(341,1021),(350,1050),(314,1061),(282,1034)],'far')
part('hind-far-knee','hindFarKnee',[(340,841),(410,819),(424,867),(389,915),(358,952),(303,964),(302,903)],'far')
part('hind-far-root','hindFarRoot',[(352,729),(417,721),(438,783),(421,836),(390,881),(338,907),(317,881)],'far')
part('fore-far-paw','foreFarPaw',[(790,1021),(839,1014),(871,1041),(893,1085),(812,1088),(789,1060)],'far')
part('fore-far-ankle','foreFarAnkle',[(781,942),(824,939),(842,984),(841,1028),(811,1046),(787,1035)],'far')
part('fore-far-knee','foreFarKnee',[(760,826),(831,816),(837,875),(823,926),(832,970),(782,988),(768,946),(751,879)],'far')
part('fore-far-root','foreFarRoot',[(752,740),(848,733),(861,791),(839,841),(818,884),(758,865),(741,808)],'far')
# Beard stays with jaw; horns with skull, no invented horn joints.
part('jaw','jaw',[(934,603),(983,599),(1048,601),(1050,641),(1002,655),(1004,757),(967,764),(940,702),(923,634)])
part('head','head',[(507,247),(997,247),(1030,527),(1051,576),(1053,616),(996,646),(939,624),(896,582),(870,535),(865,453),(503,453)])
part('neck','neck',[(807,539),(878,519),(935,552),(947,599),(925,667),(893,733),(843,781),(797,742),(788,663)])
rect('tail3','tail3',319,585,374,626);rect('tail2','tail2',309,620,376,651);rect('tail1','tail1',313,646,388,675);part('tail0','tail0',[(318,673),(380,661),(414,686),(412,728),(358,736)])
rect('chest','chest',678,572,855,865);rect('pelvis','pelvis',356,591,533,858);rect('spine','spine',519,578,694,873)
a={'id':'ibex','family':'quadruped','landmarksPx':{k:[round(x*s,3),round(y*s,3)]for k,(x,y)in L.items()},'groundLineY':1084/1280,'habitat':{'realm':'land','source':'Manually declared Earth Ibex standing on land, sturdy cloven-hoof quadruped; no airborne or swimming source.'},'materials':{'surface':'plain unmarked taupe painted fur, ridged horn keratin, cloven hooves'},'remainderPart':'spine','parts':P,'coverage':{'declarations':'Manually observed generation02: four separately visible legs and hooves; two visible ears; complete short upright tail; both horns carried with skull and beard with jaw, no new joints. No absent, hidden or folded contracted anatomy. Polygons and landmarks authored on this master; no transferred labels.','sourceFacing':'right','visualAcceptance':'Nick pending; one painting only'}}
(p/'authoring.json').write_text(json.dumps(a,indent=2)+'\n');(p/'presence.json').write_text(json.dumps({'schema':'cf.anatomy-presence/v2','absent':[],'hidden':[],'folded':[]},indent=2)+'\n')
for n in ['weld-root-patch.mjs','finish-masks.mjs','battle-script.json']:
 t=(p.parent/'13-river-otter'/n).read_text();t=t.replace('river-otter','ibex').replace('River Otter','Ibex');(p/n).write_text(t)
