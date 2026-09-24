# M0 — Motion anatomy specification

Source baseline: `236b9846c12c8a53a7e2fb06c27b4f24279e5169` (G). Nick accepted all thirteen archetype art selections; this run changes motion and tools, not painted masters. The full request is retained in REQUEST.md.

## Interpretation and units

Biological findings are sourced below. Every numeric tolerance below is a **prospective game-design target**, not a literature measurement or a re-seal. Body length L is the sum of ordered axial bone lengths for chain metrics; gait lift uses each lower limb length. No historical certificate is rebound. Existing .25 px contact checks, solver limits, signed-source authorities and S2 assets stay sealed. A failure requires a code fix or explicit blocked verdict.

Use 240 equal intervals per action, excluding the repeated endpoint for periodic statistics. Cross-correlate demeaned adjacent joint-angle series over a full cycle, unwrap toward tail, report signed lag, correlation and travelling/standing index; reject unidentified chains. Healthy travel requires median adjacent lag .04–.22 cycles, positive direction, correlation ≥.75, travel index ≥.6 and waveform amplitude above .1 degree. Wavelength .8–1.4 L is a design goal; report measured value separately. Fish tail/head curvature amplitude ratio ≥2; snake interior maximum/minimum ≤2.5. Root translation alone is not a travelling wave.

Path following is world-space segment-to-earlier-head-path RMS/L, with matched elapsed lag; target ≤.08, coverage ≥.8. Require actual stage displacement, sufficient prehistory and separate fluid/body-slip caveats: do not claim a stationary looping clip proves path following. Fish is a kinematic path-consistency diagnostic, not a no-slip snake model. Missing stage history is FAIL/UNMEASURABLE, never PASS. Changes to battle stage are a written request to Claude.

Contact duty is stance-sample fraction per foot, with cyclic touchdown phases relative to the first named foot. Phase tolerance .06 cycles; peak swing lift .03–.20 lower-leg lengths (±.01 numerical/sample margin), nonnegative with one smooth peak; stationary supported verbs require continuous support. Foot topology must be identified from contract, never inferred from paint. A contact-free sampler refuses footfall certification. Head stability for rhythmic gaits: RMS head orientation ≤12 degrees and head vertical RMS ≤.04 L, apart from documented hop/flight translation. Strike peak extension .33–.50 L (±.03), outbound 10–90% within .25 of action duration; report L/s and real milliseconds, no claim this is Python experimental biology.

All action rows also report actual amplitude, exact zero/rest start where specified, finite samples, limit violations and replay identity. End-rest is required for melee/hit/dodge/cast. Semantic anatomy requirements below must be reported as not instrumented when topology cannot express them; a generic finite-number pass cannot certify them. Paint/rest/contact/CPU acceptance comes from the existing static/native owners, not invented proxy measurements. Painted CPU ceiling3.5ms; Bear guardian5ms.

## Shared non-locomotor verbs

- **idle**: Low-amplitude breathing/sensory motion; no whole-body travel or stance loss.
- **alert**: Orient available sensory/head structures without invented appendages; retain support.
- **cast**: Explicit fantasy gesture, anatomically bounded; no claim of biological spell casting.
- **hit**: Short local recoil and settle; no break in articulation or persistent detachment.
- **dodge**: Brief retreat/lean using family support; airborne evasion only for jumping/flying/swimming anatomy.
- **faint**: Supported collapse, wings/limbs settle; no continuing gait or growing oscillation.
- **victory**: Family threat/display then settle; no implausible extra limbs.
- **tame**: Approach/relax/lower sensory end; no new support topology.
- **feed**: Bring mouth/feeding surface to food; jaw/beak/radula/central mouth appropriate to family; no human chewing for invertebrate radial bodies.

## Family references and offered verbs

### quadruped — Civet + Bear guardian

- Locomotion: Lateral sequence walk: hindNear 0, foreNear .25, hindFar .5, foreFar .75; trot diagonal pairs 0/.5; gallop sequential fore/hind beats, hop paired hind propulsion.
- Duty/phase target: walk .65±.08; trot .55±.08; gallop/hop flight is allowed. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: Civet follows feline proxy, Bear plantigrade feet; stable trunk and head, no insect tripod.
- Melee semantics: bite jaw; claw forepaw; gore/headbutt head with no invented horn; tail sweep only where tail exists; kick hindfoot.
- Every offered verb (source inventory): `idle`, `alert`, `approach:walk`, `approach:trot`, `approach:gallop`, `approach:hop`, `melee:bite`, `melee:claw`, `melee:gore`, `melee:tail`, `melee:headbutt`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`, `melee:kick`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: civet-proxy, bear.

### brachyuran — Crab, Freshwater Crab, Mud Crab, Vent Crab, Fiddler Crab

- Locomotion: Scuttle alternating four-leg support groups; contralateral mirror and alternating ipsilateral pairs.
- Duty/phase target:  .60±.08. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: Rigid carapace; lateral translation; no bending spine or claw as walking leg. Do not modify the freshwater reach seal.
- Melee semantics: pinch: open pincer then close; no whole-body jaw bite.
- Every offered verb (source inventory): `idle`, `alert`, `approach:scuttle`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`, `melee:pinch`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: crab.

### fish — Salmon

- Locomotion: Tailward travelling curvature; seven spine/caudal stations, wavelength .8–1.4 body lengths, amplitude grows to tail.
- Duty/phase target: not applicable: aquatic. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: Head anterior amplitude ≤.4 of tail amplitude; fins trim; no terrestrial stance or equal rigid tail swing.
- Melee semantics: bite jaw and short surge; body bump; tail slap while trunk counterbends.
- Every offered verb (source inventory): `idle`, `alert`, `approach:swim`, `melee:bite`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`, `melee:body`, `melee:tail`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: fish.

### biped-bird — Eagle

- Locomotion: Walk two legs 0/.5; flight bilateral downstroke/upstroke with flexible elbow/wrist.
- Duty/phase target: walk .65±.08; flight not contact duty. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: Head stabilized; wings are not terrestrial feet; no mammalian four-paw walk.
- Melee semantics: peck neck then beak; claw/kick projected talon with other support or aerial context.
- Every offered verb (source inventory): `idle`, `alert`, `approach:walk`, `approach:flight`, `melee:peck`, `melee:claw`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`, `melee:kick`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: bird.

### insect — Beetle

- Locomotion: Tripod FrontFar+MidNear+HindFar at 0; opposite tripod .5; walking stance longer than swing.
- Duty/phase target:  .65±.08. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: Rigid thorax; no tail, no flying from a folded-wing painted view.
- Melee semantics: mandible close at impact; body bump with retained rigid elytra.
- Every offered verb (source inventory): `idle`, `alert`, `approach:crawl`, `approach:flight`, `melee:mandible`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`, `melee:body`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: insect.

### serpent — Python

- Locomotion: Lateral undulation: tailward wave along seg0…seg7 plus tail, wavelength .8–1.4 body lengths; roughly level curvature-amplitude envelope. Head leads a world path.
- Duty/phase target: not applicable: continuous body support. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: No legs, no in-place sign-flipping S curve. Slow rectilinear requires belly-skin translation, unavailable in current bone rig: explicitly unsupported.
- Melee semantics: strike: neck S load, rapid .33–.50 contour-length head extension then recoil; constrict: coil with opposing curvature and sustained hold, no phantom grasping limbs.
- Every offered verb (source inventory): `idle`, `alert`, `approach:slither`, `melee:strike`, `melee:constrict`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: snake, snake-modes, strike.

### hopper — Tree Frog

- Locomotion: Bilateral hindlimb crouch→extension→flight→forelimb landing→recovery.
- Duty/phase target: hind launch phase ≤.35 cycle; recovery ≥.25. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: No alternating hindleg run in hop; no adult tail propulsion.
- Melee semantics: kick paired hindlimb extension; bite short head/jaw action, not a mammalian lunge.
- Every offered verb (source inventory): `idle`, `alert`, `approach:hop`, `melee:kick`, `melee:bite`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: frog.

### primate — Chimpanzee

- Locomotion: Knuckle walk: hindNear 0, armFar .25, hindFar .5, armNear .75 (chosen diagonal sequence); climb alternating reaches.
- Duty/phase target: walk .65±.08. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: Forehands bear support on knuckles; no invented tail; climb needs an external support, not suspended air walking.
- Melee semantics: punch arm extension then recovery; bite jaw/neck, not beak.
- Every offered verb (source inventory): `idle`, `alert`, `approach:walk`, `approach:climb`, `melee:punch`, `melee:bite`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: primate.

### radial — Starfish

- Locomotion: Tube-foot glide beneath a comparatively stable disc/arms. Existing drift/pulse verbs must not imply jellyfish propulsion.
- Duty/phase target: unmeasurable without tube-foot joints. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: No central vertebrate head; five arms are not five legs; no swimming by repetitive giant arm flaps.
- Melee semantics: sting-arms is anatomically unsupported for ordinary Starfish; body contact is a stylized bump only.
- Every offered verb (source inventory): `idle`, `alert`, `approach:drift`, `approach:pulse`, `melee:sting-arms`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`, `melee:body`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: starfish.

### arachnid — Tarantula

- Locomotion: Alternating tetrapods: legs 0Far/1Near/2Far/3Near at 0; complements .5.
- Duty/phase target:  .65±.08. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: Stable abdomen; no insect six-leg tripod, no scorpion tail in this source.
- Melee semantics: bite chelicerae; body threat/bump; sting is unavailable for Tarantula.
- Every offered verb (source inventory): `idle`, `alert`, `approach:scuttle`, `melee:sting`, `melee:bite`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`, `melee:body`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: arachnid.

### cephalopod — Octopus

- Locomotion: Crawl selects nonidentical supporting arms; extension/release without forcing all arms into a fixed alternating oscillator. Jet mantle/siphon stroke then glide.
- Duty/phase target: per-arm support observable only if actual sucker contacts exist. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: Arms are muscular hydrostats, not rigid legs. No fin-driven swimming on a finless Octopus.
- Melee semantics: lash arm extension; bite draws material toward central beak; no mammalian neck strike.
- Every offered verb (source inventory): `idle`, `alert`, `approach:jet`, `approach:crawl`, `melee:lash`, `melee:bite`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: octopus.

### flyer-membrane — Fruit Bat

- Locomotion: Flight bilateral wing stroke with elbow/wrist folding; crawl folded-wing forelimb support alternating with hindfeet.
- Duty/phase target: crawl .65±.08. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: No feather fan; membrane remains attached; do not transplant a vampire-bat bound into fruit bat anatomy.
- Melee semantics: bite jaw/head; claw hindfoot reach with retained wing support.
- Every offered verb (source inventory): `idle`, `alert`, `approach:flight`, `approach:crawl`, `melee:bite`, `melee:claw`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: bat.

### myriapod — Centipede

- Locomotion: Walking legs: metachronal phase .20 cycles per successive pair, opposite side .5 cycle offset; modest body undulation only at faster gait. Compact fixed trunk cannot acquire a fabricated body chain.
- Duty/phase target:  .65±.08. Swing lift follows the common arc target when walking contacts exist.
- Stabilization and prohibited anatomy: Ultimate pair sensory, excluded from walking support; no four-pair tetrapod masquerading as twenty-pair locomotion.
- Melee semantics: mandible head/forcipule threat and closure; body bump; no scorpion sting when tail absent.
- Every offered verb (source inventory): `idle`, `alert`, `approach:crawl`, `melee:mandible`, `melee:sting`, `cast`, `hit`, `dodge`, `faint`, `victory`, `tame`, `feed`, `melee:body`. Common verbs above are specialized by these anatomy restrictions. Count-dependent libraries must be inventoried again per actual record; no absent verb is fabricated.
- Reference IDs: centipede.

## Execution and real gates

Commit M0 first. M1 instruments immutable sampled evidence and retains positive/negative controls. Commit M2 baseline before product fixes. Then fix highest-severity measurable defects, record every refusal and continue independent animals. Do not alter local battle stage derivatives; record stageDisplacement/history or longer-beat requests for Claude. Accepted masters and bindings stay byte-identical. Do not hand-edit seals, including the two Claude hdart hashes: apply only where their actual corresponding committed bytes match. Portable record writers affect new records only; preserve old sample authorities.

Startup 2026-09-24: official check PASS; no eligible updates, REAPER suffix resolved by empty scoped brew outdated result; Node26.9.0 retained. No browser/render has run in M0. Signed commits are authorized; no push/PR/label/hosted run/merge/release/deploy. A signing refusal after one retry blocks commits only; continue non-commit work and retain the error.

## Sources (accessed 2026-09-24)

- **snake**: [Hu et al. 2009, The mechanics of slithering locomotion](https://pmc.ncbi.nlm.nih.gov/articles/PMC2700932/). Lateral undulation depends on body-wave propagation and directional ground friction; planar animation does not prove propulsion.
- **snake-modes**: [Jayne 2020, What Defines Different Modes of Snake Locomotion?](https://pmc.ncbi.nlm.nih.gov/articles/PMC7391877/). Distinguishes lateral undulation and rectilinear skin/muscle transport. A bone wave alone cannot certify rectilinear locomotion.
- **fish**: [Lauder et al., Undulatory locomotion of flexible foils](https://journals.biologists.com/jeb/article/217/12/2110/12094/Undulatory-locomotion-of-flexible-foils-as). Fish-like bending travels toward the tail with an increasing lateral envelope; mechanical foil experiments are a proxy, not Salmon species calibration.
- **centipede**: [Dynamics of centipede locomotion revealed by large-scale traction force microscopy](https://pmc.ncbi.nlm.nih.gov/articles/PMC11285478/). Measured travelling force waves along walking legs. Direction and wavelength depend on species and speed; do not assume all myriapods share a single gait.
- **insect**: [Climbing favours the tripod gait over alternative faster insect gaits](https://pmc.ncbi.nlm.nih.gov/articles/PMC5321742/). Tripod coordination supports stable climbing; walking duty exceeds one half. Beetle values below are game targets, not measurements from this study.
- **arachnid**: [Biomechanics of octopedal locomotion](https://journals.biologists.com/jeb/article/214/20/3433/10466/Biomechanics-of-octopedal-locomotion-kinematic-and). Slow spider displacement approximates alternating tetrapods with duty above one half; fast gaits vary.
- **frog**: [Take-off and landing forces in jumping frogs](https://journals.biologists.com/jeb/article/209/1/66/33403/Take-off-and-landing-forces-in-jumping-frogs). Landing and recovery occupy a substantial portion of the cycle. Hindlimb launch and forelimb landing are distinct.
- **primate**: [The biomechanics of knuckle-walking](https://journals.biologists.com/jeb/article/223/14/jeb224360/224550/The-biomechanics-of-knuckle-walking-3-D-kinematics). Chimpanzee hand/wrist mechanics are specialized; arm endpoints do not by themselves prove knuckle contact.
- **bear**: [Grizzly bear locomotion: gaits and ground reaction forces](https://journals.biologists.com/jeb/article/218/19/3102/14189/Grizzly-bear-Ursus-arctos-horribilis-locomotion). Slow walking uses a lateral sequence; do not call all bear gaits trots.
- **civet-proxy**: [Interspecific scaling of cat locomotion](https://journals.biologists.com/jeb/article/210/4/642/17244/Interspecific-scaling-of-the-morphology-and). Felids in this experiment used lateral sequence walking. This is an explicit quadruped proxy, not a Civet measurement.
- **bird**: [The role of passive avian head stabilization in flapping flight](https://pmc.ncbi.nlm.nih.gov/articles/PMC4614461/). Head motion can be attenuated relative to wingbeat/body oscillation; an Eagle-specific numerical calibration is not claimed.
- **bat**: [Megachiropteran bats profoundly unique in climbing and walking locomotion](https://pmc.ncbi.nlm.nih.gov/articles/PMC5619802/). Pteropodid terrestrial motion differs from microbat walking. Forelimbs remain wing-bearing; ordinary mammal paw gait is an inadequate substitute.
- **octopus**: [Arm Coordination in Octopus Crawling Involves Unique Motor Control Strategies](https://www.sciencedirect.com/science/article/pii/S0960982215002663). Octopus crawling uses flexible arm selection rather than a mandatory periodic tetrapod. Jetting and crawling are different modes.
- **starfish**: [Sea star inspired crawling and bouncing](https://pmc.ncbi.nlm.nih.gov/articles/PMC7014793/). Tube-foot locomotion is distinct from arm flapping. The model describes coordinated feet; missing tube feet cannot be certified by oscillating five arms.
- **crab**: [Martinez et al., Underwater punting by an intertidal crab](https://polypedal.berkeley.edu/publications/051_Martinez_UnderwaterPuntingbyanIntertidalCrab_JExpBiol_1998.pdf). Crab gait depends on substrate and immersion. Our land scuttle is a stylized alternating support gait; freshwater reach remains independently sealed.
- **strike**: [Rattlesnake Strike Behavior: Kinematics](https://journals.biologists.com/jeb/article/201/6/837/7851/Rattlesnake-Strike-Behavior-Kinematics). Strike recruitment and launch posture vary. The Python extension and timing bounds below are explicit game direction, not an inferred universal snake measurement.
