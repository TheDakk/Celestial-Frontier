# Motion anatomy measurements

Failures and unmeasured anatomy remain explicit. Numeric targets are prospective game-design choices, not re-sealed biological measurements.

| Rig | Action | Criterion | Verdict | Measurement / reason |
|---|---|---|---|---|
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
| eagle | approach:walk | footfall-duty-lift | PASS | {"status":"PASS","rows":[{"id":"legFar","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.17052209767463714,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"legNear","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.14641484944178068,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true}]} |
| eagle | approach:walk | head-stabilization | PASS | {"rmsDegrees":0.9911739138395721,"rmsHeightBodyLengths":0.007513372605464887} |
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
| eagle | melee:claw | contact-owner | FAIL | {"refusals":23,"first":{"ms":192.13333333333333,"error":"Error: Contact: melee:claw@192.13333333333333 exceeds scale compression bound"}} |
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
| beetle | approach:crawl | footfall-duty-lift | PASS | {"status":"PASS","rows":[{"id":"legFrontFar","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.14281004931724448,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"legFrontNear","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.14953767656073658,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"legMidFar","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.15860883716713026,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"legMidNear","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.15112302256443227,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"legHindFar","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.11923631838114437,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"legHindNear","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.14639099315261864,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true}]} |
| beetle | approach:crawl | head-stabilization | PASS | {"rmsDegrees":0.43211340143675797,"rmsHeightBodyLengths":0.0023893419838833373} |
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
| chimpanzee | approach:walk | footfall-duty-lift | PASS | {"status":"PASS","rows":[{"id":"legFar","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.14275657897965577,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"legNear","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.14173756193109072,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true}]} |
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
| tarantula | approach:scuttle | footfall-duty-lift | PASS | {"status":"PASS","rows":[{"id":"leg1Far","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.14969734373995924,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg1Near","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.16193137359387927,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg2Far","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.15513665841132807,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg2Near","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.14720116618580717,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg3Far","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.15458353144472206,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg3Near","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.16681838518721795,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg4Far","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.15008402104198695,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg4Near","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.1415821693738703,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true}]} |
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
| fruit-bat | approach:crawl | footfall-duty-lift | PASS | {"status":"PASS","rows":[{"id":"legFar","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.09784192686169765,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"legNear","duty":0.6541666666666667,"touchdown":0,"touchdowns":1,"peakLift":0.10886343664150856,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true}]} |
| fruit-bat | approach:crawl | head-stabilization | PASS | {"rmsDegrees":1.9267440301197971,"rmsHeightBodyLengths":0.03341448131215797} |
| fruit-bat | approach:crawl | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | approach:crawl | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | approach:crawl | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | melee:bite | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":0.9161512496398556} |
| fruit-bat | melee:bite | contact-owner | FAIL | {"refusals":39,"first":{"ms":165.24444444444444,"error":"Error: Contact: melee:bite@165.24444444444444 exceeds scale compression bound"}} |
| fruit-bat | melee:bite | travelling-wave | N/A | "not a chain locomotion action" |
| fruit-bat | melee:bite | footfall-duty-lift | N/A | "not cyclic walking" |
| fruit-bat | melee:bite | head-stabilization | N/A | "not locomotion or no head joint" |
| fruit-bat | melee:bite | strike-extension-speed | N/A | "not serpent strike" |
| fruit-bat | melee:bite | authored-rest-start | PASS | {"zero":true} |
| fruit-bat | melee:bite | anatomical-verb | UNMEASURED | "See SPEC family verb requirements; qualitative semantics require the paired film, not a finite-number proxy." |
| fruit-bat | melee:claw | finite-and-deterministic | PASS | {"samples":241,"replay":true,"maxAngleRad":1.0994108210992601} |
| fruit-bat | melee:claw | contact-owner | FAIL | {"refusals":43,"first":{"ms":162.06666666666666,"error":"Error: Contact: melee:claw@162.06666666666666 exceeds scale compression bound"}} |
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
| fruit-bat | dodge | contact-owner | FAIL | {"refusals":16,"first":{"ms":87.1,"error":"Error: Contact: joint limit legFarFoot dodge@87.1: -60.046986837534114"}} |
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
| fruit-bat | tame | contact-owner | FAIL | {"refusals":203,"first":{"ms":141.86666666666667,"error":"Error: Contact: tame@141.86666666666667 exceeds scale compression bound"}} |
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
| centipede | approach:crawl | footfall-duty-lift | PASS | {"status":"PASS","rows":[{"id":"leg0Far","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.1448407449602429,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg0Near","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.13178607012103033,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg1Far","duty":0.6541666666666667,"touchdown":0.2,"touchdowns":1,"peakLift":0.1468095215769519,"phase":0.19999999999999996,"expectedPhase":0.19999999999999996,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg1Near","duty":0.65,"touchdown":0.7,"touchdowns":1,"peakLift":0.16049862682551136,"phase":0.7,"expectedPhase":0.7,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg2Far","duty":0.6541666666666667,"touchdown":0.4,"touchdowns":1,"peakLift":0.14192047175146416,"phase":0.3999999999999999,"expectedPhase":0.3999999999999999,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg2Near","duty":0.65,"touchdown":0.9,"touchdowns":1,"peakLift":0.15620164362222685,"phase":0.8999999999999999,"expectedPhase":0.8999999999999999,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg3Far","duty":0.65,"touchdown":0.6041666666666666,"touchdowns":1,"peakLift":0.15615351729047153,"phase":0.6041666666666665,"expectedPhase":0.6000000000000001,"phaseError":0.00416666666666643,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg3Near","duty":0.65,"touchdown":0.10416666666666667,"touchdowns":1,"peakLift":0.15395171305292799,"phase":0.10416666666666674,"expectedPhase":0.10000000000000009,"phaseError":0.004166666666666652,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg4Far","duty":0.6541666666666667,"touchdown":0.8,"touchdowns":1,"peakLift":0.14428668690851157,"phase":0.8,"expectedPhase":0.8,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg4Near","duty":0.65,"touchdown":0.30416666666666664,"touchdowns":1,"peakLift":0.15088889886602375,"phase":0.3041666666666667,"expectedPhase":0.30000000000000004,"phaseError":0.004166666666666652,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg5Far","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.14641291213224736,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg5Near","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.15011442522954016,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg6Far","duty":0.65,"touchdown":0.20416666666666666,"touchdowns":1,"peakLift":0.15158763296039757,"phase":0.2041666666666666,"expectedPhase":0.20000000000000018,"phaseError":0.00416666666666643,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg6Near","duty":0.65,"touchdown":0.7041666666666667,"touchdowns":1,"peakLift":0.13346235993460304,"phase":0.7041666666666666,"expectedPhase":0.7000000000000002,"phaseError":0.00416666666666643,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg7Far","duty":0.65,"touchdown":0.4041666666666667,"touchdowns":1,"peakLift":0.14846962085948792,"phase":0.4041666666666668,"expectedPhase":0.40000000000000013,"phaseError":0.004166666666666652,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg7Near","duty":0.65,"touchdown":0.9041666666666667,"touchdowns":1,"peakLift":0.14405510080353104,"phase":0.9041666666666668,"expectedPhase":0.9000000000000001,"phaseError":0.004166666666666652,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg8Far","duty":0.65,"touchdown":0.6041666666666666,"touchdowns":1,"peakLift":0.15133639821183298,"phase":0.6041666666666665,"expectedPhase":0.6000000000000001,"phaseError":0.00416666666666643,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg8Near","duty":0.65,"touchdown":0.10416666666666667,"touchdowns":1,"peakLift":0.14892086034458737,"phase":0.10416666666666674,"expectedPhase":0.10000000000000009,"phaseError":0.004166666666666652,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg9Far","duty":0.6541666666666667,"touchdown":0.8,"touchdowns":1,"peakLift":0.1452008691344716,"phase":0.8,"expectedPhase":0.8,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg9Near","duty":0.65,"touchdown":0.3,"touchdowns":1,"peakLift":0.15150414777267746,"phase":0.30000000000000004,"expectedPhase":0.2999999999999998,"phaseError":2.220446049250313e-16,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg10Far","duty":0.65,"touchdown":0,"touchdowns":1,"peakLift":0.1533736361883061,"phase":0,"expectedPhase":0,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg10Near","duty":0.65,"touchdown":0.5,"touchdowns":1,"peakLift":0.1459706867707156,"phase":0.5,"expectedPhase":0.5,"phaseError":0,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg11Far","duty":0.65,"touchdown":0.20416666666666666,"touchdowns":1,"peakLift":0.14493637864680037,"phase":0.2041666666666666,"expectedPhase":0.20000000000000018,"phaseError":0.00416666666666643,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg11Near","duty":0.65,"touchdown":0.7041666666666667,"touchdowns":1,"peakLift":0.14906011571833755,"phase":0.7041666666666666,"expectedPhase":0.7000000000000002,"phaseError":0.00416666666666643,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg12Far","duty":0.65,"touchdown":0.4041666666666667,"touchdowns":1,"peakLift":0.1469889767671805,"phase":0.4041666666666668,"expectedPhase":0.40000000000000036,"phaseError":0.00416666666666643,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg12Near","duty":0.65,"touchdown":0.9041666666666667,"touchdowns":1,"peakLift":0.14827964624053366,"phase":0.9041666666666668,"expectedPhase":0.9000000000000004,"phaseError":0.00416666666666643,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg13Far","duty":0.65,"touchdown":0.6041666666666666,"touchdowns":1,"peakLift":0.14281505642007455,"phase":0.6041666666666665,"expectedPhase":0.6000000000000001,"phaseError":0.00416666666666643,"dutyPass":true,"phasePass":true,"liftPass":true},{"id":"leg13Near","duty":0.65,"touchdown":0.10416666666666667,"touchdowns":1,"peakLift":0.14980266111674528,"phase":0.10416666666666674,"expectedPhase":0.10000000000000009,"phaseError":0.004166666666666652,"dutyPass":true,"phasePass":true,"liftPass":true}]} |
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
