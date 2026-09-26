# Beetle fit04 — six exact first-refusal contact diagnoses

Run once with `node audits/ARCHETYPE_FINISH_20260923/04-insect/contact-diagnosis-01.mjs`. Source, input and instrumentation receipts are retained in `contact-diagnosis-01.sources.json`; full attempted poses, original contact traces and candidate traces are in `contact-diagnosis-01.json`. The original six error strings match `static-01.json` exactly. No full static row, skin/ARAP solve, browser, native film or CPU measurement was run.

`static-01.json.firstRefusal.pose` is the last pose sent to paint, so it is stale when contact throws first. This diagnostic captures the actual GSAP/performance attempted pose immediately before `contact.resolve`. The presentation schedule is exactly equal to the retained schedule; its first failure is at7283.333333333333ms overall, cast elapsed169.87155525634626ms.

## Measured failures and bounded analytical comparison

The unchanged compression cap is **35.03168851197441px** (8% of437.8961063996801px measured motion scale). All six observed supports are wholly endpoint-owned. The candidate is the existing owner's analytical rigid-support block, invoked directly from the authored root through two reversible temporary-bundle branch substitutions. Its reach, compression, joint-limit and final painted/endpoint measurements remain unchanged. The production source was never edited.

| Row | Sample ms | Original accommodation owner | Original first failure | Direct existing analytical block |
|---|---:|---|---|---|
| cast | 157.583333333333 | legFrontFar | 37.304024579710 px compression | 34.623041970311 px; valid contact-only |
| hit | 172.500000000000 | legFrontFar | legHindFarFoot −75.132546303065° | 25.676192966179 px; valid contact-only |
| dodge | 32.666666666667 | legFrontFar | 37.640591969241 px compression | 36.821559990391 px; still refuses compression |
| victory | 95.000000000000 | legFrontFar | 36.601660663217 px compression | 33.636705334216 px; valid contact-only |
| tame | 80.000000000000 | legHindFar | 36.128632158077 px compression | 28.199523426736 px; valid contact-only |
| presentation | 7283.333333333333 | legFrontFar | 44.576335873453 px compression | 42.033641219180 px; still refuses compression |

Four individual contact poses have a valid analytical solution under existing bounds. This does not qualify later samples or rendered paint. Dodge and the presentation cast remain genuine contact compression refusals; the diagnostic did not suppress them.

- **Cast:** the endpoint approximation requests37.30402457971041px accommodation from legFrontFar before applying its real support offset. Direct rigid support needs34.623041970311px, within the same35.03168851197441px cap. It retains all six contacts; maximum painted residual3.1130978281720806e−13px.
- **Hit:** legFrontFar controls global accommodation. Four endpoint passes accumulate26.39935705848142px; the resulting legHindFarFoot is−75.13254630306487°, below−75°. The exact rigid-support solution needs25.67619296617901px and yields−74.6769683314655° with maximum painted residual4.872768855079812e−13px. No angular limit was changed.
- **Victory:** first endpoint compression36.60166066321701px versus direct support33.63670533421613px; legFrontFar is the determining chain.
- **Tame:** legHindFar controls accommodation:36.12863215807679px endpoint versus28.199523426736413px direct support. Its observed support is11.5px right and1.5px down from the anatomical endpoint.
- **Dodge:** direct support still needs36.82155999039114px, exceeding the cap by1.78987147841673px. The attempted root moves−0.103475 body lengths horizontally and−0.01411 vertically while terrestrial contacts remain planted.
- **Presentation:** the later cast pose still needs42.03364121918035px, exceeding the cap by7.00195270720594px. Its attempted root isdx−0.017813/dy−0.035625 and thorax rotation−0.155444rad.

Every successful candidate independently retains six contacts, unchanged anatomical segment lengths (maximum normalized error below2e−16), endpoint error≤1e−8, painted residual≤0.25px, all12 leg joint rotations within current limits, and compression≤the unchanged cap. These are contact-only checks, not complete rig admission.

## Ownership and geometric interpretation

The existing analytical fallback occurs after `let measured=measure()` in `creature-rig-contact.ts`. Compression failures inside the endpoint iteration and a joint-limit failure in `measure()` therefore prevent it from being reached. The four valid candidate solutions demonstrate a specific fallback-placement defect for these endpoint-owned support poses; this is not evidence that limits need widening.

The remaining two poses show a real incompatibility between the current observed rest geometry, common-thorax two-bone contact model, and the existing root/thorax motion while all six terrestrial legs are planted. `legFrontFar` has upper173.09246084101983px/lower146.41379716406513px and only5.1656783784640465px straight-line outer reach slack. Its observed support offset is(+5.5,−11.5)px. `legHindFar` has upper409.7047717564442px/lower61.61168720299747px and3.1092398779755728px outer reach slack. The shared thorax is every leg's model hip; source landmarks are not separate anatomical leg attachments.

The painted master was inspected read-only. These values establish geometry sensitivity but do not by themselves prove an authoring mistake or authorize moving an observed knee/foot. A visual re-observation would need an independently defensible joint location. No landmark, contact stance, habitat, motion amplitude, numeric gate or threshold was changed by this diagnostic.

## Retention

All42 bundled source files were unchanged before/after; 41 match retained static source authorities and the remaining file is this diagnostic entry. All10 input hashes remained unchanged. The exact invertible hooks and branch substitutions are included in the source receipt. Rejected and passing contact-only candidate results are both retained. No accepted binding or S2 input changed.
