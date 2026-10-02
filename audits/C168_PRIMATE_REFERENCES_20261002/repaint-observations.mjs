// One fresh source-specific manual authoring per authorized repaint. No automatic
// warp of predecessor landmarks or masks; all coordinates refer to these new bytes.
export const repaints={
 gorilla:{name:'Gorilla',ground:946,absent:['tail'],
  points:{root:[645,625],pelvis:[470,610],spine:[609,549],chest:[744,583],neck:[776,468],head:[831,430],jaw:[867,521],armNearShoulder:[661,526],armNearElbow:[656,717],armNearHand:[704,924],armFarShoulder:[829,580],armFarElbow:[879,718],armFarHand:[914,920],legNearHip:[436,620],legNearKnee:[416,779],legNearFoot:[392,908],legFarHip:[552,705],legFarKnee:[556,789],legFarFoot:[570,885]},
  regions:[
   ['armNearHand',[[598,684],[712,685],[737,760],[745,833],[757,914],[749,946],[657,946],[647,906],[629,850],[604,777]]],
   ['armFarHand',[[822,693],[908,687],[943,744],[962,824],[974,899],[960,938],[932,950],[875,942],[859,922],[870,859],[843,790]]],
   ['legNearFoot',[[340,735],[507,747],[500,787],[451,842],[403,885],[402,897],[438,902],[452,921],[424,934],[367,931],[316,907],[295,876],[319,825]]],
   ['legFarFoot',[[499,750],[608,735],[630,797],[612,847],[622,864],[654,877],[653,898],[623,909],[529,905],[496,889]]],
   ['armNearElbow',[[614,460],[674,454],[724,500],[748,557],[735,626],[721,703],[701,756],[629,765],[590,723],[574,659],[585,572]]],
   ['armFarElbow',[[799,536],[853,528],[887,601],[915,664],[932,711],[908,762],[853,773],[817,706],[799,628]]],
   ['legNearKnee',[[414,525],[470,507],[509,535],[531,602],[516,671],[497,730],[463,785],[416,812],[357,784],[358,696],[364,617]]],
   ['legFarKnee',[[519,640],[580,643],[616,685],[628,743],[610,792],[552,818],[501,782],[501,722]]],
   ['jaw',[[803,484],[907,483],[914,521],[894,551],[844,548],[808,524]]],
   ['head',[[730,339],[775,306],[817,316],[849,356],[874,388],[895,416],[901,447],[911,484],[897,510],[849,514],[806,484],[772,458],[749,409]]],
   ['neck',[[697,421],[752,401],[779,451],[810,510],[841,555],[820,605],[777,621],[734,566],[702,500]]],
   ['chest',[[681,529],[736,520],[785,566],[811,621],[800,683],[775,729],[731,754],[695,716],[680,644]]],
   ['pelvis',[[453,545],[505,526],[558,563],[581,620],[568,679],[529,723],[476,705],[456,636]]]
  ],
  notes:['The single new painting separates the previously merged far foot and near hand. The unchanged geometric counter now measures four limb-down appendages and four ground clusters. It is still an observation, not proof of four coplanar supports.','Near knuckles finish around y940, right fingers around y940, left foot around y924 and far foot around y901. The right hand remains partly curled/open despite the requested folded knuckles; no contact plane or finger shape is invented.','Far thigh and shoulder roots remain partly occluded; selected attachment points are explicit rig hypotheses. Gorilla stays tailless under the existing primate presence contract. Head/nape, hand and foot skin need full moving-paint review.']},
 capuchin:{name:'Capuchin',ground:946,absent:[],
  points:{root:[664,635],pelvis:[548,623],spine:[655,579],chest:[825,643],neck:[863,585],head:[923,575],jaw:[952,644],armNearShoulder:[803,666],armNearElbow:[747,763],armNearHand:[811,922],armFarShoulder:[886,691],armFarElbow:[923,793],armFarHand:[1007,922],legNearHip:[550,664],legNearKnee:[620,741],legNearFoot:[626,907],legFarHip:[506,664],legFarKnee:[492,751],legFarFoot:[392,894],tail0:[516,600],tail1:[274,487],tail2:[361,349]},
  regions:[
   ['armNearHand',[[708,757],[777,741],[792,818],[812,877],[838,908],[859,925],[859,944],[825,951],[789,944],[764,918],[743,864],[718,816]]],
   ['armFarHand',[[876,760],[941,753],[963,810],[993,854],[1003,886],[1045,910],[1054,947],[1016,953],[985,942],[965,914],[955,887],[931,854],[899,813]]],
   ['legNearFoot',[[579,724],[656,729],[653,789],[624,862],[626,876],[667,883],[699,899],[709,922],[691,935],[663,932],[647,924],[608,923],[550,905],[541,883],[554,825]]],
   ['legFarFoot',[[434,740],[523,734],[508,783],[458,817],[406,846],[382,862],[379,876],[414,885],[444,890],[453,911],[430,921],[397,917],[359,919],[345,895],[338,870],[330,826],[341,806],[381,785]]],
   ['armNearElbow',[[740,636],[817,611],[855,656],[826,710],[791,752],[781,794],[720,795],[701,769],[716,700]]],
   ['armFarElbow',[[842,652],[891,653],[919,713],[942,764],[923,808],[881,804],[857,749],[847,701]]],
   ['legNearKnee',[[496,597],[550,577],[595,623],[640,684],[662,731],[633,774],[578,755],[551,710],[513,676]]],
   ['legFarKnee',[[473,625],[525,634],[552,672],[546,719],[510,767],[458,796],[410,796],[413,766],[451,724]]],
   ['tail2',[[230,406],[245,362],[276,332],[319,314],[369,304],[427,308],[462,334],[481,366],[491,411],[477,446],[453,468],[420,473],[406,457],[411,437],[430,424],[434,404],[430,390],[416,377],[391,372],[361,377],[335,398],[313,434]]],
   ['tail1',[[231,400],[312,407],[311,474],[336,518],[380,550],[431,561],[478,560],[495,610],[454,644],[390,632],[339,614],[296,587],[262,549],[241,502],[229,451]]],
   ['tail0',[[406,562],[475,565],[530,548],[549,588],[531,626],[459,647],[409,625]]],
   ['jaw',[[920,626],[977,625],[984,650],[975,671],[943,677],[919,659]]],
   ['head',[[843,542],[884,512],[933,502],[971,518],[987,550],[990,589],[981,620],[980,650],[960,671],[922,667],[884,638],[858,605],[840,575]]],
   ['neck',[[809,569],[848,551],[881,582],[910,622],[927,660],[911,697],[863,702],[826,665]]],
   ['chest',[[721,572],[789,567],[846,620],[861,671],[842,714],[797,733],[749,703],[724,647]]],
   ['pelvis',[[473,566],[520,538],[579,560],[597,607],[581,661],[535,689],[487,663],[468,610]]]
  ],
  notes:['Both new hands are opened onto visible finger tips and the far hind leg is exposed. The unchanged observer now measures four limb-down appendages and four ground clusters. Hind feet remain somewhat higher than hand tips; common-plane motion remains a fit constraint, not a measured source guarantee.','The real long tail is connected and now has an open curl, separated from the limbs. Its painted curve uses only the existing tail0/tail1/tail2 chain; no extra tail joint or prehensility claim.','Far shoulder and hip centres remain partly hidden. Their landmark coordinates are source-specific fit hypotheses. The ears stay head-owned because this primate contract has no separate ear slots. No source pixels, anatomy or contact counts are manufactured.']}
};
