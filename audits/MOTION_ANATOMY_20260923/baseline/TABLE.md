# Motion anatomy measurements

Failures and unmeasured anatomy remain explicit. Numeric targets are prospective game-design choices, not re-sealed biological measurements.

| Rig | Action | Criterion | Verdict | Measurement / reason |
|---|---|---|---|---|
| python | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.07225632431306711} |
| python | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| python | idle | travelling-wave | N/A | "not a chain locomotion action" |
| python | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| python | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| python | idle | strike-extension-speed | N/A | "not serpent strike" |
| python | idle | authored-rest-start | PASS | {"zero":true} |
| python | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0} |
| python | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| python | alert | travelling-wave | N/A | "not a chain locomotion action" |
| python | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| python | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| python | alert | strike-extension-speed | N/A | "not serpent strike" |
| python | alert | authored-rest-start | PASS | {"zero":true} |
| python | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | approach:slither | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2565370515251925} |
| python | approach:slither | contact-owner | PASS | {"refusals":0,"first":null} |
| python | approach:slither | travelling-wave | FAIL | {"status":"FAIL","chain":["seg0","seg1","seg2","seg3","seg4","seg5","seg6","seg7","seg8","seg9"],"amplitudesRad":[0.13959802416809913,0.24429654229417347,0.13959802416809913,0.13959802416809913,0.24429654229417347,0.13959802416809913,0.13959802416809913,0.2565408103158625,0.1455571561674075,0.1445118327211966],"links":[{"from":"seg0","to":"seg1","lagCycles":-0.008333333333333333,"correlation":0.9920879032606347,"phaseLagCycles":-0.0234767132227236},{"from":"seg1","to":"seg2","lagCycles":0,"correlation":0.999999999999996,"phaseLagCycles":0},{"from":"seg2","to":"seg3","lagCycles":-0.31666666666666665,"correlation":0.4999254051224303,"phaseLagCycles":-0.5},{"from":"seg3","to":"seg4","lagCycles":0,"correlation":0.9999999999999961,"phaseLagCycles":0},{"from":"seg4","to":"seg5","lagCycles":0,"correlation":0.999999999999996,"phaseLagCycles":0},{"from":"seg5","to":"seg6","lagCycles":-0.31666666666666665,"correlation":0.4999254051224303,"phaseLagCycles":-0.5},{"from":"seg6","to":"seg7","lagCycles":0.07916666666666666,"correlation":0.9810511290642084,"phaseLagCycles":0.08041130880005776},{"from":"seg7","to":"seg8","lagCycles":0.0875,"correlation":0.9842866652413738,"phaseLagCycles":0.07817761712842164},{"from":"seg8","to":"seg9","lagCycles":-0.48333333333333334,"correlation":0.591792841377952,"phaseLagCycles":-0.4232019720143194}],"medianLagCycles":0,"travelIndex":0.03830038854328961,"wavelengthBodyLengths":null,"reason":"standing, reversed or incoherent wave"} |
| python | approach:slither | world-path-following | FAIL | "UNMEASURABLE: action sampler has no stage displacement or preceding head-path history; Claude stage owner must supply both." |
| python | approach:slither | footfall-duty-lift | N/A | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| python | approach:slither | head-stabilization | PASS | {"rmsDegrees":0.6894144923286363,"rmsHeightBodyLengths":0.0017573721458183514} |
| python | approach:slither | strike-extension-speed | N/A | "not serpent strike" |
| python | approach:slither | authored-rest-start | PASS | {"zero":true} |
| python | approach:slither | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | melee:strike | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2613029385896932} |
| python | melee:strike | contact-owner | PASS | {"refusals":0,"first":null} |
| python | melee:strike | travelling-wave | N/A | "not a chain locomotion action" |
| python | melee:strike | footfall-duty-lift | N/A | "not cyclic walking" |
| python | melee:strike | head-stabilization | N/A | "not locomotion or no head joint" |
| python | melee:strike | strike-extension-speed | PASS | {"status":"PASS","extensionBodyLengths":0.4967267367216448,"outboundFraction":0.11666666666666667,"peakSpeedBodyLengthsPerSecond":9.424296211774049,"loadDisplacement":-0.0803458021562792} |
| python | melee:strike | authored-rest-start | PASS | {"zero":true} |
| python | melee:strike | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | melee:constrict | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.7674980665889944} |
| python | melee:constrict | contact-owner | PASS | {"refusals":0,"first":null} |
| python | melee:constrict | travelling-wave | N/A | "not a chain locomotion action" |
| python | melee:constrict | footfall-duty-lift | N/A | "not cyclic walking" |
| python | melee:constrict | head-stabilization | N/A | "not locomotion or no head joint" |
| python | melee:constrict | strike-extension-speed | N/A | "not serpent strike" |
| python | melee:constrict | authored-rest-start | PASS | {"zero":true} |
| python | melee:constrict | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4363109901746448} |
| python | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| python | cast | travelling-wave | N/A | "not a chain locomotion action" |
| python | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| python | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| python | cast | strike-extension-speed | N/A | "not serpent strike" |
| python | cast | authored-rest-start | PASS | {"zero":true} |
| python | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.17452481158204247} |
| python | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| python | hit | travelling-wave | N/A | "not a chain locomotion action" |
| python | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| python | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| python | hit | strike-extension-speed | N/A | "not serpent strike" |
| python | hit | authored-rest-start | PASS | {"zero":true} |
| python | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.20942940995429643} |
| python | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| python | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| python | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| python | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| python | dodge | strike-extension-speed | N/A | "not serpent strike" |
| python | dodge | authored-rest-start | PASS | {"zero":true} |
| python | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5235987755982988} |
| python | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| python | faint | travelling-wave | N/A | "not a chain locomotion action" |
| python | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| python | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| python | faint | strike-extension-speed | N/A | "not serpent strike" |
| python | faint | authored-rest-start | PASS | {"zero":true} |
| python | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.07850559118291744} |
| python | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| python | victory | travelling-wave | N/A | "not a chain locomotion action" |
| python | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| python | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| python | victory | strike-extension-speed | N/A | "not serpent strike" |
| python | victory | authored-rest-start | PASS | {"zero":true} |
| python | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490416097148104} |
| python | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| python | tame | travelling-wave | N/A | "not a chain locomotion action" |
| python | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| python | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| python | tame | strike-extension-speed | N/A | "not serpent strike" |
| python | tame | authored-rest-start | PASS | {"zero":true} |
| python | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| python | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4363323129985824} |
| python | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| python | feed | travelling-wave | N/A | "not a chain locomotion action" |
| python | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| python | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| python | feed | strike-extension-speed | N/A | "not serpent strike" |
| python | feed | authored-rest-start | PASS | {"zero":true} |
| python | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.15358877643708815} |
| salmon | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | idle | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | idle | strike-extension-speed | N/A | "not serpent strike" |
| salmon | idle | authored-rest-start | FAIL | {"zero":false} |
| salmon | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.42236996083634626} |
| salmon | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | alert | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | alert | strike-extension-speed | N/A | "not serpent strike" |
| salmon | alert | authored-rest-start | PASS | {"zero":true} |
| salmon | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | approach:swim | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.38394505101608606} |
| salmon | approach:swim | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | approach:swim | travelling-wave | FAIL | {"status":"FAIL","chain":["spine0","spine1","spine2","spine3","spine4","spine5","caudal"],"amplitudesRad":[0.10470958354537863,0.17451597257563103,0.06980638903025241,0.10470958354537863,0.20941916709075725,0.27922555612100963,0.3839512838410863],"links":[{"from":"spine0","to":"spine1","lagCycles":0,"correlation":1,"phaseLagCycles":0},{"from":"spine1","to":"spine2","lagCycles":0,"correlation":0.9999999999999978,"phaseLagCycles":0},{"from":"spine2","to":"spine3","lagCycles":-0.5,"correlation":0.7864198510495958,"phaseLagCycles":0.4999999999999998},{"from":"spine3","to":"spine4","lagCycles":0,"correlation":0.9999999999999999,"phaseLagCycles":0},{"from":"spine4","to":"spine5","lagCycles":0,"correlation":1.0000000000000022,"phaseLagCycles":0},{"from":"spine5","to":"caudal","lagCycles":0.10416666666666667,"correlation":0.982419127706347,"phaseLagCycles":0.09764453132831319}],"medianLagCycles":0,"travelIndex":0.09595799843472284,"wavelengthBodyLengths":null,"reason":"standing, reversed or incoherent wave"} |
| salmon | approach:swim | world-path-following | FAIL | "UNMEASURABLE: action sampler has no stage displacement or preceding head-path history; Claude stage owner must supply both." |
| salmon | approach:swim | footfall-duty-lift | N/A | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| salmon | approach:swim | head-stabilization | PASS | {"rmsDegrees":0,"rmsHeightBodyLengths":0.0051178891898217525} |
| salmon | approach:swim | strike-extension-speed | N/A | "not serpent strike" |
| salmon | approach:swim | authored-rest-start | PASS | {"zero":true} |
| salmon | approach:swim | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | melee:bite | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3836993883735516} |
| salmon | melee:bite | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | melee:bite | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | melee:bite | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | melee:bite | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | melee:bite | strike-extension-speed | N/A | "not serpent strike" |
| salmon | melee:bite | authored-rest-start | PASS | {"zero":true} |
| salmon | melee:bite | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.7294454022490454} |
| salmon | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | cast | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | cast | strike-extension-speed | N/A | "not serpent strike" |
| salmon | cast | authored-rest-start | PASS | {"zero":true} |
| salmon | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2879680773866199} |
| salmon | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | hit | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | hit | strike-extension-speed | N/A | "not serpent strike" |
| salmon | hit | authored-rest-start | PASS | {"zero":true} |
| salmon | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.47996139234736546} |
| salmon | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | dodge | strike-extension-speed | N/A | "not serpent strike" |
| salmon | dodge | authored-rest-start | PASS | {"zero":true} |
| salmon | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4886921905584123} |
| salmon | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | faint | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | faint | strike-extension-speed | N/A | "not serpent strike" |
| salmon | faint | authored-rest-start | PASS | {"zero":true} |
| salmon | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.8805183282017597} |
| salmon | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | victory | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | victory | strike-extension-speed | N/A | "not serpent strike" |
| salmon | victory | authored-rest-start | PASS | {"zero":true} |
| salmon | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2617928428144544} |
| salmon | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | tame | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | tame | strike-extension-speed | N/A | "not serpent strike" |
| salmon | tame | authored-rest-start | PASS | {"zero":true} |
| salmon | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3141592653589793} |
| salmon | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | feed | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | feed | strike-extension-speed | N/A | "not serpent strike" |
| salmon | feed | authored-rest-start | PASS | {"zero":true} |
| salmon | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | melee:body | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3453011105604901} |
| salmon | melee:body | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | melee:body | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | melee:body | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | melee:body | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | melee:body | strike-extension-speed | N/A | "not serpent strike" |
| salmon | melee:body | authored-rest-start | PASS | {"zero":true} |
| salmon | melee:body | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| salmon | melee:tail | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6524254837676383} |
| salmon | melee:tail | contact-owner | PASS | {"refusals":0,"first":null} |
| salmon | melee:tail | travelling-wave | N/A | "not a chain locomotion action" |
| salmon | melee:tail | footfall-duty-lift | N/A | "not cyclic walking" |
| salmon | melee:tail | head-stabilization | N/A | "not locomotion or no head joint" |
| salmon | melee:tail | strike-extension-speed | N/A | "not serpent strike" |
| salmon | melee:tail | authored-rest-start | PASS | {"zero":true} |
| salmon | melee:tail | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.06544354149507424} |
| eagle | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | idle | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | idle | strike-extension-speed | N/A | "not serpent strike" |
| eagle | idle | authored-rest-start | FAIL | {"zero":false} |
| eagle | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.14398898318300474} |
| eagle | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | alert | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | alert | strike-extension-speed | N/A | "not serpent strike" |
| eagle | alert | authored-rest-start | PASS | {"zero":true} |
| eagle | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | approach:walk | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.41187903670853065} |
| eagle | approach:walk | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | approach:walk | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | approach:walk | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"legFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.1726752556608686,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"legNear","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14596053714703494,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| eagle | approach:walk | head-stabilization | PASS | {"rmsDegrees":0.9911739138395721,"rmsHeightBodyLengths":0.00511406290943843} |
| eagle | approach:walk | strike-extension-speed | N/A | "not serpent strike" |
| eagle | approach:walk | authored-rest-start | PASS | {"zero":true} |
| eagle | approach:walk | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | approach:flight | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.4177763954283205} |
| eagle | approach:flight | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | approach:flight | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | approach:flight | footfall-duty-lift | N/A | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| eagle | approach:flight | head-stabilization | FAIL | {"rmsDegrees":3.4198521311926022,"rmsHeightBodyLengths":0.04967849722227058} |
| eagle | approach:flight | strike-extension-speed | N/A | "not serpent strike" |
| eagle | approach:flight | authored-rest-start | PASS | {"zero":true} |
| eagle | approach:flight | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | melee:peck | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6540039595431417} |
| eagle | melee:peck | contact-owner | FAIL | {"refusals":16,"first":{"ms":206.68888888888887,"error":"Error: Contact: melee:peck@206.68888888888887 exceeds scale compression bound"}} |
| eagle | melee:peck | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | melee:peck | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | melee:peck | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | melee:peck | strike-extension-speed | N/A | "not serpent strike" |
| eagle | melee:peck | authored-rest-start | PASS | {"zero":true} |
| eagle | melee:peck | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | melee:claw | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.4277385296995893} |
| eagle | melee:claw | contact-owner | FAIL | {"refusals":21,"first":{"ms":195.04444444444442,"error":"Error: Contact: melee:claw@195.04444444444442 exceeds scale compression bound"}} |
| eagle | melee:claw | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | melee:claw | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | melee:claw | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | melee:claw | strike-extension-speed | N/A | "not serpent strike" |
| eagle | melee:claw | authored-rest-start | PASS | {"zero":true} |
| eagle | melee:claw | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.6580627893946132} |
| eagle | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | cast | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | cast | strike-extension-speed | N/A | "not serpent strike" |
| eagle | cast | authored-rest-start | PASS | {"zero":true} |
| eagle | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5453743317547822} |
| eagle | hit | contact-owner | FAIL | {"refusals":37,"first":{"ms":179.225,"error":"Error: Contact: hit@179.225 exceeds scale compression bound"}} |
| eagle | hit | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | hit | strike-extension-speed | N/A | "not serpent strike" |
| eagle | hit | authored-rest-start | PASS | {"zero":true} |
| eagle | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.8726358663707731} |
| eagle | dodge | contact-owner | FAIL | {"refusals":64,"first":{"ms":23.6,"error":"Error: Contact: dodge@23.6 exceeds scale compression bound"}} |
| eagle | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | dodge | strike-extension-speed | N/A | "not serpent strike" |
| eagle | dodge | authored-rest-start | PASS | {"zero":true} |
| eagle | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6976844673487083} |
| eagle | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | faint | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | faint | strike-extension-speed | N/A | "not serpent strike" |
| eagle | faint | authored-rest-start | PASS | {"zero":true} |
| eagle | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.6580627893946132} |
| eagle | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | victory | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | victory | strike-extension-speed | N/A | "not serpent strike" |
| eagle | victory | authored-rest-start | PASS | {"zero":true} |
| eagle | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.34901558491640844} |
| eagle | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | tame | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | tame | strike-extension-speed | N/A | "not serpent strike" |
| eagle | tame | authored-rest-start | PASS | {"zero":true} |
| eagle | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5235987755982988} |
| eagle | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | feed | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | feed | strike-extension-speed | N/A | "not serpent strike" |
| eagle | feed | authored-rest-start | PASS | {"zero":true} |
| eagle | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| eagle | melee:kick | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.130174692626613} |
| eagle | melee:kick | contact-owner | PASS | {"refusals":0,"first":null} |
| eagle | melee:kick | travelling-wave | N/A | "not a chain locomotion action" |
| eagle | melee:kick | footfall-duty-lift | N/A | "not cyclic walking" |
| eagle | melee:kick | head-stabilization | N/A | "not locomotion or no head joint" |
| eagle | melee:kick | strike-extension-speed | N/A | "not serpent strike" |
| eagle | melee:kick | authored-rest-start | PASS | {"zero":true} |
| eagle | melee:kick | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.06981317007977318} |
| beetle | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | idle | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | idle | strike-extension-speed | N/A | "not serpent strike" |
| beetle | idle | authored-rest-start | PASS | {"zero":true} |
| beetle | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0} |
| beetle | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | alert | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | alert | strike-extension-speed | N/A | "not serpent strike" |
| beetle | alert | authored-rest-start | PASS | {"zero":true} |
| beetle | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | approach:crawl | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.43633231299858244} |
| beetle | approach:crawl | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | approach:crawl | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | approach:crawl | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"legFrontFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.1429075994025546,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"legFrontNear","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14953752272070603,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"legMidFar","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15869003230934225,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"legMidNear","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.151126936934969,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"legHindFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.11597992288361234,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"legHindNear","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14633588678785536,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| beetle | approach:crawl | head-stabilization | PASS | {"rmsDegrees":0.43211340143675797,"rmsHeightBodyLengths":0.002415139438787683} |
| beetle | approach:crawl | strike-extension-speed | N/A | "not serpent strike" |
| beetle | approach:crawl | authored-rest-start | PASS | {"zero":true} |
| beetle | approach:crawl | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | approach:flight | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.2217304763960306} |
| beetle | approach:flight | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | approach:flight | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | approach:flight | footfall-duty-lift | N/A | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| beetle | approach:flight | head-stabilization | PASS | {"rmsDegrees":0,"rmsHeightBodyLengths":0.03368696674454682} |
| beetle | approach:flight | strike-extension-speed | N/A | "not serpent strike" |
| beetle | approach:flight | authored-rest-start | PASS | {"zero":true} |
| beetle | approach:flight | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | melee:mandible | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5188320038484792} |
| beetle | melee:mandible | contact-owner | FAIL | {"refusals":98,"first":{"ms":160.44444444444443,"error":"Error: Contact: melee:mandible@160.44444444444443 exceeds scale compression bound"}} |
| beetle | melee:mandible | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | melee:mandible | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | melee:mandible | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | melee:mandible | strike-extension-speed | N/A | "not serpent strike" |
| beetle | melee:mandible | authored-rest-start | PASS | {"zero":true} |
| beetle | melee:mandible | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.1344639099569622} |
| beetle | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | cast | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | cast | strike-extension-speed | N/A | "not serpent strike" |
| beetle | cast | authored-rest-start | PASS | {"zero":true} |
| beetle | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4363323129985824} |
| beetle | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | hit | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | hit | strike-extension-speed | N/A | "not serpent strike" |
| beetle | hit | authored-rest-start | PASS | {"zero":true} |
| beetle | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5235624145722156} |
| beetle | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | dodge | strike-extension-speed | N/A | "not serpent strike" |
| beetle | dodge | authored-rest-start | PASS | {"zero":true} |
| beetle | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.9599160633794914} |
| beetle | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | faint | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | faint | strike-extension-speed | N/A | "not serpent strike" |
| beetle | faint | authored-rest-start | PASS | {"zero":true} |
| beetle | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.404988861071945} |
| beetle | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | victory | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | victory | strike-extension-speed | N/A | "not serpent strike" |
| beetle | victory | authored-rest-start | PASS | {"zero":true} |
| beetle | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.349061971889417} |
| beetle | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | tame | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | tame | strike-extension-speed | N/A | "not serpent strike" |
| beetle | tame | authored-rest-start | PASS | {"zero":true} |
| beetle | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4363323129985824} |
| beetle | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| beetle | feed | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | feed | strike-extension-speed | N/A | "not serpent strike" |
| beetle | feed | authored-rest-start | PASS | {"zero":true} |
| beetle | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| beetle | melee:body | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2086451915041897} |
| beetle | melee:body | contact-owner | FAIL | {"refusals":54,"first":{"ms":166.77777777777777,"error":"Error: Contact: melee:body@166.77777777777777 exceeds scale compression bound"}} |
| beetle | melee:body | travelling-wave | N/A | "not a chain locomotion action" |
| beetle | melee:body | footfall-duty-lift | N/A | "not cyclic walking" |
| beetle | melee:body | head-stabilization | N/A | "not locomotion or no head joint" |
| beetle | melee:body | strike-extension-speed | N/A | "not serpent strike" |
| beetle | melee:body | authored-rest-start | PASS | {"zero":true} |
| beetle | melee:body | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.017453292519943295} |
| tree-frog | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | idle | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | idle | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | idle | authored-rest-start | PASS | {"zero":true} |
| tree-frog | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13896549669926028} |
| tree-frog | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | alert | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | alert | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | alert | authored-rest-start | PASS | {"zero":true} |
| tree-frog | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | approach:hop | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.947489802044721} |
| tree-frog | approach:hop | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | approach:hop | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | approach:hop | footfall-duty-lift | N/A | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| tree-frog | approach:hop | head-stabilization | FAIL | {"rmsDegrees":13.62729045658076,"rmsHeightBodyLengths":0.28111388141583504} |
| tree-frog | approach:hop | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | approach:hop | authored-rest-start | PASS | {"zero":true} |
| tree-frog | approach:hop | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | melee:kick | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.2621499955632765} |
| tree-frog | melee:kick | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | melee:kick | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | melee:kick | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | melee:kick | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | melee:kick | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | melee:kick | authored-rest-start | PASS | {"zero":true} |
| tree-frog | melee:kick | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | melee:bite | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.8676745088436699} |
| tree-frog | melee:bite | contact-owner | FAIL | {"refusals":38,"first":{"ms":183.66666666666666,"error":"Error: Contact pad: melee:bite@183.66666666666666 hindFar outside accommodatable reach"}} |
| tree-frog | melee:bite | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | melee:bite | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | melee:bite | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | melee:bite | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | melee:bite | authored-rest-start | PASS | {"zero":true} |
| tree-frog | melee:bite | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6108652381980153} |
| tree-frog | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | cast | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | cast | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | cast | authored-rest-start | PASS | {"zero":true} |
| tree-frog | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2842469406134164} |
| tree-frog | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | hit | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | hit | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | hit | authored-rest-start | PASS | {"zero":true} |
| tree-frog | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6316160027612008} |
| tree-frog | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | dodge | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | dodge | authored-rest-start | PASS | {"zero":true} |
| tree-frog | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.8726345755623852} |
| tree-frog | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | faint | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | faint | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | faint | authored-rest-start | PASS | {"zero":true} |
| tree-frog | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490658503988659} |
| tree-frog | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | victory | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | victory | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | victory | authored-rest-start | PASS | {"zero":true} |
| tree-frog | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490503363610704} |
| tree-frog | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | tame | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | tame | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | tame | authored-rest-start | PASS | {"zero":true} |
| tree-frog | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tree-frog | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4363323129985824} |
| tree-frog | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| tree-frog | feed | travelling-wave | N/A | "not a chain locomotion action" |
| tree-frog | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| tree-frog | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| tree-frog | feed | strike-extension-speed | N/A | "not serpent strike" |
| tree-frog | feed | authored-rest-start | PASS | {"zero":true} |
| tree-frog | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.03490658503988659} |
| chimpanzee | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | idle | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | idle | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | idle | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0} |
| chimpanzee | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | alert | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | alert | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | alert | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | approach:walk | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4363323129985824} |
| chimpanzee | approach:walk | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | approach:walk | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | approach:walk | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"legFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.14721589009209798,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"legNear","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14721530772579483,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| chimpanzee | approach:walk | head-stabilization | PASS | {"rmsDegrees":1.8333018983850986,"rmsHeightBodyLengths":0.023470899336149712} |
| chimpanzee | approach:walk | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | approach:walk | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | approach:walk | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | approach:climb | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.7853981633974483} |
| chimpanzee | approach:climb | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | approach:climb | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | approach:climb | footfall-duty-lift | N/A | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| chimpanzee | approach:climb | head-stabilization | FAIL | {"rmsDegrees":4.406709332021966,"rmsHeightBodyLengths":0.0619296481455127} |
| chimpanzee | approach:climb | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | approach:climb | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | approach:climb | anatomical-verb | FAIL | "Source anatomy/support cannot realize the advertised verb." |
| chimpanzee | melee:punch | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6050613258441612} |
| chimpanzee | melee:punch | contact-owner | FAIL | {"refusals":38,"first":{"ms":187.88888888888886,"error":"Error: Contact: melee:punch@187.88888888888886 exceeds scale compression bound"}} |
| chimpanzee | melee:punch | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | melee:punch | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | melee:punch | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | melee:punch | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | melee:punch | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | melee:punch | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | melee:bite | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4521969680482659} |
| chimpanzee | melee:bite | contact-owner | FAIL | {"refusals":33,"first":{"ms":190,"error":"Error: Contact: melee:bite@190 exceeds scale compression bound"}} |
| chimpanzee | melee:bite | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | melee:bite | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | melee:bite | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | melee:bite | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | melee:bite | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | melee:bite | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2617312108752433} |
| chimpanzee | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | cast | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | cast | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | cast | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490207747466966} |
| chimpanzee | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | hit | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | hit | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | hit | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.43630201214351305} |
| chimpanzee | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | dodge | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | dodge | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6981216839861386} |
| chimpanzee | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | faint | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | faint | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | faint | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.17450918952962846} |
| chimpanzee | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | victory | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | victory | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | victory | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490503363610704} |
| chimpanzee | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | tame | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | tame | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | tame | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| chimpanzee | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4188790204786391} |
| chimpanzee | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| chimpanzee | feed | travelling-wave | N/A | "not a chain locomotion action" |
| chimpanzee | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| chimpanzee | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| chimpanzee | feed | strike-extension-speed | N/A | "not serpent strike" |
| chimpanzee | feed | authored-rest-start | PASS | {"zero":true} |
| chimpanzee | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.09642381610819332} |
| starfish | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | idle | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | idle | strike-extension-speed | N/A | "not serpent strike" |
| starfish | idle | authored-rest-start | FAIL | {"zero":false} |
| starfish | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5303606802933551} |
| starfish | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | alert | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | alert | strike-extension-speed | N/A | "not serpent strike" |
| starfish | alert | authored-rest-start | PASS | {"zero":true} |
| starfish | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | approach:drift | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.23140788154351424} |
| starfish | approach:drift | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | approach:drift | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | approach:drift | footfall-duty-lift | FAIL | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| starfish | approach:drift | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | approach:drift | strike-extension-speed | N/A | "not serpent strike" |
| starfish | approach:drift | authored-rest-start | PASS | {"zero":true} |
| starfish | approach:drift | anatomical-verb | FAIL | "Source anatomy/support cannot realize the advertised verb." |
| starfish | approach:pulse | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.7714256055524095} |
| starfish | approach:pulse | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | approach:pulse | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | approach:pulse | footfall-duty-lift | FAIL | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| starfish | approach:pulse | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | approach:pulse | strike-extension-speed | N/A | "not serpent strike" |
| starfish | approach:pulse | authored-rest-start | PASS | {"zero":true} |
| starfish | approach:pulse | anatomical-verb | FAIL | "Source anatomy/support cannot realize the advertised verb." |
| starfish | melee:sting-arms | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.9599310885968813} |
| starfish | melee:sting-arms | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | melee:sting-arms | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | melee:sting-arms | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | melee:sting-arms | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | melee:sting-arms | strike-extension-speed | N/A | "not serpent strike" |
| starfish | melee:sting-arms | authored-rest-start | PASS | {"zero":true} |
| starfish | melee:sting-arms | anatomical-verb | FAIL | "Source anatomy/support cannot realize the advertised verb." |
| starfish | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.923004669228682} |
| starfish | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | cast | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | cast | strike-extension-speed | N/A | "not serpent strike" |
| starfish | cast | authored-rest-start | PASS | {"zero":true} |
| starfish | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5785704381725774} |
| starfish | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | hit | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | hit | strike-extension-speed | N/A | "not serpent strike" |
| starfish | hit | authored-rest-start | PASS | {"zero":true} |
| starfish | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.771430550126119} |
| starfish | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | dodge | strike-extension-speed | N/A | "not serpent strike" |
| starfish | dodge | authored-rest-start | PASS | {"zero":true} |
| starfish | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.8678637300257828} |
| starfish | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | faint | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | faint | strike-extension-speed | N/A | "not serpent strike" |
| starfish | faint | authored-rest-start | PASS | {"zero":true} |
| starfish | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.9599310885968813} |
| starfish | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | victory | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | victory | strike-extension-speed | N/A | "not serpent strike" |
| starfish | victory | authored-rest-start | PASS | {"zero":true} |
| starfish | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4821134440508769} |
| starfish | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | tame | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | tame | strike-extension-speed | N/A | "not serpent strike" |
| starfish | tame | authored-rest-start | PASS | {"zero":true} |
| starfish | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.9599310885968813} |
| starfish | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | feed | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | feed | strike-extension-speed | N/A | "not serpent strike" |
| starfish | feed | authored-rest-start | PASS | {"zero":true} |
| starfish | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| starfish | melee:body | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.33931497977486524} |
| starfish | melee:body | contact-owner | PASS | {"refusals":0,"first":null} |
| starfish | melee:body | travelling-wave | N/A | "not a chain locomotion action" |
| starfish | melee:body | footfall-duty-lift | N/A | "not cyclic walking" |
| starfish | melee:body | head-stabilization | N/A | "not locomotion or no head joint" |
| starfish | melee:body | strike-extension-speed | N/A | "not serpent strike" |
| starfish | melee:body | authored-rest-start | PASS | {"zero":true} |
| starfish | melee:body | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05235987755982989} |
| tarantula | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | idle | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | idle | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | idle | authored-rest-start | PASS | {"zero":true} |
| tarantula | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.1919866677327778} |
| tarantula | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | alert | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | alert | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | alert | authored-rest-start | PASS | {"zero":true} |
| tarantula | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | approach:scuttle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.22297862835709492} |
| tarantula | approach:scuttle | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | approach:scuttle | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | approach:scuttle | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"leg1Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.14973926312854297,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.1616084876265159,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15515894990026396,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.14728699251997296,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15427381939257492,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.16706424735213646,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg4Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15009682585185036,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg4Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.14139050812753418,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| tarantula | approach:scuttle | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | approach:scuttle | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | approach:scuttle | authored-rest-start | PASS | {"zero":true} |
| tarantula | approach:scuttle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | melee:sting | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.0807140784500069} |
| tarantula | melee:sting | contact-owner | FAIL | {"refusals":58,"first":{"ms":171,"error":"Error: Contact: melee:sting@171 exceeds scale compression bound"}} |
| tarantula | melee:sting | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | melee:sting | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | melee:sting | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | melee:sting | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | melee:sting | authored-rest-start | PASS | {"zero":true} |
| tarantula | melee:sting | anatomical-verb | FAIL | "Source anatomy/support cannot realize the advertised verb." |
| tarantula | melee:bite | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6914582203479843} |
| tarantula | melee:bite | contact-owner | FAIL | {"refusals":73,"first":{"ms":162.55555555555554,"error":"Error: Contact: melee:bite@162.55555555555554 exceeds scale compression bound"}} |
| tarantula | melee:bite | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | melee:bite | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | melee:bite | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | melee:bite | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | melee:bite | authored-rest-start | PASS | {"zero":true} |
| tarantula | melee:bite | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5234760571352681} |
| tarantula | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | cast | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | cast | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | cast | authored-rest-start | PASS | {"zero":true} |
| tarantula | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490207747466966} |
| tarantula | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | hit | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | hit | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | hit | authored-rest-start | PASS | {"zero":true} |
| tarantula | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.25119942787187505} |
| tarantula | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | dodge | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | dodge | authored-rest-start | PASS | {"zero":true} |
| tarantula | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.502424135066419} |
| tarantula | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | faint | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | faint | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | faint | authored-rest-start | PASS | {"zero":true} |
| tarantula | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6283042893160758} |
| tarantula | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | victory | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | victory | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | victory | authored-rest-start | PASS | {"zero":true} |
| tarantula | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.20943020181664226} |
| tarantula | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | tame | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | tame | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | tame | authored-rest-start | PASS | {"zero":true} |
| tarantula | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490641889712099} |
| tarantula | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| tarantula | feed | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | feed | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | feed | authored-rest-start | PASS | {"zero":true} |
| tarantula | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| tarantula | melee:body | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.17413576583186802} |
| tarantula | melee:body | contact-owner | FAIL | {"refusals":49,"first":{"ms":171,"error":"Error: Contact: melee:body@171 exceeds scale compression bound"}} |
| tarantula | melee:body | travelling-wave | N/A | "not a chain locomotion action" |
| tarantula | melee:body | footfall-duty-lift | N/A | "not cyclic walking" |
| tarantula | melee:body | head-stabilization | N/A | "not locomotion or no head joint" |
| tarantula | melee:body | strike-extension-speed | N/A | "not serpent strike" |
| tarantula | melee:body | authored-rest-start | PASS | {"zero":true} |
| tarantula | melee:body | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.09946454559495375} |
| octopus | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | idle | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | idle | strike-extension-speed | N/A | "not serpent strike" |
| octopus | idle | authored-rest-start | FAIL | {"zero":false} |
| octopus | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5471601369952166} |
| octopus | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | alert | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | alert | strike-extension-speed | N/A | "not serpent strike" |
| octopus | alert | authored-rest-start | PASS | {"zero":true} |
| octopus | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | approach:jet | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.7958533926485797} |
| octopus | approach:jet | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | approach:jet | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | approach:jet | footfall-duty-lift | FAIL | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| octopus | approach:jet | head-stabilization | PASS | {"rmsDegrees":0,"rmsHeightBodyLengths":0.03626943729400965} |
| octopus | approach:jet | strike-extension-speed | N/A | "not serpent strike" |
| octopus | approach:jet | authored-rest-start | PASS | {"zero":true} |
| octopus | approach:jet | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | approach:crawl | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5969026041820606} |
| octopus | approach:crawl | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | approach:crawl | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | approach:crawl | footfall-duty-lift | FAIL | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| octopus | approach:crawl | head-stabilization | PASS | {"rmsDegrees":0,"rmsHeightBodyLengths":0.0015787638911436976} |
| octopus | approach:crawl | strike-extension-speed | N/A | "not serpent strike" |
| octopus | approach:crawl | authored-rest-start | PASS | {"zero":true} |
| octopus | approach:crawl | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | melee:lash | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.392393670665916} |
| octopus | melee:lash | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | melee:lash | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | melee:lash | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | melee:lash | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | melee:lash | strike-extension-speed | N/A | "not serpent strike" |
| octopus | melee:lash | authored-rest-start | PASS | {"zero":true} |
| octopus | melee:lash | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | melee:bite | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.7958170809001535} |
| octopus | melee:bite | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | melee:bite | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | melee:bite | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | melee:bite | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | melee:bite | strike-extension-speed | N/A | "not serpent strike" |
| octopus | melee:bite | authored-rest-start | PASS | {"zero":true} |
| octopus | melee:bite | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.9550203839049204} |
| octopus | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | cast | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | cast | strike-extension-speed | N/A | "not serpent strike" |
| octopus | cast | authored-rest-start | PASS | {"zero":true} |
| octopus | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.49741026898561824} |
| octopus | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | hit | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | hit | strike-extension-speed | N/A | "not serpent strike" |
| octopus | hit | authored-rest-start | PASS | {"zero":true} |
| octopus | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.7958544180177813} |
| octopus | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | dodge | strike-extension-speed | N/A | "not serpent strike" |
| octopus | dodge | authored-rest-start | PASS | {"zero":true} |
| octopus | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.8953306478890984} |
| octopus | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | faint | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | faint | strike-extension-speed | N/A | "not serpent strike" |
| octopus | faint | authored-rest-start | PASS | {"zero":true} |
| octopus | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.1677932383697218} |
| octopus | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | victory | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | victory | strike-extension-speed | N/A | "not serpent strike" |
| octopus | victory | authored-rest-start | PASS | {"zero":true} |
| octopus | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4775129696859154} |
| octopus | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | tame | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | tame | strike-extension-speed | N/A | "not serpent strike" |
| octopus | tame | authored-rest-start | PASS | {"zero":true} |
| octopus | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| octopus | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.0942725306999583} |
| octopus | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| octopus | feed | travelling-wave | N/A | "not a chain locomotion action" |
| octopus | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| octopus | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| octopus | feed | strike-extension-speed | N/A | "not serpent strike" |
| octopus | feed | authored-rest-start | PASS | {"zero":true} |
| octopus | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.03665177588376161} |
| fruit-bat | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| fruit-bat | idle | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | idle | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | idle | authored-rest-start | FAIL | {"zero":false} |
| fruit-bat | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.40317246886525815} |
| fruit-bat | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| fruit-bat | alert | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | alert | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | alert | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | approach:flight | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.282542650174062} |
| fruit-bat | approach:flight | contact-owner | PASS | {"refusals":0,"first":null} |
| fruit-bat | approach:flight | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | approach:flight | footfall-duty-lift | N/A | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| fruit-bat | approach:flight | head-stabilization | FAIL | {"rmsDegrees":3.1702150294443823,"rmsHeightBodyLengths":0.055916237134087596} |
| fruit-bat | approach:flight | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | approach:flight | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | approach:flight | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | approach:crawl | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6367593462159328} |
| fruit-bat | approach:crawl | contact-owner | PASS | {"refusals":0,"first":null} |
| fruit-bat | approach:crawl | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | approach:crawl | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"legFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.11554448475772144,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"legNear","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.10325595788004786,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| fruit-bat | approach:crawl | head-stabilization | PASS | {"rmsDegrees":1.9267440301197971,"rmsHeightBodyLengths":0.03339349590383942} |
| fruit-bat | approach:crawl | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | approach:crawl | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | approach:crawl | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | melee:bite | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.9161512496398556} |
| fruit-bat | melee:bite | contact-owner | FAIL | {"refusals":36,"first":{"ms":168.4222222222222,"error":"Error: Contact: melee:bite@168.4222222222222 exceeds scale compression bound"}} |
| fruit-bat | melee:bite | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | melee:bite | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | melee:bite | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | melee:bite | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | melee:bite | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | melee:bite | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | melee:claw | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.0994108210992601} |
| fruit-bat | melee:claw | contact-owner | FAIL | {"refusals":39,"first":{"ms":165.24444444444444,"error":"Error: Contact: melee:claw@165.24444444444444 exceeds scale compression bound"}} |
| fruit-bat | melee:claw | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | melee:claw | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | melee:claw | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | melee:claw | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | melee:claw | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | melee:claw | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.64930653833879} |
| fruit-bat | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| fruit-bat | cast | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | cast | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | cast | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.45814887023890494} |
| fruit-bat | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| fruit-bat | hit | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | hit | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | hit | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.7329794582425441} |
| fruit-bat | dodge | contact-owner | FAIL | {"refusals":15,"first":{"ms":89.33333333333333,"error":"Error: Contact: joint limit legFarFoot dodge@89.33333333333333: -60.69624299174178"}} |
| fruit-bat | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | dodge | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | dodge | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6717639277998994} |
| fruit-bat | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| fruit-bat | faint | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | faint | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | faint | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.6658945846784994} |
| fruit-bat | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| fruit-bat | victory | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | victory | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | victory | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490602653452595} |
| fruit-bat | tame | contact-owner | FAIL | {"refusals":19,"first":{"ms":212.8,"error":"Error: Contact: tame@212.8 exceeds scale compression bound"}} |
| fruit-bat | tame | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | tame | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | tame | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5235987755982988} |
| fruit-bat | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| fruit-bat | feed | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | feed | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | feed | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05235987755982989} |
| centipede | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | idle | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | idle | strike-extension-speed | N/A | "not serpent strike" |
| centipede | idle | authored-rest-start | PASS | {"zero":true} |
| centipede | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.0959933338663889} |
| centipede | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | alert | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | alert | strike-extension-speed | N/A | "not serpent strike" |
| centipede | alert | authored-rest-start | PASS | {"zero":true} |
| centipede | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | approach:crawl | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3839724354387525} |
| centipede | approach:crawl | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | approach:crawl | travelling-wave | FAIL | "Error: Motion anatomy instrument: unidentified chain" |
| centipede | approach:crawl | world-path-following | FAIL | "UNMEASURABLE: action sampler has no stage displacement or preceding head-path history; Claude stage owner must supply both." |
| centipede | approach:crawl | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"leg0Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.46608838157914767,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":false},{"id":"leg0Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.30938595285212267,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":false},{"id":"leg1Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.3902764342568352,"phase":0.5,"expectedPhase":0.19999999999999996,"phaseError":0.30000000000000004,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg1Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.26885807036754006,"phase":0,"expectedPhase":0.7,"phaseError":0.30000000000000004,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg2Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.3864006919595237,"phase":0,"expectedPhase":0.3999999999999999,"phaseError":0.3999999999999999,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg2Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.26551781739000724,"phase":0.5,"expectedPhase":0.8999999999999999,"phaseError":0.3999999999999999,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg3Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.35541490801364306,"phase":0.5,"expectedPhase":0.6000000000000001,"phaseError":0.10000000000000009,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg3Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.3512341871243101,"phase":0,"expectedPhase":0.10000000000000009,"phaseError":0.10000000000000009,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg4Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.38675696853810254,"phase":0,"expectedPhase":0.8,"phaseError":0.19999999999999996,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg4Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.3526482566793644,"phase":0.5,"expectedPhase":0.30000000000000004,"phaseError":0.19999999999999996,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg5Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.36803751418138164,"phase":0.5,"expectedPhase":0,"phaseError":0.5,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg5Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.36294983910178547,"phase":0,"expectedPhase":0.5,"phaseError":0.5,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg6Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.35618724032930327,"phase":0,"expectedPhase":0.20000000000000018,"phaseError":0.20000000000000018,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg6Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.2688296088422897,"phase":0.5,"expectedPhase":0.7000000000000002,"phaseError":0.20000000000000018,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg7Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.3593059605325133,"phase":0.5,"expectedPhase":0.40000000000000013,"phaseError":0.09999999999999987,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg7Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.29328657681858944,"phase":0,"expectedPhase":0.9000000000000001,"phaseError":0.09999999999999987,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg8Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.37328817196088987,"phase":0,"expectedPhase":0.6000000000000001,"phaseError":0.3999999999999999,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg8Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.33967217236835207,"phase":0.5,"expectedPhase":0.10000000000000009,"phaseError":0.3999999999999999,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg9Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.3545671665835796,"phase":0.5,"expectedPhase":0.8,"phaseError":0.30000000000000004,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg9Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.36755270123280653,"phase":0,"expectedPhase":0.2999999999999998,"phaseError":0.2999999999999998,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg10Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.37462948556752634,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":false},{"id":"leg10Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.4061596775377186,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":false},{"id":"leg11Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.3994583311523636,"phase":0.5,"expectedPhase":0.20000000000000018,"phaseError":0.2999999999999998,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg11Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.430639932565647,"phase":0,"expectedPhase":0.7000000000000002,"phaseError":0.2999999999999998,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg12Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.40625006094127253,"phase":0,"expectedPhase":0.40000000000000036,"phaseError":0.40000000000000036,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg12Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.4195258142159023,"phase":0.5,"expectedPhase":0.9000000000000004,"phaseError":0.40000000000000036,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg13Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.3784421073356187,"phase":0.5,"expectedPhase":0.6000000000000001,"phaseError":0.10000000000000009,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"leg13Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.42880201527754624,"phase":0,"expectedPhase":0.10000000000000009,"phaseError":0.10000000000000009,"dutyPass":false,"phasePass":false,"liftPass":false}]} |
| centipede | approach:crawl | head-stabilization | PASS | {"rmsDegrees":0,"rmsHeightBodyLengths":0.0009347158042696555} |
| centipede | approach:crawl | strike-extension-speed | N/A | "not serpent strike" |
| centipede | approach:crawl | authored-rest-start | PASS | {"zero":true} |
| centipede | approach:crawl | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | melee:mandible | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.27766404284883295} |
| centipede | melee:mandible | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | melee:mandible | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | melee:mandible | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | melee:mandible | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | melee:mandible | strike-extension-speed | N/A | "not serpent strike" |
| centipede | melee:mandible | authored-rest-start | PASS | {"zero":true} |
| centipede | melee:mandible | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | melee:body | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.10412401606831237} |
| centipede | melee:body | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | melee:body | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | melee:body | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | melee:body | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | melee:body | strike-extension-speed | N/A | "not serpent strike" |
| centipede | melee:body | authored-rest-start | PASS | {"zero":true} |
| centipede | melee:body | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2443210964116876} |
| centipede | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | cast | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | cast | strike-extension-speed | N/A | "not serpent strike" |
| centipede | cast | authored-rest-start | PASS | {"zero":true} |
| centipede | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490207747466966} |
| centipede | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | hit | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | hit | strike-extension-speed | N/A | "not serpent strike" |
| centipede | hit | authored-rest-start | PASS | {"zero":true} |
| centipede | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3141374487433294} |
| centipede | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | dodge | strike-extension-speed | N/A | "not serpent strike" |
| centipede | dodge | authored-rest-start | PASS | {"zero":true} |
| centipede | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.523580745337431} |
| centipede | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | faint | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | faint | strike-extension-speed | N/A | "not serpent strike" |
| centipede | faint | authored-rest-start | PASS | {"zero":true} |
| centipede | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2164198778205047} |
| centipede | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | victory | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | victory | strike-extension-speed | N/A | "not serpent strike" |
| centipede | victory | authored-rest-start | PASS | {"zero":true} |
| centipede | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2443352354527493} |
| centipede | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | tame | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | tame | strike-extension-speed | N/A | "not serpent strike" |
| centipede | tame | authored-rest-start | PASS | {"zero":true} |
| centipede | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| centipede | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3141592653589793} |
| centipede | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| centipede | feed | travelling-wave | N/A | "not a chain locomotion action" |
| centipede | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| centipede | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| centipede | feed | strike-extension-speed | N/A | "not serpent strike" |
| centipede | feed | authored-rest-start | PASS | {"zero":true} |
| centipede | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.08377043181059184} |
| civet | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | idle | travelling-wave | N/A | "not a chain locomotion action" |
| civet | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | idle | strike-extension-speed | N/A | "not serpent strike" |
| civet | idle | authored-rest-start | FAIL | {"zero":false} |
| civet | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0} |
| civet | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | alert | travelling-wave | N/A | "not a chain locomotion action" |
| civet | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | alert | strike-extension-speed | N/A | "not serpent strike" |
| civet | alert | authored-rest-start | PASS | {"zero":true} |
| civet | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | approach:walk | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.30731058608142087} |
| civet | approach:walk | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | approach:walk | travelling-wave | N/A | "not a chain locomotion action" |
| civet | approach:walk | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"hindFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.00028147308233021396,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":false},{"id":"foreFar","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.6070025728267137,"phase":0.5,"expectedPhase":0.25,"phaseError":0.25,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"hindNear","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.33351046147638513,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":false},{"id":"foreNear","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.00012893018255614829,"phase":0,"expectedPhase":0.75,"phaseError":0.25,"dutyPass":false,"phasePass":false,"liftPass":false}]} |
| civet | approach:walk | head-stabilization | PASS | {"rmsDegrees":0,"rmsHeightBodyLengths":0.0016849540761060596} |
| civet | approach:walk | strike-extension-speed | N/A | "not serpent strike" |
| civet | approach:walk | authored-rest-start | PASS | {"zero":true} |
| civet | approach:walk | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | approach:trot | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4438930687842746} |
| civet | approach:trot | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | approach:trot | travelling-wave | N/A | "not a chain locomotion action" |
| civet | approach:trot | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"hindFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.003015047368372663,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":false},{"id":"foreFar","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":1.2544459877321623,"phase":0.5,"expectedPhase":0.25,"phaseError":0.25,"dutyPass":true,"phasePass":false,"liftPass":false},{"id":"hindNear","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.405942198705161,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":false},{"id":"foreNear","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.00016011616712703535,"phase":0,"expectedPhase":0.75,"phaseError":0.25,"dutyPass":true,"phasePass":false,"liftPass":false}]} |
| civet | approach:trot | head-stabilization | PASS | {"rmsDegrees":2.6661450997557345,"rmsHeightBodyLengths":0.022989004159686077} |
| civet | approach:trot | strike-extension-speed | N/A | "not serpent strike" |
| civet | approach:trot | authored-rest-start | PASS | {"zero":true} |
| civet | approach:trot | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | approach:gallop | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5450575649984597} |
| civet | approach:gallop | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | approach:gallop | travelling-wave | N/A | "not a chain locomotion action" |
| civet | approach:gallop | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"hindFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.003088574672765926,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":false},{"id":"foreFar","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":4.417994964436932,"phase":0.5,"expectedPhase":0.25,"phaseError":0.25,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"hindNear","duty":0.7458333333333333,"touchdown":null,"touchdowns":3,"peakLift":0.03771108815447007,"phase":null,"expectedPhase":0.5,"phaseError":null,"dutyPass":false,"phasePass":false,"liftPass":true},{"id":"foreNear","duty":0.25416666666666665,"touchdown":null,"touchdowns":3,"peakLift":1.878259388745187,"phase":null,"expectedPhase":0.75,"phaseError":null,"dutyPass":false,"phasePass":false,"liftPass":false}]} |
| civet | approach:gallop | head-stabilization | FAIL | {"rmsDegrees":13.049916566565646,"rmsHeightBodyLengths":0.17717101394785345} |
| civet | approach:gallop | strike-extension-speed | N/A | "not serpent strike" |
| civet | approach:gallop | authored-rest-start | PASS | {"zero":true} |
| civet | approach:gallop | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | approach:hop | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6130750175158127} |
| civet | approach:hop | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | approach:hop | travelling-wave | N/A | "not a chain locomotion action" |
| civet | approach:hop | footfall-duty-lift | N/A | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| civet | approach:hop | head-stabilization | FAIL | {"rmsDegrees":6.504125031629114,"rmsHeightBodyLengths":0.129150214822132} |
| civet | approach:hop | strike-extension-speed | N/A | "not serpent strike" |
| civet | approach:hop | authored-rest-start | PASS | {"zero":true} |
| civet | approach:hop | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | melee:bite | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5133824596192086} |
| civet | melee:bite | contact-owner | FAIL | {"refusals":18,"first":{"ms":153.18333333333334,"error":"Error: Contact: melee:bite@153.18333333333334 exceeds scale compression bound"}} |
| civet | melee:bite | travelling-wave | N/A | "not a chain locomotion action" |
| civet | melee:bite | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | melee:bite | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | melee:bite | strike-extension-speed | N/A | "not serpent strike" |
| civet | melee:bite | authored-rest-start | PASS | {"zero":true} |
| civet | melee:bite | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | melee:claw | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6272628142429159} |
| civet | melee:claw | contact-owner | FAIL | {"refusals":18,"first":{"ms":153.18333333333334,"error":"Error: Contact: melee:claw@153.18333333333334 exceeds scale compression bound"}} |
| civet | melee:claw | travelling-wave | N/A | "not a chain locomotion action" |
| civet | melee:claw | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | melee:claw | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | melee:claw | strike-extension-speed | N/A | "not serpent strike" |
| civet | melee:claw | authored-rest-start | PASS | {"zero":true} |
| civet | melee:claw | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | melee:gore | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5133824596192086} |
| civet | melee:gore | contact-owner | FAIL | {"refusals":18,"first":{"ms":153.18333333333334,"error":"Error: Contact: melee:gore@153.18333333333334 exceeds scale compression bound"}} |
| civet | melee:gore | travelling-wave | N/A | "not a chain locomotion action" |
| civet | melee:gore | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | melee:gore | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | melee:gore | strike-extension-speed | N/A | "not serpent strike" |
| civet | melee:gore | authored-rest-start | PASS | {"zero":true} |
| civet | melee:gore | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | melee:tail | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6981317007977318} |
| civet | melee:tail | contact-owner | FAIL | {"refusals":18,"first":{"ms":157.11111111111111,"error":"Error: Contact: melee:tail@157.11111111111111 exceeds scale compression bound"}} |
| civet | melee:tail | travelling-wave | N/A | "not a chain locomotion action" |
| civet | melee:tail | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | melee:tail | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | melee:tail | strike-extension-speed | N/A | "not serpent strike" |
| civet | melee:tail | authored-rest-start | PASS | {"zero":true} |
| civet | melee:tail | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | melee:headbutt | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5133824596192086} |
| civet | melee:headbutt | contact-owner | FAIL | {"refusals":18,"first":{"ms":153.18333333333334,"error":"Error: Contact: melee:headbutt@153.18333333333334 exceeds scale compression bound"}} |
| civet | melee:headbutt | travelling-wave | N/A | "not a chain locomotion action" |
| civet | melee:headbutt | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | melee:headbutt | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | melee:headbutt | strike-extension-speed | N/A | "not serpent strike" |
| civet | melee:headbutt | authored-rest-start | PASS | {"zero":true} |
| civet | melee:headbutt | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4362628307264216} |
| civet | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | cast | travelling-wave | N/A | "not a chain locomotion action" |
| civet | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | cast | strike-extension-speed | N/A | "not serpent strike" |
| civet | cast | authored-rest-start | PASS | {"zero":true} |
| civet | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3140809031063711} |
| civet | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | hit | travelling-wave | N/A | "not a chain locomotion action" |
| civet | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | hit | strike-extension-speed | N/A | "not serpent strike" |
| civet | hit | authored-rest-start | PASS | {"zero":true} |
| civet | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.24045935612608738} |
| civet | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| civet | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | dodge | strike-extension-speed | N/A | "not serpent strike" |
| civet | dodge | authored-rest-start | PASS | {"zero":true} |
| civet | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.0471975511965976} |
| civet | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | faint | travelling-wave | N/A | "not a chain locomotion action" |
| civet | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | faint | strike-extension-speed | N/A | "not serpent strike" |
| civet | faint | authored-rest-start | PASS | {"zero":true} |
| civet | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.24434609527920614} |
| civet | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | victory | travelling-wave | N/A | "not a chain locomotion action" |
| civet | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | victory | strike-extension-speed | N/A | "not serpent strike" |
| civet | victory | authored-rest-start | PASS | {"zero":true} |
| civet | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.34889143825769775} |
| civet | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | tame | travelling-wave | N/A | "not a chain locomotion action" |
| civet | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | tame | strike-extension-speed | N/A | "not serpent strike" |
| civet | tame | authored-rest-start | PASS | {"zero":true} |
| civet | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4363323129985824} |
| civet | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | feed | travelling-wave | N/A | "not a chain locomotion action" |
| civet | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | feed | strike-extension-speed | N/A | "not serpent strike" |
| civet | feed | authored-rest-start | PASS | {"zero":true} |
| civet | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| civet | melee:kick | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6616713285067441} |
| civet | melee:kick | contact-owner | PASS | {"refusals":0,"first":null} |
| civet | melee:kick | travelling-wave | N/A | "not a chain locomotion action" |
| civet | melee:kick | footfall-duty-lift | N/A | "not cyclic walking" |
| civet | melee:kick | head-stabilization | N/A | "not locomotion or no head joint" |
| civet | melee:kick | strike-extension-speed | N/A | "not serpent strike" |
| civet | melee:kick | authored-rest-start | PASS | {"zero":true} |
| civet | melee:kick | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.017453292519943295} |
| bear | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | idle | travelling-wave | N/A | "not a chain locomotion action" |
| bear | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | idle | strike-extension-speed | N/A | "not serpent strike" |
| bear | idle | authored-rest-start | PASS | {"zero":true} |
| bear | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0} |
| bear | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | alert | travelling-wave | N/A | "not a chain locomotion action" |
| bear | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | alert | strike-extension-speed | N/A | "not serpent strike" |
| bear | alert | authored-rest-start | PASS | {"zero":true} |
| bear | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | approach:walk | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3141439538661657} |
| bear | approach:walk | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | approach:walk | travelling-wave | N/A | "not a chain locomotion action" |
| bear | approach:walk | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"hindFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.005881852982076598,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":false},{"id":"foreFar","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.4389408220466097,"phase":0.5,"expectedPhase":0.25,"phaseError":0.25,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"hindNear","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.4160258065565175,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":false},{"id":"foreNear","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.13222196058764768,"phase":0,"expectedPhase":0.75,"phaseError":0.25,"dutyPass":false,"phasePass":false,"liftPass":true}]} |
| bear | approach:walk | head-stabilization | PASS | {"rmsDegrees":0,"rmsHeightBodyLengths":0.00210195091575588} |
| bear | approach:walk | strike-extension-speed | N/A | "not serpent strike" |
| bear | approach:walk | authored-rest-start | PASS | {"zero":true} |
| bear | approach:walk | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | approach:trot | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.453763488917795} |
| bear | approach:trot | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | approach:trot | travelling-wave | N/A | "not a chain locomotion action" |
| bear | approach:trot | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"hindFar","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.0004960316623238894,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":false},{"id":"foreFar","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.863675967042284,"phase":0.5,"expectedPhase":0.25,"phaseError":0.25,"dutyPass":true,"phasePass":false,"liftPass":false},{"id":"hindNear","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.6034299326691793,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":false},{"id":"foreNear","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.2691349442441753,"phase":0,"expectedPhase":0.75,"phaseError":0.25,"dutyPass":true,"phasePass":false,"liftPass":false}]} |
| bear | approach:trot | head-stabilization | PASS | {"rmsDegrees":3.278767920617603,"rmsHeightBodyLengths":0.03554321220665364} |
| bear | approach:trot | strike-extension-speed | N/A | "not serpent strike" |
| bear | approach:trot | authored-rest-start | PASS | {"zero":true} |
| bear | approach:trot | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | approach:gallop | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5934050830909452} |
| bear | approach:gallop | contact-owner | FAIL | {"refusals":14,"first":{"ms":180.26666666666668,"error":"Error: Contact: approach:gallop@180.26666666666668 exceeds scale compression bound"}} |
| bear | approach:gallop | travelling-wave | N/A | "not a chain locomotion action" |
| bear | approach:gallop | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"hindFar","duty":0.5666666666666667,"touchdown":null,"touchdowns":3,"peakLift":0.7740794761166885,"phase":null,"expectedPhase":0,"phaseError":null,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"foreFar","duty":0.375,"touchdown":0.625,"touchdowns":1,"peakLift":2.3419034964813115,"phase":null,"expectedPhase":0.25,"phaseError":null,"dutyPass":false,"phasePass":false,"liftPass":false},{"id":"hindNear","duty":0.6916666666666667,"touchdown":null,"touchdowns":4,"peakLift":0.8998687207954246,"phase":null,"expectedPhase":0.5,"phaseError":null,"dutyPass":true,"phasePass":false,"liftPass":false},{"id":"foreNear","duty":0.25,"touchdown":null,"touchdowns":2,"peakLift":1.2307670527352992,"phase":null,"expectedPhase":0.75,"phaseError":null,"dutyPass":false,"phasePass":false,"liftPass":false}]} |
| bear | approach:gallop | head-stabilization | FAIL | {"rmsDegrees":16.04605223926669,"rmsHeightBodyLengths":0.23415509524112255} |
| bear | approach:gallop | strike-extension-speed | N/A | "not serpent strike" |
| bear | approach:gallop | authored-rest-start | PASS | {"zero":true} |
| bear | approach:gallop | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | approach:hop | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6219234727860886} |
| bear | approach:hop | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | approach:hop | travelling-wave | N/A | "not a chain locomotion action" |
| bear | approach:hop | footfall-duty-lift | N/A | "No eligible walking foot contacts; tube-foot/sucker coordination cannot be inferred." |
| bear | approach:hop | head-stabilization | FAIL | {"rmsDegrees":7.225728474270855,"rmsHeightBodyLengths":0.16336419436498828} |
| bear | approach:hop | strike-extension-speed | N/A | "not serpent strike" |
| bear | approach:hop | authored-rest-start | PASS | {"zero":true} |
| bear | approach:hop | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | melee:bite | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5235987755982988} |
| bear | melee:bite | contact-owner | FAIL | {"refusals":39,"first":{"ms":162.06666666666666,"error":"Error: Contact: melee:bite@162.06666666666666 exceeds scale compression bound"}} |
| bear | melee:bite | travelling-wave | N/A | "not a chain locomotion action" |
| bear | melee:bite | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | melee:bite | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | melee:bite | strike-extension-speed | N/A | "not serpent strike" |
| bear | melee:bite | authored-rest-start | PASS | {"zero":true} |
| bear | melee:bite | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | melee:claw | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.674783229055874} |
| bear | melee:claw | contact-owner | FAIL | {"refusals":39,"first":{"ms":162.06666666666666,"error":"Error: Contact: melee:claw@162.06666666666666 exceeds scale compression bound"}} |
| bear | melee:claw | travelling-wave | N/A | "not a chain locomotion action" |
| bear | melee:claw | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | melee:claw | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | melee:claw | strike-extension-speed | N/A | "not serpent strike" |
| bear | melee:claw | authored-rest-start | PASS | {"zero":true} |
| bear | melee:claw | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | melee:gore | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5235987755982988} |
| bear | melee:gore | contact-owner | FAIL | {"refusals":39,"first":{"ms":162.06666666666666,"error":"Error: Contact: melee:gore@162.06666666666666 exceeds scale compression bound"}} |
| bear | melee:gore | travelling-wave | N/A | "not a chain locomotion action" |
| bear | melee:gore | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | melee:gore | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | melee:gore | strike-extension-speed | N/A | "not serpent strike" |
| bear | melee:gore | authored-rest-start | PASS | {"zero":true} |
| bear | melee:gore | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | melee:tail | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5235987755982988} |
| bear | melee:tail | contact-owner | FAIL | {"refusals":36,"first":{"ms":174.77777777777777,"error":"Error: Contact: melee:tail@174.77777777777777 exceeds scale compression bound"}} |
| bear | melee:tail | travelling-wave | N/A | "not a chain locomotion action" |
| bear | melee:tail | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | melee:tail | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | melee:tail | strike-extension-speed | N/A | "not serpent strike" |
| bear | melee:tail | authored-rest-start | PASS | {"zero":true} |
| bear | melee:tail | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | melee:headbutt | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.5235987755982988} |
| bear | melee:headbutt | contact-owner | FAIL | {"refusals":39,"first":{"ms":162.06666666666666,"error":"Error: Contact: melee:headbutt@162.06666666666666 exceeds scale compression bound"}} |
| bear | melee:headbutt | travelling-wave | N/A | "not a chain locomotion action" |
| bear | melee:headbutt | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | melee:headbutt | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | melee:headbutt | strike-extension-speed | N/A | "not serpent strike" |
| bear | melee:headbutt | authored-rest-start | PASS | {"zero":true} |
| bear | melee:headbutt | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.43632649523440903} |
| bear | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | cast | travelling-wave | N/A | "not a chain locomotion action" |
| bear | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | cast | strike-extension-speed | N/A | "not serpent strike" |
| bear | cast | authored-rest-start | PASS | {"zero":true} |
| bear | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3140938760190495} |
| bear | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | hit | travelling-wave | N/A | "not a chain locomotion action" |
| bear | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | hit | strike-extension-speed | N/A | "not serpent strike" |
| bear | hit | authored-rest-start | PASS | {"zero":true} |
| bear | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.2617508862304684} |
| bear | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| bear | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | dodge | strike-extension-speed | N/A | "not serpent strike" |
| bear | dodge | authored-rest-start | PASS | {"zero":true} |
| bear | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.0471975511965976} |
| bear | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | faint | travelling-wave | N/A | "not a chain locomotion action" |
| bear | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | faint | strike-extension-speed | N/A | "not serpent strike" |
| bear | faint | authored-rest-start | PASS | {"zero":true} |
| bear | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.24434609527920614} |
| bear | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | victory | travelling-wave | N/A | "not a chain locomotion action" |
| bear | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | victory | strike-extension-speed | N/A | "not serpent strike" |
| bear | victory | authored-rest-start | PASS | {"zero":true} |
| bear | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.3490602653452595} |
| bear | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | tame | travelling-wave | N/A | "not a chain locomotion action" |
| bear | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | tame | strike-extension-speed | N/A | "not serpent strike" |
| bear | tame | authored-rest-start | PASS | {"zero":true} |
| bear | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.4363323129985824} |
| bear | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | feed | travelling-wave | N/A | "not a chain locomotion action" |
| bear | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | feed | strike-extension-speed | N/A | "not serpent strike" |
| bear | feed | authored-rest-start | PASS | {"zero":true} |
| bear | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| bear | melee:kick | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.6612589286637941} |
| bear | melee:kick | contact-owner | PASS | {"refusals":0,"first":null} |
| bear | melee:kick | travelling-wave | N/A | "not a chain locomotion action" |
| bear | melee:kick | footfall-duty-lift | N/A | "not cyclic walking" |
| bear | melee:kick | head-stabilization | N/A | "not locomotion or no head joint" |
| bear | melee:kick | strike-extension-speed | N/A | "not serpent strike" |
| bear | melee:kick | authored-rest-start | PASS | {"zero":true} |
| bear | melee:kick | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.03403392041388943} |
| crab | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | idle | travelling-wave | N/A | "not a chain locomotion action" |
| crab | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | idle | strike-extension-speed | N/A | "not serpent strike" |
| crab | idle | authored-rest-start | PASS | {"zero":true} |
| crab | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.079412480965742} |
| crab | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | alert | travelling-wave | N/A | "not a chain locomotion action" |
| crab | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | alert | strike-extension-speed | N/A | "not serpent strike" |
| crab | alert | authored-rest-start | PASS | {"zero":true} |
| crab | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | approach:scuttle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| crab | approach:scuttle | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | approach:scuttle | travelling-wave | N/A | "not a chain locomotion action" |
| crab | approach:scuttle | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"leg0Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15002971449073227,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg0Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.1500295062918665,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14709334197000706,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15276811058883866,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.1520643919860305,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15066516937812455,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14725964250026918,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15319356086279476,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| crab | approach:scuttle | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | approach:scuttle | strike-extension-speed | N/A | "not serpent strike" |
| crab | approach:scuttle | authored-rest-start | PASS | {"zero":true} |
| crab | approach:scuttle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.15882477294386324} |
| crab | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | cast | travelling-wave | N/A | "not a chain locomotion action" |
| crab | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | cast | strike-extension-speed | N/A | "not serpent strike" |
| crab | cast | authored-rest-start | PASS | {"zero":true} |
| crab | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.11344640137963143} |
| crab | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | hit | travelling-wave | N/A | "not a chain locomotion action" |
| crab | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | hit | strike-extension-speed | N/A | "not serpent strike" |
| crab | hit | authored-rest-start | PASS | {"zero":true} |
| crab | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.09075712110370514} |
| crab | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| crab | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | dodge | strike-extension-speed | N/A | "not serpent strike" |
| crab | dodge | authored-rest-start | PASS | {"zero":true} |
| crab | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| crab | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | faint | travelling-wave | N/A | "not a chain locomotion action" |
| crab | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | faint | strike-extension-speed | N/A | "not serpent strike" |
| crab | faint | authored-rest-start | PASS | {"zero":true} |
| crab | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| crab | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | victory | travelling-wave | N/A | "not a chain locomotion action" |
| crab | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | victory | strike-extension-speed | N/A | "not serpent strike" |
| crab | victory | authored-rest-start | PASS | {"zero":true} |
| crab | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| crab | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | tame | travelling-wave | N/A | "not a chain locomotion action" |
| crab | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | tame | strike-extension-speed | N/A | "not serpent strike" |
| crab | tame | authored-rest-start | PASS | {"zero":true} |
| crab | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.06806784082777886} |
| crab | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | feed | travelling-wave | N/A | "not a chain locomotion action" |
| crab | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | feed | strike-extension-speed | N/A | "not serpent strike" |
| crab | feed | authored-rest-start | PASS | {"zero":true} |
| crab | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| crab | melee:pinch | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.0392777573584496} |
| crab | melee:pinch | contact-owner | PASS | {"refusals":0,"first":null} |
| crab | melee:pinch | travelling-wave | N/A | "not a chain locomotion action" |
| crab | melee:pinch | footfall-duty-lift | N/A | "not cyclic walking" |
| crab | melee:pinch | head-stabilization | N/A | "not locomotion or no head joint" |
| crab | melee:pinch | strike-extension-speed | N/A | "not serpent strike" |
| crab | melee:pinch | authored-rest-start | PASS | {"zero":true} |
| crab | melee:pinch | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.03403392041388943} |
| freshwater-crab | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | idle | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | idle | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | idle | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.079412480965742} |
| freshwater-crab | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | alert | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | alert | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | alert | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | approach:scuttle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| freshwater-crab | approach:scuttle | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | approach:scuttle | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | approach:scuttle | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"leg0Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.1499957206401645,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg0Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14997401510879133,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.1496813581094518,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.14851441864666182,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.149740330680207,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14893478609242297,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15253453998622843,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15196153916748645,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| freshwater-crab | approach:scuttle | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | approach:scuttle | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | approach:scuttle | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | approach:scuttle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.15882477294386324} |
| freshwater-crab | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | cast | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | cast | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | cast | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.11344640137963143} |
| freshwater-crab | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | hit | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | hit | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | hit | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.09075712110370514} |
| freshwater-crab | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | dodge | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | dodge | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| freshwater-crab | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | faint | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | faint | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | faint | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| freshwater-crab | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | victory | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | victory | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | victory | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| freshwater-crab | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | tame | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | tame | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | tame | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.06806784082777886} |
| freshwater-crab | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | feed | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | feed | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | feed | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| freshwater-crab | melee:pinch | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.07617914074525554} |
| freshwater-crab | melee:pinch | contact-owner | PASS | {"refusals":0,"first":null} |
| freshwater-crab | melee:pinch | travelling-wave | N/A | "not a chain locomotion action" |
| freshwater-crab | melee:pinch | footfall-duty-lift | N/A | "not cyclic walking" |
| freshwater-crab | melee:pinch | head-stabilization | N/A | "not locomotion or no head joint" |
| freshwater-crab | melee:pinch | strike-extension-speed | N/A | "not serpent strike" |
| freshwater-crab | melee:pinch | authored-rest-start | PASS | {"zero":true} |
| freshwater-crab | melee:pinch | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.03403392041388943} |
| coconut-crab | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | idle | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | idle | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | idle | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.079412480965742} |
| coconut-crab | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | alert | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | alert | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | alert | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | approach:scuttle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| coconut-crab | approach:scuttle | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | approach:scuttle | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | approach:scuttle | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"leg0Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15005367732549998,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg0Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15055351025371289,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15015470954534804,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15263994445705975,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15186481050629905,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15186481050630016,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15324397450644187,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15337414111885492,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| coconut-crab | approach:scuttle | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | approach:scuttle | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | approach:scuttle | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | approach:scuttle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.15882477294386324} |
| coconut-crab | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | cast | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | cast | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | cast | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.11344640137963143} |
| coconut-crab | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | hit | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | hit | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | hit | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.09075712110370514} |
| coconut-crab | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | dodge | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | dodge | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| coconut-crab | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | faint | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | faint | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | faint | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| coconut-crab | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | victory | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | victory | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | victory | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| coconut-crab | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | tame | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | tame | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | tame | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.06806784082777886} |
| coconut-crab | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | feed | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | feed | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | feed | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| coconut-crab | melee:pinch | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.039277757358449815} |
| coconut-crab | melee:pinch | contact-owner | PASS | {"refusals":0,"first":null} |
| coconut-crab | melee:pinch | travelling-wave | N/A | "not a chain locomotion action" |
| coconut-crab | melee:pinch | footfall-duty-lift | N/A | "not cyclic walking" |
| coconut-crab | melee:pinch | head-stabilization | N/A | "not locomotion or no head joint" |
| coconut-crab | melee:pinch | strike-extension-speed | N/A | "not serpent strike" |
| coconut-crab | melee:pinch | authored-rest-start | PASS | {"zero":true} |
| coconut-crab | melee:pinch | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.03403392041388943} |
| vent-crab | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | idle | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | idle | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | idle | authored-rest-start | PASS | {"zero":true} |
| vent-crab | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.079412480965742} |
| vent-crab | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | alert | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | alert | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | alert | authored-rest-start | PASS | {"zero":true} |
| vent-crab | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | approach:scuttle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| vent-crab | approach:scuttle | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | approach:scuttle | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | approach:scuttle | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"leg0Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.1487482618530927,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg0Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.15088989619784762,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.1553230958864107,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.15445663864278444,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.1510323022423348,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14967698410822303,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14701059626178625,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.1517233056469442,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| vent-crab | approach:scuttle | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | approach:scuttle | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | approach:scuttle | authored-rest-start | PASS | {"zero":true} |
| vent-crab | approach:scuttle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.15882477294386324} |
| vent-crab | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | cast | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | cast | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | cast | authored-rest-start | PASS | {"zero":true} |
| vent-crab | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.11344640137963143} |
| vent-crab | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | hit | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | hit | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | hit | authored-rest-start | PASS | {"zero":true} |
| vent-crab | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.09075712110370514} |
| vent-crab | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | dodge | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | dodge | authored-rest-start | PASS | {"zero":true} |
| vent-crab | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| vent-crab | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | faint | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | faint | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | faint | authored-rest-start | PASS | {"zero":true} |
| vent-crab | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| vent-crab | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | victory | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | victory | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | victory | authored-rest-start | PASS | {"zero":true} |
| vent-crab | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| vent-crab | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | tame | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | tame | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | tame | authored-rest-start | PASS | {"zero":true} |
| vent-crab | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.06806784082777886} |
| vent-crab | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | feed | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | feed | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | feed | authored-rest-start | PASS | {"zero":true} |
| vent-crab | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| vent-crab | melee:pinch | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.07617914074525572} |
| vent-crab | melee:pinch | contact-owner | PASS | {"refusals":0,"first":null} |
| vent-crab | melee:pinch | travelling-wave | N/A | "not a chain locomotion action" |
| vent-crab | melee:pinch | footfall-duty-lift | N/A | "not cyclic walking" |
| vent-crab | melee:pinch | head-stabilization | N/A | "not locomotion or no head joint" |
| vent-crab | melee:pinch | strike-extension-speed | N/A | "not serpent strike" |
| vent-crab | melee:pinch | authored-rest-start | PASS | {"zero":true} |
| vent-crab | melee:pinch | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | idle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.03403392041388943} |
| mud-crab | idle | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | idle | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | idle | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | idle | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | idle | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | idle | authored-rest-start | PASS | {"zero":true} |
| mud-crab | idle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | alert | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.079412480965742} |
| mud-crab | alert | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | alert | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | alert | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | alert | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | alert | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | alert | authored-rest-start | PASS | {"zero":true} |
| mud-crab | alert | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | approach:scuttle | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| mud-crab | approach:scuttle | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | approach:scuttle | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | approach:scuttle | footfall-duty-lift | FAIL | {"status":"FAIL","rows":[{"id":"leg0Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.1502198209114381,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg0Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14986246823015806,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14939016707738434,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg1Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.14939016707738406,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Far","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.14949191900558798,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg2Near","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.14832806928408687,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Far","duty":0.5,"touchdown":0.5,"touchdowns":1,"peakLift":0.1491999267424899,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true},{"id":"leg3Near","duty":0.5,"touchdown":0,"touchdowns":1,"peakLift":0.14773597465376473,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":false,"phasePass":true,"liftPass":true}]} |
| mud-crab | approach:scuttle | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | approach:scuttle | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | approach:scuttle | authored-rest-start | PASS | {"zero":true} |
| mud-crab | approach:scuttle | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | cast | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.15882477294386324} |
| mud-crab | cast | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | cast | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | cast | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | cast | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | cast | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | cast | authored-rest-start | PASS | {"zero":true} |
| mud-crab | cast | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | hit | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.11344640137963143} |
| mud-crab | hit | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | hit | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | hit | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | hit | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | hit | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | hit | authored-rest-start | PASS | {"zero":true} |
| mud-crab | hit | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | dodge | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.09075712110370514} |
| mud-crab | dodge | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | dodge | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | dodge | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | dodge | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | dodge | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | dodge | authored-rest-start | PASS | {"zero":true} |
| mud-crab | dodge | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | faint | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| mud-crab | faint | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | faint | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | faint | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | faint | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | faint | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | faint | authored-rest-start | PASS | {"zero":true} |
| mud-crab | faint | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | victory | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.13613568165555773} |
| mud-crab | victory | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | victory | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | victory | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | victory | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | victory | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | victory | authored-rest-start | PASS | {"zero":true} |
| mud-crab | victory | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | tame | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.05672320068981571} |
| mud-crab | tame | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | tame | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | tame | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | tame | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | tame | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | tame | authored-rest-start | PASS | {"zero":true} |
| mud-crab | tame | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | feed | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.06806784082777886} |
| mud-crab | feed | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | feed | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | feed | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | feed | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | feed | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | feed | authored-rest-start | PASS | {"zero":true} |
| mud-crab | feed | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| mud-crab | melee:pinch | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.07617914074525549} |
| mud-crab | melee:pinch | contact-owner | PASS | {"refusals":0,"first":null} |
| mud-crab | melee:pinch | travelling-wave | N/A | "not a chain locomotion action" |
| mud-crab | melee:pinch | footfall-duty-lift | N/A | "not cyclic walking" |
| mud-crab | melee:pinch | head-stabilization | N/A | "not locomotion or no head joint" |
| mud-crab | melee:pinch | strike-extension-speed | N/A | "not serpent strike" |
| mud-crab | melee:pinch | authored-rest-start | PASS | {"zero":true} |
| mud-crab | melee:pinch | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
